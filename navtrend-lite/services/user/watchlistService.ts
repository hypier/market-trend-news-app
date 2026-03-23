/**
 * 关注列表服务模块
 * 提供关注列表功能，支持智能缓存策略。
 */

import { apiClient } from '../core/api';
import { Storage } from '@/utils/storage';
import { Logger, LogModule } from '@/utils/logger';
import { tradingViewService } from '../market/tradingView/tradingViewService';

import type { 
  WatchlistItem,
} from '@/types/stock';

/**
 * 关注列表服务类
 */
export class WatchlistService {
	/**
	 * 构建关注列表项的唯一标识符
	 * 
	 * 从 watchlistStore 移动到 Service 层
	 * 
	 * @param symbol 股票代码
	 * @param exchange 交易所代码（可选）
	 * @returns 唯一标识符
	 */
	buildWatchlistKey(symbol: string, exchange?: string): string {
		return exchange && exchange !== 'undefined' 
			? `${exchange}:${symbol}` 
			: symbol;
	}

	/**
	 * 批量获取报价数据
	 * 
	 * 从 watchlistStore 移动到 Service 层
	 * 
	 * @param items 关注列表项
	 * @returns 报价数据映射
	 */
	async fetchBatchQuotes(items: WatchlistItem[]): Promise<Record<string, any>> {
		// 过滤掉没有 exchange 的项
		const itemsWithExchange = items.filter(item => item.exchange);
		if (itemsWithExchange.length < items.length) {
			Logger.warn(LogModule.STOCK, `${items.length - itemsWithExchange.length} items without exchange excluded`);
		}
		
		if (itemsWithExchange.length === 0) {
			return {};
		}
		
		const tvSymbols = tradingViewService.formatBatchToTradingViewSymbols(
			itemsWithExchange.map(item => ({ symbol: item.symbol, exchange: item.exchange! }))
		);
		
		const quotesMap: Record<string, any> = {};
		const BATCH_SIZE = 20;
		const batches: string[][] = [];
		
		// 分批处理
		for (let i = 0; i < tvSymbols.length; i += BATCH_SIZE) {
			batches.push(tvSymbols.slice(i, i + BATCH_SIZE));
		}
		
		try {
			// 并行请求所有批次
			const batchPromises = batches.map(batch => 
				tradingViewService.getBatchQuotes(batch).catch(err => {
					Logger.warn(LogModule.STOCK, `批次请求失败:`, err);
					return { success: false, total: 0, successful: 0, failed: batch.length, data: [] };
				})
			);
			
			const batchResults = await Promise.all(batchPromises);
			
			// 合并所有批次的结果
			batchResults.forEach(batchQuotesResponse => {
				if (batchQuotesResponse.success && batchQuotesResponse.data) {
					batchQuotesResponse.data.forEach(result => {
						if (result.success && result.data) {
							quotesMap[result.symbol] = result.data;
						}
					});
				}
			});
		} catch (error) {
			Logger.warn(LogModule.STOCK, '批量获取报价失败:', error);
		}
		
		return quotesMap;
	}

	/**
	 * 合并关注列表数据和报价数据
	 * 
	 * 从 watchlistStore 移动到 Service 层
	 * 
	 * @param watchlist 关注列表
	 * @param quotesMap 报价数据映射
	 * @returns 合并后的关注列表
	 */
	enrichWatchlistWithQuotes(
		watchlist: WatchlistItem[], 
		quotesMap: Record<string, any>
	): WatchlistItem[] {
		return watchlist.map(item => {
			const tvSymbol = item.exchange 
				? `${item.exchange}:${item.symbol}` 
				: item.symbol;
			
			const quote = quotesMap[tvSymbol];
			
			if (quote) {
				return {
					...item,
					logoid: quote.logoid,
					baseCurrencyLogoid: quote['base-currency-logoid'],
					currencyLogoid: quote['currency-logoid'],
					pricescale: quote.pricescale, // 价格精度
					quote: {
						symbol: item.symbol,
						exchange: item.exchange || '',
						name: quote.description || quote.local_description || item.symbol,
						price: quote.lp || 0,
						previousClose: quote.prev_close_price || 0,
						open: quote.open_price || 0,
						high: quote.high_price || 0,
						low: quote.low_price || 0,
						change: quote.ch || 0,
						changePercent: quote.chp || 0,
						volume: quote.volume || 0,
						currency: quote.currency_code || 'USD',
						pricescale: quote.pricescale, // 价格精度
						timestamp: new Date().toISOString(),
					}
				};
			}
			
			return item;
		});
	}

	/**
	 * 去重处理
	 * 
	 * 从 watchlistStore 移动到 Service 层
	 * 
	 * @param watchlist 关注列表
	 * @returns 去重后的关注列表
	 */
	deduplicateWatchlist(watchlist: WatchlistItem[]): WatchlistItem[] {
		return watchlist.reduce((acc, current) => {
			const currentKey = this.buildWatchlistKey(current.symbol, current.exchange);
			
			const isDuplicate = acc.some(item => {
				const itemKey = this.buildWatchlistKey(item.symbol, item.exchange);
				return itemKey === currentKey;
			});
			
			if (!isDuplicate) {
				acc.push(current);
			} else {
				Logger.warn(LogModule.STOCK, `Duplicate removed: ${currentKey}`);
			}
			
			return acc;
		}, [] as WatchlistItem[]);
	}

	/** 
	 * 获取用户关注列表（直接从 API 获取，不使用 Service 层缓存）
	 * 缓存由 Store 层统一管理
	 * 
	 * @returns 按添加时间降序排列的关注列表（新加入的排在最前面）
	 */
	async getWatchlist(): Promise<WatchlistItem[]> {
		try {
			const data = await apiClient.request<WatchlistItem[]>("/watchlist", {
				version: 'v1'
			})
			
			// ✅ 按添加时间降序排序（新加入的排在最前面）
			const sortedData = data.sort((a, b) => {
				const dateA = new Date(a.addedAt || a.createdAt).getTime();
				const dateB = new Date(b.addedAt || b.createdAt).getTime();
				return dateB - dateA; // 降序：最新的在前
			});
			
			Logger.debug(LogModule.STOCK, `Fetched ${sortedData?.length || 0} watchlist items from API (sorted by newest first)`)
			return sortedData
		} catch (error) {
			Logger.error(LogModule.STOCK, "Failed to fetch watchlist:", error)
			throw error
		}
	}

	/**
	 * 获取用户关注列表和价格提醒（兼容方法）
	 *
	 * 价格提醒相关 API 已移除，因此这里退化为仅返回 watchlist，
	 * 并保留 priceAlerts 空数组以兼容旧调用方。
	 *
	 * @returns 包含 watchlist 和 priceAlerts 的对象
	 */
	async getWatchlistWithAlerts(): Promise<{
		watchlist: WatchlistItem[];
		priceAlerts: any[];
	}> {
		try {
			const watchlist = await this.getWatchlist();
			Logger.debug(LogModule.STOCK, `Fetched ${watchlist?.length || 0} watchlist items (price alerts removed)`)

			return {
				watchlist,
				priceAlerts: [],
			};
		} catch (error) {
			Logger.error(LogModule.STOCK, 'Failed to fetch watchlist:', error);
			throw error;
		}
	}


	/** 
	 * 添加股票到关注列表
	 * @param symbol 股票标识符（格式: EXCHANGE:SYMBOL）
	 * @param currentPrice 当前价格（可选），用于自动创建 5% 上涨提醒
	 */
	async addToWatchlist(symbol: string, currentPrice?: number): Promise<WatchlistItem> {
		try {
			Logger.debug(LogModule.STOCK, `Adding ${symbol} to watchlist`, { currentPrice })

			const requestData: any = {
				symbol: symbol.toUpperCase(),
			};

			// 如果提供了当前价格，添加到请求数据中
			if (currentPrice !== undefined && currentPrice > 0) {
				requestData.currentPrice = currentPrice.toString();
			}

			const data = await apiClient.request<WatchlistItem>("/watchlist", {
				method: "POST",
				version: 'v1', // 使用 V1 API
				data: requestData,
			})

			Logger.debug(LogModule.STOCK, `Successfully added ${symbol} to watchlist`)
			return data
		} catch (error: any) {
			Logger.error(LogModule.STOCK, `Failed to add ${symbol} to watchlist:`, {
				error: error.message,
				status: error.status,
				symbol,
			})

			// 检查是否是重复添加错误（容错处理）
			if (error.status === 400 && error.message) {
				const errorMessage = error.message.toLowerCase()
				const isDuplicateError =
					errorMessage.includes("duplicate") ||
					errorMessage.includes("unique constraint") ||
					errorMessage.includes("already exists") ||
					errorMessage.includes("unique_watchlist_user_symbol") ||
					errorMessage.includes("constraint") ||
					errorMessage.includes("violates") ||
					errorMessage.includes("重复") ||
					errorMessage.includes("已存在")

				if (isDuplicateError) {
					Logger.debug(LogModule.STOCK, `Stock ${symbol} already in watchlist, treating as success`)

					// 尝试获取现有的关注项
					try {
						const watchlist = await this.getWatchlist()
						const existingItem = watchlist.find((item) => item.symbol.toUpperCase() === symbol.toUpperCase())

						if (existingItem) {
							return existingItem
						}
					} catch (getError) {
						Logger.warn(LogModule.STOCK, "Failed to get existing watchlist item:", getError)
					}

					// 如果无法获取现有项，返回一个模拟的成功响应
					return {
						id: `temp_${symbol}_${Date.now()}`,
						symbol: symbol.toUpperCase(),
						userId: "current",
						createdAt: new Date().toISOString(),
						addedAt: new Date().toISOString(),
					} as WatchlistItem
				}
			}

			// 其他错误正常抛出
			throw error
		}
	}

	/** 从关注列表移除股票 */
	async removeFromWatchlist(symbol: string): Promise<void> {
		try {
			Logger.debug(LogModule.STOCK, `Removing ${symbol} from watchlist`)
			const symbolStr = symbol.toUpperCase()
			await apiClient.request(`/watchlist/${encodeURIComponent(symbolStr)}`, {
				method: "DELETE",
				version: 'v1', // 使用 V1 API
			})

			Logger.debug(LogModule.STOCK, `Successfully removed ${symbol} from watchlist`)
		} catch (error: any) {
			Logger.error(LogModule.STOCK, `Failed to remove ${symbol} from watchlist:`, {
				error: error.message,
				status: error.status,
				symbol,
			})

			// 检查是否是"不存在"错误（容错处理）
			if (
				error.status === 404 ||
				(error.status === 400 && error.message && (error.message.includes("not found") || error.message.includes("不存在") || error.message.includes("not in watchlist")))
			) {
				Logger.debug(LogModule.STOCK, `Stock ${symbol} not in watchlist, treating removal as success`)
				return // 视为成功
			}

			// 其他错误正常抛出
			throw error
		}
	}

	/** 检查股票是否在关注列表中 */
	async isInWatchlist(symbol: string): Promise<boolean> {
		try {
			const watchlist = await this.getWatchlist()
			return watchlist.some((item) => item.symbol.toUpperCase() === symbol.toUpperCase())
		} catch (error) {
			Logger.error(LogModule.STOCK, `Failed to check if ${symbol} is in watchlist:`, error)
			return false // 检查失败时默认为未关注
		}
	}

	// 根据股票标识符查询关注状态，支持复合标识符格式（如"AAPL:NASDAQ"或"AAPL:NASDAQ:US"）
	async checkSymbolInWatchlist(symbol: string) {
		const response = await apiClient.request<any>(`/watchlist/check/${symbol}`, {
			timeout: 20000,
			version: "v2",
		})
		return response
	}

	/** 清除所有关注列表相关缓存 */
	async clearCache(): Promise<void> {
		try {
			await Storage.clearCache()
			Logger.debug(LogModule.STOCK, "Watchlist service cache cleared")
		} catch (error) {
			Logger.error(LogModule.STOCK, "Failed to clear watchlist service cache:", error)
			throw error
		}
	}
}

// 导出单例实例
export const watchlistService = new WatchlistService();
export default watchlistService;

