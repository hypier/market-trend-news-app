import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import 'dayjs/locale/en';
import 'dayjs/locale/de';
import 'dayjs/locale/ja';
import 'dayjs/locale/ko';
import 'dayjs/locale/id';
import 'dayjs/locale/ms';
import { getCurrentLanguage } from '@/config/i18n';
import { getDeviceTimezone, getTimezoneOffset } from '@/utils/localeUtils';

// 扩展相对时间插件
dayjs.extend(relativeTime);

/**
 * 获取 dayjs 语言映射
 */
const getDayjsLocale = (appLang: string): string => {
  const localeMap: Record<string, string> = {
    'zh': 'zh-cn',
    'en': 'en',
    'de': 'de',
    'ja': 'ja',
    'ko': 'ko',
    'id': 'id',
    'ms': 'ms',
  };
  return localeMap[appLang] || 'en';
};

/**
 * 格式化时间戳为相对时间（如 "刚刚"、"半小时前"、"1天前"）
 * @param timestamp 时间戳（秒）
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (timestamp: number): string => {
  const appLang = getCurrentLanguage();
  const dayjsLocale = getDayjsLocale(appLang);
  
  // 设置语言
  dayjs.locale(dayjsLocale);
  
  // 转换为毫秒
  const date = dayjs.unix(timestamp);
  
  return date.fromNow();
};

/**
 * 格式化时间戳为标准日期时间
 * @param timestamp 时间戳（秒）
 * @param format 格式字符串（默认 'YYYY-MM-DD HH:mm'）
 * @returns 格式化的日期时间字符串
 */
export const formatDateTime = (timestamp: number, format: string = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs.unix(timestamp).format(format);
};

/**
 * 格式化完整日期时间（带时区信息）
 * 使用 expo-localization 获取时区信息
 * @param timestamp Unix时间戳（秒）
 * @returns 格式化的日期时间字符串（如：2025年10月17日 GMT+8 19:17）
 */
export const formatFullDateTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  
  // 获取本地日期
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  // 使用 expo-localization 获取时区偏移
  const offsetHours = getTimezoneOffset();
  const offsetSign = offsetHours >= 0 ? '+' : '-';
  const gmtOffset = `GMT${offsetSign}${Math.abs(offsetHours)}`;
  
  return `${year}-${month}-${day} ${gmtOffset} ${hours}:${minutes}`;
};

/**
 * 获取当前设备时区
 * @returns IANA 时区标识符，如 'Asia/Shanghai', 'America/New_York'
 */
export const getCurrentTimezone = (): string => {
  return getDeviceTimezone();
};

/**
 * 格式化日期为显示文本（支持多语言）
 * 用于新闻分组等场景，显示"今天"、"昨天"或具体日期
 * @param timestamp 时间戳（秒）
 * @returns 格式化的日期文本
 */
export const formatDateHeader = (timestamp: number): string => {
  const appLang = getCurrentLanguage();
  const dayjsLocale = getDayjsLocale(appLang);
  
  // 设置语言
  dayjs.locale(dayjsLocale);
  
  const date = dayjs.unix(timestamp);
  const now = dayjs();
  const today = now.startOf('day');
  const yesterday = today.subtract(1, 'day');
  const itemDate = date.startOf('day');
  
  // 判断是今天、昨天还是更早
  if (itemDate.isSame(today)) {
    // 今天
    return appLang === 'zh' ? '今天' :
           appLang === 'ja' ? '今日' :
           appLang === 'ko' ? '오늘' :
           appLang === 'de' ? 'Heute' :
           appLang === 'id' ? 'Hari ini' :
           appLang === 'ms' ? 'Hari ini' :
           'Today';
  } else if (itemDate.isSame(yesterday)) {
    // 昨天
    return appLang === 'zh' ? '昨天' :
           appLang === 'ja' ? '昨日' :
           appLang === 'ko' ? '어제' :
           appLang === 'de' ? 'Gestern' :
           appLang === 'id' ? 'Kemarin' :
           appLang === 'ms' ? 'Semalam' :
           'Yesterday';
  } else {
    // 更早的日期 - 使用本地化格式
    if (appLang === 'zh') {
      return date.format('M月D日');
    } else if (appLang === 'ja') {
      return date.format('M月D日');
    } else if (appLang === 'ko') {
      return date.format('M월 D일');
    } else if (appLang === 'de') {
      return date.format('D. MMM');
    } else {
      // 英文、印尼语、马来语使用 MMM D 格式
      return date.format('MMM D');
    }
  }
};
