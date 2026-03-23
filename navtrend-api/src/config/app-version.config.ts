/**
 * 应用版本配置文件
 * 
 * 用于管理应用版本信息，替代数据库存储方式
 * 修改此文件后需要重新部署 API 服务
 * 
 * 临时关闭版本更新提示：
 * 将 CURRENT_VERSION.enabled 设置为 false 即可临时关闭所有版本更新提示
 * 适用于开发、测试或紧急情况下的快速禁用
 */

/**
 * 应用版本配置接口
 */
export interface AppVersionConfig {
  /** 版本名称（例如：2.0.0） */
  versionName: string;
  
  /** iOS 构建号 */
  buildNumberIos: number | null;
  
  /** Android 构建号 */
  buildNumberAndroid: number | null;
  
  /** 更新类型：optional-可选，recommended-推荐，required-必需 */
  updateType: 'optional' | 'recommended' | 'required';
  
  /** iOS 最低支持构建号（低于此版本将强制更新） */
  minimumSupportedBuildIos: number | null;
  
  /** Android 最低支持构建号（低于此版本将强制更新） */
  minimumSupportedBuildAndroid: number | null;
  
  /** 提醒间隔（天数） */
  reminderInterval: number;
  
  /** 发布日期 */
  releaseDate: string;
  
  /** 发布说明（多语言支持） */
  releaseNotes?: {
    en: string;      // 英文
    zh: string;      // 中文（简体）
    ja: string;      // 日文
    ko: string;      // 韩文
    de: string;      // 德文
    id: string;      // 印尼文
    ms: string;      // 马来文
  };
  
  /** 是否启用版本更新检查（默认 true，设置为 false 可临时关闭更新提示） */
  enabled?: boolean;
}

/**
 * 当前活跃版本配置
 * 
 * 这是主要的版本配置，API 将返回此版本信息给客户端
 */
export const CURRENT_VERSION: AppVersionConfig = {
  versionName: '2.0.1',
  buildNumberIos: 15,
  buildNumberAndroid: 14,
  updateType: 'recommended',
  minimumSupportedBuildIos: 10,
  minimumSupportedBuildAndroid: 10,
  reminderInterval: 3,
  releaseDate: '2025-01-08',
  releaseNotes: {
    en: 'Bug fixes and performance improvements',
    zh: '错误修复和性能改进',
    ja: 'バグ修正とパフォーマンスの改善',
    ko: '버그 수정 및 성능 개선',
    de: 'Fehlerbehebungen und Leistungsverbesserungen',
    id: 'Perbaikan bug dan peningkatan kinerja',
    ms: 'Pembaikan pepijat dan peningkatan prestasi',
  },
  enabled: false, // 设置为 false 可临时关闭版本更新提示
};

/**
 * 应用下载链接配置
 */
export const APP_DOWNLOAD_URLS = {
  ios: 'https://apps.apple.com/us/app/markettrendnews/id6752238603',
  android: 'https://www.marketrendnews.top/apk',
};

/**
 * 版本历史记录（可选）
 * 
 * 保留最近的版本历史，用于追踪和参考
 * 建议保留最近 3-5 个版本
 */
export const VERSION_HISTORY: AppVersionConfig[] = [
  CURRENT_VERSION,
  {
    versionName: '1.9.0',
    buildNumberIos: 13,
    buildNumberAndroid: 13,
    updateType: 'recommended',
    minimumSupportedBuildIos: 10,
    minimumSupportedBuildAndroid: 10,
    reminderInterval: 3,
    releaseDate: '2025-01-01',
    releaseNotes: {
      en: 'New features and improvements',
      zh: '新功能和改进',
      ja: '新機能と改善',
      ko: '새로운 기능 및 개선 사항',
      de: 'Neue Funktionen und Verbesserungen',
      id: 'Fitur baru dan peningkatan',
      ms: 'Ciri baharu dan penambahbaikan',
    },
  },
  // 更多历史版本可以在此添加...
];

/**
 * 获取发布说明（根据语言）
 * 
 * @param locale 语言代码（例如：en, zh, ja）
 * @returns 对应语言的发布说明，如果不存在则返回英文
 */
export function getReleaseNotes(locale?: string): string | undefined {
  if (!CURRENT_VERSION.releaseNotes) {
    return undefined;
  }
  
  const supportedLocales: (keyof typeof CURRENT_VERSION.releaseNotes)[] = [
    'en', 'zh', 'ja', 'ko', 'de', 'id', 'ms'
  ];
  
  // 标准化语言代码（取前两位）
  const normalizedLocale = locale?.toLowerCase().substring(0, 2) as keyof typeof CURRENT_VERSION.releaseNotes;
  
  // 如果请求的语言存在，返回对应语言的发布说明
  if (normalizedLocale && supportedLocales.includes(normalizedLocale)) {
    return CURRENT_VERSION.releaseNotes[normalizedLocale];
  }
  
  // 否则返回英文作为默认语言
  return CURRENT_VERSION.releaseNotes.en;
}

