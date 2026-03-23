import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { success, serverError } from '../utils/response';
import { createLogger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth.middleware';
import type { Env } from '../types/env.d';
import type { Services } from '../services/factory';

// 创建路由日志器
const logger = createLogger('WatchlistRoutes');

/**
 * 关注列表API路由
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
 * 获取用户的关注列表
 * 返回当前用户的所有关注股票
 */
router.get('/', async (c) => {
  try {
    const { watchlistService } = c.get('services');
    const userId = c.get('userId');
    
    // 获取用户关注列表
    const watchlistItems = await watchlistService.getUserWatchlist(userId);
    
    return c.json(success(watchlistItems, 'Watchlist retrieved successfully'));
  } catch (error) {
    logger.error('获取关注列表失败', error);
    return c.json(serverError('Failed to retrieve watchlist'), 500);
  }
});

// 添加股票到关注列表
router.post('/',
  zValidator('json', z.object({
    symbol: z.string().min(1, 'Stock symbol cannot be empty'),
    exchange: z.string().optional(),
  })),
  async (c) => {
    try {
      const { watchlistService } = c.get('services');
      const userId = c.get('userId');

      const { symbol, exchange } = c.req.valid('json');

      // 如果单独传递了 exchange，组合成 EXCHANGE:SYMBOL 格式
      let compositeSymbol = symbol;
      if (exchange) {
        compositeSymbol = `${exchange}:${symbol}`;
      } else if (!symbol.includes(':')) {
        // 如果没有 exchange 且 symbol 不包含冒号，返回错误
        return c.json(
          serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL or provide exchange parameter'),
          400
        );
      }

      // 解析复合标识符
      const [exchangeCode, stockSymbol] = compositeSymbol.split(':');
      
      if (!exchangeCode || !stockSymbol) {
        return c.json(serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL'), 400);
      }

      // 添加到关注列表
      const result = await watchlistService.addWatchlist(userId, compositeSymbol);

      return c.json(success(result, 'Stock added to watchlist successfully'), 201);
    } catch (error: any) {
      logger.error('添加关注失败', error);
      
      // 如果是格式错误，返回 400
      if (error.message && error.message.includes('Invalid symbol format')) {
        return c.json(serverError(error.message), 400);
      }
      
      return c.json(serverError('Failed to add stock to watchlist'), 500);
    }
  }
);

// 从关注列表移除股票
router.delete('/:symbol', async (c) => {
  try {
    const { watchlistService } = c.get('services');
    const userId = c.get('userId');

    const symbol = c.req.param('symbol');
    
    // 验证 symbol 格式
    if (!symbol.includes(':')) {
      return c.json(
        serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL (e.g., NASDAQ:AAPL)'),
        400
      );
    }

    // 解析复合标识符
    const [exchange, stockSymbol] = symbol.split(':');
    
    if (!exchange || !stockSymbol) {
      return c.json(serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL'), 400);
    }

    // 从关注列表移除
    await watchlistService.deleteWatchlist(userId, symbol);

    return c.json(success(null, 'Stock removed from watchlist successfully'));
  } catch (error: any) {
    logger.error('移除关注失败', error);
    
    // 如果是格式错误，返回 400
    if (error.message && error.message.includes('Invalid symbol format')) {
      return c.json(serverError(error.message), 400);
    }
    
    return c.json(serverError('Failed to remove stock from watchlist'), 500);
  }
});


/**
 * 检查特定股票是否在用户的关注列表中
 * 根据股票标识符查询关注状态
 */
router.get('/check/:symbol', async (c) => {
  try {
    const { watchlistService } = c.get('services');
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
    
    // 解析复合标识符
    const [exchange, stockSymbol] = symbol.split(':');
    
    if (!exchange || !stockSymbol) {
      return c.json(serverError('Invalid symbol format. Expected EXCHANGE:SYMBOL'), 400);
    }
    
    // 检查特定股票是否在用户关注列表中
    const watchlistItem = await watchlistService.checkWatchlistItem(userId, symbol);
    
    return c.json(success({ inWatchlist: !!watchlistItem }, 'Watchlist status checked'));
  } catch (error) {
    logger.error(`检查关注列表项失败: ${c.req.param('symbol')}`, error);
    
    // 如果是格式错误，返回 400
    if (error instanceof Error && error.message.includes('Invalid symbol format')) {
      return c.json(serverError(error.message), 400);
    }
    
    return c.json(serverError('Failed to check watchlist item'), 500);
  }
});

export default router; 