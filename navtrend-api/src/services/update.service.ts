/**
 * 应用更新服务
 * 处理版本检查和更新逻辑
 * 
 * 使用配置文件驱动，无需数据库依赖
 */
import { createLogger } from '../utils/logger';
import { CURRENT_VERSION, APP_DOWNLOAD_URLS } from '../config/app-version.config';

// 创建服务日志器
const logger = createLogger('UpdateService');

// 响应类型定义
export interface UpdateCheckResponse {
  updateAvailable: boolean;
  versionInfo: {
    versionName: string;
    buildNumberIos: number | null;
    buildNumberAndroid: number | null;
    updateType: 'optional' | 'recommended' | 'required';
    downloadUrls: {
      ios: string;
      android: string;
    };
    minimumSupportedBuildNumberIos: number | null;
    minimumSupportedBuildNumberAndroid: number | null;
    reminderInterval: number;
  } | null;
}

export interface UpdateCheckParams {
  platform: 'ios' | 'android';
  currentBuildNumber: number;
  currentVersionName: string;
  locale?: string;
}

export class UpdateService {
  /**
   * 检查应用是否有更新
   * 
   * 从配置文件读取版本信息，无需数据库查询
   */
  checkForUpdate(params: UpdateCheckParams): UpdateCheckResponse {
    try {
      const { platform, currentBuildNumber } = params;

      // 从配置文件获取最新版本信息
      const latestVersion = CURRENT_VERSION;

      // 如果版本更新检查被禁用，直接返回无更新
      if (latestVersion.enabled === false) {
        logger.info('Version update check is disabled, returning no update available');
        return {
          updateAvailable: false,
          versionInfo: null,
        };
      }

      // 根据平台获取对应的构建号
      const latestBuildNumber = platform === 'ios' 
        ? latestVersion.buildNumberIos 
        : latestVersion.buildNumberAndroid;

      const minimumSupportedBuildNumber = platform === 'ios'
        ? latestVersion.minimumSupportedBuildIos
        : latestVersion.minimumSupportedBuildAndroid;

      // 如果没有配置对应平台的构建号，返回无更新响应
      if (!latestBuildNumber) {
        logger.warn(`No build number configured for ${platform} platform, returning no update available`);
        return {
          updateAvailable: false,
          versionInfo: null,
        };
      }

      // 检查是否需要更新
      const hasUpdate = currentBuildNumber < latestBuildNumber;

      // 检查是否低于最低支持版本
      const belowMinimumSupported = minimumSupportedBuildNumber && currentBuildNumber < minimumSupportedBuildNumber;
      
      // 构建响应数据
      // 如果有更新或低于最低支持版本，都返回版本信息
      const shouldReturnVersionInfo = hasUpdate || belowMinimumSupported;
      
      const response: UpdateCheckResponse = {
        updateAvailable: hasUpdate,
        versionInfo: shouldReturnVersionInfo ? {
          versionName: latestVersion.versionName,
          buildNumberIos: latestVersion.buildNumberIos,
          buildNumberAndroid: latestVersion.buildNumberAndroid,
          updateType: latestVersion.updateType,
          downloadUrls: APP_DOWNLOAD_URLS,
          minimumSupportedBuildNumberIos: latestVersion.minimumSupportedBuildIos,
          minimumSupportedBuildNumberAndroid: latestVersion.minimumSupportedBuildAndroid,
          reminderInterval: latestVersion.reminderInterval,
        } : null,
      };

      return response;

    } catch (error) {
      logger.error('应用更新检查失败', error);
      throw error;
    }
  }
}
