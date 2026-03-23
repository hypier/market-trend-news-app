import { generateToken, verifyToken } from '../utils/jwt';
import { createDbService } from '../db';
import { portfolios, watchlists, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { Env } from '../types/env.d';
import { createClerkApiClient } from '../integrations/clerk/client';
import { createLogger } from '../utils/logger';
import { verifyToken as clerkVerifyToken, createClerkClient } from '@clerk/backend';

export class AuthService {
  private logger = createLogger('AuthService');
  
  constructor(private env: Env) {}

  /**
   * 生成JWT令牌
   * @param userInfo 用户信息
   */
  async generateUserToken(userInfo: {
    id: string;
    auth0_sub?: string;
    name?: string;
    email?: string;
    app_id?: string;
    picture?: string;
    // 注意：language 不在 JWT 中，由应用层决定
  }): Promise<string> {
    // 验证用户信息
    if (!userInfo.id || userInfo.id.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }

    // 检查JWT密钥配置
    const jwtSecret = this.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT密钥未配置');
    }

    // 生成令牌
    const token = generateToken(userInfo, jwtSecret);
    
    return token;
  }

  /**
   * 验证JWT令牌
   */
  async validateToken(token: string): Promise<{ userId: string }> {
    // 验证令牌格式
    if (!token || token.trim().length === 0) {
      throw new Error('令牌不能为空');
    }

    // 检查JWT密钥配置
    const jwtSecret = this.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT密钥未配置');
    }

    try {
      // 验证令牌
      const payload = verifyToken(token, jwtSecret);
      
      // 验证payload结构
      if (!payload.id) {
        throw new Error('令牌payload无效');
      }

      return { userId: payload.id };
    } catch (error: any) {
      throw new Error(`令牌验证失败: ${error.message}`);
    }
  }


  /**
   * 撤销 Clerk 会话
   * @param sessionId Clerk 会话 ID
   * @returns 操作是否成功
   */
  async revokeClerkSession(sessionId: string): Promise<boolean> {
    this.logger.info('开始撤销 Clerk 会话', { sessionId });
    
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error('会话ID不能为空');
    }

    try {
      // 创建 Clerk API 客户端
      const clerkClient = createClerkApiClient(this.env);
      
      // 撤销会话
      const success = await clerkClient.revokeSession(sessionId);
      
      this.logger.info('Clerk 会话撤销结果', { sessionId, success });
      return success;
    } catch (error: any) {
      this.logger.error('撤销 Clerk 会话失败', { sessionId, error: error.message });
      throw new Error(`撤销 Clerk 会话失败: ${error.message}`);
    }
  }

  /**
   * 验证 Clerk session token 并生成应用 JWT token
   * @param sessionToken Clerk session token
   * @param appId 应用ID
   * @returns 包含 JWT token、用户信息和 Clerk 用户信息的对象
   */
  async verifyClerkToken(
    sessionToken: string,
    appId: string
  ): Promise<{
    token: string;
    user: typeof users.$inferSelect;
    clerkUserId: string;
    clerkUserInfo: any;
  }> {
    const startTime = Date.now();
    this.logger.info('开始验证 Clerk token', { appId });

    try {
      // 1. 验证 Clerk session token
      const clerkSecretKey = this.env.CLERK_SECRET_KEY;
      if (!clerkSecretKey) {
        throw new Error('Clerk 密钥未配置');
      }

      if (!sessionToken || sessionToken.trim().length === 0) {
        throw new Error('Session token 不能为空');
      }

      if (!appId || appId.trim().length === 0) {
        throw new Error('App ID 不能为空');
      }

      // 使用 Clerk SDK 验证 token
      const verifiedToken = await clerkVerifyToken(sessionToken, {
        secretKey: clerkSecretKey,
      });

      const clerkUserId = verifiedToken.sub;
      this.logger.info('Clerk token 验证成功', { clerkUserId });

      // 2. 获取用户详细信息
      const clerkClient = createClerkClient({
        secretKey: clerkSecretKey,
      });

      const userInfo = await clerkClient.users.getUser(clerkUserId);
      this.logger.info('获取 Clerk 用户信息成功', { clerkUserId });

      // 3. 查找或创建用户
      const dbService = createDbService(this.env);
      const db = dbService.getDb();

      // 查找现有用户
      let user = await db
        .select()
        .from(users)
        .where(and(eq(users.clerkUserId, clerkUserId), eq(users.appId, appId)))
        .get();

      // 构建用户数据
      const fullName = [userInfo.firstName, userInfo.lastName]
        .filter(Boolean)
        .join(' ');
      const primaryEmail =
        userInfo.emailAddresses?.find(
          (email: any) => email.verification?.status === 'verified'
        )?.emailAddress || userInfo.emailAddresses?.[0]?.emailAddress;

      const displayName =
        userInfo.username ||
        userInfo.firstName ||
        `user_${clerkUserId.slice(-6)}`;
      const finalName = fullName || displayName;

      const userData = {
        clerkUserId,
        appId,
        name: finalName,
        email: primaryEmail || '',
        picture: userInfo.imageUrl || '',
        language: 'en' as const, // 默认语言，后续可由用户修改
        clerkUserInfo: {
          id: userInfo.id,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          username: userInfo.username,
          emailAddresses: userInfo.emailAddresses,
          imageUrl: userInfo.imageUrl,
          createdAt: userInfo.createdAt,
          updatedAt: userInfo.updatedAt,
        },
        isActive: true,
        // 默认推送设置
        quietHoursEnabled: false,
        timezone: 'UTC',
        maxDailyPushes: 20,
        updatedAt: new Date(),
      };

      if (user) {
        // 更新现有用户（保留推送设置和语言偏好）
        this.logger.info('更新现有用户', { userId: user.id });
        const updatedUser = await db
          .update(users)
          .set({
            name: userData.name,
            email: userData.email,
            picture: userData.picture,
            clerkUserInfo: userData.clerkUserInfo,
            updatedAt: userData.updatedAt,
            // 保留现有设置
            language: user.language,
            quietHoursEnabled: user.quietHoursEnabled,
            quietHoursStart: user.quietHoursStart,
            quietHoursEnd: user.quietHoursEnd,
            timezone: user.timezone,
            maxDailyPushes: user.maxDailyPushes,
          })
          .where(eq(users.id, user.id))
          .returning()
          .get();

        if (!updatedUser) {
          throw new Error('更新用户失败');
        }
        user = updatedUser;
      } else {
        // 创建新用户
        this.logger.info('创建新用户', { clerkUserId, appId });
        const newUser = await db
          .insert(users)
          .values({
            ...userData,
            createdAt: new Date(),
          })
          .returning()
          .get();

        if (!newUser) {
          throw new Error('创建用户失败');
        }
        user = newUser;
      }

      // 4. 生成 JWT token
      const jwtSecret = this.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT密钥未配置');
      }

      const jwtPayload = {
        id: user.id,
        auth0_sub: clerkUserId, // 保持字段名兼容
        name: user.name || '',
        email: user.email || '',
        app_id: appId,
        picture: user.picture || '',
        // 注意：language 不在 JWT 中，由应用层根据用户偏好或设备设置决定
      };

      const token = generateToken(jwtPayload, jwtSecret, 86400 * 30 * 6); // 6个月

      const duration = Date.now() - startTime;
      this.logger.info('Clerk token 验证完成', {
        userId: user.id,
        clerkUserId,
        duration: `${duration}ms`,
      });

      return {
        token,
        user,
        clerkUserId,
        clerkUserInfo: userInfo,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('Clerk token 验证失败', {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw new Error(`验证失败: ${error.message}`);
    }
  }

  /**
   * 删除用户账户及相关数据
   * @param userId 用户ID
   */
  async deleteUserAccount(userId: string): Promise<void> {
    // 验证用户ID
    if (!userId || userId.trim().length === 0) {
      throw new Error('用户ID不能为空');
    }

    // 创建数据库服务实例
    const dbService = createDbService(this.env);
    const db = dbService.getDb();

    try {
      // 使用事务确保数据一致性
      await db.transaction(async (tx) => {
        // 删除用户的投资组合数据
        await tx
          .delete(portfolios)
          .where(eq(portfolios.userId, userId))
          .returning({ id: portfolios.id });

        // 删除用户的关注列表数据
        await tx
          .delete(watchlists)
          .where(eq(watchlists.userId, userId))
          .returning({ id: watchlists.id });

      });
      
    } catch (error: any) {
      throw new Error(`删除用户账户失败: ${error.message}`);
    } finally {
      // 安全关闭数据库连接
      await dbService.close();
    }
  }
} 