/**
 * UpdateStore
 * 应用更新状态管理
 * 
 * 功能：
 * - 管理更新检查状态和结果
 * - 控制更新相关UI显示状态
 * - 处理用户更新交互行为
 * - 集成UpdateService和UserPreferenceStore
 */

import { create } from 'zustand';
import * as Linking from 'expo-linking';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { updateService } from '@/services/app/updateService';
import { versionCompareService } from '@/services/app/versionCompareService';
import { analyticsService } from '@/services/system/analyticsService';
import { useUserPreferenceStore } from '@/stores/user/userPreferenceStore';
import type { UpdateState, UpdateAction } from '@/types/update';

/**
 * 更新状态Store接口
 */
interface UpdateStoreState extends UpdateState {
  // Actions - 核心功能
  checkForUpdate: () => Promise<void>;
  initializeOnAppStart: () => Promise<void>;
  getCurrentVersionInfo: () => Promise<{ versionName: string; buildNumber: number }>;
  
  // Actions - 用户交互
  handleUpdateAction: (action: UpdateAction) => Promise<void>;
  navigateToStore: () => Promise<void>;
  dismissUpdate: () => Promise<void>;
  skipVersion: () => Promise<void>;
  
  // Actions - UI控制
  setUpdateModalVisible: (visible: boolean) => void;
  setUpdateBannerVisible: (visible: boolean) => void;
  showUpdateModal: () => void;
  hideUpdateModal: () => void;
  showUpdateBanner: () => void;
  hideUpdateBanner: () => void;
  
  // Actions - 错误处理
  clearError: () => void;
  reset: () => void;
}

/**
 * 默认状态
 */
const DEFAULT_STATE: UpdateState = {
  updateInfo: null,
  isLoading: {
    check: false,
    navigate: false,
  },
  error: null,
  ui: {
    isModalVisible: false,
    isBannerVisible: false,
    lastCheckTime: null,
  },
};

/**
 * 更新Store
 */
export const useUpdateStore = create<UpdateStoreState>((set, get) => ({
  // 初始状态
  ...DEFAULT_STATE,
  
  /**
   * 检查应用更新
   */
  checkForUpdate: async (): Promise<void> => {
    try {
      set(state => ({
        isLoading: { ...state.isLoading, check: true },
        error: null,
      }));
      
      const updateInfo = await updateService.checkForUpdate();
      const checkTime = new Date().toISOString();
      
      if (updateInfo) {
        // 检查是否应该显示更新提醒
        const shouldShow = await useUserPreferenceStore.getState().shouldShowUpdate(updateInfo);
        Logger.info(LogModule.UPDATE, `Update available: ${updateInfo.version.versionName}, will show: ${shouldShow}`);
        
        set(state => ({
          updateInfo,
          isLoading: { ...state.isLoading, check: false },
          ui: {
            ...state.ui,
            lastCheckTime: checkTime,
            isModalVisible: shouldShow,
            isBannerVisible: false,
          },
        }));
      } else {
        set(state => ({
          updateInfo: null,
          isLoading: { ...state.isLoading, check: false },
          ui: {
            ...state.ui,
            lastCheckTime: checkTime,
            isModalVisible: false,
            isBannerVisible: false,
          },
        }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update check failed';
      Logger.error(LogModule.UPDATE, 'Update check failed:', error);
      
      set(state => ({
        error: message,
        isLoading: { ...state.isLoading, check: false },
        ui: {
          ...state.ui,
          lastCheckTime: new Date().toISOString(),
        },
      }));
    }
  },
  
  /**
   * 应用启动时初始化更新检查
   */
  initializeOnAppStart: async (): Promise<void> => {
    try {
      // 加载用户偏好
      await useUserPreferenceStore.getState().loadPreferences();
      
      // 检查用户是否启用了自动更新检查
      const userPrefs = useUserPreferenceStore.getState();
      if (!userPrefs.autoUpdateCheck) {
        return;
      }
      
      // 执行更新检查
      await get().checkForUpdate();
    } catch (error) {
      Logger.error(LogModule.UPDATE, 'Failed to initialize update check:', error);
    }
  },

  /**
   * 获取当前应用版本信息
   */
  getCurrentVersionInfo: async (): Promise<{ versionName: string; buildNumber: number }> => {
    try {
      return await versionCompareService.getCurrentVersionInfo();
    } catch (error) {
      Logger.error(LogModule.UPDATE, 'Failed to get current version info:', error);
      throw error;
    }
  },
  
  /**
   * 处理用户更新行为
   */
  handleUpdateAction: async (action: UpdateAction): Promise<void> => {
    try {
      Logger.info(LogModule.UPDATE, `Handling update action: ${action}`);
      
      const currentState = get();
      const updateInfo = currentState.updateInfo;
      
      // 追踪用户行为
      if (updateInfo) {
        await analyticsService.logUpdateAction(action, updateInfo.version.versionName);
      }
      
      switch (action) {
        case 'update':
          await get().navigateToStore();
          break;
          
        case 'dismiss':
          get().dismissUpdate();
          break;
          
        case 'skip':
          await get().skipVersion();
          break;
          
        default:
          Logger.warn(LogModule.UPDATE, `Unknown update action: ${action}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to handle update action';
      Logger.error(LogModule.UPDATE, 'Failed to handle update action:', error);
      set({ error: message });
    }
  },
  
  /**
   * 导航到应用商店
   */
  navigateToStore: async (): Promise<void> => {
    try {
      const currentState = get();
      const updateInfo = currentState.updateInfo;
      
      if (!updateInfo || !updateInfo.storeUrl) {
        throw new Error('No store URL available');
      }
      
      Logger.info(LogModule.UPDATE, `Navigating to store: ${updateInfo.storeUrl}`);
      
      set(state => ({
        isLoading: { ...state.isLoading, navigate: true },
        error: null,
      }));
      
      // 打开应用商店链接
      const canOpen = await Linking.canOpenURL(updateInfo.storeUrl);
      if (canOpen) {
        // 追踪应用商店导航
        await analyticsService.logStoreNavigation(updateInfo.version.versionName);
        
        await Linking.openURL(updateInfo.storeUrl);
        
        // 隐藏更新提醒UI
        set(state => ({
          isLoading: { ...state.isLoading, navigate: false },
          ui: {
            ...state.ui,
            isModalVisible: false,
            isBannerVisible: false,
          },
        }));
      } else {
        throw new Error('Cannot open store URL');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to navigate to store';
      Logger.error(LogModule.UPDATE, 'Failed to navigate to store:', error);
      
      set(state => ({
        error: message,
        isLoading: { ...state.isLoading, navigate: false },
      }));
    }
  },
  
  /**
   * 稍后更新 - 关闭提醒但不跳过版本，过一段时间后还会提醒
   */
  dismissUpdate: async (): Promise<void> => {
    const currentState = get();
    const version = currentState.updateInfo?.version?.versionName || 'unknown';
    
    try {
      // 更新最后提醒时间
      await useUserPreferenceStore.getState().updateLastReminderTime(version);
      
      // 关闭UI
      set(state => ({
        ui: {
          ...state.ui,
          isModalVisible: false,
          isBannerVisible: false,
        },
      }));
      
      Logger.info(LogModule.UPDATE, `Dismissed update for version: ${version}`);
    } catch (error) {
      Logger.error(LogModule.UPDATE, `Failed to dismiss update for version: ${version}`, error);
      throw error;
    }
  },
  
  /**
   * 跳过此版本 - 永久跳过当前版本，不再提醒
   */
  skipVersion: async (): Promise<void> => {
    try {
      const currentState = get();
      const updateInfo = currentState.updateInfo;
      
      if (!updateInfo) {
        throw new Error('No update info available');
      }
      
      const versionName = updateInfo.version.versionName;
      
      // 添加到跳过列表
      await useUserPreferenceStore.getState().skipVersion(versionName);
      
      // 隐藏更新提醒UI
      set(state => ({
        ui: {
          ...state.ui,
          isModalVisible: false,
          isBannerVisible: false,
        },
      }));
      
      Logger.info(LogModule.UPDATE, `Skipped version: ${versionName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to skip version';
      Logger.error(LogModule.UPDATE, 'Failed to skip version:', error);
      set({ error: message });
      throw error;
    }
  },
  
  /**
   * 设置更新模态框可见性
   */
  setUpdateModalVisible: (visible: boolean): void => {
    set(state => ({
      ui: {
        ...state.ui,
        isModalVisible: visible,
      },
    }));
  },
  
  /**
   * 设置更新横幅可见性
   */
  setUpdateBannerVisible: (visible: boolean): void => {
    set(state => ({
      ui: {
        ...state.ui,
        isBannerVisible: visible,
      },
    }));
  },
  
  /**
   * 显示更新模态框
   */
  showUpdateModal: (): void => {
    get().setUpdateModalVisible(true);
  },
  
  /**
   * 隐藏更新模态框
   */
  hideUpdateModal: (): void => {
    get().setUpdateModalVisible(false);
  },
  
  /**
   * 显示更新横幅
   */
  showUpdateBanner: (): void => {
    get().setUpdateBannerVisible(true);
  },
  
  /**
   * 隐藏更新横幅
   */
  hideUpdateBanner: (): void => {
    get().setUpdateBannerVisible(false);
  },

  /**
   * 清除错误状态
   */
  clearError: (): void => {
    set({ error: null });
  },
  
  /**
   * 重置更新状态
   */
  reset: (): void => {
    set({
      updateInfo: null,
      isLoading: {
        check: false,
        navigate: false,
      },
      error: null,
      ui: {
        isModalVisible: false,
        isBannerVisible: false,
        lastCheckTime: null,
      },
    });
  },
}));

/**
 * 获取更新状态摘要（用于调试）
 */
export const getUpdateStatusSummary = (): string => {
  const state = useUpdateStore.getState();
  const userPrefs = useUserPreferenceStore.getState();
  
  return JSON.stringify({
    hasUpdate: !!state.updateInfo?.available,
    isRequired: state.updateInfo?.required || false,
    version: state.updateInfo?.version.versionName || 'N/A',
    isModalVisible: state.ui.isModalVisible,
    isBannerVisible: state.ui.isBannerVisible,
    isLoading: state.isLoading.check,
    lastCheckTime: state.ui.lastCheckTime,
    skippedVersions: userPrefs.skippedVersions,
    autoUpdateCheck: userPrefs.autoUpdateCheck,
  }, null, 2);
};

/**
 * 手动触发更新检查（用于用户手动刷新）
 */
export const manualUpdateCheck = async (): Promise<void> => {
  try {
    await useUpdateStore.getState().checkForUpdate();
  } catch (error) {
    Logger.error(LogModule.UPDATE, 'Manual update check failed:', error);
    throw error;
  }
};
