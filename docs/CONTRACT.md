# 前后端契约（CONTRACT）

> 单一事实来源。`addin/`（前端）与 `bff/`（后端）都必须以本文件为准。
> 改契约时改这里，再同步两端实现。Phase 0 只用到 `/health` 与 `/chat`（SSE）。

## 1. 传输与鉴权

- 基址：开发期前端通过 Vite 代理 `/api/*` → BFF（`http://localhost:3000`）。生产期同源或正确 CORS。
- 鉴权：所有受保护接口需 `Authorization: Bearer <sessionToken>`。
  - **模型 API key 永不下发前端**（架构铁律 2）。前端只持短期会话 token。
  - 开发期：BFF 读环境变量 `AUTH_DISABLED=true` 时放行；或校验静态 `DEV_SESSION_TOKEN`。
  - 生产期：会话 token 的签发 / 校验方式见 `CLAUDE_1.md` TODO，**补全前不要硬编码**。
- 流式统一走 **SSE**（架构铁律 5）。因为请求体较大且需自定义头，`/chat` 用 **POST + fetch ReadableStream** 手动解析 SSE，而非浏览器 `EventSource`（后者仅 GET）。

## 2. 类型（前后端共享语义，各自用 TS 声明）

```ts
type ChatRole = 'system' | 'user' | 'assistant';
interface ChatMessage { role: ChatRole; content: string; }

// 动作：润色/续写/翻译/总结/自由对话。actions/ 在前端把动作 → prompt。
type ActionType = 'polish' | 'continue' | 'translate' | 'summarize' | 'chat';

// 上下文载荷：当前喂选区/全文；RAG 预留 retrieved 字段（架构铁律 3）。
interface ContextPayload {
  selection?: string;        // 当前选区文本
  documentTitle?: string;    // 文档名，便于模型理解场景
  locale?: string;           // 目标语言/区域，translate 用
  // retrieved?: RetrievedChunk[];  // 预留：RAG 检索结果
}

interface ChatRequest {
  messages: ChatMessage[];   // 多轮对话历史（含本轮 user）
  action?: ActionType;       // 缺省 'chat'
  context?: ContextPayload;  // 选区/文档元信息
}
```

## 3. 接口

### `GET /health`
- 无需鉴权。
- 200 → `{ "status": "ok", "time": "<ISO8601>" }`

### `POST /chat`  （SSE 流式）
- 需鉴权。请求体 = `ChatRequest`（JSON）。
- 响应头：`Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`、`X-Accel-Buffering: no`。
- 响应体：连续 SSE 帧，每帧形如 `data: <json>\n\n`，`<json>` 为下列之一：

```jsonc
{ "type": "token", "delta": "增量文本" }          // 0..n 个，逐字/逐块
{ "type": "done",  "finishReason": "stop" }       // 正常结束，最后一帧
{ "type": "error", "message": "可读错误信息" }     // 出错，终止流
```

- 前端逐字渲染（架构铁律 5），**停止按钮 = `AbortController.abort()`** 中断 fetch。
- 后端在收到客户端断开时应停止上游模型调用。

### `POST /actions`  （SSE 流式，便捷封装）
- 需鉴权。请求体 = `ChatRequest`，但**必须**带 `action`（非 `chat`）。
- 行为：BFF 用 `prompts/` 里对应动作模板组装系统/用户消息，再走与 `/chat` 相同的流式输出。
- 响应格式同 `/chat`。
- Phase 0 现状：`/actions` 后端已实现并受测，但**前端所有动作都走 `/chat`**（`/chat` 接受任意 `action`，由 `BasicContextAssembler` 注入对应动作提示词），因此 `/actions` 暂未被前端调用。阶段 2 完善动作时再决定是否切到 `/actions`。

## 4. 后端可插拔点（架构铁律 3）

- `ModelProvider`：`streamChat(req): AsyncIterable<{ delta: string }>`。
  - `MockModelProvider`（默认，Phase 0 用）：不依赖外网，对选区做可见变换并逐字吐出。
  - `CloudModelProvider`：从环境变量读 `MODEL_BASE_URL` / `MODEL_API_KEY`；**契约未定前为受保护 stub，未配置即抛错，不臆造协议**。
  - 由 `MODEL_PROVIDER=mock|cloud` 选择。
- `ContextAssembler`：`assemble(req): Promise<{ messages: ChatMessage[] }>`。
  - `BasicContextAssembler`（默认）：系统提示词 + 选区/文档名 + 历史。
  - 预留 `RetrievalContextAssembler`（RAG），现在不实现、不引向量库。

## 5. 前端适配层边界（架构铁律 1）

- 所有 `wps.*` 仅出现在 `addin/src/adapter/`。
- 对外只暴露语义化接口（不泄漏 WPS 原始对象）：

```ts
interface DocAdapter {
  isHostAvailable(): boolean;          // 是否在 WPS 宿主内（有 wps 全局）
  getSelectionText(): Promise<string>; // 读选区文本
  getDocumentTitle(): Promise<string>; // 读文档名
  insertAtCursor(text: string): Promise<void>;   // 光标处插入（不覆盖选区）
  replaceSelection(text: string): Promise<void>;  // 替换选区/光标处键入
}
```

- 浏览器内（无 `wps`）用 `MockDocAdapter`，便于无 WPS 时开发 UI。
- 写回策略 Phase 0 只做**纯文本**（架构铁律 4），富文本/修订是后续阶段。
