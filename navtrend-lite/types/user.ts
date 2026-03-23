import type { Language } from '@/config/i18n';

// 认证类型枚举
export type AuthType = 'clerk_sso' | 'one_click';

// 用户信息类型
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  nickname?: string;
  clerk_user_id?: string; // Clerk 用户ID (用于认证)
  authType?: AuthType; // 🔥 认证方式：SSO 或一键登录
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

// 用户偏好设置
export interface UserPreferences {
  language: Language; // 支持所有7种语言
  currency: 'USD' | 'CNY' | 'HKD';
  theme: 'light' | 'dark' | 'auto';
  notifications: NotificationSettings;
  markets: MarketPreferences;
}

// 通知设置
export interface NotificationSettings {
  priceAlerts: boolean;
  newsUpdates: boolean;
  portfolioUpdates: boolean;
  marketOpen: boolean;
  marketClose: boolean;
}

// 市场偏好
export interface MarketPreferences {
  watchlistLimit: number;
  defaultChartPeriod: '1D' | '1W' | '1M' | '3M' | '1Y';
}

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  nickname?: string;
}

// 认证响应
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
} 