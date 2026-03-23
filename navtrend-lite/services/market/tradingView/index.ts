/**
 * TradingView 服务统一导出
 */

// 导出单例实例
export { default as tradingViewService } from './tradingViewService';
export { default as tradingViewWS } from './tradingViewWebSocket';

// 导出类型（用于类型引用）
export { TradingViewService } from './tradingViewService';
export { TradingViewWebSocket } from './tradingViewWebSocket';

