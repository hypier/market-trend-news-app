/**
 * UpdateService
 * 应用更新检查服务
 * 
 * 功能：
 * - 版本检查API调用
 * - 错误处理
 * - 与后端API集成
 */

import { Logger, LogModule } from '@/utils/logger';
import { apiClient } from '../core/api';
import { versionCompareService } from './versionCompareService';
import { analyticsService } from '../system/analyticsService';
import type {
  UpdateCheckRequest,
  UpdateInfo,
  VersionInfo,
  CurrentVersionInfo,
  UpdateCheckError,
  PlatformUnion,
} from '@/types/update';

/**
 * 更新服务类
 */
export class UpdateService {
  private readonly logger = Logger;
  
  /**
   * 检查应用更新 - 实时请求，不使用缓存
   * @returns Promise<UpdateInfo | null> 更新信息，如果无需更新则返回null
   */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      // 获取当前版本信息
      const currentVersion = await versionCompareService.getCurrentVersionInfo();
      
      // 构建请求参数
      const request: UpdateCheckRequest = {
        platform: currentVersion.platform,
        currentBuildNumber: currentVersion.buildNumber,
        currentVersionName: currentVersion.versionName,
      };
      
      // 调用版本检查API
      const response = await apiClient.request<any>('/update/check', {
        method: 'POST',
        data: request,
        includeAuth: false, // 更新检查不需要认证
      });
      
      // 处理响应
      const updateInfo = await this.processUpdateResponse(response, currentVersion);
      
      // 追踪更新检查事件
      await analyticsService.logUpdateCheck(!!updateInfo?.available, currentVersion.versionName, updateInfo?.version.versionName);
      
      return updateInfo;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Update check failed:', error);
      throw this.createUpdateError(error);
    }
  }
  
  /**
   * 获取最新版本信息
   * @returns Promise<VersionInfo | null> 最新版本信息
   */
  async getLatestVersion(): Promise<VersionInfo | null> {
    try {
      const currentVersion = await versionCompareService.getCurrentVersionInfo();
      const response = await apiClient.request<any>('/update/check', {
        method: 'POST',
        data: {
          platform: currentVersion.platform,
          currentBuildNumber: currentVersion.buildNumber,
          currentVersionName: currentVersion.versionName,
        },
        includeAuth: false,
      });

      return response?.versionInfo || null;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to get latest version:', error);
      throw this.createUpdateError(error);
    }
  }
  
  /**
   * 获取所有版本列表
   * @returns Promise<VersionInfo[]> 版本列表
   */
  async getAllVersions(): Promise<VersionInfo[]> {
    try {
      const currentVersion = await versionCompareService.getCurrentVersionInfo();
      const response = await apiClient.request<any>('/update/check', {
        method: 'POST',
        data: {
          platform: currentVersion.platform,
          currentBuildNumber: currentVersion.buildNumber,
          currentVersionName: currentVersion.versionName,
        },
        includeAuth: false,
      });

      return response?.versionInfo ? [response.versionInfo] : [];
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to get all versions:', error);
      throw this.createUpdateError(error);
    }
  }
  
  /**
   * 处理更新检查响应
   * @param response API响应
   * @param currentVersion 当前版本信息
   * @returns Promise<UpdateInfo | null> 处理后的更新信息
   */
  private async processUpdateResponse(
    response: any, // 改为 any 类型以适配实际API响应
    currentVersion: CurrentVersionInfo
  ): Promise<UpdateInfo | null> {
    try {
      // 智能适配新旧API响应格式
      let updateAvailable: boolean;
      let versionInfo: any;
      
      if (response.hasUpdate !== undefined) {
        // 新格式：直接从response中获取
        updateAvailable = response.hasUpdate;
        
        // 构建versionInfo对象
        versionInfo = {
          versionName: response.latestVersion,
          buildNumberIos: response.latestBuildNumber,
          buildNumberAndroid: response.latestBuildNumber,
          updateType: response.updateType,
          minimumSupportedBuildIos: response.minimumSupportedBuildNumber,
          minimumSupportedBuildAndroid: response.minimumSupportedBuildNumber,
          downloadUrls: response.downloadUrls || {
            ios: 'https://apps.apple.com/app/navtrend/id123456789',
            android: 'https://play.google.com/store/apps/details?id=com.navtrend.lite',
          },
          reminderInterval: response.reminderInterval,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        // 旧格式：从response中提取并补充缺失字段
        updateAvailable = response.updateAvailable;
        const originalVersionInfo = response.versionInfo;
        
        // 如果原始版本信息为null，直接设置为null
        if (!originalVersionInfo) {
          versionInfo = null;
        } else {
          // 补充完整的versionInfo结构
          versionInfo = {
            ...originalVersionInfo,
            // 补充缺失的字段
            downloadUrls: originalVersionInfo.downloadUrls || {
              ios: 'https://apps.apple.com/app/navtrend/id123456789',
              android: 'https://play.google.com/store/apps/details?id=com.navtrend.lite',
            },
            minimumSupportedBuildIos: originalVersionInfo.minimumSupportedBuildNumberIos,
            minimumSupportedBuildAndroid: originalVersionInfo.minimumSupportedBuildNumberAndroid,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }
      
      // 如果没有可用更新且不需要强制更新
      if (!updateAvailable && !response.forceUpdate) {
        return null;
      }
      
      // 如果需要强制更新但没有版本信息，这是异常情况
      if (response.forceUpdate && !versionInfo) {
        this.logger.error(LogModule.UPDATE, 'Force update required but no version info available');
        throw new Error('Force update required but no version information available');
      }
      
      // 如果没有版本信息，返回null
      if (!versionInfo) {
        return null;
      }
      
      // 获取对应平台的构建号
      const platformBuildNumber = versionCompareService.getPlatformBuildNumber(
        currentVersion.platform,
        versionInfo.buildNumberIos,
        versionInfo.buildNumberAndroid
      );
      
      // 如果没有对应平台的构建号，视为无更新
      if (!platformBuildNumber) {
        this.logger.warn(LogModule.UPDATE, `No build number for platform: ${currentVersion.platform}`);
        return null;
      }
      
      // 验证确实需要更新
      const needsUpdate = versionCompareService.needsUpdate(
        currentVersion.buildNumber,
        platformBuildNumber
      );
      
      if (!needsUpdate) {
        return null;
      }
      
      // 获取当前平台的最低支持构建号
      const minimumSupportedBuildNumber = currentVersion.platform === 'ios' 
        ? versionInfo.minimumSupportedBuildIos 
        : versionInfo.minimumSupportedBuildAndroid;

      // 检查是否低于最低支持版本
      const belowMinimumSupported = minimumSupportedBuildNumber && 
        currentVersion.buildNumber < minimumSupportedBuildNumber;
      
      // 判断是否为强制更新：
      // 1. 更新类型为 'required'
      // 2. 低于最低支持版本
      const isRequired = versionInfo.updateType === 'required' || belowMinimumSupported;
      
      // 构建更新信息
      const updateInfo: UpdateInfo = {
        available: true,
        required: isRequired,
        version: versionInfo,
        storeUrl: versionInfo ? this.getStoreUrl(currentVersion.platform, versionInfo) : undefined,
      };
      
      return updateInfo;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to process update response:', error);
      throw error;
    }
  }
  
  /**
   * 获取应用商店URL
   * @param platform 平台类型
   * @param versionInfo 版本信息
   * @returns string | undefined 应用商店URL
   */
  private getStoreUrl(platform: PlatformUnion, versionInfo: VersionInfo): string | undefined {
    if (platform === 'ios') {
      return versionInfo.downloadUrls.ios;
    } else if (platform === 'android') {
      return versionInfo.downloadUrls.android;
    }
    return undefined;
  }
  
  /**
   * 创建更新错误对象
   * @param error 原始错误
   * @returns UpdateCheckError 标准化的更新错误
   */
  private createUpdateError(error: unknown): UpdateCheckError {
    if (error instanceof Error) {
      return {
        errorCode: 'UNKNOWN_ERROR',
        message: error.message,
        originalError: error,
      };
    }
    
    return {
      errorCode: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred during update check',
      originalError: error,
    };
  }
  
  /**
   * 检查更新服务是否可用
   * @returns Promise<boolean> 服务是否可用
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const currentVersion = await versionCompareService.getCurrentVersionInfo();
      await apiClient.request('/update/check', {
        method: 'POST',
        data: {
          platform: currentVersion.platform,
          currentBuildNumber: currentVersion.buildNumber,
          currentVersionName: currentVersion.versionName,
        },
        includeAuth: false,
        timeout: 3000, // 3秒超时
      });
      
      return true;
    } catch (error) {
      this.logger.warn(LogModule.UPDATE, 'Update service is not available:', error);
      return false;
    }
  }
}

// 导出单例实例（参考 watchlistService.ts）
export const updateService = new UpdateService();
export default updateService;