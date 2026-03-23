import type { Env } from '../types/env.d';
import { createLogger } from '../utils/logger';
import Cloudflare from 'cloudflare';

/**
 * 缓存服务 - 处理所有缓存相关操作
 * 提供通用的缓存读写、批量操作和辅助功能
 * 
 * Cloudflare KV 最佳实践：
 * - 批量读取使用原生 KV batch API (最多100个键)
 * - 批量写入使用混合策略：
 *   * 小批量(<20项)：使用KV binding并行写入
 *   * 大批量(≥20项)：使用官方Cloudflare SDK批量写入（最多10,000项）
 * - TTL 抖动防止缓存雪崩
 * - 键大小控制和数据压缩
 * - 智能错误处理和降级机制
 * - 自动配置检测和策略选择
 * - 官方SDK提供更好的类型安全和错误处理
 */
export class CacheService {
  private cachePrefix: string;
  private logger = createLogger('CacheService');
  private cloudflareClient: Cloudflare | null = null;
  
  // KV 性能优化常量
  private static readonly KV_LIMITS = {
    MAX_BATCH_READ: 100,        // KV 批量读取限制
    MAX_BATCH_WRITE: 8,         // KV 批量写入推荐限制（binding模式）
    MAX_KEY_SIZE: 512,          // KV 键大小限制 (字节)
    MAX_VALUE_SIZE: 25 * 1024 * 1024, // KV 值大小限制 (25MB)
    WRITE_BATCH_DELAY: 50,      // 批量写入间隔 (毫秒)
  } as const;
  
  // REST API 批量写入常量
  private static readonly REST_API_LIMITS = {
    MAX_BULK_WRITE: 10000,      // REST API批量写入限制
    MAX_REQUEST_SIZE: 100 * 1024 * 1024, // REST API请求大小限制 (100MB)
    USE_REST_API_THRESHOLD: 20, // 使用REST API的阈值
  } as const;
  
  /**
   * 创建缓存服务实例
   * @param env 环境变量，包含CACHE对象
   * @param prefix 缓存键前缀，用于隔离不同模块的缓存
   */
  constructor(
    private env: Env,
    prefix: string = 'v1:'
  ) {
    this.cachePrefix = prefix;
    
    // 初始化Cloudflare SDK客户端（如果配置可用）
    if (this.isRestApiAvailable()) {
      try {
        this.cloudflareClient = new Cloudflare({
          apiToken: this.env.CLOUDFLARE_API_TOKEN!,
        });
        this.logger.info('Cloudflare SDK客户端初始化成功');
      } catch (error: any) {
        this.logger.warn('Cloudflare SDK客户端初始化失败', error);
        this.cloudflareClient = null;
      }
    }
    
    this.logger.info(`CacheService已初始化，前缀: ${prefix}`, {
      restApiAvailable: this.isRestApiAvailable(),
      sdkClientAvailable: !!this.cloudflareClient,
      restApiThreshold: CacheService.REST_API_LIMITS.USE_REST_API_THRESHOLD
    });
  }
  
  /**
   * 获取缓存值
   * @param key 缓存键（不含前缀）
   * @returns 解析后的缓存值或null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.env.CACHE) return null;
      
      const cacheKey = this.formatKey(key);
      this.validateKeySize(cacheKey);
      
      const cached = await this.env.CACHE.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached) as T;
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`缓存读取失败: ${key}`, error);
      return null;
    }
  }
  
  /**
   * 设置缓存值
   * @param key 缓存键（不含前缀）
   * @param value 要缓存的值（将被JSON序列化）
   * @param ttl 过期时间（秒）
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    try {
      if (!this.env.CACHE) return;
      
      const cacheKey = this.formatKey(key);
      this.validateKeySize(cacheKey);
      
      const serializedValue = JSON.stringify(value);
      this.validateValueSize(serializedValue);
      
      await this.env.CACHE.put(
        cacheKey, 
        serializedValue, 
        { expirationTtl: this.addJitter(ttl) }
      );
    } catch (error) {
      this.logger.warn(`缓存写入失败: ${key}`, error);
    }
  }
  
  /**
   * 异步写入缓存（不阻塞）
   * 适用于不需要等待写入完成的情况，如后台更新缓存
   * @param key 缓存键（不含前缀）
   * @param value 要缓存的值
   * @param ttl 过期时间（秒）
   */
  setAsync<T>(key: string, value: T, ttl: number): void {
    this.set(key, value, ttl).catch(err => 
      this.logger.error(`缓存异步写入失败: ${key}`, err)
    );
  }
  
  /**
   * 删除缓存
   * @param key 缓存键（不含前缀）
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.env.CACHE) return;
      
      const cacheKey = this.formatKey(key);
      await this.env.CACHE.delete(cacheKey);
    } catch (error) {
      this.logger.warn(`缓存删除失败: ${key}`, error);
    }
  }
  
  /**
   * 批量获取缓存
   * 使用 KV 原生批量读取 API，更高效
   * @param keys 缓存键数组（不含前缀）
   * @returns 键值对形式的缓存结果
   */
  async batchGet<T>(keys: string[]): Promise<Record<string, T | null>> {
    const results: Record<string, T | null> = {};
    
    if (!this.env.CACHE || keys.length === 0) {
      return results;
    }
    
    try {
      // KV 批量读取最多支持 100 个键，超过需要分批
      const batchSize = CacheService.KV_LIMITS.MAX_BATCH_READ;
      
      for (let i = 0; i < keys.length; i += batchSize) {
        const batch = keys.slice(i, i + batchSize);
        const formattedKeys = batch.map(key => this.formatKey(key));
        
        // 验证键大小
        formattedKeys.forEach(key => this.validateKeySize(key));
        
        // 使用 KV 原生批量读取
        const kvResults: Map<string, string | null> = await this.env.CACHE.get(formattedKeys);
        
        // 处理结果
        batch.forEach((originalKey, index) => {
          const formattedKey = formattedKeys[index];
          const value = kvResults.get(formattedKey);
          
          if (value) {
            try {
              results[originalKey] = JSON.parse(value) as T;
            } catch (parseError) {
              this.logger.warn(`缓存值解析失败: ${originalKey}`, parseError);
              results[originalKey] = null;
            }
          } else {
            results[originalKey] = null;
          }
        });
      }
      
      this.logger.debug(`批量获取缓存完成`, {
        keysCount: keys.length,
        hitCount: Object.values(results).filter(v => v !== null).length
      });
      
    } catch (error) {
      this.logger.warn(`批量缓存读取失败`, error);
      
      // 降级到单个请求模式
      const fallbackResults = await Promise.all(
        keys.map(key => this.get<T>(key))
      );
      
      keys.forEach((key, index) => {
        results[key] = fallbackResults[index];
      });
    }
    
    return results;
  }
  
  /**
   * 批量设置缓存（智能策略选择）
   * 自动选择最优的批量写入策略：
   * - 小批量(<20项)：使用KV binding并行写入
   * - 大批量(≥20项)：使用Cloudflare SDK批量写入（如果配置可用）
   * - SDK失败时自动降级到binding模式
   * @param items 键值对形式的数据
   * @param ttl 过期时间（秒）
   */
  async batchSet<T>(items: Record<string, T>, ttl: number): Promise<void> {
    if (!this.env.CACHE || Object.keys(items).length === 0) {
      return;
    }

    const itemCount = Object.keys(items).length;
    const startTime = Date.now();
    
    try {
      // 智能策略选择：大批量优先使用Cloudflare SDK
      if (itemCount >= CacheService.REST_API_LIMITS.USE_REST_API_THRESHOLD && this.cloudflareClient) {
        this.logger.info(`使用Cloudflare SDK批量写入`, {
          itemCount,
          threshold: CacheService.REST_API_LIMITS.USE_REST_API_THRESHOLD
        });
        
        try {
          await this.batchSetViaCloudflareSDK(items, ttl);
          
          const duration = Date.now() - startTime;
          this.logger.info(`Cloudflare SDK批量写入成功`, {
            itemCount,
            duration: `${duration}ms`,
            requestsReduced: `${itemCount}→1 (${Math.round((1 - 1/itemCount) * 100)}%减少)`
          });
          return;
        } catch (error: any) {
          this.logger.warn('Cloudflare SDK批量写入失败，降级到binding模式', { error: error.message, itemCount });
        }
      }
      
      // 降级到KV binding并行写入模式
      await this.batchSetViaBinding(items, ttl);
      
      const duration = Date.now() - startTime;
      this.logger.debug(`Binding批量写入完成`, {
        itemCount,
        duration: `${duration}ms`,
        mode: 'binding_parallel'
      });
      
    } catch (error) {
      this.logger.warn(`批量缓存写入失败`, error);
      throw error;
    }
  }
  
  /**
   * 批量异步设置缓存（不阻塞）
   * 使用优化的智能批量策略
   * @param items 键值对形式的数据
   * @param ttl 过期时间（秒）
   */
  batchSetAsync<T>(items: Record<string, T>, ttl: number): void {
    this.batchSet(items, ttl).catch(err =>
      this.logger.error(`批量异步缓存写入失败`, err)
    );
  }
  
  /**
   * 通过Cloudflare SDK进行真正的批量写入
   * 支持最多10,000个键值对，单个请求完成
   * @private
   * @param items 键值对形式的数据
   * @param ttl 过期时间（秒）
   */
  private async batchSetViaCloudflareSDK<T>(items: Record<string, T>, ttl: number): Promise<void> {
    if (!this.cloudflareClient || !this.env.CLOUDFLARE_ACCOUNT_ID || !this.env.KV_NAMESPACE_ID) {
      throw new Error('Cloudflare SDK客户端或配置不可用');
    }
    
    const entries = Object.entries(items);
    
    // 验证批量限制
    if (entries.length > CacheService.REST_API_LIMITS.MAX_BULK_WRITE) {
      throw new Error(
        `批量写入数量超限: ${entries.length}，最大支持: ${CacheService.REST_API_LIMITS.MAX_BULK_WRITE}`
      );
    }
    
    // 构建批量写入payload
    const payload: Array<{
      key: string;
      value: string;
      expiration_ttl: number;
    }> = [];
    
    let totalSize = 0;
    
    for (const [key, value] of entries) {
      const cacheKey = this.formatKey(key);
      const serializedValue = JSON.stringify(value);
      
      // 验证单个键值对
      this.validateKeySize(cacheKey);
      this.validateValueSize(serializedValue);
      
      const item = {
        key: cacheKey,
        value: serializedValue,
        expiration_ttl: this.addJitter(ttl)
      };
      
      payload.push(item);
      totalSize += JSON.stringify(item).length;
    }
    
    // 验证总请求大小
    if (totalSize > CacheService.REST_API_LIMITS.MAX_REQUEST_SIZE) {
      throw new Error(
        `批量写入请求过大: ${Math.round(totalSize / 1024 / 1024)}MB，限制: ${Math.round(CacheService.REST_API_LIMITS.MAX_REQUEST_SIZE / 1024 / 1024)}MB`
      );
    }
    
    try {
      // 使用Cloudflare SDK进行批量写入
      const response = await this.cloudflareClient.kv.namespaces.bulkUpdate(
        this.env.KV_NAMESPACE_ID,
        {
          account_id: this.env.CLOUDFLARE_ACCOUNT_ID,
          body: payload,
        }
      );
      
      // 检查响应结果
      if (!response) {
        throw new Error('Cloudflare SDK返回空响应');
      }
      
      if (response.unsuccessful_keys && response.unsuccessful_keys.length > 0) {
        const failureRate = response.unsuccessful_keys.length / entries.length;
        
        this.logger.warn(`部分键写入失败`, {
          successfulCount: response.successful_key_count,
          unsuccessfulCount: response.unsuccessful_keys.length,
          failureRate: `${Math.round(failureRate * 100)}%`,
          unsuccessfulKeys: response.unsuccessful_keys.slice(0, 10), // 只记录前10个
          totalRequested: entries.length
        });
        
        // 如果失败率过高，记录错误
        if (failureRate > 0.1) { // 10%以上失败率
          this.logger.error(`批量写入失败率过高: ${Math.round(failureRate * 100)}%`);
        }
      } else {
        // 完全成功的情况
        this.logger.debug('Cloudflare SDK批量写入完全成功', {
          successfulCount: response.successful_key_count,
          totalRequested: entries.length
        });
      }
      
    } catch (error: any) {
      // 处理Cloudflare SDK特定错误
      if (error.name === 'CloudflareError') {
        const details = {
          code: error.code,
          message: error.message,
          status: error.status
        };
        this.logger.error('Cloudflare SDK API错误', details);
        throw new Error(`Cloudflare SDK批量写入失败: [${error.code}] ${error.message}`);
      } else {
        this.logger.error('Cloudflare SDK未知错误', error);
        throw new Error(`Cloudflare SDK批量写入失败: ${error.message}`);
      }
    }
  }
  
  /**
   * 通过KV binding进行并行写入（原有实现）
   * 使用分批限流策略避免KV速率限制
   * @private
   * @param items 键值对形式的数据
   * @param ttl 过期时间（秒）
   */
  private async batchSetViaBinding<T>(items: Record<string, T>, ttl: number): Promise<void> {
    const entries = Object.entries(items);
    const batchSize = CacheService.KV_LIMITS.MAX_BATCH_WRITE;
    
    // 验证所有键值对
    entries.forEach(([key, value]) => {
      const cacheKey = this.formatKey(key);
      const serializedValue = JSON.stringify(value);
      this.validateKeySize(cacheKey);
      this.validateValueSize(serializedValue);
    });
    
    // 分批处理，避免速率限制
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      
      // 并行处理当前批次
      await Promise.all(
        batch.map(([key, value]) => this.set(key, value, ttl))
      );
      
      // 在批次间添加延迟避免速率限制
      if (i + batchSize < entries.length) {
        await new Promise(resolve => 
          globalThis.setTimeout(resolve, CacheService.KV_LIMITS.WRITE_BATCH_DELAY)
        );
      }
    }
    
    this.logger.debug(`Binding批量设置缓存完成`, {
      itemCount: Object.keys(items).length,
      batchCount: Math.ceil(entries.length / batchSize),
      ttl
    });
  }
  
  /**
   * 检查REST API配置是否可用
   * @private
   * @returns 是否可以使用REST API批量写入
   */
  private isRestApiAvailable(): boolean {
    return !!(
      this.env.CLOUDFLARE_ACCOUNT_ID && 
      this.env.KV_NAMESPACE_ID && 
      this.env.CLOUDFLARE_API_TOKEN
    );
  }
  
  /**
   * 生成批量操作缓存键
   * 基于多个标识符数组生成一个统一的缓存键
   * @param prefix 键前缀，表示操作类型
   * @param items 标识符数组
   * @returns 格式化的缓存键
   */
  generateBatchCacheKey(prefix: string, items: string[]): string {
    // 对标识符进行排序以确保缓存键的一致性
    const sortedItems = [...items].sort();
    const baseKey = `batch:${prefix}:${sortedItems.join(',')}`;
    
    // 如果键过长，使用哈希压缩
    if (baseKey.length > CacheService.KV_LIMITS.MAX_KEY_SIZE - this.cachePrefix.length) {
      return this.generateHashKey([baseKey]);
    }
    
    return baseKey;
  }
  
  /**
   * 生成分组操作缓存键
   * 基于分组信息和标识符生成缓存键
   * @param prefix 键前缀，表示操作类型
   * @param group1 第一个分组标识符（如交易所）
   * @param group2 第二个分组标识符（如国家）
   * @param items 标识符数组
   * @returns 格式化的缓存键  
   */
  generateGroupCacheKey(prefix: string, group1: string, group2: string, items: string[]): string {
    // 对标识符进行排序以确保缓存键的一致性
    const sortedItems = [...items].sort();
    const baseKey = `group:${prefix}:${group1 || ''}:${group2 || ''}:${sortedItems.join(',')}`;
    
    // 如果键过长，使用哈希压缩
    if (baseKey.length > CacheService.KV_LIMITS.MAX_KEY_SIZE - this.cachePrefix.length) {
      return this.generateHashKey([baseKey]);
    }
    
    return baseKey;
  }
  
  /**
   * 生成哈希缓存键
   * 用于长字符串或数组集合的缓存键压缩
   * @param items 字符串数组
   * @returns SHA-256哈希值
   */
  generateHashKey(items: string[]): string {
    const sortedItems = [...items].sort().join(',');
    
    // 使用简单的哈希算法（Workers 环境兼容）
    let hash = 0;
    for (let i = 0; i < sortedItems.length; i++) {
      const char = sortedItems.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return `hash:${Math.abs(hash).toString(36)}`;
  }
  
  /**
   * 获取缓存性能统计和配置信息
   * @returns 缓存性能指标和推荐
   */
  async getCacheStats(): Promise<{
    isAvailable: boolean;
    bindingLimits: typeof CacheService.KV_LIMITS;
    restApiLimits: typeof CacheService.REST_API_LIMITS;
    restApiAvailable: boolean;
    sdkClientAvailable: boolean;
    strategyInfo: {
      smallBatchStrategy: string;
      largeBatchStrategy: string;
      threshold: number;
    };
    recommendations: string[];
  }> {
    const recommendations: string[] = [];
    const restApiAvailable = this.isRestApiAvailable();
    const sdkClientAvailable = !!this.cloudflareClient;
    
    if (!this.env.CACHE) {
      recommendations.push('KV 存储未配置');
    }
    
    if (restApiAvailable && sdkClientAvailable) {
      recommendations.push(`大批量写入(≥${CacheService.REST_API_LIMITS.USE_REST_API_THRESHOLD}项)自动使用Cloudflare SDK优化`);
      recommendations.push('Cloudflare SDK可减少99%的请求数量并提供更好的类型安全');
    } else if (restApiAvailable && !sdkClientAvailable) {
      recommendations.push('REST API已配置但SDK客户端初始化失败');
      recommendations.push('检查API Token权限和网络连接');
    } else {
      recommendations.push('配置REST API环境变量可大幅提升批量写入性能');
      recommendations.push('需要: CLOUDFLARE_ACCOUNT_ID, KV_NAMESPACE_ID, CLOUDFLARE_API_TOKEN');
    }
    
    recommendations.push('使用批量操作提升性能');
    recommendations.push('为大数据启用压缩');
    recommendations.push('合理设置 TTL 避免缓存雪崩');
    
    return {
      isAvailable: !!this.env.CACHE,
      bindingLimits: CacheService.KV_LIMITS,
      restApiLimits: CacheService.REST_API_LIMITS,
      restApiAvailable,
      sdkClientAvailable,
      strategyInfo: {
        smallBatchStrategy: 'KV Binding 并行写入',
        largeBatchStrategy: sdkClientAvailable ? 'Cloudflare SDK 批量写入' : 
                          restApiAvailable ? 'KV Binding 分批写入' : 'KV Binding 分批写入',
        threshold: CacheService.REST_API_LIMITS.USE_REST_API_THRESHOLD
      },
      recommendations
    };
  }

  /**
   * 为键添加前缀
   * @private
   * @param key 原始键
   * @returns 添加前缀后的键
   */
  private formatKey(key: string): string {
    return `${this.cachePrefix}${key}`;
  }
  
  /**
   * 验证键大小是否符合 KV 限制
   * @private
   * @param key 格式化后的键
   */
  private validateKeySize(key: string): void {
    const keyBytes = new TextEncoder().encode(key).length;
    if (keyBytes > CacheService.KV_LIMITS.MAX_KEY_SIZE) {
      throw new Error(
        `缓存键过大: ${keyBytes} 字节，限制: ${CacheService.KV_LIMITS.MAX_KEY_SIZE} 字节`
      );
    }
  }
  
  /**
   * 验证值大小是否符合 KV 限制
   * @private
   * @param value 序列化后的值
   */
  private validateValueSize(value: string): void {
    const valueBytes = new TextEncoder().encode(value).length;
    if (valueBytes > CacheService.KV_LIMITS.MAX_VALUE_SIZE) {
      throw new Error(
        `缓存值过大: ${valueBytes} 字节，限制: ${CacheService.KV_LIMITS.MAX_VALUE_SIZE} 字节`
      );
    }
  }
  
  /**
   * 添加随机抖动到TTL，避免缓存雪崩
   * @private
   * @param baseTTL 基础TTL值
   * @returns 添加随机抖动后的TTL值
   */
  private addJitter(baseTTL: number): number {
    // 添加随机抖动（±10%的基础TTL）
    const jitter = Math.floor(Math.random() * (baseTTL * 0.2)) - (baseTTL * 0.1);
    return Math.max(baseTTL + jitter, 60); // 确保最小1分钟
  }
} 