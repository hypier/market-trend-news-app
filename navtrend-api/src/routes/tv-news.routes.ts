/**
 * TradingView 新闻服务 API 路由
 * @module routes/tv-news.routes
 */

import { Hono } from 'hono'
import { createLogger } from '../utils/logger'
import { success, serverError, StatusCode } from '../utils/response'
import { RapidNewsService } from '../services/tv-news.service'
import type { Env } from '../types/env.d'

const logger = createLogger('TradingViewNewsRoutes')

export const tvNewsRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    newsService: RapidNewsService;
  };
}>()

tvNewsRoutes.use('*', async (c, next) => {
  c.set('newsService', new RapidNewsService(c.env.RAPIDAPI_KEY))
  await next()
})

/**
 * GET /news
 * 获取新闻列表
 */
tvNewsRoutes.get(
  '/news',
  async (c) => {
    try {
      const newsService = c.get('newsService')
      const queryParams = c.req.query()

      const filters: string[] = []
      if (queryParams.lang) {
        filters.push(`lang:${queryParams.lang}`)
      }
      if (queryParams.market) {
        filters.push(`market:${queryParams.market}`)
      }
      if (queryParams.symbol) {
        filters.push(`symbol:${queryParams.symbol}`)
      }

      const params = {
        filters: filters.length > 0 ? filters : undefined
      }

      const data = await newsService.getNews(params)
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /news] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

/**
 * GET /news/:newsId
 * 获取新闻详情
 */
tvNewsRoutes.get(
  '/news/:newsId',
  async (c) => {
    try {
      const newsService = c.get('newsService')
      const newsId = c.req.param('newsId')
      const lang = c.req.query('lang') || 'en'

      if (!newsId) {
        return c.json(serverError('News ID is required'), StatusCode.PARAM_ERROR)
      }

      const data = await newsService.getNewsDetail(newsId, lang)
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /news/:newsId] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)
