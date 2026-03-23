/**
 * TradingView Store
 * 
 * 管理 TradingView API 数据的全局状态
 * - 实时报价数据
 * - 历史K线数据
 * - WebSocket 连接状态
 * - 订阅管理
 */

import { create } from 'zustand';
import { tradingViewService } from '@/services/market/tradingView/tradingViewService';
import { tradingViewWS } from '@/services/market/tradingView/tradingViewWebSocket';
import type {
  TradingViewQuote,
  TradingViewCandle,
  TradingViewWSMessage,
  TradingViewStockInfo,
  BatchQuoteResponse,
} from '@/types/tradingview';
import {
  convertPeriod,
  toTradingViewSymbol,
  isNewCandle,
} from '@/services/chart/tradingViewAdapter';

/**
 * TradingView Store 状态
 */
interface TradingViewState {
  // 数据状态
  /** 当前报价数据 */
  quote: TradingViewQuote | null;
  /** 历史K线数据（当前显示的周期） */
  history: TradingViewCandle[];
  /** 历史K线数据缓存（按周期隔离） */
  historyCache: Map<string, TradingViewCandle[]>;
  /** 当前选中的周期 */
  currentPeriod: string;
  /** 缓存时间戳（用于过期检查） */
  cacheTimestamp: Map<string, number>;
  /** 指标数据 */
  indicators: Record<string, any>;
  /** 股票详细信息（从 price 接口获取） */
  stockInfo: TradingViewStockInfo | null;
  /** 当前最新K线 */
  currentCandle: TradingViewCandle | null;
  
  // 缓存时间戳
  /** 报价数据最后更新时间 */
  lastQuoteUpdate: number;
  /** 历史数据最后更新时间 */
  lastHistoryUpdate: number;
  
  // 加载状态
  isLoading: {
    quote: boolean;
    history: boolean;
  };
  
  // 错误状态
  error: string | null;
  
  // WebSocket 状态
  isConnected: boolean;
  activeSubscriptions: Record<string, string>; // subscriptionId -> symbol
}

/**
 * TradingView Store Actions
 */
interface TradingViewActions {
  // HTTP API 方法
  fetchQuote: (symbol: string, exchange?: string) => Promise<void>;
  fetchBatchQuotes: (symbols: string[]) => Promise<BatchQuoteResponse>;
  fetchHistory: (
    symbol: string,
    exchange?: string,
    period?: string
  ) => Promise<void>;
  silentRefreshHistory: (
    symbol: string,
    exchange?: string,
    period?: string
  ) => Promise<void>;
  
  // 缓存管理方法
  getHistoryForPeriod: (
    symbol: string,
    exchange: string,
    period: string
  ) => TradingViewCandle[];
  clearHistoryCache: () => void;
  
  // WebSocket 方法
  connectWebSocket: () => Promise<void>;
  disconnectWebSocket: () => void;
  subscribeQuote: (symbol: string, exchange?: string) => string;
  subscribePrice: (
    symbol: string,
    exchange?: string,
    period?: string
  ) => string;
  unsubscribe: (subscriptionId: string) => void;
  unsubscribeAll: () => void;
  
  // 数据管理
  updateQuote: (quote: TradingViewQuote) => void;
  updateCandle: (candle: TradingViewCandle) => void;
  clearError: () => void;
  clearAllData: () => void;
}

/**
 * TradingView Store
 */
export const useTradingViewStore = create<TradingViewState & TradingViewActions>(
  (set, get) => {
    // WebSocket 消息处理器
    const handleWebSocketMessage = (message: TradingViewWSMessage) => {
      try {
        switch (message.type) {
          case 'quote_update':
            // 实时报价更新
            if (message.data && message.symbol) {
              const { quote: currentQuote, history: currentHistory } = get();
              const now = Math.floor(Date.now() / 1000); // Unix 时间戳（秒）
              
              // ✅ 合并更新：保留 bid/ask 等字段，只更新实时变化的字段
              const updatedQuote = currentQuote 
                ? { 
                    ...currentQuote, 
                    ...message.data,
                    // 确保保留 bid/ask 字段（如果 WebSocket 没有提供）
                    bid: message.data.bid ?? currentQuote.bid,
                    ask: message.data.ask ?? currentQuote.ask,
                    // ✅ 关键修复：如果 WebSocket 没有提供 lp_time，使用当前时间
                    lp_time: message.data.lp_time ?? now,
                  }
                : {
                    ...message.data,
                    lp_time: message.data.lp_time ?? now,
                  };
              
              // 🔥 关键修复：同时更新 history 数组的最后一根K线
              let updatedHistory = currentHistory;
              if (currentHistory && currentHistory.length > 0 && updatedQuote.lp) {
                const lastCandle = currentHistory[currentHistory.length - 1];
                const newClose = updatedQuote.lp;
                
                // 更新最后一根K线的 close 价格，并根据需要更新 max/min
                const updatedCandle = {
                  ...lastCandle,
                  close: newClose,
                  max: Math.max(lastCandle.max, newClose), // 更新最高价
                  min: Math.min(lastCandle.min, newClose), // 更新最低价
                  // 保持时间戳不变，因为是同一根K线
                };
                
                // 创建新数组（触发 React 重渲染）
                updatedHistory = [...currentHistory];
                updatedHistory[updatedHistory.length - 1] = updatedCandle;
              }
              
              set({
                quote: updatedQuote,
                history: updatedHistory, // 更新历史数据
                lastQuoteUpdate: Date.now(),
                error: null,
              });
              console.log('[TradingView Store] Quote updated:', {
                symbol: message.symbol,
                lp: updatedQuote.lp,
                bid: updatedQuote.bid,
                ask: updatedQuote.ask,
                lp_time: updatedQuote.lp_time,
                updateTime: new Date(updatedQuote.lp_time * 1000).toLocaleTimeString('zh-CN'),
                hasBidAsk: !!(updatedQuote.bid && updatedQuote.ask),
                historyUpdated: updatedHistory !== currentHistory,
              });
            } else {
              console.warn('[TradingView Store] Quote update received but symbol is missing');
            }
            break;

          case 'history':
            // 历史数据（初始加载）
            set({
              history: message.periods || [],
              indicators: message.indicators || {},
              error: null,
            });
            // console.log('[TradingView Store] History loaded:', message.periods?.length);
            break;

          case 'update':
            // K线更新
            const { history, quote: currentQuote } = get();
            const newCandle = message.data; // 🔥 修复：使用 message.data 而不是 message.period
            
            if (!newCandle) {
              console.warn('[TradingView Store] Update event received but data is missing');
              break;
            }
            
            // 🔥 从K线数据更新报价（因为没有 subscribeQuote）
            const updatedQuote = currentQuote ? {
              ...currentQuote,
              lp: newCandle.close,      // 最新价格
              lp_time: newCandle.time,  // 价格时间
              high_price: Math.max(currentQuote.high_price || 0, newCandle.max),  // 更新最高价
              low_price: currentQuote.low_price 
                ? Math.min(currentQuote.low_price, newCandle.min) 
                : newCandle.min,  // 更新最低价
            } : null;
            
            if (isNewCandle(history, newCandle)) {
              // 新增K线
              set({
                history: [...history, newCandle],
                quote: updatedQuote,  // 🔥 同时更新报价
                indicators: message.indicators || get().indicators,
                lastQuoteUpdate: Date.now(),  // 🔥 更新报价时间戳
                error: null,
              });
              console.log('[TradingView Store] ✅ New candle added via WebSocket:', {
                time: new Date(newCandle.time * 1000).toLocaleTimeString(),
                open: newCandle.open,
                close: newCandle.close,
                price: newCandle.close,  // 🔥 显示价格
                totalCandles: history.length + 1,
              });
            } else {
              // 更新最后一根K线
              const updatedHistory = [...history];
              updatedHistory[updatedHistory.length - 1] = newCandle;
              set({
                history: updatedHistory,
                quote: updatedQuote,  // 🔥 同时更新报价
                indicators: message.indicators || get().indicators,
                lastQuoteUpdate: Date.now(),  // 🔥 更新报价时间戳
                error: null,
              });
              console.log('[TradingView Store] 🔄 Last candle updated via WebSocket:', {
                time: new Date(newCandle.time * 1000).toLocaleTimeString(),
                close: newCandle.close,
                price: newCandle.close,  // 🔥 显示价格
              });
            }
            break;

          case 'error':
            console.error('[TradingView Store] WebSocket error:', message.message);
            set({ error: message.message });
            break;

          default:
            console.log('[TradingView Store] Unhandled message type:', message.type);
        }
      } catch (error) {
        console.error('[TradingView Store] Message handling error:', error);
        set({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    };

    // WebSocket 连接状态回调
    tradingViewWS.onConnect(() => {
      console.log('[TradingView Store] WebSocket connected');
      set({ isConnected: true, error: null });
    });

    tradingViewWS.onDisconnect(() => {
      console.log('[TradingView Store] WebSocket disconnected');
      set({ isConnected: false });
    });

    tradingViewWS.onError((error) => {
      console.error('[TradingView Store] WebSocket error:', error);
      set({ error: error.message, isConnected: false });
    });

    // ✅ 辅助函数：生成缓存键
    const generateCacheKey = (symbol: string, exchange: string, period: string): string => {
      return `${symbol}:${exchange}:${period}`;
    };
    
    // ✅ 辅助函数：LRU 缓存清理（最多保留10个周期的数据）
    const MAX_CACHE_SIZE = 10;
    const cleanupOldCache = (historyCache: Map<string, TradingViewCandle[]>, cacheTimestamp: Map<string, number>) => {
      if (historyCache.size > MAX_CACHE_SIZE) {
        // 按时间戳排序，删除最旧的缓存
        const sortedKeys = Array.from(cacheTimestamp.entries())
          .sort((a, b) => a[1] - b[1]) // 升序排列（最旧的在前）
          .map(([key]) => key);
        
        const keysToDelete = sortedKeys.slice(0, historyCache.size - MAX_CACHE_SIZE);
        keysToDelete.forEach((key) => {
          historyCache.delete(key);
          cacheTimestamp.delete(key);
        });
        
        console.log(`[TradingView Store] Cleaned up ${keysToDelete.length} old cache entries`);
      }
    };

    return {
      // 初始状态
      quote: null,
      history: [],
      historyCache: new Map(),
      currentPeriod: '1day', // 默认周期
      cacheTimestamp: new Map(),
      indicators: {},
      stockInfo: null,
      currentCandle: null,
      lastQuoteUpdate: 0,
      lastHistoryUpdate: 0,
      isLoading: {
        quote: false,
        history: false,
      },
      error: null,
      isConnected: false,
      activeSubscriptions: {},

      // HTTP API 方法
      fetchQuote: async (symbol: string, exchange?: string) => {
        try {
          set((state) => ({
            isLoading: { ...state.isLoading, quote: true },
            error: null,
          }));

          const tvSymbol = toTradingViewSymbol(symbol, exchange);
          console.log('[TradingView Store] Fetching quote:', tvSymbol);

          const quote = await tradingViewService.getQuote(tvSymbol);

          set((state) => ({
            quote,
            lastQuoteUpdate: Date.now(), // ✅ 记录更新时间
            isLoading: { ...state.isLoading, quote: false },
          }));
        } catch (error) {
          console.error('[TradingView Store] Fetch quote error:', error);
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to fetch quote',
            isLoading: { ...state.isLoading, quote: false },
          }));
        }
      },

      fetchBatchQuotes: async (symbols: string[]) => {
        try {
          set((state) => ({
            isLoading: { ...state.isLoading, quote: true },
            error: null,
          }));

          // console.log('[TradingView Store] Fetching batch quotes:', symbols);

          const batchResponse = await tradingViewService.getBatchQuotes(symbols);

          set((state) => ({
            isLoading: { ...state.isLoading, quote: false },
          }));

          return batchResponse;
        } catch (error) {
          console.error('[TradingView Store] Fetch batch quotes error:', error);
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to fetch batch quotes',
            isLoading: { ...state.isLoading, quote: false },
          }));
          throw error;
        }
      },

      fetchHistory: async (symbol: string, exchange?: string, period: string = '1M') => {
        try {
          set((state) => ({
            isLoading: { ...state.isLoading, history: true },
            error: null,
          }));

          const tvSymbol = toTradingViewSymbol(symbol, exchange);
          const { timeframe, range } = convertPeriod(period);
          
          console.log('[TradingView Store] 🔍 Period conversion:', {
            inputPeriod: period,
            outputTimeframe: timeframe,
            outputRange: range,
          });
          
          console.log('[TradingView Store] Fetching history:', {
            symbol: tvSymbol,
            timeframe,
            range,
          });

          const historyData = await tradingViewService.getHistory(
            tvSymbol,
            timeframe,
            range
          );

          // ⚠️ TradingView 返回倒序数据，反转为正序
          const history = historyData.history.slice().reverse();
          
          console.log('[TradingView Store] History data received:', {
            historyCount: history.length,
            hasStockInfo: !!historyData.info,
            hasCurrentCandle: !!historyData.current,
          });

          // ✅ 生成缓存键并更新缓存
          const cacheKey = generateCacheKey(symbol, exchange || '', period);
          const now = Date.now();
          
          set((state) => {
            // 创建新的 Map（不变性）
            const newHistoryCache = new Map(state.historyCache);
            const newCacheTimestamp = new Map(state.cacheTimestamp);
            
            // 更新缓存
            newHistoryCache.set(cacheKey, history);
            newCacheTimestamp.set(cacheKey, now);
            
            // LRU 清理
            cleanupOldCache(newHistoryCache, newCacheTimestamp);
            
            console.log(`[TradingView Store] ✅ Cached history for ${cacheKey} (${history.length} candles)`);
            
            return {
              history,
              historyCache: newHistoryCache,
              currentPeriod: period,
              cacheTimestamp: newCacheTimestamp,
              stockInfo: historyData.info || null,
              currentCandle: historyData.current || null,
              lastHistoryUpdate: now,
              isLoading: { ...state.isLoading, history: false },
            };
          });
        } catch (error) {
          console.error('[TradingView Store] Fetch history error:', error);
          set((state) => ({
            error: error instanceof Error ? error.message : 'Failed to fetch history',
            isLoading: { ...state.isLoading, history: false },
          }));
        }
      },

      /**
       * 静默刷新历史数据（不触发 loading 状态，避免页面抖动）
       * 
       * 适用于定时自动刷新场景，保持UI稳定，只更新数据
       */
      silentRefreshHistory: async (symbol: string, exchange?: string, period: string = '1M') => {
        try {
          const tvSymbol = toTradingViewSymbol(symbol, exchange);
          const { timeframe, range } = convertPeriod(period);
          
          console.log('[TradingView Store] 🔄 Silent refresh:', {
            symbol: tvSymbol,
            period,
            timeframe,
            range,
          });

          const historyData = await tradingViewService.getHistory(
            tvSymbol,
            timeframe,
            range
          );

          // ⚠️ TradingView 返回倒序数据，反转为正序
          const history = historyData.history.slice().reverse();
          
          console.log('[TradingView Store] ✅ Silent refresh complete:', {
            historyCount: history.length,
            timestamp: new Date().toLocaleTimeString(),
          });

          // ✅ 生成缓存键并更新缓存
          const cacheKey = generateCacheKey(symbol, exchange || '', period);
          const now = Date.now();

          // 🔥 关键：不触发 loading 状态，直接更新数据和缓存
          set((state) => {
            // 创建新的 Map（不变性）
            const newHistoryCache = new Map(state.historyCache);
            const newCacheTimestamp = new Map(state.cacheTimestamp);
            
            // 更新缓存
            newHistoryCache.set(cacheKey, history);
            newCacheTimestamp.set(cacheKey, now);
            
            // LRU 清理
            cleanupOldCache(newHistoryCache, newCacheTimestamp);
            
            console.log(`[TradingView Store] ✅ Silent cached history for ${cacheKey} (${history.length} candles)`);
            
            return {
              history,
              historyCache: newHistoryCache,
              currentPeriod: period,
              cacheTimestamp: newCacheTimestamp,
              stockInfo: historyData.info || state.stockInfo, // 保留现有 info
              currentCandle: historyData.current || state.currentCandle, // 保留现有 current
              lastHistoryUpdate: now,
              error: null, // 清除错误
            };
          });
        } catch (error) {
          console.error('[TradingView Store] Silent refresh error:', error);
          // 静默失败，不更新 error 状态（避免干扰用户）
        }
      },

      // WebSocket 方法
      connectWebSocket: async () => {
        try {
          console.log('[TradingView Store] Connecting WebSocket...');
          await tradingViewWS.connect();
        } catch (error) {
          console.error('[TradingView Store] WebSocket connection error:', error);
          set({
            error: error instanceof Error ? error.message : 'WebSocket connection failed',
            isConnected: false,
          });
          throw error;
        }
      },

      disconnectWebSocket: () => {
        console.log('[TradingView Store] Disconnecting WebSocket...');
        tradingViewWS.disconnect();
        set({
          isConnected: false,
          activeSubscriptions: {},
        });
      },

      subscribeQuote: (symbol: string, exchange?: string) => {
        const tvSymbol = toTradingViewSymbol(symbol, exchange);
        console.log('[TradingView Store] Subscribing to quote:', tvSymbol);

        const subscriptionId = tradingViewWS.subscribeQuote(
          [tvSymbol],
          handleWebSocketMessage
        );

        set((state) => ({
          activeSubscriptions: {
            ...state.activeSubscriptions,
            [subscriptionId]: tvSymbol,
          },
        }));

        return subscriptionId;
      },

      subscribePrice: (symbol: string, exchange?: string, period: string = '1M') => {
        const tvSymbol = toTradingViewSymbol(symbol, exchange);
        const { timeframe, range } = convertPeriod(period);
        
        console.log('[TradingView Store] Subscribing to price:', {
          symbol: tvSymbol,
          timeframe,
          range,
        });

        const subscriptionId = tradingViewWS.subscribePrice(
          tvSymbol,
          timeframe,
          range,
          [], // indicators
          handleWebSocketMessage
        );

        set((state) => ({
          activeSubscriptions: {
            ...state.activeSubscriptions,
            [subscriptionId]: tvSymbol,
          },
        }));

        return subscriptionId;
      },

      unsubscribe: (subscriptionId: string) => {
        console.log('[TradingView Store] Unsubscribing:', subscriptionId);
        tradingViewWS.unsubscribe(subscriptionId);

        set((state) => {
          const { [subscriptionId]: _, ...rest } = state.activeSubscriptions;
          return { activeSubscriptions: rest };
        });
      },

      unsubscribeAll: () => {
        console.log('[TradingView Store] Unsubscribing all');
        tradingViewWS.unsubscribeAll();
        set({ activeSubscriptions: {} });
      },

      // 数据管理
      updateQuote: (quote: TradingViewQuote) => {
        set({ quote, lastQuoteUpdate: Date.now(), error: null }); // ✅ 更新时间戳
      },

      updateCandle: (candle: TradingViewCandle) => {
        const { history } = get();
        
        if (isNewCandle(history, candle)) {
          set({ history: [...history, candle] });
        } else {
          const updatedHistory = [...history];
          updatedHistory[updatedHistory.length - 1] = candle;
          set({ history: updatedHistory });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      /**
       * 获取指定周期的缓存数据（如果存在）
       * 
       * @param symbol 股票代码
       * @param exchange 交易所代码
       * @param period 周期
       * @returns K线数据数组，如果不存在则返回空数组
       */
      getHistoryForPeriod: (symbol: string, exchange: string, period: string) => {
        const { historyCache } = get();
        const cacheKey = generateCacheKey(symbol, exchange, period);
        return historyCache.get(cacheKey) || [];
      },

      /**
       * 清空历史数据缓存
       */
      clearHistoryCache: () => {
        console.log('[TradingView Store] Clearing history cache');
        set({
          historyCache: new Map(),
          cacheTimestamp: new Map(),
        });
      },

      clearAllData: () => {
        // 取消所有订阅
        const { unsubscribeAll, disconnectWebSocket } = get();
        unsubscribeAll();
        disconnectWebSocket();

        // 清空所有数据
        set({
          quote: null,
          history: [],
          historyCache: new Map(),
          currentPeriod: '1day',
          cacheTimestamp: new Map(),
          indicators: {},
          stockInfo: null,
          currentCandle: null,
          lastQuoteUpdate: 0,
          lastHistoryUpdate: 0,
          isLoading: {
            quote: false,
            history: false,
          },
          error: null,
          isConnected: false,
          activeSubscriptions: {},
        });
        
        console.log('[TradingView Store] All data cleared');
      },
    };
  }
);

