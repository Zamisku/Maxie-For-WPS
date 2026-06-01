import { Controller, Get } from '@nestjs/common';

interface HealthResponse {
  readonly status: 'ok';
  readonly time: string;
}

// 健康检查（CONTRACT §3）：不挂 AuthGuard，供探活与前端连通性自检。
@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok', time: new Date().toISOString() };
  }
}
