import { Injectable } from '@nestjs/common';
import type { ModelProvider } from './model-provider.interface';
import type { ModelDelta, ModelStreamInput } from './model.types';

// Phase 0 默认 provider：完全离线，不依赖外网。
// 取最后一条 user 文本做一个"可见变换"（加可识别前缀 + 原样回显），分小块逐字 yield，
// 让前端能验证 SSE 流式逐字渲染与停止按钮的链路，而无需真实模型。
@Injectable()
export class MockModelProvider implements ModelProvider {
  private static readonly CHUNK_SIZE = 2;
  private static readonly DELAY_MS = 15;

  async *streamChat(input: ModelStreamInput): AsyncIterable<ModelDelta> {
    const lastUser = [...input.messages]
      .reverse()
      .find((m) => m.role === 'user');

    const source = lastUser?.content ?? '';
    const reply = `【Mock 回复】我已收到，原文如下：${source}`;

    for (let i = 0; i < reply.length; i += MockModelProvider.CHUNK_SIZE) {
      // 客户端断开后立即停止，避免无谓地继续"调上游"。
      if (input.signal?.aborted) return;
      yield { delta: reply.slice(i, i + MockModelProvider.CHUNK_SIZE) };
      await this.tick(MockModelProvider.DELAY_MS, input.signal);
    }
  }

  private tick(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      // 断开时清掉定时器并立即结束，使生成器尽快走到 aborted 分支。
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}
