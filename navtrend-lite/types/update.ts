/**
 * 应用更新相关类型定义
 * 支持版本检查、更新提示和相关功能
 */

// ============== API 相关类型 ==============

/**
 * 版本检查请求参数
 */
export interface UpdateCheckRequest {
  platform: 'ios' | 'android';
  currentBuildNumber: number;
  currentVersionName: string;
}

/**
 * 强制更新消息多语言支持
 */
export interface ForceUpdateMessageLocalized {
  en: string;
  zh: string;
  [langCode: string]: string;
}

/**
 * 强制更新消息类型别名（向后兼容）
 */
export type ForceUpdateMessage = ForceUpdateMessageLocalized;

/**
 * 版本检查API响应
 * forceUpdate 字段已移除，强制更新通过 versionInfo.updateType === 'required' 判断
 */
export interface UpdateCheckResponse {
  updateAvailable: boolean;
  versionInfo: VersionInfo | null;
  forceUpdate: boolean;
}

/**
 * 最新版本信息响应
 */
export interface LatestVersionResponse {
  versionName: string;
  buildNumberIos?: number;
  buildNumberAndroid?: number;
  updateType: 'optional' | 'recommended' | 'required';
  downloadUrls: {
    ios?: string;
    android?: string;
  };
  createdAt: string;
}

// ============== 应用内数据类型 ==============

/**
 * 处理后的更新信息（前端使用）
 */
export interface UpdateInfo {
  available: boolean;
  required: boolean;
  version: VersionInfo;
  storeUrl?: string; // 应用商店链接
}

/**
 * 更新检查错误
 */
export interface UpdateCheckError {
  errorCode: string;
  message: string;
  originalError?: unknown;
}

/**
 * 当前版本信息
 */
export interface VersionInfo {
  versionName: string;
  buildNumberIos: number | null;
  buildNumberAndroid: number | null;
  updateType: 'optional' | 'recommended' | 'required';
  minimumSupportedBuildIos: number | null;
  minimumSupportedBuildAndroid: number | null;
  downloadUrls: {
    ios: string;
    android: string;
  };
  reminderInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 当前版本信息
 */
export interface CurrentVersionInfo {
  versionName: string;
  buildNumber: number;
  platform: PlatformUnion;
}

/**
 * 用户更新偏好设置
 */
export interface UserUpdatePreferences {
  skippedVersions: string[];        // 用户跳过的版本列表
  lastReminderTime: string | null;  // 最后一次提醒的时间（保留用于向后兼容，但不再使用）
  lastReminderTimeByVersion: { [version: string]: string }; // 按版本存储的最后提醒时间
  reminderIntervalHours: number;    // 提醒间隔小时数
  autoUpdateCheck: boolean;         // 是否自动检查更新
  enableUpdateNotifications: boolean; // 是否启用更新通知
}

// ============== Store 状态类型 ==============

/**
 * 更新相关的加载状态
 */
export interface UpdateLoadingState {
  check: boolean;      // 检查更新中
  navigate: boolean;   // 跳转应用商店中
}

/**
 * 更新UI状态接口
 */
export interface UpdateUIState {
  isModalVisible: boolean;      // 更新模态框是否可见
  isBannerVisible: boolean;     // 更新横幅是否可见
  lastCheckTime: string | null; // 最后检查时间
}

/**
 * 更新Store状态接口
 */
export interface UpdateState {
  // 数据状态
  updateInfo: UpdateInfo | null;
  
  // UI状态
  ui: UpdateUIState;
  
  // 加载和错误状态
  isLoading: UpdateLoadingState;
  error: string | null;
}

/**
 * 用户偏好Store状态接口
 */
export interface UserPreferenceState {
  // 数据状态
  preferences: UserUpdatePreferences;
  
  // Actions
  loadPreferences: () => Promise<void>;
  savePreferences: (preferences: UserUpdatePreferences) => Promise<void>;
  shouldShowUpdate: (updateInfo: UpdateInfo) => Promise<boolean>;
  skipVersion: (version: string) => Promise<void>;
  dismissUpdate: () => Promise<void>;
  clearSkippedVersions: () => Promise<void>;
}

// ============== 组件 Props 类型 ==============

/**
 * 更新弹窗组件Props
 */
export interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onDismiss: () => void;
  onSkip?: () => void;
}

/**
 * 更新横幅组件Props
 */
export interface UpdateBannerProps {
  updateInfo: UpdateInfo;
  onUpdate: () => void;
  onDismiss: () => void;
  visible?: boolean;
}

/**
 * 个人中心更新组件Props
 */
export interface ProfileUpdateSectionProps {
  onCheckUpdate: () => void;
  isLoading?: boolean;
  hasUpdate?: boolean;
  latestVersion?: string;
}

/**
 * 更新按钮组件Props
 */
export interface UpdateButtonProps {
  text: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
}


/**
 * 应用商店导航错误
 */
export class StoreNavigationError extends Error {
  constructor(message: string, public storeUrl?: string) {
    super(message);
    this.name = 'StoreNavigationError';
  }
}

// ============== 工具类型 ==============

/**
 * 更新类型枚举
 */
export const UpdateType = {
  OPTIONAL: 'optional' as const,
  RECOMMENDED: 'recommended' as const,
  REQUIRED: 'required' as const,
} as const;

/**
 * 更新类型联合类型
 */
export type UpdateTypeUnion = typeof UpdateType[keyof typeof UpdateType];

/**
 * 平台类型枚举
 */
export const Platform = {
  IOS: 'ios' as const,
  ANDROID: 'android' as const,
} as const;

/**
 * 平台类型联合类型
 */
export type PlatformUnion = typeof Platform[keyof typeof Platform];

/**
 * 更新操作类型
 */
export type UpdateAction = 'update' | 'dismiss' | 'skip';

// ============== 常量类型 ==============

/**
 * 默认配置常量
 */
export interface UpdateConstants {
  DEFAULT_REMINDER_INTERVAL: number;
  CACHE_EXPIRY_MINUTES: number;
  MAX_RETRY_ATTEMPTS: number;
  STORE_URLS: {
    IOS_TEMPLATE: string;
    ANDROID_TEMPLATE: string;
  };
}

/**
 * 缓存键常量
 */
export interface CacheKeys {
  UPDATE_INFO: string;
  USER_PREFERENCES: string;
  LAST_CHECK_TIME: string;
}

// ============== 高级类型 ==============

/**
 * 条件类型：基于平台的版本信息
 */
export type PlatformVersionInfo<T extends PlatformUnion> = T extends 'ios'
  ? { buildNumber: number; versionCode?: never }
  : { buildNumber: number; versionCode: number };

/**
 * 实用工具类型：选择性必需
 */
export type RequireField<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * 实用工具类型：选择性可选
 */
export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

