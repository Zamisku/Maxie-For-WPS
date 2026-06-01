/**
 * 前后端共享语义类型（CONTRACT 第 2、3 节）。前端独立声明，与 BFF 保持一致。
 */

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// 动作：润色/续写/翻译/总结/自由对话。actions/ 负责动作 → prompt。
export type ActionType = 'polish' | 'continue' | 'translate' | 'summarize' | 'chat';

// 上下文载荷；RAG 预留 retrieved 字段（架构铁律 3，此处先不声明）。
export interface ContextPayload {
  selection?: string;
  documentTitle?: string;
  locale?: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  action?: ActionType;
  context?: ContextPayload;
}

/**
 * SSE 帧（CONTRACT 第 3 节）。每帧 `data: <json>\n\n`，json 为下列之一。
 */
export interface SseTokenFrame {
  type: 'token';
  delta: string;
}

export interface SseDoneFrame {
  type: 'done';
  finishReason: string;
}

export interface SseErrorFrame {
  type: 'error';
  message: string;
}

export type SseFrame = SseTokenFrame | SseDoneFrame | SseErrorFrame;
