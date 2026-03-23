import { AppConfig } from '@/config/app';

/**
 * API 配置文件
 * 集中管理所有API相关的配置项
 */

// ========== 基础配置 ==========

export const API_BASE_CONFIG = {
  BASE_URL: AppConfig.API_BASE_URL,
  VERSION: 'v1',
  SUCCESS_CODE: 200,
  UNAUTHORIZED_STATUS: 401,
  TIMEOUT: AppConfig.API_TIMEOUT,
  MAX_RETRY_ATTEMPTS: AppConfig.MAX_RETRY_ATTEMPTS,
  RETRY_DELAY: AppConfig.RETRY_DELAY,
  APP_ID: AppConfig.APP_ID,
} as const;

// ========== 请求头配置 ==========

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

export const FALLBACK_HEADERS = {
  ...DEFAULT_HEADERS,
  'appId': API_BASE_CONFIG.APP_ID,
  'countryCode': 'US',
} as const;

// ========== 存储键配置 ==========

export const AUTH_STORAGE_KEYS = {
  SECURE_TOKEN: AppConfig.STORAGE_KEYS.AUTH_TOKEN,
  LEGACY_TOKEN: 'auth_token',
} as const;

