/**
 * TradingView API 数据适配器
 * 
 * 负责在 TradingView API 格式和应用内部格式之间进行转换
 */

import type {
  TradingViewQuote,
  TradingViewCandle,
  TradingViewHistoryResponse,
  AppPeriod,
  TimeframeConfig,
} from '@/types/tradingview';

/**
 * 周期映射配置表
 * 将应用内部周期映射到 TradingView API 参数
 */
export const PERIOD_CONFIG: Record<AppPeriod, TimeframeConfig> = {
  '1D': { timeframe: 'D', range: 1 },
  '5D': { timeframe: 'D', range: 5 },
  '1W': { timeframe: 'D', range: 7 },
  '1M': { timeframe: 'D', range: 30 },
  '3M': { timeframe: 'D', range: 90 },
  '6M': { timeframe: 'D', range: 180 },
  '1Y': { timeframe: 'W', range: 52 },
  '3Y': { timeframe: 'W', range: 156 },  // 3年 = 156根周K线（52*3）
};

/**
 * 前端图表组件使用的周期格式映射
 * 支持 trading.html 风格的周期格式
 * 
 * 设计原则：
 * 1. 美股交易时间：6.5小时（9:30-16:00，共390分钟）
 * 2. **K线密度优化**：保持每个周期 50-150 根K线，确保视觉丰富度
 * 3. 时间颗粒度：短期用分钟K线，中期用小时K线，长期用日/周K线
 * 
 * K线密度说明：
 * - 1h: 60根1分钟K线（合理）
 * - 3h: 36根5分钟K线（合理）
 * - 1day: 78根5分钟K线（合理）
 * - 1week: 84根2小时K线（优化前：7根日K线 → 密度增加12倍）
 * - 1month: 90根4小时K线（优化前：30根日K线 → 密度增加3倍）
 * - 6month: 120根日K线（优化前：180根 → 减少过密）
 * - 1year: 120根日K线（优化前：52根周K线 → 细节增加2.3倍）
 */
const FRONTEND_PERIOD_MAP: Record<string, TimeframeConfig> = {
  // 小时级别 - 使用1分钟/5分钟K线提供更多细节
  '1h': { timeframe: '1', range: 60 },      // 1小时 = 60根1分钟K线（60分钟）✅
  '3h': { timeframe: '5', range: 36 },      // 3小时 = 36根5分钟K线（180分钟/5）✅
  
  // 日线级别 - 使用5分钟K线覆盖完整交易日
  '1day': { timeframe: '5', range: 78 },    // 1天 = 78根5分钟K线（390分钟/5）✅
  
  // 周线级别 - 使用2小时K线（密度优化：7根 → 84根）
  '1week': { timeframe: '120', range: 84 }, // 1周 = 84根2小时K线（7天×24小时/2）✅
  
  // 月线级别 - 使用4小时K线（密度优化：30根 → 90根）
  '1month': { timeframe: '240', range: 90 },// 1月 = 90根4小时K线（30天×6根/天）✅
  
  // 季度级别 - 使用日K线
  '3month': { timeframe: 'D', range: 90 },  // 3月 = 90根日K线 ✅
  
  // 半年级别 - 使用日K线
  '6month': { timeframe: 'D', range: 120 }, // 6月 = 120根日K线（约180天，采样优化）✅
  
  // 年线级别 - 使用周K线（更适合长周期）
  '1year': { timeframe: 'W', range: 52 },   // 1年 = 52根周K线（52周 = 1年）✅
  
  // 多年级别 - 使用周K线
  '3year': { timeframe: 'W', range: 156 },  // 3年 = 156根周K线（52×3）✅
  
  // 分钟级别（保留用于其他功能）
  '1min': { timeframe: '1', range: 100 },
  '5min': { timeframe: '5', range: 100 },
  '15min': { timeframe: '15', range: 100 },
  '30min': { timeframe: '30', range: 100 },
  '2h': { timeframe: '120', range: 100 },
  '4h': { timeframe: '240', range: 100 },
};

/**
 * 转换应用周期到 TradingView 时间周期
 * 
 * 支持两种格式：
 * 1. 应用内部格式：'1D', '5D', '1M', '3M', '6M', '1Y', '3Y'
 * 2. 前端图表格式：'1min', '5min', '15min', '1h', '1day', '1week', '1month', '3year'
 * 
 * @param period 周期字符串
 * @returns TradingView 时间周期配置
 * 
 * @example
 * convertPeriod('1M') // { timeframe: 'D', range: 30 }
 * convertPeriod('5min') // { timeframe: '5', range: 100 }
 * convertPeriod('3year') // { timeframe: 'W', range: 156 }
 */
export function convertPeriod(period: string): TimeframeConfig {
  // 优先检查前端格式
  if (FRONTEND_PERIOD_MAP[period]) {
    return FRONTEND_PERIOD_MAP[period];
  }
  
  // 回退到应用内部格式
  return PERIOD_CONFIG[period as AppPeriod] || { timeframe: 'D', range: 30 };
}

/**
 * 转换 Symbol 为 TradingView 格式
 * 
 * @param symbol 股票代码
 * @param exchange 交易所代码（可选）
 * @returns TradingView 格式的 Symbol（如 'NASDAQ:AAPL'）
 * 
 * @example
 * toTradingViewSymbol('AAPL', 'NASDAQ') // 'NASDAQ:AAPL'
 * toTradingViewSymbol('0700', 'HKEX')   // 'HKEX:0700'
 * toTradingViewSymbol('NASDAQ:AAPL')    // 'NASDAQ:AAPL'（已包含交易所）
 */
export function toTradingViewSymbol(symbol: string, exchange?: string): string {
  // 如果已经包含交易所（格式: EXCHANGE:SYMBOL），直接返回
  if (symbol.includes(':')) {
    return symbol.toUpperCase();
  }
  
  // 处理 exchange 为空或 'undefined' 字符串的情况
  if (!exchange || exchange === 'undefined') {
    console.warn('[TradingView] Missing exchange for symbol:', symbol);
    return symbol;
  }
  
  return `${exchange.toUpperCase()}:${symbol.toUpperCase()}`;
}

/**
 * 从 TradingView Symbol 解析交易所和代码
 * 
 * @param tvSymbol TradingView 格式的 Symbol
 * @returns 解析后的交易所和代码
 * 
 * @example
 * fromTradingViewSymbol('NASDAQ:AAPL') // { exchange: 'NASDAQ', symbol: 'AAPL' }
 * fromTradingViewSymbol('AAPL')        // { symbol: 'AAPL' }
 */
export function fromTradingViewSymbol(tvSymbol: string): {
  symbol: string;
  exchange?: string;
} {
  const parts = tvSymbol.split(':');
  if (parts.length === 2) {
    return { exchange: parts[0], symbol: parts[1] };
  }
  return { symbol: tvSymbol };
}

/**
 * 计算涨跌幅（辅助函数）
 * 处理 TradingView 多种可能的字段格式
 */
export function calculateChangePercent(tvQuote: TradingViewQuote): number {
  if (tvQuote.chp !== undefined && tvQuote.chp !== null) return tvQuote.chp;
  if (tvQuote.rchp !== undefined && tvQuote.rchp !== null) return tvQuote.rchp;
  if (tvQuote.ch !== undefined && tvQuote.lp) {
    return (tvQuote.ch / (tvQuote.lp - tvQuote.ch)) * 100;
  }
  if (tvQuote.prev_close_price && tvQuote.lp) {
    return ((tvQuote.lp - tvQuote.prev_close_price) / tvQuote.prev_close_price) * 100;
  }
  return 0;
}

/**
 * 计算买卖价差百分比（辅助函数）
 */
export function calculateSpreadPercent(bid?: number, ask?: number, price?: number): number {
  if (!bid || !ask || !price) return 0;
  return ((ask - bid) / price) * 100;
}

/**
 * 转换 TradingView K线数据为应用格式
 * 
 * ⚠️ 重要：TradingView 返回的数据是倒序的（最新在前），需要反转
 * 
 * @param tvHistory TradingView 历史数据响应
 * @returns 应用内部图表数据格式
 */
export function convertHistoryData(tvHistory: TradingViewHistoryResponse): {
  trendData: number[];
  highPrice: number;
  lowPrice: number;
  candles: TradingViewCandle[];
} {
  if (!tvHistory?.history || tvHistory.history.length === 0) {
    console.warn('[TradingView] Empty history data');
    return { trendData: [], highPrice: 0, lowPrice: 0, candles: [] };
  }

  // ⚠️ TradingView 返回倒序数据（最新在前），反转为正序（最旧在前）
  const candles = tvHistory.history.slice().reverse();

  // 提取收盘价数组（用于图表）
  const trendData = candles.map((candle) => candle.close);

  // 计算价格范围（使用 max/min 字段）
  const highPrice = Math.max(...candles.map((c) => c.max));
  const lowPrice = Math.min(...candles.map((c) => c.min));

  return { trendData, highPrice, lowPrice, candles };
}

/**
 * 判断是否为新K线还是更新最后一根K线
 * 
 * @param existingCandles 现有K线数据
 * @param newCandle 新K线数据
 * @returns true 表示新增K线，false 表示更新最后一根
 */
export function isNewCandle(
  existingCandles: TradingViewCandle[],
  newCandle: TradingViewCandle
): boolean {
  if (existingCandles.length === 0) return true;
  
  const lastCandle = existingCandles[existingCandles.length - 1];
  // 如果时间戳不同，表示是新K线
  return newCandle.time !== lastCandle.time;
}

/**
 * 格式化 TradingView 时间戳为可读日期
 * 
 * @param timestamp Unix 时间戳（秒）
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export function formatTradingViewTime(
  timestamp: number,
  format: 'date' | 'datetime' | 'time' = 'datetime'
): string {
  const date = new Date(timestamp * 1000);
  
  switch (format) {
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'datetime':
    default:
      return date.toLocaleString();
  }
}

/**
 * 验证 TradingView Symbol 格式
 * 
 * @param symbol Symbol 字符串
 * @returns 是否为有效格式
 * 
 * @example
 * validateSymbol('NASDAQ:AAPL') // true
 * validateSymbol('AAPL')         // true
 * validateSymbol('NASDAQ:')      // false
 */
export function validateSymbol(symbol: string): boolean {
  if (!symbol || symbol.trim().length === 0) return false;
  
  // 如果包含 ':'，必须是 'EXCHANGE:SYMBOL' 格式
  if (symbol.includes(':')) {
    const parts = symbol.split(':');
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  }
  
  // 单独的 symbol 也是有效的
  return true;
}

/**
 * 根据 timeframe 计算自动刷新间隔（毫秒）
 * 
 * 刷新策略：
 * - 分钟K线：刷新间隔 = K线时长（确保及时新增蜡烛）
 * - 日K线：每小时刷新一次（交易时段内持续更新）
 * - 周K线：不自动刷新（变化慢，依赖手动刷新）
 * 
 * @param timeframe K线周期（1, 5, 15, 30, 60, D, W 等）
 * @returns 刷新间隔（毫秒），返回 0 表示不自动刷新
 * 
 * @example
 * getRefreshInterval('5')  // 300000 (5分钟)
 * getRefreshInterval('D')  // 3600000 (1小时)
 * getRefreshInterval('W')  // 0 (不自动刷新)
 */
export function getRefreshInterval(timeframe: string): number {
  switch (timeframe) {
    case '1':   return 1 * 60 * 1000;    // 1分钟K线 → 每1分钟刷新
    case '5':   return 5 * 60 * 1000;    // 5分钟K线 → 每5分钟刷新
    case '15':  return 15 * 60 * 1000;   // 15分钟K线 → 每15分钟刷新
    case '30':  return 30 * 60 * 1000;   // 30分钟K线 → 每30分钟刷新
    case '60':  return 60 * 60 * 1000;   // 1小时K线 → 每1小时刷新
    case '120': return 2 * 60 * 60 * 1000; // 2小时K线 → 每2小时刷新
    case '240': return 4 * 60 * 60 * 1000; // 4小时K线 → 每4小时刷新
    case 'D':   return 60 * 60 * 1000;   // 日K线 → 每1小时刷新（交易时段）
    case 'W':   return 0;                // 周K线 → 不自动刷新
    case 'M':   return 0;                // 月K线 → 不自动刷新
    default:    return 5 * 60 * 1000;    // 默认5分钟
  }
}

/**
 * 根据前端周期获取自动刷新间隔
 * 
 * @param period 前端周期格式（'3h', '1day', '1week' 等）
 * @returns 刷新间隔（毫秒），返回 0 表示不自动刷新
 * 
 * @example
 * getRefreshIntervalForPeriod('3h')     // 300000 (5分钟)
 * getRefreshIntervalForPeriod('1day')   // 300000 (5分钟)
 * getRefreshIntervalForPeriod('1week')  // 3600000 (1小时)
 * getRefreshIntervalForPeriod('1year')  // 0 (不自动刷新)
 */
export function getRefreshIntervalForPeriod(period: string): number {
  const config = FRONTEND_PERIOD_MAP[period];
  if (!config) {
    return 0; // 未知周期，不自动刷新
  }
  
  return getRefreshInterval(config.timeframe);
}

/**
 * Timeframe 到秒数的映射
 * 用于判断实时数据是否应追加新K线
 * 
 * 映射说明：
 * - '1', '3', '5', '15', '30', '45', '60', '120', '180', '240': 分钟/小时级K线
 * - 'D', '1D': 日K线（86400秒 = 24小时）
 * - 'W', '1W': 周K线（604800秒 = 7天）
 * - 'M', '1M': 月K线（2592000秒 = 30天）
 * 
 * 来源: TradingView API 完整支持的 timeframe 类型
 * 参考: tradingview-api/src/types.js
 */
export const timeframeToSeconds: Record<string, number> = {
  '1': 60,          // 1分钟
  '3': 180,         // 3分钟
  '5': 300,         // 5分钟
  '15': 900,        // 15分钟
  '30': 1800,       // 30分钟
  '45': 2700,       // 45分钟
  '60': 3600,       // 1小时
  '120': 7200,      // 2小时
  '180': 10800,     // 3小时
  '240': 14400,     // 4小时
  'D': 86400,       // 1天（24小时）
  '1D': 86400,      // 1天（别名）
  'W': 604800,      // 1周（7天）
  '1W': 604800,     // 1周（别名）
  'M': 2592000,     // 1月（约30天）
  '1M': 2592000,    // 1月（别名）
};

/**
 * 验证时间戳有效性
 * 
 * 检查时间戳是否在合理范围内（2000-01-01 到 当前时间+1天）
 * 
 * @param timestamp Unix时间戳（秒）
 * @returns true 表示有效，false 表示无效
 * 
 * @example
 * validateTimestamp(1609459200) // true (2021-01-01)
 * validateTimestamp(946684800)  // true (2000-01-01)
 * validateTimestamp(100000)     // false (1970-01-02, 太早)
 * validateTimestamp(9999999999) // false (2286-11-20, 太晚)
 */
export function validateTimestamp(timestamp: number): boolean {
  // 检查是否为数字
  if (typeof timestamp !== 'number' || isNaN(timestamp) || !isFinite(timestamp)) {
    return false;
  }
  
  // 最小时间戳：2000-01-01 00:00:00 UTC
  const minTimestamp = 946684800;
  // 最大时间戳：当前时间 + 1天
  const maxTimestamp = Math.floor(Date.now() / 1000) + 86400;
  
  return timestamp >= minTimestamp && timestamp <= maxTimestamp;
}

/**
 * 判断是否应追加新K线
 * 
 * 根据timeframe的时间间隔，判断当前价格更新是否应该追加为新K线，
 * 还是只更新最后一根K线的收盘价。
 * 
 * 判断逻辑：
 * - 如果 (currentTime - lastCandleTime) >= timeframe间隔，追加新K线
 * - 否则，只更新最后一根K线的收盘价
 * 
 * @param lastCandleTime 最后一根K线的时间戳（秒）
 * @param currentTime 当前价格的时间戳（秒）
 * @param timeframe K线周期（'5', '120', 'D', 'W' 等）
 * @returns true 表示应追加新K线，false 表示应更新最后一根
 * 
 * @example
 * // 5分钟K线，最后一根是 10:00，当前是 10:04
 * shouldAppendNewCandle(
 *   1700000000, 
 *   1700000240,  // 差值 240秒 < 300秒
 *   '5'
 * ) // false - 不追加，只更新
 * 
 * // 5分钟K线，最后一根是 10:00，当前是 10:05
 * shouldAppendNewCandle(
 *   1700000000, 
 *   1700000300,  // 差值 300秒 >= 300秒
 *   '5'
 * ) // true - 追加新K线
 * 
 * // 日K线，最后一根是昨天，当前是今天
 * shouldAppendNewCandle(
 *   1700000000, 
 *   1700086400,  // 差值 86400秒 >= 86400秒
 *   'D'
 * ) // true - 追加新K线
 */
export function shouldAppendNewCandle(
  lastCandleTime: number,
  currentTime: number,
  timeframe: string
): boolean {
  // 获取timeframe对应的秒数间隔，默认5分钟
  const intervalSeconds = timeframeToSeconds[timeframe] || 300;
  
  // 计算时间差
  const timeDiff = currentTime - lastCandleTime;
  
  // 如果时间差 >= 间隔，应该追加新K线
  return timeDiff >= intervalSeconds;
}

