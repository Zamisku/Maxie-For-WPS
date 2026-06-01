import type { ModelDelta, ModelStreamInput } from './model.types';

// DI token：以接口名作为字符串 token，便于按 MODEL_PROVIDER 在 module 里切换实现，
// 而消费方（ChatService）只依赖抽象（架构铁律 3：调模型逻辑可插拔、与上下文解耦）。
export const MODEL_PROVIDER = 'MODEL_PROVIDER_TOKEN';

export interface ModelProvider {
  streamChat(input: ModelStreamInput): AsyncIterable<ModelDelta>;
}
