import { Env } from '../../types/env';
import { createLogger } from '../../utils/logger';

/**
 * Clerk API 集成客户端
 * 负责封装所有 Clerk API 调用
 */
export class ClerkApiClient {
  private readonly baseUrl = 'https://api.clerk.com/v1';
  private readonly apiKey: string;
  private logger = createLogger('ClerkAPI');

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Clerk API 密钥不能为空');
    }
    this.apiKey = apiKey;
    
    this.logger.info('ClerkApiClient 初始化', { 
      keyPreview: apiKey.substring(0, 8) + '...'
    });
  }

  /**
   * 撤销 Clerk 会话
   * @param sessionId 要撤销的会话ID
   * @returns 操作是否成功
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    const startTime = Date.now();
    this.logger.info(`开始撤销会话`, { sessionId });
    
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('会话ID不能为空');
    }

    try {
      const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        this.logger.error(`撤销会话失败`, { 
          sessionId, 
          status: response.status,
          error: errorData,
          duration: `${duration}ms`
        });
        return false;
      }
      
      this.logger.info(`会话撤销成功`, { 
        sessionId, 
        duration: `${duration}ms` 
      });
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`撤销会话异常`, { 
        sessionId, 
        duration: `${duration}ms`, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * 删除 Clerk 用户
   * @param userId Clerk 用户ID
   * @returns 操作是否成功
   */
  async deleteUser(userId: string): Promise<boolean> {
    const startTime = Date.now();
    this.logger.info(`开始删除用户`, { userId });
    
    if (!userId || userId.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        this.logger.error(`删除用户失败`, { 
          userId, 
          status: response.status,
          error: errorData,
          duration: `${duration}ms`
        });
        return false;
      }
      
      this.logger.info(`用户删除成功`, { 
        userId, 
        duration: `${duration}ms` 
      });
      
      return true;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error(`删除用户异常`, { 
        userId, 
        duration: `${duration}ms`, 
        error: error.message 
      });
      throw error;
    }
  }
}

/**
 * 创建 ClerkApiClient 实例
 * @param env 环境变量
 * @returns ClerkApiClient 实例
 */
export function createClerkApiClient(env: Env): ClerkApiClient {
  const apiKey = env.CLERK_SECRET_KEY;
  
  if (!apiKey) {
    throw new Error('环境变量中缺少 CLERK_SECRET_KEY');
  }
  
  return new ClerkApiClient(apiKey);
} 