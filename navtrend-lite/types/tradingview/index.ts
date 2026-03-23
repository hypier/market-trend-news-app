/**
 * TradingView API 类型定义
 * 统一导出所有 TradingView 相关类型
 * 
 * @module tradingview
 * @packageDocumentation
 */

// 技术分析类型
export type { 
  TATimeframe, 
  TAPeriodAdvice, 
  TechnicalAnalysisData,
  DetailedTechnicalIndicators 
} from './technical-analysis'

// 搜索相关类型
export type {
  MarketSearchResult,
  MarketSearchOptions,
  IndicatorSearchResult,
  IndicatorInput,
  IndicatorDetails,
} from './search'

// 新闻相关类型
export type {
  NewsSymbol,
  NewsProvider,
  NewsTagArg,
  NewsTag,
  NewsItem,
  ASTNode,
  ASTDescription,
  Distributor,
  NewsDetail,
  StreamingConfig,
  PaginationConfig,
  NewsListResponse,
  NewsParams,
} from './news'

// 筛选器相关类型
export type {
  ScreenerRow,
  ScreenerData,
  ScreenerSort,
  ScreenerParams,
  StockScreenerParams,
  ScreenerPreset,
  StockMarket,
  ScreenerColumn,
  BaseScreenerParams,        // 基础筛选器参数（指数、股票、加密货币、外汇共用）
  BaseScreenerRow,           // 基础筛选器行数据（指数、股票、加密货币、外汇共用）
  IndicesScreenerParams,
  IndicesScreenerRow,
  IndicesScreenerData,
  StockScreenerSimpleParams,
  StockScreenerRow,
  StockScreenerData,
  CryptoScreenerSimpleParams,
  CryptoScreenerRow,
  CryptoScreenerData,
  ForexScreenerSimpleParams,
  ForexScreenerRow, 
  ForexScreenerData,
  
  // Futures screener types - 期货筛选器类型 (使用 BaseScreenerParams 和 BaseScreenerRow)
  FuturesScreenerSimpleParams,
  FuturesScreenerRow,
  FuturesScreenerData,
  
  // ETF screener types - ETF筛选器类型 (使用 BaseScreenerParams 和 BaseScreenerRow)
  ETFScreenerSimpleParams,
  ETFScreenerRow,
  ETFScreenerData,
} from './screener'

// 排行榜类型已迁移到 @/types/leaderboard.ts

