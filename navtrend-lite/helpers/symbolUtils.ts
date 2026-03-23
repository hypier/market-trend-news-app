/**
 * Symbol 格式统一工具
 * 
 * 统一处理 TradingView 复合标识符格式（EXCHANGE:SYMBOL）
 * 
 * @example
 * // 解析复合格式
 * parseSymbol('NASDAQ:AAPL')
 * // { symbol: 'AAPL', exchange: 'NASDAQ', composite: 'NASDAQ:AAPL' }
 * 
 * // 构建复合格式
 * buildSymbol('AAPL', 'NASDAQ')
 * // 'NASDAQ:AAPL'
 */

/**
 * Symbol 格式信息
 */
export interface SymbolInfo {
  /** 纯股票代码 (如 'AAPL') */
  symbol: string;
  /** 交易所代码 (如 'NASDAQ') */
  exchange: string;
  /** 复合标识符 (如 'NASDAQ:AAPL') */
  composite: string;
}

/**
 * 解析复合 Symbol
 * 
 * @param composite - 复合格式 symbol (如 'NASDAQ:AAPL')
 * @returns SymbolInfo 对象
 * 
 * @throws {Error} 如果格式不正确
 * 
 * @example
 * parseSymbol('NASDAQ:AAPL')
 * // { symbol: 'AAPL', exchange: 'NASDAQ', composite: 'NASDAQ:AAPL' }
 */
export function parseSymbol(composite: string): SymbolInfo {
  if (!composite || typeof composite !== 'string') {
    throw new Error(`Invalid symbol format: ${composite}`);
  }

  const parts = composite.split(':');
  
  if (parts.length !== 2) {
    throw new Error(`Symbol must be in format 'EXCHANGE:SYMBOL', got: ${composite}`);
  }

  const [exchange, symbol] = parts;
  
  if (!exchange || !symbol) {
    throw new Error(`Invalid symbol components in: ${composite}`);
  }

  return {
    symbol: symbol.trim(),
    exchange: exchange.trim(),
    composite: composite.trim(),
  };
}

/**
 * 构建复合 Symbol
 * 
 * @param symbol - 纯股票代码
 * @param exchange - 交易所代码
 * @returns 复合标识符
 * 
 * @throws {Error} 如果参数无效
 * 
 * @example
 * buildSymbol('AAPL', 'NASDAQ')
 * // 'NASDAQ:AAPL'
 */
export function buildSymbol(symbol: string, exchange: string): string {
  if (!symbol || !exchange) {
    throw new Error(`Invalid symbol or exchange: ${symbol}, ${exchange}`);
  }
  
  return `${exchange.trim().toUpperCase()}:${symbol.trim().toUpperCase()}`;
}

/**
 * 检查是否为复合格式
 * 
 * @param str - 待检查的字符串
 * @returns 是否为复合格式
 * 
 * @example
 * isCompositeSymbol('NASDAQ:AAPL')  // true
 * isCompositeSymbol('AAPL')         // false
 */
export function isCompositeSymbol(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  
  const parts = str.split(':');
  return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
}

/**
 * 确保 Symbol 为复合格式
 * 
 * 如果已经是复合格式，直接返回；
 * 否则，使用提供的 exchange 构建复合格式。
 * 
 * @param symbolOrComposite - Symbol（可能是 'AAPL' 或 'NASDAQ:AAPL'）
 * @param defaultExchange - 默认交易所（当 symbol 不是复合格式时使用）
 * @returns 复合格式 symbol
 * 
 * @throws {Error} 如果不是复合格式且没有提供默认交易所
 * 
 * @example
 * ensureCompositeSymbol('NASDAQ:AAPL')        // 'NASDAQ:AAPL'
 * ensureCompositeSymbol('AAPL', 'NASDAQ')     // 'NASDAQ:AAPL'
 * ensureCompositeSymbol('700', 'HKEX')        // 'HKEX:700'
 */
export function ensureCompositeSymbol(
  symbolOrComposite: string,
  defaultExchange?: string
): string {
  if (isCompositeSymbol(symbolOrComposite)) {
    return symbolOrComposite;
  }
  
  if (!defaultExchange) {
    throw new Error(
      `Symbol '${symbolOrComposite}' is not in composite format and no default exchange provided`
    );
  }
  
  return buildSymbol(symbolOrComposite, defaultExchange);
}

/**
 * 提取 Symbol 名称（去除 exchange 前缀）
 * 
 * @param symbolOrComposite - Symbol（'AAPL' 或 'NASDAQ:AAPL'）
 * @returns 纯股票代码
 * 
 * @example
 * extractSymbolName('NASDAQ:AAPL')  // 'AAPL'
 * extractSymbolName('AAPL')         // 'AAPL'
 */
export function extractSymbolName(symbolOrComposite: string): string {
  if (isCompositeSymbol(symbolOrComposite)) {
    return parseSymbol(symbolOrComposite).symbol;
  }
  
  return symbolOrComposite.trim().toUpperCase();
}

/**
 * 提取交易所代码
 * 
 * @param composite - 复合格式 symbol
 * @returns 交易所代码
 * 
 * @throws {Error} 如果不是复合格式
 * 
 * @example
 * extractExchange('NASDAQ:AAPL')  // 'NASDAQ'
 */
export function extractExchange(composite: string): string {
  if (!isCompositeSymbol(composite)) {
    throw new Error(`Not a composite symbol: ${composite}`);
  }
  
  return parseSymbol(composite).exchange;
}

/**
 * 安全地解析 Symbol（不抛出异常）
 * 
 * @param composite - 复合格式 symbol
 * @returns SymbolInfo 或 null
 * 
 * @example
 * safeParseSymbol('NASDAQ:AAPL')
 * // { symbol: 'AAPL', exchange: 'NASDAQ', composite: 'NASDAQ:AAPL' }
 * 
 * safeParseSymbol('invalid')
 * // null
 */
export function safeParseSymbol(composite: string): SymbolInfo | null {
  try {
    return parseSymbol(composite);
  } catch {
    return null;
  }
}

