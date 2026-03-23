/**
 * Analytics Hook
 * 
 * 🔔 特殊说明：
 * 这个 Hook 直接调用 analyticsService，而不是通过 Store。
 * 这是合理的设计，因为：
 * 1. Analytics 是横切关注点（Cross-Cutting Concern），不是核心业务数据
 * 2. 只做事件上报，不管理应用状态
 * 3. 不需要全局共享状态或组件间通信
 * 4. 避免不必要的 Store 层抽象，保持架构简洁
 * 
 * 架构决策：
 * - ✅ Analytics 直接调用 Service 层
 * - ❌ 不需要创建 AnalyticsStore
 * - 适用场景：日志、监控、统计等横切关注点
 * 
 * @see https://en.wikipedia.org/wiki/Cross-cutting_concern
 */

import { useCallback } from 'react';
import { analyticsService } from '@/services/system/analyticsService';
import { useWealthStore , useWatchlistStore , useAuthStore } from '@/stores';
import { Logger, LogModule } from '@/utils/logger';

export interface StockViewEventData {
  symbol: string;
  market: string;
  source?: string;
  timestamp?: string;
}

export const useAnalytics = () => {
  const { enhancedPositions } = useWealthStore();
  const { watchlist } = useWatchlistStore();
  const { isAuthenticated } = useAuthStore();

  /**
   * 记录股票查看事件
   */
  const logStockView = useCallback(async (symbol: string, market: string, data?: Partial<StockViewEventData>) => {
    try {
      await analyticsService.logViewItem(symbol, market);
      Logger.info(LogModule.ANALYTICS, '📊 Analytics: 股票查看事件已记录', { symbol, market, ...data });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 股票查看事件记录失败', error);
    }
  }, []);

  /**
   * 记录搜索股票事件
   */
  const logSearchStocks = useCallback(async (query: string) => {
    try {
      await analyticsService.logSearchStocks(query);
      Logger.info(LogModule.ANALYTICS, '🔍 Analytics: 搜索股票事件已记录', { query });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 搜索股票事件记录失败', error);
    }
  }, []);

  /**
   * 记录首次添加持仓事件（全局首次）
   */
  const logFirstAddPosition = useCallback(async (symbol: string) => {
    try {
      const isGlobalFirstPosition = enhancedPositions.length === 0;
      if (isGlobalFirstPosition) {
        await analyticsService.logFirstAdd(symbol);
        Logger.info(LogModule.ANALYTICS, '🎉 Analytics: 全局首次添加持仓事件已记录', { symbol });
      } else {
        // 不是全局首次，但是新股票首次添加，也需要记录
        await analyticsService.logAddBuy(symbol);
        Logger.info(LogModule.ANALYTICS, '📈 Analytics: 新股票首次添加事件已记录', { symbol });
      }
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 首次添加持仓事件记录失败', error);
    }
  }, [enhancedPositions]);

  /**
   * 记录增持事件（对已有持仓的股票进行增持）
   */
  const logAddBuyPosition = useCallback(async (symbol: string, isFirstTimeForThisStock: boolean) => {
    try {
      if (!isFirstTimeForThisStock) {
        await analyticsService.logAddBuy(symbol);
        Logger.info(LogModule.ANALYTICS, '📈 Analytics: 增持事件已记录', { symbol });
      } else {
        Logger.info(LogModule.ANALYTICS, 'ℹ️ Analytics: 跳过增持事件记录（首次添加该股票）', { symbol });
      }
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 增持事件记录失败', error);
    }
  }, []);

  /**
   * 记录减持事件
   */
  const logReducePosition = useCallback(async (symbol: string) => {
    try {
      await analyticsService.logAddShell(symbol);
      Logger.info(LogModule.ANALYTICS, '📉 Analytics: 减持事件已记录', { symbol });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 减持事件记录失败', error);
    }
  }, []);

  /**
   * 记录首次添加关注事件
   */
  const logFirstWatchlist = useCallback(async (symbol: string) => {
    try {
      const isFirstWatchlist = !isAuthenticated || watchlist.length === 0;
      if (isFirstWatchlist) {
        await analyticsService.logFirstWatchlist(symbol);
        Logger.info(LogModule.ANALYTICS, '⭐ Analytics: 首次添加关注事件已记录', { symbol });
      }
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 首次添加关注事件记录失败', error);
    }
  }, [watchlist, isAuthenticated]);

  /**
   * 记录添加关注事件
   */
  const logAddWatchlist = useCallback(async (symbol: string) => {
    try {
      await analyticsService.logAddWatchlist(symbol);
      Logger.info(LogModule.ANALYTICS, '👁️ Analytics: 添加关注事件已记录', { symbol });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 添加关注事件记录失败', error);
    }
  }, []);

  /**
   * 记录查看新闻事件
   */
  const logViewNews = useCallback(async (newsId: string, newsTitle?: string) => {
    try {
      await analyticsService.logViewNews(newsId, newsTitle);
      Logger.info(LogModule.ANALYTICS, '📰 Analytics: 查看新闻事件已记录', { newsId, newsTitle });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 查看新闻事件记录失败', error);
    }
  }, []);

  /**
   * 记录点击Banner事件
   */
  const logBannerClick = useCallback(async (bannerId: string, bannerUrl?: string) => {
    try {
      await analyticsService.logBannerClicks(bannerId, bannerUrl);
      Logger.info(LogModule.ANALYTICS, '🔥 Analytics: Banner点击事件已记录', { bannerId, bannerUrl });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: Banner点击事件记录失败', error);
    }
  }, []);

  /**
   * 记录点击弹窗事件
   */
  const logDialogViewClick = useCallback(async (bannerId: string, bannerUrl?: string) => {
    try {
      await analyticsService.logDialogView(bannerId, bannerUrl);
      Logger.info(LogModule.ANALYTICS, '💬 Analytics: 弹窗点击事件已记录', { bannerId, bannerUrl });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 弹窗点击事件记录失败', error);
    }
  }, []);

  /**
   * 记录完成注册事件
   */
  const logCompleteRegistration = useCallback(async (method: 'google' | 'apple' | 'one_click') => {
    try {
      await analyticsService.logCompleteRegistration(method);
      Logger.info(LogModule.ANALYTICS, '🎊 Analytics: 完成注册事件已记录', { method });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 完成注册事件记录失败', error);
    }
  }, []);

  /**
   * 记录用户登录事件
   */
  const logUserLogin = useCallback(async (method: 'google' | 'apple' | 'one_click') => {
    try {
      await analyticsService.logLogin(method);
      Logger.info(LogModule.ANALYTICS, '🔑 Analytics: 用户登录事件已记录', { method });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 用户登录事件记录失败', error);
    }
  }, []);

  /**
   * 记录联系添加事件（价值回传）
   */
  const logContactAdd = useCallback(async (value: number, currency: string = 'USD', additionalParams?: Record<string, any>) => {
    try {
      await analyticsService.logContactAdd(value, currency, additionalParams);
      Logger.info(LogModule.ANALYTICS, '💰 Analytics: 联系添加事件已记录', { value, currency, additionalParams });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 联系添加事件记录失败', error);
    }
  }, []);



  const logSearch = useCallback(async (query: string, data?: Partial<StockViewEventData>) => {
    try {
      await analyticsService.logSearchStocks(query);
      Logger.info(LogModule.ANALYTICS, '🔍 Analytics: 搜索事件已记录', { query, ...data });
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 搜索事件记录失败', error);
    }
  }, []);

  return {
    // 业务事件方法
    logStockView,
    logSearchStocks,
    logFirstAddPosition,
    logAddBuyPosition,
    logReducePosition,
    logFirstWatchlist,
    logAddWatchlist,
    logViewNews,
    logBannerClick,
    logDialogViewClick,
    logCompleteRegistration,
    logUserLogin,
    logContactAdd,

    // 验证和调试方法
    logSearch,
  };
};