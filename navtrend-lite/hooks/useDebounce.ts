import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * 用于防抖处理，避免频繁触发操作（如API调用、搜索等）
 * 
 * @param value - 需要防抖的值
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的值
 * 
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * // 当debouncedQuery变化时执行搜索
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     searchAPI(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value || ('' as T));

  useEffect(() => {
    // 设置延迟定时器
    const handler = setTimeout(() => {
      setDebouncedValue(value || ('' as T));
    }, delay);

    // 清理函数：如果value在delay时间内再次变化，清除之前的定时器
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * debounce 工具函数
 * 
 * 创建一个防抖函数，在指定的等待时间后执行目标函数
 * 如果在等待期间再次调用，会重置计时器
 * 
 * @param func - 需要防抖的函数
 * @param wait - 等待时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const debouncedFetch = debounce((query: string) => {
 *   fetchAPI(query);
 * }, 300);
 * 
 * // 快速调用多次，只会在最后一次调用300ms后执行
 * debouncedFetch('a');
 * debouncedFetch('ab');
 * debouncedFetch('abc'); // 只有这次会在300ms后执行
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function debounced(...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
