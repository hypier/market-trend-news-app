/**
 * TradingView API 配置
 * 集中管理所有 TradingView 相关的配置项
 */

// ========== TradingView HTTP API 配置 ==========

export const TRADINGVIEW_HTTP_CONFIG = {
  timeout: 10000, // 10秒超时
  provider: 'backend-proxy',
} as const;

// ========== TradingView WebSocket 配置 ==========

export const TRADINGVIEW_WS_CONFIG = {
  // WebSocket URL 和 Token 现在通过动态 token 服务从后端获取
  // 不再需要在前端配置中硬编码
  reconnectInterval: 3000,        // 初始3秒后重连
  maxReconnectInterval: 30000,    // 最长30秒
  reconnectDecay: 1.5,            // 指数增长因子
  heartbeatInterval: 30000,       // 30秒心跳
  maxReconnectAttempts: Infinity, // 无限重连
} as const;

// ========== TradingView 外汇报价配置 ==========

export const TRADINGVIEW_FX_CONFIG = {
  timeout: 10000, // 10秒超时
  cacheTTL: 60 * 2 * 1000, // 2分钟缓存
  session: 'regular',       // 默认交易时段
  fields: 'price',          // 默认请求字段
} as const;

// ========== TradingView 工具函数 ==========

/**
 * 构建 TradingView 外汇符号
 * 格式: fx_idc:{from}{to} (小写)
 * 
 * @param fromCurrency 源货币代码
 * @param toCurrency 目标货币代码
 * @returns TradingView 外汇符号
 * 
 * @example
 * buildFxSymbol('CNY', 'USD') // 返回: 'fx_idc:cnyusd'
 * buildFxSymbol('USD', 'JPY') // 返回: 'fx_idc:usdjpy'
 */
export function buildFxSymbol(fromCurrency: string, toCurrency: string): string {
  return `fx_idc:${fromCurrency.toLowerCase()}${toCurrency.toLowerCase()}`;
}

/**
 * 将数据库格式转换为 TradingView 格式
 * 
 * @param symbol 股票代码 (如 AAPL)
 * @param exchange 交易所 (如 NASDAQ)
 * @returns TradingView 格式 (如 NASDAQ:AAPL)
 * 
 * @example
 * formatToTradingViewSymbol('AAPL', 'NASDAQ') // 返回: 'NASDAQ:AAPL'
 */
export function formatToTradingViewSymbol(symbol: string, exchange: string): string {
  if (!symbol || !exchange) {
    throw new Error('symbol 和 exchange 都是必需的');
  }
  return `${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
}

/**
 * 批量转换数据库格式为 TradingView 格式
 * 
 * @param items 包含 symbol 和 exchange 的对象数组
 * @returns TradingView 格式的 symbols 数组
 * 
 * @example
 * const items = [
 *   { symbol: 'AAPL', exchange: 'NASDAQ' },
 *   { symbol: 'GOOGL', exchange: 'NASDAQ' }
 * ];
 * formatBatchToTradingViewSymbols(items);
 * // 返回: ['NASDAQ:AAPL', 'NASDAQ:GOOGL']
 */
export function formatBatchToTradingViewSymbols(
  items: { symbol: string; exchange: string | null | undefined }[]
): string[] {
  return items
    .filter(item => item.symbol && item.exchange)
    .map(item => formatToTradingViewSymbol(item.symbol, item.exchange!));
}

// ========== TradingView 响应类型 ==========

/**
 * TradingView 外汇报价响应格式
 */
export interface TradingViewFxResponse {
  success: boolean;
  data?: {
    lp: number; // 最新价格
  };
  message?: string;
  error?: string;
}

/**
 * TradingView 批量报价响应格式
 */
export interface TradingViewBatchFxResponse {
  success: boolean;
  data?: {
    symbol: string;
    success: boolean;
    data?: { lp: number };
    error?: string;
  }[];
  message?: string;
}

/**
 * TradingView 通用响应格式
 */
export interface TradingViewResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 验证 TradingView 配置是否完整
 */
export function validateTradingViewConfig(): boolean {
  return !!(
    TRADINGVIEW_HTTP_CONFIG.timeout > 0 &&
    TRADINGVIEW_WS_CONFIG.reconnectInterval > 0
  );
}

/**
 * 获取 TradingView 完整配置信息
 */
export function getTradingViewConfigInfo() {
  return {
    http: TRADINGVIEW_HTTP_CONFIG,
    ws: TRADINGVIEW_WS_CONFIG,
    fx: TRADINGVIEW_FX_CONFIG,
    isConfigured: validateTradingViewConfig(),
  };
}

