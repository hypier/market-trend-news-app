import Constants from 'expo-constants';

// 获取配置值的类型安全函数 - 强制从 app.config.js 读取，无默认值
function getConfigValue(key: string): string {
  const value = Constants.expoConfig?.extra?.[key];
  if (!value) {
    throw new Error(`配置项 [${key}] 未在 app.config.js 的 extra 字段中定义`);
  }
  return value;
}

// 获取应用版本号
export function getAppVersion(): string {
  // 优先从 expo 配置获取，然后从 manifest 获取，最后使用默认值
  return Constants.expoConfig?.version || 
         (Constants.manifest as any)?.version || 
         Constants.manifest2?.extra?.expoClient?.version ||
         '1.0.2';
}

// 应用配置
export const AppConfig = {
  // API 配置 - 从 app.config.js 读取
  API_BASE_URL: getConfigValue('apiBaseUrl'),
  API_SECRET_KEY: getConfigValue('apiSecretKey'),
  API_TIMEOUT: 15000, // 减少到15秒，提高响应速度

  // 应用认证配置 - 从 app.config.js 读取
  APP_ID: getConfigValue('appId'),

  // Clerk 认证配置 - 从 app.config.js 读取
  CLERK: {
    PUBLISHABLE_KEY: getConfigValue('clerkPublishableKey'),
  },
  

  
  // API 超时配置 - 针对不同类型的请求设置不同超时时间
  API_TIMEOUTS: {
    // 快速请求 - 认证、验证类
    FAST: 8000, // 8秒
    // 标准请求 - 股票数据、新闻等
    STANDARD: 15000, // 15秒
    // 慢请求 - 复杂查询、批量数据
    SLOW: 25000, // 25秒
    // 上传/下载文件
    UPLOAD: 60000, // 60秒
  },
  
  // 环境配置 - 从 app.config.js 读取
  ENVIRONMENT: getConfigValue('environment') as 'development' | 'staging' | 'production',
  IS_DEBUG: getConfigValue('environment') === 'development', // 开发环境自动开启调试
  IS_DEV: getConfigValue('environment') === 'development',
  IS_PROD: getConfigValue('environment') === 'production',
  
  // 缓存配置 (分钟) - 硬编码
  CACHE_TTL: {
    // 市场数据缓存
    STOCK_QUOTE: 2, // 增加到2分钟
    STOCK_DETAIL: 5, // 5分钟
    ASSET_SEARCH: 10, // 10分钟
    STOCK_RANKING: 5, // 5分钟
    TRENDING_STOCKS: 5, // 5分钟
    BATCH_QUOTES: 2, // 增加到2分钟，减少API调用频率
    WATCHLIST: 5, // 5分钟
    MARKET_DATA: 5, // 5分钟 - 新增市场数据缓存时间
    ASSET_CATEGORIES: 60, // 60分钟 - 新增资产分类缓存时间，因为分类不经常变化
    
    // 投资组合缓存
    PORTFOLIO_SUMMARY: 5, // 5分钟
    PORTFOLIO_HOLDINGS: 5, // 5分钟
    PORTFOLIO_PERFORMANCE: 15, // 15分钟
    TRANSACTION_HISTORY: 30, // 30分钟
    
    // 新闻缓存
    NEWS_LIST: 15, // 15分钟
    NEWS_DETAIL: 60, // 60分钟
    NEWS_SEARCH: 30, // 30分钟
    
    // 用户数据缓存
    USER_PROFILE: 60, // 60分钟
    USER_PREFERENCES: 0, // 永不过期
    PRICE_ALERTS: 10, // 10分钟
    
    // 排行榜缓存
    SYSTEM_CONFIGS: 60, // 60分钟 - 系统配置不经常变化
    LEADERBOARD_DATA: 5, // 5分钟 - 排行榜数据需要相对及时
  },
  
  // 网络配置 - 硬编码（被api.ts使用）
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  
  // 分页配置 - 硬编码
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
    NEWS_PAGE_SIZE: 10,
    TRANSACTION_PAGE_SIZE: 50,
  },
  
  // 本地存储配置 - 硬编码（被多个服务使用）
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_PROFILE: 'user_profile',
    USER_PREFERENCES: 'user_preferences',
    PORTFOLIO_DATA: 'portfolio_data',
    WATCHLIST_DATA: 'watchlist_data',
    PRICE_ALERTS: 'price_alerts',
    SETTINGS: 'app_settings',
    CACHE_PREFIX: 'cache_',
    OFFLINE_DATA: 'offline_data',
  },
  
  // 安全配置 - 硬编码（被authService使用）
  SECURITY: {
    TOKEN_REFRESH_THRESHOLD: 300, // 5分钟
  },

  // 调试信息
  _DEBUG_INFO: {
    CONSTANTS: Constants.expoConfig?.extra,
    ENV: Constants.expoConfig?.extra?.environment,
    NODE_ENV: getConfigValue('environment'),
  },
} as const;

// 环境检查函数
export const Environment = {
  isDevelopment: () => AppConfig.ENVIRONMENT === 'development',
  isStaging: () => AppConfig.ENVIRONMENT === 'staging',
  isProduction: () => AppConfig.ENVIRONMENT === 'production',
  isDebug: () => AppConfig.IS_DEBUG,
} as const;

// 缓存键生成器
export const CacheKeys = {
  stockQuote: (symbol: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}stock_quote_${symbol}`,
  stockDetail: (symbol: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}stock_detail_${symbol}`,
  stockSearch: (query: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}stock_search_${query}`,
  stockTrend: (symbol: string, interval: string, outputsize: number) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}stock_trend_${symbol}_${interval}_${outputsize}`,
  stockLogo: (symbol: string, size?: number) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}stock_logo_${symbol}${size ? `_${size}` : ''}`,
  watchlist: (userId: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}watchlist_${userId}`,
  portfolioSummary: (userId: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}portfolio_summary_${userId}`,
  portfolioHoldings: (userId: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}portfolio_holdings_${userId}`,
  newsList: (category?: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}news_list${category ? `_${category}` : ''}`,
  newsDetail: (id: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}news_detail_${id}`,
  userProfile: (userId: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}user_profile_${userId}`,
  marketData: (categoryCode: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}market_data_${categoryCode}`,
  assetCategories: () => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}asset_categories`, // 新增资产分类缓存键生成器
  // 排行榜缓存键生成器
  leaderboardConfigs: () => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}leaderboard_configs`,
  leaderboardData: (configCode: string, params?: string) => `${AppConfig.STORAGE_KEYS.CACHE_PREFIX}leaderboard_data_${configCode}${params ? `_${params}` : ''}`,
} as const;

// 导出默认配置
export default AppConfig; 