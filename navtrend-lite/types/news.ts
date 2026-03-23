import type { Language } from '@/config/i18n';

// 新闻文章类型
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  url: string;
  urlToImage: string;
  category: NewsCategory;
}

// 新闻分类
export type NewsCategory = 'business' | 'technology' | 'entertainment' | 'sports' | 'science' | 'health';

// 新闻列表响应
export interface NewsListResponse {
  articles: NewsArticle[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 新闻筛选参数
export interface NewsFilter {
  category?: NewsCategory[];
  symbols?: string[];
  sources?: string[];
  sentiment?: ('positive' | 'negative' | 'neutral')[];
  importance?: ('low' | 'medium' | 'high')[];
  dateRange?: {
    from: string;
    to: string;
  };
  language?: Language; // 支持所有7种语言
  keyword?: string;
}

// 新闻搜索参数
export interface NewsSearchParams {
  page?: number;
  pageSize?: number;
  category?: NewsCategory | NewsCategory[];
  keyword?: string;
  [key: string]: any;
}

// 新闻源信息
export interface NewsSource {
  id: string;
  name: string;
  domain: string;
  description?: string;
  logoUrl?: string;
  category: NewsCategory[];
  isActive: boolean;
  credibility: number; // 1-10 可信度评分
  updateFrequency: number; // 分钟
}

// 新闻统计
export interface NewsStats {
  totalArticles: number;
  todayArticles: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  categoryDistribution: {
    category: NewsCategory;
    count: number;
  }[];
  topSources: {
    source: string;
    count: number;
  }[];
  trendingSymbols: {
    symbol: string;
    count: number;
    sentiment: 'positive' | 'negative' | 'neutral';
  }[];
}

// 新闻订阅设置
export interface NewsSubscription {
  id: string;
  userId: string;
  categories: NewsCategory[];
  symbols: string[];
  sources: string[];
  keywords: string[];
  minImportance: 'low' | 'medium' | 'high';
  emailNotification: boolean;
  frequency: 'realtime' | 'hourly' | 'daily';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 从newsService移动的类型定义
export interface Publisher {
  name: string;
  url: string;
  favicon?: string | null;
}

export interface NewsItem {
  title: string;
  url: string;
  excerpt: string;
  thumbnail: string | null;
  language: string;
  paywall: boolean;
  contentLength: number;
  date: string;
  authors: string[];
  keywords: string[];
  publisher: Publisher;
}

export interface NewsResponse {
  items: NewsItem[];
  pagination: {
    page: number;
    totalPages: number;
    totalItems: number;
  };
  topic: string;
  language: string;
}

export interface NewsParams {
  topic?: string;
  language?: string;
  country?: string;
  limit?: number;
  page?: number;
} 