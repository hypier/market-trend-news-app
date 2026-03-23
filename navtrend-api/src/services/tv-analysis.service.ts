/**
 * RapidAPI 技术分析服务
 * 使用 RapidAPI 提供技术分析功能
 *
 * @module services/rapid/rapid-analysis.service
 */

import { createLogger } from '../utils/logger'
import { RapidAPIClient } from '../integrations/tradingview/rapidapi-client'

const logger = createLogger('RapidAnalysisService')

interface QuoteOptions {
  session?: string
  fields?: string
}

interface HistoryOptions {
  timeframe: string
  range: number
}

interface BatchQuoteOptions extends QuoteOptions {
  symbols: string[]
}

interface NormalizedBatchQuoteItem {
  success: boolean
  symbol: string
  data?: any
  error?: string
}

interface NormalizedBatchQuoteResponse {
  success: boolean
  total: number
  successful: number
  failed: number
  data: NormalizedBatchQuoteItem[]
}

/**
 * RapidAPI 技术分析服务类
 * 提供与 TradingViewAnalysisService 相同的接口
 */
export class RapidAnalysisService {
  private client: RapidAPIClient

  private normalizeBatchQuotes(payload: any, fallbackSymbols: string[]): NormalizedBatchQuoteResponse {
    const rawItems = Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : []

    const items: NormalizedBatchQuoteItem[] = rawItems.map((item: any, index: number) => ({
      success: Boolean(item?.success ?? item?.data),
      symbol: item?.symbol || item?.id || fallbackSymbols[index] || '',
      data: item?.data,
      error: item?.error || item?.message,
    }))

    const total = typeof payload?.total === 'number' ? payload.total : fallbackSymbols.length
    const successful = typeof payload?.successful === 'number'
      ? payload.successful
      : items.filter((item) => item.success).length
    const failed = typeof payload?.failed === 'number'
      ? payload.failed
      : Math.max(total - successful, 0)

    return {
      success: payload?.success ?? true,
      total,
      successful,
      failed,
      data: items,
    }
  }

  private normalizeHistory(payload: any, symbol: string, options: HistoryOptions) {
    const history = Array.isArray(payload?.history)
      ? payload.history
      : Array.isArray(payload?.periods)
        ? payload.periods
        : []

    return {
      success: payload?.success ?? true,
      symbol: payload?.symbol || symbol,
      history,
      current: payload?.current,
      info: payload?.info,
      timeframe: options.timeframe,
      range: options.range,
    }
  }

  constructor(rapidApiKey: string) {
    this.client = new RapidAPIClient(rapidApiKey)
    logger.info('RapidAPI Analysis Service initialized')
  }

  /**
   * 获取技术分析数据
   * @param symbol 交易对符号 (格式: EXCHANGE:SYMBOL)
   * @returns 技术分析数据
   */
  async getTechnicalAnalysis(symbol: string): Promise<any> {
    logger.info(`[getTechnicalAnalysis] Processing symbol: ${symbol}`)
    return await this.client.getTechnicalAnalysis(symbol)
  }

  /**
   * 获取详细技术指标数据
   * @param symbol 交易对符号 (格式: EXCHANGE:SYMBOL)
   * @returns 详细技术指标数据
   */
  async getDetailedIndicators(symbol: string): Promise<any> {
    logger.info(`[getDetailedIndicators] Processing symbol: ${symbol}`)
    return await this.client.getDetailedIndicators(symbol)
  }

  /**
   * 搜索市场和交易对
   * @param options 搜索选项
   * @returns 搜索结果列表
   */
  async searchMarket(options: any): Promise<any> {
    logger.info(`[searchMarket] Processing query: ${options.query}`)
    return await this.client.searchMarket(options)
  }

  /**
   * 获取实时报价数据
   * @param symbol 交易对符号 (格式: EXCHANGE:SYMBOL)
   * @param options 报价选项
   * @returns 报价数据
   */
  async getQuote(symbol: string, options: QuoteOptions = {}): Promise<any> {
    logger.info(`[getQuote] Processing symbol: ${symbol}, session: ${options.session || 'regular'}, fields: ${options.fields || 'all'}`)
    
    const batchResult = await this.getBatchQuotes({
      symbols: [symbol],
      session: options.session,
      fields: options.fields,
    })
    
    // 提取第一个结果
    const firstItem = batchResult.data[0]
    if (!firstItem?.success || !firstItem?.data) {
      throw new Error(firstItem?.error || `Quote not found for symbol: ${symbol}`)
    }
    
    return firstItem.data
  }

  /**
   * 获取历史 K 线数据
   * @param symbol 交易对符号 (格式: EXCHANGE:SYMBOL)
   * @param options 历史数据参数
   * @returns 历史数据
   */
  async getHistory(symbol: string, options: HistoryOptions): Promise<any> {
    logger.info(`[getHistory] Processing symbol: ${symbol}, timeframe=${options.timeframe}, range=${options.range}`)
    const payload = await this.client.getHistory(symbol, options)
    return this.normalizeHistory(payload, symbol, options)
  }

  /**
   * 批量获取报价数据
   * @param options 批量报价参数
   * @returns 批量报价数据
   */
  async getBatchQuotes(options: BatchQuoteOptions): Promise<any> {
    logger.info(`[getBatchQuotes] Processing ${options.symbols.length} symbols`)
    const payload = await this.client.getBatchQuotes(options)
    return this.normalizeBatchQuotes(payload, options.symbols)
  }

  /**
   * 搜索技术指标（RapidAPI 不支持）
   * @throws Error 抛出不支持错误
   */
  async searchIndicator(query: string): Promise<never> {
    logger.warn(`[searchIndicator] Not supported in RapidAPI version: ${query}`)
    throw new Error('Indicator search is not available in RapidAPI version')
  }

  /**
   * 获取指标详细信息（RapidAPI 不支持）
   * @throws Error 抛出不支持错误
   */
  async getIndicatorDetails(id: string, version: string = 'last'): Promise<never> {
    logger.warn(`[getIndicatorDetails] Not supported in RapidAPI version: ${id}@${version}`)
    throw new Error('Indicator details are not available in RapidAPI version')
  }
}
