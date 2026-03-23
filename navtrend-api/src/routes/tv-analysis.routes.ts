/**
 * TradingView 技术分析 API 路由
 * @module routes/tv-analysis.routes
 */

import { Hono } from 'hono'
import { createLogger } from '../utils/logger'
import { success, serverError, paramError, StatusCode } from '../utils/response'
import { RapidAnalysisService } from '../services/tv-analysis.service'
import type { Env } from '../types/env.d'

const logger = createLogger('TradingViewAnalysisRoutes')

export const tvAnalysisRoutes = new Hono<{
  Bindings: Env;
  Variables: {
    analysisService: RapidAnalysisService;
  };
}>()

tvAnalysisRoutes.use('*', async (c, next) => {
  c.set('analysisService', new RapidAnalysisService(c.env.RAPIDAPI_KEY))
  await next()
})

/**
 * GET /technical-analysis/:symbol
 * 获取技术分析数据
 */
tvAnalysisRoutes.get(
  '/technical-analysis/:symbol',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const { symbol } = c.req.param()
      const data = await analysisService.getTechnicalAnalysis(symbol)
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /technical-analysis/:symbol] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

tvAnalysisRoutes.get(
  '/quote/:symbol',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const { symbol } = c.req.param()
      const session = c.req.query('session') || 'regular'
      const fields = c.req.query('fields') || 'all'

      const data = await analysisService.getQuote(symbol, { session, fields })
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /quote/:symbol] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

tvAnalysisRoutes.get(
  '/price/:symbol',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const { symbol } = c.req.param()
      const timeframe = c.req.query('timeframe') || 'D'
      const range = Number(c.req.query('range') || '30')

      const MAX_RANGE = 500
      if (!Number.isFinite(range) || range <= 0 || range > MAX_RANGE) {
        return c.json(paramError(`range must be between 1 and ${MAX_RANGE}`), StatusCode.PARAM_ERROR)
      }

      const data = await analysisService.getHistory(symbol, { timeframe, range })
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /price/:symbol] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

tvAnalysisRoutes.post(
  '/quote/batch',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const body = await c.req.json<{ symbols?: string[]; session?: string; fields?: string }>()
      const symbols = Array.isArray(body.symbols) ? body.symbols : []

      if (symbols.length === 0) {
        return c.json(paramError('symbols is required'), StatusCode.PARAM_ERROR)
      }

      if (symbols.length > 20) {
        return c.json(paramError('最多支持20个 symbols 批量查询'), StatusCode.PARAM_ERROR)
      }

      const data = await analysisService.getBatchQuotes({
        symbols,
        session: body.session || 'regular',
        fields: body.fields || 'all'
      })

      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[POST /quote/batch] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

/**
 * GET /detailed-indicators/:symbol
 * 获取详细技术指标数据
 */
tvAnalysisRoutes.get(
  '/detailed-indicators/:symbol',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const { symbol } = c.req.param()
      const data = await analysisService.getDetailedIndicators(symbol)
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /detailed-indicators/:symbol] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)

/**
 * GET /search/market
 * 搜索市场和交易对
 */
tvAnalysisRoutes.get(
  '/search/market',
  async (c) => {
    try {
      const analysisService = c.get('analysisService')
      const params = c.req.query()
      const data = await analysisService.searchMarket(params)
      return c.json(success(data), StatusCode.SUCCESS)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      logger.error('[GET /search/market] Error:', message)
      return c.json(serverError(message), StatusCode.SERVER_ERROR)
    }
  }
)
