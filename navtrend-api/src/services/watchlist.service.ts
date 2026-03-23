import { eq, and, sql } from 'drizzle-orm';
import { DbService } from '../db';
import { watchlists } from '../db/schema';
import { Watchlist } from '../db/schema';
import { createLogger } from '../utils/logger';
import { parseCompositeSymbol } from '../utils/symbol-parser';
import type { Env } from '../types/env.d';

/**
 * 关注列表服务
 * 处理与用户关注列表相关的业务逻辑
 */
export class WatchlistService {
  private logger;

  /**
   * 构造函数
   * @param dbService 数据库服务
   * @param env 环境变量
   */
  constructor(
    private dbService: DbService,
    private env: Env
  ) {
    this.logger = createLogger('WatchlistService');
  }

  /**
   * 获取用户关注列表
   * @param userId 用户ID
   * @returns 关注列表
   */
  async getUserWatchlist(userId: string): Promise<Watchlist[]> {
    const db = this.dbService.getDb();
    return db.query.watchlists.findMany({
      where: (w, { eq }) => eq(w.userId, userId)
    });
  }

  /**
   * 添加关注
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   * @returns 新增的关注项
   */
  async addWatchlist(userId: string, symbol: string): Promise<Watchlist[]> {
    // 解析复合标识符
    const parsed = parseCompositeSymbol(symbol);

    // 检查是否已存在相同的完整标识符
    const exists = await this.checkExactDuplicate(
      userId,
      parsed.symbol,
      parsed.exchange
    );

    // 如果已存在，直接返回成功
    if (exists) {
      return this.getUserWatchlist(userId);
    }

    const db = this.dbService.getDb();
    const result = await db.insert(watchlists).values({
      userId,
      symbol: parsed.symbol,
      exchange: parsed.exchange
    }).returning();

    return result;
  }

  /**
   * 删除关注
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   */
  async deleteWatchlist(userId: string, symbol: string): Promise<void> {
    // 解析复合标识符
    const parsed = parseCompositeSymbol(symbol);

    // 检查关注项是否存在
    const exists = await this.checkExactDuplicate(
      userId,
      parsed.symbol,
      parsed.exchange
    );

    // 如果不存在，直接返回成功
    if (!exists) {
      return;
    }

    const db = this.dbService.getDb();

    // SQLite 使用 UPPER() 函数实现大小写不敏感匹配
    const conditions = [
      eq(watchlists.userId, userId),
      sql`UPPER(${watchlists.symbol}) = UPPER(${parsed.symbol})`,
      sql`UPPER(${watchlists.exchange}) = UPPER(${parsed.exchange})`
    ];

    await db.delete(watchlists).where(and(...conditions));
  }

  /**
   * 检查特定股票是否在用户的关注列表中
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   * @returns 关注项信息，如果不在关注列表中则返回null
   */
  async checkWatchlistItem(userId: string, symbol: string): Promise<Watchlist | null> {
    try {
      // 解析复合标识符
      const parsed = parseCompositeSymbol(symbol);
      
      const db = this.dbService.getDb();
      
      // SQLite 使用 UPPER() 函数实现大小写不敏感匹配
      const conditions = [
        eq(watchlists.userId, userId),
        sql`UPPER(${watchlists.symbol}) = UPPER(${parsed.symbol})`,
        sql`UPPER(${watchlists.exchange}) = UPPER(${parsed.exchange})`
      ];
      
      const watchlistItem = await db.query.watchlists.findFirst({
        where: and(...conditions)
      });
      
      return watchlistItem || null;
    } catch (error) {
      this.logger.error(`Failed to check watchlist item for user: ${userId}, symbol: ${symbol}`, error);
      throw error;
    }
  }


  /**
   * 检查是否已存在相同的完整标识符
   * @param userId 用户ID
   * @param symbol 股票代码
   * @param exchange 交易所
   * @returns 是否存在
   */
  private async checkExactDuplicate(userId: string, symbol: string, exchange: string): Promise<boolean> {
    const db = this.dbService.getDb();
    
    // SQLite 使用 UPPER() 函数实现大小写不敏感匹配
    const conditions = [
      eq(watchlists.userId, userId),
      sql`UPPER(${watchlists.symbol}) = UPPER(${symbol})`,
      sql`UPPER(${watchlists.exchange}) = UPPER(${exchange})`
    ];
    
    const result = await db.query.watchlists.findFirst({
      where: and(...conditions)
    });
    return result !== undefined;
  }

} 