/**
 * 投资组合服务模块
 * 
 * 提供投资组合相关的基础功能，包括持仓管理和投资组合概览。
 * 
 * 主要特性：
 * - 持仓管理（增删改查）
 * - 投资组合概览和统计
 * - 货币转换功能（合并自 portfolioCurrencyUtils）
 * - 智能缓存策略优化性能
 * 
 * 缓存策略：
 * - 持仓列表：2分钟缓存，平衡实时性和性能
 * - 投资组合概览：5分钟缓存，统计数据相对稳定
 * 
 * @author MarketNews Team
 * @version 1.1.0
 */

import { apiClient } from '../core/api';
import { Logger, LogModule } from '@/utils/logger';
import { exchangeRateService } from '@/services/market/exchangeRateService';
import { formatPrice } from '@/utils/currencyFormatter';
import { tradingViewService } from '@/services/market/tradingView/tradingViewService';
import type { 
  Position, 
  PortfolioStats,
  EnhancedPosition,
} from '@/types/portfolio';

/**
 * 后端返回的基础持仓数据（对应数据库字段）
 */
interface BaseHolding {
  id: string;
  userId: string;
  symbol: string;
  exchange: string | null;
  country: string | null;
  shares: string;
  avgCost: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * 前端enriched后的持仓数据（包含报价信息）
 */
interface EnrichedHolding extends BaseHolding {
  // Logo 相关字段（从 TradingView quote 获取）
  logoid?: string;
  baseCurrencyLogoid?: string;
  currencyLogoid?: string;
  quote?: {
    symbol: string;
    exchange: string;
    name: string;
    price: number;
    previousClose: number;
    change: number;
    changePercent: number;
    currency: string;
  };
}



/**
 * 投资组合服务类
 * 
 * 提供投资组合相关的数据管理功能，包括：
 * - 持仓的增删改查
 * - 投资组合概览和统计
 * - 缓存管理和数据同步
 * 
 * 使用示例：
 * ```typescript
 * import { portfolioService } from './services/portfolioService';
 * 
 * // 获取持仓列表
 * const holdings = await portfolioService.getHoldings();
 * 
 * // 添加持仓
 * await portfolioService.addHolding({
 *   symbol: 'AAPL',
 *   shares: '100',
 *   avgCost: '150.00'
 * });
 * 
 * // 获取投资组合概览
 * const overview = await portfolioService.getOverview();
 * ```
 */
export class PortfolioService {
  /**
   * 获取投资组合概览（不含市场数据）
   * 
   * 获取基础的持仓列表和统计信息
   * 
   * @returns 持仓概览数据（按创建时间降序排列，新加入的排在最前面）
   */
  async getPortfolioOverview(): Promise<{
    holdingsCount: number;
    totalInvestment: string;
    totalSharesCount: string;
    holdings: BaseHolding[];
  }> {
    try {
      Logger.debug(LogModule.PORTFOLIO, 'Fetching portfolio overview');
      
      // 调用API获取基础持仓概览（不含市场数据）
      const endpoint = `/portfolio/overview`;
      const response = await apiClient.request<any>(endpoint, {
        version: 'v1' // 指定使用V1版本API
      });
      
      // ✅ 按创建时间降序排序（新加入的排在最前面）
      if (response.holdings && Array.isArray(response.holdings)) {
        response.holdings.sort((a: BaseHolding, b: BaseHolding) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA; // 降序：最新的在前
        });
      }
      
      Logger.debug(LogModule.PORTFOLIO, `Portfolio overview fetched (${response.holdingsCount} holdings, sorted by newest first)`);
      return response;
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, 'Failed to fetch portfolio overview:', error);
      throw error;
    }
  }

  /**
   * 转换enriched后的持仓数据到前端使用的EnhancedPosition格式
   * 
   * @param holdings enriched后的持仓数据（包含报价信息）
   * @returns 转换后的增强持仓数据
   */
  transformToEnhancedPositions(holdings: EnrichedHolding[]): EnhancedPosition[] {
    if (!holdings || !Array.isArray(holdings) || holdings.length === 0) {
      return [];
    }
    
    return holdings.map(holding => {
      // 从holding中提取基础持仓信息
      const position: Position = {
        id: holding.id,
        portfolioId: holding.userId || 'default', // 使用userId作为portfolioId
        symbol: holding.symbol,
        name: holding.quote?.name || holding.symbol, // 使用quote中的name或fallback到symbol
        currency: holding.quote?.currency || 'USD',
        quantity: parseFloat(holding.shares),
        averagePrice: parseFloat(holding.avgCost),
        currentPrice: holding.quote?.price || parseFloat(holding.avgCost),
        totalCost: parseFloat(holding.shares) * parseFloat(holding.avgCost),
        marketValue: parseFloat(holding.shares) * (holding.quote?.price || parseFloat(holding.avgCost)),
        unrealizedGain: parseFloat(holding.shares) * ((holding.quote?.price || 0) - parseFloat(holding.avgCost)),
        unrealizedGainPercent: ((holding.quote?.price || 0) / parseFloat(holding.avgCost) - 1) * 100,
        realizedGain: 0, // 默认为0
        firstPurchaseDate: typeof holding.createdAt === 'string' ? holding.createdAt : holding.createdAt.toISOString(),
        lastUpdateDate: typeof holding.updatedAt === 'string' ? holding.updatedAt : holding.updatedAt.toISOString(),
        exchange: holding.exchange || '',
        transactions: [], // 默认为空数组
      };
      
      // 创建增强持仓数据
      const enhancedPosition: EnhancedPosition = {
        ...position,
        // 增强字段
        gainLoss: position.unrealizedGain,
        gainLossPercent: position.unrealizedGainPercent,
        isPositive: position.unrealizedGain >= 0,
        quantityDisplay: position.quantity.toFixed(2),
        gainLossDisplay: position.unrealizedGain.toFixed(2),
        companyName: holding.quote?.name || holding.symbol,
        // ✅ Logo 字段（从 holding 中传递）
        logoid: (holding as any).logoid,
        baseCurrencyLogoid: (holding as any).baseCurrencyLogoid,
        currencyLogoid: (holding as any).currencyLogoid,
        // ✅ 价格精度字段（从 holding 中传递）
        pricescale: (holding as any).pricescale,
      };
      
      return enhancedPosition;
    });
  }
  
  /**
   * 计算投资组合统计数据
   * 
   * @param data enriched后的投资组合数据（包含报价信息）
   * @returns 计算后的投资组合统计
   */
  calculatePortfolioStats(
    data: {
      holdingsCount: number;
      totalInvestment: string;
      totalSharesCount: string;
      holdings: EnrichedHolding[];
    }
  ): PortfolioStats {
    // 如果数据为空，返回默认值
    if (!data || !data.holdings) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayGain: 0,
        dayGainPercent: 0,
        cashBalance: 0,
        assetAllocation: [],
        topHoldings: [],
        recentTransactions: []
      };
    }
    
    // 计算总成本和总市值
    let totalCost = 0;
    let totalValue = 0;
    let dayGain = 0;
    
    // 遍历持仓数据计算总值
    data.holdings.forEach(holding => {
      const quantity = parseFloat(holding.shares);
      const avgCost = parseFloat(holding.avgCost);
      const currentPrice = holding.quote?.price || avgCost;
      const previousClose = holding.quote?.previousClose || currentPrice;
      
      const positionCost = quantity * avgCost;
      const positionValue = quantity * currentPrice;
      const positionDayGain = quantity * (currentPrice - previousClose);
      
      totalCost += positionCost;
      totalValue += positionValue;
      dayGain += positionDayGain;
    });
    
    // 计算收益
    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayGainPercent = totalValue > 0 ? (dayGain / totalValue) * 100 : 0;
    
    // 构建统计数据
    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayGain,
      dayGainPercent,
      cashBalance: 0, // 默认为0
      assetAllocation: [], // 默认为空
      topHoldings: [], // 默认为空
      recentTransactions: [] // 默认为空
    };
  }
  
  /**
   * 调整持仓（增持或减持）- V2接口
   * 
   * @param symbol 股票代码（复合标识符格式，如 AAPL:NASDAQ）
   * @param changeShares 股数变化量（正数表示增持，负数表示减持）
   * @param transactionPrice 交易价格
   * @returns 调整后的持仓信息
   */
  async adjustPosition(
    symbol: string,
    changeShares: number,
    transactionPrice: number
  ): Promise<any> {
    try {
      const response = await apiClient.request<any>('/portfolio/adjust-position', {
        method: 'POST',
        data: {
          symbol,
          changeShares,
          transactionPrice,
        },
        version: 'v1' // 指定使用V1版本API
      });

      Logger.debug(LogModule.PORTFOLIO, `Position adjusted successfully for ${symbol}`);
      return response;
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, `Failed to adjust position for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 处理投资组合数据的货币转换
   * 
   * 合并自 portfolioCurrencyUtils.ts
   * 
   * @param portfolioData 原始投资组合数据
   * @param targetCurrency 目标货币
   * @returns 转换后的投资组合数据
   */
  async convertToCurrency(portfolioData: any, targetCurrency: string): Promise<any> {
    if (!portfolioData || !portfolioData.holdings || portfolioData.holdings.length === 0) {
      return portfolioData;
    }

    try {
      // 1. 收集所有需要转换的货币
      const currencies = new Set<string>();
      
      // 添加美元（用于totalInvestment和avgCost的转换）
      currencies.add('USD');
      
      // 添加持仓项的货币
      portfolioData.holdings.forEach((holding: any) => {
        if (holding.quote && holding.quote.currency) {
          currencies.add(holding.quote.currency);
        }
      });

      // 2. 批量获取所有需要的汇率（Service 层调用 Service 层）
      const rateMap = await exchangeRateService.batchGetExchangeRates(
        Array.from(currencies),
        targetCurrency
      );

      // 3. 转换投资组合总投资金额（美元到目标货币）
      const usdToTargetRate = rateMap['USD'] || 1;
      const totalInvestmentNum = parseFloat(portfolioData.totalInvestment) || 0;
      const convertedTotalInvestment = totalInvestmentNum * usdToTargetRate;
      
      // 4. 转换每个持仓项
      const convertedHoldings = portfolioData.holdings.map((holding: any) => {
        // 深拷贝持仓项，避免修改原始数据
        const convertedHolding = JSON.parse(JSON.stringify(holding));
        
        // 获取持仓项的原始货币
        const currency = holding.quote?.currency || 'USD';
        
        // 获取该货币到目标货币的汇率
        const rate = rateMap[currency] || 1;
        
        // 转换平均成本（美元到目标货币）- 始终转换，因为后端返回的avgCost是美元
        convertedHolding.avgCost = (parseFloat(holding.avgCost) * usdToTargetRate).toString();
        
        // 如果有报价数据，转换价格
        if (convertedHolding.quote) {
          // 保存原始货币信息
          convertedHolding.quote.originalCurrency = currency;
          convertedHolding.quote.originalPrice = convertedHolding.quote.price;
          
          // 转换价格 - 使用对应货币的汇率
          convertedHolding.quote.price = convertedHolding.quote.price * rate;
          
          // 更新货币为目标货币
          convertedHolding.quote.currency = targetCurrency;
          
          // 转换其他价格数据
          if (convertedHolding.quote.open) {
            convertedHolding.quote.open = convertedHolding.quote.open * rate;
          }
          if (convertedHolding.quote.high) {
            convertedHolding.quote.high = convertedHolding.quote.high * rate;
          }
          if (convertedHolding.quote.low) {
            convertedHolding.quote.low = convertedHolding.quote.low * rate;
          }
          if (convertedHolding.quote.previousClose) {
            convertedHolding.quote.previousClose = convertedHolding.quote.previousClose * rate;
          }
          if (convertedHolding.quote.change) {
            convertedHolding.quote.change = convertedHolding.quote.change * rate;
          }
        }
        
        return convertedHolding;
      });

      // 5. 返回转换后的数据
      return {
        ...portfolioData,
        totalInvestment: convertedTotalInvestment.toString(),
        holdings: convertedHoldings,
        // 添加货币转换信息
        currencyInfo: {
          targetCurrency,
          exchangeRates: rateMap,
          originalCurrency: 'USD' // 后端返回的总投资额原始货币是美元
        }
      };
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, 'Failed to convert portfolio currency:', error);
      return portfolioData; // 如果转换失败，返回原始数据
    }
  }

  /**
   * 批量获取持仓的报价数据
   * 
   * 从 wealthStore 移动到 Service 层
   * 
   * @param holdings 持仓数据列表
   * @returns 报价数据映射（key: TradingView符号，value: 报价数据）
   */
  async fetchBatchQuotesForHoldings(holdings: any[]): Promise<Record<string, any>> {
    // 过滤掉没有 exchange 的项
    const holdingsWithExchange = holdings.filter(h => h.exchange);
    if (holdingsWithExchange.length < holdings.length) {
      Logger.warn(LogModule.PORTFOLIO, `${holdings.length - holdingsWithExchange.length} holdings without exchange excluded`);
    }
    
    if (holdingsWithExchange.length === 0) {
      return {};
    }
    
    const tvSymbols = tradingViewService.formatBatchToTradingViewSymbols(
      holdingsWithExchange.map(h => ({ symbol: h.symbol, exchange: h.exchange }))
    );
    
    const quotesMap: Record<string, any> = {};
    const BATCH_SIZE = 20;
    const batches: string[][] = [];
    
    // 分批处理
    for (let i = 0; i < tvSymbols.length; i += BATCH_SIZE) {
      batches.push(tvSymbols.slice(i, i + BATCH_SIZE));
    }
    
    try {
      // 并行请求所有批次
      const batchPromises = batches.map(batch => 
        tradingViewService.getBatchQuotes(batch).catch(err => {
          Logger.warn(LogModule.PORTFOLIO, `批次请求失败:`, err);
          return { success: false, total: 0, successful: 0, failed: batch.length, data: [] };
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      
      // 合并所有批次的结果
      batchResults.forEach(batchQuotesResponse => {
        if (batchQuotesResponse.success && batchQuotesResponse.data) {
          batchQuotesResponse.data.forEach(result => {
            if (result.success && result.data) {
              quotesMap[result.symbol] = result.data;
            }
          });
        }
      });
    } catch (error) {
      Logger.warn(LogModule.PORTFOLIO, '批量获取报价失败，将使用基础数据:', error);
    }
    
    return quotesMap;
  }

  /**
   * 合并持仓数据和报价数据
   * 
   * 从 wealthStore 移动到 Service 层
   * 
   * @param holdings 持仓数据列表
   * @param quotesMap 报价数据映射
   * @returns 合并后的持仓数据
   */
  enrichHoldingsWithQuotes(
    holdings: any[], 
    quotesMap: Record<string, any>
  ): any[] {
    return holdings.map(holding => {
      const tvSymbol = holding.exchange 
        ? `${holding.exchange}:${holding.symbol}` 
        : holding.symbol;
      
      const quote = quotesMap[tvSymbol];
      
      if (quote) {
        return {
          ...holding,
          logoid: quote.logoid,
          baseCurrencyLogoid: quote['base-currency-logoid'],
          currencyLogoid: quote['currency-logoid'],
          pricescale: quote.pricescale, // ✅ 新增：提取到顶层
          quote: {
            symbol: holding.symbol,
            exchange: holding.exchange || '',
            name: quote.description || quote.local_description || holding.symbol,
            price: quote.lp || 0,
            previousClose: quote.prev_close_price || 0,
            change: quote.ch || 0,
            changePercent: quote.chp || 0,
            volume: quote.volume || 0,
            open: quote.open_price || 0,
            high: quote.high_price || 0,
            low: quote.low_price || 0,
            currency: quote.currency_code || 'USD',
            pricescale: quote.pricescale, // ✅ 保留在 quote 中
          },
        };
      }
      
      // 如果没有报价数据，返回基础持仓信息
      return {
        ...holding,
        quote: {
          symbol: holding.symbol,
          exchange: holding.exchange || '',
          name: holding.symbol,
          price: 0,
          previousClose: 0,
          change: 0,
          changePercent: 0,
          volume: 0,
          open: 0,
          high: 0,
          low: 0,
          currency: 'USD',
          pricescale: 0,
        },
      };
    });
  }

  /**
   * 格式化投资组合数据中的货币金额
   * 
   * 合并自 portfolioCurrencyUtils.ts
   * 
   * @param portfolioData 投资组合数据
   * @param targetCurrency 目标货币
   * @returns 格式化后的投资组合数据
   */
  formatPrices(portfolioData: any, targetCurrency: string): any {
    if (!portfolioData || !portfolioData.holdings) {
      return portfolioData;
    }

    // 格式化总投资金额
    const formattedTotalInvestment = formatPrice(
      parseFloat(portfolioData.totalInvestment), 
      targetCurrency
    );

    // 格式化持仓项
    const formattedHoldings = portfolioData.holdings.map((holding: any) => {
      const formattedHolding = { ...holding };
      
      // 格式化平均成本
      formattedHolding.formattedAvgCost = formatPrice(
        parseFloat(holding.avgCost), 
        targetCurrency
      );
      
      // 如果有报价数据，格式化价格
      if (formattedHolding.quote) {
        formattedHolding.quote.formattedPrice = formatPrice(
          formattedHolding.quote.price, 
          targetCurrency
        );
        
        // 格式化其他价格数据
        if (formattedHolding.quote.open) {
          formattedHolding.quote.formattedOpen = formatPrice(
            formattedHolding.quote.open, 
            targetCurrency
          );
        }
        
        if (formattedHolding.quote.change) {
          const isPositive = formattedHolding.quote.change >= 0;
          formattedHolding.quote.formattedChange = `${isPositive ? '+' : ''}${formatPrice(
            formattedHolding.quote.change, 
            targetCurrency
          )}`;
        }
      }
      
      return formattedHolding;
    });

    return {
      ...portfolioData,
      formattedTotalInvestment,
      holdings: formattedHoldings
    };
  }
}

export const portfolioService = new PortfolioService(); export default portfolioService;
