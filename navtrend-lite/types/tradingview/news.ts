/**
 * TradingView 新闻类型定义
 * News Type Definitions
 * 
 * @module tradingview/news
 */

/**
 * 新闻关联股票信息
 * 
 * @example
 * ```json
 * {
 *   "symbol": "NASDAQ:AAPL",
 *   "logoid": "apple"
 * }
 * ```
 */
export interface NewsSymbol {
  /** 股票代码 (格式: EXCHANGE:SYMBOL) */
  symbol: string
  /** Logo ID */
  logoid?: string
  /** Logo URL */
  logo_url?: string
  /** 基础货币 Logo ID */
  'base-currency-logoid'?: string
  /** 货币 Logo ID */
  'currency-logoid'?: string
  /** 情绪分数 (-1: 负面, 0: 中性, 1: 正面) */
  sentiment?: number
}

/**
 * 新闻提供商信息
 * 
 * @example
 * ```json
 * {
 *   "id": "reuters",
 *   "name": "Reuters",
 *   "logo_id": "reuters",
 *   "url": "https://www.reuters.com"
 * }
 * ```
 */
export interface NewsProvider {
  /** 提供商ID */
  id: string
  /** 提供商名称 */
  name: string
  /** Logo ID */
  logo_id?: string
  /** Logo URL */
  logo_url?: string
  /** 提供商网址 */
  url?: string
}

/**
 * 新闻标签参数
 */
export interface NewsTagArg {
  /** 参数ID */
  id: string
  /** 参数值 */
  value: string
}

/**
 * 新闻标签
 * 
 * @example
 * ```json
 * {
 *   "title": "Company",
 *   "args": [{ "id": "symbol", "value": "AAPL" }]
 * }
 * ```
 */
export interface NewsTag {
  /** 标签标题 */
  title: string
  /** 标签参数 */
  args?: NewsTagArg[]
}

/**
 * 新闻列表项
 * 
 * @example
 * ```json
 * {
 *   "id": "tag:reuters.com,2025-10-21:newsml_ACSWmhTta:0",
 *   "title": "Apple Reports Q3 Earnings",
 *   "published": 1761089100,
 *   "urgency": 2,
 *   "permission": "preview",
 *   "relatedSymbols": [{ "symbol": "NASDAQ:AAPL", "logoid": "apple" }],
 *   "storyPath": "/news/...",
 *   "provider": { "id": "reuters", "name": "Reuters" }
 * }
 * ```
 */
export interface NewsItem {
  /** 新闻ID */
  id: string
  /** 标题 */
  title: string
  /** 发布时间 (Unix时间戳，秒) */
  published: number
  /** 紧急程度 (1-3, 数字越大越紧急) */
  urgency: number
  /** 权限类型 (preview, provider, full) */
  permission: string
  /** 关联股票列表 */
  relatedSymbols?: NewsSymbol[]
  /** 外部新闻链接 */
  link?: string
  /** TradingView新闻路径 */
  storyPath?: string
  /** 新闻提供商 */
  provider: NewsProvider
  /** 是否为快讯 */
  is_flash?: boolean
}

/**
 * AST节点类型
 * 用于描述富文本内容结构
 */
export interface ASTNode {
  /** 节点类型 */
  type: string
  /** 子节点 */
  children?: ASTNode[]
  /** 文本内容 (text节点) */
  text?: string
  /** 其他属性 */
  [key: string]: unknown
}

/**
 * AST描述对象
 */
export interface ASTDescription {
  /** 类型 */
  type: string
  /** 子节点列表 */
  children: ASTNode[]
}

/**
 * 分销商信息
 */
export interface Distributor {
  /** 分销商ID */
  id: string
  /** 分销商名称 */
  name: string
  /** Logo ID */
  logo_id?: string
}

/**
 * 新闻详情
 * 包含完整的新闻内容
 * 
 * @example
 * ```typescript
 * const newsDetail: NewsDetail = {
 *   id: 'tag:reuters.com,2025-10-21:newsml_ACSWmhTta:0',
 *   title: 'Apple Reports Q3 Earnings',
 *   published: 1761089100,
 *   shortDescription: 'Apple Inc. reported...',
 *   astDescription: { type: 'doc', children: [...] },
 *   language: 'en',
 *   tags: [{ title: 'Company', args: [...] }],
 *   copyright: '© 2025 Reuters'
 * }
 * ```
 */
export interface NewsDetail extends NewsItem {
  /** 简短描述 */
  shortDescription?: string
  /** AST格式的详细描述 */
  astDescription?: ASTDescription
  /** 语言代码 (en, zh, etc.) */
  language?: string
  /** 分销商信息 */
  distributor?: Distributor
  /** 新闻标签 */
  tags?: NewsTag[]
  /** 版权信息 */
  copyright?: string
}

/**
 * 流式更新配置
 */
export interface StreamingConfig {
  /** 流式更新通道ID */
  channel: string
}

/**
 * 分页配置
 */
export interface PaginationConfig {
  /** 下一页游标 */
  cursor?: string
}

/**
 * 新闻列表响应
 * 
 * @example
 * ```json
 * {
 *   "items": [...],
 *   "streaming": { "channel": "..." },
 *   "pagination": { "cursor": "..." }
 * }
 * ```
 */
export interface NewsListResponse {
  /** 新闻列表 */
  items: NewsItem[]
  /** 流式更新配置 */
  streaming?: StreamingConfig
  /** 分页配置 */
  pagination?: PaginationConfig
}

/**
 * 新闻请求参数
 * 
 * @example
 * ```typescript
 * const params: NewsParams = {
 *   filters: ['lang:zh-Hans', 'symbol:NASDAQ:AAPL']
 * }
 * ```
 */
export interface NewsParams {
  /** 过滤器数组 (如: ["lang:zh-Hans", "symbol:NASDAQ:AAPL"]) */
  filters?: string[]
}

