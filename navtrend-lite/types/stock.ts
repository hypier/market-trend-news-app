// 从markets组件导入类型
import { MarketIndex, TrendItem } from '../components/markets/types';
// 导入投资组合类型
import type { PortfolioStats, Position } from './portfolio';

// 重新导出
export { MarketIndex, TrendItem };

// 股票实时报价类型（与后端API保持一致）
export interface StockQuote {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose: number;
  change: number;
  changePercent: number;
  marketCap?: number;
  isMarketOpen: boolean;
  lastUpdated: string;
  fiftyTwoWeek?: {
    low: number;
    high: number;
    range: string;
  };
  // ✅ TradingView 额外字段
  bid?: number;           // 买价
  ask?: number;           // 卖价
  updateTime?: Date;      // 更新时间
}

// 收益计算结果
export interface GainData {
  currentValue: number;
  totalCost: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  isPositive: boolean;
}

// 投资组合实时数据
export interface PortfolioRealtimeData {
  stats: PortfolioStats;
  quotes: StockQuote[];
  positions: EnhancedPosition[];
  lastUpdated: Date;
}

// 增强的持仓信息（包含实时计算的收益数据）
export interface EnhancedPosition extends Position {
  // 实时计算的收益数据
  realtimeGain?: GainData;
  // 当前实时股价
  realtimePrice?: number;
  // 日收益
  dayGain?: number;
  dayGainPercent?: number;
}

// 股票详情类型
export interface StockDetail {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  previousClose?: number;
  isMarketOpen?: boolean;
  lastUpdated?: string;
  fiftyTwoWeek?: {
    low: number;
    high: number;
    range?: string;
  };
  // 扩展字段（可能不是所有接口都返回）
  marketCap?: number;
  pe?: number;
  eps?: number;
  dividend?: number;
  dividendYield?: number;
  beta?: number;
  range52Week?: {
    low: number;
    high: number;
  };
  avgVolume?: number;
  sharesOutstanding?: number;
  lastUpdate?: string;
  
  // 公司详细信息字段
  description?: string;        // 公司简介
  sector?: string;            // 所属行业
  industry?: string;          // 细分行业
  country?: string;           // 注册国家
  website?: string;           // 公司网站
  employees?: number;         // 员工数量
  founded?: string;           // 成立时间
  headquarters?: string;      // 总部地址
  logo?: string;              // 股票 Logo URL（TradingView logoId）
  
  // 财务统计数据字段
  statistics?: {
    // 估值指标
    marketCap?: number;
    enterpriseValue?: number;
    trailingPE?: number;
    forwardPE?: number;
    pegRatio?: number;
    priceToSales?: number;
    priceToBook?: number;
    enterpriseToRevenue?: number;
    enterpriseToEbitda?: number;
    
    // 财务指标
    grossMargin?: number;
    profitMargin?: number;
    operatingMargin?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    
    // 收入报表
    revenue?: number;
    revenuePerShare?: number;
    quarterlyRevenueGrowth?: number;
    grossProfit?: number;
    ebitda?: number;
    netIncome?: number;
    eps?: number;
    quarterlyEarningsGrowth?: number;
    
    // 资产负债表
    totalCash?: number;
    cashPerShare?: number;
    totalDebt?: number;
    debtToEquity?: number;
    currentRatio?: number;
    bookValuePerShare?: number;
    
    // 现金流
    operatingCashFlow?: number;
    freeCashFlow?: number;
    
    // 股票统计
    sharesOutstanding?: number;
    floatShares?: number;
    avgVolume10Day?: number;
    avgVolume90Day?: number;
    sharesShort?: number;
    shortRatio?: number;
    shortPercentOfFloat?: number;
    heldByInsiders?: number;
    heldByInstitutions?: number;
    
    // 价格统计
    fiftyTwoWeekLow?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekChange?: number;
    beta?: number;
    movingAverage50Day?: number;
    movingAverage200Day?: number;
    
    // 股息和拆股
    forwardDividendRate?: number;
    forwardDividendYield?: number;
    trailingDividendRate?: number;
    trailingDividendYield?: number;
    fiveYearAvgDividendYield?: number;
    payoutRatio?: number;
    dividendFrequency?: string;
    dividendDate?: string;
    exDividendDate?: string;
    lastSplitFactor?: string;
    lastSplitDate?: string;
  };
}

// K线数据
export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// 股票搜索结果
export interface StockSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  region: string;
  currency: string;
  assetType?: string
}

// 关注列表项
export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  exchange?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  addedAt?: string;
  alertPrice?: number;
  notes?: string;
  logoid?: string; // TradingView logo ID
  baseCurrencyLogoid?: string; // 基础货币 logoid（用于组合 logo，如外汇、加密货币交易对）
  currencyLogoid?: string; // 货币 logoid（用于组合 logo）
  // 新增字段：实时报价数据
  quote?: {
    symbol: string;
    exchange: string;
    name: string;
    price: number;
    previousClose: number;
    open: number;
    high: number;
    low: number;
    change: number;
    changePercent: number;
    volume: number;
    currency: string; // 货币代码
    timestamp: string;
    pricescale?: number; // 价格精度（从 TradingView quote 获取）
  };
  // 新增字段：趋势数据
  trend?: {
    symbol: string;
    exchange: string;
    interval: string;
    values: {
      datetime: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }[];
  };
}

// 股票榜单类型
export interface StockRanking {
  gainers: TrendItem[];
  losers: TrendItem[];
  mostActive: TrendItem[];
  trending: TrendItem[];
}

// 图表时间段
export type ChartPeriod = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';

// 股票价格提醒
export interface PriceAlert {
  id: string;
  symbol: string;
  type: 'above' | 'below';
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// 股票Logo
export interface StockLogo {
  symbol: string;
  name?: string;
  exchange?: string;
  logoUrl: string;
  lastUpdated: string;
}

// 股票K线周期类型（公共类型）
export type KLineIntervalType = '1min' | '5min' | '15min' | '30min' | '45min' | '1h' | '2h' | '4h' | '1day' | '1week' | '1month';

// 汇率数据接口
export interface ExchangeRateData {
  symbol: string;         // 货币对符号，如 'USD/CNY'
  rate: number;           // 汇率值
  fromSymbol: string;     // 基础货币代码
  toSymbol: string;       // 目标货币代码
  timestamp: number;      // 时间戳
  datetime: string;       // 格式化日期时间
  lastUpdated: string;    // 上次更新时间
}

// TradingView 新闻类型
export interface TradingViewNewsItem {
  id: string;                    // 新闻ID
  title: string;                 // 标题
  published: number;             // 发布时间戳（秒）
  urgency: number;               // 紧急程度
  permission: string;            // 权限类型（如 preview）
  relatedSymbols?: {       // 相关股票
    symbol: string;
    logoid?: string;
    'currency-logoid'?: string;       // 货币 logoid（如 country/US）
    'base-currency-logoid'?: string;  // 基础货币 logoid（如 crypto/XTVCBTC）
  }[];
  storyPath?: string;            // 新闻详情路径
  provider?: {                   // 新闻来源
    id: string;
    name: string;
    logo_id?: string;
  };
}

// 新闻列表响应
export interface TradingViewNewsResponse {
  items: TradingViewNewsItem[];
}

// 新闻详情 - AST 节点类型
export interface ASTNode {
  type: string;
  children?: (string | ASTNode)[];
  params?: {
    symbol?: string;
    text?: string;
    [key: string]: any;
  };
}

// 新闻详情
export interface TradingViewNewsDetail {
  id: string;
  title: string;
  published: number;
  shortDescription?: string;
  astDescription?: {
    type: 'root';
    children: ASTNode[];
  };
  language: string;
  tags?: {
    title: string;
    args: {
      id: string;
      value: string;
    }[];
  }[];
  copyright?: string;
  urgency: number;
  permission: string;
  relatedSymbols?: {
    symbol: string;
    logoid?: string;
  }[];
  storyPath?: string;
  read_time?: number;
  provider?: {
    id: string;
    name: string;
    logo_id?: string;
  };
  distributor?: {
    id: string;
    name: string;
    logo_id?: string;
  };
} 