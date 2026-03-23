/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * 日志配置接口
 */
export interface LoggerConfig {
  level: LogLevel;
  enableRequestId: boolean;
  enableTimestamp: boolean;
  prefix?: string;
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  level: string;
  timestamp: string;
  message: string;
  requestId?: string;
  prefix?: string;
  data?: any;
  duration?: number;
}

/**
 * 日志工具类
 * 专为 Cloudflare Workers 环境设计
 */
export class Logger {
  private config: LoggerConfig;
  private requestId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableRequestId: true,
      enableTimestamp: true,
      ...config,
    };
  }

  /**
   * 设置请求ID
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * 清除请求ID
   */
  clearRequestId(): void {
    this.requestId = undefined;
  }

  /**
   * 生成请求ID
   */
  generateRequestId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  /**
   * Debug级别日志
   */
  debug(message: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  /**
   * Info级别日志
   */
  info(message: string, data?: any): void {
    this.log(LogLevel.INFO, message, data);
  }

  /**
   * Warn级别日志
   */
  warn(message: string, data?: any): void {
    this.log(LogLevel.WARN, message, data);
  }

  /**
   * Error级别日志
   */
  error(message: string, error?: any): void {
    const errorData = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    this.log(LogLevel.ERROR, message, errorData);
  }

  /**
   * 记录带有耗时的操作日志
   */
  performance(message: string, startTime: number, data?: any): void {
    const duration = Date.now() - startTime;
    this.info(`${message} - Duration: ${duration}ms`, { ...data, duration });
  }

  /**
   * 记录操作开始日志
   */
  start(operation: string, data?: any): number {
    const startTime = Date.now();
    this.info(`开始${operation}`, data);
    return startTime;
  }

  /**
   * 记录操作完成日志
   */
  end(operation: string, startTime: number, data?: any): void {
    this.performance(`完成${operation}`, startTime, data);
  }

  /**
   * 记录缓存命中日志
   */
  cacheHit(key: string, data?: any): void {
    this.info(`Cache hit: ${key}`, data);
  }

  /**
   * 记录缓存未命中日志
   */
  cacheMiss(key: string, data?: any): void {
    this.info(`Cache miss: ${key}`, data);
  }

  /**
   * 记录API调用日志
   */
  apiCall(method: string, url: string, data?: any): void {
    this.info(`API调用: ${method} ${url}`, data);
  }

  /**
   * 记录API响应日志
   */
  apiResponse(method: string, url: string, status: number, duration: number, data?: any): void {
    this.info(`API响应: ${method} ${url} - Status: ${status}, Duration: ${duration}ms`, data);
  }

  /**
   * 核心日志记录方法
   */
  private log(level: LogLevel, message: string, data?: any): void {
    // 检查日志级别
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level: LogLevel[level],
      timestamp: this.config.enableTimestamp ? new Date().toISOString() : '',
      message,
      ...(this.config.enableRequestId && this.requestId && { requestId: this.requestId }),
      ...(this.config.prefix && { prefix: this.config.prefix }),
      ...(data && { data }),
    };

    // 格式化输出
    const output = this.formatLogEntry(entry);
    
    // 根据级别选择输出方法
    switch (level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(output);
        break;
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.log(output);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(output);
        break;
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(output);
        break;
    }
  }

  /**
   * 格式化日志条目
   */
  private formatLogEntry(entry: LogEntry): string {
    const parts: string[] = [];

    // 时间戳
    if (entry.timestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    // 日志级别
    parts.push(`[${entry.level}]`);

    // 前缀
    if (entry.prefix) {
      parts.push(`[${entry.prefix}]`);
    }

    // 请求ID
    if (entry.requestId) {
      parts.push(`[${entry.requestId}]`);
    }

    // 消息
    parts.push(entry.message);

    // 数据
    if (entry.data) {
      if (typeof entry.data === 'object') {
        parts.push(`- ${JSON.stringify(entry.data)}`);
      } else {
        parts.push(`- ${entry.data}`);
      }
    }

    return parts.join(' ');
  }

  /**
   * 创建子日志器（带前缀）
   */
  child(prefix: string): Logger {
    const childLogger = new Logger({
      ...this.config,
      prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
    });
    childLogger.requestId = this.requestId;
    return childLogger;
  }
}

/**
 * 默认日志器实例
 */
export const logger = new Logger({
  level: LogLevel.INFO,
  enableRequestId: true,
  enableTimestamp: true,
});

/**
 * 创建带前缀的日志器
 */
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({
    level: LogLevel.INFO,
    enableRequestId: true,
    enableTimestamp: true,
    prefix,
    ...config,
  });
} 