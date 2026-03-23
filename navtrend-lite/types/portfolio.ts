// 投资组合类型
export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cash: number;
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}

// 持仓信息
export interface Position {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  marketValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  realizedGain: number;
  firstPurchaseDate: string;
  lastUpdateDate: string;
  transactions: Transaction[];
  exchange: string;
}

// 增强持仓信息（包含计算的实时数据）
export interface EnhancedPosition extends Position {
  gainLoss: number;
  gainLossPercent: number;
  isPositive: boolean;
  quantityDisplay: string;
  gainLossDisplay: string;
  companyName: string;
  // Logo 相关字段（从 TradingView quote 获取）
  logoid?: string;
  baseCurrencyLogoid?: string;
  currencyLogoid?: string;
  pricescale?: number; // 价格精度（从 TradingView quote 获取）
  trend?: {
    data?: {
      timestamp?: number;
      datetime?: string;
      value: number;
    }[];
  };
}

// 交易记录
export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  fee: number;
  note?: string;
  date: string;
  createdAt: string;
}

// 投资组合统计
export interface PortfolioStats {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  cashBalance: number;
  assetAllocation: AssetAllocation[];
  topHoldings: Position[];
  recentTransactions: Transaction[];
}

// 增强的投资组合统计数据（UI展示用）
export interface PortfolioStatsData {
  totalValue: number;
  totalGain: number;
  totalGainPercent: number;
  dayGain: number;
  dayGainPercent: number;
  isPositive: boolean;
  isDayPositive: boolean;
  dataSource: 'calculated' | 'store';
}

// 资产配置
export interface AssetAllocation {
  sector: string;
  value: number;
  percentage: number;
  change: number;
  changePercent: number;
}

// 投资组合创建请求
export interface CreatePortfolioRequest {
  name: string;
  description?: string;
  initialCash?: number;
}

// 投资组合更新请求
export interface UpdatePortfolioRequest {
  name?: string;
  description?: string;
}

// 添加交易请求
export interface AddTransactionRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  fee?: number;
  note?: string;
  date: string;
}

// 投资组合表现
export interface PortfolioPerformance {
  period: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
  startValue: number;
  endValue: number;
  gain: number;
  gainPercent: number;
  benchmarkGainPercent: number;
  chartData: PerformanceDataPoint[];
}

// 表现数据点
export interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmarkValue?: number;
}

// 历史数据快照
export interface PortfolioSnapshot {
  id: string;
  portfolioId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD格式
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  cashBalance: number;
  positionsCount: number;
  marketStatus: 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'AFTER_HOURS';
  createdAt: string;
}

// 历史数据点（简化版，用于图表）
export interface PortfolioHistoryPoint {
  date: string; // YYYY-MM-DD
  timestamp: number;
  value: number;
  gain: number;
  gainPercent: number;
}

// 历史数据查询参数
export interface PortfolioHistoryParams {
  portfolioId: string;
  period: '1W' | '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'ALL';
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  interval?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

// 历史数据响应
export interface PortfolioHistoryResponse {
  portfolioId: string;
  period: string;
  startDate: string;
  endDate: string;
  interval: string;
  dataPoints: PortfolioHistoryPoint[];
  summary: {
    totalReturn: number;
    totalReturnPercent: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
    maxDrawdown: number;
    bestDay: {
      date: string;
      gainPercent: number;
    };
    worstDay: {
      date: string;
      gainPercent: number;
    };
  };
  benchmarkData?: PortfolioHistoryPoint[]; // 基准数据（如S&P 500）
  lastUpdated: string;
}

// 历史数据缓存配置
export interface HistoryDataCacheConfig {
  key: string;
  ttl: number; // 缓存时间（秒）
  lastUpdated: Date;
  period: string;
  dataPoints: number;
} 