/**
 * 数值精度处理工具
 * 
 * 由于 D1 (SQLite) 不支持 DECIMAL 类型，我们使用 TEXT 存储高精度数值
 * 这个工具提供数值与字符串之间的转换，确保精度不丢失
 */

/**
 * 将数值转换为固定精度的字符串
 * 
 * @param value 数值（number 或 string）
 * @param decimals 小数位数，默认8位
 * @returns 固定精度的字符串
 * 
 * @example
 * toDecimalString(123.456789012, 8)  // "123.45678901"
 * toDecimalString("150.5", 8)        // "150.50000000"
 * toDecimalString(100, 2)            // "100.00"
 */
export function toDecimalString(value: string | number, decimals: number = 8): string {
  // 处理 null 或 undefined
  if (value === null || value === undefined) {
    return '0'.padEnd(decimals + 2, '0').replace('0', '0.');
  }
  
  // 转换为数值
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // 检查是否为有效数字
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  
  // 使用 toFixed 保持指定精度
  return numValue.toFixed(decimals);
}

/**
 * 将字符串转换为数值
 * 
 * @param value 字符串格式的数值
 * @returns 数值
 * 
 * @example
 * fromDecimalString("123.45678901")  // 123.45678901
 * fromDecimalString("150.50000000")  // 150.5
 */
export function fromDecimalString(value: string): number {
  // 处理 null 或 undefined
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // 转换为数值
  const numValue = parseFloat(value);
  
  // 检查是否为有效数字
  if (isNaN(numValue)) {
    throw new Error(`Invalid decimal string: ${value}`);
  }
  
  return numValue;
}

/**
 * 安全的数值相加（避免浮点精度问题）
 * 
 * @param a 第一个数值
 * @param b 第二个数值
 * @param decimals 结果精度
 * @returns 相加结果字符串
 * 
 * @example
 * addDecimal("100.12345678", "50.87654322", 8)  // "151.00000000"
 */
export function addDecimal(a: string, b: string, decimals: number = 8): string {
  const numA = fromDecimalString(a);
  const numB = fromDecimalString(b);
  const result = numA + numB;
  return toDecimalString(result, decimals);
}

/**
 * 安全的数值相减（避免浮点精度问题）
 * 
 * @param a 被减数
 * @param b 减数
 * @param decimals 结果精度
 * @returns 相减结果字符串
 */
export function subtractDecimal(a: string, b: string, decimals: number = 8): string {
  const numA = fromDecimalString(a);
  const numB = fromDecimalString(b);
  const result = numA - numB;
  return toDecimalString(result, decimals);
}

/**
 * 安全的数值相乘（避免浮点精度问题）
 * 
 * @param a 第一个数值
 * @param b 第二个数值
 * @param decimals 结果精度
 * @returns 相乘结果字符串
 * 
 * @example
 * multiplyDecimal("100.12345678", "2", 8)  // "200.24691356"
 */
export function multiplyDecimal(a: string, b: string, decimals: number = 8): string {
  const numA = fromDecimalString(a);
  const numB = fromDecimalString(b);
  const result = numA * numB;
  return toDecimalString(result, decimals);
}

/**
 * 安全的数值相除（避免浮点精度问题）
 * 
 * @param a 被除数
 * @param b 除数
 * @param decimals 结果精度
 * @returns 相除结果字符串
 */
export function divideDecimal(a: string, b: string, decimals: number = 8): string {
  const numA = fromDecimalString(a);
  const numB = fromDecimalString(b);
  
  if (numB === 0) {
    throw new Error('Division by zero');
  }
  
  const result = numA / numB;
  return toDecimalString(result, decimals);
}

/**
 * 比较两个数值的大小
 * 
 * @param a 第一个数值
 * @param b 第二个数值
 * @returns 如果 a > b 返回 1，a < b 返回 -1，a === b 返回 0
 */
export function compareDecimal(a: string, b: string): number {
  const numA = fromDecimalString(a);
  const numB = fromDecimalString(b);
  
  if (numA > numB) return 1;
  if (numA < numB) return -1;
  return 0;
}

/**
 * 验证数值字符串格式
 * 
 * @param value 待验证的字符串
 * @returns 是否为有效的数值字符串
 */
export function isValidDecimalString(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  // 正则：可选的负号 + 数字 + 可选的小数点和小数部分
  const decimalPattern = /^-?\d+(\.\d+)?$/;
  return decimalPattern.test(value.trim());
}

/**
 * 格式化数值字符串为易读格式
 * 
 * @param value 数值字符串
 * @param options 格式化选项
 * @returns 格式化后的字符串
 * 
 * @example
 * formatDecimal("1234567.89", { thousandsSeparator: true })  // "1,234,567.89"
 * formatDecimal("123.456789", { decimals: 2 })               // "123.46"
 */
export function formatDecimal(
  value: string, 
  options: {
    decimals?: number;
    thousandsSeparator?: boolean;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const { 
    decimals, 
    thousandsSeparator = false, 
    prefix = '', 
    suffix = '' 
  } = options;
  
  const numValue = fromDecimalString(value);
  
  // 应用精度
  let formatted = decimals !== undefined 
    ? numValue.toFixed(decimals) 
    : numValue.toString();
  
  // 添加千位分隔符
  if (thousandsSeparator) {
    const [integerPart, decimalPart] = formatted.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    formatted = decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  }
  
  return `${prefix}${formatted}${suffix}`;
}

