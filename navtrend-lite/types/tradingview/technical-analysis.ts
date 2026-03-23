/**
 * TradingView 技术分析类型定义
 * Technical Analysis Type Definitions
 * 
 * @module tradingview/technical-analysis
 */

/**
 * 技术分析时间周期类型
 * 8个标准时间周期
 * 
 * @example
 * ```typescript
 * const timeframe: TATimeframe = '1D'
 * ```
 */
export type TATimeframe = '1' | '5' | '15' | '60' | '240' | '1D' | '1W' | '1M'

/**
 * 技术分析单个周期的建议
 * 包含振荡指标、综合指标和移动平均指标的建议值
 * 
 * @example
 * ```json
 * {
 *   "Other": 0.5,
 *   "All": 0.8,
 *   "MA": 0.6
 * }
 * ```
 */
export interface TAPeriodAdvice {
  /** 振荡指标建议 (-1: 卖出, 0: 中性, 1: 买入) */
  Other: number
  /** 综合指标建议 (-1: 卖出, 0: 中性, 1: 买入) */
  All: number
  /** 移动平均建议 (-1: 卖出, 0: 中性, 1: 买入) */
  MA: number
}

/**
 * 技术分析完整数据
 * 包含所有时间周期的技术分析建议
 * 
 * @example
 * ```typescript
 * const analysis: TechnicalAnalysisData = {
 *   '1': { Other: 0.5, All: 0.8, MA: 0.6 },
 *   '5': { Other: 0.3, All: 0.7, MA: 0.5 },
 *   // ... 其他周期
 * }
 * ```
 */
export interface TechnicalAnalysisData {
  /** 1分钟周期的技术指标 */
  '1': TAPeriodAdvice
  /** 5分钟周期的技术指标 */
  '5': TAPeriodAdvice
  /** 15分钟周期的技术指标 */
  '15': TAPeriodAdvice
  /** 1小时周期的技术指标 */
  '60': TAPeriodAdvice
  /** 4小时周期的技术指标 */
  '240': TAPeriodAdvice
  /** 1天周期的技术指标 */
  '1D': TAPeriodAdvice
  /** 1周周期的技术指标 */
  '1W': TAPeriodAdvice
  /** 1月周期的技术指标 */
  '1M': TAPeriodAdvice
}

/**
 * 详细技术指标数据
 * 包含50+个技术指标的详细值
 * 
 * @example
 * ```typescript
 * const indicators: DetailedTechnicalIndicators = {
 *   'Recommend.All': 0.5576,
 *   'Recommend.MA': 0.9333,
 *   'RSI': 55.47,
 *   'MACD.macd': -798.38,
 *   // ... 其他指标
 * }
 * ```
 */
export interface DetailedTechnicalIndicators {
  // === 综合建议 ===
  /** 综合建议评分 (-1 到 1) */
  'Recommend.All': number
  /** 移动平均建议评分 (-1 到 1) */
  'Recommend.MA': number
  /** 其他指标建议评分 (-1 到 1) */
  'Recommend.Other': number
  
  // === 趋势指标 ===
  /** ADX - 平均趋向指标 (0-100) */
  'ADX': number
  /** ADX+DI - 正向趋向指标 */
  'ADX+DI': number
  /** ADX+DI[1] - 前一期正向趋向指标 */
  'ADX+DI[1]': number
  /** ADX-DI - 负向趋向指标 */
  'ADX-DI': number
  /** ADX-DI[1] - 前一期负向趋向指标 */
  'ADX-DI[1]': number
  
  // === 振荡指标 ===
  /** RSI - 相对强弱指标 (0-100) */
  'RSI': number
  /** RSI[1] - 前一期RSI */
  'RSI[1]': number
  /** Stochastic K - 随机指标K线 */
  'Stoch.K': number
  /** Stochastic D - 随机指标D线 */
  'Stoch.D': number
  /** Stochastic K[1] - 前一期K线 */
  'Stoch.K[1]': number
  /** Stochastic D[1] - 前一期D线 */
  'Stoch.D[1]': number
  /** Stochastic RSI K */
  'Stoch.RSI.K': number
  /** CCI20 - 商品通道指数 */
  'CCI20': number
  /** CCI20[1] - 前一期CCI */
  'CCI20[1]': number
  /** Williams %R */
  'W.R': number
  /** UO - Ultimate Oscillator */
  'UO': number
  
  // === 动量指标 ===
  /** AO - Awesome Oscillator */
  'AO': number
  /** AO[1] - 前一期AO */
  'AO[1]': number
  /** AO[2] - 前两期AO */
  'AO[2]': number
  /** Mom - 动量指标 */
  'Mom': number
  /** Mom[1] - 前一期动量 */
  'Mom[1]': number
  /** MACD 快线 */
  'MACD.macd': number
  /** MACD 信号线 */
  'MACD.signal': number
  /** BBPower - 布林带能量 */
  'BBPower': number
  
  // === 移动平均线 ===
  /** 当前收盘价 */
  'close': number
  /** EMA 10日指数移动平均 */
  'EMA10': number
  /** SMA 10日简单移动平均 */
  'SMA10': number
  /** EMA 20日指数移动平均 */
  'EMA20': number
  /** SMA 20日简单移动平均 */
  'SMA20': number
  /** EMA 30日指数移动平均 */
  'EMA30': number
  /** SMA 30日简单移动平均 */
  'SMA30': number
  /** EMA 50日指数移动平均 */
  'EMA50': number
  /** SMA 50日简单移动平均 */
  'SMA50': number
  /** EMA 100日指数移动平均 */
  'EMA100': number
  /** SMA 100日简单移动平均 */
  'SMA100': number
  /** EMA 200日指数移动平均 */
  'EMA200': number
  /** SMA 200日简单移动平均 */
  'SMA200': number
  /** VWMA - 成交量加权移动平均 */
  'VWMA': number
  /** HullMA9 - Hull移动平均 */
  'HullMA9': number
  
  // === 一目均衡表 ===
  /** Ichimoku基准线 */
  'Ichimoku.BLine': number
  
  // === 枢轴点 - Classic ===
  /** Classic枢轴点R3阻力位 */
  'Pivot.M.Classic.R3': number
  /** Classic枢轴点R2阻力位 */
  'Pivot.M.Classic.R2': number
  /** Classic枢轴点R1阻力位 */
  'Pivot.M.Classic.R1': number
  /** Classic枢轴点中轴 */
  'Pivot.M.Classic.Middle': number
  /** Classic枢轴点S1支撑位 */
  'Pivot.M.Classic.S1': number
  /** Classic枢轴点S2支撑位 */
  'Pivot.M.Classic.S2': number
  /** Classic枢轴点S3支撑位 */
  'Pivot.M.Classic.S3': number
  
  // === 枢轴点 - Fibonacci ===
  /** Fibonacci枢轴点R3阻力位 */
  'Pivot.M.Fibonacci.R3': number
  /** Fibonacci枢轴点R2阻力位 */
  'Pivot.M.Fibonacci.R2': number
  /** Fibonacci枢轴点R1阻力位 */
  'Pivot.M.Fibonacci.R1': number
  /** Fibonacci枢轴点中轴 */
  'Pivot.M.Fibonacci.Middle': number
  /** Fibonacci枢轴点S1支撑位 */
  'Pivot.M.Fibonacci.S1': number
  /** Fibonacci枢轴点S2支撑位 */
  'Pivot.M.Fibonacci.S2': number
  /** Fibonacci枢轴点S3支撑位 */
  'Pivot.M.Fibonacci.S3': number
  
  // === 枢轴点 - Camarilla ===
  /** Camarilla枢轴点R3阻力位 */
  'Pivot.M.Camarilla.R3': number
  /** Camarilla枢轴点R2阻力位 */
  'Pivot.M.Camarilla.R2': number
  /** Camarilla枢轴点R1阻力位 */
  'Pivot.M.Camarilla.R1': number
  /** Camarilla枢轴点中轴 */
  'Pivot.M.Camarilla.Middle': number
  /** Camarilla枢轴点S1支撑位 */
  'Pivot.M.Camarilla.S1': number
  /** Camarilla枢轴点S2支撑位 */
  'Pivot.M.Camarilla.S2': number
  /** Camarilla枢轴点S3支撑位 */
  'Pivot.M.Camarilla.S3': number
  
  // === 枢轴点 - Woodie ===
  /** Woodie枢轴点R3阻力位 */
  'Pivot.M.Woodie.R3': number
  /** Woodie枢轴点R2阻力位 */
  'Pivot.M.Woodie.R2': number
  /** Woodie枢轴点R1阻力位 */
  'Pivot.M.Woodie.R1': number
  /** Woodie枢轴点中轴 */
  'Pivot.M.Woodie.Middle': number
  /** Woodie枢轴点S1支撑位 */
  'Pivot.M.Woodie.S1': number
  /** Woodie枢轴点S2支撑位 */
  'Pivot.M.Woodie.S2': number
  /** Woodie枢轴点S3支撑位 */
  'Pivot.M.Woodie.S3': number
  
  // === 枢轴点 - Demark ===
  /** Demark枢轴点R1阻力位 */
  'Pivot.M.Demark.R1': number
  /** Demark枢轴点中轴 */
  'Pivot.M.Demark.Middle': number
  /** Demark枢轴点S1支撑位 */
  'Pivot.M.Demark.S1': number
  
  // === 推荐信号 ===
  /** Stochastic RSI推荐信号 */
  'Rec.Stoch.RSI': number
  /** Williams %R推荐信号 */
  'Rec.WR': number
  /** BBPower推荐信号 */
  'Rec.BBPower': number
  /** UO推荐信号 */
  'Rec.UO': number
  /** Ichimoku推荐信号 */
  'Rec.Ichimoku': number
  /** VWMA推荐信号 */
  'Rec.VWMA': number
  /** HullMA9推荐信号 */
  'Rec.HullMA9': number
}

