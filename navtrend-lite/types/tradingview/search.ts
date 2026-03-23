/**
 * TradingView 搜索类型定义
 * Search Type Definitions
 * 
 * @module tradingview/search
 */

/**
 * 市场搜索结果
 * 搜索市场和交易对时的返回结果
 * 
 * @example
 * ```json
 * {
 *   "id": "AAPL-NASDAQ",
 *   "exchange": "NASDAQ",
 *   "symbol": "AAPL",
 *   "full_name": "NASDAQ:AAPL",
 *   "description": "Apple Inc",
 *   "type": "stock"
 * }
 * ```
 */
/**
 * 市场搜索结果
 * 
 * 包含TradingView返回的所有字段，以下是常见字段：
 * - 基础字段：id, symbol, exchange, description, type
 * - Logo字段：logoid, base-currency-logoid, currency-logoid, source_logoid
 * - 元数据：currency_code, provider_id, country, source_id
 * - 标识符：cusip, isin
 * - 其他：typespecs, prefix, source2, is_primary_listing, found_by_isin, found_by_cusip
 * 
 * 注意：实际返回的字段取决于资产类型和TradingView API版本
 */
export interface MarketSearchResult {
  /** 唯一标识符（由后端生成：EXCHANGE:SYMBOL） */
  id: string
  /** 交易所代码 */
  exchange: string
  /** 符号代码 */
  symbol: string
  /** 完整符号 (格式: EXCHANGE:SYMBOL) */
  full_name: string
  /** 描述/名称 */
  description: string
  /** 类型 (stock, futures, forex, crypto, spot, etc.) */
  type: string
  
  // 以下字段都是可选的，由TradingView API返回
  /** 货币代码 */
  currency_code?: string
  /** 数据提供商ID */
  provider_id?: string
  
  // Logo相关字段
  /** Logo ID（用于股票公司Logo，如 "apple"） */
  logoid?: string
  /** 基础货币Logo ID（用于加密货币，如 "crypto/XTVCBTC"） */
  'base-currency-logoid'?: string
  /** 货币/国家Logo ID（如 "country/US"） */
  'currency-logoid'?: string
  /** Logo来源ID（如 "source/NASDAQ"） */
  source_logoid?: string
  
  // 元数据字段
  /** 国家代码 */
  country?: string
  /** 来源ID */
  source_id?: string
  /** CUSIP代码 */
  cusip?: string
  /** ISIN代码 */
  isin?: string
  /** 类型规格（如 ["crypto", "common"]） */
  typespecs?: string[]
  /** 前缀（用于生成full_name） */
  prefix?: string
  /** 是否主要上市 */
  is_primary_listing?: boolean
  /** 是否通过ISIN找到 */
  found_by_isin?: boolean
  /** 是否通过CUSIP找到 */
  found_by_cusip?: boolean
  
  /** 交易所详细信息 */
  source2?: {
    id: string
    name: string
    description: string
  }
  
  // 允许其他任意字段（TradingView可能添加新字段）
  [key: string]: any
}

/**
 * 市场搜索选项
 * 使用 TradingView Symbol Search API v3
 * 
 * @example
 * ```typescript
 * const options: MarketSearchOptions = {
 *   query: 'apple',
 *   filter: 'stock',
 *   lang: 'zh',
 *   country: 'CN'
 * }
 * ```
 */
export interface MarketSearchOptions {
  /** 搜索关键词（支持 EXCHANGE:SYMBOL 格式） */
  query: string
  /** 
   * 类型过滤
   * - stock: 股票
   * - funds: 基金
   * - futures: 期货
   * - forex: 外汇
   * - crypto: 加密货币
   * - index: 指数
   * - bond: 债券
   * - economic: 经济
   * - options: 期权
   * - undefined: 所有类型
   */
  filter?: 'stock' | 'funds' | 'futures' | 'forex' | 'crypto' | 'index' | 'bond' | 'economic' | 'options' | 'undefined'
  /** 语言代码（默认: en） */
  lang?: string
  /** 按国家排序（默认: US，可选: CN, JP 等） */
  country?: string
  /** 搜索高亮（1: 启用, 0: 禁用，默认: 0） */
  hl?: 0 | 1
}

/**
 * 指标搜索结果
 * 
 * @example
 * ```json
 * {
 *   "id": "STD;MACD",
 *   "version": "1",
 *   "name": "MACD",
 *   "type": "study",
 *   "access": "open",
 *   "source": "built-in"
 * }
 * ```
 */
export interface IndicatorSearchResult {
  /** 指标ID */
  id: string
  /** 版本 */
  version: string
  /** 指标名称 */
  name: string
  /** 作者信息 */
  author?: {
    id: string
    username: string
  }
  /** 指标类型 */
  type: string
  /** 访问级别 (public, private, open, etc.) */
  access: string
  /** 图片ID */
  image?: string
  /** 来源 (built-in or public) */
  source?: 'built-in' | 'public'
}

/**
 * 指标输入参数定义
 * 
 * @example
 * ```json
 * {
 *   "id": "length",
 *   "name": "Length",
 *   "type": "integer",
 *   "defval": 14,
 *   "min": 1,
 *   "max": 1000
 * }
 * ```
 */
export interface IndicatorInput {
  /** 参数ID */
  id: string
  /** 参数名称 */
  name: string
  /** 参数类型 */
  type: string
  /** 默认值 */
  defval: unknown
  /** 最小值 */
  min?: number
  /** 最大值 */
  max?: number
  /** 选项列表 */
  options?: unknown[]
}

/**
 * 指标详情
 * 包含指标的完整配置信息
 * 
 * @example
 * ```typescript
 * const indicator: IndicatorDetails = {
 *   pineId: 'STD;MACD',
 *   pineVersion: '1.0',
 *   description: 'Moving Average Convergence Divergence',
 *   type: 'study',
 *   inputs: [...]
 * }
 * ```
 */
export interface IndicatorDetails {
  /** Pine Script ID */
  pineId: string
  /** Pine Script 版本 */
  pineVersion: string
  /** 描述 */
  description?: string
  /** 简短描述 */
  shortDescription?: string
  /** 指标类型 */
  type: string
  /** 输入参数列表 */
  inputs: IndicatorInput[]
  /** 绘图配置 */
  plots?: unknown[]
  /** 元信息 */
  metaInfo?: Record<string, unknown>
}

