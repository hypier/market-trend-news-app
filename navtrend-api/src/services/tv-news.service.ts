/**
 * RapidAPI 新闻服务
 * 使用 RapidAPI 提供新闻功能
 *
 * @module services/rapid/rapid-news.service
 */

import { createLogger } from '../utils/logger'
import { RapidAPIClient } from '../integrations/tradingview/rapidapi-client'

const logger = createLogger('RapidNewsService')

/**
 * RapidAPI 新闻服务类
 * 提供与 TradingViewNewsService 相同的接口
 */
export class RapidNewsService {
  private client: RapidAPIClient

  constructor(rapidApiKey: string) {
    this.client = new RapidAPIClient(rapidApiKey)
    logger.info('RapidAPI News Service initialized')
  }

  /**
   * 获取新闻列表
   * @param params 新闻请求参数（兼容 TradingViewNewsService）
   * @returns 新闻列表
   */
  async getNews(params: any): Promise<any> {
    const category = 'economic'
    let lang = 'en'

    if (params.filters) {
      for (const filter of params.filters) {
        if (filter.startsWith('lang:')) {
          lang = filter.substring(5)
        }
      }
    }

    logger.info(`[getNews] Processing category: ${category}, lang: ${lang}`)
    return await this.client.getNews(category, lang)
  }

  /**
   * 获取新闻详情
   * @param newsId 新闻ID
   * @param lang 语言代码
   * @returns 新闻详情
   */
  async getNewsDetail(newsId: string, lang: string = 'en'): Promise<any> {
    logger.info(`[getNewsDetail] Processing newsId: ${newsId}, lang: ${lang}`)
    return await this.client.getNewsDetail(newsId, lang)
  }
}
