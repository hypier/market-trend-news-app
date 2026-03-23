import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { success, unauthorized, paramError, serverError } from '../utils/response';
import { createLogger } from '../utils/logger';
import type { Env } from '../types/env.d';

const logger = createLogger('AuthRoutes');

// 定义路由器
const router = new Hono<{ Bindings: Env }>();

// 请求体验证schema
const tokenRequestSchema = z.object({
  id: z.string().min(1, 'User ID cannot be empty'),
  auth0_sub: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  app_id: z.string().optional()
});

// Clerk 会话撤销请求 schema
const clerkSessionRevokeSchema = z.object({
  sessionId: z.string().min(1, 'Session ID cannot be empty')
});

// Clerk token 验证请求 schema
const clerkVerifySchema = z.object({
  session_token: z.string().min(1, 'Session token cannot be empty')
});

// 获取JWT令牌
router.post('/token', 
  zValidator('json', tokenRequestSchema),
  async (c) => {
    try {
      const userInfo = c.req.valid('json');
      
      // 创建Auth服务实例
      const authService = new AuthService(c.env);
      
      // 调用服务层生成令牌
      const token = await authService.generateUserToken(userInfo);

      // 返回成功响应
      return c.json(success({ token }, 'Token generated successfully'));
    } catch (error: any) {
      logger.error('生成令牌失败', error);
      return c.json(paramError(error.message), 400);
    }
  }
);

// 验证令牌
router.get('/verify', async (c) => {
  try {
    const authorization = c.req.header('Authorization');
    if (!authorization) {
      return c.json(unauthorized('Missing authorization token'), 401);
    }

    // 提取token
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return c.json(unauthorized('Invalid authorization format'), 401);
    }

    const token = parts[1];
    
    // 创建Auth服务实例
    const authService = new AuthService(c.env);
    
    // 调用服务层验证令牌
    const result = await authService.validateToken(token);
    
    // 返回成功响应
    return c.json(success({ 
      valid: true, 
      userId: result.userId 
    }, 'Token valid'));
  } catch (error: any) {
    logger.error('令牌验证失败', error);
    return c.json(unauthorized('Token invalid or expired'), 401);
  }
});

// 撤销令牌（登出）
router.post('/revoke', async (c) => {
  try {
    const authorization = c.req.header('Authorization');
    if (!authorization) {
      return c.json(unauthorized('Missing authorization token'), 401);
    }

    // 提取token
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return c.json(unauthorized('Invalid authorization format'), 401);
    }

    const token = parts[1];
    
    // 创建Auth服务实例
    const authService = new AuthService(c.env);
    
    // 验证令牌以确保其有效（用于日志记录）
    try {
      await authService.validateToken(token);
      logger.info('令牌撤销请求', { token: token.substring(0, 10) + '...' });
    } catch (error: any) {
      // 即使令牌无效也允许撤销（可能是已过期的令牌）
      logger.warn('撤销令牌时验证失败', { error: error.message });
    }
    
    // 返回成功响应
    // 注意：JWT是无状态的，这里只是记录日志，客户端应删除本地存储的令牌
    return c.json(success(null, 'Token revoked successfully'));
  } catch (error: any) {
    logger.error('撤销令牌失败', error);
    return c.json(paramError(error.message), 400);
  }
});

// Clerk token 验证端点 - POST
router.post('/clerk/verify',
  zValidator('json', clerkVerifySchema),
  async (c) => {
    try {
      const { session_token } = c.req.valid('json');
      
      // 从 header 获取 appId
      const appId = c.req.header('appId');
      if (!appId) {
        return c.json(paramError('appId header is required'), 400);
      }

      // 创建Auth服务实例
      const authService = new AuthService(c.env);
      
      // 验证 Clerk token 并生成 JWT
      const result = await authService.verifyClerkToken(session_token, appId);

      // 返回标准响应格式（与外部 API 兼容）
      return c.json(success({
        token: result.token,
        account: result.user,
        clerk_user_id: result.clerkUserId,
        clerk_user_info: result.clerkUserInfo,
      }, 'Clerk token verified successfully'));
    } catch (error: any) {
      logger.error('Clerk 验证失败', error);
      // 根据错误类型返回不同的状态码
      if (error.message.includes('Session token') || error.message.includes('App ID')) {
        return c.json(paramError(error.message), 400);
      }
      if (error.message.includes('验证失败') || error.message.includes('Token invalid')) {
        return c.json(unauthorized(error.message), 401);
      }
      return c.json(serverError(error.message), 500);
    }
  }
);

// Clerk token 验证端点 - GET（兼容现有前端调用）
router.get('/clerk/verify',
  zValidator('query', clerkVerifySchema.partial()),
  async (c) => {
    try {
      const { session_token } = c.req.valid('query');
      
      if (!session_token) {
        return c.json(paramError('session_token is required'), 400);
      }
      
      // 从 header 获取 appId
      const appId = c.req.header('appId');
      if (!appId) {
        return c.json(paramError('appId header is required'), 400);
      }

      // 创建Auth服务实例
      const authService = new AuthService(c.env);
      
      // 验证 Clerk token 并生成 JWT
      const result = await authService.verifyClerkToken(session_token, appId);

      // 返回标准响应格式（与外部 API 兼容）
      return c.json(success({
        token: result.token,
        account: result.user,
        clerk_user_id: result.clerkUserId,
        clerk_user_info: result.clerkUserInfo,
      }, 'Clerk token verified successfully'));
    } catch (error: any) {
      logger.error('Clerk 验证失败', error);
      // 根据错误类型返回不同的状态码
      if (error.message.includes('Session token') || error.message.includes('App ID')) {
        return c.json(paramError(error.message), 400);
      }
      if (error.message.includes('验证失败') || error.message.includes('Token invalid')) {
        return c.json(unauthorized(error.message), 401);
      }
      return c.json(serverError(error.message), 500);
    }
  }
);

// 撤销 Clerk 会话
router.post('/clerk/revoke', 
  zValidator('json', clerkSessionRevokeSchema),
  async (c) => {
    try {
      const { sessionId } = c.req.valid('json');
      
      // 创建Auth服务实例
      const authService = new AuthService(c.env);
      
      // 调用服务层撤销 Clerk 会话
      const result = await authService.revokeClerkSession(sessionId);
      
      // 返回成功响应
      return c.json(success({ revoked: result }, 'Clerk session revoked successfully'));
    } catch (error: any) {
      logger.error('撤销 Clerk 会话失败', error);
      return c.json(paramError(error.message), 400);
    }
  }
);

// 注销用户账户
router.delete('/account', async (c) => {
  try {
    const authorization = c.req.header('Authorization');
    if (!authorization) {
      return c.json(unauthorized('Missing authorization token'), 401);
    }

    // 提取token
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return c.json(unauthorized('Invalid authorization format'), 401);
    }

    const token = parts[1];
    
    // 创建Auth服务实例
    const authService = new AuthService(c.env);
    
    // 先验证令牌获取用户ID
    const { userId } = await authService.validateToken(token);
    
    // 删除用户账户及相关数据
    await authService.deleteUserAccount(userId);
    
    // 返回成功响应
    // 注意：账户已删除，客户端应删除本地存储的令牌
    return c.json(success(null, 'Account deleted successfully'));
  } catch (error: any) {
    logger.error('注销用户账户失败', error);
    if (error.message.includes('令牌')) {
      return c.json(unauthorized('Token invalid or expired'), 401);
    }
    return c.json(serverError(error.message), 500);
  }
});

export default router; 