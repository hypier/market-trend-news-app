/**
 * TradingView WebSocket Token 服务
 * 负责动态获取 WebSocket 连接所需的 token 和 URL
 */

import { apiClient } from '@/services/core/api';
import { Logger, LogModule } from '@/utils/logger';

/**
 * WebSocket Token 响应接口
 */
export interface WebSocketTokenResponse {
  wsUrl: string;
  token: string;
  expiresAt: number;
  expiresIn: string;
}

/**
 * TradingView WebSocket Token 服务类
 */
class TradingViewTokenService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 3000; // 3秒

  /**
   * 获取 WebSocket Token
   * @param type Token 过期时间类型：1 (30分钟)、2 (6小时)、3 (24小时)
   * @returns WebSocket Token 数据
   */
  async fetchWebSocketToken(type: number = 2): Promise<WebSocketTokenResponse> {
    Logger.info(LogModule.API, `[TradingView Token] 请求 WebSocket token, type: ${type}`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const startTime = Date.now();

        const response = await apiClient.request<WebSocketTokenResponse>(
          `/tv/ws/token?type=${type}`,
          {
            method: 'GET',
          }
        );

        const elapsed = Date.now() - startTime;
        Logger.info(
          LogModule.API,
          `[TradingView Token] Token 获取成功 (${elapsed}ms), expires: ${response.expiresIn}`
        );

        return response;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        Logger.warn(
          LogModule.API,
          `[TradingView Token] 获取失败 (尝试 ${attempt}/${this.maxRetries}): ${lastError.message}`
        );

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          Logger.info(
            LogModule.API,
            `[TradingView Token] ${this.retryDelay / 1000} 秒后重试...`
          );
          await this.delay(this.retryDelay);
        }
      }
    }

    // 所有重试都失败
    const errorMessage = `获取 WebSocket Token 失败，已重试 ${this.maxRetries} 次: ${lastError?.message}`;
    Logger.error(LogModule.API, `[TradingView Token] ${errorMessage}`);
    throw new Error(errorMessage);
  }

  /**
   * 延迟函数
   * @param ms 延迟毫秒数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const tradingViewTokenService = new TradingViewTokenService();
