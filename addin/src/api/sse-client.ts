import type { ChatRequest, SseFrame } from './types';

// 前端只认 /api；Vite 代理转发到 BFF（CONTRACT 第 1 节）。
const API_BASE: string = import.meta.env.VITE_API_BASE ?? '/api';

export interface StreamHandlers {
  onToken(delta: string): void;
  onDone(finishReason: string): void;
  onError(message: string): void;
  // 停止按钮：调用方持有 controller，abort() 中断 fetch。
  signal?: AbortSignal;
}

/**
 * 解析单个 SSE 事件块（已按 `\n\n` 切出）为帧。
 * 仅取 `data:` 行的 JSON；其它字段（event/id 等）Phase 0 忽略。
 * 导出以便单测（无需起网络）。
 */
export function parseSseEvent(rawEvent: string): SseFrame | undefined {
  const dataLines: string[] = [];
  for (const line of rawEvent.split('\n')) {
    // SSE 规范：注释行以 ':' 开头，跳过。
    if (line.startsWith(':')) continue;
    if (line.startsWith('data:')) {
      // 去掉 'data:' 前缀及其后可选的单个空格。
      dataLines.push(line.slice(5).replace(/^ /, ''));
    }
  }
  if (dataLines.length === 0) return undefined;

  const payload = dataLines.join('\n').trim();
  if (payload.length === 0) return undefined;

  // 解析失败不应 crash 整条流，交由上层 onError 处理。
  const parsed: unknown = JSON.parse(payload);
  return narrowFrame(parsed);
}

// 把 unknown 收窄为 SseFrame；不符则抛错（上层捕获→onError）。
function narrowFrame(value: unknown): SseFrame {
  if (typeof value !== 'object' || value === null || !('type' in value)) {
    throw new Error('SSE 帧缺少 type 字段');
  }
  const obj = value as Record<string, unknown>;
  switch (obj['type']) {
    case 'token':
      if (typeof obj['delta'] === 'string') return { type: 'token', delta: obj['delta'] };
      break;
    case 'done':
      return {
        type: 'done',
        finishReason: typeof obj['finishReason'] === 'string' ? obj['finishReason'] : 'stop',
      };
    case 'error':
      return {
        type: 'error',
        message: typeof obj['message'] === 'string' ? obj['message'] : '未知错误',
      };
  }
  throw new Error('无法识别的 SSE 帧');
}

/**
 * POST /chat 流式（CONTRACT 第 3 节）。手动读 ReadableStream 按 `\n\n` 切帧，
 * 因请求体大且需自定义头，不用 EventSource（仅 GET）。
 */
export async function streamChat(req: ChatRequest, handlers: StreamHandlers): Promise<void> {
  // 开发期会话 token 从环境注入，禁止浏览器存储（架构铁律 7）。
  // 生产签发方式属 TODO（CLAUDE_1.md），补全前用占位。
  const token = import.meta.env.VITE_DEV_SESSION_TOKEN ?? '';

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(req),
      ...(handlers.signal ? { signal: handlers.signal } : {}),
    });
  } catch (err) {
    // fetch 本身被 abort 也会落到这里（请求尚未返回）。
    if (isAbortError(err)) {
      handlers.onDone('aborted');
      return;
    }
    handlers.onError(toMessage(err));
    return;
  }

  if (!response.ok || !response.body) {
    handlers.onError(`HTTP ${response.status}`);
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 按事件分隔符切；末段可能是半截帧，留在 buffer 等下次。
      let sep: number;
      while ((sep = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);

        const frame = parseSseEvent(rawEvent);
        if (!frame) continue;

        if (frame.type === 'token') {
          handlers.onToken(frame.delta);
        } else if (frame.type === 'done') {
          handlers.onDone(frame.finishReason);
          return; // done 是最后一帧
        } else {
          handlers.onError(frame.message);
          return; // error 终止流
        }
      }
    }
    // 流自然结束但没收到显式 done（如服务端直接关闭），按完成处理。
    handlers.onDone('eof');
  } catch (err) {
    if (isAbortError(err)) {
      // 停止按钮：优雅结束，不当作错误。
      handlers.onDone('aborted');
      return;
    }
    handlers.onError(toMessage(err));
  } finally {
    // 中止后释放底层资源；abort 已使 read 抛错，这里兜底取消。
    void reader.cancel().catch(() => {});
  }
}

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
