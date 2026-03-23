/**
 * 系统级服务统一导出
 */

// 导出单例实例
export { default as analyticsService } from './analyticsService';
export { default as initializationService } from './initializationService';
export { default as startupService } from './startupService';

// 注意：这些服务是函数式服务，没有导出类
