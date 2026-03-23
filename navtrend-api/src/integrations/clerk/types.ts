/**
 * Clerk 会话撤销请求参数
 */
export interface ClerkSessionRevokeParams {
  sessionId: string;
}

/**
 * Clerk 用户删除请求参数
 */
export interface ClerkUserDeleteParams {
  userId: string;
}

/**
 * Clerk API 错误响应
 */
export interface ClerkErrorResponse {
  status: number;
  message: string;
  error?: any;
}

/**
 * Clerk 会话信息
 */
export interface ClerkSession {
  id: string;
  clientId: string;
  userId: string;
  status: string;
  lastActiveAt: string;
  expireAt: string;
  abandonAt: string;
} 