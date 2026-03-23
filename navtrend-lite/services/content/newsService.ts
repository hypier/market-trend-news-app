/**
 * 新闻数据服务模块
 * 提供股票相关新闻获取功能
 */

import { apiClient } from '../core/api';
import { Logger, LogModule } from '@/utils/logger';
import type { TradingViewNewsItem, TradingViewNewsResponse, TradingViewNewsDetail } from '@/types/stock';

/**
 * 新闻数据服务类
 */
export class NewsService {
  /**
   * 获取股票相关新闻
   * @param symbol 股票标识符（如 'NASDAQ:AAPL'）
   * @param lang 语言代码（如 'zh-Hans', 'en'）
   * @param market 市场类型（可选，如 'stock'）
   * @returns 新闻列表
   */
  async getStockNews(
    symbol: string,
    lang: string = 'en',
    market?: string
  ): Promise<TradingViewNewsItem[]> {
    try {
      Logger.debug(LogModule.STOCK, `获取股票新闻: ${symbol}, 语言: ${lang}, market: ${market || '未指定'}`);

      const params = new URLSearchParams({
        symbol: symbol,
        lang: lang,
        ...(market && { market: market }),
      });

      const response = await apiClient.request<TradingViewNewsResponse>(
        `/tv/news?${params.toString()}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 15000,
        }
      );

      Logger.debug(LogModule.STOCK, `股票新闻获取成功: ${response.items.length} 条`);
      return response.items || [];
    } catch (error) {
      Logger.error(LogModule.STOCK, `获取股票新闻失败: ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * 获取新闻详情
   * @param newsId 新闻ID
   * @param lang 语言代码（如 'zh-Hans', 'en'）
   * @returns 新闻详情
   */
  async getNewsDetail(newsId: string, lang: string = 'en'): Promise<TradingViewNewsDetail> {
    try {
      Logger.debug(LogModule.STOCK, `获取新闻详情: ${newsId}, 语言: ${lang}`);

      const params = new URLSearchParams({
        lang: lang,
      });

      const response = await apiClient.request<TradingViewNewsDetail>(
        `/tv/news/${encodeURIComponent(newsId)}?${params.toString()}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      Logger.debug(LogModule.STOCK, `新闻详情获取成功: ${newsId}`);
      return response;
    } catch (error) {
      Logger.error(LogModule.STOCK, `获取新闻详情失败: ${newsId}:`, error);
      throw error;
    }
  }

  /**
   * 获取新闻快讯（无需symbol参数）
   * @param market 市场类型（bond/crypto/economic/etf/forex/futures/index/stock，传 'all' 或不传表示所有市场）
   * @param lang 语言代码（如 'zh-Hans', 'en'）
   * @returns 快讯新闻列表
   */
  async getNewsFlash(
    market?: 'all' | 'bond' | 'crypto' | 'economic' | 'etf' | 'forex' | 'futures' | 'index' | 'stock',
    lang: string = 'en'
  ): Promise<TradingViewNewsItem[]> {
    const marketLog = market && market !== 'all' ? `市场=${market}` : '所有市场';
    
    try {
      Logger.debug(LogModule.NEWS, `获取新闻快讯: ${marketLog}, 语言=${lang}`);

      const params = new URLSearchParams({
        lang: lang,
      });

      // 只有当 market 不是 'all' 且有值时才添加 market 参数
      if (market && market !== 'all') {
        params.append('market', market);
      }

      const response = await apiClient.request<TradingViewNewsResponse>(
        `/tv/news?${params.toString()}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 15000,
        }
      );

      Logger.debug(LogModule.NEWS, `新闻快讯获取成功: ${response.items.length} 条`);
      return response.items || [];
    } catch (error) {
      Logger.error(LogModule.NEWS, `获取新闻快讯失败: ${marketLog}:`, error);
      throw error;
    }
  }
}

// 导出单例实例
export const newsService = new NewsService();
export default newsService;
