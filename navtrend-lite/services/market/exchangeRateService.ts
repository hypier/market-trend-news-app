/**
 * 汇率服务
 * 
 * 提供汇率转换和缓存功能，避免重复请求相同的汇率
 * 使用 TradingView API 获取实时外汇报价
 */

import { apiClient } from '@/services/core/api';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import {
  TRADINGVIEW_FX_CONFIG,
  buildFxSymbol,
} from '@/services/core';
import type { TradingViewQuote } from '@/types/tradingview';

interface ExchangeRateCache {
  [key: string]: {
    rate: number;
    timestamp: number;
  };
}

export class ExchangeRateService {
  // 汇率缓存，格式为 "USD_CNY": { rate: 7.2, timestamp: 123456789 }
  private rateCache: ExchangeRateCache = {};
  // 缓存过期时间
  private cacheTTL = TRADINGVIEW_FX_CONFIG.cacheTTL;

  /**
   * 获取汇率
   * @param fromCurrency 源货币
   * @param toCurrency 目标货币
   * @returns 汇率
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
    // 如果源货币和目标货币相同，直接返回1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // 生成缓存键（使用冒号分隔符避免潜在冲突）
    const cacheKey = `${fromCurrency}:${toCurrency}`;
    
    // 检查缓存是否有效
    const cachedRate = this.rateCache[cacheKey];
    if (cachedRate && (Date.now() - cachedRate.timestamp) < this.cacheTTL) {
      Logger.debug(LogModule.API, `使用缓存汇率: ${fromCurrency} => ${toCurrency} = ${cachedRate.rate}`);
      return cachedRate.rate;
    }

    try {
      // 动态构建 TradingView 外汇符号
      const fxSymbol = buildFxSymbol(fromCurrency, toCurrency);
      
      Logger.debug(LogModule.API, `获取汇率: ${fromCurrency} => ${toCurrency} (${fxSymbol})`);

      const result = await apiClient.request<TradingViewQuote>(
        `/tv/quote/${encodeURIComponent(fxSymbol)}?session=${encodeURIComponent(TRADINGVIEW_FX_CONFIG.session)}&fields=${encodeURIComponent(TRADINGVIEW_FX_CONFIG.fields)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: TRADINGVIEW_FX_CONFIG.timeout,
        }
      );

      if (typeof result.lp !== 'number') {
        throw new Error('Invalid response format');
      }
      
      const rate = result.lp;
      
      // 更新缓存
      this.rateCache[cacheKey] = {
        rate,
        timestamp: Date.now()
      };
      
      Logger.debug(LogModule.API, `获取汇率成功: ${fromCurrency} => ${toCurrency} = ${rate}`);
      return rate;
    } catch (error) {
      Logger.error(LogModule.API, `获取汇率失败: ${fromCurrency} => ${toCurrency}`, error);
      
      // 如果请求失败但有过期缓存，使用过期缓存
      if (cachedRate) {
        Logger.warn(LogModule.API, `使用过期缓存汇率: ${fromCurrency} => ${toCurrency} = ${cachedRate.rate}`);
        return cachedRate.rate;
      }
      
      // 如果没有缓存，返回1作为默认值
      return 1;
    }
  }

  /**
   * 批量获取汇率
   * @param currencies 需要转换的货币列表 ['USD', 'JPY', 'EUR']
   * @param targetCurrency 目标货币
   * @returns 汇率映射表 { 'USD': 1, 'JPY': 0.0091, 'EUR': 1.1 }
   */
  async batchGetExchangeRates(currencies: string[], targetCurrency: string): Promise<Record<string, number>> {
    // 去重
    const uniqueCurrencies = [...new Set(currencies)];
    const result: Record<string, number> = {};

    // 过滤出需要请求的货币（排除与目标货币相同的）
    const currenciesToFetch = uniqueCurrencies.filter(c => c !== targetCurrency);
    
    if (currenciesToFetch.length === 0) {
      // 如果所有货币都与目标货币相同，直接返回
      uniqueCurrencies.forEach(currency => {
        result[currency] = 1;
      });
      return result;
    }

    // 检查缓存并分离未缓存的货币
    const uncachedCurrencies: string[] = [];
    const now = Date.now();
    
    currenciesToFetch.forEach(currency => {
      const cacheKey = `${currency}:${targetCurrency}`;
      const cachedRate = this.rateCache[cacheKey];
      
      if (cachedRate && (now - cachedRate.timestamp) < this.cacheTTL) {
        // 使用缓存
        result[currency] = cachedRate.rate;
        Logger.debug(LogModule.API, `批量获取-使用缓存: ${currency} => ${targetCurrency} = ${cachedRate.rate}`);
      } else {
        // 需要请求
        uncachedCurrencies.push(currency);
      }
    });

    // 如果所有货币都已缓存
    if (uncachedCurrencies.length === 0) {
      // 添加目标货币自身（汇率为1）
      if (uniqueCurrencies.includes(targetCurrency)) {
        result[targetCurrency] = 1;
      }
      return result;
    }

    try {
      // 构建 TradingView 符号列表
      const fxSymbols: string[] = [];
      const symbolToCurrency: Record<string, string> = {};
      
      uncachedCurrencies.forEach(currency => {
        const fxSymbol = buildFxSymbol(currency, targetCurrency);
        fxSymbols.push(fxSymbol);
        symbolToCurrency[fxSymbol] = currency;
      });

      if (fxSymbols.length === 0) {
        return result;
      }

      Logger.debug(LogModule.API, `批量获取汇率: ${uncachedCurrencies.join(', ')} => ${targetCurrency}`);

      const batchResponse = await apiClient.request<{
        success: boolean;
        total: number;
        successful: number;
        failed: number;
        data: {
          success: boolean;
          symbol: string;
          data?: { lp: number };
          error?: string;
        }[];
      }>(
        '/tv/quote/batch',
        {
          method: 'POST',
          data: {
            symbols: fxSymbols,
            session: TRADINGVIEW_FX_CONFIG.session,
            fields: TRADINGVIEW_FX_CONFIG.fields
          },
          includeAuth: false,
          version: 'v1',
          timeout: TRADINGVIEW_FX_CONFIG.timeout,
        }
      );
      
      if (!batchResponse.success || !Array.isArray(batchResponse.data)) {
        throw new Error('Invalid batch response format');
      }

      // 处理每个汇率结果
      batchResponse.data.forEach((item) => {
        if (item.success && item.data && typeof item.data.lp === 'number') {
          const currency = symbolToCurrency[item.symbol];
          if (currency) {
            const rate = item.data.lp;
            result[currency] = rate;
            
            // 更新缓存
            const cacheKey = `${currency}:${targetCurrency}`;
            this.rateCache[cacheKey] = {
              rate,
              timestamp: Date.now()
            };
            
            Logger.debug(LogModule.API, `批量获取成功: ${currency} => ${targetCurrency} = ${rate}`);
          }
        } else {
          Logger.warn(LogModule.API, `批量获取失败: ${item.symbol}`, item.error);
        }
      });

      // 处理未成功获取的货币（使用过期缓存或默认值1）
      uncachedCurrencies.forEach(currency => {
        if (!(currency in result)) {
          const cacheKey = `${currency}:${targetCurrency}`;
          const cachedRate = this.rateCache[cacheKey];
          
          if (cachedRate) {
            result[currency] = cachedRate.rate;
            Logger.warn(LogModule.API, `批量获取-使用过期缓存: ${currency} => ${targetCurrency} = ${cachedRate.rate}`);
          } else {
            result[currency] = 1;
            Logger.warn(LogModule.API, `批量获取-使用默认值: ${currency} => ${targetCurrency} = 1`);
          }
        }
      });

    } catch (error) {
      Logger.error(LogModule.API, `批量获取汇率失败`, error);
      
      // 失败时使用缓存或默认值
      uncachedCurrencies.forEach(currency => {
        if (!(currency in result)) {
          const cacheKey = `${currency}:${targetCurrency}`;
          const cachedRate = this.rateCache[cacheKey];
          result[currency] = cachedRate ? cachedRate.rate : 1;
        }
      });
    }

    // 添加目标货币自身（汇率为1）
    if (uniqueCurrencies.includes(targetCurrency)) {
      result[targetCurrency] = 1;
    }

    return result;
  }

  /**
   * 转换货币金额
   * @param amount 金额
   * @param fromCurrency 源货币
   * @param toCurrency 目标货币
   * @returns 转换后的金额
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    return amount * rate;
  }

  /**
   * 清除所有汇率缓存
   */
  clearCache(): void {
    Logger.debug(LogModule.API, '清除汇率缓存');
    this.rateCache = {};
  }

  /**
   * 清除指定货币对的缓存
   * @param fromCurrency 源货币
   * @param toCurrency 目标货币
   */
  clearCacheForPair(fromCurrency: string, toCurrency: string): void {
    const cacheKey = `${fromCurrency}:${toCurrency}`;
    if (this.rateCache[cacheKey]) {
      delete this.rateCache[cacheKey];
      Logger.debug(LogModule.API, `清除汇率缓存: ${cacheKey}`);
    }
  }

}

// 导出单例
export const exchangeRateService = new ExchangeRateService(); export default exchangeRateService;
