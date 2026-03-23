// 环境变量配置
import type { KVNamespace, D1Database } from '@cloudflare/workers-types';

export interface Env {
  // Cloudflare Workers 绑定
  DB: D1Database;
  CACHE: KVNamespace;
  
  // 认证配置
  CLERK_SECRET_KEY: string;
  JWT_SECRET: string;
  
  // API配置
  RAPIDAPI_KEY: string;
  
  // 环境变量
  NODE_ENV?: string;
  ENVIRONMENT?: string;
  API_VERSION?: string;
  CORS_ORIGIN?: string;
  LOG_LEVEL?: string;
}

// 默认配置
export const DEFAULT_CONFIG = {
  ENVIRONMENT: 'development',
  API_VERSION: 'v1',
  CORS_ORIGIN: '*',
  LOG_LEVEL: 'info',
} as const;

// 获取配置值的辅助函数
export function getConfig<K extends keyof typeof DEFAULT_CONFIG>(
  env: Env,
  key: K
): string {
  return (env[key] as string) || DEFAULT_CONFIG[key];
}

// 验证必需的环境变量
export function validateEnv(env: Env): void {
  const required = [
    'CLERK_SECRET_KEY',
    'JWT_SECRET',
    'RAPIDAPI_KEY',
  ] as const;
  
  const missing = required.filter(key => !env[key]);
  
  // 检查 D1 数据库绑定
  if (!env.DB) {
    missing.push('DB' as any);
  }
  
  // 检查 KV 缓存绑定
  if (!env.CACHE) {
    missing.push('CACHE' as any);
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables or bindings: ${missing.join(', ')}`);
  }
} 