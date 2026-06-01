import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { loadEnv } from '../config/env';

// 鉴权守卫（CONTRACT §1）：
// - AUTH_DISABLED=true 时放行（开发期）。
// - 否则要求 Authorization: Bearer <token>，且 token 必须等于 DEV_SESSION_TOKEN。
// 绝不在任何响应中回显 token / 密钥（架构铁律 2）；错误信息保持通用。
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const env = loadEnv(this.config);
    if (env.authDisabled) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearer(req);

    // 生产期签发/校验方式待定（见 CLAUDE_1.md TODO）；当前仅比对静态 DEV_SESSION_TOKEN。
    // 未配置 DEV_SESSION_TOKEN 时一律拒绝，避免"空 token 放行"的隐患。
    if (!env.devSessionToken || token !== env.devSessionToken) {
      throw new UnauthorizedException('无效或缺失的会话凭证。');
    }
    return true;
  }

  private extractBearer(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, value] = header.split(' ');
    return scheme === 'Bearer' && value ? value : null;
  }
}
