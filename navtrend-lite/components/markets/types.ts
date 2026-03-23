export interface MarketIndex {
  name: string;
  symbol: string;
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

export interface TrendItem {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  isPositive: boolean;
  logo?: string;
  trendData?: number[];
}

// 用于前端显示的格式化版本
export interface TrendItemDisplay {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  price: string;
  change: string;
  changePercent: string;
  volume: string;
  market: string;
  isPositive: boolean;
  logo: string;
  logoColor: string;
  trendData: number[];
} 