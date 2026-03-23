/**
 * 认证服务模块 (简化版)
 * 
 * 提供用户认证相关的基础功能，专注于业务逻辑。
 * 重试和错误处理由状态机系统统一管理。
 * 
 * 主要特性：
 * - JWT Token 管理
 * - 安全的本地存储
 * - 认证状态检查
 * - Clerk 认证集成
 * 
 * @author MarketNews Team
 * @version 3.0.0 (状态机重构版)
 */

import { apiClient } from '../core/api';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import { Logger, LogModule } from '@/utils/logger';
import { AppConfig } from '@/config/app';
import type { User } from '@/types/user';
// 移除直接导入，使用延迟导入打破循环依赖
// import { portfolioService } from '../user/portfolioService';
// 移除已删除的authErrors导入

/**
 * Clerk 用户信息接口
 */
interface ClerkUserInfo {
  sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  picture?: string;
  given_name?: string;
  family_name?: string;
}


/**
 * Token交换结果接口
 */
interface TokenExchangeResult {
  token: string;
  account: any;
  clerk_user_id?: string;  // 后端返回的字段名
  clerkUserInfo?: any;
}

/**
 * 认证服务类 (简化版)
 * 
 * 专注于业务逻辑，重试和错误处理由状态机处理
 */
export class AuthService {

  /**
   * 使用 Clerk token 获取应用 JWT Token (简化版)
   * 使用 apiClient 统一调用，与 watchlistService 保持一致
   */
  async exchangeClerkToken(clerkToken: string): Promise<TokenExchangeResult> {
    Logger.info(LogModule.AUTH, '🔄 使用 Clerk token 请求应用 JWT Token');

    try {
      // 使用 apiClient 调用，与 watchlistService 保持一致
      // apiClient 会自动添加 appId header 和认证信息
      // 注意：apiClient.handleResponse() 已经提取了 result.data，所以这里直接返回 TokenExchangeResult
      const result = await apiClient.request<TokenExchangeResult>('/auth/clerk/verify', {
        method: 'POST',
        data: { session_token: clerkToken },
        includeAuth: false, // Clerk 验证不需要 JWT 认证
        version: 'v1',
      });
      
      // 验证响应格式（apiClient 已经处理了 code 检查，这里只需要验证数据完整性）
      if (!result || !result.token) {
        throw new Error('Token 验证失败: 响应格式无效');
      }

      Logger.info(LogModule.AUTH, '✅ Clerk token 验证成功');
      return result;

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      Logger.error(LogModule.AUTH, '❌ Clerk token 验证失败:', errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * 完整的 Clerk 登录流程 (简化版)
   */
  async loginWithClerk(clerkToken: string): Promise<{ token: string; user: User }> {
    Logger.info(LogModule.AUTH, '🔄 开始 Clerk 登录流程');
    
    try {
      // 1. 交换 token
      const { token: appJwtToken, account, clerkUserInfo } = await this.exchangeClerkToken(clerkToken);
      
      // 2. 解析 Clerk token 获取用户信息
      const clerkUserData = this.parseClerkToken(clerkToken);
      
      // 3. 构建用户对象
      const user = this.buildUserObject(account, clerkUserData, clerkUserInfo);
      
      // 4. 保存认证数据
      await this.storeAuthData(appJwtToken, user);
      
      Logger.info(LogModule.AUTH, '✅ Clerk 登录流程完成');
      return { token: appJwtToken, user };
      
    } catch (error: any) {
      Logger.error(LogModule.AUTH, '❌ Clerk 登录失败:', error.message);
      throw error;
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    try {
      await this.clearAuthData();
      Logger.info(LogModule.AUTH, '✅ 用户登出成功');
    } catch (error: any) {
      Logger.error(LogModule.AUTH, '❌ 登出失败:', error);
      throw error;
    }
  }

  /**
   * 一键登录 - 创建临时账户并登录
   */
  async oneClickLogin(): Promise<{ token: string; user: User }> {
    try {
      Logger.info(LogModule.AUTH, '🔄 开始一键登录流程');
      
      // 生成随机用户数据
      const randomData = this.generateRandomUserData();
      
      // 调用一键登录 API
      const response = await apiClient.request<{ token: string }>('auth/token', {
        method: 'POST',
        data: randomData,
        includeAuth: false, // 一键登录不需要认证
      });
      
      if (!response.token) {
        throw new Error('一键登录响应格式无效：缺少 token');
      }
      
      const token = response.token;
      
      // 解析 JWT token 获取用户信息
      const tokenPayload = this.parseJWTToken(token);
      
      // 构建用户对象
      const user = this.buildUserObjectFromToken(tokenPayload, randomData);
      
      // 保存认证数据
      await this.storeAuthData(token, user);
      
      Logger.info(LogModule.AUTH, '✅ 一键登录流程完成');
      return { token, user };
      
    } catch (error: any) {
      Logger.error(LogModule.AUTH, '❌ 一键登录失败:', error.message);
      throw error;
    }
  }

  /**
   * 删除用户账户
   */
  async deleteAccount(): Promise<void> {
    try {
      Logger.info(LogModule.AUTH, '🔄 开始删除用户账户');
      
      await apiClient.request<null>('/auth/account', {
        method: 'DELETE',
        includeAuth: true,
      });
      
      // 清除本地认证数据
      await this.clearAuthData();
      Logger.info(LogModule.AUTH, '✅ 用户账户删除成功');
    } catch (error: any) {
      Logger.error(LogModule.AUTH, '❌ 删除用户账户失败:', error);
      throw error;
    }
  }

  /**
   * 检查用户认证状态 (简化版)
   */
  async checkAuthStatus(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      if (!token) {
        return false;
      }
      
      // 简单验证 token 格式（JWT 应该有3个部分）
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        return false; // 不调用 clearAuthData()
      }


      
      return true;
    } catch (error) {
      Logger.error(LogModule.AUTH, '❌ 检查认证状态异常:', error);
      
      // 🔥 修复：不要立即清除数据，先分析错误类型
      if (error instanceof Error) {
        if (error.message.includes('storage') || error.message.includes('AsyncStorage')) {
          return false; // 暂时返回 false，但不清除数据
        }
        
        if (error.message.includes('JSON') || error.message.includes('parse')) {
          return false;
        }
      }
      
      // 只有在确认是严重错误时才清除
      await this.clearAuthData().catch(() => {}); // 忽略清理失败
      return false;
    }
  }

  // ========================= 存储管理方法 =========================

  /**
   * 获取本地存储的访问Token
   */
  async getStoredToken(): Promise<string | null> {
    try {
      return await Storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      Logger.warn(LogModule.AUTH, '获取存储token失败:', error);
      return null;
    }
  }

  /**
   * 获取本地存储的用户信息
   */
  async getStoredUser(): Promise<User | null> {
    try {
      return await Storage.getObject<User>(STORAGE_KEYS.USER_PROFILE);
    } catch (error) {
      Logger.warn(LogModule.AUTH, '获取存储用户信息失败:', error);
      return null;
    }
  }

  /**
   * 保存认证数据 (token + user)
   */
  private async storeAuthData(token: string, user: User): Promise<void> {
    try {
      await Promise.all([
        Storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token),
        Storage.setObject(STORAGE_KEYS.USER_PROFILE, user)
      ]);
      Logger.debug(LogModule.AUTH, '认证数据保存成功');
    } catch (error) {
      Logger.error(LogModule.AUTH, '保存认证数据失败:', error);
      throw new Error('保存认证数据失败');
    }
  }

  /**
   * 清除认证数据
   */
  private async clearAuthData(): Promise<void> {
    try {
      await Promise.all([
        Storage.removeItem(STORAGE_KEYS.AUTH_TOKEN),
        Storage.removeItem(STORAGE_KEYS.USER_PROFILE)
      ]);
    } catch (error) {
      Logger.warn(LogModule.AUTH, '清除认证数据时出错:', error);
      // 不抛出错误，登出操作应该总是成功
    }
  }

  // ========================= 辅助方法 =========================

  /**
   * 解析 JWT Token 获取载荷数据
   */
  private parseJWTToken(token: string) {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      throw new Error('JWT Token 解析失败');
    }
  }

  /**
   * 从 Token 载荷构建用户对象
   */
  private buildUserObjectFromToken(tokenPayload: any, originalData: any): User {
    const safeString = (value: any): string => value != null ? String(value) : '';
    
    return {
      id: safeString(tokenPayload.id || originalData.id),
      email: safeString(tokenPayload.email || originalData.email),
      name: safeString(tokenPayload.name || originalData.name),
      avatar: undefined, // 一键登录暂不支持头像
      clerk_user_id: safeString(tokenPayload.auth0_sub || originalData.auth0_sub),
      authType: 'one_click', // 🔥 标记为一键登录
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        language: 'en', // 默认英语（用户可以在设置中更改）
        currency: 'USD',
        theme: 'auto',
        notifications: {
          priceAlerts: true,
          newsUpdates: true,
          portfolioUpdates: true,
          marketOpen: true,
          marketClose: true,
        },
        markets: {
          watchlistLimit: 50,
          defaultChartPeriod: '1D',
        },
      },
    };
  }

  /**
   * 生成随机用户数据用于一键登录
   */
  private generateRandomUserData() {
    // 生成随机 UUID
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };

    // 生成随机数字串
    const generateRandomNumber = (length: number) => {
      return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
    };

    // 随机用户名列表
    const userNames = [
      'Demo_User', 'Test_User', 'Guest_User', 'Trial_User', 'Sample_User',
      'MarketNews_User', 'Quick_User', 'Fast_User', 'Easy_User', 'Simple_User'
    ];

    const id = `one-click-${generateUUID()}`;
    const auth0_sub = `one-click-login|${generateRandomNumber(21)}`;
    const name = `${userNames[Math.floor(Math.random() * userNames.length)]}_${generateRandomNumber(4)}`;
    const email = `${name.toLowerCase()}@marketnews.demo`;
    const app_id = AppConfig.APP_ID;

    Logger.debug(LogModule.AUTH, '生成的随机用户数据:', { id, auth0_sub, name, email, app_id });

    return {
      id,
      auth0_sub,
      name,
      email,
      app_id
    };
  }

  /**
   * 解析 Clerk token (简化版)
   */
  private parseClerkToken(token: string): ClerkUserInfo {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      
      return {
        sub: decoded.sub || '',
        name: decoded.name || '',
        email: decoded.email || '',
        email_verified: decoded.email_verified || false,
        picture: decoded.picture,
        given_name: decoded.given_name,
        family_name: decoded.family_name,
      };
    } catch {
      throw new Error('Clerk token 解析失败');
    }
  }

  /**
   * 构建用户对象 (简化版)
   */
  private buildUserObject(account: any, clerkData: ClerkUserInfo, clerkUserInfo?: any): User {
    const safeString = (value: any): string => value != null ? String(value) : '';
    
    return {
      id: safeString(account.id),
      email: safeString(account.email || clerkData.email),
      name: safeString(account.name || clerkData.name),
      avatar: safeString(account.picture || clerkUserInfo?.imageUrl || clerkData.picture) || undefined,
      clerk_user_id: safeString(account.auth0Sub || clerkData.sub),
      authType: 'clerk_sso', // 🔥 标记为 Clerk SSO 登录
      createdAt: safeString(account.createdAt) || new Date().toISOString(),
      updatedAt: safeString(account.updatedAt) || new Date().toISOString(),
      preferences: account.preferences || {
        language: 'en' as const, // 默认英语（用户可以在设置中更改）
        currency: 'USD' as const,
        theme: 'auto' as const,
        notifications: {
          priceAlerts: false,
          newsUpdates: false,
          portfolioUpdates: false,
          marketOpen: false,
          marketClose: false,
        },
        markets: {
          watchlistLimit: 10,
          defaultChartPeriod: '1D' as const,
        },
      },
    };
  }

  /**
   * 映射HTTP错误到用户友好的消息
   */
  private mapHttpErrorToMessage(status: number, errorText: string): string {
    switch (status) {
      case 401:
      case 403:
        return 'Authentication failed: Please login again';
      case 400:
        return 'Invalid request parameters: Please retry login';
      case 500:
      case 502:
      case 503:
        return `Server error (${status}): Please try again later`;
      case 408:
        return 'Request timeout: Please check your network connection';
      default:
        return `Request failed (${status}): ${errorText || 'Unknown error'}`;
    }
  }


  /**
   * 验证签名格式是否正确（用于调试）
   * 
   * 合并自 apiAuth.ts
   * 
   * @param signature 签名字符串
   * @returns boolean 格式是否正确
   */
  validateSignatureFormat(signature: string): boolean {
    const parts = signature.split('.');
    if (parts.length !== 2) {
      return false;
    }
    
    const [timestamp, sig] = parts;
    
    // 验证时间戳是否为数字
    if (isNaN(parseInt(timestamp))) {
      return false;
    }
    
    // 验证签名是否为64位十六进制字符串（SHA256的输出长度）
    if (!/^[a-f0-9]{64}$/i.test(sig)) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查签名是否过期（用于调试）
   * 
   * 合并自 apiAuth.ts
   * 
   * @param signature 签名字符串
   * @param windowSeconds 时间窗口（秒），默认300秒
   * @returns boolean 是否过期
   */
  isSignatureExpired(signature: string, windowSeconds: number = 300): boolean {
    try {
      const parts = signature.split('.');
      if (parts.length !== 2) {
        return true;
      }
      
      const timestamp = parseInt(parts[0]);
      const now = Math.floor(Date.now() / 1000);
      
      return Math.abs(now - timestamp) > windowSeconds;
    } catch {
      return true;
    }
  }
}

// 导出服务实例
export const authService = new AuthService(); export default authService;
