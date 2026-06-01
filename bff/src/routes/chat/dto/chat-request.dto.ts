import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type {
  ActionType,
  ChatRole,
  ContextPayload,
} from '../../../context/context.types';

const CHAT_ROLES: readonly ChatRole[] = ['system', 'user', 'assistant'];
const ACTION_TYPES: readonly ActionType[] = [
  'polish',
  'continue',
  'translate',
  'summarize',
  'chat',
];

// DTO 对齐 CONTRACT §2 的 ChatRequest。配合全局 ValidationPipe(whitelist+transform)，
// 未声明字段会被剔除，类型不符直接 400，避免脏数据进入上下文组装。
export class ChatMessageDto {
  @IsIn(CHAT_ROLES)
  role!: ChatRole;

  @IsString()
  content!: string;
}

export class ContextPayloadDto implements ContextPayload {
  @IsOptional()
  @IsString()
  selection?: string;

  @IsOptional()
  @IsString()
  documentTitle?: string;

  @IsOptional()
  @IsString()
  locale?: string;
}

export class ChatRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

  @IsOptional()
  @IsIn(ACTION_TYPES)
  action?: ActionType;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContextPayloadDto)
  context?: ContextPayloadDto;
}
