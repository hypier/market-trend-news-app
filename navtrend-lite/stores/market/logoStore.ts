/**
 * Logo Store
 * 管理股票 Logo 的状态和加载逻辑
 * 
 * 功能：
 * - Logo SVG 内容状态管理
 * - 加载状态管理
 * - 错误状态管理
 * - 双 logo 模式状态管理
 * - Logo 加载方法
 * 
 * @author NavTrend Team
 * @version 1.0.0
 */

import { create } from 'zustand';
import { LogoService } from '@/services/market/logoService';

interface LogoState {
  // 单 logo 模式状态
  svgContent: string | null;
  isLoading: boolean;
  hasError: boolean;
  
  // 双 logo 模式状态
  baseSvgContent: string | null;
  currencySvgContent: string | null;
  baseLoading: boolean;
  currencyLoading: boolean;
  baseError: boolean;
  currencyError: boolean;
  
  // Actions - 单 logo 模式
  loadLogo: (logoid: string) => Promise<void>;
  clearLogo: () => void;
  
  // Actions - 双 logo 模式
  loadDualLogos: (baseCurrencyLogoid: string, currencyLogoid: string) => Promise<void>;
  clearDualLogos: () => void;
  
  // 工具方法
  reset: () => void;
}

export const useLogoStore = create<LogoState>((set, get) => ({
  // 初始状态 - 单 logo
  svgContent: null,
  isLoading: false,
  hasError: false,
  
  // 初始状态 - 双 logo
  baseSvgContent: null,
  currencySvgContent: null,
  baseLoading: false,
  currencyLoading: false,
  baseError: false,
  currencyError: false,
  
  // 加载单个 Logo（Service 内部会自动处理缓存：内存 → 持久化存储 → 网络）
  loadLogo: async (logoid: string) => {
    if (!logoid) {
      set({ svgContent: null, hasError: false, isLoading: false });
      return;
    }
    
    // 开始加载
    set({ isLoading: true, hasError: false, svgContent: null });
    
    try {
      const content = await LogoService.getSvgContent(logoid);
      set({ 
        svgContent: content, 
        hasError: content === null,
        isLoading: false 
      });
    } catch {
      set({ 
        svgContent: null, 
        hasError: true, 
        isLoading: false 
      });
    }
  },
  
  // 清除单个 Logo
  clearLogo: () => {
    set({ 
      svgContent: null, 
      isLoading: false, 
      hasError: false 
    });
  },
  
  // 加载双 Logo
  loadDualLogos: async (baseCurrencyLogoid: string, currencyLogoid: string) => {
    if (!baseCurrencyLogoid || !currencyLogoid) {
      set({
        baseSvgContent: null,
        currencySvgContent: null,
        baseLoading: false,
        currencyLoading: false,
        baseError: false,
        currencyError: false,
      });
      return;
    }
    
    // 清空旧内容
    set({
      baseSvgContent: null,
      currencySvgContent: null,
      baseError: false,
      currencyError: false,
    });
    
    // 加载基础货币 logo（Service 内部会自动处理缓存）
    const loadBaseCurrency = async () => {
      set({ baseLoading: true });
      
      try {
        const content = await LogoService.getSvgContent(baseCurrencyLogoid);
        set({ 
          baseSvgContent: content, 
          baseError: content === null,
          baseLoading: false 
        });
      } catch {
        set({ 
          baseSvgContent: null, 
          baseError: true, 
          baseLoading: false 
        });
      }
    };
    
    // 加载计价货币 logo（Service 内部会自动处理缓存）
    const loadCurrency = async () => {
      set({ currencyLoading: true });
      
      try {
        const content = await LogoService.getSvgContent(currencyLogoid);
        set({ 
          currencySvgContent: content, 
          currencyError: content === null,
          currencyLoading: false 
        });
      } catch {
        set({ 
          currencySvgContent: null, 
          currencyError: true, 
          currencyLoading: false 
        });
      }
    };
    
    // 并行加载两个 logo
    await Promise.all([loadBaseCurrency(), loadCurrency()]);
  },
  
  // 清除双 Logo
  clearDualLogos: () => {
    set({
      baseSvgContent: null,
      currencySvgContent: null,
      baseLoading: false,
      currencyLoading: false,
      baseError: false,
      currencyError: false,
    });
  },
  
  // 重置所有状态
  reset: () => {
    set({
      svgContent: null,
      isLoading: false,
      hasError: false,
      baseSvgContent: null,
      currencySvgContent: null,
      baseLoading: false,
      currencyLoading: false,
      baseError: false,
      currencyError: false,
    });
  },
}));

