/**
 * 统一错误处理工具类
 * 集中管理API错误、认证错误等处理逻辑
 */
export class ErrorHandler {
  /**
   * 检查是否为认证错误
   */
  static isAuthError(error: string | Error | null): boolean {
    if (!error) return false;
    const errorMessage = typeof error === 'string' ? error : error.message;
    return errorMessage.includes('401') || 
           errorMessage.includes('Unauthorized') ||
           errorMessage.includes('Authentication failed');
  }

  /**
   * 检查是否为网络错误
   */
  static isNetworkError(error: string | Error | null): boolean {
    if (!error) return false;
    const errorMessage = typeof error === 'string' ? error : error.message;
    return errorMessage.includes('Network') ||
           errorMessage.includes('Failed to fetch') ||
           errorMessage.includes('timeout') ||
           errorMessage.includes('网络');
  }

  /**
   * 检查是否应该停止重试
   * 认证错误、客户端错误(4xx)等不应该重试
   */
  static shouldStopRetry(error: string | Error | null): boolean {
    if (!error) return false;
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    // 401认证错误
    if (this.isAuthError(errorMessage)) return true;
    
    // 其他4xx客户端错误
    if (errorMessage.includes('400') || 
        errorMessage.includes('403') || 
        errorMessage.includes('404')) return true;
    
    return false;
  }

  /**
   * 获取用户友好的错误消息
   */
  static getUserFriendlyMessage(error: string | Error | null): string {
    if (!error) return '未知错误';
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (this.isAuthError(errorMessage)) {
      return '身份验证失败，请重新登录';
    }
    
    if (this.isNetworkError(errorMessage)) {
      return '网络连接异常，请检查网络后重试';
    }
    
    if (errorMessage.includes('500')) {
      return '服务器错误，请稍后重试';
    }
    
    return errorMessage;
  }

  /**
   * 记录错误信息
   */
  static logError(context: string, error: string | Error | null, extraData?: any) {
    if (!error) return;
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const logData = {
      context,
      error: errorMessage,
      isAuthError: this.isAuthError(error),
      isNetworkError: this.isNetworkError(error),
      shouldStopRetry: this.shouldStopRetry(error),
      timestamp: new Date().toISOString(),
      ...extraData,
    };
    
    if (this.isAuthError(error)) {
      console.warn(`[${context}] Auth Error:`, logData);
    } else if (this.isNetworkError(error)) {
      console.warn(`[${context}] Network Error:`, logData);
    } else {
      console.error(`[${context}] Error:`, logData);
    }
  }
} 