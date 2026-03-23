/**
 * 日志系统类型定义
 * 
 * 提供完整的类型安全日志系统支持
 * 包含模块分类、级别控制、颜色格式化等功能
 */

/**
 * 日志级别枚举
 * 数字越小优先级越高
 */
export enum LogLevel {
  ERROR = 0,   // 错误 - 最高优先级
  WARN = 1,    // 警告
  INFO = 2,    // 信息
  DEBUG = 3,   // 调试
  TRACE = 4    // 追踪 - 最低优先级
}

/**
 * 功能模块枚举
 * 按应用功能划分的10个核心模块
 */
export enum LogModule {
  ADMOB = 'AdMob',           // 广告系统
  AUTH = 'Auth',             // 用户认证
  STOCK = 'Stock',           // 股票数据
  PORTFOLIO = 'Portfolio',   // 投资组合
  NEWS = 'News',             // 新闻数据
  API = 'API',               // 网络请求
  STORAGE = 'Storage',       // 缓存存储
  ANALYTICS = 'Analytics',   // 数据分析
  UPDATE = 'Update',         // 应用更新
  PREFERENCES = 'Preferences' // 用户偏好设置
}

/**
 * 日志配置接口
 */
export interface LogConfigInterface {
  /** 全局日志开关 */
  enabled: boolean;
  
  /** 全局日志级别 - 只显示此级别及以上的日志 */
  level: LogLevel;
  
  /** 各模块的开关控制 */
  modules: Record<LogModule, boolean>;
  
  /** 是否启用颜色显示 */
  colors: boolean;
  
  /** 是否显示时间戳 */
  timestamp: boolean;
  
  /** 是否显示文件名和行号 (开发环境) */
  location?: boolean;
}

/**
 * 日志器接口
 */
export interface ILogger {
  /** 错误日志 - 红色 */
  error(module: LogModule, ...args: any[]): void;
  
  /** 警告日志 - 黄色 */
  warn(module: LogModule, ...args: any[]): void;
  
  /** 信息日志 - 蓝色 */
  info(module: LogModule, ...args: any[]): void;
  
  /** 调试日志 - 绿色 */
  debug(module: LogModule, ...args: any[]): void;
  
  /** 追踪日志 - 灰色 */
  trace(module: LogModule, ...args: any[]): void;
}

/**
 * 配置管理接口
 */
export interface ILogConfig {
  /** 设置全局日志级别 */
  setLevel(level: LogLevel): void;
  
  /** 设置模块开关 */
  setModuleEnabled(module: LogModule, enabled: boolean): void;
  
  /** 检查模块是否启用 */
  isModuleEnabled(module: LogModule): boolean;
  
  /** 判断是否应该记录日志 */
  shouldLog(level: LogLevel, module: LogModule): boolean;
  
  /** 设置颜色开关 */
  setColorsEnabled(enabled: boolean): void;
  
  /** 设置时间戳开关 */
  setTimestampEnabled(enabled: boolean): void;
  
  /** 获取当前配置 */
  getConfig(): LogConfigInterface;
  
  /** 重置为默认配置 */
  reset(): void;
}

/**
 * 颜色格式化接口
 */
export interface IColorFormatter {
  /** 格式化日志消息 */
  formatMessage(level: LogLevel, module: LogModule, args: any[]): string;
  
  /** 获取模块颜色代码 */
  getModuleColor(module: LogModule): string;
  
  /** 获取级别颜色代码 */
  getLevelColor(level: LogLevel): string;
  
  /** 重置颜色代码 */
  getResetColor(): string;
}

/**
 * 模块颜色映射类型
 */
export type ModuleColorMap = Record<LogModule, string>;

/**
 * 级别颜色映射类型
 */
export type LevelColorMap = Record<LogLevel, string>;

/**
 * 日志消息格式化选项
 */
export interface FormatOptions {
  /** 是否包含时间戳 */
  timestamp?: boolean;
  
  /** 是否包含颜色 */
  colors?: boolean;
  
  /** 是否包含级别标识 */
  level?: boolean;
  
  /** 是否包含模块标识 */
  module?: boolean;
  
  /** 时间戳格式 */
  timestampFormat?: 'ISO' | 'short' | 'time';
}

/**
 * 日志条目接口 (用于扩展功能)
 */
export interface LogEntry {
  /** 时间戳 */
  timestamp: Date;
  
  /** 日志级别 */
  level: LogLevel;
  
  /** 功能模块 */
  module: LogModule;
  
  /** 日志消息 */
  message: string;
  
  /** 额外数据 */
  data?: any[];
}

/**
 * 日志级别名称映射
 */
export const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.TRACE]: 'TRACE'
};

/**
 * 模块显示名称映射 (用于格式化输出)
 */
export const MODULE_DISPLAY_NAMES: Record<LogModule, string> = {
  [LogModule.ADMOB]: 'AdMob',
  [LogModule.AUTH]: 'Auth',
  [LogModule.STOCK]: 'Stock',
  [LogModule.PORTFOLIO]: 'Portfolio',
  [LogModule.NEWS]: 'News',
  [LogModule.API]: 'API',
  [LogModule.STORAGE]: 'Storage',
  [LogModule.ANALYTICS]: 'Analytics',
  [LogModule.UPDATE]: 'Update',
  [LogModule.PREFERENCES]: 'Preferences'
};

/**
 * 日志级别优先级检查工具
 */
export const LogLevelUtils = {
  /** 检查级别是否满足最小要求 */
  meetsLevel: (currentLevel: LogLevel, requiredLevel: LogLevel): boolean => {
    return currentLevel <= requiredLevel;
  },
  
  /** 获取级别名称 */
  getLevelName: (level: LogLevel): string => {
    return LOG_LEVEL_NAMES[level] || 'UNKNOWN';
  },
  
  /** 从字符串解析级别 */
  parseLevel: (levelStr: string): LogLevel | null => {
    const upperStr = levelStr.toUpperCase();
    for (const [level, name] of Object.entries(LOG_LEVEL_NAMES)) {
      if (name === upperStr) {
        return parseInt(level) as LogLevel;
      }
    }
    return null;
  }
};

/**
 * 模块工具函数
 */
export const ModuleUtils = {
  /** 获取模块显示名称 */
  getDisplayName: (module: LogModule): string => {
    return MODULE_DISPLAY_NAMES[module] || module.toString();
  },
  
  /** 从字符串解析模块 */
  parseModule: (moduleStr: string): LogModule | null => {
    for (const module of Object.values(LogModule)) {
      if (module === moduleStr) {
        return module;
      }
    }
    return null;
  },
  
  /** 获取所有模块列表 */
  getAllModules: (): LogModule[] => {
    return Object.values(LogModule);
  }
};
