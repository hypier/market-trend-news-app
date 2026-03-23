import { create } from 'zustand';
import { Logger, LogModule } from '@/utils/logger';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  type Language, 
  initializeLanguage as initI18n, 
  setLanguage as setStoredLanguage,
  getCurrentLanguage 
} from '@/config/i18n';

interface LanguageState {
  currentLanguage: Language;
  isInitialized: boolean;
}

interface LanguageActions {
  setLanguage: (language: Language) => Promise<void>;
  initializeLanguage: () => Promise<void>;
}

type LanguageStore = LanguageState & LanguageActions;

// 全局标记，防止重复初始化
let isInitializing = false;
let hasInitialized = false;

export const useLanguageStore = create<LanguageStore>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    currentLanguage: getCurrentLanguage(), // 使用i18n模块检测到的系统语言作为初始值
    isInitialized: false,

    // 设置语言
    setLanguage: async (language: Language) => {
      try {
        await setStoredLanguage(language);
        set({ currentLanguage: language });
        // 语言设置成功
      } catch (error) {
        Logger.error(LogModule.AUTH, '❌ 语言设置失败:', error);
        throw error;
      }
    },

    // 初始化语言设置
    initializeLanguage: async () => {
      // 防止重复调用
      if (hasInitialized) {
        // 已经初始化过，直接返回
        return;
      }
      
      if (isInitializing) {
        // 正在初始化中，等待完成
        // 等待当前初始化完成
        while (isInitializing) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        return;
      }
      
      // 开始语言初始化
      isInitializing = true;
      
      try {
        // 使用i18n模块的初始化函数，它已经能够根据系统语言和存储设置适当地选择语言
        const language = await initI18n();
        set({ 
          currentLanguage: language,
          isInitialized: true 
        });
        
        hasInitialized = true;
        // 语言初始化完成
      } finally {
        isInitializing = false;
      }
    },
  }))
);

// 获取当前语言的便捷函数
export const getCurrentAppLanguage = (): Language => {
  return useLanguageStore.getState().currentLanguage;
}; 