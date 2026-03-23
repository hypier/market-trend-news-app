/**
 * TradingView RapidAPI 客户端
 * 使用 RapidAPI 提供的 TradingView 数据接口
 *
 * @module integrations/tradingview/rapidapi-client
 */

import { createLogger } from '../../utils/logger'
import {
  RAPIDAPI_BASE_URL,
  RAPIDAPI_ENDPOINTS,
} from './constants'

const logger = createLogger('RapidAPIClient')

interface QuoteRequestOptions {
  session?: string
  fields?: string
}

interface BatchQuoteRequestOptions extends QuoteRequestOptions {
  symbols: string[]
}

interface HistoryRequestOptions {
  timeframe: string
  range: number
}

/**
 * RapidAPI TradingView 客户端
 * 提供与原 TradingViewClient 兼容的接口
 */
export class RapidAPIClient {
  private rapidApiKey: string

  constructor(rapidApiKey: string) {
    this.rapidApiKey = rapidApiKey
    logger.info('RapidAPI Client initialized')
  }

  /**
   * 获取技术分析数据
   * @param symbol 交易对符号 (格式: EXCHANGE:SYMBOL)
   * @returns 技术分析数据
   */
  async getTechnicalAnalysis(symbol: string): Promise<any> {
    logger.info(`[getTechnicalAnalysis] Fetching for symbol: ${symbol}`)

    const url = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.technicalAnalysis(symbol)}`
    const response = await this.makeRequest<any>(url)

    logger.info(`[getTechnicalAnalysis] Success for ${symbol}`)
    return response
  }

  /**
   * 获取详细技术指标数据
   * @param symbol 交易对符号
   * @returns 详细技术指标数据
   */
  async getDetailedIndicators(symbol: string): Promise<any> {
    logger.info(`[getDetailedIndicators] Fetching for symbol: ${symbol}`)

    const url = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.technicalIndicators(symbol)}`
    const response = await this.makeRequest<any>(url)

    logger.info(`[getDetailedIndicators] Success for ${symbol}`)
    return response
  }

  /**
   * 市场搜索
   * @param options 搜索选项
   * @returns 搜索结果列表
   */
  async searchMarket(options: any): Promise<any[]> {
    logger.info(`[searchMarket] Searching for: ${options.query}`)

    const baseUrl = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.marketSearch(options.query)}`
    const params = new URLSearchParams()
    if (options.filter) params.append('filter', options.filter)

    const url = params.toString() ? `${baseUrl}?${params}` : baseUrl
    const response = await this.makeRequest<any>(url)

    logger.info(`[searchMarket] Found ${response.markets?.length || 0} results`)
    return response.markets || []
  }

  /**
   * 获取新闻列表
   * @param category 新闻分类
   * @param lang 语言代码
   * @returns 新闻列表
   */
  async getNews(category: string = 'economic', lang: string = 'en'): Promise<any> {
    logger.info(`[getNews] Fetching news: ${category}`)

    const baseUrl = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.news(category)}`
    const url = `${baseUrl}?lang=${lang}`
    const response = await this.makeRequest<any>(url)

    logger.info(`[getNews] Success for ${category}`)
    return response
  }

  /**
   * 获取新闻详情
   * @param newsId 新闻ID
   * @param lang 语言代码
   * @returns 新闻详情
   */
  async getNewsDetail(newsId: string, lang: string = 'en'): Promise<any> {
    logger.info(`[getNewsDetail] Fetching: ${newsId}`)

    const baseUrl = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.newsDetail(newsId)}`
    const url = `${baseUrl}?lang=${lang}`
    const response = await this.makeRequest<any>(url)

    logger.info(`[getNewsDetail] Success for ${newsId}`)
    return response
  }

  /**
   * 通过配置ID获取排行榜数据
   * @param configId 配置ID (如 stocks.gainers, crypto.all)
   * @param params 查询参数 (start, count, lang, market_code)
   * @returns 排行榜数据
   */
  async getLeaderboardByConfigId(configId: string, params?: any): Promise<any> {
    logger.info(`[getLeaderboardByConfigId] Fetching: ${configId}`)

    const start = params?.start || 0
    const count = params?.count || 20
    const lang = params?.lang || 'en'

    let url = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.leaderboard(configId)}&start=${start}&count=${count}&lang=${lang}`
    if (params?.market_code) {
      url += `&market_code=${params.market_code}`
    }

    const response = await this.makeRequest<any>(url)

    logger.info(`[getLeaderboardByConfigId] Success for ${configId}`)
    return response
  }

  /**
   * 获取实时报价（批量）
   * @param symbol 交易对符号
   * @returns 报价数据
   */
  async getQuote(symbol: string, options: QuoteRequestOptions = {}): Promise<any> {
    logger.info(`[getQuote] Fetching: ${symbol}`)

    const session = options.session || 'regular'
    const fields = options.fields || 'all'

    const response = await this.getBatchQuotes({
      symbols: [symbol],
      session,
      fields
    })

    logger.info(`[getQuote] Success for ${symbol}`)
    return response
  }

  /**
   * 批量获取实时报价
   * @param options 批量报价请求参数
   * @returns 批量报价数据
   */
  async getBatchQuotes(options: BatchQuoteRequestOptions): Promise<any> {
    logger.info(`[getBatchQuotes] Fetching ${options.symbols.length} symbols`)

    const session = options.session || 'regular'
    const fields = options.fields || 'all'

    const url = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.quoteBatch()}`
    const response = await this.makeRequest<any>(url, {
      method: 'POST',
      body: JSON.stringify({
        symbols: options.symbols,
        session,
        fields
      })
    })

    logger.info(`[getBatchQuotes] Success for ${options.symbols.length} symbols`)
    return response
  }

  /**
   * 获取历史价格数据
   * @param symbol 交易对符号
   * @param options 历史数据参数
   * @returns 历史价格数据
   */
  async getHistory(symbol: string, options: HistoryRequestOptions): Promise<any> {
    logger.info(`[getHistory] Fetching ${symbol}, timeframe=${options.timeframe}, range=${options.range}`)

    const baseUrl = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.priceHistory(symbol)}`
    const url = `${baseUrl}?timeframe=${encodeURIComponent(options.timeframe)}&range=${options.range}`
    const response = await this.makeRequest<any>(url)

    logger.info(`[getHistory] Success for ${symbol}`)
    return response
  }

  /**
   * 获取元数据标签列表
   * @param type 资产类型 (可选，如 stocks, crypto, all)
   * @returns 标签列表数据
   */
  async getMetadataTabs(type?: string): Promise<any> {
    logger.info(`[getMetadataTabs] Fetching tabs${type ? ` for type: ${type}` : ''}`)

    const baseUrl = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.metadataTabs()}`
    const url = type ? `${baseUrl}?type=${type}` : baseUrl
    const response = await this.makeRequest<any>(url)
    const tabs = Array.isArray(response) ? response : response?.data || []

    logger.info(`[getMetadataTabs] Success, found ${tabs.length || 0} tabs`)
    return response
  }

  /**
   * 获取 WebSocket 连接 Token
   * @param type Token 过期时间类型：1 (30分钟)、2 (6小时)、3 (24小时)
   * @returns WebSocket Token 数据
   */
  async getWebSocketToken(type: number = 2): Promise<any> {
    logger.info(`[getWebSocketToken] Requesting token with type: ${type}`)

    const url = `${RAPIDAPI_BASE_URL}${RAPIDAPI_ENDPOINTS.tokenGenerate()}`
    const response = await this.makeRequest<any>(url, {
      method: 'POST',
      body: JSON.stringify({
        'token-jwt-type': type,
      })
    })

    logger.info(`[getWebSocketToken] Token obtained successfully`)
    return response
  }

  /**
   * 通用请求方法
   * @param url 请求URL
   * @param options fetch选项
   * @returns 响应数据
   */
  private async makeRequest<T>(url: string, options?: RequestInit): Promise<T> {
    const method = options?.method || 'GET'
    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'tradingview-data1.p.rapidapi.com',
          ...options?.headers,
        },
        signal: AbortSignal.timeout(10000),
      })

      const duration = Date.now() - startTime
      logger.info(`🌐 [makeRequest] ${method} ${url} → ${response.status} ${response.statusText} (${duration}ms)`)

      if (!response.ok) {
        const errorText = await response.text()
        logger.error(`❌ [makeRequest] HTTP Error ${response.status}: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as Record<string, unknown>

      // RapidAPI 返回格式: { success: boolean, data: T }
      if ('success' in data && data.success === false) {
        const message = typeof data.message === 'string' ? data.message : 'API returned error'
        logger.error(`⚠️ [makeRequest] API Error: ${message}`)
        throw new Error(message)
      }

      // 返回 data 字段内容
      if ('data' in data) {
        return data.data as T
      }

      return data as T

    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`💥 [makeRequest] Failed after ${duration}ms:`, error)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 10 seconds')
      }
      throw error
    }
  }
}
