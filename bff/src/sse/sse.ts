import type { Response } from 'express';

// SSE 帧的判别联合，严格对齐 CONTRACT §3。
export type SseFrame =
  | { readonly type: 'token'; readonly delta: string }
  | { readonly type: 'done'; readonly finishReason: 'stop' }
  | { readonly type: 'error'; readonly message: string };

// 严格输出契约帧格式：每帧 `data: <json>\n\n`。
// 集中在此，避免各处手拼字符串导致格式漂移。
export function writeSse(res: Response, frame: SseFrame): void {
  res.write(`data: ${JSON.stringify(frame)}\n\n`);
}

export const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  // 关闭反向代理（如 Nginx）的响应缓冲，确保逐帧实时下发。
  'X-Accel-Buffering': 'no',
} as const;
