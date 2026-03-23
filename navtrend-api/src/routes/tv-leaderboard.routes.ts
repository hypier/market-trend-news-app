import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { success, serverError } from '../utils/response';
import { createLogger } from '../utils/logger';
import type { Env } from '../types/env.d';
import type { Services } from '../services/factory';

// 创建路由日志器
const logger = createLogger('LeaderboardRoutes');

/**
 * 排行榜API路由
 * 提供排行榜配置查询和数据获取的核心接口
 */

// 定义路由器
const router = new Hono<{
  Bindings: Env;
  Variables: {
    services: Services;
    userId?: string;
  };
}>();

// 参数验证
const leaderboardDataParamsSchema = z.object({
  market_code: z.string().optional(),
  start: z.string().optional().transform(val => val ? parseInt(val, 10) : 0),
  count: z.string().optional().transform(val => val ? Math.min(parseInt(val, 10), 150) : 50),
  lang: z.string().optional().default('en')
});

const leaderboardIdParamSchema = z.object({
  leaderboardId: z.string().min(1, 'Leaderboard ID is required')
});

/**
 * 获取默认排行榜配置（前端显示用）
 * 包含分类和默认排行榜列表
 */
router.get('/leaderboards/default-config', async (c) => {
  try {
    const { leaderboardService } = c.get('services');

    const defaultConfig = await leaderboardService.getDefaultConfig();

    return c.json(success(defaultConfig, 'Default leaderboard configuration retrieved successfully'));
  } catch (error) {
    logger.error('获取默认配置失败', error);
    return c.json(serverError('Failed to retrieve default leaderboard configuration'), 500);
  }
});

/**
 * 获取所有激活的排行榜配置列表
 */
router.get('/leaderboards/configs', async (c) => {
  try {
    const { leaderboardService } = c.get('services');

    const configs = await leaderboardService.getLeaderboardConfigs();

    return c.json(success(configs.data, 'Leaderboard configurations retrieved successfully'));
  } catch (error) {
    logger.error('获取排行榜配置失败', error);
    return c.json(serverError('Failed to retrieve leaderboard configurations'), 500);
  }
});

/**
 * 获取指定配置的排行榜数据
 */
router.get('/leaderboards/:leaderboardId/data',
  zValidator('param', leaderboardIdParamSchema),
  zValidator('query', leaderboardDataParamsSchema),
  async (c) => {
    try {
      const { leaderboardService } = c.get('services');
      const { leaderboardId } = c.req.valid('param');
      const params = c.req.valid('query');

      const leaderboardData = await leaderboardService.getLeaderboardData(leaderboardId, params);

      return c.json(success(leaderboardData, 'Leaderboard data retrieved successfully'));
    } catch (error: any) {
      logger.error('获取排行榜数据失败', error);

      // 返回适当的HTTP状态码
      const statusCode = error.message?.includes('not found') ? 404 : 500;
      const message = error.message?.includes('not found')
        ? 'Leaderboard configuration not found'
        : 'Failed to retrieve leaderboard data';

      return c.json(serverError(message), statusCode);
    }
  }
);

export default router;
