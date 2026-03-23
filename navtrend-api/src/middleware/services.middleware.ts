/**
 * 服务中间件
 * 
 * 职责：
 * - 为每个请求创建数据库服务
 * - 使用工厂函数创建所有应用服务
 * - 将服务添加到请求上下文
 * - 请求结束后清理资源
 */

import { MiddlewareHandler } from 'hono';
import { createDbService, type DbService } from '../db';
import { createServices, type Services } from '../services/factory';
import type { Env } from '../types/env.d';

/**
 * 服务中间件
 * 
 * 使用方式：
 * ```typescript
 * app.use('*', servicesMiddleware);
 * 
 * // 在路由中使用
 * app.get('/api/watchlist', (c) => {
 *   const { watchlistService } = c.get('services');
 *   // ...
 * });
 * ```
 */
export const servicesMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    dbService: DbService;
    services: Services;
  };
}> = async (c, next) => {
  // 1. 创建数据库服务
  const dbService = createDbService(c.env);

  // 2. 使用工厂函数创建所有服务
  const services = createServices(c.env, dbService);

  // 3. 添加到请求上下文
  c.set('dbService', dbService);
  c.set('services', services);

  try {
    // 4. 执行下一个中间件或路由处理器
    await next();
  } finally {
    // 5. 请求结束后关闭数据库连接
    await dbService.close();
  }
};
