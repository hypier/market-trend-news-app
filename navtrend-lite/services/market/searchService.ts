/**
 * 搜索数据服务模块
 * 提供市场搜索功能（股票、ETF、加密货币等）
 */

import { apiClient } from '../core/api';
import { Logger, LogModule } from '@/utils/logger';
import type { TVSearchResultItem, AssetTypeFilter } from '@/types/tradingview';

/**
 * 搜索数据服务类
 */
export class SearchService {
  /**
   * 搜索市场数据（股票、ETF、加密货币等）
   * 使用 TradingView Symbol Search API v3
   * 
   * @param query 搜索关键词
   * @param filter 资产类型筛选（可选，不传或 'undefined' 表示搜索所有类型）
   * @param lang 语言代码（默认 en）
   * @returns 搜索结果列表
   */
  async searchMarket(
    query: string,
    filter?: AssetTypeFilter,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    try {
      Logger.debug(LogModule.STOCK, `搜索市场数据: query=${query}, filter=${filter || 'undefined'}, lang=${lang}`);

      // 构建查询参数
      const params = new URLSearchParams({
        query: query.trim(),
      });

      // 添加 filter 参数（包括 undefined）
      if (filter) {
        params.append('filter', filter);
      }

      // 添加语言参数
      params.append('lang', lang);

      // apiClient.request 已经自动解包响应，直接返回 data 字段
      const results = await apiClient.request<TVSearchResultItem[]>(
        `/tv/search/market?${params.toString()}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 15000,
        }
      );

      Logger.debug(LogModule.STOCK, `市场搜索成功: 返回 ${(results || []).length} 条结果`);
      return results || [];
    } catch (error) {
      Logger.error(LogModule.STOCK, `市场搜索失败: query=${query}:`, error);
      throw error;
    }
  }

  /**
   * 搜索股票
   * @param query 搜索关键词
   * @param lang 语言代码
   * @returns 股票搜索结果
   */
  async searchStocks(
    query: string,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    return this.searchMarket(query, 'stock', lang);
  }

  /**
   * 搜索 ETF 基金
   * @param query 搜索关键词
   * @param lang 语言代码
   * @returns ETF 搜索结果
   */
  async searchFunds(
    query: string,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    return this.searchMarket(query, 'funds', lang);
  }

  /**
   * 搜索加密货币
   * @param query 搜索关键词
   * @param lang 语言代码
   * @returns 加密货币搜索结果
   */
  async searchCrypto(
    query: string,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    return this.searchMarket(query, 'crypto', lang);
  }

  /**
   * 搜索外汇
   * @param query 搜索关键词
   * @param lang 语言代码
   * @returns 外汇搜索结果
   */
  async searchForex(
    query: string,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    return this.searchMarket(query, 'forex', lang);
  }

  /**
   * 搜索期货
   * @param query 搜索关键词
   * @param lang 语言代码
   * @returns 期货搜索结果
   */
  async searchFutures(
    query: string,
    lang: string = 'en'
  ): Promise<TVSearchResultItem[]> {
    return this.searchMarket(query, 'futures', lang);
  }
}

// 导出单例实例
export const searchService = new SearchService();
export default searchService;

