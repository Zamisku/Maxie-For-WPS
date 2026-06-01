import { ChatService } from '../src/routes/chat/chat.service';
import { BasicContextAssembler } from '../src/context/basic-context.assembler';
import { MockModelProvider } from '../src/model/mock-model.provider';
import type { ChatRequest } from '../src/context/context.types';
import type { SseFrame } from '../src/sse/sse';

// 用真实的 BasicContextAssembler + MockModelProvider 跑通 service，
// 断言：产出至少一个 token 帧，且以 done 帧收尾（CONTRACT §3）。
describe('ChatService (mock provider)', () => {
  const service = new ChatService(
    new BasicContextAssembler(),
    new MockModelProvider(),
  );

  async function collect(req: ChatRequest): Promise<SseFrame[]> {
    const frames: SseFrame[] = [];
    for await (const frame of service.stream(req)) {
      frames.push(frame);
    }
    return frames;
  }

  it('produces token frames and ends with a done frame', async () => {
    const req: ChatRequest = {
      messages: [{ role: 'user', content: '你好' }],
    };

    const frames = await collect(req);

    const tokenFrames = frames.filter((f) => f.type === 'token');
    expect(tokenFrames.length).toBeGreaterThan(0);

    const last = frames[frames.length - 1];
    expect(last).toEqual({ type: 'done', finishReason: 'stop' });

    expect(frames.some((f) => f.type === 'error')).toBe(false);

    // 拼回的文本应包含可见变换标记，验证 mock 链路确实回显了用户输入。
    const text = tokenFrames
      .map((f) => (f.type === 'token' ? f.delta : ''))
      .join('');
    expect(text).toContain('Mock 回复');
    expect(text).toContain('你好');
  });

  it('stops early and emits no done frame when aborted before start', async () => {
    const controller = new AbortController();
    controller.abort();

    const frames: SseFrame[] = [];
    for await (const frame of service.stream(
      { messages: [{ role: 'user', content: 'x' }] },
      controller.signal,
    )) {
      frames.push(frame);
    }

    expect(frames.some((f) => f.type === 'done')).toBe(false);
  });
});
