import { createLogger } from '../utils/logger';
import { unauthorized } from '../utils/response';

const logger = createLogger('ApiAuth');

/**
 * 生成HMAC-SHA256签名
 */
async function generateHMACSignature(message: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(message)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * API HMAC认证中间件
 * 验证请求头中的X-API-Signature签名
 */
export const apiAuthMiddleware = async (c: any, next: () => Promise<void>) => {
  const startTime = Date.now();
  const signature = c.req.header('X-API-Signature');
  const path = c.req.path;

  // 检查签名头是否存在
  if (!signature) {
    logger.warn('API请求缺少签名', { 
      path,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP')
    });
    return c.json(unauthorized('Missing API signature'), 401);
  }

  try {
    // 解析签名格式: timestamp.signature
    const parts = signature.split('.');
    if (parts.length !== 2) {
      logger.warn('API签名格式错误', { path, signature: signature.substring(0, 20) + '...' });
      return c.json(unauthorized('Invalid signature format'), 401);
    }

    const [timestamp, receivedSignature] = parts;

    // 验证时间戳格式
    const requestTime = parseInt(timestamp);
    if (isNaN(requestTime)) {
      logger.warn('时间戳格式错误', { path, timestamp });
      return c.json(unauthorized('Invalid timestamp'), 401);
    }

    // 检查时间窗口（5分钟有效期）
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - requestTime);
    
    if (timeDiff > 300) { // 5分钟 = 300秒
      logger.warn('请求已过期', { 
        path, 
        timeDiff, 
        requestTime, 
        currentTime: now 
      });
      return c.json(unauthorized('Request expired'), 401);
    }

    // 获取密钥
    const secretKey = c.env.API_SECRET_KEY;
    if (!secretKey) {
      logger.error('API密钥未配置');
      return c.json(unauthorized('Server configuration error'), 500);
    }

    // 生成期望的签名
    const expectedSignature = await generateHMACSignature(timestamp, secretKey);

    // 验证签名
    if (expectedSignature !== receivedSignature) {
      logger.warn('API签名验证失败', { 
        path,
        expectedLength: expectedSignature.length,
        receivedLength: receivedSignature.length,
        timestamp
      });
      return c.json(unauthorized('Invalid signature'), 401);
    }

    // 验证成功，记录日志
    logger.info('API认证成功', { 
      path,
      timestamp,
      duration: `${Date.now() - startTime}ms`
    });

    // 继续处理请求
    await next();

  } catch (error: any) {
    logger.error('API认证异常', { 
      path,
      error: error.message,
      signature: signature?.substring(0, 20) + '...'
    });
    return c.json(unauthorized('Authentication failed'), 401);
  }
};

/**
 * 导出HMAC签名生成函数供测试使用
 */
export { generateHMACSignature }; 