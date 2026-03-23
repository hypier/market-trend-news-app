/**
 * 应用更新检查路由
 * 提供版本检查功能（配置文件驱动）
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { success, serverError } from '../utils/response';
import { createLogger } from '../utils/logger';
import { UpdateService } from '../services/update.service';
import type { Env } from '../types/env.d';

// 创建路由日志器
const logger = createLogger('UpdateRoutes');

/**
 * 应用更新检查API路由
 * 提供版本检查功能（从配置文件读取版本信息）
 */

// 定义路由器
const router = new Hono<{
  Bindings: Env;
  Variables: {
    userId?: string;
  };
}>();

// 请求验证Schema
const updateCheckSchema = z.object({
  platform: z.enum(['ios', 'android'], {
    errorMap: () => ({ message: 'Platform must be either "ios" or "android"' })
  }),
  currentBuildNumber: z.number().int().positive({
    message: 'Build number must be a positive integer'
  }),
  currentVersionName: z.string().min(1, {
    message: 'Version name is required'
  }),
  locale: z.string().default('en').optional(),
});

/**
 * POST /check
 * 检查应用是否有更新
 */
router.post('/check', 
  zValidator('json', updateCheckSchema),
  async (c) => {
    try {
      const updateService = new UpdateService();
      const { platform, currentBuildNumber, currentVersionName, locale } = c.req.valid('json');

      // 使用服务层处理业务逻辑（从配置文件读取）
      const response = updateService.checkForUpdate({
        platform,
        currentBuildNumber,
        currentVersionName,
        locale
      });

      return c.json(success(response, response.updateAvailable ? 'Update available' : 'No update needed'));

    } catch (error) {
      logger.error('应用更新检查失败', error);
      return c.json(serverError('Failed to check for updates'), 500);
    }
  }
);

export default router;
