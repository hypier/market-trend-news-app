/**
 * 用户数据服务统一导出
 */

// 导出单例实例
export { default as portfolioService } from './portfolioService';
export { default as watchlistService } from './watchlistService';

// 导出类型（用于类型引用）
export { PortfolioService } from './portfolioService';
export { WatchlistService } from './watchlistService';

