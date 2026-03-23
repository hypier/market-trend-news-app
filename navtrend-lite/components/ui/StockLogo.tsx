/**
 * 股票 Logo 组件
 * 专门用于显示 TradingView 的股票 Logo
 * 
 * 使用 logoid 字段从 TradingView CDN 获取 Logo
 * URL: https://logo.marketrendnews.top/{logoid}--big.svg
 * 
 * 先下载 SVG 内容，再使用 SvgXml 渲染（解决 iOS 兼容性问题）
 * 
 * 新功能：
 * - 支持双 logo 模式（用于显示兑换关系，如外汇、加密货币交易对）
 * - baseCurrencyLogoid 作为主 logo 占据整个容器
 * - currencyLogoid 作为副 logo 叠加在右下角（45% 大小）
 * - 副 logo 带有阴影效果，增加层次感
 * 
 * 架构：
 * - UI 层：组件使用本地状态管理，只负责渲染
 * - Service 层：处理数据获取、缓存和预处理（LogoService）
 * - Store 层：可选，用于全局 Logo 管理（如批量预加载）
 * 
 * @author NavTrend Team
 * @version 3.0.0
 */

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { SafeSvgWrapper } from './SafeSvgWrapper';
import { LogoService } from '@/services/market/logoService';

interface StockLogoProps {
  /** TradingView logoid（优先级最高） */
  logoid?: string;
  /** 基础货币 logoid（如 crypto/XTVCBTC，用于加密货币） */
  baseCurrencyLogoid?: string;
  /** 货币 logoid（如 country/US，备用） */
  currencyLogoid?: string;
  /** 股票代码（用于生成字母图标） */
  symbol?: string;
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large' | number;
  /** 自定义样式 */
  style?: ViewStyle;
}

// 尺寸配置
const SIZE_CONFIG = {
  small: 32,
  medium: 40,
  large: 56,
};

/**
 * StockLogo 组件
 * 
 * 从 TradingView CDN 获取并显示股票 Logo，支持多种 Logo 来源。
 * 
 * Logo 优先级（自动选择）：
 * 1. logoid - 标准股票 Logo（如 "apple", "inhibrx-biosciences"）
 * 2. 双 logo 模式 - 当同时存在 baseCurrencyLogoid 和 currencyLogoid 时
 *    - baseCurrencyLogoid 作为主 logo（100% 容器大小）
 *    - currencyLogoid 作为副 logo 叠加在右下角（45% 容器大小）
 * 3. baseCurrencyLogoid - 加密货币基础货币 Logo（如 "crypto/XTVCBTC"）
 * 4. currencyLogoid - 货币/国家 Logo（如 "country/US"）
 * 5. 字母图标 - 当所有 Logo 都不可用时的后备方案
 * 
 * 使用示例：
 * ```tsx
 * // 标准股票
 * <StockLogo logoid="apple" symbol="AAPL" size="medium" />
 * 
 * // 双 logo 模式（外汇/加密货币交易对）- 重叠样式
 * <StockLogo 
 *   baseCurrencyLogoid="country/EU"
 *   currencyLogoid="country/US"
 *   symbol="EURUSD" 
 *   size="large" 
 * />
 * // 效果：EUR logo 占据整个圆形，USD logo 小圆叠加在右下角
 * 
 * // 单 logo 模式（只有一个 logoid）
 * <StockLogo 
 *   baseCurrencyLogoid="crypto/XTVCBTC"
 *   symbol="BTC" 
 *   size="medium" 
 * />
 * ```
 */
export const StockLogo: React.FC<StockLogoProps> = ({
  logoid,
  baseCurrencyLogoid,
  currencyLogoid,
  symbol,
  size = 'medium',
  style,
}) => {
  const isMountedRef = useRef(true);
  
  // 本地状态管理（每个组件实例独立）
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // 双 logo 模式的状态
  const [baseSvgContent, setBaseSvgContent] = useState<string | null>(null);
  const [currencySvgContent, setCurrencySvgContent] = useState<string | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [baseError, setBaseError] = useState(false);
  const [currencyError, setCurrencyError] = useState(false);

  // 判断是否为双 logo 模式（兑换关系）
  const isDualLogoMode = useMemo(() => {
    return !logoid && baseCurrencyLogoid && currencyLogoid;
  }, [logoid, baseCurrencyLogoid, currencyLogoid]);

  // 确定实际使用的 logoid（优先级：logoid > baseCurrencyLogoid > currencyLogoid）
  const effectiveLogoid = useMemo(() => {
    if (logoid) return logoid;
    if (baseCurrencyLogoid && !currencyLogoid) return baseCurrencyLogoid;
    if (currencyLogoid && !baseCurrencyLogoid) return currencyLogoid;
    return undefined;
  }, [logoid, baseCurrencyLogoid, currencyLogoid]);

  // 计算实际尺寸
  const actualSize = useMemo(() => {
    if (typeof size === 'number') return size;
    return SIZE_CONFIG[size];
  }, [size]);

  // 容器样式
  const containerStyle = useMemo(() => [
    styles.container,
    {
      width: actualSize,
      height: actualSize,
      borderRadius: actualSize / 2,
    },
    style,
  ], [actualSize, style]);

  // 加载单个 Logo
  const loadSingleLogo = useCallback(async (logoId: string) => {
    if (!isMountedRef.current) return;
    
    setIsLoading(true);
    setHasError(false);
    setSvgContent(null);
    
    try {
      const content = await LogoService.getSvgContent(logoId);
      
      if (!isMountedRef.current) return;
      
      setSvgContent(content);
      setHasError(content === null);
    } catch {
      if (!isMountedRef.current) return;
      setSvgContent(null);
      setHasError(true);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // 当 effectiveLogoid 变化时加载 SVG（单 logo 模式）
  useEffect(() => {
    // 双 logo 模式不使用此 effect
    if (isDualLogoMode) return;
    
    isMountedRef.current = true;
    
    if (!effectiveLogoid) {
      setSvgContent(null);
      setHasError(false);
      setIsLoading(false);
      return;
    }

    // 立即清空旧内容，避免显示上一个页面的 Logo
    setSvgContent(null);
    setHasError(false);

    // 直接加载 Logo（Service 内部会自动处理缓存：内存 → 持久化存储 → 网络）
    loadSingleLogo(effectiveLogoid);
    
    // 组件卸载时清理标记
    return () => {
      isMountedRef.current = false;
    };
  }, [effectiveLogoid, loadSingleLogo, isDualLogoMode]);

  // 双 logo 模式：加载两个 SVG
  useEffect(() => {
    if (!isDualLogoMode || !baseCurrencyLogoid || !currencyLogoid) {
      setBaseSvgContent(null);
      setCurrencySvgContent(null);
      setBaseError(false);
      setCurrencyError(false);
      setBaseLoading(false);
      setCurrencyLoading(false);
      return;
    }
    
    isMountedRef.current = true;
    
    // 清空旧内容
    setBaseSvgContent(null);
    setCurrencySvgContent(null);
    setBaseError(false);
    setCurrencyError(false);
    
    // 加载基础货币 logo（Service 内部会自动处理缓存）
    const loadBaseCurrency = async () => {
      setBaseLoading(true);
      
      try {
        const content = await LogoService.getSvgContent(baseCurrencyLogoid);
        if (isMountedRef.current) {
          setBaseSvgContent(content);
          setBaseError(content === null);
          setBaseLoading(false);
        }
      } catch {
        if (isMountedRef.current) {
          setBaseSvgContent(null);
          setBaseError(true);
          setBaseLoading(false);
        }
      }
    };
    
    // 加载计价货币 logo（Service 内部会自动处理缓存）
    const loadCurrency = async () => {
      setCurrencyLoading(true);
      
      try {
        const content = await LogoService.getSvgContent(currencyLogoid);
        if (isMountedRef.current) {
          setCurrencySvgContent(content);
          setCurrencyError(content === null);
          setCurrencyLoading(false);
        }
      } catch {
        if (isMountedRef.current) {
          setCurrencySvgContent(null);
          setCurrencyError(true);
          setCurrencyLoading(false);
        }
      }
    };
    
    // 并行加载两个 logo
    Promise.all([loadBaseCurrency(), loadCurrency()]);
    
    return () => {
      isMountedRef.current = false;
    };
  }, [isDualLogoMode, baseCurrencyLogoid, currencyLogoid]);

  // 渲染字母图标（后备方案）
  const renderLetterIcon = useCallback(() => {
    const initials = LogoService.getInitials(symbol || '?');
    const backgroundColor = LogoService.generateColor(symbol || '');
    const fontSize = actualSize >= 56 ? 20 : actualSize >= 40 ? 16 : 12;
    
    return (
      <View style={[containerStyle, { backgroundColor }]}>
        <Text style={[styles.letterText, { fontSize }]}>
          {initials}
        </Text>
      </View>
    );
  }, [symbol, actualSize, containerStyle]);

  // 渲染双 logo（兑换关系）- 重叠样式
  const renderDualLogo = useCallback(() => {
    // 如果两个 logo 都加载失败，显示字母图标
    if ((baseError || !baseSvgContent) && (currencyError || !currencySvgContent)) {
      return renderLetterIcon();
    }
    
    // 主 logo（基础货币）尺寸 = 容器大小
    const mainLogoSize = actualSize;
    // 副 logo（计价货币）尺寸 = 容器的 55%（更大更醒目）
    const subLogoSize = actualSize * 0.55;
    // 白色边框宽度（根据尺寸调整）
    const borderWidth = actualSize >= 56 ? 3 : actualSize >= 40 ? 2.5 : 2;
    
    return (
      <View style={[containerStyle, { backgroundColor: 'transparent' }]}>
        {/* 基础货币 logo（主 logo，占据整个容器）*/}
        {baseSvgContent && !baseError ? (
          <SafeSvgWrapper 
            style={{ 
              width: mainLogoSize, 
              height: mainLogoSize,
              borderRadius: mainLogoSize / 2,
              overflow: 'hidden',
            }}
            onError={(error) => {
              Logger.error(LogModule.STOCK, `❌ Base currency SVG render error:`, error);
            }}
          >
            <SvgXml
              xml={LogoService.preprocessSvg(baseSvgContent)}
              width={mainLogoSize}
              height={mainLogoSize}
            />
          </SafeSvgWrapper>
        ) : baseLoading ? (
          <View style={[
            {
              width: mainLogoSize,
              height: mainLogoSize,
              borderRadius: mainLogoSize / 2,
              backgroundColor: LogoService.generateColor(symbol || ''),
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}>
            <Text style={[styles.letterText, { fontSize: mainLogoSize >= 40 ? 16 : 12 }]}>
              {LogoService.getInitials(symbol || '?')}
            </Text>
          </View>
        ) : null}

        {/* 计价货币 logo（副 logo，叠加在右下角，带白色外圈）*/}
        {currencySvgContent && !currencyError ? (
          <View style={[
            styles.overlayLogoContainer,
            {
              width: subLogoSize,
              height: subLogoSize,
              borderRadius: subLogoSize / 2,
              borderWidth,
              borderColor: '#FFFFFF',
              backgroundColor: MarketNewsBrand.colors.background.primary,
              position: 'absolute',
              right: -subLogoSize * 0.15, // 向右偏移 15%
              bottom: -subLogoSize * 0.15, // 向下偏移 15%
            }
          ]}>
            <SafeSvgWrapper 
              style={{ 
                width: subLogoSize - borderWidth * 2, 
                height: subLogoSize - borderWidth * 2,
                borderRadius: (subLogoSize - borderWidth * 2) / 2,
                overflow: 'hidden',
              }}
              onError={(error) => {
                Logger.error(LogModule.STOCK, `❌ Currency SVG render error:`, error);
              }}
            >
              <SvgXml
                xml={LogoService.preprocessSvg(currencySvgContent)}
                width={subLogoSize - borderWidth * 2}
                height={subLogoSize - borderWidth * 2}
              />
            </SafeSvgWrapper>
          </View>
        ) : currencyLoading ? (
          <View style={[
            styles.overlayLogoContainer,
            {
              width: subLogoSize,
              height: subLogoSize,
              borderRadius: subLogoSize / 2,
              borderWidth,
              borderColor: '#FFFFFF',
              backgroundColor: '#FFFFFF',
              position: 'absolute',
              right: -subLogoSize * 0.3,
              bottom: -subLogoSize * 0.3,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}>
            <View style={{
              width: subLogoSize - borderWidth * 2,
              height: subLogoSize - borderWidth * 2,
              borderRadius: (subLogoSize - borderWidth * 2) / 2,
              backgroundColor: LogoService.generateColor(symbol || ''),
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Text style={[styles.letterText, { fontSize: subLogoSize >= 30 ? 12 : 10 }]}>
                {LogoService.getInitials(symbol || '?')}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  }, [
    baseSvgContent, 
    currencySvgContent, 
    baseError, 
    currencyError,
    baseLoading,
    currencyLoading,
    actualSize, 
    containerStyle, 
    renderLetterIcon,
    symbol
  ]);

  // 如果 logoid 和 baseCurrencyLogoid 都为空，显示字母图标
  if (!logoid && !baseCurrencyLogoid) {
    return renderLetterIcon();
  }

  // 双 logo 模式：显示兑换关系
  if (isDualLogoMode) {
    return renderDualLogo();
  }

  // 如果没有任何有效的 logoid，显示字母图标
  if (!effectiveLogoid) {
    return renderLetterIcon();
  }

  // 如果正在加载，显示加载状态（使用彩色字母图标）
  if (isLoading) {
    return renderLetterIcon();
  }

  // 如果加载失败或有错误，显示字母图标
  if (hasError || !svgContent) {
    return renderLetterIcon();
  }
  
  // 预处理 SVG 内容，确保正确缩放和居中
  const processedSvg = LogoService.preprocessSvg(svgContent);
  
  return (
    <SafeSvgWrapper 
      style={[containerStyle, { overflow: 'hidden' }]} // 单个 logo 强制圆形裁剪
      onError={(error) => {
        Logger.error(LogModule.STOCK, `❌ SVG render error for ${effectiveLogoid}:`, error);
      }}
    >
      <SvgXml
        xml={processedSvg}
        width={actualSize}
        height={actualSize}
        onError={(error) => {
          Logger.error(LogModule.STOCK, `❌ SVG render error for ${effectiveLogoid}:`, error);
        }}
      />
    </SafeSvgWrapper>
  );
};

/**
 * 清除 Logo 缓存（导出 Service 方法）
 */
export const clearLogoCache = LogoService.clearCache;

/**
 * 预加载 Logo（导出 Service 方法）
 */
export const preloadLogos = LogoService.preload;

const styles = StyleSheet.create({
  container: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible', // 允许副 logo 溢出显示
  },
  loading: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    opacity: 0.7,
  },
  letterText: {
    color: '#FFFFFF',
    fontWeight: MarketNewsBrand.typography.fontWeight.bold,
    textAlign: 'center',
  },
  overlayLogoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    // 添加阴影效果，增加层次感
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android 阴影
  },
});
