/**
 * Cloudflare Workers 环境变量类型定义
 */
import type { KVNamespace, D1Database } from '@cloudflare/workers-types';

export interface Env {
  // D1 数据库绑定
  DB: D1Database;
  
  CLERK_SECRET_KEY: string;
  // JWT配置
  JWT_SECRET: string;
  
  // RapidAPI 配置
  RAPIDAPI_KEY: string;
  
  // 环境变量
  NODE_ENV?: string;
  ENVIRONMENT?: string;
  API_VERSION?: string;
  CORS_ORIGIN?: string;
  LOG_LEVEL?: string;
  
  // Cloudflare绑定
  // KV命名空间（缓存）
  CACHE: KVNamespace;
  
  KV_NAMESPACE_ID?: string;          // KV命名空间ID

}


// 为Workers环境扩展全局类型
declare global {
  // 扩展WorkerGlobalScope
  interface WorkerGlobalScope {
    MINIFLARE: boolean;
  }
}
