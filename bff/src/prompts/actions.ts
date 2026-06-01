import type { ActionType, ContextPayload } from '../context/context.types';

// 把动作类型映射为"给模型的指令前缀"。/actions 端点据此在最后一条 user 消息前注入指令，
// 与 /chat 复用同一条流式链路（CONTRACT §3）。模板集中在此，便于 Phase 2 打磨。

export interface ActionInstruction {
  // 注入到对话里的、面向模型的中文指令。
  readonly instruction: string;
}

function localeHint(context?: ContextPayload): string {
  return context?.locale ? `目标语言/区域：${context.locale}。` : '';
}

// 非 chat 动作各自的指令模板；chat 不注入任何额外指令（返回 null）。
export function buildActionInstruction(
  action: ActionType,
  context?: ContextPayload,
): ActionInstruction | null {
  switch (action) {
    case 'polish':
      return {
        instruction:
          '请润色下面这段文字，使其更通顺、专业，保持原意与语气，仅输出润色后的文本。',
      };
    case 'continue':
      return {
        instruction:
          '请在下面这段文字之后自然续写，延续其风格与逻辑，仅输出续写的内容。',
      };
    case 'translate':
      return {
        instruction: `请翻译下面这段文字。${localeHint(context)}仅输出译文。`,
      };
    case 'summarize':
      return {
        instruction: '请用简洁的中文总结下面这段文字的要点，仅输出总结。',
      };
    case 'chat':
    default:
      return null;
  }
}
