/**
 * TradingView HTTP API 服务
 * 
 * 提供 TradingView API 的 HTTP 接口调用
 * 负责获取历史K线数据和实时报价数据
 */

import { apiClient } from '@/services/core/api';
import {
  formatToTradingViewSymbol,
  formatBatchToTradingViewSymbols,
} from '@/services/core';
import type {
  TradingViewHistoryResponse,
  TradingViewQuote,
  BatchQuoteResponse,
} from '@/types/tradingview';

/**
 * API 错误类
 */
export class TradingViewAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public url?: string
  ) {
    super(message);
    this.name = 'TradingViewAPIError';
  }
}

/**
 * TradingView HTTP Service
 * 通过自有后端 API 代理访问 TradingView HTTP 能力
 */
export class TradingViewService {
  /**
   * 获取实时报价数据（使用专用报价端点）
   * 
   * 使用 /api/quote/{symbol} 端点获取完整的报价数据，包括：
   * - 价格数据（最新价、开高低收、涨跌幅）
   * - 公司信息（名称、行业、板块）
   * - 财务数据（市值、EPS、Beta系数）
   * - 交易状态（交易时段、是否可交易）
   * 
   * @param tvSymbol TradingView 格式的 Symbol（如 'NASDAQ:AAPL'）
   * @param session 交易时段（默认: 'regular'）
   * @param fields 字段选择（默认: 'all'）
   * @returns 完整的报价数据
   * 
   * @example
   * const quote = await TradingViewService.getQuote('NASDAQ:AAPL');
   */
  async getQuote(
    tvSymbol: string,
    session: string = 'regular',
    fields: string = 'all'
  ): Promise<TradingViewQuote> {
    try {
      console.log('[TradingView] Fetching quote for:', tvSymbol);

      const quote = await apiClient.request<TradingViewQuote>(
        `/tv/quote/${encodeURIComponent(tvSymbol)}?session=${encodeURIComponent(session)}&fields=${encodeURIComponent(fields)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      console.log('[TradingView] Quote response:', {
        symbol: tvSymbol,
        price: quote.lp,
        change: quote.ch,
        changePercent: quote.chp,
        marketCap: quote.market_cap_basic,
        sector: quote.sector,
        industry: quote.industry,
        success: true
      });

      return quote;
    } catch (error) {
      console.error('[TradingView] getQuote error:', {
        symbol: tvSymbol,
        error: error instanceof Error ? error.message : String(error),
      });
      
      if (error instanceof TradingViewAPIError) {
        throw error;
      }
      
      throw new TradingViewAPIError(
        `Failed to fetch quote: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取历史K线数据
   * 
   * @param tvSymbol TradingView 格式的 Symbol（如 'NASDAQ:AAPL'）
   * @param timeframe 时间周期（'D', 'W', 'M' 等）
   * @param range 数据范围（K线数量）
   * @returns 历史K线数据
   * 
   * @example
   * const history = await TradingViewService.getHistory('NASDAQ:AAPL', 'D', 30);
   */
  async getHistory(
    tvSymbol: string,
    timeframe: string,
    range: number
  ): Promise<TradingViewHistoryResponse> {
    try {
      console.log('[TradingView Service] 📊 Fetching history:', {
        symbol: tvSymbol,
        timeframe,
        range,
      });

      const data = await apiClient.request<TradingViewHistoryResponse>(
        `/tv/price/${encodeURIComponent(tvSymbol)}?timeframe=${encodeURIComponent(timeframe)}&range=${range}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      console.log('[TradingView Service] 📈 History response:', {
        symbol: tvSymbol,
        requestedRange: range,
        requestedTimeframe: timeframe,
        receivedCount: data.history?.length || 0,
        success: data.success,
        firstCandle: data.history?.[0]?.time,
        lastCandle: data.history?.[data.history?.length - 1]?.time,
      });

      return data;
    } catch (error) {
      console.error('[TradingView] getHistory error:', {
        symbol: tvSymbol,
        timeframe,
        range,
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof TradingViewAPIError) {
        throw error;
      }

      throw new TradingViewAPIError(
        `Failed to fetch history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 搜索交易对
   * 
   * @param query 搜索关键词
   * @returns 搜索结果
   */
  async searchSymbols(query: string): Promise<any> {
    try {
      console.log('[TradingView] Searching symbols:', query);

      const data = await apiClient.request<any>(
        `/tv/search/market?query=${encodeURIComponent(query)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 15000,
        }
      );

      return data;
    } catch (error) {
      console.error('[TradingView] searchSymbols error:', error);
      throw new TradingViewAPIError(
        `Failed to search symbols: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取技术分析数据
   * 
   * @param tvSymbol TradingView 格式的 Symbol
   * @returns 技术分析数据
   */
  async getTechnicalAnalysis(tvSymbol: string): Promise<any> {
    try {
      console.log('[TradingView] Fetching technical analysis:', tvSymbol);

      const data = await apiClient.request<any>(
        `/tv/technical-analysis/${encodeURIComponent(tvSymbol)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      return data;
    } catch (error) {
      console.error('[TradingView] getTechnicalAnalysis error:', error);
      throw new TradingViewAPIError(
        `Failed to fetch technical analysis: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 获取配置信息
   * 
   * @returns API 配置
   */
  static getConfig() {
    return {
      baseUrl: 'backend-proxy',
      timeout: 10000,
      isConfigured: true,
    };
  }

  /**
   * 验证 API 连接
   * 
   * @returns 是否连接成功
   */
  async validateConnection(): Promise<boolean> {
    try {
      // 尝试搜索一个常见的 symbol 来测试连接
      await this.searchSymbols('AAPL');
      return true;
    } catch (error) {
      console.error('[TradingView] Connection validation failed:', error);
      return false;
    }
  }

  /**
   * 批量获取实时报价
   * 
   * @param symbols TradingView 格式的 symbols 数组（最多20个）
   * @param session 交易时段（默认: 'regular'）
   * @param fields 字段选择（默认: 'all'）
   * @returns 批量报价数据
   * 
   * @example
   * const quotes = await TradingViewService.getBatchQuotes(['NASDAQ:AAPL', 'NYSE:GOOGL']);
   * 
   * @throws {TradingViewAPIError} 当API请求失败时
   */
  async getBatchQuotes(
    symbols: string[],
    session: string = 'regular',
    fields: string = 'all'
  ): Promise<BatchQuoteResponse> {
    // 验证 symbols 数量（最多20个）
    if (symbols.length === 0) {
      throw new TradingViewAPIError('至少需要提供一个 symbol');
    }
    
    if (symbols.length > 20) {
      throw new TradingViewAPIError('最多支持20个 symbols 批量查询');
    }

    try {
      const result = await apiClient.request<BatchQuoteResponse>(
        '/tv/quote/batch',
        {
          method: 'POST',
          data: { symbols, session, fields },
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      if (!result.success || !Array.isArray(result.data)) {
        throw new TradingViewAPIError('Invalid batch quote response format');
      }

      return result;
    } catch (error: any) {
      console.error('[TradingView] Batch quotes error:', error);
      
      if (error instanceof TradingViewAPIError) {
        throw error;
      }
      
      throw new TradingViewAPIError(
        `批量获取报价异常: ${error.message}`
      );
    }
  }

  /**
   * 将数据库格式转换为 TradingView 格式
   * 
   * @param symbol 股票代码 (如 AAPL)
   * @param exchange 交易所 (如 NASDAQ)
   * @returns TradingView 格式 (如 NASDAQ:AAPL)
   * 
   * @example
   * const tvSymbol = tradingViewService.formatToTradingViewSymbol('AAPL', 'NASDAQ');
   * // 返回: 'NASDAQ:AAPL'
   */
  formatToTradingViewSymbol(symbol: string, exchange: string): string {
    return formatToTradingViewSymbol(symbol, exchange);
  }

  /**
   * 批量转换数据库格式为 TradingView 格式
   * 
   * @param items 包含 symbol 和 exchange 的对象数组
   * @returns TradingView 格式的 symbols 数组
   * 
   * @example
   * const items = [
   *   { symbol: 'AAPL', exchange: 'NASDAQ' },
   *   { symbol: 'GOOGL', exchange: 'NASDAQ' }
   * ];
   * const tvSymbols = tradingViewService.formatBatchToTradingViewSymbols(items);
   * // 返回: ['NASDAQ:AAPL', 'NASDAQ:GOOGL']
   */
  formatBatchToTradingViewSymbols(
    items: { symbol: string; exchange: string | null | undefined }[]
  ): string[] {
    return formatBatchToTradingViewSymbols(items);
  }
}

// 导出单例实例（参考 watchlistService.ts）
export const tradingViewService = new TradingViewService();
export default tradingViewService;

