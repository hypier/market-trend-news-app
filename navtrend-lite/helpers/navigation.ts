import { router } from 'expo-router';
import { Logger } from '@/utils/logger';
import { LogModule } from '../types/logging';
import { buildSymbol } from '@/helpers/symbolUtils';

/**
 * 导航到登录页面
 * @param returnPath 登录成功后的返回路径
 */
export const navigateToLogin = (returnPath: string) => {
  router.push(`/auth/login?returnPath=${encodeURIComponent(returnPath)}` as any);
};

/**
 * 导航到股票详情页面
 * @param symbol 股票代码（可以是纯代码或复合格式）
 * @param exchange 交易所
 */
export const navigateToStockDetail = (symbol: string, exchange?: string) => {
  // 构建复合格式（如果已经是复合格式则保持不变）
  const composite = symbol.includes(':') ? symbol : buildSymbol(symbol, exchange || 'NASDAQ');
  const encodedSymbol = encodeURIComponent(composite);
  router.push(`/stock/${encodedSymbol}` as any);
};

/**
 * 导航到持仓管理页面
 * @param symbol 股票代码（可以是纯代码或复合格式）
 * @param exchange 交易所
 */
export const navigateToPositionAdd = (symbol: string, exchange?: string) => {
  // 构建复合格式（如果已经是复合格式则保持不变）
  const composite = symbol.includes(':') ? symbol : buildSymbol(symbol, exchange || 'NASDAQ');
  const encodedSymbol = encodeURIComponent(composite);
  router.push(`/stock/position/add/${encodedSymbol}` as any);
};

/**
 * 获取当前路径（简化版本）
 * 注意：这是一个简化的实现，在实际应用中可能需要更复杂的逻辑
 */
const getCurrentPath = (): string | null => {
  // 由于 Expo Router 没有直接获取当前路径的API，
  // 这里返回null，让调用方明确传递returnUrl
  return null;
};

/**
 * 登录成功后的导航处理
 * @param returnUrl 要返回的页面路径
 */
export const handleLoginSuccess = (returnUrl?: string) => {
  Logger.debug(LogModule.API, 'handleLoginSuccess called with returnUrl:', returnUrl);
  
  if (returnUrl) {
    Logger.info(LogModule.API, '跳转到指定页面:', returnUrl);
    router.replace(returnUrl as any);
  } else if (router.canGoBack()) {
    Logger.info(LogModule.API, '返回上一页');
    router.back();
  } else {
    Logger.info(LogModule.API, '跳转到默认页面: /(tabs)/trading');
    router.replace('/(tabs)/trading' as any);
  }
}; 