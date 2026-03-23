/**
 * 服务工厂函数
 * 
 * 职责：
 * - 统一创建所有应用服务实例
 * - 管理服务之间的依赖关系
 * - 提供类型安全的服务访问
 * 
 * 使用方式：
 * ```typescript
 * const services = createServices(env, dbService);
 * const { watchlistService } = services;
 * ```
 */

import type { Env } from '../types/env.d';
import type { DbService } from '../db';

// Services
import { WatchlistService } from './watchlist.service';
import { PortfolioService } from './portfolio.service';
import { LeaderboardService } from './tv-leaderboard.service';

/**
 * 创建所有服务实例
 * 
 * @param env - 环境变量
 * @param dbService - 数据库服务
 * @returns 所有服务实例
 */
export function createServices(
  env: Env,
  dbService: DbService
) {
  // 创建业务服务
  const watchlistService = new WatchlistService(
    dbService,
    env
  );

  const portfolioService = new PortfolioService(dbService);
  const leaderboardService = new LeaderboardService(env.RAPIDAPI_KEY);

  // 返回所有服务
  return {
    watchlistService,
    portfolioService,
    leaderboardService,
  };
}

/**
 * Services 类型定义
 * 
 * 使用方式：
 * ```typescript
 * const { watchlistService }: Services = c.get('services');
 * ```
 */
export type Services = ReturnType<typeof createServices>;
