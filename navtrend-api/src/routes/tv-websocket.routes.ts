/**
 * TradingView WebSocket Token 路由
 * @module routes/tv-websocket.routes
 */

import { Hono } from 'hono'
import { createLogger } from '../utils/logger'
import { success, serverError, paramError, StatusCode } from '../utils/response'
import { TvWebSocketService } from '../services/tv-websocket.service'
import type { Env } from '../types/env.d'

const logger = createLogger('TvWebSocketRoutes')

export const tvWebSocketRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    wsService: TvWebSocketService;
  };
}>()

tvWebSocketRoutes.use('*', async (c, next) => {
  c.set('wsService', new TvWebSocketService(c.env.RAPIDAPI_KEY))
  await next()
})

/**
 * 获取 WebSocket 连接 Token
 * GET /ws/token
 */
tvWebSocketRoutes.get('/ws/token', async (c) => {
  try {
    const wsService = c.get('wsService')
    const typeParam = c.req.query('type')
    const type = typeParam ? Number(typeParam) : 2 // 默认 6 小时

    // 参数校验
    if (![1, 2, 3].includes(type)) {
      logger.warn(`[getWebSocketToken] Invalid type parameter: ${type}`)
      return c.json(
        paramError('type 参数必须为 1 (30分钟)、2 (6小时) 或 3 (24小时)'),
        StatusCode.PARAM_ERROR
      )
    }

    logger.info(`[getWebSocketToken] Fetching token with type: ${type}`)

    const tokenData = await wsService.getWebSocketToken(type)

    logger.info(`[getWebSocketToken] Token obtained, expires at: ${new Date(tokenData.expiresAt).toISOString()}`)

    return c.json(success(tokenData), StatusCode.SUCCESS)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    logger.error(`[getWebSocketToken] Failed to get token: ${message}`, error)
    return c.json(
      serverError('获取 WebSocket Token 失败'),
      StatusCode.SERVER_ERROR
    )
  }
})
