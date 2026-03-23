import {
  sqliteTable,
  text,
  integer,
  index,
} from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 投资组合表 - 记录用户持有的股票信息
export const portfolios = sqliteTable('portfolios', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  exchange: text('exchange'),
  country: text('country'),
  shares: text('shares').notNull(),
  avgCost: text('avg_cost').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => sql`(unixepoch() * 1000)`),
}, (table) => ({
  userIdIdx: index('idx_portfolios_user_id').on(table.userId),
  symbolIdx: index('idx_portfolios_symbol').on(table.symbol),
  exchangeIdx: index('idx_portfolios_exchange').on(table.exchange),
  countryIdx: index('idx_portfolios_country').on(table.country),
  userSymbolIdx: index('idx_portfolios_user_symbol').on(table.userId, table.symbol),
}));

// 关注列表表 - 记录用户关注的股票
export const watchlists = sqliteTable('watchlists', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull(),
  symbol: text('symbol').notNull(),
  exchange: text('exchange'),
  country: text('country'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => sql`(unixepoch() * 1000)`),
}, (table) => ({
  userIdIdx: index('idx_watchlists_user_id').on(table.userId),
  symbolIdx: index('idx_watchlists_symbol').on(table.symbol),
  exchangeIdx: index('idx_watchlists_exchange').on(table.exchange),
  countryIdx: index('idx_watchlists_country').on(table.country),
}));

// 用户表 - 整合用户基本信息和推送全局设置
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  clerkUserId: text('clerk_user_id').unique().notNull(),
  appId: text('app_id').notNull(),
  name: text('name'),
  email: text('email'),
  picture: text('picture'),
  language: text('language').notNull().$default(() => sql`'en'`),
  clerkUserInfo: text('clerk_user_info', { mode: 'json' }),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().$default(() => sql`1`),
  quietHoursEnabled: integer('quiet_hours_enabled', { mode: 'boolean' }).notNull().$default(() => sql`0`),
  quietHoursStart: text('quiet_hours_start'),
  quietHoursEnd: text('quiet_hours_end'),
  timezone: text('timezone').notNull().$default(() => sql`'UTC'`),
  maxDailyPushes: integer('max_daily_pushes').notNull().$default(() => sql`20`),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .$default(() => sql`(unixepoch() * 1000)`),
}, (table) => ({
  clerkUserIdIdx: index('idx_users_clerk_user_id').on(table.clerkUserId),
  appIdIdx: index('idx_users_app_id').on(table.appId),
  emailIdx: index('idx_users_email').on(table.email),
  isActiveIdx: index('idx_users_is_active').on(table.isActive),
  clerkUserAppIdx: index('idx_users_clerk_user_app').on(table.clerkUserId, table.appId),
}));

// 导出类型
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type Watchlist = typeof watchlists.$inferSelect;
export type NewWatchlist = typeof watchlists.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// 多语言翻译类型定义
export interface LanguageTranslations {
  zh?: string;
  en?: string;
  ja?: string;
  ko?: string;
  de?: string;
  id?: string;
  ms?: string;
}

// 预置分类的多语言数据结构
export interface CategoryTranslations {
  nameTranslations: LanguageTranslations;
  descriptionTranslations?: LanguageTranslations;
}
