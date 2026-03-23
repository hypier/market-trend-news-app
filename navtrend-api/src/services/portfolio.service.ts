import { eq, sql, and, isNull } from 'drizzle-orm';
import { DbService } from '../db';
import { portfolios } from '../db/schema';
import { Portfolio } from '../db/schema';
import { createLogger } from '../utils/logger';
import { toDecimalString } from '../utils/decimal';
import { parseCompositeSymbol } from '../utils/symbol-parser';

/**
 * 投资组合服务
 * 处理与用户持仓相关的业务逻辑
 */
export class PortfolioService {
  private logger;
  
  /**
   * 构造函数
   * @param dbService 数据库服务
   */
  constructor(private dbService: DbService) {
    this.logger = createLogger('PortfolioService');
  }

  /**
   * 获取用户投资组合
   * @param userId 用户ID
   * @returns 投资组合列表
   */
  async getUserPortfolio(userId: string): Promise<Portfolio[]> {
    const db = this.dbService.getDb();
    return db.query.portfolios.findMany({
      where: (p, { eq }) => eq(p.userId, userId)
    });
  }

  /**
   * 添加持仓
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   * @param shares 股票数量
   * @param avgCost 平均成本
   * @returns 新增的持仓
   */
  async addHolding(userId: string, symbol: string, shares: string, avgCost: string): Promise<Portfolio[]> {
    // 验证数据
    this.validateHoldingData(shares, avgCost);
    
    // 确保数值精度（转换为8位小数的字符串）
    const formattedShares = toDecimalString(shares, 8);
    const formattedAvgCost = toDecimalString(avgCost, 8);
    
    // 解析复合标识符
    const parsed = parseCompositeSymbol(symbol);
    
    // 检查是否已存在相同的完整标识符
    const exists = await this.checkExactDuplicate(
      userId,
      parsed.symbol,
      parsed.exchange
    );
    if (exists) {
      throw new Error('You already own this stock');
    }
    
    // 检查是否存在没有交易所的legacy记录
    const legacyHolding = await this.findLegacyHolding(userId, parsed.symbol);
    if (legacyHolding) {
      // 找到legacy记录，更新它并补充交易所信息
      const db = this.dbService.getDb();
      return db.update(portfolios)
        .set({
          exchange: parsed.exchange,
          shares: formattedShares,
          avgCost: formattedAvgCost,
          updatedAt: sql`(unixepoch() * 1000)`
        })
        .where(eq(portfolios.id, legacyHolding.id))
        .returning();
    }
    
    // 没有找到任何匹配记录，创建新记录
    const db = this.dbService.getDb();
    return db.insert(portfolios).values({
      userId,
      symbol: parsed.symbol,
      exchange: parsed.exchange,
      shares: formattedShares,
      avgCost: formattedAvgCost
    }).returning();
  }

  /**
   * 更新持仓
   * @param id 持仓ID
   * @param userId 用户ID
   * @param shares 股票数量
   * @param avgCost 平均成本
   * @param exchange 交易所（可选）
   * @param country 国家（可选）
   * @returns 更新后的持仓
   */
  async updateHolding(id: string, userId: string, shares: string, avgCost: string, exchange?: string, country?: string): Promise<Portfolio[]> {
    // 验证数据
    this.validateHoldingData(shares, avgCost);
    
    // 确保数值精度（转换为8位小数的字符串）
    const formattedShares = toDecimalString(shares, 8);
    const formattedAvgCost = toDecimalString(avgCost, 8);
    
    // 检查持仓是否存在且属于当前用户
    const exists = await this.checkHoldingExists(id, userId);
    if (!exists) {
      throw new Error('Holding not found or access denied');
    }
    
    const db = this.dbService.getDb();
    
    // 构建更新对象
    const updateData: any = {
      shares: formattedShares,
      avgCost: formattedAvgCost,
      updatedAt: sql`(unixepoch() * 1000)`
    };
    
    // 如果提供了交易所信息，则更新
    if (exchange !== undefined) {
      updateData.exchange = exchange || null; // 允许设置为null来清除交易所信息
    }
    
    if (country !== undefined) {
      updateData.country = country || null; // 允许设置为null来清除国家信息
    }
    
    return db.update(portfolios)
      .set(updateData)
      .where(eq(portfolios.id, id))
      .returning();
  }

  /**
   * 删除持仓
   * @param id 持仓ID
   * @param userId 用户ID
   */
  async deleteHolding(id: string, userId: string): Promise<void> {
    // 检查持仓是否存在且属于当前用户
    const exists = await this.checkHoldingExists(id, userId);
    if (!exists) {
      throw new Error('Holding not found or access denied');
    }
    
    const db = this.dbService.getDb();
    await db.delete(portfolios)
      .where(eq(portfolios.id, id));
  }

  /**
   * 获取投资组合概览
   * @param userId 用户ID
   * @returns 投资组合概览数据
   */
  async getPortfolioOverview(userId: string): Promise<{
    holdingsCount: number;
    totalInvestment: string;
    totalSharesCount: string;
    holdings: Portfolio[];
  }> {
    const holdings = await this.getUserPortfolio(userId);
    
    // 计算总资产和总持仓数量
    let totalInvestment = 0;
    let totalSharesCount = 0;
    
    holdings.forEach(h => {
      const shares = Number(h.shares);
      const avgCost = Number(h.avgCost);
      
      totalInvestment += shares * avgCost;
      totalSharesCount += shares;
    });
    
    return {
      holdingsCount: holdings.length, // 持仓数量
      totalInvestment: totalInvestment.toFixed(2), // 总投资额
      totalSharesCount: totalSharesCount.toFixed(8), // 总股票数量
      holdings // 持仓列表
    };
  }

  /**
   * 检查持仓是否存在
   * @param id 持仓ID
   * @param userId 用户ID
   * @returns 是否存在
   */
  private async checkHoldingExists(id: string, userId: string): Promise<boolean> {
    const db = this.dbService.getDb();
    const result = await db.query.portfolios.findFirst({
      where: (p, { and, eq }) => and(
        eq(p.id, id),
        eq(p.userId, userId)
      )
    });
    return result !== undefined;
  }
  
  /**
   * 验证持仓数据
   * @param shares 股票数量
   * @param avgCost 平均成本
   */
  private validateHoldingData(shares: string, avgCost: string): void {
    if (isNaN(Number(shares)) || Number(shares) <= 0) {
      throw new Error('Shares must be a positive number');
    }
    
    if (isNaN(Number(avgCost)) || Number(avgCost) <= 0) {
      throw new Error('Average cost must be a positive number');
    }
  }

  /**
   * 检查是否已存在相同的完整标识符
   * @param userId 用户ID
   * @param symbol 股票代码
   * @param exchange 交易所
   * @returns 是否存在
   */
  private async checkExactDuplicate(
    userId: string,
    symbol: string,
    exchange: string
  ): Promise<boolean> {
    const db = this.dbService.getDb();
    
    // SQLite 使用 UPPER() 函数实现大小写不敏感匹配
    const conditions = [
      eq(portfolios.userId, userId),
      sql`UPPER(${portfolios.symbol}) = UPPER(${symbol})`,
      sql`UPPER(${portfolios.exchange}) = UPPER(${exchange})`
    ];
    
    const result = await db.query.portfolios.findFirst({
      where: and(...conditions)
    });
    return result !== undefined;
  }

  /**
   * 查找legacy持仓
   * @param userId 用户ID
   * @param symbol 股票代码
   * @returns 持仓记录或undefined
   */
  private async findLegacyHolding(userId: string, symbol: string): Promise<Portfolio | undefined> {
    const db = this.dbService.getDb();
    const result = await db.query.portfolios.findFirst({
      where: and(
        eq(portfolios.userId, userId),
        sql`UPPER(${portfolios.symbol}) = UPPER(${symbol})`, // SQLite 使用 UPPER() 实现大小写不敏感匹配
        isNull(portfolios.exchange)
      )
    });
    return result;
  }

  /**
   * 查找现有持仓
   * @param userId 用户ID
   * @param symbol 股票代码
   * @param exchange 交易所
   * @returns 持仓记录或undefined
   */
  private async findExistingHolding(
    userId: string,
    symbol: string,
    exchange: string
  ): Promise<Portfolio | undefined> {
    const db = this.dbService.getDb();
    
    // SQLite 使用 UPPER() 函数实现大小写不敏感匹配
    const conditions = [
      eq(portfolios.userId, userId),
      sql`UPPER(${portfolios.symbol}) = UPPER(${symbol})`,
      sql`UPPER(${portfolios.exchange}) = UPPER(${exchange})`
    ];
    
    return db.query.portfolios.findFirst({
      where: and(...conditions)
    });
  }

  /**
   * 调整持仓（增持或减持）
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   * @param changeShares 股数变化量（正数表示增持，负数表示减持）
   * @param transactionPrice 交易价格
   * @returns 更新后的持仓信息
   */
  async adjustPosition(
    userId: string, 
    symbol: string, 
    changeShares: number, 
    transactionPrice: number
  ): Promise<Portfolio | null> {
    // 验证交易数据
    if (isNaN(changeShares) || changeShares === 0) {
      throw new Error('Change in shares must be a non-zero number');
    }
    
    if (isNaN(transactionPrice) || transactionPrice <= 0) {
      throw new Error('Transaction price must be a positive number');
    }
    
    // 解析复合标识符
    const parsed = parseCompositeSymbol(symbol);
    
    // 查找用户是否已持有该股票
    const db = this.dbService.getDb();
    let holding = await this.findExistingHolding(userId, parsed.symbol, parsed.exchange);
    
    // 如果没有找到完全匹配的记录，查找legacy记录
    if (!holding) {
      holding = await this.findLegacyHolding(userId, parsed.symbol);
    }
    
    // 处理增持情况
    if (changeShares > 0) {
      if (holding) {
        // 已有持仓，计算新的平均成本和总股数
        const currentShares = Number(holding.shares);
        const currentTotalCost = currentShares * Number(holding.avgCost);
        const newShares = currentShares + changeShares;
        const newTotalCost = currentTotalCost + (changeShares * transactionPrice);
        const newAvgCost = newTotalCost / newShares;
        
        // 格式化数值精度
        const formattedShares = toDecimalString(newShares, 8);
        const formattedAvgCost = toDecimalString(newAvgCost, 8);
        
        // 更新持仓
        return (await db.update(portfolios)
          .set({
            shares: formattedShares,
            avgCost: formattedAvgCost,
            exchange: parsed.exchange || holding.exchange,
            updatedAt: sql`(unixepoch() * 1000)`
          })
          .where(eq(portfolios.id, holding.id))
          .returning())[0] || null;
      } else {
        // 没有持仓，创建新记录
        return (await db.insert(portfolios).values({
          userId,
          symbol: parsed.symbol,
          exchange: parsed.exchange,
          shares: changeShares.toString(),
          avgCost: transactionPrice.toFixed(4)
        }).returning())[0] || null;
      }
    } 
    // 处理减持情况
    else {
      if (!holding) {
        throw new Error('Cannot reduce position for a stock you do not own');
      }
      
      const currentShares = Number(holding.shares);
      const changeSharesAbs = Math.abs(changeShares);
      
      // 检查是否有足够的股票可以减持
      if (currentShares < changeSharesAbs) {
        throw new Error(`Cannot reduce more than owned. You own ${currentShares} shares.`);
      }
      
      const newShares = currentShares - changeSharesAbs;
      
      // 如果减持后股数为0，删除持仓记录
      if (newShares === 0) {
        await db.delete(portfolios).where(eq(portfolios.id, holding.id));
        return null;
      } else {
        // 减持不改变平均成本，只改变股数
        const formattedShares = toDecimalString(newShares, 8);
        return (await db.update(portfolios)
          .set({
            shares: formattedShares,
            updatedAt: sql`(unixepoch() * 1000)`
          })
          .where(eq(portfolios.id, holding.id))
          .returning())[0] || null;
      }
    }
  }

  /**
   * 获取用户特定股票的持仓情况
   * @param userId 用户ID
   * @param symbol 股票代码复合标识符 (格式: EXCHANGE:SYMBOL)
   * @returns 持仓信息，如果不存在则返回null
   */
  async getHoldingBySymbol(userId: string, symbol: string): Promise<Portfolio | null> {
    try {
      // 解析复合标识符
      const parsed = parseCompositeSymbol(symbol);
      
      // 查找用户是否已持有该股票
      let holding = await this.findExistingHolding(userId, parsed.symbol, parsed.exchange);
      
      // 如果没有找到完全匹配的记录，查找legacy记录
      if (!holding) {
        holding = await this.findLegacyHolding(userId, parsed.symbol);
      }
      
      return holding || null;
    } catch (error) {
      this.logger.error(`获取特定股票持仓失败: ${userId}, ${symbol}`, error);
      throw error;
    }
  }
} 