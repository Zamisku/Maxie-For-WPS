import { ConfigService } from '@nestjs/config';

// 集中、类型安全地读取环境变量。其余代码不直接碰 process.env / ConfigService 的裸字符串，
// 避免散落的字符串 key 与隐式 any，并把"默认值与解析规则"收敛到一处。

export type ModelProviderName = 'mock' | 'cloud';

export interface AppEnv {
  readonly port: number;
  readonly modelProvider: ModelProviderName;
  readonly authDisabled: boolean;
  readonly devSessionToken: string;
  readonly modelBaseUrl: string;
  readonly modelApiKey: string;
  readonly allowedOrigins: readonly string[];
}

function parseBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === 'true';
}

function parsePort(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseProvider(value: string | undefined): ModelProviderName {
  // 仅接受白名单值；未知值回落到 mock，保证离线默认可用（架构铁律 / Phase 0）。
  return value === 'cloud' ? 'cloud' : 'mock';
}

function parseOrigins(value: string | undefined): readonly string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function loadEnv(config: ConfigService): AppEnv {
  return {
    port: parsePort(config.get<string>('PORT'), 3000),
    modelProvider: parseProvider(config.get<string>('MODEL_PROVIDER')),
    authDisabled: parseBool(config.get<string>('AUTH_DISABLED'), false),
    devSessionToken: config.get<string>('DEV_SESSION_TOKEN') ?? '',
    modelBaseUrl: config.get<string>('MODEL_BASE_URL') ?? '',
    modelApiKey: config.get<string>('MODEL_API_KEY') ?? '',
    allowedOrigins: parseOrigins(config.get<string>('ALLOWED_ORIGINS')),
  };
}
