import type { ChatMessage, ChatRequest } from './context.types';

// DI token：上下文组装与调模型逻辑解耦，可插拔（架构铁律 3）。
// 现在是 BasicContextAssembler（选区/文档名/历史），将来可换 RetrievalContextAssembler（RAG）。
export const CONTEXT_ASSEMBLER = 'CONTEXT_ASSEMBLER_TOKEN';

export interface AssembledContext {
  readonly messages: readonly ChatMessage[];
}

export interface ContextAssembler {
  assemble(req: ChatRequest): Promise<AssembledContext>;
}
