import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger, LogModule } from '@/utils/logger';

// 存储键名常量
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIO_DATA: 'portfolio_data',
  WATCHLIST_DATA: 'watchlist_data',
  PRICE_ALERTS: 'price_alerts',
  SETTINGS: 'app_settings',
  CACHE_PREFIX: 'cache_',
  OFFLINE_DATA: 'offline_data',
} as const;

// 存储工具类
export class Storage {
  // 存储字符串
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage setItem error:', error);
      throw error;
    }
  }

  // 获取字符串
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage getItem error:', error);
      return null;
    }
  }

  // 存储对象
  static async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage setObject error:', error);
      throw error;
    }
  }

  // 获取对象
  static async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue ? JSON.parse(jsonValue) : null;
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage getObject error:', error);
      return null;
    }
  }

  // 删除项目
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage removeItem error:', error);
      throw error;
    }
  }

  // 清空所有存储
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage clear error:', error);
      throw error;
    }
  }

  // 获取所有键名
  static async getAllKeys(): Promise<readonly string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage getAllKeys error:', error);
      return [];
    }
  }

  // 缓存相关方法
  static async setCache<T>(
    key: string,
    value: T,
    expirationMinutes: number = 60
  ): Promise<void> {
    const cacheData = {
      value,
      expiration: Date.now() + expirationMinutes * 60 * 1000,
    };
    await this.setObject(STORAGE_KEYS.CACHE_PREFIX + key, cacheData);
  }

  static async getCache<T>(key: string): Promise<T | null> {
    const cacheData = await this.getObject<{
      value: T;
      expiration: number;
    }>(STORAGE_KEYS.CACHE_PREFIX + key);

    if (!cacheData) {
      return null;
    }

    if (Date.now() > cacheData.expiration) {
      await this.removeItem(STORAGE_KEYS.CACHE_PREFIX + key);
      return null;
    }

    return cacheData.value;
  }

  static async clearCache(): Promise<void> {
    const keys = await this.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX));
    
    for (const key of cacheKeys) {
      await this.removeItem(key);
    }
  }

  /**
   * 清除特定模式的缓存
   * 清除以特定前缀开头的所有缓存键
   * 
   * @param pattern 缓存键前缀模式，如 'stock_', 'portfolio_' 等
   */
  static async clearCacheByPattern(pattern: string): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      // 筛选出匹配模式的缓存键
      const matchingKeys = keys.filter(key => 
        key.startsWith(`${STORAGE_KEYS.CACHE_PREFIX}${pattern}`)
      );
      
      if (matchingKeys.length > 0) {
        await AsyncStorage.multiRemove(matchingKeys);
        Logger.info(LogModule.STORAGE, `Cleared ${matchingKeys.length} cache items matching pattern: ${pattern}`);
      }
    } catch (error) {
      Logger.warn(LogModule.STORAGE, `Failed to clear cache by pattern ${pattern}:`, error);
    }
  }

  // 清除关注列表相关缓存
  static async clearWatchlistCache(): Promise<void> {
    try {
      const patterns = ['watchlist', 'batch_quotes', 'trending'];
      
      for (const pattern of patterns) {
        await this.clearCacheByPattern(pattern);
      }
      
      Logger.info(LogModule.STORAGE, 'Cleared all watchlist related cache');
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage clearWatchlistCache error:', error);
    }
  }

  // 获取缓存统计信息
  static async getCacheStats(): Promise<{
    totalCacheKeys: number;
    watchlistCacheKeys: number;
    stockCacheKeys: number;
    otherCacheKeys: number;
  }> {
    try {
      const keys = await this.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(STORAGE_KEYS.CACHE_PREFIX));
      
      const watchlistCacheKeys = cacheKeys.filter(key => 
        key.includes('watchlist') || key.includes('batch_quotes')
      ).length;
      
      const stockCacheKeys = cacheKeys.filter(key => 
        key.includes('stock') || key.includes('quote') || key.includes('trend')
      ).length;
      
      const otherCacheKeys = cacheKeys.length - watchlistCacheKeys - stockCacheKeys;
      
      return {
        totalCacheKeys: cacheKeys.length,
        watchlistCacheKeys,
        stockCacheKeys,
        otherCacheKeys,
      };
    } catch (error) {
      Logger.error(LogModule.STORAGE, 'Storage getCacheStats error:', error);
      return {
        totalCacheKeys: 0,
        watchlistCacheKeys: 0,
        stockCacheKeys: 0,
        otherCacheKeys: 0,
      };
    }
  }
}

// 便捷方法导出
export const {
  setItem,
  getItem,
  setObject,
  getObject,
  removeItem,
  clear,
  getAllKeys,
  setCache,
  getCache,
  clearCache,
  clearCacheByPattern,
  clearWatchlistCache,
  getCacheStats,
} = Storage; 