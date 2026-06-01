import { Inject, Injectable } from '@nestjs/common';
import {
  CONTEXT_ASSEMBLER,
  type ContextAssembler,
} from '../../context/context-assembler.interface';
import type { ChatRequest } from '../../context/context.types';
import {
  MODEL_PROVIDER,
  type ModelProvider,
} from '../../model/model-provider.interface';
import type { SseFrame } from '../../sse/sse';

// 编排层：组装上下文 → 调 ModelProvider 流式 → 产出契约 SSE 帧。
// 不直接碰 Express res（由控制器负责写出），便于在测试里直接断言帧序列。
@Injectable()
export class ChatService {
  constructor(
    @Inject(CONTEXT_ASSEMBLER)
    private readonly contextAssembler: ContextAssembler,
    @Inject(MODEL_PROVIDER)
    private readonly modelProvider: ModelProvider,
  ) {}

  // 产出帧序列：0..n 个 token 帧后以 done 收尾；上游抛错则产出一个 error 帧并终止。
  // signal 透传给 provider，使客户端断开能停止上游调用（CONTRACT §3）。
  async *stream(req: ChatRequest, signal?: AbortSignal): AsyncIterable<SseFrame> {
    try {
      const { messages } = await this.contextAssembler.assemble(req);
      for await (const chunk of this.modelProvider.streamChat({
        messages,
        signal,
      })) {
        if (signal?.aborted) return;
        yield { type: 'token', delta: chunk.delta };
      }
      // 客户端已断开时不再补发 done（连接可能已关闭）。
      if (signal?.aborted) return;
      yield { type: 'done', finishReason: 'stop' };
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      yield { type: 'error', message };
    }
  }
}
