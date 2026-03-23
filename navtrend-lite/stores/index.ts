/**
 * Stores 统一导出入口
 * 
 * 提供向后兼容的导出机制，支持：
 * - 从根目录导入：import { useAuthStore } from '@/stores'
 * - 从子目录导入：import { useAuthStore } from '@/stores/auth'
 */

// ========== 认证授权 (Layer 1) ==========
export * from './auth';

// ========== 系统服务 (Layer 2) ==========
export * from './system';

// ========== 业务服务 (Layer 3) ==========
export * from './market';
export * from './user';
export * from './content';

// ========== 应用管理 (Layer 4) ==========
export * from './app';
