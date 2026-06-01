import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { loadEnv } from '../config/env';
import { MODEL_PROVIDER, type ModelProvider } from './model-provider.interface';
import { MockModelProvider } from './mock-model.provider';
import { CloudModelProvider } from './cloud-model.provider';

// 按 MODEL_PROVIDER 选择实现，用 DI token 对外提供单一抽象。
// 新增 provider 只需在此工厂的 switch 里挂上，消费方无需改动（架构铁律 3）。
@Module({
  providers: [
    {
      provide: MODEL_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ModelProvider => {
        const env = loadEnv(config);
        switch (env.modelProvider) {
          case 'cloud':
            return new CloudModelProvider(env);
          case 'mock':
          default:
            return new MockModelProvider();
        }
      },
    },
  ],
  exports: [MODEL_PROVIDER],
})
export class ModelModule {}
