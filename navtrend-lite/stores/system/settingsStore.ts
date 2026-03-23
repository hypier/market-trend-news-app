import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import { CURRENCY_SYMBOLS, getDefaultCurrencyByLocale } from '@/utils/currencyFormatter';
import { Logger, LogModule } from '@/utils/logger';
import type { Language } from '@/types/i18n';
import { isLanguageSupported } from '@/config/i18n';

// 根据CURRENCY_SYMBOLS生成货币类型
type CurrencyType = keyof typeof CURRENCY_SYMBOLS;

interface AppSettings {
  // 应用设置
  isDarkMode: boolean;
  language: Language;
  currency: CurrencyType;

  // 显示设置
  showWelcomeScreen: boolean;
  chartDefaultPeriod: '1D' | '1W' | '1M' | '3M' | '1Y';
  autoRefreshInterval: number; // 秒
  enableHapticFeedback: boolean;

  // 隐私设置
  analyticsEnabled: boolean;
  crashReportingEnabled: boolean;
}

interface SettingsStore extends AppSettings {
  // 加载状态
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (settingsJson: string) => Promise<void>;
  clearError: () => void;
  setCurrency: (newCurrency: CurrencyType) => Promise<void>;
}

// 获取基于设备区域设置的默认货币
const getDefaultCurrency = (): CurrencyType => {
  const currencyCode = getDefaultCurrencyByLocale();
  return currencyCode as CurrencyType;
};

// 默认设置
const defaultSettings: AppSettings = {
  isDarkMode: false,
  language: 'en',
  currency: getDefaultCurrency(), // 使用基于区域设置的默认货币
  showWelcomeScreen: true,
  chartDefaultPeriod: '1D',
  autoRefreshInterval: 30,
  enableHapticFeedback: true,
  analyticsEnabled: true,
  crashReportingEnabled: true,
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  // 初始状态 - 使用默认设置
  ...defaultSettings,
  isLoading: false,
  error: null,

  // 加载设置
  loadSettings: async () => {
    try {
      set({ isLoading: true, error: null });

      const storedSettings = await Storage.getObject<Partial<AppSettings>>(
        STORAGE_KEYS.SETTINGS
      );

      if (storedSettings) {
        // 验证和设置货币
        let currency = storedSettings.currency;
        if (!currency || !Object.keys(CURRENCY_SYMBOLS).includes(currency as string)) {
          currency = getDefaultCurrency();
        }

        set({
          ...defaultSettings,
          ...storedSettings,
          currency: currency as CurrencyType,
          isLoading: false,
        });
      } else {
        // 首次使用，保存默认设置
        await Storage.setObject(STORAGE_KEYS.SETTINGS, defaultSettings);
        set({ isLoading: false });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to load settings',
      });
    }
  },

  // 更新设置
  updateSettings: async (updates: Partial<AppSettings>) => {
    try {
      set({ error: null });

      const currentState = get();
      const newSettings = {
        isDarkMode: currentState.isDarkMode,
        language: currentState.language,
        currency: currentState.currency,
        showWelcomeScreen: currentState.showWelcomeScreen,
        chartDefaultPeriod: currentState.chartDefaultPeriod,
        autoRefreshInterval: currentState.autoRefreshInterval,
        enableHapticFeedback: currentState.enableHapticFeedback,
        analyticsEnabled: currentState.analyticsEnabled,
        crashReportingEnabled: currentState.crashReportingEnabled,
        ...updates,
      };

      // 如果是货币变更，使用专门的方法处理
      if (updates.currency && updates.currency !== currentState.currency) {
        await get().setCurrency(updates.currency);
        // 返回，因为setCurrency已经完成了所有更新
        return;
      }

      // 保存到本地存储
      await Storage.setObject(STORAGE_KEYS.SETTINGS, newSettings);

      // 更新状态
      set(newSettings);
    } catch (error: any) {
      set({ error: error.message || 'Failed to update settings' });
      throw error;
    }
  },

  // 专门设置货币的方法
  setCurrency: async (newCurrency: CurrencyType) => {
    try {
      // 获取旧值用于比较
      const oldCurrency = get().currency;
      
      // 更新设置
      const currentState = get();
      const newSettings = {
        ...currentState,
        currency: newCurrency,
      };
      
      // 保存到本地存储
      await Storage.setObject(STORAGE_KEYS.SETTINGS, newSettings);
      
      // 更新状态
      set(newSettings);
      
      // 如果货币确实改变了
      if (oldCurrency !== newCurrency) {
        Logger.info(LogModule.PORTFOLIO, `货币从 ${oldCurrency} 变更为 ${newCurrency}，正在刷新数据...`);
        
        try {
          // 延迟导入打破循环依赖
          const { useWealthStore } = await import('@/stores/user/wealthStore');
          
          // 获取USD到新货币的汇率
          await useWealthStore.getState().fetchIntegratedPortfolio({ forceRefresh: true });
          // 手动确保刷新状态被重置
          useWealthStore.setState(state => ({
            isLoading: { ...state.isLoading, refreshing: false, any: false }
          }));
          
          Logger.info(LogModule.PORTFOLIO, '数据刷新完成，汇率和投资组合数据已更新');
        } catch (refreshError) {
          Logger.error(LogModule.PORTFOLIO, '刷新数据失败:', refreshError);
          // 即使刷新失败，也要确保刷新状态被重置
          const { useWealthStore } = await import('@/stores/user/wealthStore');
          useWealthStore.setState(state => ({
            isLoading: { ...state.isLoading, refreshing: false, any: false }
          }));
        }
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to set currency' });
      throw error;
    }
  },

  // 重置设置
  resetSettings: async () => {
    try {
      set({ error: null });

      await Storage.setObject(STORAGE_KEYS.SETTINGS, defaultSettings);
      
      // 如果当前货币不是默认货币，需要刷新数据
      const currentCurrency = get().currency;
      const defaultCurrency = defaultSettings.currency;
      
      if (currentCurrency !== defaultCurrency) {
        // 设置货币并刷新数据
        await get().setCurrency(defaultCurrency);
      } else {
        // 直接更新状态
        set({
          ...defaultSettings,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to reset settings' });
      throw error;
    }
  },

  // 导出设置
  exportSettings: async () => {
    try {
      const currentState = get();
      const settingsToExport: AppSettings = {
        isDarkMode: currentState.isDarkMode,
        language: currentState.language,
        currency: currentState.currency,
        showWelcomeScreen: currentState.showWelcomeScreen,
        chartDefaultPeriod: currentState.chartDefaultPeriod,
        autoRefreshInterval: currentState.autoRefreshInterval,
        enableHapticFeedback: currentState.enableHapticFeedback,
        analyticsEnabled: currentState.analyticsEnabled,
        crashReportingEnabled: currentState.crashReportingEnabled,
      };

      return JSON.stringify(settingsToExport, null, 2);
    } catch (error: any) {
      set({ error: error.message || 'Failed to export settings' });
      throw error;
    }
  },

  // 导入设置
  importSettings: async (settingsJson: string) => {
    try {
      set({ error: null });

      const importedSettings = JSON.parse(settingsJson) as Partial<AppSettings>;
      
      // 验证导入的设置
      const validatedSettings: Partial<AppSettings> = {};
      
      // 验证每个字段
      if (typeof importedSettings.isDarkMode === 'boolean') {
        validatedSettings.isDarkMode = importedSettings.isDarkMode;
      }
      
      // 验证语言 - 支持所有7种语言
      if (importedSettings.language && isLanguageSupported(importedSettings.language as Language)) {
        validatedSettings.language = importedSettings.language as Language;
      }
      
      // 特别处理货币字段，如果有效则使用setCurrency
      if (Object.keys(CURRENCY_SYMBOLS).includes(importedSettings.currency as string)) {
        const newCurrency = importedSettings.currency as CurrencyType;
        // 如果当前货币和导入的货币不同，则需要调用setCurrency
        if (get().currency !== newCurrency) {
          await get().setCurrency(newCurrency);
          // 从validatedSettings中移除currency，因为已经处理过了
          delete validatedSettings.currency;
        }
      }

      // 更新其他有效设置
      if (Object.keys(validatedSettings).length > 0) {
        await get().updateSettings(validatedSettings);
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to import settings' });
      throw error;
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));

// 导出Store选择器
export const settingsSelectors = {
  isDarkMode: (state: SettingsStore) => state.isDarkMode,
  language: (state: SettingsStore) => state.language,
  currency: (state: SettingsStore) => state.currency,
  display: (state: SettingsStore) => ({
    showWelcome: state.showWelcomeScreen,
    chartPeriod: state.chartDefaultPeriod,
    refreshInterval: state.autoRefreshInterval,
    hapticFeedback: state.enableHapticFeedback,
  }),
  privacy: (state: SettingsStore) => ({
    analytics: state.analyticsEnabled,
    crashReporting: state.crashReportingEnabled,
  }),
  isLoading: (state: SettingsStore) => state.isLoading,
  error: (state: SettingsStore) => state.error,
}; 