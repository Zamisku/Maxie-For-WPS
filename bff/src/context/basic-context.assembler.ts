import { Injectable } from '@nestjs/common';
import { SYSTEM_PROMPT } from '../prompts/system.prompt';
import { buildActionInstruction } from '../prompts/actions';
import type {
  AssembledContext,
  ContextAssembler,
} from './context-assembler.interface';
import type {
  ChatMessage,
  ChatRequest,
  ContextPayload,
} from './context.types';

// 默认上下文组装：系统提示词 + 选区/文档名等元信息 + 历史。
// 不引入向量库；RAG 由将来的 RetrievalContextAssembler 替换本实现（架构铁律 3）。
@Injectable()
export class BasicContextAssembler implements ContextAssembler {
  async assemble(req: ChatRequest): Promise<AssembledContext> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    const meta = this.buildContextMeta(req.context);
    if (meta) {
      messages.push({ role: 'system', content: meta });
    }

    // /actions：把动作指令作为一条 system 消息注入，再走与 /chat 相同的历史（CONTRACT §3）。
    const action = req.action ?? 'chat';
    const actionInstruction = buildActionInstruction(action, req.context);
    if (actionInstruction) {
      messages.push({ role: 'system', content: actionInstruction.instruction });
    }

    messages.push(...req.messages);
    return { messages };
  }

  // 把选区/文档名拼成一条可读的场景说明；无任何元信息时返回 null（不注入空消息）。
  private buildContextMeta(context?: ContextPayload): string | null {
    if (!context) return null;
    const parts: string[] = [];
    if (context.documentTitle) {
      parts.push(`当前文档：《${context.documentTitle}》。`);
    }
    if (context.selection) {
      parts.push(`用户选中的文本：\n"""\n${context.selection}\n"""`);
    }
    return parts.length > 0 ? parts.join('\n') : null;
  }
}
