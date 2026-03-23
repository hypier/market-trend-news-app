/**
 * 高级日志系统 - 核心Logger实现
 * 
 * 提供模块化、级别控制、颜色格式化的完整日志解决方案
 * 支持生产环境自动禁用，开发环境灵活控制
 */

import { AppConfig } from '@/config/app';
import {
  LogLevel,
  LogModule,
  LogConfigInterface,
  ILogger,
  ILogConfig,
  IColorFormatter,
  ModuleColorMap,
  LevelColorMap,
  LogLevelUtils,
  ModuleUtils
} from '../types/logging';

/**
 * ANSI 颜色代码常量
 */
const COLORS = {
  // 重置
  RESET: '\x1b[0m',
  
  // 模块颜色 (明亮色彩)
  YELLOW: '\x1b[33m',      // AdMob - 黄色
  BLUE: '\x1b[34m',        // Auth - 蓝色  
  GREEN: '\x1b[32m',       // Stock - 绿色
  MAGENTA: '\x1b[35m',     // Portfolio - 紫色
  ORANGE: '\x1b[91m',      // News - 橙色 (明亮红色)
  RED: '\x1b[31m',         // API - 红色
  GRAY: '\x1b[90m',        // Storage - 灰色
  BROWN: '\x1b[93m',       // Analytics - 棕色 (明亮黄色)
  CYAN: '\x1b[36m',        // Update - 青色
  PURPLE: '\x1b[95m',      // Preferences - 亮紫色
  
  // 级别颜色
  BRIGHT_RED: '\x1b[91m',     // ERROR
  BRIGHT_YELLOW: '\x1b[93m',  // WARN
  BRIGHT_BLUE: '\x1b[94m',    // INFO
  BRIGHT_GREEN: '\x1b[92m',   // DEBUG
  DIM_GRAY: '\x1b[2m\x1b[37m' // TRACE
} as const;

/**
 * 颜色格式化器实现
 */
class ColorFormatter implements IColorFormatter {
  private moduleColors: ModuleColorMap = {
    [LogModule.ADMOB]: COLORS.YELLOW,
    [LogModule.AUTH]: COLORS.BLUE,
    [LogModule.STOCK]: COLORS.GREEN,
    [LogModule.PORTFOLIO]: COLORS.MAGENTA,
    [LogModule.NEWS]: COLORS.ORANGE,
    [LogModule.API]: COLORS.RED,
    [LogModule.STORAGE]: COLORS.GRAY,
    [LogModule.ANALYTICS]: COLORS.BROWN,
    [LogModule.UPDATE]: COLORS.CYAN,
    [LogModule.PREFERENCES]: COLORS.PURPLE
  };

  private levelColors: LevelColorMap = {
    [LogLevel.ERROR]: COLORS.BRIGHT_RED,
    [LogLevel.WARN]: COLORS.BRIGHT_YELLOW,
    [LogLevel.INFO]: COLORS.BRIGHT_BLUE,
    [LogLevel.DEBUG]: COLORS.BRIGHT_GREEN,
    [LogLevel.TRACE]: COLORS.DIM_GRAY
  };

  formatMessage(level: LogLevel, module: LogModule, args: any[]): string {
    const options = LogConfig.getConfig();
    
    if (!options.colors) {
      // 无颜色模式
      return this.formatPlainMessage(level, module, args, options);
    }
    
    // 彩色模式
    return this.formatColoredMessage(level, module, args, options);
  }

  private formatPlainMessage(level: LogLevel, module: LogModule, args: any[], options: LogConfigInterface): string {
    const parts: string[] = [];
    
    // 时间戳
    if (options.timestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }
    
    // 模块名
    parts.push(`[${ModuleUtils.getDisplayName(module)}]`);
    
    // 级别
    parts.push(`[${LogLevelUtils.getLevelName(level)}]`);
    
    // 消息内容
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    parts.push(message);
    
    return parts.join(' ');
  }

  private formatColoredMessage(level: LogLevel, module: LogModule, args: any[], options: LogConfigInterface): string {
    const parts: string[] = [];
    const moduleColor = this.moduleColors[module];
    const levelColor = this.levelColors[level];
    
    // 时间戳 (灰色)
    if (options.timestamp) {
      parts.push(`${COLORS.GRAY}[${new Date().toISOString()}]${COLORS.RESET}`);
    }
    
    // 模块名 (模块专用颜色)
    parts.push(`${moduleColor}[${ModuleUtils.getDisplayName(module)}]${COLORS.RESET}`);
    
    // 级别 (级别专用颜色)
    parts.push(`${levelColor}[${LogLevelUtils.getLevelName(level)}]${COLORS.RESET}`);
    
    // 消息内容 (使用级别颜色)
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        // 对象用灰色显示
        return `${COLORS.GRAY}${JSON.stringify(arg, null, 2)}${COLORS.RESET}`;
      }
      return String(arg);
    }).join(' ');
    
    parts.push(`${levelColor}${message}${COLORS.RESET}`);
    
    return parts.join(' ');
  }

  getModuleColor(module: LogModule): string {
    return this.moduleColors[module] || COLORS.RESET;
  }

  getLevelColor(level: LogLevel): string {
    return this.levelColors[level] || COLORS.RESET;
  }

  getResetColor(): string {
    return COLORS.RESET;
  }
}

/**
 * 日志配置管理器
 */
class LogConfigManager implements ILogConfig {
  private config: LogConfigInterface;

  constructor() {
    // 默认配置
    this.config = {
      enabled: !AppConfig.IS_PROD,  // 生产环境自动禁用
      level: AppConfig.IS_DEBUG ? LogLevel.DEBUG : LogLevel.INFO,
      modules: {
        [LogModule.ADMOB]: false,
        [LogModule.AUTH]: true,
        [LogModule.STOCK]: true,
        [LogModule.PORTFOLIO]: true,
        [LogModule.NEWS]: true,
        [LogModule.API]: true,
        [LogModule.STORAGE]: true,
        [LogModule.ANALYTICS]: false,
        [LogModule.UPDATE]: true,
        [LogModule.PREFERENCES]: true
      },
      colors: true,
      timestamp: AppConfig.IS_DEBUG, // 开发环境显示时间戳
      location: AppConfig.IS_DEBUG   // 开发环境显示位置信息
    };
  }

  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  setModuleEnabled(module: LogModule, enabled: boolean): void {
    this.config.modules[module] = enabled;
  }

  isModuleEnabled(module: LogModule): boolean {
    return this.config.modules[module] ?? true;
  }

  shouldLog(level: LogLevel, module: LogModule): boolean {
    // 生产环境完全禁用
    if (!this.config.enabled) {
      return false;
    }
    
    // 检查模块开关
    if (!this.isModuleEnabled(module)) {
      return false;
    }
    
    // 检查级别
    return LogLevelUtils.meetsLevel(level, this.config.level);
  }

  setColorsEnabled(enabled: boolean): void {
    this.config.colors = enabled;
  }

  setTimestampEnabled(enabled: boolean): void {
    this.config.timestamp = enabled;
  }

  getConfig(): LogConfigInterface {
    return { ...this.config };
  }

  reset(): void {
    // 重置为默认配置
    this.config = {
      enabled: !AppConfig.IS_PROD,
      level: AppConfig.IS_DEBUG ? LogLevel.DEBUG : LogLevel.INFO,
      modules: {
        [LogModule.ADMOB]: true,
        [LogModule.AUTH]: true,
        [LogModule.STOCK]: true,
        [LogModule.PORTFOLIO]: true,
        [LogModule.NEWS]: true,
        [LogModule.API]: true,
        [LogModule.STORAGE]: true,
        [LogModule.ANALYTICS]: true,
        [LogModule.UPDATE]: true,
        [LogModule.PREFERENCES]: true
      },
      colors: true,
      timestamp: AppConfig.IS_DEBUG,
      location: AppConfig.IS_DEBUG
    };
  }
}

/**
 * 核心Logger实现
 */
class AdvancedLogger implements ILogger {
  private formatter: ColorFormatter;
  private config: LogConfigManager;

  constructor() {
    this.formatter = new ColorFormatter();
    this.config = new LogConfigManager();
  }

  /**
   * 内部日志方法 - 统一处理逻辑
   */
  private log(level: LogLevel, module: LogModule, ...args: any[]): void {
    try {
      // 检查是否应该记录日志
      if (!this.config.shouldLog(level, module)) {
        return;
      }

      // 格式化消息
      const formattedMessage = this.formatter.formatMessage(level, module, args);
      
      // 根据级别选择输出方法
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
        case LogLevel.TRACE:
        default:
          console.log(formattedMessage);
          break;
      }
    } catch (error) {
      // 日志系统本身出错时，降级到简单输出
      console.error('[Logger Error]', error, 'Original args:', args);
    }
  }

  error(module: LogModule, ...args: any[]): void {
    this.log(LogLevel.ERROR, module, ...args);
  }

  warn(module: LogModule, ...args: any[]): void {
    this.log(LogLevel.WARN, module, ...args);
  }

  info(module: LogModule, ...args: any[]): void {
    this.log(LogLevel.INFO, module, ...args);
  }

  debug(module: LogModule, ...args: any[]): void {
    this.log(LogLevel.DEBUG, module, ...args);
  }

  trace(module: LogModule, ...args: any[]): void {
    this.log(LogLevel.TRACE, module, ...args);
  }

  /**
   * 配置访问方法
   */
  getConfig(): ILogConfig {
    return this.config;
  }

  /**
   * 便捷配置方法
   */
  setLevel(level: LogLevel): void {
    this.config.setLevel(level);
  }

  setModuleEnabled(module: LogModule, enabled: boolean): void {
    this.config.setModuleEnabled(module, enabled);
  }

  setColorsEnabled(enabled: boolean): void {
    this.config.setColorsEnabled(enabled);
  }

  /**
   * 批量配置方法
   */
  configure(options: Partial<LogConfigInterface>): void {
    if (options.level !== undefined) {
      this.config.setLevel(options.level);
    }
    if (options.colors !== undefined) {
      this.config.setColorsEnabled(options.colors);
    }
    if (options.timestamp !== undefined) {
      this.config.setTimestampEnabled(options.timestamp);
    }
    if (options.modules) {
      Object.entries(options.modules).forEach(([module, enabled]) => {
        this.config.setModuleEnabled(module as LogModule, enabled);
      });
    }
  }

  /**
   * 重置配置
   */
  reset(): void {
    this.config.reset();
  }
}

// 创建全局Logger实例
const logger = new AdvancedLogger();

// 导出Logger实例和配置访问
export const Logger = logger;
export const LogConfig = logger.getConfig();

// 导出类型和枚举供外部使用
export { LogLevel, LogModule } from '../types/logging';
export type { LogConfigInterface, ILogger } from '../types/logging';

// 默认导出
export default Logger;
