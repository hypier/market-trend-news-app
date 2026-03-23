/**
 * 排行榜数据服务模块
 * 
 * 职责：
 * - 3 个后端 API 调用（默认配置、全量配置、排行榜数据）
 * - 本地配置 CRUD（AsyncStorage）
 */

import { apiClient } from '../core/api';
import { Storage } from '@/utils/storage';
import { AppConfig } from '@/config/app';
import { Logger, LogModule } from '@/utils/logger';

import type {
  LeaderboardDataResponse,
  LeaderboardDataParams,
  DefaultLeaderboardConfig,
  LocalLeaderboardConfig,
} from '@/types/leaderboard';

export class LeaderboardService {

  // ========== API 调用 ==========

  /**
   * 获取默认排行榜配置
   * 对应后端 GET /tv/leaderboards/default-config
   */
  async fetchDefaultConfig(): Promise<DefaultLeaderboardConfig> {
    try {
      const response = await apiClient.request<DefaultLeaderboardConfig>('/tv/leaderboards/default-config', {
        method: 'GET',
        version: 'v1'
      });
      
      if (!response.version || !response.categories || !response.leaderboards) {
        throw new Error('Invalid config format from API');
      }

      Logger.debug(LogModule.STOCK, `[fetchDefaultConfig] 成功 (version: ${response.version})`);
      return response;
    } catch (error) {
      Logger.error(LogModule.STOCK, '[fetchDefaultConfig] 失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有可用的排行榜配置列表
   * 对应后端 GET /tv/leaderboards/configs
   * 用于自定义排行榜时选择
   */
  async fetchConfigs(): Promise<any[]> {
    try {
      const configs = await apiClient.request<any[]>('/tv/leaderboards/configs', {
        includeAuth: false,
        version: 'v1',
        timeout: AppConfig.API_TIMEOUTS.STANDARD
      });

      Logger.debug(LogModule.STOCK, `[fetchConfigs] 成功: ${configs.length} configs`);
      return configs;
    } catch (error) {
      Logger.error(LogModule.STOCK, '[fetchConfigs] 失败:', error);
      throw error;
    }
  }

  /**
   * 获取排行榜数据
   * 对应后端 GET /tv/leaderboards/{id}/data
   */
  async fetchLeaderboardData(
    leaderboardId: string,
    params: LeaderboardDataParams & { market_code?: string } = {}
  ): Promise<LeaderboardDataResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.start !== undefined) queryParams.append('start', params.start.toString());
      if (params.count !== undefined) queryParams.append('count', params.count.toString());
      if (params.lang) queryParams.append('lang', params.lang);
      if (params.market_code) queryParams.append('market_code', params.market_code);

      const queryString = queryParams.toString();
      const endpoint = `/tv/leaderboards/${leaderboardId}/data${queryString ? '?' + queryString : ''}`;

      const data = await apiClient.request<LeaderboardDataResponse>(endpoint, {
        includeAuth: false,
        version: 'v1',
        timeout: AppConfig.API_TIMEOUTS.STANDARD
      });

      Logger.debug(LogModule.STOCK, `[fetchLeaderboardData] ${leaderboardId}: ${data.data?.length || 0} items`);
      return data;
    } catch (error) {
      Logger.error(LogModule.STOCK, `[fetchLeaderboardData] ${leaderboardId} 失败:`, error);
      throw error;
    }
  }

  // ========== 本地配置 CRUD ==========

  /**
   * 获取本地配置
   */
  async getLocalConfig(): Promise<LocalLeaderboardConfig | null> {
    try {
      const stored = await Storage.getItem('leaderboard_local_config');
      if (!stored) return null;

      const config = JSON.parse(stored) as LocalLeaderboardConfig;
      Logger.debug(LogModule.STOCK, `[getLocalConfig] 成功 (version: ${config.version})`);
      return config;
    } catch (error) {
      Logger.error(LogModule.STOCK, '[getLocalConfig] 失败:', error);
      return null;
    }
  }

  /**
   * 保存本地配置
   */
  async saveLocalConfig(config: LocalLeaderboardConfig): Promise<void> {
    try {
      await Storage.setItem('leaderboard_local_config', JSON.stringify(config));
      Logger.debug(LogModule.STOCK, `[saveLocalConfig] 成功 (version: ${config.version})`);
    } catch (error) {
      Logger.error(LogModule.STOCK, '[saveLocalConfig] 失败:', error);
      throw error;
    }
  }

  /**
   * 清除本地配置
   */
  async clearLocalConfig(): Promise<void> {
    try {
      await Storage.removeItem('leaderboard_local_config');
      Logger.debug(LogModule.STOCK, '[clearLocalConfig] 成功');
    } catch (error) {
      Logger.warn(LogModule.STOCK, '[clearLocalConfig] 失败:', error);
    }
  }

  // ========== 工具方法 ==========

  /**
   * 解析排行榜 key
   * @param key 格式：id 或 id:market_code
   */
  parseLeaderboardKey(key: string): { id: string; market_code?: string } {
    const parts = key.split(':');
    return {
      id: parts[0],
      market_code: parts[1]
    };
  }
}

// 导出单例实例
export const leaderboardService = new LeaderboardService();
export default leaderboardService;
