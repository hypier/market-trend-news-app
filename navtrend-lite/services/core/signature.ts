import * as CryptoJS from 'crypto-js';
import { Logger, LogModule } from '@/utils/logger';
import { AppConfig } from '@/config/app';

/**
 * API 签名服务
 * 
 * 提供API请求签名功能，用于API安全验证
 * 从 authService 中分离出来，避免循环依赖
 */

/**
 * 生成HMAC-SHA256签名
 * 
 * 使用 crypto-js 实现 HMAC-SHA256，兼容 Expo 环境
 * 
 * @param message 要签名的消息（通常是时间戳）
 * @param secretKey 密钥
 * @returns string 十六进制格式的签名
 */
function generateHMACSignature(message: string, secretKey: string): string {
  try {
    // 使用 crypto-js 的 HmacSHA256 函数
    const signature = CryptoJS.HmacSHA256(message, secretKey);
    // 转换为十六进制字符串
    return signature.toString(CryptoJS.enc.Hex);
  } catch (error) {
    Logger.error(LogModule.API, '生成HMAC签名失败:', error);
    throw new Error('Failed to generate HMAC signature');
  }
}

/**
 * 生成API请求签名
 * 
 * 格式: timestamp.signature
 * 
 * @returns Promise<string> 完整的签名字符串
 */
export async function generateApiSignature(): Promise<string> {
  try {
    // 生成当前时间戳（秒级）
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // 获取API密钥
    const API_SECRET_KEY = AppConfig.API_SECRET_KEY;
    
    // 生成HMAC签名
    const signature = generateHMACSignature(timestamp, API_SECRET_KEY);
    
    // 返回格式：时间戳.签名
    return `${timestamp}.${signature}`;
  } catch (error) {
    Logger.error(LogModule.API, '生成API签名失败:', error);
    throw new Error('Failed to generate API signature');
  }
}

