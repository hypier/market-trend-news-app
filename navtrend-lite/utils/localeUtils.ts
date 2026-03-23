import * as Localization from 'expo-localization';

/**
 * 设备区域信息工具
 * 职责：获取设备的语言和国家信息（纯设备信息层，不包含业务逻辑）
 */

// 缓存变量
let countryCodeCache: string | null = null;
let languageCodeCache: string | null = null;

/**
 * 获取设备当前语言代码
 * @returns 设备语言代码
 */
export const getDeviceLanguage = (): string => {
  // 如果已有缓存，直接返回
  if (languageCodeCache) {
    return languageCodeCache;
  }

  try {
    // 获取设备区域设置
    const locales = Localization.getLocales();
    const locale = locales && locales.length > 0 
      ? (locales[0].languageTag || locales[0].languageCode || 'en')
      : 'en';
    
    // 提取语言代码部分 (如 'zh-CN' -> 'zh')
    const languageCode = locale.split('-')[0];
    
    languageCodeCache = languageCode;
    return languageCode;
  } catch (error) {
    console.warn('[localeUtils] 获取设备语言失败:', error);
    languageCodeCache = 'en';
    return 'en'; // 默认返回英语
  }
};

/**
 * 获取设备所在国家/地区代码
 * 尽可能模拟Android的TelephonyManager.getNetworkCountryIso()效果
 * @returns 设备所在国家代码
 */
export const getDeviceCountryCode = (): string => {
  // 如果已有缓存，直接返回
  if (countryCodeCache) {
    return countryCodeCache;
  }

  try {
    // 首先尝试从区域设置获取
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      // 优先使用 regionCode
      if (locales[0].regionCode) {
        countryCodeCache = locales[0].regionCode;
        return countryCodeCache;
      }
      
      // 其次从 languageTag 提取 (如 'zh-CN' -> 'CN')
      if (locales[0].languageTag) {
        const parts = locales[0].languageTag.split('-');
        if (parts.length > 1) {
          countryCodeCache = parts[1].toUpperCase();
          return countryCodeCache;
        }
      }
    }
    
    // 默认返回 US
    countryCodeCache = 'US';
    return countryCodeCache;
  } catch (error) {
    console.warn('[localeUtils] 获取设备国家代码失败:', error);
    countryCodeCache = 'US';
    return countryCodeCache;
  }
};

/**
 * 强制刷新国家代码和语言代码缓存
 * 当需要更新缓存时调用，比如切换语言
 */
export const refreshLocaleCache = (): void => {
  countryCodeCache = null;
  languageCodeCache = null;

};

/**
 * 获取设备当前国家/地区代码
 * 向后兼容
 * @returns 设备国家/地区代码
 */
export const getCurrentCountryCode = (): string => {
  return getDeviceCountryCode();
};

/**
 * 获取SIM卡/网络运营商国家代码
 * @returns 国家代码
 */
export const getNetworkCountryCode = (): string => {
  // 在没有专用API的情况下，返回相同的国家代码
  return getDeviceCountryCode();
};

/**
 * 获取设备当前时区
 * 使用 expo-localization 获取 IANA 时区标识符
 * @returns 时区字符串，如 'Asia/Shanghai', 'America/New_York'
 */
export const getDeviceTimezone = (): string => {
  try {
    // 从 Localization.getCalendars() 获取时区信息
    const calendars = Localization.getCalendars();
    if (calendars && calendars.length > 0 && calendars[0].timeZone) {
      return calendars[0].timeZone;
    }
    
    // 回退到 Intl API
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone) {
      return timezone;
    }
    
    // 最后回退到默认时区
    return 'UTC';
  } catch (error) {
    console.warn('[localeUtils] 获取设备时区失败:', error);
    return 'UTC';
  }
};

/**
 * 获取时区偏移量（小时数）
 * @returns 时区偏移小时数，如 8 (GMT+8), -5 (GMT-5)
 */
export const getTimezoneOffset = (): number => {
  try {
    const offsetMinutes = -new Date().getTimezoneOffset();
    return Math.floor(offsetMinutes / 60);
  } catch (error) {
    console.warn('[localeUtils] 获取时区偏移失败:', error);
    return 0;
  }
}; 