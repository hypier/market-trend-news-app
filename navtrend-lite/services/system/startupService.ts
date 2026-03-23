import AsyncStorage from '@react-native-async-storage/async-storage';
import { Logger, LogModule } from '@/utils/logger';

const STARTUP_COUNT_KEY = 'startup_count';

export const startupService = {
  /**
   * 获取应用启动次数
   * @returns {Promise<number>} 应用启动次数
   */
  getStartupCount: async (): Promise<number> => {
    try {
      const countStr = await AsyncStorage.getItem(STARTUP_COUNT_KEY);
      return countStr ? parseInt(countStr, 10) : 0;
    } catch (error) {
      Logger.error(LogModule.ANALYTICS, '获取启动次数失败:', error);
      return 0;
    }
  },

  /**
   * 增加应用启动次数
   * @returns {Promise<number>} 更新后的应用启动次数
   */
  incrementStartupCount: async (): Promise<number> => {
    try {
      const currentCount = await startupService.getStartupCount();
      const newCount = currentCount + 1;
      await AsyncStorage.setItem(STARTUP_COUNT_KEY, newCount.toString());
      return newCount;
    } catch (error) {
      Logger.error(LogModule.ANALYTICS, '增加启动次数失败:', error);
      return 0;
    }
  }
}; export default startupService;
