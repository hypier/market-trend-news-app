/**
 * 汇率数据 Store
 * 
 * 职责：
 * - 管理加载状态和错误状态（UI 状态）
 * - 协调 Service 层的业务逻辑调用
 * - 提供统一的 API 接口给 UI 层
 * 
 * 注意：缓存由 Service 层统一管理，Store 层不存储汇率数据
 */

import { create } from 'zustand';
import { exchangeRateService } from '@/services/market/exchangeRateService';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';

/**
 * 汇率 Store 状态
 * 
 * 注意：缓存由 Service 层统一管理，Store 只负责状态协调
 */
interface ExchangeRateState {
  // 加载状态
  isLoading: {
    single: boolean;
    batch: boolean;
    convert: boolean;
  };
  
  // 错误状态
  error: string | null;
}

/**
 * 汇率 Store Actions
 */
interface ExchangeRateActions {
  /**
   * 获取单个汇率
   * @param fromCurrency 源货币
   * @param toCurrency 目标货币
   * @returns 汇率值
   */
  getExchangeRate: (fromCurrency: string, toCurrency: string) => Promise<number>;
  
  /**
   * 批量获取汇率
   * @param currencies 货币列表
   * @param targetCurrency 目标货币
   * @returns 汇率映射表
   */
  batchGetExchangeRates: (currencies: string[], targetCurrency: string) => Promise<Record<string, number>>;
  
  /**
   * 转换货币金额
   * @param amount 金额
   * @param fromCurrency 源货币
   * @param toCurrency 目标货币
   * @returns 转换后的金额
   */
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
  
  /**
   * 清除缓存
   */
  clearCache: () => void;
  
  /**
   * 清除错误
   */
  clearError: () => void;
  
  /**
   * 重置 Store
   */
  resetStore: () => void;
  
  // 移除 setCacheTTL，缓存策略由 Service 层统一管理
}

/**
 * 汇率 Store 类型
 */
type ExchangeRateStore = ExchangeRateState & ExchangeRateActions;

/**
 * 初始状态
 */
const initialState: ExchangeRateState = {
  isLoading: {
    single: false,
    batch: false,
    convert: false,
  },
  error: null,
};

/**
 * 创建汇率 Store
 */
export const useExchangeRateStore = create<ExchangeRateStore>((set, get) => ({
  ...initialState,
  
  /**
   * 获取单个汇率
   * 
   * 缓存策略由 Service 层统一管理，Store 只负责状态更新
   */
  getExchangeRate: async (fromCurrency: string, toCurrency: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, single: true },
        error: null
      }));
      
      // 调用 Service 层获取汇率（Service 层已包含缓存逻辑）
      const rate = await exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
      
      // 更新加载状态
      set(state => ({
        isLoading: { ...state.isLoading, single: false }
      }));
      
      return rate;
    } catch (error) {
      const message = error instanceof Error ? error.message : '获取汇率失败';
      Logger.error(LogModule.API, `[Store] 获取汇率失败: ${fromCurrency} => ${toCurrency}`, error);
      
      set(state => ({
        error: message,
        isLoading: { ...state.isLoading, single: false }
      }));
      
      // Service 层已处理缓存和默认值，直接返回 Service 的结果
      return 1;
    }
  },
  
  /**
   * 批量获取汇率
   * 
   * 缓存策略由 Service 层统一管理，Store 只负责状态更新
   */
  batchGetExchangeRates: async (currencies: string[], targetCurrency: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, batch: true },
        error: null
      }));
      
      // 调用 Service 层批量获取汇率（Service 层已包含缓存逻辑）
      const rates = await exchangeRateService.batchGetExchangeRates(currencies, targetCurrency);
      
      // 更新加载状态
      set(state => ({
        isLoading: { ...state.isLoading, batch: false }
      }));
      
      Logger.debug(LogModule.API, `[Store] 批量获取汇率完成: ${Object.keys(rates).length} 个`);
      return rates;
    } catch (error) {
      const message = error instanceof Error ? error.message : '批量获取汇率失败';
      Logger.error(LogModule.API, `[Store] 批量获取汇率失败`, error);
      
      set(state => ({
        error: message,
        isLoading: { ...state.isLoading, batch: false }
      }));
      
      // Service 层已处理缓存和默认值，返回空对象
      return {};
    }
  },
  
  /**
   * 转换货币金额
   */
  convertCurrency: async (amount: number, fromCurrency: string, toCurrency: string) => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, convert: true },
        error: null
      }));
      
      const rate = await get().getExchangeRate(fromCurrency, toCurrency);
      const convertedAmount = amount * rate;
      
      set(state => ({
        isLoading: { ...state.isLoading, convert: false }
      }));
      
      return convertedAmount;
    } catch (error) {
      const message = error instanceof Error ? error.message : '货币转换失败';
      Logger.error(LogModule.API, `[Store] 货币转换失败: ${amount} ${fromCurrency} => ${toCurrency}`, error);
      
      set(state => ({
        error: message,
        isLoading: { ...state.isLoading, convert: false }
      }));
      
      // 转换失败，返回原始金额
      return amount;
    }
  },
  
  /**
   * 清除缓存
   * 
   * 调用 Service 层清除实际缓存
   */
  clearCache: () => {
    Logger.debug(LogModule.API, '[Store] 清除汇率缓存');
    exchangeRateService.clearCache();
  },
  
  /**
   * 清除错误
   */
  clearError: () => {
    set({ error: null });
  },
  
  /**
   * 重置 Store
   */
  resetStore: () => {
    Logger.debug(LogModule.API, '[Store] 重置汇率 Store');
    set(initialState);
  },
  
  // 移除 setCacheTTL，缓存策略由 Service 层统一管理
}));

/**
 * 导出类型
 */
export type { ExchangeRateStore };

