/**
 * 排行榜状态管理 Store
 * 
 * 职责：
 * - 管理排行榜配置和数据状态
 * - 本地配置 CRUD（添加/删除/排序/重命名/创建分类）
 * - 构建 UI 显示分类
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { leaderboardService } from '@/services/market/leaderboardService';
import { useLanguageStore } from '@/stores/system/languageStore';
import { getCurrentLanguage } from '@/config/i18n';
import { getCategoryIcon, getLeaderboardIcon } from '@/helpers/leaderboardIconMapper';
import { Storage } from '@/utils/storage';
import type { Language } from '@/types/i18n';

import type {
  DefaultLeaderboardConfig,
  DefaultLeaderboard,
  LocalLeaderboardConfig,
  LeaderboardDataResponse,
  LeaderboardDisplayCategory,
  LeaderboardDisplayItem,
  LeaderboardDataParams,
} from '@/types/leaderboard';

interface LeaderboardState {
  // ========== 数据状态 ==========
  defaultConfig: DefaultLeaderboardConfig | null;
  localConfig: LocalLeaderboardConfig | null;
  systemConfigs: any[];
  leaderboardData: Record<string, LeaderboardDataResponse>;
  displayCategories: LeaderboardDisplayCategory[];
  selectedCategoryId: string | null;
  selectedLeaderboardCode: string | null;
  
  // ========== 加载状态 ==========
  isLoading: {
    initialization: boolean;
    systemConfigs: boolean;
    leaderboardData: Record<string, boolean>;
  };
  error: string | null;
  isInitialized: boolean;
  
  // ========== 方法 ==========
  initialize: () => Promise<void>;
  initializeWithDefaultConfig: () => Promise<void>;
  fetchSystemConfigs: () => Promise<void>;
  fetchLeaderboardData: (configCode: string, params?: LeaderboardDataParams) => Promise<void>;
  refreshLeaderboardData: (configCode: string, params?: LeaderboardDataParams) => Promise<void>;
  
  // 本地配置管理
  addLeaderboardToLocal: (categoryId: string, leaderboardCode: string) => Promise<void>;
  removeLeaderboardFromLocal: (categoryId: string, leaderboardCode: string) => Promise<void>;
  batchAddLeaderboards: (additions: { categoryId: string; leaderboardCode: string }[]) => Promise<void>;
  batchRemoveLeaderboards: (removals: { categoryId: string; leaderboardCode: string }[]) => Promise<void>;
  batchAddFromSheet: (codes: string[], targetCategoryId?: string) => Promise<string | undefined>;
  renameCategory: (categoryId: string, customName: string) => Promise<void>;
  renameLeaderboard: (categoryId: string, code: string, customName: string) => Promise<void>;
  updateMarketCode: (categoryId: string, oldCode: string, newMarketCode: string) => Promise<void>;
  reorderCategories: (orderedCategoryIds: string[]) => Promise<void>;
  reorderLeaderboards: (categoryId: string, orderedCodes: string[]) => Promise<void>;
  deleteLeaderboard: (categoryId: string, code: string) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  createCategory: (categoryName: string) => Promise<void>;
  
  // 数据查询
  getLeaderboardDisplayData: (configCode: string) => LeaderboardDataResponse | null;
  getConfigByCode: (configCode: string) => DefaultLeaderboard | null;
  
  // 选中状态
  setSelectedCategory: (categoryId: string) => void;
  setSelectedLeaderboard: (leaderboardCode: string) => void;
  setSelectedState: (categoryId: string, leaderboardCode: string) => void;
  
  // 辅助
  rebuildDisplayCategories: () => void;
  clearError: () => void;
  reset: () => void;
}

// ========== 辅助函数 ==========

/** 获取翻译文本，优先当前语言，回退 en -> zh */
function getTranslation(translations: any, lang: Language): string | undefined {
  if (!translations) return undefined;
  return translations[lang] || translations['en'] || translations['zh'];
}

/** 从 defaultConfig 或 systemConfigs 查找排行榜配置 */
function findLeaderboardConfig(
  key: string,
  defaultConfig: DefaultLeaderboardConfig | null,
  systemConfigs: any[]
): DefaultLeaderboard | null {
  if (!defaultConfig) return null;

  // 1. 先用完整 key 查找（带 :market_code 的情况，如 stocks_market_movers.large_cap:america）
  let config = defaultConfig.leaderboards[key];
  if (config) return config;

  // 2. 再用去掉 market_code 的 key 查找（不带 market_code 的情况，如 crypto_coins.large_cap）
  const leaderboardId = key.split(':')[0];
  config = defaultConfig.leaderboards[leaderboardId];
  if (config) return config;
  
  // 3. 最后在 systemConfigs 中查找
  const systemConfig = systemConfigs.find((c: any) => c.id === leaderboardId);
  if (systemConfig) return systemConfig;
  
  return null;
}

export const useLeaderboardStore = create<LeaderboardState>()(
  subscribeWithSelector((set, get) => ({
  // ========== 初始状态 ==========
  defaultConfig: null,
  localConfig: null,
  systemConfigs: [],
  leaderboardData: {},
  displayCategories: [],
  selectedCategoryId: null,
  selectedLeaderboardCode: null,
  
  isLoading: {
    initialization: false,
    systemConfigs: false,
    leaderboardData: {}
  },
  error: null,
  isInitialized: false,
  
  // ========== 初始化 ==========
  
  initialize: async () => {
    if (get().isInitialized) return;
    
    try {
      set(state => ({
        isLoading: { ...state.isLoading, initialization: true },
        error: null
      }));

      // 1. 获取默认配置
      const defaultConfig = await leaderboardService.fetchDefaultConfig();
      set({ defaultConfig });

      // 2. 加载本地配置
      const localConfig = await leaderboardService.getLocalConfig();

      // 3. 无本地配置则用默认配置初始化
      if (!localConfig) {
        const now = new Date().toISOString();
        const newLocalConfig: LocalLeaderboardConfig = {
          version: defaultConfig.version,
          last_updated: now,
          categories: defaultConfig.categories.map((cat, catIndex) => ({
            id: cat.id,
            name_translations: cat.name_translations,
            sort_order: catIndex,
            leaderboards: cat.leaderboards.map((code, index) => ({
              code,
              sort_order: index,
              added_at: now
            }))
          }))
        };
        await leaderboardService.saveLocalConfig(newLocalConfig);
        set({ localConfig: newLocalConfig });
      } else {
        set({ localConfig });
      }

      // 4. 构建显示分类
      get().rebuildDisplayCategories();

      set({
        isInitialized: true,
        isLoading: { ...get().isLoading, initialization: false }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Initialization failed';
      Logger.error(LogModule.STOCK, '[LeaderboardStore] 初始化失败:', error);
      set({
        error: message,
        isLoading: { ...get().isLoading, initialization: false }
      });
    }
  },
  
  /**
   * 重置配置：清除本地存储，重新从 API 获取默认配置
   * 用于"重置配置"功能，解决本地配置错误问题（如期货显示外汇数据）
   */
  initializeWithDefaultConfig: async () => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, initialization: true },
        error: null
      }));
      
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 开始重置配置...');
      
      // 1. 清除本地配置存储
      await leaderboardService.clearLocalConfig();
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 本地配置已清除');
      
      // 2. 清除默认配置缓存（强制重新从API获取）
      await Storage.removeItem('leaderboard_default_config');
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 默认配置缓存已清除');
      
      // 3. 重新获取默认配置
      const defaultConfig = await leaderboardService.fetchDefaultConfig();
      
      // 调试：打印获取到的 defaultConfig.leaderboards 的 keys
      const leaderboardKeys = Object.keys(defaultConfig.leaderboards);
      Logger.debug(LogModule.STOCK, `[initializeWithDefaultConfig] 获取到 ${leaderboardKeys.length} 个 leaderboards`);
      Logger.debug(LogModule.STOCK, '[initializeWithDefaultConfig] 前10个 keys:', leaderboardKeys.slice(0, 10));
      Logger.debug(LogModule.STOCK, '[initializeWithDefaultConfig] 带 :market_code 的 keys:', leaderboardKeys.filter(k => k.includes(':')));
      
      set({ defaultConfig });
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 默认配置已获取');
      
      // 3. 使用默认配置初始化本地配置
      const now = new Date().toISOString();
      const newLocalConfig: LocalLeaderboardConfig = {
        version: defaultConfig.version,
        last_updated: now,
        categories: defaultConfig.categories.map((cat, catIndex) => ({
          id: cat.id,
          name_translations: cat.name_translations,
          sort_order: catIndex,
          leaderboards: cat.leaderboards.map((code, index) => ({
            code,
            sort_order: index,
            added_at: now
          }))
        }))
      };
      await leaderboardService.saveLocalConfig(newLocalConfig);
      set({ localConfig: newLocalConfig });
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 本地配置已重新初始化');
      
      // 4. 重新构建显示分类
      get().rebuildDisplayCategories();
      
      // 5. 清除所有排行榜数据缓存
      set({ leaderboardData: {} });
      
      set({
        isInitialized: true,
        isLoading: { ...get().isLoading, initialization: false }
      });
      
      Logger.info(LogModule.STOCK, '[LeaderboardStore] 配置重置完成');
    } catch (error) {
      const message = error instanceof Error ? error.message : '重置配置失败';
      Logger.error(LogModule.STOCK, '[LeaderboardStore] 重置配置失败:', error);
      set({
        error: message,
        isLoading: { ...get().isLoading, initialization: false }
      });
      throw error; // 抛出错误让 UI 层处理
    }
  },
  
  // ========== 系统配置（供自定义页面使用） ==========
  
  fetchSystemConfigs: async () => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, systemConfigs: true },
        error: null
      }));
      
      const configs = await leaderboardService.fetchConfigs();
      
      set({
        systemConfigs: configs,
        isLoading: { ...get().isLoading, systemConfigs: false }
      });
    } catch (error) {
      Logger.error(LogModule.STOCK, '[LeaderboardStore] fetchSystemConfigs 失败:', error);
      set({
        systemConfigs: [],
        isLoading: { ...get().isLoading, systemConfigs: false }
      });
    }
  },
  
  // ========== 排行榜数据获取 ==========
  
  fetchLeaderboardData: async (configCode: string, params: LeaderboardDataParams = {}) => {
    try {
      set(state => ({
        isLoading: {
          ...state.isLoading,
          leaderboardData: { ...state.isLoading.leaderboardData, [configCode]: true }
        },
        error: null
      }));

      const { defaultConfig } = get();

      // 从 configCode 中提取 leaderboardId 和 marketCode
      const [leaderboardId, marketCode] = configCode.includes(':')
        ? configCode.split(':')
        : [configCode, undefined];

      const config = defaultConfig?.leaderboards[leaderboardId];
      const apiParams = {
        ...params,
        ...(marketCode && { market_code: marketCode })
      };

      const data = await leaderboardService.fetchLeaderboardData(config?.id || leaderboardId, apiParams);
      
      set(state => ({
        leaderboardData: { ...state.leaderboardData, [configCode]: data },
        isLoading: {
          ...state.isLoading,
          leaderboardData: { ...state.isLoading.leaderboardData, [configCode]: false }
        }
      }));
    } catch (error) {
      Logger.error(LogModule.STOCK, `[LeaderboardStore] fetchLeaderboardData ${configCode} 失败:`, error);
      set(state => ({
        isLoading: {
          ...state.isLoading,
          leaderboardData: { ...state.isLoading.leaderboardData, [configCode]: false }
        },
        error: error instanceof Error ? error.message : 'Failed to fetch leaderboard data'
      }));
    }
  },
  
  refreshLeaderboardData: async (configCode: string, params?: LeaderboardDataParams) => {
    try {
      const { defaultConfig } = get();

      // 从 configCode 中提取 leaderboardId 和 marketCode
      const [leaderboardId, marketCode] = configCode.includes(':')
        ? configCode.split(':')
        : [configCode, undefined];

      const config = defaultConfig?.leaderboards[leaderboardId];
      const apiParams = {
        ...params,
        ...(marketCode && { market_code: marketCode })
      };

      const data = await leaderboardService.fetchLeaderboardData(config?.id || leaderboardId, apiParams);
      
      set(state => ({
        leaderboardData: { ...state.leaderboardData, [configCode]: data }
      }));
    } catch (error) {
      Logger.error(LogModule.STOCK, `[LeaderboardStore] refreshLeaderboardData ${configCode} 失败:`, error);
      set({ error: error instanceof Error ? error.message : 'Failed to refresh leaderboard data' });
    }
  },
  
  // ========== 本地配置管理 ==========
  
  addLeaderboardToLocal: async (categoryId: string, leaderboardCode: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    try {
      const updatedConfig = JSON.parse(JSON.stringify(localConfig));
      const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
      
      if (category) {
        const exists = category.leaderboards.some((item: any) => item.code === leaderboardCode);
        if (!exists) {
          const maxSortOrder = Math.max(...category.leaderboards.map((lb: any) => lb.sort_order ?? 0), -1);
          category.leaderboards.push({
            code: leaderboardCode,
            sort_order: maxSortOrder + 1,
            added_at: new Date().toISOString()
          });
          updatedConfig.last_updated = new Date().toISOString();
          
          await leaderboardService.saveLocalConfig(updatedConfig);
          set({ localConfig: updatedConfig });
          get().rebuildDisplayCategories();
        }
      }
    } catch (error) {
      Logger.error(LogModule.STOCK, '[LeaderboardStore] addLeaderboardToLocal 失败:', error);
      throw error;
    }
  },
  
  removeLeaderboardFromLocal: async (categoryId: string, leaderboardCode: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    try {
      const updatedConfig = JSON.parse(JSON.stringify(localConfig));
      const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
      
      if (category) {
        category.leaderboards = category.leaderboards.filter((item: any) => item.code !== leaderboardCode);
        updatedConfig.last_updated = new Date().toISOString();
        
        await leaderboardService.saveLocalConfig(updatedConfig);
        set({ localConfig: updatedConfig });
        get().rebuildDisplayCategories();
      }
    } catch (error) {
      Logger.error(LogModule.STOCK, '[LeaderboardStore] removeLeaderboardFromLocal 失败:', error);
      throw error;
    }
  },
  
  batchAddLeaderboards: async (additions: { categoryId: string; leaderboardCode: string }[]) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    try {
      const updatedConfig = JSON.parse(JSON.stringify(localConfig));
      const now = new Date().toISOString();
      
      additions.forEach(({ categoryId, leaderboardCode }) => {
        const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
        if (category) {
          const exists = category.leaderboards.some((item: any) => item.code === leaderboardCode);
          if (!exists) {
            const maxSortOrder = Math.max(...category.leaderboards.map((lb: any) => lb.sort_order ?? 0), -1);
            category.leaderboards.push({
              code: leaderboardCode,
              sort_order: maxSortOrder + 1,
              added_at: now
            });
          }
        }
      });
      
      updatedConfig.last_updated = now;
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
    } catch (error) {
      Logger.error(LogModule.STOCK, '[LeaderboardStore] batchAddLeaderboards 失败:', error);
      throw error;
    }
  },
  
  batchRemoveLeaderboards: async (removals: { categoryId: string; leaderboardCode: string }[]) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    try {
      const updatedConfig = JSON.parse(JSON.stringify(localConfig));
      
      removals.forEach(({ categoryId, leaderboardCode }) => {
        const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
        if (category) {
          category.leaderboards = category.leaderboards.filter((item: any) => item.code !== leaderboardCode);
        }
      });
      
      updatedConfig.last_updated = new Date().toISOString();
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
    } catch (error) {
      Logger.error(LogModule.STOCK, '[LeaderboardStore] batchRemoveLeaderboards 失败:', error);
      throw error;
    }
  },
  
  batchAddFromSheet: async (codes: string[], targetCategoryId?: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const categoryId = targetCategoryId || 'recommended';
    const targetCategory = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
    
    if (targetCategory) {
      const now = new Date().toISOString();
      const maxSortOrder = Math.max(...targetCategory.leaderboards.map((lb: any) => lb.sort_order ?? 0), -1);
      
      codes.forEach((code, index) => {
        if (!targetCategory.leaderboards.find((lb: any) => lb.code === code)) {
          targetCategory.leaderboards.push({
            code,
            sort_order: maxSortOrder + 1 + index,
            added_at: now
          });
        }
      });
      
      updatedConfig.last_updated = now;
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
      
      return targetCategory.id;
    }
  },
  
  // ========== 重命名 ==========
  
  renameCategory: async (categoryId: string, customName: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
    
    if (category) {
      category.custom_name = customName.trim();
      updatedConfig.last_updated = new Date().toISOString();
      
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
    }
  },
  
  renameLeaderboard: async (categoryId: string, code: string, customName: string) => {
    const { localConfig } = get();
    if (!localConfig) return;

    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);

    if (category) {
      const item = category.leaderboards.find((lb: any) => lb.code === code);
      if (item) {
        item.custom_name = customName.trim();
        updatedConfig.last_updated = new Date().toISOString();

        await leaderboardService.saveLocalConfig(updatedConfig);
        set({ localConfig: updatedConfig });
        get().rebuildDisplayCategories();
      }
    }
  },

  updateMarketCode: async (categoryId: string, oldCode: string, newMarketCode: string) => {
    const { localConfig, selectedLeaderboardCode } = get();
    if (!localConfig) return;

    // 解析旧 code,提取 leaderboard_id
    const [leaderboardId] = oldCode.split(':');
    const newCode = `${leaderboardId}:${newMarketCode}`;

    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);

    if (category) {
      const item = category.leaderboards.find((lb: any) => lb.code === oldCode);
      if (item) {
        item.code = newCode;
        updatedConfig.last_updated = new Date().toISOString();

        await leaderboardService.saveLocalConfig(updatedConfig);
        set({ localConfig: updatedConfig });
        get().rebuildDisplayCategories();

        // 如果更新的是当前选中的排行榜,更新选中状态并重新获取数据
        if (selectedLeaderboardCode === oldCode) {
          set({ selectedLeaderboardCode: newCode });
          const params = { start: 0, count: 50, lang: getCurrentLanguage() as string };
          await get().fetchLeaderboardData(newCode, params);
        }
      }
    }
  },

  // ========== 排序 ==========
  
  reorderCategories: async (orderedCategoryIds: string[]) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    orderedCategoryIds.forEach((id, index) => {
      const category = updatedConfig.categories.find((cat: any) => cat.id === id);
      if (category) category.sort_order = index;
    });
    
    updatedConfig.categories.sort((a: any, b: any) => a.sort_order - b.sort_order);
    updatedConfig.last_updated = new Date().toISOString();
    
    await leaderboardService.saveLocalConfig(updatedConfig);
    set({ localConfig: updatedConfig });
    get().rebuildDisplayCategories();
  },
  
  reorderLeaderboards: async (categoryId: string, orderedCodes: string[]) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
    
    if (category) {
      orderedCodes.forEach((code, index) => {
        const item = category.leaderboards.find((lb: any) => lb.code === code);
        if (item) item.sort_order = index;
      });
      
      category.leaderboards.sort((a: any, b: any) => a.sort_order - b.sort_order);
      updatedConfig.last_updated = new Date().toISOString();
      
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
    }
  },
  
  // ========== 删除和创建 ==========
  
  deleteLeaderboard: async (categoryId: string, code: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const category = updatedConfig.categories.find((cat: any) => cat.id === categoryId);
    
    if (category) {
      category.leaderboards = category.leaderboards.filter((item: any) => item.code !== code);
      updatedConfig.last_updated = new Date().toISOString();
      
      await leaderboardService.saveLocalConfig(updatedConfig);
      set({ localConfig: updatedConfig });
      get().rebuildDisplayCategories();
    }
  },
  
  deleteCategory: async (categoryId: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    updatedConfig.categories = updatedConfig.categories.filter((cat: any) => cat.id !== categoryId);
    updatedConfig.last_updated = new Date().toISOString();
    
    await leaderboardService.saveLocalConfig(updatedConfig);
    set({ localConfig: updatedConfig });
    get().rebuildDisplayCategories();
  },
  
  createCategory: async (categoryName: string) => {
    const { localConfig } = get();
    if (!localConfig) return;
    
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    
    const updatedConfig = JSON.parse(JSON.stringify(localConfig));
    const categoryId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const maxSortOrder = Math.max(...updatedConfig.categories.map((cat: any) => cat.sort_order || 0), -1);
    
    updatedConfig.categories.push({
      id: categoryId,
      name_translations: { zh: trimmedName, en: trimmedName },
      custom_name: trimmedName,
      sort_order: maxSortOrder + 1,
      leaderboards: [],
    });
    updatedConfig.last_updated = new Date().toISOString();
    
    await leaderboardService.saveLocalConfig(updatedConfig);
    set({ localConfig: updatedConfig });
    get().rebuildDisplayCategories();
  },
  
  // ========== 数据查询 ==========
  
  getLeaderboardDisplayData: (configCode: string) => {
    return get().leaderboardData[configCode] || null;
  },
  
  getConfigByCode: (configCode: string) => {
    return get().defaultConfig?.leaderboards[configCode] || null;
  },
  
  // ========== 选中状态 ==========
  
  setSelectedCategory: (categoryId: string) => {
    set({ selectedCategoryId: categoryId });
  },
  
  setSelectedLeaderboard: (leaderboardCode: string) => {
    set({ selectedLeaderboardCode: leaderboardCode });
  },
  
  setSelectedState: (categoryId: string, leaderboardCode: string) => {
    set({ selectedCategoryId: categoryId, selectedLeaderboardCode: leaderboardCode });
  },
  
  // ========== 显示分类构建 ==========
  
  rebuildDisplayCategories: () => {
    const { localConfig, defaultConfig, systemConfigs, isLoading } = get();

    if (!localConfig || !defaultConfig) {
      set({ displayCategories: [] });
      return;
    }

    // 调试：打印 defaultConfig.leaderboards 的所有 key
    Logger.debug(LogModule.STOCK, '[rebuildDisplayCategories] defaultConfig.leaderboards keys:', 
      Object.keys(defaultConfig.leaderboards).slice(0, 10));

    const currentLang = getCurrentLanguage() as Language;
    let needsSystemConfigLoad = false;

    const categories: LeaderboardDisplayCategory[] = [...localConfig.categories]
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((category) => {
        if (!category?.id || !Array.isArray(category.leaderboards)) return null;

        const leaderboards: LeaderboardDisplayItem[] = [...category.leaderboards]
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
          .map((item) => {
            const config = findLeaderboardConfig(item.code, defaultConfig, systemConfigs);
            if (!config) {
              Logger.warn(LogModule.STOCK, `[rebuildDisplayCategories] Config not found for code: ${item.code}`);
              if (systemConfigs.length === 0) needsSystemConfigLoad = true;
              return null;
            }

            return {
              code: item.code,
              name: item.custom_name || getTranslation(config.name_translations, currentLang) || config.id,
              description: getTranslation(config.description_translations, currentLang),
              icon: getLeaderboardIcon({ marketType: config.market_type, id: config.id || item.code }),
              is_custom: !!item.custom_name,
              sort_order: item.sort_order || 0,
              config
            } as LeaderboardDisplayItem;
          })
          .filter((item): item is LeaderboardDisplayItem => item !== null);

        return {
          id: category.id,
          name: category.custom_name || getTranslation(category.name_translations, currentLang) || category.id,
          icon: getCategoryIcon(category.id) || 'list',
          leaderboards
        };
      })
      .filter((cat): cat is LeaderboardDisplayCategory => cat !== null);

    set({ displayCategories: categories });

    // 自动选择默认分类和排行榜
    const { selectedCategoryId } = get();
    if (!selectedCategoryId && categories.length > 0) {
      const first = categories[0];
      if (first.leaderboards.length > 0) {
        set({
          selectedCategoryId: first.id,
          selectedLeaderboardCode: first.leaderboards[0].code
        });
      }
    }
    
    // 缺失配置且 systemConfigs 为空，延迟触发加载
    if (needsSystemConfigLoad && !isLoading.systemConfigs) {
      setTimeout(() => {
        get().fetchSystemConfigs().then(() => {
          get().rebuildDisplayCategories();
        }).catch(() => {});
      }, 100);
    }
  },
  
  clearError: () => {
    set({ error: null });
  },
  
  reset: () => {
    set({
      defaultConfig: null,
      localConfig: null,
      systemConfigs: [],
      leaderboardData: {},
      displayCategories: [],
      selectedCategoryId: null,
      selectedLeaderboardCode: null,
      isLoading: { initialization: false, systemConfigs: false, leaderboardData: {} },
      error: null,
      isInitialized: false
    });
  }
})));

// ========== 语言变化监听 ==========
if (typeof window !== 'undefined') {
  useLanguageStore.subscribe(
    (state) => state.currentLanguage,
    (currentLanguage, previousLanguage) => {
      if (currentLanguage !== previousLanguage) {
        const store = useLeaderboardStore.getState();
        if (store.isInitialized && (store.localConfig || store.defaultConfig)) {
          store.rebuildDisplayCategories();
        }
      }
    }
  );
}
