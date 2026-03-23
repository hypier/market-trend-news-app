/**
 * 新闻日期分组工具函数
 */

import { TradingViewNewsItem } from '@/types/stock';
import { formatDateHeader } from '@/utils/timeFormat';

export interface GroupedNewsItem {
  type: 'header' | 'news';
  id: string;
  date?: string; // 仅用于 header 类型
  newsItem?: TradingViewNewsItem; // 仅用于 news 类型
  isFirstInGroup?: boolean; // 是否是组内第一条
  isLastInGroup?: boolean; // 是否是组内最后一条
  showTimeLabel?: boolean; // 是否显示时间标签（仅当时间与上一条不同时显示）
}

/**
 * 获取日期的标识符（用于分组）
 * @param timestamp 时间戳（秒）
 * @returns 日期标识符（YYYY-MM-DD）
 */
function getDateKey(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取相对时间键（用于判断时间标签是否相同）
 * @param timestamp 时间戳（秒）
 * @returns 相对时间键（如 "5m", "2h", "1d"）
 */
function getRelativeTimeKey(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp * 1000;
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) {
    return 'now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m`; // 分钟
  } else if (diffMinutes < 1440) {
    return `${Math.floor(diffMinutes / 60)}h`; // 小时
  } else {
    return `${Math.floor(diffMinutes / 1440)}d`; // 天
  }
}

/**
 * 将新闻列表按日期分组
 * @param newsList 新闻列表
 * @returns 分组后的列表（包含日期头部和新闻项）
 */
export function groupNewsByDate(newsList: TradingViewNewsItem[]): GroupedNewsItem[] {
  if (!newsList || newsList.length === 0) {
    return [];
  }

  const grouped: GroupedNewsItem[] = [];
  let currentDateKey: string | null = null;
  let currentGroupItems: TradingViewNewsItem[] = [];
  let lastRelativeTimeKey: string | null = null;

  // 按日期分组
  newsList.forEach((item, index) => {
    const dateKey = getDateKey(item.published);
    
    // 遇到新的日期分组
    if (dateKey !== currentDateKey) {
      // 先处理上一个分组的项目
      if (currentGroupItems.length > 0) {
        currentGroupItems.forEach((groupItem, groupIndex) => {
          const relativeTimeKey = getRelativeTimeKey(groupItem.published);
          const showTimeLabel = groupIndex === 0 || relativeTimeKey !== lastRelativeTimeKey;
          lastRelativeTimeKey = relativeTimeKey;
          
          grouped.push({
            type: 'news',
            id: groupItem.id,
            newsItem: groupItem,
            isFirstInGroup: groupIndex === 0,
            isLastInGroup: groupIndex === currentGroupItems.length - 1,
            showTimeLabel,
          });
        });
      }
      
      // 添加新的日期头部
      grouped.push({
        type: 'header',
        id: `header-${dateKey}`,
        date: formatDateHeader(item.published),
      });
      
      currentDateKey = dateKey;
      currentGroupItems = [item];
      lastRelativeTimeKey = null; // 重置相对时间键
    } else {
      // 同一日期分组
      currentGroupItems.push(item);
    }
    
    // 处理最后一组
    if (index === newsList.length - 1 && currentGroupItems.length > 0) {
      currentGroupItems.forEach((groupItem, groupIndex) => {
        const relativeTimeKey = getRelativeTimeKey(groupItem.published);
        const showTimeLabel = groupIndex === 0 || relativeTimeKey !== lastRelativeTimeKey;
        lastRelativeTimeKey = relativeTimeKey;
        
        grouped.push({
          type: 'news',
          id: groupItem.id,
          newsItem: groupItem,
          isFirstInGroup: groupIndex === 0,
          isLastInGroup: groupIndex === currentGroupItems.length - 1,
          showTimeLabel,
        });
      });
    }
  });

  return grouped;
}
