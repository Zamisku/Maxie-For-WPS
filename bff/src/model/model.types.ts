import type { ChatMessage } from '../context/context.types';

// 模型层的输入：已由 ContextAssembler 组装好的 messages。
// provider 只负责"把 messages 喂给模型并流式吐出增量"，不关心上下文如何拼。
export interface ModelStreamInput {
  readonly messages: readonly ChatMessage[];
  // 客户端断开时由控制器触发，provider 应据此尽快停止上游调用。
  readonly signal?: AbortSignal;
}

export interface ModelDelta {
  readonly delta: string;
}
