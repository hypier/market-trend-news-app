import * as Crypto from 'expo-crypto';

/**
 * 生成UUID v4
 * @returns string UUID字符串
 */
export function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * 生成模拟的Auth0 sub
 * @param username 用户名
 * @returns string 模拟的Auth0 sub
 */
export function generateAuth0Sub(username: string): string {
  // 生成一个基于用户名的数字ID（模拟Google OAuth2的格式）
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const numericId = Math.abs(hash).toString().padStart(18, '0').slice(0, 18);
  return `google-oauth2|${numericId}`;
}

/**
 * 根据用户名生成邮箱
 * @param username 用户名
 * @returns string 生成的邮箱地址
 */
export function generateEmail(username: string): string {
  // 移除特殊字符，只保留字母数字和中文
  const cleanUsername = username.replace(/[^\w\u4e00-\u9fa5]/g, '');
  return `${cleanUsername}@marketnews.temp`;
}

/**
 * 固定的应用ID（与API请求示例一致）
 */
export const APP_ID = 'a4da4844-3424-405f-97a4-a561103df65d'; 