/**
 * 新闻数据状态管理
 * 使用 Zustand 管理新闻相关的全局状态
 */

import { create } from 'zustand';
import { newsService } from '@/services/content/newsService';
import { Logger, LogModule } from '@/utils/logger';
import { getCurrentLanguage } from '@/config/i18n';
import type { TradingViewNewsItem, TradingViewNewsDetail } from '@/types/stock';

interface NewsState {
  // 数据状态
  stockNews: Record<string, TradingViewNewsItem[]>; // 按股票symbol存储新闻
  newsDetail: Record<string, TradingViewNewsDetail>; // 新闻详情缓存
  newsFlash: Record<string, TradingViewNewsItem[]>; // 快讯新闻（按市场类型存储）
  
  // 加载状态
  isLoading: {
    stockNews: boolean;
    newsDetail: boolean;
    newsFlash: boolean;
  };
  
  // 错误状态
  error: string | null;
  
  // Actions
  fetchStockNews: (symbol: string, exchange: string, market?: string) => Promise<void>;
  fetchNewsDetail: (newsId: string) => Promise<void>;
  fetchNewsFlash: (market: string) => Promise<void>;
  clearStockNews: (symbol: string) => void;
  clearNewsFlash: (market: string) => void;
  clearAllNews: () => void;
  reset: () => void;
}

export const useNewsStore = create<NewsState>((set, get) => ({
  // 初始状态
  stockNews: {},
  newsDetail: {},
  newsFlash: {},
  
  isLoading: {
    stockNews: false,
    newsDetail: false,
    newsFlash: false,
  },
  
  error: null,
  
  /**
   * 获取股票相关新闻
   * @param symbol 股票代码
   * @param exchange 交易所代码
   * @param market 市场类型（可选）
   */
  fetchStockNews: async (symbol: string, exchange: string, market?: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, stockNews: true },
        error: null,
      }));
      
      // 构建复合标识符
      const compositeSymbol = `${exchange}:${symbol}`;
      const cacheKey = compositeSymbol;
      
      // 获取当前语言
      const currentLang = getCurrentLanguage();
      // 映射到 TradingView 支持的语言格式
      const tvLang = currentLang === 'zh' ? 'zh-Hans' : currentLang;
      
      // 调用服务获取新闻
      const news = await newsService.getStockNews(compositeSymbol, tvLang, market);
      
      set(state => ({
        stockNews: {
          ...state.stockNews,
          [cacheKey]: news,
        },
        isLoading: { ...state.isLoading, stockNews: false },
      }));
      
      Logger.info(LogModule.STOCK, `✅ 新闻加载成功 (${cacheKey}): ${news.length} 条`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load news';
      Logger.error(LogModule.STOCK, '❌ 新闻加载失败:', error);
      
      set(state => ({
        error: errorMessage,
        isLoading: { ...state.isLoading, stockNews: false },
      }));
    }
  },
  
  /**
   * 获取新闻详情
   * @param newsId 新闻ID
   */
  fetchNewsDetail: async (newsId: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, newsDetail: true },
        error: null,
      }));
      
      // 获取当前语言
      const currentLang = getCurrentLanguage();
      // 映射到 TradingView 支持的语言格式
      const tvLang = currentLang === 'zh' ? 'zh-Hans' : currentLang;
      
      // 调用服务获取新闻详情
      const detail = await newsService.getNewsDetail(newsId, tvLang);
      
      set(state => ({
        newsDetail: {
          ...state.newsDetail,
          [newsId]: detail,
        },
        isLoading: { ...state.isLoading, newsDetail: false },
      }));
      
      Logger.info(LogModule.STOCK, `✅ 新闻详情加载成功 (${newsId}): 语言=${tvLang}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load news detail';
      Logger.error(LogModule.STOCK, '❌ 新闻详情加载失败:', error);
      
      set(state => ({
        error: errorMessage,
        isLoading: { ...state.isLoading, newsDetail: false },
      }));
    }
  },
  
  /**
   * 获取新闻快讯
   * @param market 市场类型（'all' 表示所有市场）
   */
  fetchNewsFlash: async (market: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, newsFlash: true },
        error: null,
      }));
      
      const cacheKey = market;
      
      // 获取当前语言
      const currentLang = getCurrentLanguage();
      // 映射到 TradingView 支持的语言格式
      const tvLang = currentLang === 'zh' ? 'zh-Hans' : currentLang;
      
      // 调用服务获取快讯新闻
      const news = await newsService.getNewsFlash(
        market as 'all' | 'bond' | 'crypto' | 'economic' | 'etf' | 'forex' | 'futures' | 'index' | 'stock',
        tvLang
      );
      
      set(state => ({
        newsFlash: {
          ...state.newsFlash,
          [cacheKey]: news,
        },
        isLoading: { ...state.isLoading, newsFlash: false },
      }));
      
      Logger.info(LogModule.NEWS, `✅ 快讯新闻加载成功 (${market}): ${news.length} 条`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load news flash';
      Logger.error(LogModule.NEWS, '❌ 快讯新闻加载失败:', error);
      
      set(state => ({
        error: errorMessage,
        isLoading: { ...state.isLoading, newsFlash: false },
      }));
    }
  },
  
  /**
   * 清除特定股票的新闻缓存
   * @param symbol 复合标识符（如 'NASDAQ:AAPL'）
   */
  clearStockNews: (symbol: string) => {
    set(state => {
      const newStockNews = { ...state.stockNews };
      delete newStockNews[symbol];
      return { stockNews: newStockNews };
    });
  },
  
  /**
   * 清除特定市场的快讯新闻缓存
   * @param market 市场类型
   */
  clearNewsFlash: (market: string) => {
    set(state => {
      const newNewsFlash = { ...state.newsFlash };
      delete newNewsFlash[market];
      return { newsFlash: newNewsFlash };
    });
  },
  
  /**
   * 清除所有新闻缓存
   */
  clearAllNews: () => {
    set({
      stockNews: {},
      newsDetail: {},
      newsFlash: {},
    });
  },
  
  /**
   * 重置状态
   */
  reset: () => {
    set({
      stockNews: {},
      newsDetail: {},
      newsFlash: {},
      isLoading: {
        stockNews: false,
        newsDetail: false,
        newsFlash: false,
      },
      error: null,
    });
  },
}));
