/**
 * 股票详情数据管理 Hook
 * 
 * 统一管理股票详情页的所有数据加载逻辑：
 * - TradingView 市场数据（报价、历史、股票信息）
 * - WebSocket 实时更新
 * - 业务数据（持仓、关注状态）
 * - 新闻数据
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useFocusEffect } from 'expo-router';
import { useTradingViewStore, useStockDetailStore, useNewsStore, useAuthStore } from '@/stores';
import { useAnalytics } from '@/hooks/useAnalytics';
import { debounce } from '@/hooks/useDebounce';
import { Logger, LogModule } from '@/utils/logger';

interface UseStockDetailDataParams {
  symbol: string;
  exchange: string;
  market?: string;
  currentPeriod?: string; // 🔥 当前图表周期，用于 WebSocket 订阅
}

export function useStockDetailData({ 
  symbol, 
  exchange, 
  market,
  currentPeriod = '1day' // 🔥 默认1天周期
}: UseStockDetailDataParams) {
  const { logStockView } = useAnalytics();
  const newsLoadAttempted = useRef<Record<string, boolean>>({});

  // ===== TradingView Store - 市场数据 =====
  // 🔥 修复：使用稳定的选择器，避免函数引用变化导致无限重渲染
  const tvQuote = useTradingViewStore(state => state.quote);
  const tvHistory = useTradingViewStore(state => state.history);
  const tvStockInfo = useTradingViewStore(state => state.stockInfo);
  const tvLoading = useTradingViewStore(state => state.isLoading);
  const tvError = useTradingViewStore(state => state.error);
  const fetchQuote = useTradingViewStore(state => state.fetchQuote);
  const fetchHistory = useTradingViewStore(state => state.fetchHistory);
  const connectWebSocket = useTradingViewStore(state => state.connectWebSocket);
  const disconnectWebSocket = useTradingViewStore(state => state.disconnectWebSocket);
  const subscribePrice = useTradingViewStore(state => state.subscribePrice);
  const unsubscribeAll = useTradingViewStore(state => state.unsubscribeAll);

  // ===== Stock Detail Store - 业务数据 =====
  const {
    selectedTab,
    isFavorite,
    isUpdatingWatchlist,
    isCheckingWatchlist,
    isRefreshing,
    error: businessError,
    isLoading: businessLoading,
    setSelectedTab,
    initializeBusinessData,
    refreshBusinessData,
    handleFavoritePress,
  } = useStockDetailStore();
  
  // ===== Auth Store - 认证状态 =====
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // ===== News Store - 新闻数据 =====
  const {
    stockNews,
    isLoading: newsLoading,
    error: newsError,
    fetchStockNews,
  } = useNewsStore();

  // 计算复合标识符
  const compositeSymbol = symbol.includes(':')
    ? symbol
    : `${exchange || tvQuote?.exchange || 'NASDAQ'}:${symbol}`;

  // 初始化所有数据
  const initializeAllData = useCallback(async () => {
    if (!symbol) return;

    Logger.info(LogModule.STOCK, '🚀 [Hook] 开始加载股票数据', { symbol, exchange, period: currentPeriod });

    // 并行加载市场数据和业务数据
    // 🔥 修复：使用传入的 currentPeriod 而不是固定的 '1M'
    await Promise.allSettled([
      fetchQuote(symbol, exchange),
      fetchHistory(symbol, exchange, currentPeriod),
      initializeBusinessData(symbol, exchange),
    ]);

    Logger.info(LogModule.STOCK, '✅ [Hook] 股票数据加载完成', { symbol });

    // 记录股票查看事件
    try {
      logStockView(symbol, 'US', {
        source: 'stock_detail_page',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      Logger.warn(LogModule.STOCK, 'Failed to log stock view event:', error);
    }
  }, [symbol, exchange, currentPeriod, fetchQuote, fetchHistory, initializeBusinessData, logStockView]);

  // ❌ 移除 setupWebSocket useCallback，直接在 useEffect 中执行
  // 原因：避免闭包陷阱，确保使用最新的 Store 函数引用

  // 加载新闻数据
  const fetchNews = useCallback(async () => {
    if (!symbol) return;

    let symbolToUse: string;
    let exchangeToUse: string;

    if (symbol.includes(':')) {
      const parts = symbol.split(':');
      exchangeToUse = parts[0];
      symbolToUse = parts[1];
    } else {
      symbolToUse = symbol;
      exchangeToUse = exchange || tvQuote?.exchange || 'NASDAQ';
    }

    Logger.info(LogModule.STOCK, `📰 [Hook] 准备加载新闻: ${symbolToUse}, exchange: ${exchangeToUse}`);
    await fetchStockNews(symbolToUse, exchangeToUse, market);
  }, [symbol, exchange, tvQuote?.exchange, market, fetchStockNews]);

  // 手动重试加载新闻
  const handleRetryNews = useCallback(() => {
    Logger.info(LogModule.STOCK, `📰 [Hook] 用户手动重试加载新闻: ${compositeSymbol}`);
    newsLoadAttempted.current[compositeSymbol] = false;
    fetchNews();
  }, [compositeSymbol, fetchNews]);

  // 刷新所有数据
  const refreshAllData = useCallback(async () => {
    await Promise.all([
      fetchQuote(symbol, exchange),
      fetchHistory(symbol, exchange, '1M'),
      refreshBusinessData(symbol, exchange),
    ]);
  }, [symbol, exchange, fetchQuote, fetchHistory, refreshBusinessData]);

  // ===== 性能优化：防抖版本的 fetchHistory =====
  // 避免快速切换 period 时触发大量请求
  const debouncedFetchHistory = useMemo(
    () => debounce((sym: string, exch: string, period: string) => {
      Logger.info(LogModule.STOCK, '📊 [Hook] 防抖后执行 fetchHistory', { sym, exch, period });
      fetchHistory(sym, exch, period);
    }, 300),
    [fetchHistory]
  );

  // 初始化数据（只在 symbol/exchange 变化时触发）
  useEffect(() => {
    if (symbol) {
      initializeAllData();
    }
    // 🔥 修复：移除 initializeAllData 依赖，避免 currentPeriod 变化时重新初始化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, exchange]);

  // 每次切换股票时重置到第一个 tab
  useEffect(() => {
    if (symbol) {
      setSelectedTab('about');
    }
  }, [symbol, exchange, setSelectedTab]);

  // WebSocket 连接和订阅（周期变化时重新订阅）
  useEffect(() => {
    if (!symbol) return;

    Logger.info(LogModule.STOCK, '🔄 [Hook] 设置 WebSocket 订阅', {
      symbol,
      exchange,
      period: currentPeriod
    });
    
    // 先取消旧订阅（但不断开连接）
    unsubscribeAll();
    
    // 🔥 直接在 useEffect 中执行连接和订阅（避免闭包陷阱）
    const setupConnection = async () => {
      try {
        await connectWebSocket();
        
        // 订阅K线数据
        const priceSubId = subscribePrice(symbol, exchange, currentPeriod);
        
        Logger.info(LogModule.STOCK, '✅ [Hook] WebSocket 设置完成', { 
          subscriptionId: priceSubId,
          period: currentPeriod 
        });
      } catch (error) {
        Logger.error(LogModule.STOCK, '❌ [Hook] WebSocket 连接失败', error);
      }
    };
    
    setupConnection();

    // 🔥 清理函数：只取消订阅，不断开连接（避免频繁断连）
    return () => {
      Logger.info(LogModule.STOCK, '🧹 [Hook] 清理订阅（保持连接）');
      unsubscribeAll();
      // ❌ 不要在这里调用 disconnectWebSocket()，避免频繁断连
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, exchange, currentPeriod]); // 🔥 修复：只依赖基本值，不依赖函数引用

  // 🆕 组件完全卸载时才断开连接
  useEffect(() => {
    return () => {
      Logger.info(LogModule.STOCK, '🔌 [Hook] 组件卸载，断开 WebSocket');
      disconnectWebSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔥 修复：空依赖数组，只在组件卸载时执行

  // 切换股票时重置新闻加载标记
  useEffect(() => {
    Logger.info(LogModule.STOCK, `📰 [Hook] 股票切换，清除加载标记: ${compositeSymbol}`);
  }, [compositeSymbol]);

  // 监听标签页切换，加载新闻
  useEffect(() => {
    if (selectedTab !== 'news') return;

    const hasAttempted = newsLoadAttempted.current[compositeSymbol];

    if (hasAttempted) {
      Logger.info(LogModule.STOCK, `📰 [Hook] 已加载过，跳过: ${compositeSymbol}`);
      return;
    }

    Logger.info(LogModule.STOCK, `📰 [Hook] 触发新闻加载: ${compositeSymbol}`);
    newsLoadAttempted.current[compositeSymbol] = true;
    fetchNews();
  }, [selectedTab, compositeSymbol, fetchNews]);

  // 监听页面焦点，智能刷新业务数据
  useFocusEffect(
    useCallback(() => {
      if (symbol) {
        const isAuthenticated = useAuthStore.getState().isAuthenticated;
        const stockDetailStore = useStockDetailStore.getState();
        const { lastNavigation } = stockDetailStore;
        const now = Date.now();
        
        // ✅ 优化2: 智能判断是否需要刷新
        const shouldRefresh = (() => {
          // 1. 如果是从持仓管理页返回，且是同一个symbol，且在10秒内
          if (
            lastNavigation.from === 'position_add' &&
            lastNavigation.symbol === symbol &&
            now - lastNavigation.timestamp < 10000 // 10秒内
          ) {
            Logger.info(LogModule.STOCK, '⚡ [Hook] 从持仓页返回，跳过刷新（使用缓存）', {
              symbol,
              timeSinceNavigation: `${((now - lastNavigation.timestamp) / 1000).toFixed(1)}s`
            });
            return false; // ✅ 不需要刷新，数据是最新的
          }

          // 2. 如果是从模拟交易页返回，且是同一个symbol，且在10秒内
          if (
            lastNavigation.from === 'trade' &&
            lastNavigation.symbol === symbol &&
            now - lastNavigation.timestamp < 10000
          ) {
            Logger.info(LogModule.STOCK, '⚡ [Hook] 从模拟交易页返回，跳过刷新（使用缓存）', {
              symbol,
              timeSinceNavigation: `${((now - lastNavigation.timestamp) / 1000).toFixed(1)}s`
            });
            return false;
          }
          
          // 3. 其他情况需要刷新
          Logger.info(LogModule.STOCK, '📱 [Hook] 页面聚焦 - 刷新业务数据', {
            symbol,
            exchange,
            isAuthenticated,
            lastNavigationFrom: lastNavigation.from,
            lastNavigationSymbol: lastNavigation.symbol,
          });
          return true;
        })();
        
        if (isAuthenticated && shouldRefresh) {
          refreshBusinessData(symbol, exchange);
        }
      }
    }, [symbol, exchange, refreshBusinessData])
  );

  // 获取当前股票的新闻
  const currentNews = stockNews[compositeSymbol] || [];

  // 计算图表数据
  const historyData = tvHistory.map(candle => candle.close);
  if (tvQuote && tvQuote.lp && historyData.length > 0) {
    historyData[historyData.length - 1] = tvQuote.lp;
  }

  return {
    // 市场数据
    tvQuote,
    tvHistory,
    tvStockInfo,
    tvLoading,
    tvError,
    chartData: historyData,

    // 业务数据
    isAuthenticated,
    businessLoading,
    businessError,

    // 新闻数据
    newsItems: currentNews,
    newsLoading: newsLoading.stockNews,
    newsError,
    compositeSymbol,

    // UI 状态
    selectedTab,
    isFavorite,
    isInWatchlist: isFavorite, // 别名，保持向后兼容
    isUpdatingWatchlist,
    isCheckingWatchlist,
    isRefreshing,

    // 操作方法
    setSelectedTab,
    handleFavoritePress,
    handleRetryNews,
    refreshAllData,
    fetchHistory: debouncedFetchHistory, // 使用防抖版本
  };
}

