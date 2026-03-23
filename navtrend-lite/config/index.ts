/**
 * 配置层统一导出
 * 
 * 包含所有应用级配置：
 * - 品牌配置
 * - 应用配置
 * - 国际化配置
 * - 平台样式配置
 */

// 配置文件将在迁移时逐步添加导出
export * from './brand';
export * from './app';
export * from '@/config/i18n';
export * from './platformStyles';

