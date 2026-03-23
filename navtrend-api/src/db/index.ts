/**
 * 数据库模式导出
 * 提供对所有表和类型的访问
 */

import { drizzle } from 'drizzle-orm/d1';
import { sql } from 'drizzle-orm';
import type { ExecutionContext } from '@cloudflare/workers-types';
import * as schema from './schema';
import type { Env } from '../types/env.d';

// 导出所有模式定义
export * from './schema';

/**
 * 数据库服务类
 * 封装 Cloudflare D1 数据库连接和基本操作
 */
export class DbService {
  private db: ReturnType<typeof drizzle<typeof schema>>;

  /**
   * 构造函数，创建 D1 数据库连接
   * @param env 环境变量
   */
  constructor(env: Pick<Env, 'DB'>) {
    if (!env.DB) {
      throw new Error('D1 数据库绑定 (DB) 未设置');
    }

    this.db = drizzle(env.DB, { schema });
    // D1 数据库连接已建立
  }

  /**
   * 获取数据库实例
   * 用于服务层直接操作数据库
   */
  getDb(): ReturnType<typeof drizzle<typeof schema>> {
    return this.db;
  }

  /**
   * 执行健康检查
   * @returns 健康状态
   */
  async healthCheck() {
    try {
      await this.db.run(sql`SELECT 1`);
      return { status: 'connected', error: null };
    } catch (error) {
      return { 
        status: 'failed', 
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * D1 数据库连接由 Cloudflare 管理，无需手动关闭
   * 保留此方法以保持接口兼容性
   */
  async close() {
    // No-op for D1 - connections are managed by Cloudflare
  }

  /**
   * D1 数据库连接由 Cloudflare 管理，无需手动关闭
   * 保留此方法以保持接口兼容性
   */
  safeClose(_ctx?: ExecutionContext) {
    // No-op for D1 - connections are managed by Cloudflare
  }
}

/**
 * 创建数据库服务实例
 * @param env 环境变量
 * @returns 数据库服务实例
 */
export function createDbService(env: Pick<Env, 'DB'>) {
  return new DbService(env);
}

/**
 * 为脚本环境创建数据库服务实例（使用 DATABASE_URL）
 * Note: Commented out to avoid better-sqlite3 dependency in Workers
 * Uncomment when needed for local scripts
 */
// export function createDbServiceForScript(_env: { DATABASE_URL: string }) {
//   // 返回一个适配的 DbService 实例，直接使用 SQLite 连接
//   return new DbService({} as Pick<Env, 'DB'>);
// }

/**
 * 为脚本环境创建直接的 drizzle 数据库客户端
 * Note: Commented out to avoid better-sqlite3 dependency in Workers
 * Uncomment when needed for local scripts along with the imports above
 */
// export function createScriptDbClient(databaseUrl: string): ReturnType<typeof drizzleSqlite> {
//   const database = new Database(databaseUrl);
//   return drizzleSqlite(database, { schema });
// }

/**
 * 数据库客户端类型
 */
export type DbClient = ReturnType<typeof createDbService>;
