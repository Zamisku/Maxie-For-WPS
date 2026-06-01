// 与 docs/CONTRACT.md §2 对齐的共享语义类型（前后端各自声明一份）。

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  readonly role: ChatRole;
  readonly content: string;
}

export type ActionType =
  | 'polish'
  | 'continue'
  | 'translate'
  | 'summarize'
  | 'chat';

export interface ContextPayload {
  readonly selection?: string;
  readonly documentTitle?: string;
  readonly locale?: string;
  // retrieved?: RetrievedChunk[];  // 预留：RAG 检索结果（架构铁律 3，现不实现）
}

export interface ChatRequest {
  readonly messages: readonly ChatMessage[];
  readonly action?: ActionType;
  readonly context?: ContextPayload;
}
