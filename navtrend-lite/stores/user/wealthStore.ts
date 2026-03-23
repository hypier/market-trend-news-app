import { create } from 'zustand';
// 直接从源文件导入实例，避免通过 services/index.ts 导致的循环依赖
import { portfolioService } from '@/services/user/portfolioService';
import { ErrorHandler } from '@/utils/errorHandler';
import { useSettingsStore } from '@/stores/system/settingsStore';
import { useAuthStore } from '@/stores/auth/authStore';
import { Logger, LogModule } from '@/utils/logger';
// convertPortfolioToCurrency 已合并到 portfolioService
import type {
  PortfolioStats,
  EnhancedPosition,
  PortfolioStatsData,
} from '@/types/portfolio';
import { KLineIntervalType } from '@/types/stock';


interface wealthStore {
  // 投资组合数据
  portfolioStats: PortfolioStats | null;
  
  // 增强数据（计算属性）
  enhancedPositions: EnhancedPosition[];
  portfolioStatsData: PortfolioStatsData | null;
  validPositions: EnhancedPosition[]; // 有效持仓列表
  integratedPortfolio: any; // 集成的投资组合数据，包含持仓、市场数据和货币转换信息
  
  // 缓存时间戳
  lastFetchTime: {
    integrated: number; // 集成数据的时间戳（完整数据）
  };
  
  // 加载状态（简化）
  isLoading: {
    creating: boolean;    // 创建持仓
    updating: boolean;    // 更新持仓
    deleting: boolean;    // 删除持仓
    refreshing: boolean;  // 下拉刷新状态
    integrated: boolean;  // 数据加载状态（包含基础+报价+货币）
    holdingMarketData: boolean; // 单个持仓市场数据加载状态
  };
  
  // 错误状态
  error: string | null;
  
  // 计算属性
  hasPortfolioData: boolean;
  hasBasicData: boolean;    // 是否有基础数据可显示

  // 数据加载方法
  fetchIntegratedPortfolio: (options?: { interval?: KLineIntervalType, outputsize?: number, forceRefresh?: boolean }) => Promise<void>;
  initializeData: () => Promise<void>;
  refresh: () => Promise<void>;
  focusRefresh: () => void;
  
  // 持仓管理方法
  adjustPosition: (symbol: string, changeShares: number, transactionPrice: number) => Promise<any>;
  updateEnhancedPositions: () => void;
  updatePortfolioStatsData: () => void;
  
  // 辅助方法
  getValidPositions: () => EnhancedPosition[]; // 获取有效持仓列表
  
  // 简化的持仓管理方法
  getPositionCount: () => Promise<number>; // 获取持仓数量
  getStockPosition: (symbol: string, exchange?: string) => Promise<EnhancedPosition | null>; // 获取特定股票的持仓信息
  hasStockPosition: (symbol: string, exchange?: string) => Promise<boolean>; // 检查是否有特定股票的持仓
  
  clearError: () => void;
  clearCache: () => void;
  clearPortfolioCache: () => void;
  resetStore: () => void;
}

export const useWealthStore = create<wealthStore>((set, get) => ({
  // 初始状态
  portfolioStats: null,
  
  // 增强数据
  enhancedPositions: [],
  portfolioStatsData: null,
  validPositions: [],
  integratedPortfolio: null,
  
  lastFetchTime: {
    integrated: 0,
  },
  isLoading: {
    creating: false,
    updating: false,
    deleting: false,
    refreshing: false,
    integrated: false,
    holdingMarketData: false,
  },
  error: null,
  
  // 计算属性
  hasPortfolioData: false,
  hasBasicData: false,

  // 清除错误
  clearError: () => {
    set({ error: null });
  },

  // 清除缓存
  clearCache: () => {
    set({
      lastFetchTime: {
        integrated: 0,
      }
    });
  },

  // 清除持仓相关缓存（Store层管理）
  clearPortfolioCache: () => {
    set({
      lastFetchTime: {
        integrated: 0,
      }
    });
    Logger.debug(LogModule.PORTFOLIO, '投资组合缓存已清除');
  },

  // 重置Store状态（用于认证失败等情况）
  resetStore: () => {
    set({
      portfolioStats: null,
      enhancedPositions: [],
      portfolioStatsData: null,
      validPositions: [],
      integratedPortfolio: null,
      lastFetchTime: {
        integrated: 0,
      },
      isLoading: {
        creating: false,
        updating: false,
        deleting: false,
        refreshing: false,
        integrated: false,
        holdingMarketData: false,
      },
      error: null,
      hasPortfolioData: false,
      hasBasicData: false,
    });
  },
  
  /**
   * 更新有效持仓列表
   * 从 enhancedPositions 中过滤出有效的持仓
   * 注意：enhancedPositions 已经在 fetchIntegratedPortfolio 中通过 transformToEnhancedPositions 设置
   */
  updateEnhancedPositions: () => {
    const state = get();
    
    // 过滤出有效持仓（非空且有必要字段）
    const validPositions = state.enhancedPositions.filter(
      (position): position is NonNullable<EnhancedPosition> => 
        position !== null && 
        position !== undefined && 
        position.symbol !== null && 
        position.symbol !== undefined && 
        position.id !== null && 
        position.id !== undefined
    );
    
    // 更新有效持仓列表
    set({ validPositions });
    
    Logger.debug(LogModule.PORTFOLIO, `更新有效持仓：${validPositions.length}/${state.enhancedPositions.length}`);
  },
  
  /**
   * 获取有效持仓列表
   * 过滤掉null、undefined和缺少必要属性的持仓
   * @returns 有效的持仓列表
   */
  getValidPositions: () => {
    const { enhancedPositions } = get();
    
    return enhancedPositions.filter((position): position is NonNullable<EnhancedPosition> => 
      position !== null && 
      position !== undefined && 
      position.symbol !== null && 
      position.symbol !== undefined && 
      position.id !== null && 
      position.id !== undefined
    );
  },
  
  /**
   * 更新投资组合统计数据
   * 基于enhancedPositions或portfolioStats计算
   */
  updatePortfolioStatsData: () => {
    const state = get();
    
    // 直接使用 fetchIntegratedPortfolio 中计算的 portfolioStats
    // 数据已经包含货币转换
    if (state.portfolioStats) {
      const portfolioStatsData: PortfolioStatsData = {
        totalValue: state.portfolioStats.totalValue || 0,
        totalGain: state.portfolioStats.totalGain || 0,
        totalGainPercent: state.portfolioStats.totalGainPercent || 0,
        dayGain: state.portfolioStats.dayGain || 0,
        dayGainPercent: state.portfolioStats.dayGainPercent || 0,
        isPositive: (state.portfolioStats.totalGain || 0) >= 0,
        isDayPositive: (state.portfolioStats.dayGain || 0) >= 0,
        dataSource: 'store' as const,
      };
      
      set({ portfolioStatsData });
    } else {
      set({ portfolioStatsData: null });
    }
  },
  
  /**
   * 获取集成投资组合数据
   * 包含持仓列表、市场数据和投资组合统计
   * 
   * @param options 可选参数
   * @returns 集成的投资组合数据
   */
  fetchIntegratedPortfolio: async (options?: {
    forceRefresh?: boolean;
  }) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, integrated: true },
        error: null
      }));
      
      // Step 1: 获取基础持仓数据（容错：失败则返回空）
      let basicPortfolio: any;
      try {
        basicPortfolio = await portfolioService.getPortfolioOverview();
        Logger.info(LogModule.PORTFOLIO, `Step 1 完成 - 获取了 ${basicPortfolio?.holdings?.length || 0} 个基础持仓`);
      } catch (error: any) {
      Logger.error(LogModule.PORTFOLIO, 'Step 1 失败 - 获取基础持仓:', error);
      set(state => ({
        portfolioStats: null,
        enhancedPositions: [],
        validPositions: [],
        portfolioStatsData: null,
        integratedPortfolio: null,
        isLoading: { ...state.isLoading, integrated: false }
      }));
      return;
      }
      
      if (!basicPortfolio?.holdings || basicPortfolio.holdings.length === 0) {
        set(state => ({
          portfolioStats: null,
          enhancedPositions: [],
          validPositions: [],
          portfolioStatsData: null,
          integratedPortfolio: basicPortfolio,
          lastFetchTime: { ...state.lastFetchTime, integrated: Date.now() },
          isLoading: { ...state.isLoading, integrated: false },
          hasPortfolioData: false,
          hasBasicData: true  // ✅ 即使没有持仓，也标记已有基础数据（已成功获取，只是为空）
        }));
        return;
      }
      
      // Step 2: 渐进式加载优化 - 先显示基础数据，然后异步加载报价
      // 优化策略：先显示基础持仓数据（无报价），让用户立即看到列表，然后异步加载报价数据
      
      // 2.1 先处理基础数据（无报价），立即显示给用户
      const basicHoldings = portfolioService.enrichHoldingsWithQuotes(
        basicPortfolio.holdings,
        {} // 空的报价映射，先显示基础数据
      );
      const basicPortfolioData = {
        ...basicPortfolio,
        holdings: basicHoldings
      };
      
      // 转换为EnhancedPosition类型（基础数据）
      const basicEnhancedPositions = portfolioService.transformToEnhancedPositions(basicPortfolioData.holdings);
      
      // 计算基础统计数据（使用成本价作为当前价）
      const basicPortfolioStats = portfolioService.calculatePortfolioStats(basicPortfolioData);
      
      // 立即更新状态，显示基础数据（让用户先看到持仓列表）
      set(state => ({
        enhancedPositions: basicEnhancedPositions,
        portfolioStats: basicPortfolioStats,
        integratedPortfolio: basicPortfolioData,
        isLoading: { ...state.isLoading, integrated: false }, // 先结束加载状态
        lastFetchTime: { ...state.lastFetchTime, integrated: Date.now() },
        hasPortfolioData: true,
        hasBasicData: true  // ✅ 标记已有基础数据
      }));
      
      // 更新增强持仓数据和统计数据（基础版本）
      get().updateEnhancedPositions();
      get().updatePortfolioStatsData();
      
      Logger.info(LogModule.PORTFOLIO, `✅ Portfolio displayed: ${basicEnhancedPositions.length} holdings (基础数据，立即显示)`);
      
      // 2.2 异步加载报价数据（不阻塞 UI）
      portfolioService.fetchBatchQuotesForHoldings(basicPortfolio.holdings)
        .then(quotesMap => {
          Logger.info(LogModule.PORTFOLIO, `Step 2 完成 - 获取了 ${Object.keys(quotesMap).length} 个报价`);
          
          // Step 3: 合并数据（带报价）
          const enrichedHoldings = portfolioService.enrichHoldingsWithQuotes(
            basicPortfolio.holdings,
            quotesMap
          );
          Logger.info(LogModule.PORTFOLIO, `Step 3 完成 - 合并数据`);
          
          const portfolioData = {
            ...basicPortfolio,
            holdings: enrichedHoldings
          };
          
          // Step 4: 货币转换（容错：转换失败使用原始数据）
          const targetCurrency = useSettingsStore.getState().currency || 'USD';
          return portfolioService.convertToCurrency(portfolioData, targetCurrency)
            .then(convertedData => {
              Logger.info(LogModule.PORTFOLIO, `Step 4 完成 - 货币转换到 ${targetCurrency}`);
              return convertedData;
            })
            .catch(error => {
              Logger.warn(LogModule.PORTFOLIO, 'Step 4 失败 - 货币转换，使用原始数据:', error);
              return portfolioData; // 使用原始数据
            });
        })
        .then(convertedData => {
          // 转换为EnhancedPosition类型（带报价）
          const enhancedPositions = portfolioService.transformToEnhancedPositions(convertedData.holdings);
          
          // 计算统计数据（带实时报价）
          const portfolioStats = portfolioService.calculatePortfolioStats(convertedData);
          
          // 更新状态（带报价的完整数据）
          set(state => ({
            enhancedPositions,
            portfolioStats,
            integratedPortfolio: convertedData,
            lastFetchTime: { ...state.lastFetchTime, integrated: Date.now() },
            hasPortfolioData: true,
            hasBasicData: true
          }));
          
          // 更新增强持仓数据和统计数据（完整版本）
          get().updateEnhancedPositions();
          get().updatePortfolioStatsData();
          
          Logger.info(LogModule.PORTFOLIO, `✅ Portfolio enriched with quotes: ${enhancedPositions.length} holdings`);
        })
        .catch(error => {
          Logger.warn(LogModule.PORTFOLIO, 'Step 2 失败 - 批量获取报价，继续使用基础数据:', error);
          // 即使报价加载失败，基础数据仍然可用，用户已经看到持仓列表
        });
      
    } catch (error: any) {
      Logger.error(LogModule.PORTFOLIO, '❌ Failed to fetch portfolio:', error);
      set(state => ({
        error: error instanceof Error ? error.message : '获取投资组合数据失败',
        isLoading: { ...state.isLoading, integrated: false }
      }));
    }
  },
  
  /**
   * 调整持仓（增持或减持）- V2接口
   */
  adjustPosition: async (symbol: string, changeShares: number, transactionPrice: number) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, updating: true },
        error: null,
      }));
      
      // 调用V2接口调整持仓
      const result = await portfolioService.adjustPosition(
        symbol, 
        changeShares, 
        transactionPrice
      );
      
      // 成功后刷新投资组合数据
      await get().fetchIntegratedPortfolio({ forceRefresh: true });
      
      set(state => ({
        isLoading: { ...state.isLoading, updating: false },
      }));
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to adjust position';
      ErrorHandler.logError('PortfolioStore.adjustPosition', error, {
        symbol,
        changeShares,
        transactionPrice
      });
      
      set(state => ({
        isLoading: { ...state.isLoading, updating: false },
        error: errorMessage,
      }));
      
      throw error;
    }
  },

  /**
   * 初始化投资组合数据 - 完整加载所有数据
   */
  initializeData: async () => {
    const state = get();
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!isAuthenticated) {
      Logger.debug(LogModule.PORTFOLIO, '[initializeData] 跳过：用户未登录');
      return;
    }
    
    // 检查是否有错误且应该停止重试
    if (state.error && ErrorHandler.shouldStopRetry(state.error)) {
      Logger.warn(LogModule.PORTFOLIO, '[initializeData] 跳过：存在认证错误');
      return;
    }
    
    // 避免重复初始化
    if (state.isLoading.integrated) {
      Logger.debug(LogModule.PORTFOLIO, '[initializeData] 跳过：正在加载中');
      return;
    }
    
    Logger.info(LogModule.PORTFOLIO, '[initializeData] 🚀 开始初始化投资组合数据...');
    
    try {
      // 使用集成接口一次性获取所有数据
      await get().fetchIntegratedPortfolio({ forceRefresh: false });
      Logger.info(LogModule.PORTFOLIO, '[initializeData] ✅ 初始化完成');
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '[initializeData] ❌ 初始化失败:', error);
      throw error;
    }
  },
  
  /**
   * 刷新投资组合数据（下拉刷新）
   */
  refresh: async () => {
    const state = get();
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // 基础检查
    if (!isAuthenticated || state.isLoading.integrated) return;

    // 错误检查
    if (state.error && ErrorHandler.shouldStopRetry(state.error)) {
      Logger.warn(LogModule.PORTFOLIO, '[refresh] 跳过：存在认证错误');
      return;
    }
    
    Logger.info(LogModule.PORTFOLIO, '[refresh] 🔄 开始下拉刷新...');
    
    try {
      // 设置刷新状态
      set(state => ({
        isLoading: { ...state.isLoading, refreshing: true }
      }));
      
      // 清除缓存时间戳，强制刷新
      get().clearPortfolioCache();
      
      // 重新获取数据
      await get().fetchIntegratedPortfolio({ forceRefresh: true });
      
      // 清除错误状态
      get().clearError();
      
      Logger.info(LogModule.PORTFOLIO, '[refresh] ✅ 刷新完成');
    } catch (error) {
      Logger.error(LogModule.PORTFOLIO, '[refresh] ❌ 刷新失败:', error);
    } finally {
      // 无论成功失败，都取消刷新状态
      set(state => ({
        isLoading: { ...state.isLoading, refreshing: false }
      }));
    }
  },
  
  /**
   * 页面聚焦时的刷新检查
   */
  focusRefresh: () => {
    const state = get();
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // 基础检查
    if (!isAuthenticated) {
      Logger.debug(LogModule.PORTFOLIO, '[focusRefresh] 跳过：用户未登录');
      return;
    }
    
    // 错误检查
    if (state.error && ErrorHandler.shouldStopRetry(state.error)) {
      Logger.warn(LogModule.PORTFOLIO, '[focusRefresh] 跳过：存在认证错误');
      return;
    }
    
    // 避免并发加载
    if (state.isLoading.integrated) {
      Logger.debug(LogModule.PORTFOLIO, '[focusRefresh] 跳过：正在加载中');
      return;
    }
    
    // 时间检查：超过 10 秒才刷新
    const now = Date.now();
    const lastFetch = state.lastFetchTime.integrated;
    const timeSinceLastFetch = lastFetch ? now - lastFetch : Infinity;
    const REFRESH_INTERVAL = 10000; // 10秒
    
    if (timeSinceLastFetch < REFRESH_INTERVAL) {
      Logger.debug(LogModule.PORTFOLIO, `[focusRefresh] 跳过：数据仍然新鲜（${Math.round(timeSinceLastFetch / 1000)}秒前加载）`);
      return;
    }
    
    // 执行刷新
    Logger.info(LogModule.PORTFOLIO, `[focusRefresh] 🔄 开始刷新数据（距上次 ${timeSinceLastFetch === Infinity ? '从未' : Math.round(timeSinceLastFetch / 1000) + '秒'}）`);
    
    // 使用集成接口刷新所有数据
    get().fetchIntegratedPortfolio({ forceRefresh: false }).catch((error) => {
      Logger.error(LogModule.PORTFOLIO, '[focusRefresh] ❌ 刷新失败:', error);
    });
  },

  /**
   * 获取持仓数量 - 智能方法
   * 确保数据已加载，如果未加载则自动获取
   * @returns Promise<number> 持仓数量
   */
  getPositionCount: async (): Promise<number> => {
    const state = get();
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    // 检查认证状态
    if (!isAuthenticated) {
      Logger.info(LogModule.PORTFOLIO, '[WealthStore] 用户未登录，持仓数量为0');
      return 0;
    }
    
    // 如果正在加载，等待加载完成（带超时）
    const MAX_WAIT_TIME = 10000; // 10秒超时
    const startTime = Date.now();
    
    while (state.isLoading.integrated && (Date.now() - startTime) < MAX_WAIT_TIME) {
      Logger.info(LogModule.PORTFOLIO, '[WealthStore] 等待持仓数据加载...');
      await new Promise(resolve => setTimeout(resolve, 100));
      // 重新获取当前状态
      const currentState = get();
      if (!currentState.isLoading.integrated) break;
    }
    
    // 检查是否有持仓数据
    const { validPositions, lastFetchTime } = get();
    
    if (!validPositions || validPositions.length === 0 || !lastFetchTime.integrated) {
      Logger.info(LogModule.PORTFOLIO, '[WealthStore] 持仓数据为空或未加载，主动获取数据');
      try {
        await get().fetchIntegratedPortfolio();
        // 重新获取更新后的有效持仓
        const updatedState = get();
        return updatedState.validPositions?.length || 0;
      } catch (error) {
        Logger.error(LogModule.PORTFOLIO, '[WealthStore] 获取持仓数据失败:', error);
        return 0;
      }
    }
    
    Logger.info(LogModule.PORTFOLIO, `[WealthStore] 持仓数量: ${validPositions.length}`);
    return validPositions.length;
  },
  
  /**
   * 获取特定股票的持仓信息 - 智能方法
   * @param symbol 股票代码
   * @param exchange 交易所代码（可选）
   * @returns Promise<EnhancedPosition | null> 持仓信息
   */
  getStockPosition: async (symbol: string, exchange?: string): Promise<EnhancedPosition | null> => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;
    
    if (!isAuthenticated) {
      return null;
    }
    
    // 确保数据已加载
    await get().getPositionCount();
    
    const { validPositions } = get();
    
    // 查找匹配的持仓
    const position = validPositions.find(pos => {
      const symbolMatch = pos.symbol.toUpperCase() === symbol.toUpperCase();
      
      if (exchange) {
        const exchangeMatch = pos.exchange?.toUpperCase() === exchange.toUpperCase();
        return symbolMatch && exchangeMatch;
      }
      
      return symbolMatch;
    });
    
    Logger.info(LogModule.PORTFOLIO, `[WealthStore] 查找持仓 ${symbol}:${exchange || 'ANY'}`, {
      found: !!position,
      positionId: position?.id,
      quantity: position?.quantity
    });
    
    return position || null;
  },
  
  /**
   * 检查是否有特定股票的持仓 - 智能方法
   * @param symbol 股票代码
   * @param exchange 交易所代码（可选）
   * @returns Promise<boolean> 是否有持仓
   */
  hasStockPosition: async (symbol: string, exchange?: string): Promise<boolean> => {
    const position = await get().getStockPosition(symbol, exchange);
    
    const hasPosition = position !== null && position.quantity > 0;
    
    Logger.info(LogModule.PORTFOLIO, `[WealthStore] 股票 ${symbol}:${exchange || 'ANY'} 持仓检查结果: ${hasPosition}`);
    
    return hasPosition;
  },
}));

// 导出Store选择器
export const portfolioSelectors = {
  enhancedPositions: (state: wealthStore) => state.enhancedPositions,
  validPositions: (state: wealthStore) => state.validPositions,
  portfolioStats: (state: wealthStore) => state.portfolioStats,
  portfolioStatsData: (state: wealthStore) => state.portfolioStatsData,
  isLoading: (state: wealthStore) => state.isLoading,
  error: (state: wealthStore) => state.error,
  hasPortfolioData: (state: wealthStore) => state.hasPortfolioData,
}; 