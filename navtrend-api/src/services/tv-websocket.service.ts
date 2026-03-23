/**
 * TradingView WebSocket Token 服务
 * 使用 RapidAPIClient 获取 WebSocket 连接所需的 token
 *
 * @module services/tv-websocket.service
 */

import { createLogger } from '../utils/logger'
import { RapidAPIClient } from '../integrations/tradingview/rapidapi-client'

const logger = createLogger('TvWebSocketService')

/**
 * WebSocket Token 响应格式
 */
export interface WebSocketTokenResponse {
  wsUrl: string
  token: string
  expiresAt: number
  expiresIn: string
}

/**
 * TradingView WebSocket Token 服务
 * 使用 RapidAPIClient 获取 WebSocket 连接所需的 token
 */
export class TvWebSocketService {
  private client: RapidAPIClient

  constructor(rapidApiKey: string) {
    this.client = new RapidAPIClient(rapidApiKey)
    logger.info('TvWebSocketService initialized')
  }

  /**
   * 获取 WebSocket 连接 Token
   * @param type Token 过期时间类型：1 (30分钟)、2 (6小时)、3 (24小时)
   * @returns WebSocket Token 数据
   */
  async getWebSocketToken(type: number = 2): Promise<WebSocketTokenResponse> {
    logger.info(`[getWebSocketToken] Processing token request with type: ${type}`)
    
    const response = await this.client.getWebSocketToken(type)
    
    // 验证响应数据
    if (!response.token || !response.wsUrl) {
      logger.error(`[getWebSocketToken] Invalid response data:`, response)
      throw new Error('WebSocket Token 数据格式错误')
    }

    const tokenData: WebSocketTokenResponse = {
      wsUrl: response.wsUrl,
      token: response.token,
      expiresAt: response.expiresAt,
      expiresIn: response.expiresIn,
    }

    logger.info(`[getWebSocketToken] Token obtained successfully, expires: ${response.expiresIn}`)
    return tokenData
  }
}
