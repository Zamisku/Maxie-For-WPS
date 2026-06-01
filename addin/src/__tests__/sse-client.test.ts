import { describe, it, expect } from 'vitest';
import { parseSseEvent } from '../api/sse-client';

describe('parseSseEvent', () => {
  it('解析 token 帧', () => {
    const frame = parseSseEvent('data: {"type":"token","delta":"你好"}');
    expect(frame).toEqual({ type: 'token', delta: '你好' });
  });

  it('解析 done 帧', () => {
    const frame = parseSseEvent('data: {"type":"done","finishReason":"stop"}');
    expect(frame).toEqual({ type: 'done', finishReason: 'stop' });
  });

  it('解析 error 帧', () => {
    const frame = parseSseEvent('data: {"type":"error","message":"boom"}');
    expect(frame).toEqual({ type: 'error', message: 'boom' });
  });

  it('忽略 SSE 注释行，只取 data', () => {
    const frame = parseSseEvent(': keep-alive\ndata: {"type":"token","delta":"x"}');
    expect(frame).toEqual({ type: 'token', delta: 'x' });
  });

  it('无 data 行返回 undefined', () => {
    expect(parseSseEvent(': only-comment')).toBeUndefined();
  });

  it('done 缺 finishReason 时回退为 stop', () => {
    const frame = parseSseEvent('data: {"type":"done"}');
    expect(frame).toEqual({ type: 'done', finishReason: 'stop' });
  });

  it('未知 type 抛错（交由上层 onError）', () => {
    expect(() => parseSseEvent('data: {"type":"nope"}')).toThrow();
  });
});
