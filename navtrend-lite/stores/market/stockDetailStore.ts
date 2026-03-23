/**
 * Stock Detail Store - 简化版
 * 
 * ✅ 职责：管理股票详情页的业务数据
 * - 用户持仓数据
 * - 关注列表状态
 * - UI 状态管理
 * 
 * ⚠️ 不再负责：
 * - 市场数据（报价、K线） → 由 tradingViewStore 负责
 * - 公司信息、财务数据 → TradingView 不提供
 */

import { create } from 'zustand';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { useAuthStore } from '@/stores/auth/authStore';
import { useWealthStore } from '@/stores/user/wealthStore';
import { useWatchlistStore } from '@/stores/user/watchlistStore';
import { useTradingViewStore } from '@/stores/market/tradingViewStore';
import { navigateToPositionAdd } from '@/helpers/navigation';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { debounce } from '@/utils/debounce';
import { t } from '@/config/i18n';

interface StockDetailState {
  // ===== 业务数据状态 =====
  // 持仓信息
  holdingData: any;
  hasPosition: boolean;
  positionQuantity: number;
  
  // ===== UI状态 =====
  selectedTab: string;
  isFavorite: boolean;
  isCheckingWatchlist: boolean;
  isUpdatingWatchlist: boolean;
  isRefreshing: boolean;
  
  // ===== 导航来源跟踪（用于优化刷新逻辑） =====
  lastNavigation: {
    from: string | null;
    symbol: string | null;
    timestamp: number;
  };
  
  // ===== 加载状态 =====
  isLoading: {
    holding: boolean;
    watchlist: boolean;
  };
  
  // ===== 错误状态 =====
  error: string | null;
  
  // ===== 状态更新方法 =====
  setSelectedTab: (tab: string) => void;
  setError: (error: string | null) => void;
  setNavigationFrom: (from: string, symbol: string) => void;
  
  // ===== 数据获取方法 =====
  initializeBusinessData: (symbol: string, exchange?: string) => Promise<void>;
  fetchHoldingData: (symbol: string, exchange?: string) => Promise<void>;
  refreshBusinessData: (symbol: string, exchange?: string) => Promise<void>;
  
  // ===== 业务操作方法 =====
  handlePositionButtonPress: (symbol: string, exchange?: string) => void;
  handleFavoritePress: (stockSymbol: string, favorite: boolean, exchange: string) => Promise<void>;
  checkWatchlistStatus: (stockSymbol: string, exchange?: string | undefined) => Promise<void>;
  
  // ===== 工具方法 =====
  resetStore: () => void;
}

export const useStockDetailStore = create<StockDetailState>((set, get) => ({
  // ===== 初始状态 =====
  // 持仓信息
  holdingData: null,
  hasPosition: false,
  positionQuantity: 0,
  
  // UI状态
  selectedTab: 'about',
  isFavorite: false,
  isCheckingWatchlist: false,
  isUpdatingWatchlist: false,
  isRefreshing: false,
  
  // 导航来源跟踪
  lastNavigation: {
    from: null,
    symbol: null,
    timestamp: 0,
  },
  
  // 加载状态
  isLoading: {
    holding: false,
    watchlist: false,
  },
  
  // 错误状态
  error: null,

  // ===== 状态更新方法 =====
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  setError: (error) => set({ error }),
  
  /**
   * 设置导航来源（用于优化刷新逻辑）
   * @param from 来源页面
   * @param symbol 股票代码
   */
  setNavigationFrom: (from: string, symbol: string) => {
    set({
      lastNavigation: {
        from,
        symbol,
        timestamp: Date.now(),
      }
    });
    Logger.info(LogModule.STOCK, '📍 设置导航来源', { from, symbol });
  },

  // ===== 数据获取方法 =====
  /**
   * 初始化业务数据（持仓和关注列表）
   */
  initializeBusinessData: async (symbol: string, exchange?: string) => {
    if (!symbol) {
      Alert.alert(t('common.error'), t('position.stockCodeEmpty'), [
        { text: t('common.back'), onPress: () => {
          setTimeout(() => {
            router.back();
          }, 100);
        }}
      ]);
      return;
    }

    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // 如果用户未登录，跳过业务数据加载
    if (!isAuthenticated) {
      Logger.info(LogModule.STOCK, '⏭️ 用户未登录，跳过业务数据加载', { symbol });
      return;
    }
    
    try {
      set({
        isLoading: {
          holding: true,
          watchlist: true,
        },
        error: null,
      });

      Logger.info(LogModule.STOCK, '🚀 开始加载业务数据', { 
        symbol, 
        exchange, 
        isAuthenticated 
      });

      // 并行加载持仓数据和关注状态
      await Promise.allSettled([
        get().fetchHoldingData(symbol, exchange),
        get().checkWatchlistStatus(symbol, exchange)
      ]);

      set({
        isLoading: {
          holding: false,
          watchlist: false,
        },
      });

      Logger.info(LogModule.STOCK, '✅ 业务数据加载完成', { symbol });

    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ 初始化业务数据失败:', error);
      set({
        error: error.message || 'Failed to initialize business data',
        isLoading: {
          holding: false,
          watchlist: false,
        },
      });
    }
  },

  /**
   * 获取持仓数据（优化版：优先使用缓存）
   */
  fetchHoldingData: async (symbol: string, exchange?: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, holding: true }
      }));

      // ⚡ 优化：先检查是否有缓存数据
      const wealthStore = useWealthStore.getState();
      const lastFetchTime = wealthStore.lastFetchTime.integrated || 0;
      const cacheAge = Date.now() - lastFetchTime;
      
      // 如果缓存在5秒内且有数据，直接使用缓存
      if (cacheAge < 5000 && wealthStore.enhancedPositions.length > 0) {
        Logger.info(LogModule.STOCK, '⚡ 使用投资组合缓存查找持仓', { cacheAge });
      } else {
        // 否则重新获取
        await wealthStore.fetchIntegratedPortfolio();
      }
      
      // 🔧 修复：支持多种 symbol 格式的匹配
      // 1. symbol 可能是 'AAPL' 或 'NASDAQ:AAPL'
      // 2. 持仓数据的 symbol 可能是 'AAPL' 或 'NASDAQ:AAPL'
      // 3. 需要支持交叉匹配
      
      const holding = wealthStore.enhancedPositions.find(pos => {
        // 如果持仓的 symbol 包含冒号（复合格式）
        if (pos.symbol.includes(':')) {
          const [posExchange, posSymbol] = pos.symbol.split(':');
          // 匹配分开的 symbol 和 exchange
          if (posSymbol === symbol && posExchange === exchange) {
            return true;
          }
          // 匹配复合格式 symbol
          if (pos.symbol === `${exchange}:${symbol}`) {
            return true;
          }
        }
        
        // 标准匹配：symbol 和 exchange 都匹配
        if (pos.symbol === symbol && pos.exchange === exchange) {
          return true;
        }
        
        // 如果传入的 symbol 是复合格式
        if (symbol.includes(':')) {
          const [symExchange, symSymbol] = symbol.split(':');
          // 匹配持仓的 symbol 和 exchange
          if (pos.symbol === symSymbol && pos.exchange === symExchange) {
            return true;
          }
        }
        
        return false;
      });
      
      set(state => ({
        holdingData: holding || null,
        hasPosition: holding && holding.quantity > 0,
        positionQuantity: holding ? holding.quantity : 0,
        isLoading: { ...state.isLoading, holding: false }
      }));
      
      Logger.info(LogModule.STOCK, '✅ 持仓数据加载成功', { 
        symbol,
        exchange,
        foundHolding: !!holding,
        hasPosition: holding && holding.quantity > 0,
        positionQuantity: holding ? holding.quantity : 0,
        totalPositions: wealthStore.enhancedPositions.length
      });
    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ 获取持仓数据失败:', error);
      set(state => ({
        holdingData: null,
        hasPosition: false,
        positionQuantity: 0,
        isLoading: { ...state.isLoading, holding: false }
      }));
    }
  },

  /**
   * 刷新业务数据（带缓存优化）
   */
  refreshBusinessData: async (symbol: string, exchange?: string) => {
    if (!symbol) return;
    
    // ⚡ 优化：先检查 wealthStore 是否有最新数据（5秒内）
    const wealthStore = useWealthStore.getState();
    const lastFetchTime = wealthStore.lastFetchTime.integrated || 0;
    const now = Date.now();
    const cacheAge = now - lastFetchTime;
    
    if (cacheAge < 5000 && wealthStore.enhancedPositions.length > 0) {
      Logger.info(LogModule.STOCK, '⚡ 使用最近的投资组合缓存，跳过刷新', {
        cacheAge,
        positionsCount: wealthStore.enhancedPositions.length
      });
      
      // 直接从缓存中查找持仓
      await get().fetchHoldingData(symbol, exchange);
      return;
    }
    
    try {
      set({ isRefreshing: true });
      await get().initializeBusinessData(symbol, exchange);
    } catch (error) {
      Logger.error(LogModule.STOCK, '❌ 刷新业务数据失败:', error);
    } finally {
      set({ isRefreshing: false });
    }
  },

  // ===== 业务操作方法 =====
  /**
   * 处理持仓按钮点击
   */
  handlePositionButtonPress: debounce((symbol: string, exchange?: string) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    if (!isAuthenticated) {
      Alert.alert(t('common.tips'), t('auth.loginRequired'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('login.loginButton'), onPress: () => {
          setTimeout(() => {
            router.push('/auth/login' as any);
          }, 100);
        }}
      ]);
      return;
    }
    navigateToPositionAdd(symbol, exchange);
  }),

  /**
   * 处理关注按钮点击
   * ✅ 职责：UI状态管理 + 业务协调（乐观更新）
   * - 管理本地UI状态（isFavorite）
   * - 调用 watchlistStore 的业务方法
   * - 失败时回滚UI状态
   */
  handleFavoritePress: async (stockSymbol: string, favorite: boolean, exchange: string) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!isAuthenticated) {
      Alert.alert(t('common.tips'), t('auth.loginRequired'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('login.loginButton'), onPress: () => {
          setTimeout(() => {
            router.push('/auth/login' as any);
          }, 100);
        }}
      ]);
      return;
    }
    
    const { isUpdatingWatchlist } = get();
    if (isUpdatingWatchlist) return;
    
    try {
      set({ isUpdatingWatchlist: true });
      
      // ✅ 乐观更新：立即更新本地UI状态
      set({ isFavorite: favorite });
      Logger.info(LogModule.STOCK, '🔄 乐观更新UI', { symbol: stockSymbol, favorite });
      
      // ✅ 调用 watchlistStore 的业务方法（不实现具体逻辑）
      const watchlistStore = useWatchlistStore.getState();
      
      if (favorite) {
        // 获取当前价格用于自动创建提醒
        const tvStore = useTradingViewStore.getState();
        const currentPrice = tvStore.quote?.lp; // lp = last price
        
        await watchlistStore.addToWatchlist(stockSymbol, exchange || 'undefined', currentPrice);
        Logger.info(LogModule.STOCK, '✅ 添加关注并传递当前价格', { symbol: stockSymbol, currentPrice });
      } else {
        await watchlistStore.removeFromWatchlist(stockSymbol, exchange || 'undefined');
      }
      
      Logger.info(LogModule.STOCK, '✅ 关注操作成功', { symbol: stockSymbol, favorite });
      
    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ 关注操作失败:', error);
      
      // ✅ 失败时回滚UI状态
      set({ isFavorite: !favorite });
      Logger.info(LogModule.STOCK, '🔙 回滚UI', { symbol: stockSymbol });
      
      let errorMessage = t('common.operationFailed');
      if (error.status === 401) {
        errorMessage = t('auth.authFailed');
      } else if (error.status === 404) {
        errorMessage = favorite ? t('stock.stockNotFound') : t('stock.stockNotInWatchlist');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('common.error'), errorMessage);
      throw error;
      
    } finally {
      set({ isUpdatingWatchlist: false });
    }
  },

  /**
   * 检查关注列表状态
   * ✅ 职责：仅调用 watchlistStore 方法，不实现具体逻辑
   */
  checkWatchlistStatus: async (stockSymbol: string, exchange?: string | undefined) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!isAuthenticated || !stockSymbol) {
      set({ 
        isFavorite: false,
        isCheckingWatchlist: false 
      });
      return;
    }

    try {
      set({ isCheckingWatchlist: true });
      
      // ✅ 调用 watchlistStore 的方法，而不是自己实现逻辑
      const watchlistStore = useWatchlistStore.getState();
      const isInWatchlist = await watchlistStore.isStockInWatchlist(stockSymbol, exchange);
      
      set({ isFavorite: isInWatchlist });
      
      Logger.info(LogModule.STOCK, '✅ 关注状态检查完成', { 
        symbol: stockSymbol,
        exchange,
        isInWatchlist
      });
    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ 检查关注状态失败:', error);
      set({ isFavorite: false });
    } finally {
      set({ isCheckingWatchlist: false });
    }
  },

  // ===== 工具方法 =====
  /**
   * 重置 Store 状态
   */
  resetStore: () => {
    set({
      holdingData: null,
      hasPosition: false,
      positionQuantity: 0,
      selectedTab: 'about',
      isFavorite: false,
      isCheckingWatchlist: false,
      isUpdatingWatchlist: false,
      isRefreshing: false,
      isLoading: {
        holding: false,
        watchlist: false,
      },
      error: null,
    });
    
    Logger.info(LogModule.STOCK, '🔄 Store 已重置');
  },
}));
