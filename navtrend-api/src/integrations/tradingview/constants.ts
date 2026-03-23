/**
 * TradingView RapidAPI 常量定义
 *
 * @module integrations/tradingview/constants
 */

/**
 * RapidAPI 基础 URL
 */
export const RAPIDAPI_BASE_URL = 'https://tradingview-data1.p.rapidapi.com'

/**
 * RapidAPI 端点路径
 */
export const RAPIDAPI_ENDPOINTS = {
  // 技术分析
  technicalAnalysis: (symbol: string) => `/api/ta/${encodeURIComponent(symbol)}`,
  technicalIndicators: (symbol: string) => `/api/ta/${encodeURIComponent(symbol)}/indicators`,

  // 市场搜索
  marketSearch: (query: string) => `/api/search/market/${encodeURIComponent(query)}`,

  // 新闻
  news: (category: string) => `/api/news/${category}`,
  newsDetail: (newsId: string) => `/api/news/${encodeURIComponent(newsId)}`,

  // 排行榜
  leaderboard: (configId: string) => `/api/leaderboard/data?id=${encodeURIComponent(configId)}`,

  // 报价
  quoteBatch: () => '/api/quote/batch',

  // 历史价格
  priceHistory: (symbol: string) => `/api/price/${encodeURIComponent(symbol)}`,

  // 元数据
  metadataTabs: () => '/api/metadata/tabs',

  // WebSocket Token
  tokenGenerate: () => '/api/token/generate',
} as const

