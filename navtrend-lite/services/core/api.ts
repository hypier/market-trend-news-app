import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Logger, LogModule } from '@/utils/logger';
import { getCurrentCountryCode } from '@/utils/localeUtils';
import Constants from 'expo-constants';

// 导入配置
import {
  API_BASE_CONFIG,
  DEFAULT_HEADERS,
  FALLBACK_HEADERS,
  AUTH_STORAGE_KEYS,
} from './api.config';
import { generateApiSignature } from './signature';

// ========== 类型定义 ==========

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  data?: any;
  includeAuth?: boolean;
  timeout?: number;
  retryAttempts?: number;
  version?: string | null;
}

export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
}

// 重新导出配置（保持兼容性）
export const API_CONFIG = API_BASE_CONFIG;

// ========== 工具函数 ==========

/**
 * 构建请求头（包含认证、签名等）
 */
async function buildHeaders(includeAuth = true): Promise<Record<string, string>> {
  try {
    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      'appId': API_CONFIG.APP_ID,
      'countryCode': getCurrentCountryCode(),
      'appVersion': Constants.expoConfig?.version || '',
    };

    // 添加API签名
    try {
      const signature = await generateApiSignature();
      if (signature) headers['X-API-Signature'] = signature;
    } catch (error) {
      Logger.warn(LogModule.API, 'API签名生成失败，跳过', error);
    }

    // 添加认证头
    if (includeAuth) {
      const token = await getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  } catch (error) {
    Logger.error(LogModule.API, '构建请求头失败，使用默认配置', error);
    return { ...FALLBACK_HEADERS };
  }
}

/**
 * 获取认证Token（优先SecureStore，回退到AsyncStorage）
 */
async function getAuthToken(): Promise<string | null> {
  try {
    // 优先JWT token（Auth0）
    const jwtToken = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.SECURE_TOKEN);
    if (jwtToken) return jwtToken;

    // 回退传统token
    return await AsyncStorage.getItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN);
  } catch (error) {
    Logger.warn(LogModule.API, '获取认证token失败', error);
    return null;
  }
}

/**
 * API错误类
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 处理401未授权错误（清除token并通知AuthStore）
 */
async function handle401Error(): Promise<void> {
  try {
    Logger.warn(LogModule.API, '🔐 收到401错误，清除认证信息');
    
    // 清除所有token
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.SECURE_TOKEN).catch(() => {}),
      AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LEGACY_TOKEN).catch(() => {})
    ]);
    
    // 通知AuthStore登出
    const { useAuthStore } = await import('@/stores');
    useAuthStore.getState().logout();
  } catch (error) {
    Logger.error(LogModule.API, '处理401错误失败', error);
  }
}


// ========== API客户端 ==========

/**
 * API客户端 - 统一的HTTP请求接口
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly defaultVersion: string | null;

  constructor(baseUrl: string = API_CONFIG.BASE_URL, defaultVersion: string | null = 'v1') {
    this.baseUrl = baseUrl;
    this.defaultVersion = defaultVersion;
  }

  /**
   * 通用请求方法
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      data,
      includeAuth = true,
      timeout = API_CONFIG.TIMEOUT,
      retryAttempts = API_CONFIG.MAX_RETRY_ATTEMPTS,
      version,
    } = options;

    // 构建URL
    const finalVersion = version !== undefined ? version : this.defaultVersion;
    const url = this.buildUrl(endpoint, finalVersion);

    // 带重试的请求执行
    return this.executeWithRetry<T>(url, method, data, includeAuth, timeout, retryAttempts);
  }

  /**
   * 构建完整URL
   */
  private buildUrl(endpoint: string, version: string | null): string {
    const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return version ? `${this.baseUrl}/${version}${normalized}` : `${this.baseUrl}${normalized}`;
  }

  /**
   * 带重试逻辑的请求执行
   */
  private async executeWithRetry<T>(
    url: string,
    method: HttpMethod,
    data: any,
    includeAuth: boolean,
    timeout: number,
    maxAttempts: number
  ): Promise<T> {
    const startTime = Date.now();
    Logger.info(LogModule.API, `🚀 ${method} ${url} (超时: ${timeout}ms)`);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeSingleRequest<T>(url, method, data, includeAuth, timeout);
        const duration = Date.now() - startTime;
        Logger.info(LogModule.API, `✅ ${method} ${url} (用时: ${duration}ms)`);
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // 最后一次尝试失败，直接抛出错误
        if (attempt >= maxAttempts) {
          Logger.error(LogModule.API, `❌ ${method} ${url} 失败 (尝试 ${attempt}/${maxAttempts}, 用时: ${duration}ms)`);
          throw error;
        }

        // 可重试，等待后继续
        const delay = API_CONFIG.RETRY_DELAY * attempt;
        Logger.warn(LogModule.API, `⏳ ${method} ${url} 重试中 (尝试 ${attempt}/${maxAttempts}, 等待 ${delay}ms)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new ApiError(0, `请求失败：超过最大重试次数 (${maxAttempts}次)`);
  }

  /**
   * 执行单次HTTP请求
   */
  private async executeSingleRequest<T>(
    url: string,
    method: HttpMethod,
    data: any,
    includeAuth: boolean,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // 构建请求头
      const headers = await buildHeaders(includeAuth);

      // 发起请求
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 处理响应
      return await this.handleResponse<T>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 超时错误
      if (error?.name === 'AbortError') {
        throw new ApiError(408, `请求超时 (${timeout}ms)`);
      }

      // 网络错误
      throw new ApiError(0, '网络错误', error);
    }
  }

  /**
   * 处理HTTP响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // 处理401错误
    if (response.status === API_CONFIG.UNAUTHORIZED_STATUS) {
      await handle401Error();
      throw new ApiError(401, '认证失败');
    }

    // 处理其他HTTP错误
    if (!response.ok) {
      const text = await response.text().catch(() => '无法读取响应');
      throw new ApiError(response.status, `HTTP错误 ${response.status}`, text);
    }

    // 解析JSON
    let result: ApiResponse<T>;
    try {
      result = await response.json();
    } catch (error) {
      throw new ApiError(response.status, 'JSON解析失败', error);
    }

    // 检查业务状态码
    if (result.code !== API_CONFIG.SUCCESS_CODE) {
      throw new ApiError(response.status, result.message || 'API错误', result);
    }

    return result.data as T;
  }

  // ========== 便捷方法 ==========

  async get<T>(endpoint: string, includeAuth = true, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', includeAuth, timeout });
  }

  async post<T>(endpoint: string, data?: any, includeAuth = true, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', data, includeAuth, timeout });
  }

  async put<T>(endpoint: string, data?: any, includeAuth = true, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', data, includeAuth, timeout });
  }

  async delete<T>(endpoint: string, includeAuth = true, timeout?: number): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', includeAuth, timeout });
  }
}

// ========== 导出 ==========

// 全局API实例
export const apiClient = new ApiClient();
export default apiClient; 