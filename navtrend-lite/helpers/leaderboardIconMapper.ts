/**
 * 排行榜 Icon 映射工具
 * 
 * 根据排行榜的类型、代码等信息，动态返回对应的 icon 名称
 * 使用 Ionicons 或其他图标库的名称
 * 
 * @module utils/leaderboardIconMapper
 */

import type { LeaderboardMarketType } from '../types/leaderboard';

/**
 * 根据分类 ID 获取 Icon
 */
export function getCategoryIcon(categoryId: string): string {
  const iconMap: Record<string, string> = {
    'recommended': 'star',
    'stocks': 'trending-up',
    'crypto': 'logo-bitcoin',
    'indices': 'stats-chart',
    'forex': 'cash',
    'futures': 'pulse',
    'etf': 'briefcase',
  };

  return iconMap[categoryId] || 'list';
}

/**
 * 根据市场类型获取 Icon
 */
export function getMarketTypeIcon(marketType: LeaderboardMarketType): string {
  const iconMap: Record<LeaderboardMarketType, string> = {
    'stock': 'trending-up',
    'crypto': 'logo-bitcoin',
    'indices': 'stats-chart',
    'forex': 'cash',
    'futures': 'pulse',
    'etf': 'briefcase',
  };

  return iconMap[marketType] || 'analytics';
}

/**
 * 根据预设类型获取 Icon（更精细的映射）
 */
export function getPresetIcon(preset: string): string {
  // 参数验证
  if (!preset || typeof preset !== 'string') {
    return 'analytics';
  }
  
  // 涨跌相关
  if (preset.includes('gainers')) return 'trending-up';
  if (preset.includes('losers')) return 'trending-down';
  
  // 活跃度相关
  if (preset.includes('most_active') || preset.includes('most_traded')) return 'pulse';
  
  // 规模相关
  if (preset.includes('large_cap') || preset.includes('largest')) return 'resize';
  
  // 新上市
  if (preset.includes('new_listed')) return 'sparkles';
  
  // 回报相关
  if (preset.includes('return') || preset.includes('growth')) return 'arrow-up';
  
  // 指数相关
  if (preset.includes('major')) return 'podium';
  
  // 外汇相关
  if (preset.includes('forex_rates')) return 'cash';
  
  // 期货相关
  if (preset.includes('energy')) return 'flash';
  if (preset.includes('metals')) return 'diamond';
  if (preset.includes('agricultural')) return 'leaf';
  if (preset.includes('indices')) return 'stats-chart';
  
  return 'analytics';
}

/**
 * 综合获取排行榜 Icon
 * 
 * 优先级：preset > market_type
 */
export function getLeaderboardIcon(params: {
  marketType: LeaderboardMarketType;
  id: string;
}): string {
  const { marketType, id } = params;

  // 优先根据 id 获取更精确的 icon
  const presetIcon = getPresetIcon(id);
  if (presetIcon !== 'analytics') {
    return presetIcon;
  }

  // 兜底使用 market_type
  return getMarketTypeIcon(marketType);
}

