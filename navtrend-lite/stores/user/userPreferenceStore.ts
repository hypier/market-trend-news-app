/**
 * UserPreferenceStore
 * 用户更新偏好状态管理
 * 
 * 功能：
 * - 管理用户跳过的版本列表
 * - 控制更新提醒的时间间隔
 * - 本地持久化用户偏好设置
 * - 判断是否应该显示更新提醒
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { analyticsService } from '@/services/system/analyticsService';
import type { UpdateInfo, UserUpdatePreferences } from '@/types/update';

/**
 * 用户偏好状态接口
 */
interface UserPreferenceState extends UserUpdatePreferences {
  // 加载状态
  isLoading: boolean;
  error: string | null;
  
  // Actions - 数据管理
  loadPreferences: () => Promise<void>;
  savePreferences: (prefs: Partial<UserUpdatePreferences>) => Promise<void>;
  
  // Actions - 版本跳过管理
  skipVersion: (version: string) => Promise<void>;
  removeSkippedVersion: (version: string) => Promise<void>;
  clearSkippedVersions: () => Promise<void>;
  
  // Actions - 提醒控制
  updateLastReminderTime: (version?: string) => Promise<void>;
  setReminderInterval: (hours: number) => Promise<void>;
  
  // Actions - 业务逻辑
  shouldShowUpdate: (updateInfo: UpdateInfo | null) => Promise<boolean>;
  shouldShowReminder: (updateInfo: UpdateInfo) => Promise<boolean>;
  canShowReminder: () => boolean;
  
  // Actions - 错误处理
  clearError: () => void;
  reset: () => Promise<void>;
}

/**
 * 存储配置
 */
const STORAGE_CONFIG = {
  KEY: 'navtrend_user_update_preferences',
  VERSION: '1.0.0',
} as const;

/**
 * 默认用户偏好配置
 */
const DEFAULT_PREFERENCES: UserUpdatePreferences = {
  skippedVersions: [],
  lastReminderTime: null, // 保留用于向后兼容
  lastReminderTimeByVersion: {}, // 新的按版本存储格式
  reminderIntervalHours: 24, // 1天
  autoUpdateCheck: true,
  enableUpdateNotifications: true,
};

/**
 * 用户偏好Store
 */
export const useUserPreferenceStore = create<UserPreferenceState>((set, get) => ({
  // 初始状态
  ...DEFAULT_PREFERENCES,
  isLoading: false,
  error: null,
  
  /**
   * 加载用户偏好设置
   */
  loadPreferences: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const stored = await AsyncStorage.getItem(STORAGE_CONFIG.KEY);
      if (stored) {
        const preferences = JSON.parse(stored) as UserUpdatePreferences;
        
        // 验证数据格式
        const validatedPrefs = {
          skippedVersions: Array.isArray(preferences.skippedVersions) ? preferences.skippedVersions : [],
          lastReminderTime: preferences.lastReminderTime,
          lastReminderTimeByVersion: typeof preferences.lastReminderTimeByVersion === 'object' && preferences.lastReminderTimeByVersion
            ? preferences.lastReminderTimeByVersion
            : DEFAULT_PREFERENCES.lastReminderTimeByVersion,
          reminderIntervalHours: typeof preferences.reminderIntervalHours === 'number' 
            ? preferences.reminderIntervalHours 
            : DEFAULT_PREFERENCES.reminderIntervalHours,
          autoUpdateCheck: typeof preferences.autoUpdateCheck === 'boolean' 
            ? preferences.autoUpdateCheck 
            : DEFAULT_PREFERENCES.autoUpdateCheck,
          enableUpdateNotifications: typeof preferences.enableUpdateNotifications === 'boolean'
            ? preferences.enableUpdateNotifications
            : DEFAULT_PREFERENCES.enableUpdateNotifications,
        };
        
        set({ ...validatedPrefs, isLoading: false });
      } else {
        // 首次启动，使用默认设置
        set({ ...DEFAULT_PREFERENCES, isLoading: false });
        await get().savePreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load preferences';
      Logger.error(LogModule.PREFERENCES, 'Failed to load user preferences:', error);
      set({ error: message, isLoading: false });
    }
  },
  
  /**
   * 保存用户偏好设置
   */
  savePreferences: async (updates: Partial<UserUpdatePreferences>) => {
    try {
      const currentState = get();
      const newPreferences = {
        skippedVersions: updates.skippedVersions ?? currentState.skippedVersions,
        lastReminderTime: updates.lastReminderTime ?? currentState.lastReminderTime,
        lastReminderTimeByVersion: updates.lastReminderTimeByVersion ?? currentState.lastReminderTimeByVersion,
        reminderIntervalHours: updates.reminderIntervalHours ?? currentState.reminderIntervalHours,
        autoUpdateCheck: updates.autoUpdateCheck ?? currentState.autoUpdateCheck,
        enableUpdateNotifications: updates.enableUpdateNotifications ?? currentState.enableUpdateNotifications,
      };
      
      await AsyncStorage.setItem(STORAGE_CONFIG.KEY, JSON.stringify(newPreferences));
      set({ ...newPreferences, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save preferences';
      Logger.error(LogModule.PREFERENCES, 'Failed to save user preferences:', error);
      set({ error: message });
      throw error;
    }
  },
  
  /**
   * 跳过指定版本
   */
  skipVersion: async (version: string) => {
    try {
      const currentState = get();
      const skippedVersions = [...currentState.skippedVersions];
      
      if (!skippedVersions.includes(version)) {
        skippedVersions.push(version);
        await get().savePreferences({ skippedVersions });
        
        // 追踪用户偏好变更
        await analyticsService.logUpdateAction('skip', version);
        
        Logger.info(LogModule.PREFERENCES, `Version ${version} added to skip list`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to skip version';
      Logger.error(LogModule.PREFERENCES, `Failed to skip version ${version}:`, error);
      set({ error: message });
      throw error;
    }
  },
  
  /**
   * 移除跳过的版本
   */
  removeSkippedVersion: async (version: string) => {
    try {
      const currentState = get();
      const skippedVersions = currentState.skippedVersions.filter(v => v !== version);
      await get().savePreferences({ skippedVersions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove skipped version';
      Logger.error(LogModule.PREFERENCES, 'Failed to remove skipped version:', error);
      set({ error: message });
    }
  },
  
  /**
   * 清空所有跳过的版本
   */
  clearSkippedVersions: async () => {
    try {
      await get().savePreferences({ skippedVersions: [] });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear skipped versions';
      Logger.error(LogModule.PREFERENCES, 'Failed to clear skipped versions:', error);
      set({ error: message });
    }
  },
  
  /**
   * 更新最后提醒时间（按版本存储）
   */
  updateLastReminderTime: async (version?: string) => {
    try {
      const now = new Date().toISOString();
      const currentState = get();
      
      if (version) {
        // 按版本存储提醒时间
        const newReminderTimes = {
          ...currentState.lastReminderTimeByVersion,
          [version]: now
        };
        
        await get().savePreferences({ lastReminderTimeByVersion: newReminderTimes });
      } else {
        // 向后兼容：全局提醒时间
        await get().savePreferences({ lastReminderTime: now });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update reminder time';
      Logger.error(LogModule.PREFERENCES, 'Failed to update reminder time:', error);
      set({ error: message });
      throw error;
    }
  },
  
  /**
   * 设置提醒间隔时间
   */
  setReminderInterval: async (hours: number) => {
    try {
      if (hours <= 0) {
        throw new Error('Reminder interval must be positive');
      }
      
      await get().savePreferences({ reminderIntervalHours: hours });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set reminder interval';
      Logger.error(LogModule.PREFERENCES, 'Failed to set reminder interval:', error);
      set({ error: message });
    }
  },
  
  /**
   * 判断是否应该显示更新提醒
   */
  shouldShowUpdate: async (updateInfo: UpdateInfo | null): Promise<boolean> => {
    const currentState = get();
    
    try {
      if (!updateInfo || !updateInfo.available) {
        return false;
      }
      
      // 检查用户是否启用了更新通知
      if (!currentState.enableUpdateNotifications) {
        return false;
      }
      
      // 如果是强制更新，总是显示
      if (updateInfo.required) {
        return true;
      }
      
      // 检查版本是否被跳过
      const versionName = updateInfo.version.versionName;
      if (currentState.skippedVersions.includes(versionName)) {
        return false;
      }
      
      // 检查提醒时间间隔（按版本）
      const versionLastReminderTime = currentState.lastReminderTimeByVersion[versionName];
      
      // 如果该版本没有提醒记录，说明是新版本，应该显示
      if (!versionLastReminderTime) {
        Logger.info(LogModule.PREFERENCES, `New version detected: ${versionName}`);
        return true;
      }
      
      // 检查版本特定的时间间隔
      const lastReminderTime = new Date(versionLastReminderTime).getTime();
      const now = new Date().getTime();
      const timeDiff = now - lastReminderTime;
      const intervalMs = currentState.reminderIntervalHours * 60 * 60 * 1000;
      const canShowReminderForVersion = timeDiff >= intervalMs;
      
      if (!canShowReminderForVersion) {
        Logger.info(LogModule.PREFERENCES, `Version ${versionName} dismissed recently, skip showing`);
        return false;
      }
      
      return true;
    } catch (error) {
      Logger.error(LogModule.PREFERENCES, 'Failed to determine if should show update:', error);
      return false;
    }
  },
  
  /**
   * 检查是否可以显示提醒（基于时间间隔）
   */
  canShowReminder: (): boolean => {
    const currentState = get();
    
    if (!currentState.lastReminderTime) {
      return true; // 首次提醒
    }
    
    const lastReminderTime = new Date(currentState.lastReminderTime);
    const now = new Date();
    const hoursSinceLastReminder = (now.getTime() - lastReminderTime.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceLastReminder >= currentState.reminderIntervalHours;
  },
  
  /**
   * shouldShowUpdate的别名，用于向后兼容
   */
  shouldShowReminder: async (updateInfo: UpdateInfo): Promise<boolean> => {
    return await get().shouldShowUpdate(updateInfo);
  },
  
  /**
   * 清除错误状态
   */
  clearError: () => {
    set({ error: null });
  },
  
  /**
   * 重置用户偏好到默认状态
   */
  reset: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_CONFIG.KEY);
      set({ ...DEFAULT_PREFERENCES, isLoading: false, error: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reset preferences';
      Logger.error(LogModule.PREFERENCES, 'Failed to reset preferences:', error);
      set({ error: message });
    }
  },
}));

/**
 * 初始化用户偏好Store
 * 应用启动时调用
 */
export const initializeUserPreferences = async (): Promise<void> => {
  try {
    await useUserPreferenceStore.getState().loadPreferences();
  } catch (error) {
    Logger.error(LogModule.PREFERENCES, 'Failed to initialize user preferences:', error);
  }
};
