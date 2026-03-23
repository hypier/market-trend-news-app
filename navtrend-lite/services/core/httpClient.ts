/**
 * 通用HTTP客户端工具
 * 提供基础的HTTP请求能力：超时控制、重试逻辑、错误处理
 * 不包含认证、签名等业务逻辑，供各个服务自由使用
 */

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * HTTP客户端类
 * 提供简单的HTTP请求能力，不包含业务逻辑
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeout: number;
  private readonly defaultRetryAttempts: number;
  private readonly defaultRetryDelay: number;

  constructor(config: HttpClientConfig) {
    this.baseUrl = config.baseUrl;
    this.defaultTimeout = config.timeout || 10000;
    this.defaultRetryAttempts = config.retryAttempts || 3;
    this.defaultRetryDelay = config.retryDelay || 1000;
  }

  /**
   * GET 请求
   */
  async get<T>(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  async post<T>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * PUT 请求
   */
  async put<T>(url: string, body?: any, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE 请求
   */
  async delete<T>(url: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * 通用请求方法（带重试）
   */
  async request<T>(url: string, options: HttpRequestOptions = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.defaultTimeout,
      retryAttempts = this.defaultRetryAttempts,
      retryDelay = this.defaultRetryDelay,
    } = options;

    const fullUrl = this.buildUrl(url);

    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      try {
        return await this.executeSingleRequest<T>(fullUrl, method, headers, body, timeout);
      } catch (error) {
        // 最后一次尝试失败，抛出错误
        if (attempt >= retryAttempts) {
          throw error;
        }

        // 等待后重试
        const delay = retryDelay * attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`请求失败：超过最大重试次数 (${retryAttempts}次)`);
  }

  /**
   * 执行单次HTTP请求
   */
  private async executeSingleRequest<T>(
    url: string,
    method: string,
    headers: Record<string, string>,
    body: any,
    timeout: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text().catch(() => '无法读取响应');
        throw new Error(`HTTP错误 ${response.status}: ${text}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      // 超时错误
      if (error?.name === 'AbortError') {
        throw new Error(`请求超时 (${timeout}ms)`);
      }

      // 重新抛出其他错误
      throw error;
    }
  }

  /**
   * 构建完整URL
   */
  private buildUrl(path: string): string {
    // 如果是完整URL，直接返回
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // 拼接baseUrl
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  /**
   * 获取配置信息
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      timeout: this.defaultTimeout,
      retryAttempts: this.defaultRetryAttempts,
      retryDelay: this.defaultRetryDelay,
    };
  }
}

/**
 * 创建HTTP客户端实例的工厂函数
 */
export function createHttpClient(config: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}

