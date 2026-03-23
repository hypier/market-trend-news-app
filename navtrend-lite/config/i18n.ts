import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Language, LanguageStrings } from '@/types/i18n';
import { getDeviceLanguage } from '@/utils/localeUtils';
import { zhStrings } from '@/utils/locales/zh';
import { enStrings } from '@/utils/locales/en';
import { deStrings } from '@/utils/locales/de';
import { idStrings } from '@/utils/locales/id';
import { jaStrings } from '@/utils/locales/ja';
import { koStrings } from '@/utils/locales/ko';
import { msStrings } from '@/utils/locales/ms';

/**
 * 国际化工具
 * 职责：翻译文本、语言包管理、用户语言偏好设置
 * 依赖：localeUtils（获取设备语言信息）
 */

// 语言映射配置 - 支持动态扩展
const LANGUAGE_MAPPINGS: Record<string, Language> = {
  // 中文变体
  'zh': 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  'zh-HK': 'zh',
  'zh-SG': 'zh',
  'zh-Hans': 'zh',
  'zh-Hant': 'zh',
  'zh-MO': 'zh',  // 澳门
  'zh-MY': 'zh',  // 马来西亚中文
  
  // 英文变体
  'en': 'en',
  'en-US': 'en',
  'en-GB': 'en',
  'en-AU': 'en',
  'en-CA': 'en',
  'en-NZ': 'en',
  'en-IE': 'en',
  'en-ZA': 'en',
  'en-IN': 'en',  // 印度英语
  'en-SG': 'en',  // 新加坡英语
  'en-PH': 'en',  // 菲律宾英语
  'en-HK': 'en',  // 香港英语
  
  // 日语变体
  'ja': 'ja',
  'ja-JP': 'ja',
  'ja-CN': 'ja',
  
  // 韩语变体
  'ko': 'ko',
  'ko-KR': 'ko',  // 韩国
  'ko-KP': 'ko',  // 朝鲜
  
  // 德语变体
  'de': 'de',
  'de-DE': 'de',  // 德国
  'de-AT': 'de',  // 奥地利
  'de-CH': 'de',  // 瑞士
  'de-LI': 'de',  // 列支敦士登
  'de-LU': 'de',  // 卢森堡
  
  // 印尼语变体
  'id': 'id',
  'id-ID': 'id',  // 印度尼西亚
  
  // 马来语变体
  'ms': 'ms',
  'ms-MY': 'ms',  // 马来西亚
  'ms-SG': 'ms',  // 新加坡
  'ms-BN': 'ms',  // 文莱
  'ms-ID': 'ms',  // 印尼
};

// 默认语言配置
const DEFAULT_LANGUAGE: Language = 'en';

/**
 * 获取系统默认语言
 * 依赖 localeUtils 获取设备语言，然后映射到应用支持的语言
 */
const getSystemLanguage = (): Language => {
  try {
    // 从 localeUtils 获取设备语言代码
    const deviceLang = getDeviceLanguage();
    
    // 精确匹配
    if (LANGUAGE_MAPPINGS[deviceLang]) {
      return LANGUAGE_MAPPINGS[deviceLang];
    }
    
    // 前缀匹配（如 'zh-CN' -> 'zh'）
    const langPrefix = deviceLang.split('-')[0];
    if (LANGUAGE_MAPPINGS[langPrefix]) {
      return LANGUAGE_MAPPINGS[langPrefix];
    }
    
    // 模糊匹配
    for (const [pattern, language] of Object.entries(LANGUAGE_MAPPINGS)) {
      if (deviceLang.toLowerCase().includes(pattern.toLowerCase())) {
        return language;
      }
    }
    
    // 返回默认语言
    return DEFAULT_LANGUAGE;
  } catch (error) {
    console.warn('[i18n] Failed to get system language:', error);
    return DEFAULT_LANGUAGE;
  }
};

// 当前语言状态（初始值将在initializeLanguage中设置）
let currentLanguage: Language = getSystemLanguage();

// 语言初始化状态
let isLanguageInitialized = false;

// 获取语言初始化状态
export const getLanguageInitializationStatus = (): boolean => {
  return isLanguageInitialized;
};

// 语言存储键
const LANGUAGE_STORAGE_KEY = 'app_language';

// 翻译缓存，提高性能
const translationCache = new Map<string, string>();

// 清除翻译缓存
const clearTranslationCache = (): void => {
  translationCache.clear();
};

// 动态语言包注册系统
class LanguageRegistry {
  private static instance: LanguageRegistry;
  private languageStrings: Map<Language, LanguageStrings> = new Map();
  private supportedLanguages: { code: Language; name: string; nativeName: string }[] = [];

  static getInstance(): LanguageRegistry {
    if (!LanguageRegistry.instance) {
      LanguageRegistry.instance = new LanguageRegistry();
    }
    return LanguageRegistry.instance;
  }

  // 注册语言包
  registerLanguage(
    code: Language, 
    strings: LanguageStrings, 
    displayName: string,
    nativeName: string
  ): void {
    this.languageStrings.set(code, strings);
    
    // 更新或添加到支持语言列表
    const existingIndex = this.supportedLanguages.findIndex(lang => lang.code === code);
    const languageInfo = { code, name: displayName, nativeName };
    
    if (existingIndex >= 0) {
      this.supportedLanguages[existingIndex] = languageInfo;
    } else {
      this.supportedLanguages.push(languageInfo);
    }

  }

  // 获取语言包
  getLanguageStrings(code: Language): LanguageStrings | undefined {
    return this.languageStrings.get(code);
  }

  // 获取所有支持的语言
  getSupportedLanguages(): { code: Language; name: string; nativeName: string }[] {
    return [...this.supportedLanguages];
  }

  // 检查语言是否已注册
  isLanguageSupported(code: Language): boolean {
    return this.languageStrings.has(code);
  }

  // 获取所有已注册的语言代码
  getRegisteredLanguageCodes(): Language[] {
    return Array.from(this.languageStrings.keys());
  }
}

// 创建全局注册表实例
const languageRegistry = LanguageRegistry.getInstance();

// 注册内置语言
languageRegistry.registerLanguage('zh', zhStrings, '中文', '中文');
languageRegistry.registerLanguage('en', enStrings, 'English', 'English');
languageRegistry.registerLanguage('de', deStrings, 'Deutsch', 'Deutsch');
languageRegistry.registerLanguage('id', idStrings, 'Indonesian', 'Bahasa Indonesia');
languageRegistry.registerLanguage('ja', jaStrings, 'Japanese', '日本語');
languageRegistry.registerLanguage('ko', koStrings, 'Korean', '한국어');
languageRegistry.registerLanguage('ms', msStrings, 'Malay', 'Bahasa Melayu');

// 兼容性：保持原有的 languageStrings 接口
const getLanguageStrings = (language: Language): LanguageStrings | undefined => {
  return languageRegistry.getLanguageStrings(language);
};

// 公共API：检查语言是否支持
export const isLanguageSupported = (code: Language): boolean => {
  return languageRegistry.isLanguageSupported(code);
};

// 初始化语言设置
export const initializeLanguage = async (): Promise<Language> => {
  try {
    // 尝试读取存储的语言设置（最高优先级）
    const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (storedLanguage && isLanguageSupported(storedLanguage as Language)) {
      currentLanguage = storedLanguage as Language;
      isLanguageInitialized = true;
      return currentLanguage;
    }
    
    // 没有存储的语言，使用系统检测的语言
    isLanguageInitialized = true;
    return currentLanguage;
    
  } catch (error) {
    console.warn('i18n: Failed to load language settings:', error);
    isLanguageInitialized = true;
  }
  
  isLanguageInitialized = true;
  return currentLanguage;
};

// 设置语言
export const setLanguage = async (language: Language): Promise<void> => {
  try {
    currentLanguage = language;
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    
    // 清除翻译缓存
    clearTranslationCache();
    
    // 刷新设备区域信息缓存（如果需要重新检测）
    try {
      const { refreshLocaleCache } = await import('@/utils/localeUtils');
      refreshLocaleCache();
    } catch (error) {
      console.warn('[i18n] Failed to refresh locale cache:', error);
    }
  } catch (error) {
    console.warn('[i18n] Failed to save language:', error);
  }
};

// 获取当前语言
export const getCurrentLanguage = (): Language => {
  return currentLanguage;
};

// 获取翻译文本（支持备用语言）
const getTranslationFromLanguage = (language: Language, key: string): string | null => {
  const strings = getLanguageStrings(language);
  if (!strings) return null;
  
  const keys = key.split('.');
  let result: any = strings;
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return null;
    }
  }
  
  return typeof result === 'string' ? result : null;
};

// 获取翻译文本
export const t = (key: string, params?: Record<string, string | number>): string => {
  // 创建缓存键，包含语言和参数
  const cacheKey = params ? `${currentLanguage}:${key}:${JSON.stringify(params)}` : `${currentLanguage}:${key}`;
  
  // 检查缓存
  const cached = translationCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 首先尝试当前语言
  let translatedText = getTranslationFromLanguage(currentLanguage, key);
  
  // 如果当前语言没有找到，尝试英文作为备用
  if (!translatedText && currentLanguage !== 'en') {
    translatedText = getTranslationFromLanguage('en', key);
  }
  
  // 如果仍然没有找到，尝试中文作为备用
  if (!translatedText && currentLanguage !== 'zh') {
    translatedText = getTranslationFromLanguage('zh', key);
  }
  
  // 如果都没有找到，返回键名
  if (!translatedText) {
    console.warn(`Translation key '${key}' not found in any language`);
    translatedText = key;
  }
  
  // 支持参数替换，如 t('common.welcome', { name: 'John' })
  if (params && translatedText) {
    Object.keys(params).forEach(paramKey => {
      const placeholder = `{{${paramKey}}}`;
      translatedText = translatedText!.replace(new RegExp(placeholder, 'g'), String(params[paramKey]));
    });
  }
  
  // 缓存结果
  translationCache.set(cacheKey, translatedText);
  
  return translatedText;
};

// 获取语言显示名称
export const getLanguageName = (language: Language): string => {
  switch (language) {
    case 'zh':
      return '中文';
    case 'en':
      return 'English';
    case 'de':
      return 'Deutsch';
    case 'id':
      return 'Bahasa Indonesia';
    case 'ja':
      return '日本語';
    case 'ko':
      return '한국어';
    case 'ms':
      return 'Bahasa Melayu';
    default:
      return language;
  }
};

// 导出语言列表 - 动态获取
export const getSupportedLanguages = (): { code: Language; name: string; nativeName: string }[] => {
  return languageRegistry.getSupportedLanguages();
};

// 向后兼容的静态导出
export const supportedLanguages: { code: Language; name: string }[] = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'ms', name: 'Bahasa Melayu' },
];

// 检查是否是RTL语言（从右到左）
export const isRTL = (language?: Language): boolean => {
  // 目前支持的语言都是LTR，未来可以扩展
  return false;
};

// 获取语言的本地化显示名称
export const getLocalizedLanguageName = (language: Language): string => {
  if (currentLanguage === 'zh') {
    return language === 'zh' ? '中文' : '英文';
  } else {
    return language === 'zh' ? 'Chinese' : 'English';
  }
};

// 验证翻译键是否存在
export const hasTranslation = (key: string, language?: Language): boolean => {
  const lang = language || currentLanguage;
  return getTranslationFromLanguage(lang, key) !== null;
};

// 获取所有可用的翻译键（开发时调试用）
export const getAllTranslationKeys = (language?: Language): string[] => {
  const lang = language || currentLanguage;
  const strings = getLanguageStrings(lang);
  if (!strings) return [];
  
  const keys: string[] = [];
  
  const extractKeys = (obj: any, prefix = ''): void => {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'string') {
        keys.push(fullKey);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractKeys(obj[key], fullKey);
      }
    });
  };
  
  extractKeys(strings);
  return keys.sort();
};

// 开发时调试工具
export const debugI18n = {
  // 获取缓存信息
  getCacheInfo: () => ({
    size: translationCache.size,
    keys: Array.from(translationCache.keys()).slice(0, 10), // 只显示前10个
  }),
  
  // 清除缓存
  clearCache: clearTranslationCache,
  
  // 检查缺失的翻译
  checkMissingTranslations: (language: Language = currentLanguage) => {
    const allKeys = getAllTranslationKeys('zh'); // 以中文为基准
    const missing: string[] = [];
    
    allKeys.forEach(key => {
      if (!hasTranslation(key, language)) {
        missing.push(key);
      }
    });
    
    return missing;
  },
  
  // 获取翻译统计
  getTranslationStats: () => {
    const zhKeys = getAllTranslationKeys('zh');
    const enKeys = getAllTranslationKeys('en');
    
    return {
      totalKeys: zhKeys.length,
      chineseComplete: zhKeys.length,
      englishComplete: enKeys.length,
      completeness: {
        chinese: '100%',
        english: `${Math.round((enKeys.length / zhKeys.length) * 100)}%`,
      },
    };
  },
};

// 动态语言映射添加API
export const addLanguageMapping = (locale: string, language: Language): void => {
  LANGUAGE_MAPPINGS[locale] = language;
};

// 更新默认语言API
export const setDefaultLanguage = (language: Language): void => {
  if (isLanguageSupported(language)) {
    // @ts-ignore - 修改常量用于动态配置
    DEFAULT_LANGUAGE = language;
  } else {
    console.warn(`Cannot set default language to unsupported language: ${language}`);
  }
};

// 重新导出类型，方便其他文件导入
export type { Language, LanguageStrings } from '@/types/i18n';