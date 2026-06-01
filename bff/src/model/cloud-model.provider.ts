import { Injectable } from '@nestjs/common';
import type { AppEnv } from '../config/env';
import type { ModelProvider } from './model-provider.interface';
import type { ModelDelta, ModelStreamInput } from './model.types';

// 云端真实模型 provider 的受保护 stub。
// 云端服务的请求/流式响应协议尚未在 CONTRACT.md 补全（见 TODO），此处刻意不臆造任何
// 请求格式：仅校验 env 是否配齐，未配齐就抛清晰错误；即使配齐也明确抛"协议未定"。
// MODEL_API_KEY 只在 BFF 进程内使用，绝不出现在返回前端的任何数据里（架构铁律 2）。
@Injectable()
export class CloudModelProvider implements ModelProvider {
  constructor(private readonly env: AppEnv) {}

  // eslint-disable-next-line require-yield -- stub：协议未定前一律抛错，不产出任何帧。
  async *streamChat(_input: ModelStreamInput): AsyncIterable<ModelDelta> {
    if (!this.env.modelBaseUrl || !this.env.modelApiKey) {
      throw new Error(
        'CloudModelProvider 未配置：请设置 MODEL_BASE_URL 与 MODEL_API_KEY（密钥仅存于 BFF env）。',
      );
    }
    throw new Error(
      '云端模型协议尚未在 CONTRACT.md 中确定，CloudModelProvider 暂未实现。请先补全请求/流式响应契约。',
    );
  }
}
