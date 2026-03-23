/**
 * 核心基础设施服务统一导出
 */

// API Client - 自有API专用（包含认证、签名等业务逻辑）
export { default as apiClient } from './api';
export { ApiClient } from './api';
export type { RequestOptions, ApiResponse, HttpMethod } from './api';
export { ApiError, API_CONFIG } from './api';

// HTTP Client - 通用HTTP工具（纯粹的HTTP请求能力）
export { HttpClient, createHttpClient } from './httpClient';
export type { HttpRequestOptions, HttpClientConfig } from './httpClient';

// TradingView Configuration - TradingView API 配置
export {
  TRADINGVIEW_HTTP_CONFIG,
  TRADINGVIEW_WS_CONFIG,
  TRADINGVIEW_FX_CONFIG,
  buildFxSymbol,
  formatToTradingViewSymbol,
  formatBatchToTradingViewSymbols,
  validateTradingViewConfig,
  getTradingViewConfigInfo,
} from './tradingview.config';
export type {
  TradingViewFxResponse,
  TradingViewBatchFxResponse,
  TradingViewResponse,
} from './tradingview.config';

