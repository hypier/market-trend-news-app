import * as jwt from 'jsonwebtoken';

/**
 * JWT负载接口
 * 基于Auth0的JWT结构定义
 */
export interface JwtPayload {
  id: string;                    // 用户唯一ID
  auth0_sub?: string;             // Auth0用户标识符（兼容字段，现在存储Clerk用户ID）
  name?: string;                  // 用户姓名
  email?: string;                 // 用户邮箱
  app_id?: string;                // 应用ID
  picture?: string;                // 用户头像URL
  // 注意：language 不在 JWT 中，由应用层根据用户偏好或设备设置决定
  exp: number;                   // 过期时间戳
  iat?: number;                  // 签发时间戳（可选）
}

/**
 * 生成JWT令牌
 * @param payload JWT负载数据
 * @param secret 密钥
 * @param expiresIn 过期时间（秒）
 * @returns JWT令牌
 */
export function generateToken(
  payload: Omit<JwtPayload, 'exp' | 'iat'>, 
  secret: string, 
  expiresIn = 86400 // 默认1天
): string {
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * 验证JWT令牌
 * @param token JWT令牌
 * @param secret 密钥
 * @returns 解码后的负载数据
 */
export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}

/**
 * 解码JWT令牌（不验证）
 * @param token JWT令牌
 * @returns 解码后的负载数据
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * 从请求中提取JWT令牌
 * @param authorization 请求头中的Authorization字段值
 * @returns JWT令牌或null
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) return null;
  
  // 检查Bearer格式
  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
} 