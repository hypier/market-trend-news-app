import { MiddlewareHandler } from 'hono';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { unauthorized } from '../utils/response';
import { createLogger } from '../utils/logger';
import type { Env } from '../types/env.d';

const logger = createLogger('AuthMiddleware');

/**
 * JWT认证中间件
 * 验证请求头中的JWT令牌
 */
export const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: {
    user: any;
    userId: string;
  };
}> = async (c, next) => {
  try {
    const env = c.env;
    
    // 检查JWT密钥配置
    if (!env.JWT_SECRET) {
      logger.error('JWT_SECRET环境变量未设置');
      return c.json(unauthorized('Authentication configuration error'), 401);
    }

    const authorization = c.req.header('Authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return c.json(unauthorized('Missing or invalid authorization token'), 401);
    }

    try {
      // 验证JWT令牌
      const payload = verifyToken(token, env.JWT_SECRET);
      
      // 提取用户ID
      const userId = payload.id;
      
      if (!userId) {
        logger.error('JWT payload中缺少用户ID', { payload });
        return c.json(unauthorized('Invalid token payload'), 401);
      }
      
      // 将用户信息和用户ID添加到请求上下文
      c.set('user', payload);
      c.set('userId', userId);
      
      await next();
    } catch (error: any) {
      logger.error('Token验证失败', error);
      return c.json(unauthorized('Invalid or expired token'), 401);
    }
  } catch (error: any) {
    logger.error('认证中间件执行失败', error);
    return c.json(unauthorized('Authentication failed'), 401);
  }
}; 