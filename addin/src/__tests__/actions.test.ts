import { describe, it, expect } from 'vitest';
import { buildChatRequest } from '../actions';

describe('buildChatRequest', () => {
  it('polish：动作指令 + 选区进 user 消息，且填充 context', () => {
    const req = buildChatRequest('polish', '原始文本', '', 'doc.docx');
    expect(req.action).toBe('polish');
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0]?.role).toBe('user');
    expect(req.messages[0]?.content).toContain('润色');
    expect(req.messages[0]?.content).toContain('原始文本');
    expect(req.context).toEqual({ selection: '原始文本', documentTitle: 'doc.docx' });
  });

  it('chat：无动作指令，用户输入直接进 user 消息', () => {
    const req = buildChatRequest('chat', '', '帮我写个开场白', '');
    expect(req.action).toBe('chat');
    expect(req.messages[0]?.content).toBe('帮我写个开场白');
    // 无选区、无文档名时不带 context。
    expect(req.context).toBeUndefined();
  });

  it('translate：用户补充指令与选区都拼入', () => {
    const req = buildChatRequest('translate', 'hello', '翻成中文', 'a.docx');
    const content = req.messages[0]?.content ?? '';
    expect(content).toContain('翻译');
    expect(content).toContain('翻成中文');
    expect(content).toContain('hello');
    expect(req.context?.selection).toBe('hello');
  });
});
