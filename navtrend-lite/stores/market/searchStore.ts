import { create } from 'zustand';
import { Logger, LogModule } from '@/utils/logger';
import { searchService } from '@/services/market/searchService';
import type { TVSearchResultItem } from '@/types/tradingview';
import { t } from '@/config/i18n';

interface SearchState {
  // 搜索状态
  query: string;
  results: TVSearchResultItem[];
  isLoading: boolean;
  error: string | null;
  assetCategories: {
    code: string;
  }[];
}

interface SearchActions {
  // 设置搜索关键词
  setQuery: (query: string) => void;
  
  // 执行搜索（TradingView API v3）
  searchStocks: (query: string) => Promise<void>;
  
  // 清空搜索
  clearSearch: () => void;
  
  // 重置所有状态
  reset: () => void;
  
  // 获取过滤后的结果
  getFilteredResults: (selectedCategory: string) => TVSearchResultItem[];
}

type SearchStore = SearchState & SearchActions;

// 资产类型枚举（与 API type 字段一致）
export enum AssetType {
  ALL = 'all',
  STOCK = 'stock',
  FUNDS = 'funds',
  FUTURES = 'futures',
  FOREX = 'forex',
  CRYPTO = 'crypto',
  INDEX = 'index',
  BOND = 'bond',
  ECONOMIC = 'economic',
  OPTIONS = 'options',
  OTHER = 'other'  // 其它类型
}

// 本地多语言分类数据
export const assetCategories = [
  { code: AssetType.ALL },
  { code: AssetType.STOCK },
  { code: AssetType.FUNDS },
  { code: AssetType.FUTURES },
  { code: AssetType.FOREX },
  { code: AssetType.CRYPTO },
  { code: AssetType.INDEX },
  { code: AssetType.BOND },
  { code: AssetType.ECONOMIC },
  { code: AssetType.OPTIONS },
  { code: AssetType.OTHER },  // 其它类型
];

/**
 * 根据选择的类型筛选搜索结果
 * 
 * 说明：将 TradingView API 返回的 type 值映射到前端分类
 * 
 * @param results - API 返回的原始搜索结果
 * @param selectedCategory - 用户选择的类型
 * @returns 筛选后的结果列表
 */
function filterResultsByCategory(results: TVSearchResultItem[], selectedCategory: string): TVSearchResultItem[] {
  const resultsArray = Array.isArray(results) ? results : [];
  
  // 'all' 或空值表示显示所有结果
  if (!selectedCategory || selectedCategory === 'all' || !resultsArray.length) {
    return resultsArray;
  }
  
  // TradingView API type 到前端分类的映射表（与 search.tsx 保持一致）
  const typeToCategory: Record<string, string> = {
    // 加密货币相关
    'spot': 'crypto',
    'crypto': 'crypto',
    
    // 基金相关
    'fund': 'funds',
    'etf': 'funds',
    'funds': 'funds',
    
    // 股票相关
    'stock': 'stock',
    'dr': 'stock',        // 存托凭证
    'structured': 'stock', // 结构性产品
    
    // 债券相关
    'bond': 'bond',
    
    // 指数相关
    'index': 'index',
    
    // 外汇相关
    'forex': 'forex',
    
    // 期货相关
    'futures': 'futures',
    'future': 'futures',
    
    // 经济指标
    'economic': 'economic',
    
    // 期权相关
    'option': 'options',
    'options': 'options',
    'warrant': 'options',  // 认股权证
    
    // 差价合约
    'cfd': 'stock', // CFD 通常基于股票，归类到股票
  };
  
  // 筛选结果：将 API 的 type 映射到分类后再比较
  return resultsArray.filter(item => {
    const itemType = item.type?.toLowerCase() || '';
    // 未知类型归类为 'other'
    const categoryType = typeToCategory[itemType] || 'other';
    return categoryType === selectedCategory.toLowerCase();
  });
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  // 初始状态
  query: '',
  results: [],
  isLoading: false,
  error: null,

  assetCategories,

  // 设置搜索关键词
  setQuery: (query: string) => {
    set({ query: query || '' });
  },

  // 执行市场搜索（使用 TradingView 搜索 API v3）
  searchStocks: async (query: string) => {
    // 空查询直接清空结果
    if (!query || !query.trim()) {
      set({ results: [], error: null });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      // 调用新的搜索服务（TradingView Symbol Search API v3）
      // 参数：query（关键词）、filter（类型，不传表示全部）、lang（语言，默认 en）
      const searchResults = await searchService.searchMarket(query, undefined, 'en');
      
      Logger.debug(LogModule.STOCK, `搜索完成: query="${query}", 结果数=${searchResults.length}`);
      
      set({ 
        results: searchResults, 
        isLoading: false,
        error: null 
      });
    } catch (err) {
      Logger.error(LogModule.STOCK, 'Market search error:', err);
      
      // 区分不同类型的错误
      let errorMessage = t('errors.dataLoadFailed');
      
      if (err instanceof Error) {
        // 网络错误
        if (err.message.includes('Network') || err.message.includes('fetch')) {
          errorMessage = t('errors.networkError');
        }
        // API错误
        else if (err.message.includes('500')) {
          errorMessage = t('errors.serverError');
        }
        // 超时错误
        else if (err.message.includes('timeout')) {
          errorMessage = t('search.networkError');
        }
        else {
          errorMessage = err.message;
        }
      }
      
      set({ 
        results: [], 
        isLoading: false, 
        error: errorMessage 
      });
    }
  },

  // 清空搜索
  clearSearch: () => {
    set({ 
      query: '', 
      results: [], 
      error: null 
    });
  },

  // 重置所有状态
  reset: () => {
    set({ 
      query: '', 
      results: [], 
      isLoading: false, 
      error: null 
    });
  },

  // 新增：获取过滤后的结果
  getFilteredResults: (selectedCategory: string) => {
    const { results } = get();
    return filterResultsByCategory(results, selectedCategory);
  },
})); 