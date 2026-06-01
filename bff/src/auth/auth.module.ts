import { Module } from '@nestjs/common';
import { AuthGuard } from './auth.guard';

// AuthGuard 依赖全局 ConfigService（ConfigModule.forRoot isGlobal:true），无需在此重复导入。
@Module({
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class AuthModule {}
