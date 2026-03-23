/**
 * API响应状态码
 */
export enum StatusCode {
  SUCCESS = 200,           // 成功
  PARAM_ERROR = 400,     // 参数错误
  UNAUTHORIZED = 401,    // 未授权
  FORBIDDEN = 403,       // 禁止访问
  NOT_FOUND = 404,       // 资源不存在
  SERVER_ERROR = 500,    // 服务器错误
  SERVICE_UNAVAILABLE = 503,  // 服务不可用
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  code: number;         // 状态码
  data: T;              // 数据
  message: string;      // 消息
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 响应消息
 * @returns API响应对象
 */
export function success<T>(data: T, message = 'Operation successful'): ApiResponse<T> {
  return {
    code: StatusCode.SUCCESS,
    data,
    message
  };
}

/**
 * 创建错误响应
 * @param code 错误状态码
 * @param message 错误消息
 * @param data 错误数据（可选）
 * @returns API响应对象
 */
export function error<T = null>(code: StatusCode, message: string, data: T = null as any): ApiResponse<T> {
  return {
    code,
    data,
    message
  };
}

/**
 * 创建参数错误响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function paramError(message = 'Parameter error'): ApiResponse<null> {
  return error(StatusCode.PARAM_ERROR, message);
}

/**
 * 创建未授权响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function unauthorized(message = 'Unauthorized'): ApiResponse<null> {
  return error(StatusCode.UNAUTHORIZED, message);
}

/**
 * 创建禁止访问响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function forbidden(message = 'Forbidden'): ApiResponse<null> {
  return error(StatusCode.FORBIDDEN, message);
}

/**
 * 创建资源不存在响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function notFound(message = 'Resource not found'): ApiResponse<null> {
  return error(StatusCode.NOT_FOUND, message);
}

/**
 * 创建服务器错误响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function serverError(message = 'Server error'): ApiResponse<null> {
  return error(StatusCode.SERVER_ERROR, message);
}

/**
 * 创建服务不可用响应
 * @param message 错误消息
 * @returns API响应对象
 */
export function serviceUnavailable(message = 'Service temporarily unavailable'): ApiResponse<null> {
  return error(StatusCode.SERVICE_UNAVAILABLE, message);
} 