/**
 * 货币格式化工具
 * 根据不同的货币代码格式化价格显示
 */

import { getCurrentCountryCode } from '@/utils/localeUtils';

// 货币符号映射
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  CNY: '¥',
  HKD: 'HK$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  KRW: '₩',
  SGD: 'S$',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF',
  TWD: 'NT$',
  THB: '฿',
  INR: '₹',
  MYR: 'RM',
  IDR: 'Rp',
  VND: '₫',
  PHP: '₱',
  BTC: 'BTC',
  ETH: 'ETH',
  // 可以根据需要添加更多货币
};

// 国家/地区代码到货币代码的映射
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // 北美
  US: 'USD', // 美国
  CA: 'CAD', // 加拿大
  MX: 'MXN', // 墨西哥
  
  // 欧洲
  GB: 'GBP', // 英国
  DE: 'EUR', // 德国
  FR: 'EUR', // 法国
  IT: 'EUR', // 意大利
  ES: 'EUR', // 西班牙
  NL: 'EUR', // 荷兰
  CH: 'CHF', // 瑞士
  
  // 亚洲
  CN: 'CNY', // 中国
  HK: 'HKD', // 香港
  TW: 'TWD', // 台湾
  JP: 'JPY', // 日本
  KR: 'KRW', // 韩国
  SG: 'SGD', // 新加坡
  IN: 'INR', // 印度
  MY: 'MYR', // 马来西亚
  ID: 'IDR', // 印度尼西亚
  TH: 'THB', // 泰国
  VN: 'VND', // 越南
  PH: 'PHP', // 菲律宾
  
  // 大洋洲
  AU: 'AUD', // 澳大利亚
  NZ: 'NZD', // 新西兰
};

// 货币对应的国旗/图标 emoji
export const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  CNY: '🇨🇳',
  HKD: '🇭🇰',
  EUR: '🇪🇺',
  GBP: '🇬🇧',
  JPY: '🇯🇵',
  KRW: '🇰🇷',
  SGD: '🇸🇬',
  AUD: '🇦🇺',
  CAD: '🇨🇦',
  CHF: '🇨🇭',
  TWD: '🌸',  // 樱花符号
  THB: '🇹🇭',
  INR: '🇮🇳',
  MYR: '🇲🇾',
  IDR: '🇮🇩',
  VND: '🇻🇳',
  PHP: '🇵🇭',
  BTC: '₿',  // 比特币符号
  ETH: 'Ξ',  // 以太坊符号
};

// 货币名称映射
export const CURRENCY_NAMES_ZH: Record<string, string> = {
  USD: 'US Dollar($)',
  CNY: 'Chinese Yuan(¥)',
  HKD: 'Hong Kong Dollar(HK$)',
  EUR: 'Euro(€)',
  GBP: 'British Pound(£)',
  JPY: 'Japanese Yen(¥)',
  KRW: 'Korean Won(₩)',
  SGD: 'Singapore Dollar(S$)',
  AUD: 'Australian Dollar(A$)',
  CAD: 'Canadian Dollar(C$)',
  CHF: 'Swiss Franc(CHF)',
  TWD: 'Taiwan Dollar(NT$)',
  THB: 'Thai Baht(฿)',
  INR: 'Indian Rupee(₹)',
  MYR: 'Malaysian Ringgit(RM)',
  IDR: 'Indonesian Rupiah(Rp)',
  VND: 'Vietnamese Dong(₫)',
  PHP: 'Philippine Peso(₱)',
  BTC: 'Bitcoin(BTC)',
  ETH: 'Ethereum(ETH)',
};

// 货币小数位配置
const CURRENCY_DECIMALS: Record<string, number> = {
  JPY: 0,    // 日元通常不显示小数
  KRW: 0,    // 韩元通常不显示小数
  VND: 0,    // 越南盾通常不显示小数
  IDR: 0,    // 印尼盾通常不显示小数
  HUF: 0,    // 匈牙利福林通常不显示小数
  CLP: 0,    // 智利比索通常不显示小数
  COP: 0,    // 哥伦比亚比索通常不显示小数
  ISK: 0,    // 冰岛克朗通常不显示小数
  LAK: 0,    // 老挝基普通常不显示小数
  KHR: 0,    // 柬埔寨瑞尔通常不显示小数
  BTC: 8,    // 比特币最多显示8位小数
  ETH: 6,    // 以太坊在UI中通常显示6位小数（实际可达18位）
  // 其他货币默认2位小数
};

/**
 * 格式化价格显示
 * @param price 价格数值
 * @param currency 货币代码，如 'USD', 'CNY', 'HKD' 等
 * @param withSymbol 是否包含货币符号，默认为true
 * @returns 格式化后的价格字符串，如 '$100.50', '¥688.88'
 */
export function formatPrice(price: number, currency: string = 'USD', withSymbol: boolean = true): string {
  if (typeof price !== 'number' || isNaN(price)) {
    return formatPrice(0, currency, withSymbol);
  }

  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  
  if (withSymbol) {
    return `${symbol}${price.toFixed(decimals)}`;
  } else {
    return price.toFixed(decimals);
  }
}

/**
 * 格式化变化金额显示
 * @param change 变化金额
 * @param currency 货币代码
 * @returns 格式化后的变化金额，如 '+$5.20', '-¥12.50'
 */
export function formatChange(change: number, currency: string = 'USD'): string {
  if (typeof change !== 'number' || isNaN(change)) {
    return formatChange(0, currency);
  }

  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  const sign = change >= 0 ? '+' : '';
  
  return `${sign}${symbol}${change.toFixed(decimals)}`;
}

/**
 * 格式化百分比显示
 * @param changePercent 百分比变化
 * @returns 格式化后的百分比，如 '+2.50%', '-1.20%'
 */
export function formatChangePercent(changePercent: number): string {
  if (typeof changePercent !== 'number' || isNaN(changePercent)) {
    return '0.00%';
  }

  const sign = changePercent >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
}

/**
 * 格式化市值显示
 * @param marketCap 市值
 * @param currency 货币代码
 * @returns 格式化后的市值，如 '$1.50T', '¥2.30B'
 */
export function formatMarketCap(marketCap: number, currency: string = 'USD'): string {
  if (typeof marketCap !== 'number' || isNaN(marketCap)) {
    return formatPrice(0, currency);
  }

  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
  
  if (marketCap >= 1000000000000) {
    return `${symbol}${(marketCap / 1000000000000).toFixed(2)}T`;
  } else if (marketCap >= 1000000000) {
    return `${symbol}${(marketCap / 1000000000).toFixed(2)}B`;
  } else if (marketCap >= 1000000) {
    return `${symbol}${(marketCap / 1000000).toFixed(2)}M`;
  } else if (marketCap >= 1000) {
    return `${symbol}${(marketCap / 1000).toFixed(2)}K`;
  }
  
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  return `${symbol}${marketCap.toFixed(decimals)}`;
}

/**
 * 格式化成交量显示
 * @param volume 成交量
 * @returns 格式化后的成交量，如 '1.5M', '325.6K'
 */
export function formatVolume(volume: number): string {
  if (typeof volume !== 'number' || isNaN(volume)) {
    return '0';
  }

  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  
  return volume.toString();
}

/**
 * 获取货币符号
 * @param currency 货币代码
 * @returns 货币符号
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
}

/**
 * 根据设备区域设置获取默认货币代码
 * @returns 货币代码（如 USD, CNY 等）
 */
export function getDefaultCurrencyByLocale(): string {
  try {
    // 使用localeUtils获取设备国家代码
    const countryCode = getCurrentCountryCode();
    
    // 从国家代码映射到货币代码
    const currencyCode = COUNTRY_TO_CURRENCY[countryCode];
    
    // 如果找到对应的货币代码，并且该货币在支持列表中，则返回该货币代码
    if (currencyCode && CURRENCY_SYMBOLS[currencyCode]) {
      return currencyCode;
    }
    
    // 默认返回美元
    return 'USD';
  } catch (error) {
    console.error('获取默认货币失败:', error);
    return 'USD'; // 出错时默认返回美元
  }
}

/**
 * 获取货币对字符串
 * @param fromCurrency 基础货币
 * @param toCurrency 目标货币
 * @returns 货币对字符串，如 'USD/CNY'
 */
export function getCurrencyPair(fromCurrency: string, toCurrency: string): string {
  return `${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}`;
}

/**
 * 格式化汇率显示
 * @param rate 汇率数值
 * @param fromCurrency 基础货币
 * @param toCurrency 目标货币
 * @returns 格式化后的汇率字符串，如 '1 USD = 7.25 CNY'
 */
export function formatExchangeRate(rate: number, fromCurrency: string, toCurrency: string): string {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return `1 ${fromCurrency} = ? ${toCurrency}`;
  }
  
  const fromSymbol = CURRENCY_SYMBOLS[fromCurrency.toUpperCase()] || fromCurrency.toUpperCase();
  const toSymbol = CURRENCY_SYMBOLS[toCurrency.toUpperCase()] || toCurrency.toUpperCase();
  const decimals = 4; // 汇率通常显示4位小数
  
  return `1 ${fromCurrency} (${fromSymbol}) = ${rate.toFixed(decimals)} ${toCurrency} (${toSymbol})`;
}

/**
 * 格式化百分比显示
 * @param percentage 百分比数值（如：5.67 表示 5.67%）
 * @param decimals 小数位数，默认2位
 * @returns 格式化后的百分比字符串，如 '5.67%'
 */
export function formatPercentage(percentage: number, decimals: number = 2): string {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return '0.00%';
  }
  
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * 格式化价格 - 使用货币代码而非符号
 * @param value 价格
 * @param currencyCode 货币代码 (USD, CNY, JPY等)
 * @param decimals 小数位数（可选，默认使用货币的标准小数位）
 * @returns 格式化后的价格字符串 "123.45 USD"
 */
export function formatPriceWithCode(
  value: number, 
  currencyCode: string = 'USD',
  decimals?: number
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    value = 0;
  }
  
  const actualDecimals = decimals ?? (CURRENCY_DECIMALS[currencyCode.toUpperCase()] ?? 2);
  const formattedValue = value.toFixed(actualDecimals);
  return `${formattedValue} ${currencyCode.toUpperCase()}`;
}

/**
 * 仅格式化数字，不添加货币
 * @param value 价格
 * @param decimals 小数位数
 * @returns 格式化后的数字字符串 "123.45"
 */
export function formatNumber(
  value: number,
  decimals: number = 2
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    value = 0;
  }
  return value.toFixed(decimals);
}

/**
 * 格式化变化金额 - 使用货币代码而非符号
 * @param change 变化金额
 * @param currency 货币代码
 * @returns 格式化后的变化金额，如 '+5.20 USD', '-12.50 CNY'
 */
export function formatChangeWithCode(change: number, currency: string = 'USD'): string {
  if (typeof change !== 'number' || isNaN(change)) {
    return formatChangeWithCode(0, currency);
  }

  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  const sign = change >= 0 ? '+' : '';
  
  return `${sign}${change.toFixed(decimals)} ${currency.toUpperCase()}`;
}

/**
 * 去掉数字字符串末尾的零
 * @param numStr 数字字符串
 * @returns 去掉末尾零后的字符串
 */
function removeTrailingZeros(numStr: string): string {
  // 处理科学计数法格式，如 "9.89500000e-6" -> "9.895e-6"
  if (numStr.includes('e') || numStr.includes('E')) {
    const parts = numStr.split(/[eE]/);
    const mantissa = parts[0];
    const exponent = parts[1];
    
    // 去掉尾数部分小数点后末尾的零
    // 例如: "9.89500000" -> "9.895"
    // 使用贪婪匹配确保匹配到所有末尾的零
    let cleanedMantissa = mantissa.replace(/\.(\d+)0+$/, (match, digits) => {
      // 去掉 digits 中末尾的零
      const cleanedDigits = digits.replace(/0+$/, '');
      // 如果去掉零后没有数字了，去掉整个小数点部分
      if (!cleanedDigits) {
        return '';
      }
      return '.' + cleanedDigits;
    });
    
    return `${cleanedMantissa}e${exponent}`;
  }
  
  // 处理普通格式，如 "123.45000" -> "123.45", "123.00" -> "123"
  let cleaned = numStr.replace(/\.(\d+)0+$/, (match, digits) => {
    // 去掉 digits 中末尾的零
    const cleanedDigits = digits.replace(/0+$/, '');
    // 如果去掉零后没有数字了，去掉整个小数点部分
    if (!cleanedDigits) {
      return '';
    }
    return '.' + cleanedDigits;
  });
  
  return cleaned;
}

/**
 * 根据 pricescale 计算小数位数
 * @param pricescale 价格精度，如 10000 表示 4 位小数
 * @returns 小数位数（最多 8 位）
 */
export function getDecimalsFromPricescale(pricescale: number): number {
  if (typeof pricescale !== 'number' || pricescale <= 0 || !isFinite(pricescale)) {
    return 2; // 默认 2 位小数
  }
  
  // pricescale = 10^n，所以小数位数 = log10(pricescale)
  // 例如：10000 = 10^4，所以是 4 位小数
  const decimals = Math.max(0, Math.floor(Math.log10(pricescale)));
  
  // 限制最多 8 位小数
  return Math.min(decimals, 8);
}

/**
 * 根据 pricescale 格式化价格
 * @param price 价格数值
 * @param pricescale 价格精度，如 10000 表示 4 位小数
 * @param withSymbol 是否包含货币符号，默认为 false
 * @param currency 货币代码，仅在 withSymbol 为 true 时使用
 * @returns 格式化后的价格字符串（只有数字本身需要科学计数法时才使用）
 */
export function formatPriceWithPricescale(
  price: number,
  pricescale: number,
  withSymbol: boolean = false,
  currency: string = 'USD'
): string {
  if (typeof price !== 'number' || isNaN(price)) {
    price = 0;
  }
  
  // 计算原始小数位数（不限制）
  let rawDecimals = 2;
  if (typeof pricescale === 'number' && pricescale > 0 && isFinite(pricescale)) {
    rawDecimals = Math.max(0, Math.floor(Math.log10(pricescale)));
  }
  
  // 关键改变：只有当数字本身已经是科学计数法格式时才使用科学计数法
  // 判断标准：使用 toFixed(8) 后，如果结果包含 'e' 或数字非常小（< 1e-8），则说明需要科学计数法
  const testFixed = price.toFixed(8);
  const needsScientific = testFixed.includes('e') || (price !== 0 && Math.abs(price) < 0.00000001);
  
  if (needsScientific) {
    // 只有真正需要科学计数法时才使用
    const scientificNotation = price.toExponential(4); // 使用 4 位精度，更简洁
    const cleanedNotation = removeTrailingZeros(scientificNotation);
    if (withSymbol) {
      const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
      return `${symbol}${cleanedNotation}`;
    }
    return cleanedNotation;
  }
  
  // 否则使用普通格式，最多 8 位小数
  const decimals = Math.min(rawDecimals, 8);
  const formattedPrice = price.toFixed(decimals);
  const cleanedPrice = removeTrailingZeros(formattedPrice);
  
  if (withSymbol) {
    const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency.toUpperCase();
    return `${symbol}${cleanedPrice}`;
  }
  
  return cleanedPrice;
}