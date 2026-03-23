/**
 * VersionCompareService
 * 版本比较服务
 * 
 * 功能：
 * - 比较构建号大小
 * - 获取当前应用版本信息
 * - 判断是否需要更新
 * - 处理平台差异（iOS/Android）
 */

import * as Application from 'expo-application';
import { Platform } from 'react-native';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import type { PlatformUnion, VersionInfo, CurrentVersionInfo } from '@/types/update';

/**
 * 版本比较服务
 */
export class VersionCompareService {
  private readonly logger = Logger;
  
  /**
   * 获取当前应用版本信息
   * @returns Promise<CurrentVersionInfo> 当前版本信息
   */
  async getCurrentVersionInfo(): Promise<CurrentVersionInfo> {
    try {
      // 获取应用版本号
      const versionName = Application.nativeApplicationVersion || '1.0.0';
      
      // 获取构建号
      const buildNumber = this.getCurrentBuildNumber();
      
      // 获取平台信息
      const platform: PlatformUnion = Platform.OS === 'ios' ? 'ios' : 'android';
      
      const versionInfo: CurrentVersionInfo = {
        versionName,
        buildNumber,
        platform,
      };
      
      return versionInfo;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to get current version info:', error);
      
      // 返回默认值
      return {
        versionName: '1.0.0',
        buildNumber: 1,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      };
    }
  }
  
  /**
   * 获取当前应用构建号
   * @returns number 构建号
   */
  getCurrentBuildNumber(): number {
    try {
      const buildNumber = Application.nativeBuildVersion;
      
      if (!buildNumber) {
        this.logger.warn(LogModule.UPDATE, 'Build number not found, using default value 1');
        return 1;
      }
      
      const parsedBuildNumber = parseInt(buildNumber, 10);
      
      if (isNaN(parsedBuildNumber) || parsedBuildNumber <= 0) {
        this.logger.warn(LogModule.UPDATE, `Invalid build number: ${buildNumber}, using default value 1`);
        return 1;
      }
      
      return parsedBuildNumber;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to get build number:', error);
      return 1;
    }
  }
  
  /**
   * 比较构建号，判断是否需要更新
   * @param currentBuildNumber 当前构建号
   * @param latestBuildNumber 最新构建号
   * @returns boolean 是否需要更新
   */
  needsUpdate(currentBuildNumber: number, latestBuildNumber: number): boolean {
    try {
      // 验证输入参数
      if (!this.isValidBuildNumber(currentBuildNumber)) {
        this.logger.warn(LogModule.UPDATE, `Invalid current build number: ${currentBuildNumber}`);
        return true; // 保守策略：如果当前版本无效，建议更新
      }
      
      if (!this.isValidBuildNumber(latestBuildNumber)) {
        this.logger.warn(LogModule.UPDATE, `Invalid latest build number: ${latestBuildNumber}`);
        return false; // 如果服务器版本无效，不建议更新
      }
      
      const needsUpdate = currentBuildNumber < latestBuildNumber;
      
      return needsUpdate;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to compare versions:', error);
      return false; // 出错时不建议更新
    }
  }
  
  /**
   * 检查是否支持当前版本（基于最低支持版本）
   * @param currentBuildNumber 当前构建号
   * @param minimumSupportedBuildNumber 最低支持的构建号
   * @returns boolean 是否支持当前版本
   */
  isVersionSupported(
    currentBuildNumber: number,
    minimumSupportedBuildNumber: number | null
  ): boolean {
    try {
      // 如果没有设置最低支持版本，认为都支持
      if (minimumSupportedBuildNumber === null || minimumSupportedBuildNumber === undefined) {
        return true;
      }
      
      // 验证输入参数
      if (!this.isValidBuildNumber(currentBuildNumber)) {
        this.logger.warn(LogModule.UPDATE, `Invalid current build number: ${currentBuildNumber}`);
        return false; // 保守策略：如果当前版本无效，认为不支持
      }
      
      if (!this.isValidBuildNumber(minimumSupportedBuildNumber)) {
        this.logger.warn(LogModule.UPDATE, `Invalid minimum supported build number: ${minimumSupportedBuildNumber}`);
        return true; // 如果最低支持版本无效，认为都支持
      }
      
      const isSupported = currentBuildNumber >= minimumSupportedBuildNumber;
      
      return isSupported;
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to check version support:', error);
      return true; // 出错时认为支持
    }
  }
  
  /**
   * 根据平台选择对应的构建号
   * @param platform 平台类型
   * @param iosBuildNumber iOS构建号
   * @param androidBuildNumber Android构建号
   * @returns number | null 对应平台的构建号
   */
  getPlatformBuildNumber(
    platform: PlatformUnion,
    iosBuildNumber: number | null,
    androidBuildNumber: number | null
  ): number | null {
    try {
      if (platform === 'ios') {
        return iosBuildNumber;
      } else if (platform === 'android') {
        return androidBuildNumber;
      } else {
        this.logger.warn(LogModule.UPDATE, `Unknown platform: ${platform}`);
        return null;
      }
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to get platform build number:', error);
      return null;
    }
  }
  
  /**
   * 验证构建号是否有效
   * @param buildNumber 构建号
   * @returns boolean 是否有效
   */
  private isValidBuildNumber(buildNumber: number | null | undefined): buildNumber is number {
    return typeof buildNumber === 'number' && 
           !isNaN(buildNumber) && 
           buildNumber > 0 && 
           Number.isInteger(buildNumber);
  }
  
  /**
   * 比较版本名称（语义化版本）
   * @param currentVersion 当前版本名称
   * @param latestVersion 最新版本名称
   * @returns number 比较结果：-1(当前<最新), 0(相等), 1(当前>最新)
   */
  compareVersionNames(currentVersion: string, latestVersion: string): number {
    try {
      // 清理版本号，移除非数字和点的字符
      const cleanCurrent = this.cleanVersionString(currentVersion);
      const cleanLatest = this.cleanVersionString(latestVersion);
      
      // 分割版本号
      const currentParts = cleanCurrent.split('.').map(part => parseInt(part, 10) || 0);
      const latestParts = cleanLatest.split('.').map(part => parseInt(part, 10) || 0);
      
      // 补齐版本号位数
      const maxLength = Math.max(currentParts.length, latestParts.length);
      while (currentParts.length < maxLength) currentParts.push(0);
      while (latestParts.length < maxLength) latestParts.push(0);
      
      // 逐位比较
      for (let i = 0; i < maxLength; i++) {
        if (currentParts[i] < latestParts[i]) return -1;
        if (currentParts[i] > latestParts[i]) return 1;
      }
      
      return 0; // 相等
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to compare version names:', error);
      return 0; // 出错时认为相等
    }
  }
  
  /**
   * 清理版本字符串，只保留数字和点
   * @param version 版本字符串
   * @returns 清理后的版本字符串
   */
  private cleanVersionString(version: string): string {
    return version.replace(/[^0-9.]/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  }
  
  /**
   * 格式化版本信息用于显示
   * @param versionInfo 版本信息
   * @returns 格式化后的字符串
   */
  formatVersionInfo(versionInfo: VersionInfo): string {
    try {
      const { versionName, buildNumberIos, buildNumberAndroid } = versionInfo;
      
      if (buildNumberIos && buildNumberAndroid) {
        return `${versionName} (iOS: ${buildNumberIos}, Android: ${buildNumberAndroid})`;
      } else if (buildNumberIos) {
        return `${versionName} (${buildNumberIos})`;
      } else if (buildNumberAndroid) {
        return `${versionName} (${buildNumberAndroid})`;
      } else {
        return versionName;
      }
    } catch (error) {
      this.logger.error(LogModule.UPDATE, 'Failed to format version info:', error);
      return 'Unknown Version';
    }
  }
  
  /**
   * 获取当前平台类型
   * @returns PlatformUnion 平台类型
   */
  getCurrentPlatform(): PlatformUnion {
    return Platform.OS === 'ios' ? 'ios' : 'android';
  }
}

// 导出单例实例（参考 watchlistService.ts）
export const versionCompareService = new VersionCompareService();
export default versionCompareService;
