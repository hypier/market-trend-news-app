/**
 * 排行榜业务服务
 * 提供排行榜配置管理和数据获取的业务逻辑层封装
 *
 * @module services/leaderboard.service
 */

import { createLogger } from '../utils/logger'
import { RapidAPIClient } from '../integrations/tradingview/rapidapi-client'

// 导入默认配置文件
import defaultLeaderboardConfig from '../config/default-leaderboards.json'

/**
 * 排行榜业务服务类
 * 封装排行榜配置管理和数据获取逻辑
 *
 * 注意：Service层只返回数据，不包装HTTP响应格式
 * 错误通过异常抛出，由Routes层统一处理
 */
export class LeaderboardService {
  private rapidApiClient: RapidAPIClient
  private logger = createLogger('LeaderboardService')

  constructor(rapidApiKey: string) {
    this.rapidApiClient = new RapidAPIClient(rapidApiKey)
    this.logger.info('Leaderboard Service initialized')
  }

  // ========== 配置管理 ==========

  /**
   * 获取默认排行榜配置（前端显示用）
   * 包含分类和默认排行榜列表，用于前端构建 UI
   * 
   * 特性：
   * - 直接从 import 的配置文件返回（已在内存中，无需 I/O）
   * - 无需 KV 缓存（import 本身就是最快的缓存）
   * - icon 字段已移除，由前端 UI 层动态生成
   * 
   * 性能说明：
   * - import 的 JSON 在模块加载时已解析并缓存到内存
   * - 直接返回内存对象，响应时间 < 1ms
   * - 使用 KV 缓存反而会增加网络延迟（10-50ms）
   * 
   * @returns 默认配置对象
   * @throws Error 当配置格式无效时抛出异常
   */
  async getDefaultConfig(): Promise<typeof defaultLeaderboardConfig> {
    try {
      // 验证配置格式（防御性编程）
      if (!defaultLeaderboardConfig.version || 
          !defaultLeaderboardConfig.categories || 
          !defaultLeaderboardConfig.leaderboards) {
        throw new Error('Invalid default configuration format')
      }

      this.logger.debug(`[getDefaultConfig] 返回默认配置 (version: ${defaultLeaderboardConfig.version})`)
      
      // 直接返回 import 的配置对象（已在内存中）
      return defaultLeaderboardConfig
    } catch (error) {
      this.logger.error('[getDefaultConfig] 获取默认配置失败:', error)
      throw new Error('Failed to fetch default leaderboard configuration')
    }
  }

  /**
   * 获取所有排行榜配置
   * @returns 排行榜配置列表
   * @throws Error 当配置读取失败时抛出异常
   */
  async getLeaderboardConfigs(): Promise<any> {
    try {
      const metadataTabs = await this.rapidApiClient.getMetadataTabs('all')
      const tabs = Array.isArray(metadataTabs) ? metadataTabs : metadataTabs?.data || []

      // 加载默认配置以获取翻译
      const defaultConfig = await this.getDefaultConfig()

      // 转换为前端期望的格式
      const transformed = tabs.map((tab: any) => {
        // 从 id 中提取 market_code（仅对 stocks 类型）
        let market_code: string | undefined
        if (tab.type === 'stocks' && tab.id) {
          const urlMatch = tab.url?.match(/\/stocks-([^/]+)\//)
          market_code = urlMatch ? urlMatch[1] : undefined
        }

        // 构建完整的配置 key（包含 market_code）
        const configKey = market_code ? `${tab.id}:${market_code}` : tab.id

        // 从默认配置中查找翻译
        const defaultLeaderboard = (defaultConfig.leaderboards as any)[configKey]
        const nameTranslations = defaultLeaderboard?.name_translations || {
          en: tab.title,
          zh: tab.title
        }

        return {
          id: tab.id,
          market_type: tab.type,
          market_code,
          name_translations: nameTranslations
        }
      })

      return {
        data: transformed
      }
    } catch (error) {
      this.logger.error('[getLeaderboardConfigs] API 调用失败:', error)
      throw new Error('Failed to fetch leaderboard configurations from API')
    }
  }

  // ========== 排行榜数据获取 ==========

  /**
   * 获取排行榜数据
   * @param leaderboardId 排行榜ID
   * @param params 查询参数(包含 market_code, start, count, lang 等)
   * @returns 排行榜数据响应
   */
  async getLeaderboardData(
    leaderboardId: string,
    params: any = {}
  ): Promise<any> {
    try {
      const data = await this.rapidApiClient.getLeaderboardByConfigId(leaderboardId, params)
      return data
    } catch (error) {
      this.logger.error(`[getLeaderboardData] Failed to fetch data for ${leaderboardId}:`, error)
      throw error
    }
  }

}
