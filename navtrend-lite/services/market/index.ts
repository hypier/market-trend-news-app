/**
 * 市场数据服务统一导出
 */

// 导出 TradingView 服务
export * from './tradingView';

// 导出单例实例
export { default as searchService } from './searchService';
export { default as exchangeRateService } from './exchangeRateService';
export { default as technicalAnalysisService } from './technicalAnalysisService';
export { default as leaderboardService } from './leaderboardService';

// 导出类型（用于类型引用）
export { SearchService } from './searchService';
export { ExchangeRateService } from './exchangeRateService';
export { TechnicalAnalysisService } from './technicalAnalysisService';
export { LeaderboardService } from './leaderboardService';
export * from './logoService';

