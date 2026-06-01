import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { loadEnv } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const env = loadEnv(app.get(ConfigService));

  // 全局校验：剔除未声明字段（whitelist）并按 DTO 类型转换（transform）。
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  // 按 ALLOWED_ORIGINS 开 CORS（开发期放行前端 Vite 源 http://localhost:5173）。
  // 列表为空时不开 CORS，避免误放行任意来源。
  if (env.allowedOrigins.length > 0) {
    app.enableCors({
      origin: [...env.allowedOrigins],
      credentials: true,
    });
  }

  await app.listen(env.port);
}

void bootstrap();
