import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ContextModule } from './context/context.module';
import { ModelModule } from './model/model.module';
import { HealthController } from './routes/health/health.controller';
import { ChatModule } from './routes/chat/chat.module';

@Module({
  imports: [
    // isGlobal:true → ConfigService 全局可注入，env 读取统一经 config/env.ts。
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ModelModule,
    ContextModule,
    ChatModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
