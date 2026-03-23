/**
 * 缓存配置管理
 * 统一管理所有缓存相关的配置和策略
 */

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  // 基础TTL配置（秒）
  ttl: {
    // 股票服务专用缓存
    stockQuote: number;        // 股票报价 - 1分钟
    stockTrend: number;        // 股票趋势数据 - 5分钟
    stockLogo: number;         // 股票Logo - 7天
    stockProfile: number;      // 股票简介 - 24小时
    stockBatch: number;        // 聚合批量数据 - 3分钟
    
    // 其他缓存
    quote: number;           // 股票报价
    trend: number;           // 趋势数据
    marketOverview: number;  // 市场概览
    gainers: number;         // 涨幅榜
    logo: number;            // 股票Logo
    etfComposition: number;  // ETF成分股
    etfList: number;         // ETF列表
    
    // 新闻服务缓存
    newsTrending: number;    // 热门新闻
    newsSearch: number;      // 搜索新闻
    newsArticle: number;     // 新闻文章内容 
  };
  
  // 限流配置
  rateLimit: {
    maxRequests: number;     // 每分钟最大请求数
    windowMs: number;        // 限流窗口大小（毫秒）
  };
  
  // 缓存键前缀
  prefixes: {
    stock: string;
    etf: string;
    market: string;
    api: string;
  };
  
  // 预热配置
  warming: {
    enabled: boolean;
    batchSize: number;
    delayMs: number;
    hotStocks: string[];
  };
}

/**
 * 默认缓存配置
 */
const DEFAULT_CONFIG: CacheConfig = {
  ttl: {
    // 股票服务专用缓存时间
    stockQuote: 180,          // 3分钟 - 报价数据需要保持较高实时性
    stockTrend: 900,          // 15分钟 - 趋势数据
    stockLogo: 2592000,       // 30天 - Logo几乎不变
    stockProfile: 259200,     // 3天 - 公司信息变化缓慢
    stockBatch: 600,          // 10分钟 - 聚合数据
    
    // 兼容现有配置
    quote: 900,               // 15分钟
    trend: 3600,              // 60分钟
    marketOverview: 1800,     // 30分钟
    gainers: 7200,            // 2小时
    logo: 3628800,            // 42天
    etfComposition: 259200,   // 3天
    etfList: 1209600,         // 14天
    
    // 新闻服务缓存时间
    newsTrending: 1800,       // 30分钟 - 热门新闻
    newsSearch: 600,          // 10分钟 - 搜索新闻
    newsArticle: 3600,        // 1小时 - 新闻文章内容
  },
  
  rateLimit: {
    maxRequests: 500,     // 每分钟500个请求
    windowMs: 60000,      // 1分钟窗口
  },
  
  prefixes: {
    stock: 'stock:',
    etf: 'etf:',
    market: 'market:',
    api: 'api_usage:',
  },
  
  warming: {
    enabled: true,
    batchSize: 10,
    delayMs: 100,
    hotStocks: [
      'AAPL', 'MSFT', 'NVDA', 'AMZN', 'META', 'GOOGL', 'GOOG', 'TSLA',
      'BRK.B', 'LLY', 'AVGO', 'JPM', 'UNH', 'XOM', 'V', 'MA'
    ],
  },
};

/**
 * 缓存配置管理器
 */
export class CacheConfigManager {
  private config: CacheConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 加载缓存配置（直接使用默认值）
   */
  private loadConfig(): CacheConfig {
    return {
      ttl: {
        // 股票服务专用缓存配置
        stockQuote: 180,          // 3分钟 - 报价数据需要保持较高实时性
        stockTrend: 900,          // 15分钟 - 趋势数据
        stockLogo: 2592000,       // 30天 - Logo几乎不变
        stockProfile: 259200,     // 3天 - 公司信息变化缓慢
        stockBatch: 600,          // 10分钟 - 聚合数据
        
        // 其他缓存配置
        quote: 900,               // 15分钟
        trend: 3600,              // 60分钟
        marketOverview: 1800,     // 30分钟
        gainers: 7200,            // 2小时
        logo: 3628800,            // 42天
        etfComposition: 259200,   // 3天
        etfList: 1209600,         // 14天
        
        // 新闻服务缓存配置
        newsTrending: 1800,       // 30分钟 - 热门新闻
        newsSearch: 600,          // 10分钟 - 搜索新闻
        newsArticle: 3600,        // 1小时 - 新闻文章内容
      },
      
      rateLimit: {
        maxRequests: 500,         // 每分钟500个请求
        windowMs: 60000,          // 1分钟窗口
      },
      
      prefixes: DEFAULT_CONFIG.prefixes,
      warming: DEFAULT_CONFIG.warming,
    };
  }

  /**
   * 获取TTL配置
   */
  getTTL(type: keyof CacheConfig['ttl']): number {
    return this.config.ttl[type];
  }
  
  /**
   * 获取股票服务专用的TTL配置
   */
  getStockTTL(): {
    quote: number;
    trend: number;
    logo: number;
    profile: number;
    batch: number;
  } {
    return {
      quote: this.config.ttl.stockQuote,
      trend: this.config.ttl.stockTrend,
      logo: this.config.ttl.stockLogo,
      profile: this.config.ttl.stockProfile,
      batch: this.config.ttl.stockBatch,
    };
  }

  /**
   * 获取限流配置
   */
  getRateLimit(): CacheConfig['rateLimit'] {
    return this.config.rateLimit;
  }

  /**
   * 获取缓存键前缀
   */
  getPrefix(type: keyof CacheConfig['prefixes']): string {
    return this.config.prefixes[type];
  }

  /**
   * 获取预热配置
   */
  getWarmingConfig(): CacheConfig['warming'] {
    return this.config.warming;
  }

  /**
   * 获取完整配置
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(prefix: keyof CacheConfig['prefixes'], ...parts: string[]): string {
    return `${this.getPrefix(prefix)}${parts.join(':')}`;
  }
  
  /**
   * 生成股票专用缓存键
   */
  generateStockCacheKey(type: 'quote' | 'trend' | 'logo' | 'profile' | 'batch', ...parts: string[]): string {
    return `${this.getPrefix('stock')}${type}:${parts.join(':')}`;
  }

  /**
   * 添加随机过期时间偏移（防止缓存雪崩）
   */
  addRandomOffset(ttl: number, maxOffsetPercent: number = 10): number {
    const offset = Math.floor(ttl * (maxOffsetPercent / 100) * Math.random());
    return ttl + offset;
  }

  /**
   * 根据数据类型获取推荐的TTL
   */
  getRecommendedTTL(dataType: 'realtime' | 'frequent' | 'stable' | 'static'): number {
    switch (dataType) {
      case 'realtime':
        return this.getTTL('stockQuote');   // 1分钟
      case 'frequent':
        return this.getTTL('stockTrend');   // 5分钟
      case 'stable':
        return this.getTTL('gainers');      // 1小时
      case 'static':
        return this.getTTL('stockLogo');    // 7天
      default:
        return this.getTTL('stockQuote');
    }
  }

  /**
   * 验证配置有效性
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 验证TTL值
    Object.entries(this.config.ttl).forEach(([key, value]) => {
      if (value <= 0) {
        errors.push(`TTL配置 ${key} 必须大于0`);
      }
    });

    // 验证限流配置
    if (this.config.rateLimit.maxRequests <= 0) {
      errors.push('限流最大请求数必须大于0');
    }
    if (this.config.rateLimit.windowMs <= 0) {
      errors.push('限流窗口大小必须大于0');
    }

    // 验证预热配置
    if (this.config.warming.batchSize <= 0) {
      errors.push('预热批次大小必须大于0');
    }
    if (this.config.warming.delayMs < 0) {
      errors.push('预热延迟不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * 创建缓存配置管理器实例
 */
export function createCacheConfig(): CacheConfigManager {
  return new CacheConfigManager();
} 