/**
 * 股票符号解析工具
 * 用于解析 EXCHANGE:SYMBOL 格式的股票标识符
 */

/**
 * 解析 EXCHANGE:SYMBOL 格式的股票代码
 * 格式：EXCHANGE:SYMBOL
 * 示例：NASDAQ:AAPL
 * 
 * @param compositeSymbol 复合标识符（格式：EXCHANGE:SYMBOL）
 * @returns 解析后的对象，包含 exchange 和 symbol
 * @throws Error 如果格式不正确
 * 
 * @example
 * parseCompositeSymbol('NASDAQ:AAPL') 
 * // { exchange: 'NASDAQ', symbol: 'AAPL' }
 * 
 * @example
 * parseCompositeSymbol('AAPL')
 * // throws Error: Invalid symbol format. Expected EXCHANGE:SYMBOL
 */
export function parseCompositeSymbol(compositeSymbol: string): { 
  exchange: string; 
  symbol: string;
} {
  const parts = compositeSymbol.split(':');
  
  if (parts.length < 2) {
    throw new Error('Invalid symbol format. Expected EXCHANGE:SYMBOL');
  }
  
  return {
    exchange: parts[0],
    symbol: parts[1]
  };
}

