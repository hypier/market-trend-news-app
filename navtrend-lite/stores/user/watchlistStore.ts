import { create } from 'zustand';
import { useAuthStore } from '@/stores/auth/authStore';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import type { WatchlistItem } from '@/types/stock';
import { WatchlistService } from '@/services/user/watchlistService';
import { authService as AuthService } from '@/services/auth/authService';

/**
 * WatchlistStore - 关注列表状态管理（精简版）
 * 
 * 职责：
 * - 管理关注列表数据和加载状态
 * - 提供关注列表的增删改查功能
 * - 协调 TradingView 报价数据获取
 */
interface WatchlistState {
  // ===== 数据状态 =====
  watchlist: WatchlistItem[];    // 关注列表数据（包含报价信息）
  watchlistLoading: boolean;     // 加载状态
  
  // ===== 核心方法 =====
  fetchWatchlist: (forceRefresh?: boolean) => Promise<void>;
  fetchWatchlistWithAlerts: (forceRefresh?: boolean) => Promise<void>;
  getWatchlistCount: () => Promise<number>;
  isStockInWatchlist: (symbol: string, exchange?: string) => Promise<boolean>;
  addToWatchlist: (symbol: string, exchange: string, currentPrice?: number) => Promise<WatchlistItem>;
  removeFromWatchlist: (symbol: string, exchange: string) => Promise<void>;
  clearWatchlist: () => Promise<void>;
}

const watchlistService = new WatchlistService();

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  // ===== 初始状态 =====
  watchlist: [],
  watchlistLoading: false,

  // 获取关注列表（简化版，保持向后兼容）
  fetchWatchlist: async (forceRefresh: boolean = false) => {
    try {
      set({ watchlistLoading: true });
      
      // 1. 检查认证Token
      const token = await AuthService.getStoredToken();
      if (!token) {
        set({ watchlist: [], watchlistLoading: false });
        return;
      }

      // 2. 检查缓存
      if (!forceRefresh) {
        const { watchlist } = get();
        if (watchlist && watchlist.length > 0) {
          Logger.debug(LogModule.STOCK, 'Using cached watchlist');
          set({ watchlistLoading: false });
          return;
        }
      }

      // 3. 从 API 获取基础数据
      const basicWatchlist = await watchlistService.getWatchlist();
      Logger.info(LogModule.STOCK, `Got ${basicWatchlist?.length || 0} items`);
      
      if (!basicWatchlist || basicWatchlist.length === 0) {
        set({ watchlist: [], watchlistLoading: false });
        return;
      }
      
      // 4. 批量获取报价
      const quotesMap = await watchlistService.fetchBatchQuotes(basicWatchlist);
      
      // 5. 合并数据
      const enrichedWatchlist = watchlistService.enrichWatchlistWithQuotes(basicWatchlist, quotesMap);
      
      // 6. 去重处理
      const uniqueWatchlist = watchlistService.deduplicateWatchlist(enrichedWatchlist);
      
      // 7. 更新状态
      set({ 
        watchlist: uniqueWatchlist,
        watchlistLoading: false 
      });
      
      Logger.info(LogModule.STOCK, `✅ Watchlist loaded: ${uniqueWatchlist.length} items`);
      
    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ Failed to fetch watchlist:', error);
      set({ watchlist: [], watchlistLoading: false });
    }
  },

  /**
   * 获取关注列表（兼容方法）
   *
   * 价格提醒相关 API 已废弃，因此该方法现在仅转发到纯关注列表加载。
   * 保留方法名是为了避免页面/调用方大范围改动。
   *
   * @param forceRefresh 是否强制刷新（忽略缓存）
   */
  fetchWatchlistWithAlerts: async (forceRefresh: boolean = false) => {
    try {
      set({ watchlistLoading: true });
      
      // 1. 检查认证Token
      const token = await AuthService.getStoredToken();
      if (!token) {
        set({ watchlist: [], watchlistLoading: false });
        return;
      }

      // 2. 检查缓存
      const hasWatchlistCache = !forceRefresh && get().watchlist?.length > 0;

      if (hasWatchlistCache) {
        // 有 watchlist 缓存
        Logger.debug(LogModule.STOCK, 'Using cached watchlist');
        set({ watchlistLoading: false });
        return; // 使用缓存的 watchlist
      }

      // 3. 使用纯关注列表 API 获取 watchlist
      const { watchlist: basicWatchlist } = await watchlistService.getWatchlistWithAlerts();
      Logger.info(LogModule.STOCK, `Got ${basicWatchlist?.length || 0} watchlist items`);

      if (!basicWatchlist || basicWatchlist.length === 0) {
        set({ watchlist: [], watchlistLoading: false });
        return;
      }
      
      // 5. 优化：先显示基础数据（无报价），让用户立即看到列表
      const basicWatchlistDeduplicated = watchlistService.deduplicateWatchlist(basicWatchlist);
      set({ 
        watchlist: basicWatchlistDeduplicated,
        watchlistLoading: false  // 先结束加载状态，让用户看到列表
      });
      Logger.info(LogModule.STOCK, `✅ Watchlist displayed: ${basicWatchlistDeduplicated.length} items (基础数据)`);
      
      // 6. 异步加载报价数据（不阻塞 UI）
      watchlistService.fetchBatchQuotes(basicWatchlist)
        .then(quotesMap => {
          // 合并报价数据
          const enrichedWatchlist = watchlistService.enrichWatchlistWithQuotes(basicWatchlist, quotesMap);
          const uniqueWatchlist = watchlistService.deduplicateWatchlist(enrichedWatchlist);
          
          // 更新带报价的数据
          set({ watchlist: uniqueWatchlist });
          Logger.info(LogModule.STOCK, `✅ Watchlist enriched with quotes: ${uniqueWatchlist.length} items`);
        })
        .catch(error => {
          Logger.warn(LogModule.STOCK, 'Failed to fetch quotes (non-blocking):', error);
          // 即使报价加载失败，基础数据仍然可用
        });

      
    } catch (error: any) {
      Logger.error(LogModule.STOCK, '❌ Failed to fetch watchlist with alerts:', error);
      set({ watchlist: [], watchlistLoading: false });
    }
  },

  // 智能获取关注列表数量（简化版）
  getWatchlistCount: async () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // 1. 如果用户未登录，返回 0
    if (!isAuthenticated) {
      return 0;
    }
    
    // 2. 如果没有数据，主动获取
    const { watchlist } = get();
    if (!watchlist || watchlist.length === 0) {
      try {
        await get().fetchWatchlist();
      } catch (error) {
        Logger.warn(LogModule.STOCK, 'Failed to fetch watchlist:', error);
        return 0;
      }
    }
    
    // 3. 返回最新的数量
    return get().watchlist?.length || 0;
  },

  // 智能检查股票是否在关注列表
  isStockInWatchlist: async (symbol: string, exchange?: string) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!isAuthenticated || !symbol) {
      return false;
    }
    
    // 确保数据已加载
    await get().getWatchlistCount();
    
    // 检查股票是否在关注列表中
    const { watchlist } = get();
    const isInWatchlist = watchlist.some(item => {
      const itemSymbol = item.symbol?.toUpperCase();
      const currentSymbol = symbol.toUpperCase();
      
      // 匹配逻辑：符号必须匹配，交易所如果都有值则必须匹配
      return itemSymbol === currentSymbol && 
             (!item.exchange || !exchange || item.exchange === exchange);
    });
    
    return isInWatchlist;
  },

  // 添加到关注列表
  addToWatchlist: async (symbol: string, exchange: string, currentPrice?: number) => {
    const symbolQueryStr = watchlistService.buildWatchlistKey(symbol, exchange);
    
    try {
      await watchlistService.addToWatchlist(symbolQueryStr, currentPrice);
      
      // 强制刷新纯关注列表
      await get().fetchWatchlist(true);
      
      Logger.info(LogModule.STOCK, `✅ Added ${symbolQueryStr}` + (currentPrice ? ` with price ${currentPrice}` : ''));
      return {} as WatchlistItem;
    } catch (error: any) {
      Logger.error(LogModule.STOCK, `Failed to add ${symbolQueryStr}:`, error);
      throw error;
    }
  },

  // 从关注列表移除
  removeFromWatchlist: async (symbol: string, exchange: string) => {
    const symbolQueryStr = watchlistService.buildWatchlistKey(symbol, exchange);
    
    try {
      await watchlistService.removeFromWatchlist(symbolQueryStr);
      
      // 乐观更新：直接从 Store 缓存中移除
      set(state => ({
        watchlist: state.watchlist.filter(item => 
          watchlistService.buildWatchlistKey(item.symbol, item.exchange) !== symbolQueryStr
        ),
      }));
      
      // 强制刷新纯关注列表，确保数据一致性
      await get().fetchWatchlist(true);
      
      Logger.info(LogModule.STOCK, `✅ Removed ${symbolQueryStr}`);
    } catch (error: any) {
      Logger.error(LogModule.STOCK, `Failed to remove ${symbolQueryStr}:`, error);
      throw error;
    }
  },

  // 清空关注列表
  clearWatchlist: async () => {
    try {
      set({ watchlist: [] });
      Logger.info(LogModule.STOCK, 'Watchlist cleared');
    } catch (error: any) {
      Logger.error(LogModule.STOCK, 'Failed to clear watchlist:', error);
      throw error;
    }
  },
}));

