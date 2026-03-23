/**
 * 排行榜相关的 TypeScript 类型定义
 */

// ========== 基础类型 ==========

/** 排行榜市场类型 */
export type LeaderboardMarketType = 'stock' | 'stocks' | 'crypto' | 'forex' | 'futures' | 'etf' | 'indices' | 'currencies' | 'bonds' | 'corporate_bonds' | 'etfs';

/** 语言翻译映射 */
export interface LanguageTranslations {
  zh?: string;
  en?: string;
  de?: string;
  ja?: string;
  ko?: string;
  id?: string;
  ms?: string;
  [key: string]: string | undefined;
}

// ========== 默认配置类型（后端 /default-config 接口返回） ==========

/** 默认排行榜配置 */
export interface DefaultLeaderboardConfig {
  version: string;
  last_updated: string;
  categories: DefaultLeaderboardCategory[];
  leaderboards: Record<string, DefaultLeaderboard>;
}

/** 默认排行榜分类 */
export interface DefaultLeaderboardCategory {
  id: string;
  name_translations: LanguageTranslations;
  leaderboards: string[];
}

/** 默认排行榜定义 */
export interface DefaultLeaderboard {
  id: string;
  market_type: LeaderboardMarketType;
  market_code?: string;
  name_translations: LanguageTranslations;
  description_translations?: LanguageTranslations;
}

// ========== 本地配置类型（用户自定义，存储在本地） ==========

/** 本地排行榜配置 */
export interface LocalLeaderboardConfig {
  version: string;
  last_updated: string;
  categories: LocalLeaderboardCategory[];
}

/** 本地排行榜分类 */
export interface LocalLeaderboardCategory {
  id: string;
  name_translations: LanguageTranslations;
  custom_name?: string;
  sort_order: number;
  leaderboards: LocalLeaderboardItem[];
}

/** 本地排行榜项 */
export interface LocalLeaderboardItem {
  code: string;              // 格式：id 或 id:market_code（如 "stocks_market_movers.gainers:america"）
  custom_name?: string;
  sort_order: number;
  added_at: string;
}

// ========== 排行榜数据类型（后端 /{id}/data 接口返回） ==========

/** 排行榜数据查询参数 */
export interface LeaderboardDataParams {
  start?: number;
  count?: number;
  lang?: string;
}

/** 排行榜数据行 */
export interface LeaderboardRow {
  symbol: string;
  name: string;
  description?: string;
  exchange?: string;
  logoid?: string;
  'base-currency-logoid'?: string;
  logo?: { logoid?: string; style?: string };
  currency?: string;
  price: number;
  change?: number;
  changecrypto?: number;
  change_percent?: number;
  pricescale?: number;
  volume?: number;
  market_cap?: number;
  pe_ratio?: number;
  [key: string]: any;
}

/** 排行榜数据响应 */
export interface LeaderboardDataResponse {
  total_count: number;
  data: LeaderboardRow[];
}

// ========== UI 显示类型 ==========

/** 显示用的排行榜分类 */
export interface LeaderboardDisplayCategory {
  id: string;
  name: string;
  icon: string;
  leaderboards: LeaderboardDisplayItem[];
}

/** 显示用的排行榜项目 */
export interface LeaderboardDisplayItem {
  code: string;
  name: string;
  description?: string;
  icon?: string;
  is_custom: boolean;
  sort_order: number;
  config: DefaultLeaderboard;
}

/** 默认查询参数 */
export const DEFAULT_LEADERBOARD_PARAMS: Required<LeaderboardDataParams> = {
  start: 0,
  count: 50,
  lang: 'zh'
};