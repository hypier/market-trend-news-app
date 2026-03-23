import { Platform } from 'react-native';
import * as Network from 'expo-network';
import { attService } from './attService';

/**
 * 网络感知的ATT权限请求服务
 * 解决第一次安装时网络权限和ATT权限请求时机问题
 */
export class NetworkAwareATTService {
  private networkStateSubscription: any = null;
  private attRequestTimer: ReturnType<typeof setTimeout> | null = null;
  private isATTRequested = false;

  /**
   * 智能ATT权限请求
   * 1. 如果网络已连接，延迟请求ATT权限
   * 2. 如果网络未连接，监听网络状态变化，连接后请求ATT权限
   */
  async requestATTWithNetworkAwareness(): Promise<void> {
    if (Platform.OS !== 'ios') {
      console.log('🔐 [NetworkATT] Non-iOS platform, skipping ATT request');
      return;
    }

    if (this.isATTRequested) {
      console.log('🔐 [NetworkATT] ATT already requested, skipping');
      return;
    }

    // 优化：先检查ATT权限状态，如果已经决定过就不再请求
    const shouldRequest = await attService.shouldRequestPermission();
    if (!shouldRequest) {
      console.log('🔐 [NetworkATT] ATT permission already determined, skipping');
      this.isATTRequested = true;
      return;
    }

    try {
      // 首先检查网络状态
      const networkState = await Network.getNetworkStateAsync();
      console.log('🔐 [NetworkATT] Current network state:', {
        type: networkState.type,
        isConnected: networkState.isConnected,
        isInternetReachable: networkState.isInternetReachable
      });

      if (networkState.isConnected && networkState.isInternetReachable) {
        // 网络已连接，延迟请求ATT权限确保应用完全初始化
        this.scheduleATTRequest(1500); // 稍微增加延迟
      } else {
        // 网络未连接，监听网络状态变化
        console.log('🔐 [NetworkATT] Network not ready, setting up network state listener');
        this.setupNetworkStateListener();
        
        // 设置备用定时器，防止网络监听失败
        this.scheduleATTRequest(5000); // 5秒后无论如何都请求
      }
    } catch (error) {
      console.error('🔐 [NetworkATT] Failed to get network state:', error);
      // 网络状态获取失败，使用备用策略
      this.scheduleATTRequest(2000);
    }
  }

  /**
   * 调度ATT权限请求
   */
  private scheduleATTRequest(delay: number): void {
    if (this.attRequestTimer) {
      clearTimeout(this.attRequestTimer);
    }

    this.attRequestTimer = setTimeout(async () => {
      await this.executeATTRequest();
    }, delay);

    console.log(`🔐 [NetworkATT] ATT request scheduled in ${delay}ms`);
  }

  /**
   * 设置网络状态监听器
   */
  private setupNetworkStateListener(): void {
    if (this.networkStateSubscription) {
      return; // 已经设置了监听器
    }

    try {
      this.networkStateSubscription = Network.addNetworkStateListener((networkState) => {
        console.log('🔐 [NetworkATT] Network state changed:', {
          type: networkState.type,
          isConnected: networkState.isConnected,
          isInternetReachable: networkState.isInternetReachable
        });

        // 网络连接建立后请求ATT权限
        if (networkState.isConnected && networkState.isInternetReachable && !this.isATTRequested) {
          console.log('🔐 [NetworkATT] Network connected, requesting ATT permission');
          
          // 网络刚连接，等待一会确保稳定
          this.scheduleATTRequest(1000);
          
          // 移除网络监听器
          this.removeNetworkStateListener();
        }
      });

      console.log('🔐 [NetworkATT] Network state listener set up successfully');
    } catch (error) {
      console.error('🔐 [NetworkATT] Failed to set up network state listener:', error);
      // 监听器设置失败，使用备用策略
      this.scheduleATTRequest(3000);
    }
  }

  /**
   * 移除网络状态监听器
   */
  private removeNetworkStateListener(): void {
    if (this.networkStateSubscription) {
      this.networkStateSubscription.remove();
      this.networkStateSubscription = null;
      console.log('🔐 [NetworkATT] Network state listener removed');
    }
  }

  /**
   * 执行ATT权限请求
   */
  private async executeATTRequest(): Promise<void> {
    if (this.isATTRequested) {
      return; // 防止重复请求
    }

    this.isATTRequested = true;

    try {
      console.log('🔐 [NetworkATT] Executing ATT permission request...');
      
      // 再次检查网络状态
      const networkState = await Network.getNetworkStateAsync();
      if (!networkState.isConnected) {
        console.warn('🔐 [NetworkATT] Network not connected when requesting ATT, but proceeding anyway');
      }

      const result = await attService.requestPermission();
      console.log('🔐 [NetworkATT] ATT permission request completed:', result);

      // 清理资源
      this.cleanup();

    } catch (error) {
      console.error('🔐 [NetworkATT] ATT permission request failed:', error);
      this.cleanup();
    }
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.attRequestTimer) {
      clearTimeout(this.attRequestTimer);
      this.attRequestTimer = null;
    }
    this.removeNetworkStateListener();
  }

  /**
   * 重置服务状态（用于测试或重新初始化）
   */
  public reset(): void {
    console.log('🔐 [NetworkATT] Resetting service state');
    this.isATTRequested = false;
    this.cleanup();
  }

  /**
   * 获取ATT权限状态
   */
  async getATTStatus() {
    return await attService.getStatus();
  }

  /**
   * 检查是否需要请求ATT权限
   */
  async shouldRequestATT(): Promise<boolean> {
    return await attService.shouldRequestPermission();
  }
}

// 导出单例实例（参考 watchlistService.ts）
export const networkAwareATTService = new NetworkAwareATTService();
export default networkAwareATTService;
