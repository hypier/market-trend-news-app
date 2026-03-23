import { Platform } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Logger, LogModule } from '@/utils/logger';

// ATT状态枚举 - 使用Expo的状态值
export enum ATTStatus {
  notDetermined = 'notDetermined',
  restricted = 'restricted',
  denied = 'denied',
  authorized = 'authorized',
}

export interface ATTResult {
  status: ATTStatus;
  error?: string;
}

export class ATTService {
  /**
   * 将Expo的PermissionStatus映射到我们的ATTStatus
   * @param status Expo的PermissionStatus
   * @returns 我们的ATTStatus
   */
  private mapPermissionStatusToATTStatus(status: any): ATTStatus {
    // Expo的PermissionStatus枚举值
    switch (status) {
      case 'granted':
        return ATTStatus.authorized;
      case 'denied':
        return ATTStatus.denied;
      case 'undetermined':
        return ATTStatus.notDetermined;
      default:
        // 包括'restricted'等其他状态
        return ATTStatus.restricted;
    }
  }

  /**
   * 检查当前ATT权限状态
   * @returns ATT状态
   */
  async getStatus(): Promise<ATTStatus> {
    if (Platform.OS !== 'ios') {
      return ATTStatus.authorized;
    }

    try {
      const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
      Logger.info(LogModule.ANALYTICS, 'Current ATT status:', status);
      // 将Expo的PermissionStatus映射到我们的ATTStatus
      return this.mapPermissionStatusToATTStatus(status);
    } catch (error) {
      Logger.error(LogModule.ANALYTICS, 'Failed to get ATT status:', error);
      return ATTStatus.notDetermined;
    }
  }

  /**
   * 请求ATT权限 - Apple审核要求必须实际调用ATT API
   * 针对TestFlight环境优化
   * @returns ATT请求结果
   */
  async requestPermission(): Promise<ATTResult> {
    if (Platform.OS !== 'ios') {
      return { status: ATTStatus.authorized };
    }

    try {
      // 首先检查当前状态
      const currentStatus = await this.getStatus();
      Logger.info(LogModule.ANALYTICS, '🔐 [TestFlight] Current ATT status before request:', currentStatus);
      
      // 特别针对TestFlight环境：即使状态不是notDetermined也要请求
      // 因为TestFlight环境可能需要重新触发权限弹窗
      Logger.info(LogModule.ANALYTICS, '🔐 [TestFlight] Requesting ATT permission (Apple App Store compliance)...');
      Logger.info(LogModule.ANALYTICS, '🔐 [TestFlight] Forcing permission request for TestFlight environment...');
      
      const { status } = await TrackingTransparency.requestTrackingPermissionsAsync();
      Logger.info(LogModule.ANALYTICS, '🔐 [TestFlight] ATT permission request completed, result:', status);
      
      const finalStatus = this.mapPermissionStatusToATTStatus(status);
      Logger.info(LogModule.ANALYTICS, '🔐 [TestFlight] Final ATT status:', finalStatus);
      
      return { status: finalStatus };
    } catch (error) {
      Logger.error(LogModule.ANALYTICS, '🔐 [TestFlight] Failed to request ATT permission:', error);
      return { 
        status: ATTStatus.denied, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * 检查是否需要显示ATT弹窗
   * @returns 是否需要请求权限
   */
  async shouldRequestPermission(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    const status = await this.getStatus();
    return status === ATTStatus.notDetermined;
  }

  /**
   * 检查用户是否授权了ATT权限
   * @returns 是否已授权
   */
  async isAuthorized(): Promise<boolean> {
    const status = await this.getStatus();
    return status === ATTStatus.authorized;
  }

  /**
   * 获取ATT状态的用户友好描述
   * @param status ATT状态
   * @returns 状态描述
   */
  getStatusDescription(status: ATTStatus): string {
    switch (status) {
      case ATTStatus.notDetermined:
        return 'Not Determined - User has not yet decided whether to allow app tracking';
      case ATTStatus.restricted:
        return 'Restricted - Device restricts app tracking functionality';
      case ATTStatus.denied:
        return 'Denied - User denied app tracking permission';
      case ATTStatus.authorized:
        return 'Authorized - User allows app tracking';
      default:
        return 'Unknown Status';
    }
  }
}

// 导出单例实例
export const attService = new ATTService();
export default attService;