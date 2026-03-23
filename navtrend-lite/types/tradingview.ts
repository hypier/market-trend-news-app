/**
 * TradingView API 类型定义
 * 
 * 基于 TradingView API 响应格式
 * @see tradingview-api/public/trading.html
 */

/**
 * TradingView K线蜡烛图数据
 */
export interface TradingViewCandle {
  /** Unix 时间戳（秒） */
  time: number;
  /** 开盘价 */
  open: number;
  /** 收盘价 */
  close: number;
  /** 最高价（⚠️ TradingView 使用 'max' 而非 'high'） */
  max: number;
  /** 最低价（⚠️ TradingView 使用 'min' 而非 'low'） */
  min: number;
  /** 成交量 */
  volume: number;
}

/**
 * TradingView 股票详细信息
 */
export interface TradingViewStockInfo {
  /** 完整描述 */
  description?: string;
  /** 简短描述 */
  short_description?: string;
  /** 本地化描述 */
  local_description?: string;
  /** 交易所名称 */
  exchange?: string;
  /** 上市交易所 */
  listed_exchange?: string;
  /** 交易所显示名称 */
  exchange_listed_name?: string;
  /** 货币代码 */
  currency_code?: string;
  /** 国家代码 */
  country?: string;
  /** 股票类型（stock, crypto等） */
  type?: string;
  /** 类型规格（common, preferred等） */
  typespecs?: string[];
  /** 交易时段（如 "0930-1600"） */
  session?: string;
  /** 交易时段显示格式 */
  session_display?: string;
  /** 时区 */
  timezone?: string;
  /** ISIN代码 */
  isin?: string;
  /** 显示的ISIN */
  'isin-displayed'?: string;
  /** CUSIP代码 */
  cusip?: string;
  /** FIGI代码 */
  figi?: {
    'country-composite'?: string;
    'exchange-level'?: string;
  };
  /** 是否有日内数据 */
  has_intraday?: boolean;
  /** 是否有盘前盘后交易 */
  has_extended_hours?: boolean;
  /** 是否可交易 */
  is_tradable?: boolean;
  /** 是否支持重放 */
  is_replayable?: boolean;
  /** 子交易时段信息 */
  subsessions?: {
    id: string;
    description: string;
    session: string;
    'session-display': string;
    private: boolean;
  }[];
  /** 其他字段 */
  [key: string]: any;
}

/**
 * TradingView 历史数据响应
 */
export interface TradingViewHistoryResponse {
  success: boolean;
  /** K线数据数组（⚠️ 倒序排列，最新在前） */
  history: TradingViewCandle[];
  /** 当前最新K线 */
  current?: TradingViewCandle;
  /** 股票详细信息 */
  info?: TradingViewStockInfo;
  symbol?: string;
  timeframe?: string;
  range?: number;
}

/**
 * TradingView 实时报价数据（完整版）
 */
export interface TradingViewQuote {
  // === 基础价格数据 ===
  /** 股票代码（格式: EXCHANGE:SYMBOL） */
  symbol?: string;
  /** 最新价格 */
  lp: number;
  /** 价格变化 */
  ch: number;
  /** 价格变化百分比 */
  chp?: number;
  /** 相对价格变化 */
  rch?: number | null;
  /** 相对价格变化百分比 */
  rchp?: number | null;
  /** 成交量 */
  volume?: number;
  /** 开盘价 */
  open_price?: number;
  /** 最高价 */
  high_price?: number;
  /** 最低价 */
  low_price?: number;
  /** 昨收价 */
  prev_close_price?: number;
  /** 买价 */
  bid?: number;
  /** 卖价 */
  ask?: number;
  /** 最新价格时间戳 */
  lp_time?: number;
  /** 实时价格时间戳 */
  rtc_time?: number | null;
  /** 实时价格 */
  rtc?: number | null;
  
  // === 公司信息 ===
  /** 公司全名 */
  description?: string;
  /** 公司简称 */
  short_name?: string;
  /** 本地化描述 */
  local_description?: string;
  /** 原始名称 */
  original_name?: string;
  /** Pro名称 */
  pro_name?: string;
  /** Logo ID（用于获取 Logo，优先级最高） */
  logoid?: string;
  /** 基础货币 Logo ID（用于加密货币，如 crypto/XTVCBTC） */
  'base-currency-logoid'?: string;
  /** 货币 Logo ID（备用，如 country/US） */
  'currency-logoid'?: string;
  
  // === 市场信息 ===
  /** 交易所名称 */
  exchange?: string;
  /** 货币代码 */
  currency_code?: string;
  /** 国家代码 */
  country_code?: string;
  /** 时区 */
  timezone?: string;
  /** 语言 */
  language?: string;
  /** 股票类型 */
  type?: string;
  /** 行业 */
  sector?: string;
  /** 子行业 */
  industry?: string;
  
  // === 交易状态 ===
  /** 当前交易时段 */
  current_session?: string;
  /** 是否可交易 */
  is_tradable?: boolean;
  /** 更新模式 */
  update_mode?: string;
  
  // === 财务数据 ===
  /** 基础市值 */
  market_cap_basic?: number;
  /** 每股收益（TTM） */
  earnings_per_share_basic_ttm?: number;
  /** 基础每股收益（净利润） */
  basic_eps_net_income?: number;
  /** Beta系数（1年） */
  beta_1_year?: number;
  
  // === 技术字段 ===
  /** 价格精度 */
  pricescale?: number;
  /** 最小变动 */
  minmov?: number;
  /** 最小变动2 */
  minmove2?: number;
  /** 是否支持小数交易 */
  fractional?: boolean;
  /** 提供商ID */
  provider_id?: string;
}

/**
 * TradingView 报价响应
 */
export interface TradingViewQuoteResponse {
  success: boolean;
  data: TradingViewQuote;
}

/**
 * TradingView WebSocket 消息类型
 */
export type TradingViewWSMessageType =
  | 'connected'
  | 'history'
  | 'update'
  | 'quote_update'
  | 'error'
  | 'heartbeat';

/**
 * TradingView WebSocket 订阅请求
 */
export interface TradingViewWSSubscribeRequest {
  action: 'subscribe';
  id: string;
  symbol: string;
  timeframe: string;
  range: number;
  indicators?: string[];
}

/**
 * TradingView WebSocket 报价订阅请求
 */
export interface TradingViewWSQuoteSubscribeRequest {
  action: 'subscribe_quote';
  id: string;
  symbols: string[];
  fields: 'all' | string[];
}

/**
 * TradingView WebSocket 取消订阅请求
 */
export interface TradingViewWSUnsubscribeRequest {
  action: 'unsubscribe';
  id: string;
}

/**
 * TradingView WebSocket 历史数据消息
 */
export interface TradingViewWSHistoryMessage {
  type: 'history';
  periods: TradingViewCandle[];
  indicators?: Record<string, any>;
}

/**
 * TradingView WebSocket K线更新消息
 */
export interface TradingViewWSUpdateMessage {
  type: 'update';
  subscriptionId?: string;
  symbol?: string;
  data: TradingViewCandle; // 🔥 修复：实际 WebSocket 消息使用 data 字段
  info?: any;
  timestamp?: number;
  indicators?: Record<string, any>;
}

/**
 * TradingView WebSocket 报价更新消息
 */
export interface TradingViewWSQuoteUpdateMessage {
  type: 'quote_update';
  symbol: string;
  data: TradingViewQuote;
}

/**
 * TradingView WebSocket 错误消息
 */
export interface TradingViewWSErrorMessage {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * TradingView WebSocket 消息联合类型
 */
export type TradingViewWSMessage =
  | TradingViewWSHistoryMessage
  | TradingViewWSUpdateMessage
  | TradingViewWSQuoteUpdateMessage
  | TradingViewWSErrorMessage
  | { type: 'connected' }
  | { type: 'heartbeat' };

/**
 * 时间周期映射配置
 */
export interface TimeframeConfig {
  /** TradingView 时间单位 */
  timeframe: 'D' | 'W' | 'M' | string;
  /** 数据范围 */
  range: number;
}

/**
 * 应用内部周期类型
 */
export type AppPeriod = '1D' | '5D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '3Y';

/**
 * 批量报价单个结果
 */
export interface BatchQuoteResult {
  /** 是否成功获取 */
  success: boolean;
  /** TradingView 格式的 symbol */
  symbol: string;
  /** 报价数据（成功时存在） */
  data?: TradingViewQuote;
  /** 错误信息（失败时存在） */
  error?: string;
}

/**
 * 批量报价响应
 */
export interface BatchQuoteResponse {
  /** 整体请求是否成功 */
  success: boolean;
  /** 总请求数量 */
  total: number;
  /** 成功数量 */
  successful: number;
  /** 失败数量 */
  failed: number;
  /** 批量结果数组 */
  data: BatchQuoteResult[];
}

/**
 * TradingView 搜索结果项
 * 用于 TradingView Symbol Search API v3 的搜索结果
 */
export interface TVSearchResultItem {
  id: string;                       // 完整标识符，如 "NASDAQ:AAPL"
  exchange: string;                 // 交易所代码
  symbol: string;                   // 股票代码
  full_name: string;                // 完整名称
  description: string;              // 描述/公司名称
  type: string;                     // 类型：stock/fund/crypto 等
  currency_code: string;            // 货币代码
  provider_id: string;              // 数据提供商ID
  logoid?: string;                  // Logo ID（用于股票公司 Logo）
  'base-currency-logoid'?: string;  // 基础货币 Logo ID（用于加密货币，如 "crypto/XTVCBTC"）
  'currency-logoid'?: string;       // 货币/国家 Logo ID（如 "country/US"）
  source_logoid?: string;           // 交易所 Logo ID（如 "source/NASDAQ"）
  country?: string;                 // 国家代码
  source_id?: string;               // 来源ID
  cusip?: string;                   // CUSIP 代码
  isin?: string;                    // ISIN 代码
  typespecs?: string[];             // 类型规格（如 ["crypto", "common"]）
}

/**
 * 资产类型筛选器（TradingView API v3）
 * - stock: 股票
 * - funds: 基金（ETF等）
 * - futures: 期货
 * - forex: 外汇
 * - crypto: 加密货币
 * - index: 指数
 * - bond: 债券
 * - economic: 经济指标
 * - options: 期权
 * - undefined: 所有类型
 */
export type AssetTypeFilter = 'stock' | 'funds' | 'futures' | 'forex' | 'crypto' | 'index' | 'bond' | 'economic' | 'options' | 'undefined';

/**
 * 技术分析相关类型
 * 从本地类型目录导入
 */
export type { 
  TechnicalAnalysisData,
  DetailedTechnicalIndicators,
  TAPeriodAdvice,
  TATimeframe
} from './tradingview/technical-analysis';
