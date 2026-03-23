/**
 * 统一导出所有类型定义
 * 提供项目中所有TypeScript类型的中央入口
 */

// 导出股票相关类型（排除有冲突的 EnhancedPosition 和 PriceAlert）
export {
  MarketIndex, TrendItem, StockQuote, GainData, PortfolioRealtimeData,
  StockDetail, CandleData, StockSearchResult,
  WatchlistItem, StockRanking, ChartPeriod, StockLogo,
  KLineIntervalType, ExchangeRateData
} from './stock';

// 导出新闻相关类型
export * from './news';

// 导出投资组合相关类型
export * from './portfolio';

// 导出用户相关类型
export * from './user';

// 导出资产分类相关类型
export * from './assetCategories';

// 导出 TradingView 相关类型
export * from './tradingview';

// 导出国际化相关类型
export * from '@/config/i18n';

// 导出更新相关类型
export * from './update';
