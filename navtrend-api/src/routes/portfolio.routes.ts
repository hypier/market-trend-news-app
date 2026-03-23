import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { success, serverError, paramError } from '../utils/response';
import { authMiddleware } from '../middleware/auth.middleware';
import { createLogger } from '../utils/logger';
import type { Env } from '../types/env.d';
import type { Services } from '../services/factory';

// 创建路由日志器
const logger = createLogger('PortfolioRoutes');

/**
 * 投资组合API路由
 * 功能:
 * - 支持复合标识符格式 (Symbol:Exchange[:Country])
 * - 集成市场数据（报价和趋势）
 * - 批量数据获取优化
 */

// 定义路由器
const router = new Hono<{
  Bindings: Env;
  Variables: {
    services: Services;
    userId: string;
    user: any;
  };
}>();

// 应用鉴权中间件
router.use('*', authMiddleware);

/**
 * 获取投资组合概览
 * 返回持仓列表和基础统计信息（不含市场数据）
 */
router.get('/overview', async (c) => {
  try {
    const { portfolioService } = c.get('services');
    const userId = c.get('userId');
    
    // 获取投资组合概览
    const overview = await portfolioService.getPortfolioOverview(userId);
    
    return c.json(success(overview, 'Portfolio overview retrieved successfully'));
  } catch (error) {
    logger.error('获取投资组合概览失败', error);
    return c.json(serverError('Failed to retrieve portfolio overview'), 500);
  }
});

/**
 * 获取用户的所有持仓列表
 * 返回当前用户的所有持仓股票（不含统计信息）
 */
router.get('/holdings', async (c) => {
  try {
    const { portfolioService } = c.get('services');
    const userId = c.get('userId');
    
    // 获取用户持仓列表
    const holdings = await portfolioService.getUserPortfolio(userId);
    
    return c.json(success(holdings, 'Holdings retrieved successfully'));
  } catch (error) {
    logger.error('获取持仓列表失败', error);
    return c.json(serverError('Failed to retrieve holdings'), 500);
  }
});

/**
 * 获取特定股票的持仓情况
 * 根据股票标识符查询用户的持仓信息
 */
router.get('/holdings/:symbol', async (c) => {
  try {
    const { portfolioService } = c.get('services');
    const userId = c.get('userId');
    
    // 获取URL参数
    const symbol = c.req.param('symbol');
    
    // 验证 symbol 格式
    if (!symbol.includes(':')) {
      return c.json(
        serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL)'),
        400
      );
    }
    
    // 获取持仓信息
    const holding = await portfolioService.getHoldingBySymbol(userId, symbol);
    
    // 当找不到持仓时返回空对象而非404
    if (!holding) {
      return c.json(success(null, `No holding found for symbol ${symbol}`));
    }
    
    return c.json(success(holding, 'Holding retrieved successfully'));
  } catch (error) {
    logger.error(`获取特定股票持仓失败: ${c.req.param('symbol')}`, error);
    
    // 如果是格式错误，返回 400
    if (error instanceof Error && error.message.includes('Invalid symbol format')) {
      return c.json(serverError(error.message), 400);
    }
    
    return c.json(serverError('Failed to retrieve holding information'), 500);
  }
});

/**
 * 调整持仓（增持或减持）
 * 一个接口同时处理增持和减持操作，自动计算持有量和平均成本
 */
router.post('/adjust-position',
  zValidator('json', z.object({
    symbol: z.string()
      .min(1, 'Stock symbol cannot be empty')
      .refine(
        (val) => val.includes(':'),
        { message: 'Invalid symbol format. Expected EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL)' }
      ),
    changeShares: z.number().refine(val => val !== 0, {
      message: 'Change in shares must be non-zero'
    }),
    transactionPrice: z.number().positive('Transaction price must be positive')
  })),
  async (c) => {
    try {
      const { portfolioService } = c.get('services');
      const userId = c.get('userId');

      const { symbol, changeShares, transactionPrice } = c.req.valid('json');
      
      // 调整持仓
      const result = await portfolioService.adjustPosition(
        userId,
        symbol,
        changeShares,
        transactionPrice
      );
      
      // 构建成功消息
      const operationType = changeShares > 0 ? '增持' : '减持';
      const message = result 
        ? `成功${operationType}股票 ${symbol}`
        : `成功完全减持股票 ${symbol}`;
      
      return c.json(success(result, message), 200);
    } catch (error: any) {
      logger.error('调整持仓失败', error);
      
      if (error.message.includes('you do not own') || 
          error.message.includes('more than owned') ||
          error.message.includes('must be a') ||
          error.message.includes('non-zero') ||
          error.message.includes('Invalid symbol format')) {
        return c.json(paramError(error.message), 400);
      }
      
      return c.json(serverError('Failed to adjust position'), 500);
    }
  }
);

export default router; 