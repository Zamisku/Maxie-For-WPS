import type { ActionType, ChatMessage, ChatRequest, ContextPayload } from '../api/types';

/**
 * 动作 → 请求组装。Phase 0 前端只组织 messages/context，
 * 真正的系统提示词在 BFF 的 prompts/ 里（CONTRACT 第 3 节 /actions）。
 */

export interface ActionOption {
  value: ActionType;
  label: string;
  /** 是否需要选区文本作为操作对象（chat 不强制）。 */
  needsSelection: boolean;
}

export const ACTION_OPTIONS: readonly ActionOption[] = [
  { value: 'polish', label: '润色', needsSelection: true },
  { value: 'continue', label: '续写', needsSelection: true },
  { value: 'translate', label: '翻译', needsSelection: true },
  { value: 'summarize', label: '总结', needsSelection: true },
  { value: 'chat', label: '对话', needsSelection: false },
];

// 各动作给模型的简短指令；正式模板在 BFF，这里仅 Phase 0 让 mock 可见可分辨。
const ACTION_INSTRUCTION: Record<ActionType, string> = {
  polish: '请润色下面这段文字，保持原意、更通顺自然。',
  continue: '请在下面这段文字之后自然续写。',
  translate: '请翻译下面这段文字。',
  summarize: '请总结下面这段文字的要点。',
  chat: '',
};

/**
 * 把（动作 + 选区 + 用户输入 + 文档名）组织成一次 ChatRequest。
 * - 选区作为操作对象拼入本轮 user 消息；
 * - 同时放进 context.selection / documentTitle，供后端上下文组装复用（架构铁律 3）。
 */
export function buildChatRequest(
  action: ActionType,
  selection: string,
  userInput: string,
  docTitle: string,
): ChatRequest {
  const userContent = composeUserContent(action, selection, userInput);

  const messages: ChatMessage[] = [{ role: 'user', content: userContent }];

  const context: ContextPayload = {};
  if (selection.length > 0) context.selection = selection;
  if (docTitle.length > 0) context.documentTitle = docTitle;

  const request: ChatRequest = { messages, action };
  if (Object.keys(context).length > 0) request.context = context;
  return request;
}

function composeUserContent(action: ActionType, selection: string, userInput: string): string {
  const parts: string[] = [];
  const instruction = ACTION_INSTRUCTION[action];
  if (instruction.length > 0) parts.push(instruction);

  const trimmedInput = userInput.trim();
  if (trimmedInput.length > 0) parts.push(trimmedInput);

  if (selection.length > 0) {
    // 用分隔标记包裹选区，避免与指令/输入混淆。
    parts.push(`【选区】\n${selection}`);
  }

  return parts.join('\n\n');
}
