import { create } from 'zustand';
import { technicalAnalysisService } from '@/services/market/technicalAnalysisService';
import type {
  TechnicalAnalysisData,
  DetailedTechnicalIndicators,
} from '@/types/tradingview';

interface TechnicalAnalysisState {
  // 数据状态 - 使用 symbol 作为 key
  analysisData: Record<string, TechnicalAnalysisData | null>;
  indicatorsData: Record<string, DetailedTechnicalIndicators | null>;
  
  // 加载状态
  loading: Record<string, boolean>;
  
  // 错误状态
  errors: Record<string, string | null>;
  
  // Actions
  fetchTechnicalData: (tvSymbol: string) => Promise<void>;
  clearData: (tvSymbol: string) => void;
  clearAllData: () => void;
}

export const useTechnicalAnalysisStore = create<TechnicalAnalysisState>((set, get) => ({
  // 初始状态
  analysisData: {},
  indicatorsData: {},
  loading: {},
  errors: {},
  
  // 获取技术分析数据（同时获取多时间周期和详细指标）
  fetchTechnicalData: async (tvSymbol: string) => {
    try {
      // 设置加载状态
      set(state => ({
        loading: { ...state.loading, [tvSymbol]: true },
        errors: { ...state.errors, [tvSymbol]: null },
      }));
      
      // 批量获取数据
      const { analysis, indicators } = await technicalAnalysisService.getBatchTechnicalData(tvSymbol);
      
      // 更新数据
      set(state => ({
        analysisData: { ...state.analysisData, [tvSymbol]: analysis },
        indicatorsData: { ...state.indicatorsData, [tvSymbol]: indicators },
        loading: { ...state.loading, [tvSymbol]: false },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch technical data';
      
      set(state => ({
        loading: { ...state.loading, [tvSymbol]: false },
        errors: { ...state.errors, [tvSymbol]: message },
      }));
    }
  },
  
  // 清除指定股票的数据
  clearData: (tvSymbol: string) => {
    set(state => {
      const newAnalysisData = { ...state.analysisData };
      const newIndicatorsData = { ...state.indicatorsData };
      const newLoading = { ...state.loading };
      const newErrors = { ...state.errors };
      
      delete newAnalysisData[tvSymbol];
      delete newIndicatorsData[tvSymbol];
      delete newLoading[tvSymbol];
      delete newErrors[tvSymbol];
      
      return {
        analysisData: newAnalysisData,
        indicatorsData: newIndicatorsData,
        loading: newLoading,
        errors: newErrors,
      };
    });
  },
  
  // 清除所有缓存数据
  clearAllData: () => {
    set({
      analysisData: {},
      indicatorsData: {},
      loading: {},
      errors: {},
    });
  },
}));

