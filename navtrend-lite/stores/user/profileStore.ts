import { create } from 'zustand';
import { router } from 'expo-router';

interface ProfileStore {
  // 设置状态
  darkMode: boolean;
  
  // 设置操作
  setDarkMode: (enabled: boolean) => void;
  
  // 导航操作
  navigateToSetting: (page: string) => void;
  showLanguageSelector: () => void;
  showCurrencySelector: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // 初始状态 - 移除用户相关状态，这些由 authStore 管理
  darkMode: false,

  // 设置操作
  setDarkMode: (enabled: boolean) => {
    set({ darkMode: enabled });
    // TODO: 应用主题变更
  },

  // 导航操作
  navigateToSetting: (page: string) => {
    router.push(`/profile/${page}` as any);
  },

  // 语言选择器 - 导航到语言设置页面
  showLanguageSelector: () => {
    router.push('/profile/language');
  },

  // 货币选择器 - 导航到货币设置页面
  showCurrencySelector: () => {
    router.push('/profile/currency');
  },

})); 