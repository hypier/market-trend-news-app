import { Platform } from 'react-native';

import { attService, ATTStatus } from '../auth/attService';
import { Logger, LogModule } from '@/utils/logger';

interface InitializationResult {
  success: boolean;
  attStatus?: ATTStatus;
  error?: string;
}

class InitializationService {
  private isInitialized = false;
  private initializationResult: InitializationResult | null = null;
  private initializationPromise: Promise<InitializationResult> | null = null;

  /**
   * 按正确顺序初始化所有服务
   * 1. ATT权限请求 (iOS only) - 可选，如果已在早期处理
   */
  async initializeAll(skipATT: boolean = false): Promise<InitializationResult> {
    if (this.isInitialized && this.initializationResult) {
      Logger.info(LogModule.ANALYTICS, '✅ Services already initialized, returning cached result');
      return this.initializationResult;
    }

    // 防止并发初始化
    if (this.initializationPromise) {
      Logger.info(LogModule.ANALYTICS, '⏳ Initialization in progress, waiting...');
      return this.initializationPromise;
    }

    // 创建并存储初始化Promise
    this.initializationPromise = this.performInitialization(skipATT);
    const result = await this.initializationPromise;
    
    // 清理Promise引用
    this.initializationPromise = null;
    
    return result;
  }

  /**
   * 执行实际的初始化过程
   */
  private async performInitialization(skipATT: boolean = false): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: false,
      attStatus: ATTStatus.notDetermined,
    };

    try {
      Logger.info(LogModule.ANALYTICS, '🚀 Starting initialization sequence...');

      // 步骤1: iOS ATT权限请求（Android跳过，或者如果已经在早期处理过）
      if (skipATT) {
        Logger.info(LogModule.ANALYTICS, '📱 Step 1: Skipping ATT permission (already handled early)');
        // 获取当前ATT状态
        try {
          result.attStatus = Platform.OS === 'ios' ? await attService.getStatus() : ATTStatus.authorized;
          Logger.info(LogModule.ANALYTICS, `📱 Current ATT status: ${result.attStatus}`);
        } catch (error) {
          Logger.warn(LogModule.ANALYTICS, '⚠️ Failed to get ATT status:', error);
          result.attStatus = Platform.OS === 'ios' ? ATTStatus.notDetermined : ATTStatus.authorized;
        }
      } else if (Platform.OS === 'ios') {
        Logger.info(LogModule.ANALYTICS, '📱 Step 1: Requesting ATT permission (iOS)...');
        try {
          const attResult = await attService.requestPermission();
          result.attStatus = attResult.status;
          Logger.info(LogModule.ANALYTICS, `✅ ATT permission result: ${attResult.status} - ${attService.getStatusDescription(attResult.status)}`);
          
          if (attResult.error) {
            Logger.warn(LogModule.ANALYTICS, '⚠️ ATT permission warning:', attResult.error);
          }
        } catch (error) {
          Logger.error(LogModule.ANALYTICS, '❌ ATT permission failed:', error);
          result.attStatus = ATTStatus.denied;
        }
      } else {
        Logger.info(LogModule.ANALYTICS, '📱 Step 1: Skipping ATT permission (Android)');
        result.attStatus = ATTStatus.authorized; // Android默认授权
      }

      // 步骤2: 完成初始化
      result.success = true;
      this.isInitialized = true;
      this.initializationResult = result;

      Logger.info(LogModule.ANALYTICS, '🎉 Initialization sequence completed successfully!');
      Logger.info(LogModule.ANALYTICS, '📊 Final status:', {
        attStatus: result.attStatus,
      });

      return result;

    } catch (error) {
      Logger.error(LogModule.ANALYTICS, '💥 Initialization sequence failed:', error);
      result.error = error instanceof Error ? error.message : 'Unknown initialization error';
      this.initializationResult = result;
      return result;
    }
  }

  /**
   * 获取初始化结果
   */
  getInitializationResult(): InitializationResult | null {
    return this.initializationResult;
  }

  /**
   * 检查是否已初始化
   */
  isServicesInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * 重置初始化状态（用于测试）
   */
  reset(): void {
    this.isInitialized = false;
    this.initializationResult = null;
    this.initializationPromise = null;
    Logger.info(LogModule.ANALYTICS, '🔄 Initialization service reset');
  }

}

// 导出单例实例
export const initializationService = new InitializationService();
export default initializationService;