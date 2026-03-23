/**
 * TradingView 筛选器类型定义
 * Screener Type Definitions
 * 
 * @module tradingview/screener
 */

/**
 * 筛选器数据行
 * 包含一条筛选器结果的所有字段值
 * 
 * @example
 * ```json
 * {
 *   "s": "NASDAQ:AAPL",
 *   "d": [
 *     "Apple Inc",
 *     174.25,
 *     2.50,
 *     "BUY",
 *     1500000
 *   ]
 * }
 * ```
 */
export interface ScreenerRow {
  /** 符号代码 (格式: EXCHANGE:SYMBOL) */
  s: string
  /** 数据值数组 (对应columns的值) */
  d: unknown[]
}

/**
 * 筛选器响应数据
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 150,
 *   "data": [
 *     { "s": "NASDAQ:AAPL", "d": [...] },
 *     { "s": "NYSE:MSFT", "d": [...] }
 *   ]
 * }
 * ```
 */
export interface ScreenerData {
  /** 总数据条数 */
  totalCount: number
  /** 数据行数组 */
  data: ScreenerRow[]
}

/**
 * 排序配置
 * 
 * @example
 * ```typescript
 * const sort: ScreenerSort = {
 *   sortBy: 'market_cap_basic',
 *   sortOrder: 'desc',
 *   nullsFirst: false
 * }
 * ```
 */
export interface ScreenerSort {
  /** 排序字段 */
  sortBy: string
  /** 排序方向 */
  sortOrder: 'asc' | 'desc'
  /** 空值优先 */
  nullsFirst?: boolean
}

/**
 * 筛选器请求参数
 * 
 * @example
 * ```typescript
 * const params: ScreenerParams = {
 *   preset: 'top_gainers',
 *   sort: { sortBy: 'change', sortOrder: 'desc' },
 *   range: [0, 50],
 *   columns: ['name', 'close', 'change', 'volume'],
 *   lang: 'en'
 * }
 * ```
 */
export interface ScreenerParams {
  /** 预设类型 (如: top_gainers, large_cap, major-indices, etc.) */
  preset?: string
  
  /** 排序配置 */
  sort?: ScreenerSort
  
  /** 数据范围 [起始索引, 结束索引] */
  range?: [number, number]
  
  /** 自定义列 (字段名数组) */
  columns?: string[]
  
  /** 自定义过滤器 (复杂查询条件) */
  filter?: unknown[]
  
  /** 语言代码 (en, zh, etc.) */
  lang?: string
}

/**
 * 股票筛选器特殊参数
 * 需要指定市场代码
 * 
 * @example
 * ```typescript
 * const params: StockScreenerParams = {
 *   market: 'america',
 *   preset: 'top_gainers',
 *   sort: { sortBy: 'change', sortOrder: 'desc' },
 *   range: [0, 20]
 * }
 * ```
 */
export interface StockScreenerParams extends ScreenerParams {
  /** 市场代码 (如: america, hongkong, india, etc.) */
  market: string
}

/**
 * 筛选器预设类型
 * 常用的筛选器预设
 */
export type ScreenerPreset =
  | 'top_gainers'          // 涨幅榜
  | 'top_losers'           // 跌幅榜
  | 'most_active'          // 最活跃
  | 'high_volume'          // 高成交量
  | 'large_cap'            // 大盘股
  | 'mid_cap'              // 中盘股
  | 'small_cap'            // 小盘股
  | 'major-indices'        // 主要指数
  | 'all-indices'          // 所有指数
  | string                 // 其他自定义预设

/**
 * 市场代码类型
 * 支持的股票市场
 */
export type StockMarket =
  | 'america'              // 美国市场
  | 'hongkong'             // 香港市场
  | 'india'                // 印度市场
  | 'japan'                // 日本市场
  | 'korea'                // 韩国市场
  | 'vietnam'              // 越南市场
  | 'thailand'             // 泰国市场
  | 'australia'            // 澳大利亚市场
  | 'uk'                   // 英国市场
  | 'germany'              // 德国市场
  | 'france'               // 法国市场
  | 'italy'                // 意大利市场
  | 'spain'                // 西班牙市场
  | 'canada'               // 加拿大市场
  | 'brazil'               // 巴西市场
  | 'mexico'               // 墨西哥市场
  | string                 // 其他市场

/**
 * 常用筛选器列名
 * 用于构建自定义列
 */
export type ScreenerColumn =
  | 'name'                 // 名称
  | 'close'                // 收盘价
  | 'change'               // 变化
  | 'change_abs'           // 绝对变化
  | 'volume'               // 成交量
  | 'market_cap_basic'     // 市值
  | 'price_earnings_ttm'   // 市盈率
  | 'Recommend.All'        // 技术分析推荐
  | 'high'                 // 最高价
  | 'low'                  // 最低价
  | 'open'                 // 开盘价
  | 'exchange'             // 交易所
  | 'type'                 // 类型
  | 'description'          // 描述
  | string                 // 其他自定义列

/**
 * 筛选器基础参数
 * 指数、股票、加密货币共用的核心参数
 * 
 * @example
 * ```typescript
 * const params: BaseScreenerParams = {
 *   preset: 'large_cap',
 *   range: [0, 50],
 *   lang: 'en'
 * }
 * ```
 */
export interface BaseScreenerParams {
  /** 预设类型 (如: major, gainers, coin_large_cap, etc.) */
  preset?: string
  
  /** 数据范围 [起始索引, 结束索引] */
  range?: [number, number]
  
  /** 语言代码 (en, zh, etc.) */
  lang?: string
  
  /** 排序字段 (可选，从配置中读取，如: 'change', '24h_close_change|5', 'market_cap_calc') */
  sortBy?: string
  
  /** 排序方向 (可选，从配置中读取) */
  sortOrder?: 'asc' | 'desc'
}

/**
 * 指数筛选器简化参数
 * 使用基础参数，无需额外扩展
 * 
 * @example
 * ```typescript
 * const params: IndicesScreenerParams = {
 *   preset: 'major',
 *   range: [0, 50],
 *   lang: 'en'
 * }
 * ```
 */
export interface IndicesScreenerParams extends BaseScreenerParams {}

/**
 * 基础筛选器行数据
 * 指数和股票共用的核心字段
 * 
 * @example
 * ```json
 * {
 *   "symbol": "SP:SPX",
 *   "name": "SPX",
 *   "description": "S&P 500",
 *   "exchange": "SP",
 *   "logoid": "indices/s-and-p-500",
 *   "type": "index",
 *   "currency": "USD",
 *   "price": 6735.34,
 *   "change": 0.002969,
 *   "changeAbs": 0.19999
 * }
 * ```
 */
export interface BaseScreenerRow {
  /** 完整符号 (格式: EXCHANGE:SYMBOL) */
  symbol: string
  
  /** 代码 (股票代码/指数代码) */
  name: string
  
  /** 描述 (公司名称/指数名称) */
  description: string
  
  /** 交易所代码 */
  exchange: string
  
  /** Logo ID (TradingView 图标标识) */
  logoid: string
  
  /** 类型 (如: index, stock, crypto) */
  type: string
  
  /** 币种 (如: USD, CAD, EUR, null表示无币种) */
  currency: string | null
  
  /** 当前价格 */
  price: number
  
  /** 涨跌幅（百分比小数形式，如 0.0029 表示 0.29%） */
  change: number
  
  /** 涨跌额（绝对值） */
  changeAbs: number
}

/**
 * 指数筛选器行数据
 * 使用基础字段，无需额外扩展
 * 
 * @example
 * ```json
 * {
 *   "symbol": "SP:SPX",
 *   "name": "SPX",
 *   "description": "S&P 500",
 *   "exchange": "SP",
 *   "logoid": "indices/s-and-p-500",
 *   "type": "index",
 *   "currency": "USD",
 *   "price": 6735.34,
 *   "change": 0.002969,
 *   "changeAbs": 0.19999
 * }
 * ```
 */
export interface IndicesScreenerRow extends BaseScreenerRow {}

/**
 * 指数筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 25,
 *   "data": [
 *     {
 *       "symbol": "SP:SPX",
 *       "name": "SPX",
 *       "description": "S&P 500",
 *       "exchange": "SP",
 *       "price": 6735.34,
 *       "change": 0.002969,
 *       "changeAbs": 0.19999
 *     }
 *   ]
 * }
 * ```
 */
export interface IndicesScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: IndicesScreenerRow[]
}

/**
 * 股票筛选器简化参数
 * 继承基础参数，额外添加市场代码
 * 
 * @example
 * ```typescript
 * const params: StockScreenerSimpleParams = {
 *   market: 'america',
 *   preset: 'gainers',
 *   range: [0, 100],
 *   lang: 'en'
 * }
 * ```
 */
export interface StockScreenerSimpleParams extends BaseScreenerParams {
  /** 市场代码 (如: america, hongkong, india, etc.) - 股票特有，必需 */
  market: string
}

/**
 * 股票筛选器行数据
 * 继承基础字段，额外添加价格精度
 * 
 * @example
 * ```json
 * {
 *   "symbol": "NASDAQ:NVDA",
 *   "name": "NVDA",
 *   "description": "NVIDIA Corporation",
 *   "exchange": "NASDAQ",
 *   "logoid": "nvidia",
 *   "type": "stock",
 *   "currency": "USD",
 *   "price": 180.28,
 *   "change": -0.4857584455729717,
 *   "changeAbs": -0.88,
 *   "pricescale": 100
 * }
 * ```
 */
export interface StockScreenerRow extends BaseScreenerRow {
  /** 价格精度 (用于格式化显示，如: 100表示2位小数) */
  pricescale: number
}

/**
 * 股票筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 4648,
 *   "data": [
 *     {
 *       "symbol": "NASDAQ:NVDA",
 *       "name": "NVDA",
 *       "description": "NVIDIA Corporation",
 *       "logoid": "nvidia",
 *       "type": "stock",
 *       "change": -0.4857,
 *       "close": 180.28,
 *       "pricescale": 100,
 *       "currency": "USD"
 *     }
 *   ]
 * }
 * ```
 */
export interface StockScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: StockScreenerRow[]
}

/**
 * 加密货币筛选器简化参数
 * 使用基础参数，无需额外扩展
 * 
 * @example
 * ```typescript
 * const params: CryptoScreenerSimpleParams = {
 *   preset: 'coin_large_cap',
 *   range: [0, 100],
 *   lang: 'en'
 * }
 * ```
 */
export interface CryptoScreenerSimpleParams extends BaseScreenerParams {}

/**
 * 加密货币筛选器行数据
 * 继承基础字段，额外添加价格精度
 * 
 * @example
 * ```json
 * {
 *   "symbol": "CRYPTO:BTCUSD",
 *   "name": "BTC",
 *   "description": "Bitcoin",
 *   "exchange": "CRYPTO",
 *   "logoid": "crypto/XTVCBTC",
 *   "type": "spot",
 *   "currency": "USD",
 *   "price": 109061.24,
 *   "change": -1.5039320578276716,
 *   "changeAbs": -1639.52,
 *   "pricescale": 100
 * }
 * ```
 */
export interface CryptoScreenerRow extends BaseScreenerRow {
  /** 价格精度 (用于格式化显示，如: 100表示2位小数) */
  pricescale: number
}

/**
 * 加密货币筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 105,
 *   "data": [
 *     {
 *       "symbol": "CRYPTO:BTCUSD",
 *       "name": "BTC",
 *       "description": "Bitcoin",
 *       "exchange": "CRYPTO",
 *       "logoid": "crypto/XTVCBTC",
 *       "type": "spot",
 *       "currency": "USD",
 *       "price": 109061.24,
 *       "change": -1.5039,
 *       "changeAbs": -1639.52,
 *       "pricescale": 100
 *     }
 *   ]
 * }
 * ```
 */
export interface CryptoScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: CryptoScreenerRow[]
}

/**
 * 外汇筛选器简化参数
 * 使用基础参数，无需额外扩展
 * 
 * @example
 * ```typescript
 * const params: ForexScreenerSimpleParams = {
 *   preset: 'forex_rates_major',
 *   range: [0, 100],
 *   lang: 'en'
 * }
 * ```
 */
export interface ForexScreenerSimpleParams extends BaseScreenerParams {}

/**
 * 外汇筛选器行数据
 * 继承基础字段，额外添加价格精度和货币Logo
 * 
 * @example
 * ```json
 * {
 *   "symbol": "FX_IDC:EURUSD",
 *   "name": "EURUSD",
 *   "description": "Euro vs US Dollar",
 *   "exchange": "FX_IDC",
 *   "logoid": "country/US",
 *   "type": "forex",
 *   "currency": "USD",
 *   "price": 1.0523,
 *   "change": 0.1234,
 *   "changeAbs": 0.0013,
 *   "pricescale": 100000,
 *   "baseCurrencyLogoid": "country/EU"
 * }
 * ```
 */
export interface ForexScreenerRow extends BaseScreenerRow {
  /** 价格精度 (用于格式化显示，如: 100000表示5位小数) */
  pricescale: number
  
  /** 基础货币 Logo ID (如: country/EU) */
  baseCurrencyLogoid: string
}

/**
 * 外汇筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 95,
 *   "data": [
 *     {
 *       "symbol": "FX_IDC:EURUSD",
 *       "name": "EURUSD",
 *       "description": "Euro vs US Dollar",
 *       "exchange": "FX_IDC",
 *       "logoid": "country/US",
 *       "type": "forex",
 *       "currency": "USD",
 *       "price": 1.0523,
 *       "change": 0.1234,
 *       "changeAbs": 0.0013,
 *       "pricescale": 100000,
 *       "baseCurrencyLogoid": "country/EU"
 *     }
 *   ]
 * }
 * ```
 */
export interface ForexScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: ForexScreenerRow[]
}

/**
 * 期货筛选器简化参数
 * 使用基础参数，无需额外扩展
 * 
 * @example
 * ```typescript
 * const params: FuturesScreenerSimpleParams = {
 *   preset: 'futures.quotes_all',
 *   range: [0, 100],
 *   lang: 'en'
 * }
 * ```
 */
export interface FuturesScreenerSimpleParams extends BaseScreenerParams {}

/**
 * 期货筛选器行数据
 * 继承基础字段，额外添加价格精度
 * 
 * @example
 * ```json
 * {
 *   "symbol": "CBOT_MINI:10Y1!",
 *   "name": "10Y1!",
 *   "description": "10-Year Yield Futures",
 *   "exchange": "CBOT_MINI",
 *   "logoid": "indices/micro-10-year",
 *   "type": "futures",
 *   "currency": "USD",
 *   "price": 3.952,
 *   "change": -0.025297242600553757,
 *   "changeAbs": -0.0009999999999998899,
 *   "pricescale": 1000
 * }
 * ```
 */
export interface FuturesScreenerRow extends BaseScreenerRow {
  /** 价格精度 (用于格式化显示，如: 1000表示3位小数) */
  pricescale: number
}

/**
 * 期货筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 429,
 *   "data": [
 *     {
 *       "symbol": "CBOT_MINI:10Y1!",
 *       "name": "10Y1!",
 *       "description": "10-Year Yield Futures",
 *       "exchange": "CBOT_MINI",
 *       "logoid": "indices/micro-10-year",
 *       "type": "futures",
 *       "currency": "USD",
 *       "price": 3.952,
 *       "change": -0.0253,
 *       "changeAbs": -0.001,
 *       "pricescale": 1000
 *     }
 *   ]
 * }
 * ```
 */
export interface FuturesScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: FuturesScreenerRow[]
}

/**
 * ETF筛选器简化参数
 * 使用基础参数，无需额外扩展
 * 
 * @example
 * ```typescript
 * const params: ETFScreenerSimpleParams = {
 *   preset: 'etfs_market_page_largest',
 *   range: [0, 100],
 *   lang: 'en'
 * }
 * ```
 */
export interface ETFScreenerSimpleParams extends BaseScreenerParams {}

/**
 * ETF筛选器行数据
 * 继承基础字段，额外添加价格精度
 * 
 * @example
 * ```json
 * {
 *   "symbol": "NASDAQ:SPY",
 *   "name": "SPY",
 *   "description": "SPDR S&P 500 ETF Trust",
 *   "exchange": "NASDAQ",
 *   "logoid": "spdr-sp-500-etf",
 *   "type": "fund",
 *   "currency": "USD",
 *   "price": 478.65,
 *   "change": 0.1234,
 *   "changeAbs": 0.59,
 *   "pricescale": 100
 * }
 * ```
 */
export interface ETFScreenerRow extends BaseScreenerRow {
  /** 价格精度 (用于格式化显示，如: 100表示2位小数) */
  pricescale: number
}

/**
 * ETF筛选器响应数据
 * 行储存格式
 * 
 * @example
 * ```json
 * {
 *   "totalCount": 15432,
 *   "data": [
 *     {
 *       "symbol": "NASDAQ:SPY",
 *       "name": "SPY",
 *       "description": "SPDR S&P 500 ETF Trust",
 *       "exchange": "NASDAQ",
 *       "logoid": "spdr-sp-500-etf",
 *       "type": "fund",
 *       "currency": "USD",
 *       "price": 478.65,
 *       "change": 0.1234,
 *       "changeAbs": 0.59,
 *       "pricescale": 100
 *     }
 *   ]
 * }
 * ```
 */
export interface ETFScreenerData {
  /** 总数据条数 */
  totalCount: number
  
  /** 数据行数组（行储存格式） */
  data: ETFScreenerRow[]
}

