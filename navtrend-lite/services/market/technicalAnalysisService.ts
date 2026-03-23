import { apiClient } from '../core/api';
import { Logger, LogModule } from '@/utils/logger';
import type { TechnicalAnalysisData, DetailedTechnicalIndicators } from '@/types/tradingview';

/**
 * 技术分析数据服务类
 */
export class TechnicalAnalysisService {
  /**
   * 获取技术分析数据（多时间周期）
   * @param tvSymbol TradingView 格式的股票标识符（如 'NASDAQ:AAPL'）
   * @returns 技术分析数据
   */
  async getTechnicalAnalysis(tvSymbol: string): Promise<TechnicalAnalysisData> {
    try {
      Logger.debug(LogModule.STOCK, `获取技术分析数据: ${tvSymbol}`);

      const response = await apiClient.request<TechnicalAnalysisData>(
        `/tv/technical-analysis/${encodeURIComponent(tvSymbol)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      Logger.debug(LogModule.STOCK, `技术分析数据获取成功: ${tvSymbol}`);
      return response;
    } catch (error) {
      Logger.error(LogModule.STOCK, `获取技术分析数据失败: ${tvSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 获取详细技术指标数据（50+个指标）
   * @param tvSymbol TradingView 格式的股票标识符（如 'NASDAQ:AAPL'）
   * @returns 详细技术指标数据
   */
  async getDetailedIndicators(tvSymbol: string): Promise<DetailedTechnicalIndicators> {
    try {
      Logger.debug(LogModule.STOCK, `获取详细技术指标: ${tvSymbol}`);

      const response = await apiClient.request<DetailedTechnicalIndicators>(
        `/tv/detailed-indicators/${encodeURIComponent(tvSymbol)}`,
        {
          includeAuth: false,
          version: 'v1',
          timeout: 10000,
        }
      );

      Logger.debug(LogModule.STOCK, `详细技术指标获取成功: ${tvSymbol}`);
      return response;
    } catch (error) {
      Logger.error(LogModule.STOCK, `获取详细技术指标失败: ${tvSymbol}:`, error);
      throw error;
    }
  }

  /**
   * 批量获取技术分析数据（同时获取多时间周期和详细指标）
   * @param tvSymbol TradingView 格式的股票标识符（如 'NASDAQ:AAPL'）
   * @returns 技术分析数据和详细指标
   */
  async getBatchTechnicalData(tvSymbol: string): Promise<{
    analysis: TechnicalAnalysisData;
    indicators: DetailedTechnicalIndicators;
  }> {
    try {
      Logger.debug(LogModule.STOCK, `批量获取技术数据: ${tvSymbol}`);

      const [analysis, indicators] = await Promise.all([
        this.getTechnicalAnalysis(tvSymbol),
        this.getDetailedIndicators(tvSymbol),
      ]);

      Logger.debug(LogModule.STOCK, `批量技术数据获取成功: ${tvSymbol}`);
      return { analysis, indicators };
    } catch (error) {
      Logger.error(LogModule.STOCK, `批量获取技术数据失败: ${tvSymbol}:`, error);
      throw error;
    }
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService();
export default technicalAnalysisService;

