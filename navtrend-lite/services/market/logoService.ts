/**
 * Logo 服务模块
 * 负责从 TradingView CDN 获取和处理股票 Logo
 * 
 * 功能：
 * - SVG 内容获取（带超时和错误处理）
 * - 双层缓存系统：
 *   1. 内存缓存（Map）- 快速访问，应用重启后清空
 *   2. 持久化存储（AsyncStorage）- 长期缓存，30天过期，应用重启后保留
 * - SVG 预处理（缩放、居中）
 * - 工具函数（颜色生成、字母提取）
 * 
 * 缓存策略：
 * - 成功下载的 Logo：缓存 30 天（持久化存储）
 * - 下载失败的 Logo：不缓存到持久化存储，只保留在内存中（应用重启后清空）
 * - 这样下次应用启动时可以重新尝试下载，避免永久显示字母图标
 * - 读取顺序：内存缓存 → 持久化存储 → 网络下载
 * 
 * @author NavTrend Team
 * @version 2.0.0
 */

import { Logger, LogModule } from '@/utils/logger';
import { MarketNewsBrand } from '@/config/brand';
import { Storage } from '@/utils/storage';

// TradingView Logo CDN 基础URL
const LOGO_BASE_URL = 'https://tv-logo.tradingviewapi.com/logo';

// 缓存键前缀
const LOGO_CACHE_PREFIX = 'logo_';

// 内存缓存（用于快速访问，避免频繁读取 AsyncStorage）
const logoCache = new Map<string, string | null>();

// Logo 缓存过期时间（30天，单位：分钟）
const LOGO_CACHE_TTL_MINUTES = 30 * 24 * 60;

/**
 * 预处理 SVG 内容，确保正确缩放和居中
 */
export const preprocessSvg = (svgContent: string): string => {
  let processed = svgContent;
  
  // 1. 提取原始的 width 和 height（用于生成 viewBox）
  const widthMatch = svgContent.match(/\s+width="([^"]*)"/i);
  const heightMatch = svgContent.match(/\s+height="([^"]*)"/i);
  const originalWidth = widthMatch ? widthMatch[1] : '56';
  const originalHeight = heightMatch ? heightMatch[1] : '56';
  
  // 2. 移除固定的 width 和 height 属性
  processed = processed.replace(/\s+width="[^"]*"/gi, '');
  processed = processed.replace(/\s+height="[^"]*"/gi, '');
  
  // 3. 确保有 viewBox（如果没有，根据原始尺寸生成）
  if (!processed.includes('viewBox')) {
    const viewBox = `0 0 ${originalWidth} ${originalHeight}`;
    processed = processed.replace(
      /<svg/i,
      `<svg viewBox="${viewBox}"`
    );
  }
  
  // 4. 添加或替换 preserveAspectRatio
  if (processed.includes('preserveAspectRatio')) {
    processed = processed.replace(
      /preserveAspectRatio="[^"]*"/gi,
      'preserveAspectRatio="xMidYMid meet"'
    );
  } else {
    processed = processed.replace(
      /<svg/i,
      '<svg preserveAspectRatio="xMidYMid meet"'
    );
  }
  
  return processed;
};

/**
 * 从持久化存储获取 Logo
 */
const getCachedLogoFromStorage = async (logoid: string): Promise<string | null | undefined> => {
  try {
    const cached = await Storage.getCache<string>(LOGO_CACHE_PREFIX + logoid);
    return cached;
  } catch (error) {
    Logger.warn(LogModule.STOCK, `Failed to get logo from storage for ${logoid}:`, error);
    return undefined;
  }
};

/**
 * 保存 Logo 到持久化存储
 * 只缓存成功下载的 SVG，失败的情况不缓存到持久化存储
 */
const saveLogoToStorage = async (logoid: string, svgContent: string | null): Promise<void> => {
  try {
    if (svgContent === null) {
      // 失败的情况：只缓存到内存（应用重启后清空），不缓存到持久化存储
      // 这样下次应用启动时可以重新尝试下载
      // 但为了在当前会话中避免频繁重试，会在内存中保留失败标记
      return;
    } else {
      // 只缓存成功下载的 SVG 内容，设置长期过期时间（30天）
      await Storage.setCache(LOGO_CACHE_PREFIX + logoid, svgContent, LOGO_CACHE_TTL_MINUTES);
    }
  } catch (error) {
    Logger.warn(LogModule.STOCK, `Failed to save logo to storage for ${logoid}:`, error);
  }
};

/**
 * 下载 SVG 内容（带超时处理和持久化缓存）
 */
export const fetchSvgContent = async (logoid: string): Promise<string | null> => {
  try {
    // 1. 先检查内存缓存（最快）
    if (logoCache.has(logoid)) {
      return logoCache.get(logoid) || null;
    }

    // 2. 检查持久化存储缓存（只包含成功下载的 SVG）
    const cachedFromStorage = await getCachedLogoFromStorage(logoid);
    if (cachedFromStorage !== undefined && cachedFromStorage !== null) {
      // 同步到内存缓存，加快后续访问
      logoCache.set(logoid, cachedFromStorage);
      return cachedFromStorage;
    }
    
    // 如果持久化存储中有 null（失败标记），说明之前下载失败过
    // 但为了允许重新尝试，我们不在持久化存储中缓存失败标记
    // 只在内存中保留失败标记，避免当前会话中频繁重试

    // 3. 缓存未命中，从网络下载
    const url = `${LOGO_BASE_URL}/${logoid}--big.svg`;

    // 创建超时控制器
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 5000); // 5秒超时

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'image/svg+xml',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': 'https://www.tradingview.com',
        'Origin': 'https://www.tradingview.com',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 失败情况：只缓存到内存（当前会话），不缓存到持久化存储
      // 这样下次应用启动时可以重新尝试下载
      logoCache.set(logoid, null);
      return null;
    }

    const svgContent = await response.text();
    
    // 验证是否是有效的 SVG
    if (!svgContent.includes('<svg')) {
      Logger.warn(LogModule.STOCK, `Invalid SVG content for ${logoid}, content: ${svgContent.substring(0, 200)}`);
      // 无效内容：只缓存到内存（当前会话），不缓存到持久化存储
      logoCache.set(logoid, null);
      return null;
    }

    // 4. 保存到内存和持久化存储
    logoCache.set(logoid, svgContent);
    await saveLogoToStorage(logoid, svgContent);
    
    return svgContent;
  } catch (error) {
    // 处理中止错误（超时）
    if (error instanceof Error && error.name === 'AbortError') {
      // 超时：只缓存到内存（当前会话），不缓存到持久化存储
      logoCache.set(logoid, null);
      return null;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : 'Unknown';
    Logger.error(LogModule.STOCK, `❌ Error fetching logo for ${logoid}: [${errorName}] ${errorMessage}`);
    // 其他错误：只缓存到内存（当前会话），不缓存到持久化存储
    logoCache.set(logoid, null);
    return null;
  }
};

/**
 * 生成背景颜色（基于字符串哈希）
 */
export const generateColor = (str: string): string => {
  if (!str) return MarketNewsBrand.colors.background.secondary;
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 生成柔和的颜色
  const colors = [
    '#4A90E2', // 蓝色
    '#50C878', // 绿色
    '#9B59B6', // 紫色
    '#E67E22', // 橙色
    '#E91E63', // 粉色
    '#00BCD4', // 青色
    '#FF9800', // 深橙色
    '#8BC34A', // 浅绿色
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

/**
 * 获取字母图标文本（取前1-2个字符）
 */
export const getInitials = (symbol: string): string => {
  if (!symbol) return '?';
  const cleaned = symbol.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  return cleaned.substring(0, 2);
};

/**
 * 清除 Logo 缓存（内存 + 持久化存储）
 */
export const clearLogoCache = async (): Promise<void> => {
  // 清除内存缓存
  logoCache.clear();
  
  // 清除持久化存储中的 Logo 缓存
  try {
    await Storage.clearCacheByPattern(LOGO_CACHE_PREFIX);
    Logger.info(LogModule.STOCK, 'Cleared all logo cache (memory + storage)');
  } catch (error) {
    Logger.warn(LogModule.STOCK, 'Failed to clear logo cache from storage:', error);
  }
};

/**
 * 预加载 Logo
 */
export const preloadLogos = async (logoids: string[]): Promise<void> => {
  const promises = logoids.map(logoid => fetchSvgContent(logoid));
  await Promise.allSettled(promises);
};

/**
 * 获取缓存的 Logo（不触发网络请求）
 * 先检查内存缓存，再检查持久化存储
 * 注意：持久化存储中只包含成功下载的 SVG，不包含失败标记
 */
export const getCachedLogo = async (logoid: string): Promise<string | null | undefined> => {
  // 先检查内存缓存
  if (logoCache.has(logoid)) {
    return logoCache.get(logoid);
  }
  
  // 检查持久化存储（只包含成功下载的 SVG）
  const cached = await getCachedLogoFromStorage(logoid);
  if (cached !== undefined && cached !== null) {
    // 同步到内存缓存
    logoCache.set(logoid, cached);
    return cached;
  }
  
  // 持久化存储中没有缓存，返回 undefined（允许重新尝试下载）
  return undefined;
};

/**
 * Logo 服务类
 */
export class LogoService {
  /**
   * 获取 SVG 内容（带缓存）
   */
  static async getSvgContent(logoid: string): Promise<string | null> {
    return fetchSvgContent(logoid);
  }

  /**
   * 预处理 SVG 内容
   */
  static preprocessSvg(svgContent: string): string {
    return preprocessSvg(svgContent);
  }

  /**
   * 生成背景颜色
   */
  static generateColor(str: string): string {
    return generateColor(str);
  }

  /**
   * 获取字母图标
   */
  static getInitials(symbol: string): string {
    return getInitials(symbol);
  }

  /**
   * 清除缓存（内存 + 持久化存储）
   */
  static async clearCache(): Promise<void> {
    return clearLogoCache();
  }

  /**
   * 预加载多个 Logo
   */
  static async preload(logoids: string[]): Promise<void> {
    return preloadLogos(logoids);
  }

  /**
   * 获取缓存的 Logo（异步，会检查持久化存储）
   */
  static async getCached(logoid: string): Promise<string | null | undefined> {
    return getCachedLogo(logoid);
  }
}

