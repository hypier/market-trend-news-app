/**
 * 股票价格卡片组件
 * 
 * 显示股票的当前价格、涨跌金额和涨跌百分比。
 * 采用 MarketNews 设计系统，具备渐变背景、光泽效果和动画。
 * 
 * @author MarketNews Team
 * @version 2.0.0
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { formatPriceWithPricescale } from '@/utils/currencyFormatter';

// 单个数字翻转组件
interface FlipDigitProps {
  digit: string;
  fontSize: number;
  color: string;
}

const FlipDigit: React.FC<FlipDigitProps> = ({ digit, fontSize, color }) => {
  const prevDigit = useRef(digit);
  const [oldDigit, setOldDigit] = React.useState(digit);
  const [newDigit, setNewDigit] = React.useState(digit);
  const scrollAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (digit !== prevDigit.current) {
      // 数字发生变化，触发滚动动画
      setOldDigit(prevDigit.current); // 保存旧数字
      setNewDigit(digit); // 设置新数字
      prevDigit.current = digit;
      
      // 重置并启动滚动动画
      scrollAnim.setValue(0);
      Animated.spring(scrollAnim, {
        toValue: 1,
        friction: 8, // 阻尼系数，控制弹性
        tension: 100, // 张力，控制速度
        useNativeDriver: true,
      }).start();
    } else {
      // 初始化时
      setOldDigit(digit);
      setNewDigit(digit);
    }
  }, [digit, scrollAnim]);

  // 旧数字向上滚出：0 -> -fontSize（向上移动一个字符高度）
  const oldTranslateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -fontSize * 1.2],
  });

  // 新数字从下滚入：fontSize -> 0（从下方一个字符高度位置滚到正常位置）
  const newTranslateY = scrollAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [fontSize * 1.2, 0],
  });

  // 计算字符宽度：数字用固定宽度，小数点用较窄宽度
  const isDecimalPoint = digit === '.';
  const charWidth = isDecimalPoint ? fontSize * 0.3 : fontSize * 0.65;

  return (
    <View style={{ 
      position: 'relative', 
      overflow: 'hidden',
      width: charWidth,
      height: fontSize * 1.2, // 固定高度，只显示一个字符
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* 旧数字向上滚出 */}
      <Animated.View
        style={{
          position: 'absolute',
          transform: [
            { translateY: oldTranslateY },
          ],
        }}
      >
        <Text style={{ 
          fontSize, 
          color, 
          fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}>
          {oldDigit}
        </Text>
      </Animated.View>

      {/* 新数字从下滚入 */}
      <Animated.View
        style={{
          position: 'absolute',
          transform: [
            { translateY: newTranslateY },
          ],
        }}
      >
        <Text style={{ 
          fontSize, 
          color, 
          fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
          fontVariant: ['tabular-nums'],
          textAlign: 'center',
        }}>
          {newDigit}
        </Text>
      </Animated.View>
    </View>
  );
};

interface StockPriceCardProps {
  /** 当前价格 */
  currentPrice: number;
  /** 涨跌金额 */
  priceChange: number;
  /** 涨跌百分比 */
  changePercent: number;
  /** 货币符号 */
  currency: string;
  /** 是否为正向涨跌 */
  isPositive: boolean;
  /** 是否正在加载 */
  isLoading?: boolean;
  /** 自定义样式 */
  style?: any;
  /** 转换后的价格（可选） */
  convertedPrice?: number | null;
  /** 目标货币（可选） */
  targetCurrency?: string;
  /** 价格精度（pricescale），如 10000 表示 4 位小数 */
  pricescale?: number;
}

export function StockPriceCard({
  currentPrice,
  priceChange,
  changePercent,
  currency,
  isPositive,
  isLoading = false,
  style,
  convertedPrice,
  targetCurrency,
  pricescale
}: StockPriceCardProps) {
  // 格式化价格（统一使用 formatPriceWithPricescale）
  const formattedPrice = useMemo(() => {
    const pricescaleToUse = pricescale || 100; // 100 = 2位小数（默认）
    return formatPriceWithPricescale(currentPrice, pricescaleToUse, false);
  }, [currentPrice, pricescale]);
  
  // 将价格拆分成单个字符数组
  const priceDigits = useMemo(() => {
    return formattedPrice.split('');
  }, [formattedPrice]);

  // 格式化变化显示（统一使用 formatPriceWithPricescale）
  const formattedChange = useMemo(() => {
    const pricescaleToUse = pricescale || 100; // 100 = 2位小数（默认）
    const formattedChangeAbs = formatPriceWithPricescale(Math.abs(priceChange), pricescaleToUse, false);
    const prefix = isPositive ? '+' : '';
    return `${prefix}${formattedChangeAbs} ${currency} (${prefix}${changePercent.toFixed(2)}%)`;
  }, [priceChange, pricescale, isPositive, currency, changePercent]);

  // 根据涨跌状态选择颜色
  const changeColor = isPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish;
  const changeBgColor = isPositive ? MarketNewsBrand.colors.market.successLight : MarketNewsBrand.colors.market.dangerLight;

  // 骨架屏组件
  const SkeletonLoader = () => (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[MarketNewsBrand.colors.background.primary, MarketNewsBrand.colors.background.secondary] as const}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* 装饰性顶部条带 */}
        <LinearGradient
          colors={MarketNewsBrand.colors.gradients.primary as [string, string, ...string[]]}
          style={styles.topBand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        
        {/* 价格骨架屏 */}
        <View style={styles.priceSection}>
          <View style={[styles.skeletonPrice, styles.skeletonAnimation]} />
          <View style={[styles.skeletonCurrency, styles.skeletonAnimation]} />
        </View>

        {/* 涨跌信息骨架屏 */}
        <View style={styles.changeContainer}>
          <View style={styles.changeSection}>
            <View style={[styles.skeletonIcon, styles.skeletonAnimation]} />
            <View style={[styles.skeletonChange, styles.skeletonAnimation]} />
          </View>
        </View>

        {/* 装饰性光泽效果 */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
          style={styles.gloss}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </LinearGradient>
    </View>
  );

  // 如果正在加载，显示骨架屏
  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <View style={[styles.container, style]}>
      {/* 主卡片背景 */}
      <LinearGradient
        colors={[MarketNewsBrand.colors.background.primary, MarketNewsBrand.colors.background.secondary] as const}
        style={styles.cardBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* 装饰性顶部条带 */}
        <LinearGradient
          colors={MarketNewsBrand.colors.gradients.primary as [string, string, ...string[]]}
          style={styles.topBand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
        
        {/* 价格显示区域 */}
        <View style={styles.priceSection}>
          <View style={styles.priceContainer}>
            {/* 逐个字符显示价格，每个字符独立翻转 */}
            {priceDigits.map((digit, index) => (
              <FlipDigit
                key={`digit-${index}`}
                digit={digit}
                fontSize={MarketNewsBrand.typography.fontSize['4xl']}
                color={MarketNewsBrand.colors.text.primary}
              />
            ))}
            <Text style={styles.currencyLabel}>
              {currency}
            </Text>
          </View>
          
          {/* 转换后价格（弱化显示） */}
          {convertedPrice && targetCurrency && targetCurrency !== currency && (
            <Text style={styles.convertedPrice}>
              ≈ {formatPriceWithPricescale(convertedPrice, pricescale || 100, false)} {targetCurrency}
            </Text>
          )}
        </View>

        {/* 涨跌信息区域 */}
        <View style={[styles.changeContainer, { backgroundColor: changeBgColor }]}>
          <View style={styles.changeSection}>
            <View style={[styles.iconContainer, { backgroundColor: changeColor }]}>
              <Ionicons
                name={isPositive ? "trending-up" : "trending-down"}
                size={16}
                color={MarketNewsBrand.colors.text.inverse}
              />
            </View>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {formattedChange}
            </Text>
          </View>
        </View>

        {/* 装饰性光泽效果 */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.6)', 'rgba(255, 255, 255, 0)']}
          style={styles.gloss}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -24,
    marginHorizontal: MarketNewsBrand.spacing.md,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: MarketNewsBrand.colors.background.primary, // 修复阴影效率警告
    shadowColor: MarketNewsBrand.shadow.lg.shadowColor,
    shadowOffset: MarketNewsBrand.shadow.lg.shadowOffset,
    shadowOpacity: MarketNewsBrand.shadow.lg.shadowOpacity,
    shadowRadius: MarketNewsBrand.shadow.lg.shadowRadius,
    elevation: MarketNewsBrand.shadow.lg.elevation,
  },
  cardBackground: {
    borderRadius: MarketNewsBrand.borderRadius.xl,
    overflow: 'hidden',
    paddingHorizontal: MarketNewsBrand.spacing.md,
    paddingVertical: MarketNewsBrand.spacing.md,
    position: 'relative',
  },
  topBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  priceSection: {
    alignItems: 'center',
    marginTop: MarketNewsBrand.spacing.xs,
    marginBottom: MarketNewsBrand.spacing.xs,
    position: 'relative',
    overflow: 'visible', // 允许 3D 效果显示
    minHeight: 50, // 确保有足够空间显示翻转动画
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // 底部对齐，确保 USD 标签与价格数字底部对齐
    justifyContent: 'center',
  },
  currentPrice: {
    fontSize: MarketNewsBrand.typography.fontSize['4xl'],
    fontWeight: '800' as '800',
    color: MarketNewsBrand.colors.text.primary,
    textAlign: 'center',
    letterSpacing: MarketNewsBrand.typography.letterSpacing.tight,
  },
  currencyLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: '600' as '600',
    color: MarketNewsBrand.colors.text.secondary,
    marginLeft: MarketNewsBrand.spacing.xs,
    marginBottom: 5, // 底部偏移，与大数字底部对齐
    opacity: 0.8,
  },
  convertedPrice: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: '500' as '500',
    color: MarketNewsBrand.colors.text.tertiary,
    marginTop: 4,
    opacity: 0.6,
    textAlign: 'center',
  },
  currencyBadge: {
    backgroundColor: MarketNewsBrand.colors.primary[100],
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    paddingVertical: MarketNewsBrand.spacing.xs,
    borderRadius: MarketNewsBrand.borderRadius.full,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.primary[200],
  },
  currencyText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: '600' as '600',
    color: MarketNewsBrand.colors.primary[700],
    letterSpacing: MarketNewsBrand.typography.letterSpacing.wide,
  },
  changeContainer: {
    borderRadius: MarketNewsBrand.borderRadius.lg,
    paddingVertical: MarketNewsBrand.spacing.xs,
    paddingHorizontal: MarketNewsBrand.spacing.sm,
    marginTop: MarketNewsBrand.spacing.xs,
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: MarketNewsBrand.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: MarketNewsBrand.spacing.xs,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  changeText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: '700' as '700',
    letterSpacing: MarketNewsBrand.typography.letterSpacing.tight,
  },
  gloss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    borderTopLeftRadius: MarketNewsBrand.borderRadius.xl,
    borderTopRightRadius: MarketNewsBrand.borderRadius.xl,
    pointerEvents: 'none',
  },
  // 骨架屏样式
  skeletonPrice: {
    height: 32,
    width: '60%',
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.md,
    marginBottom: MarketNewsBrand.spacing.xs,
  },
  skeletonCurrency: {
    height: 20,
    width: 56,
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.full,
  },
  skeletonIcon: {
    height: 28,
    width: 28,
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.full,
    marginRight: MarketNewsBrand.spacing.xs,
  },
  skeletonChange: {
    height: 18,
    width: 110,
    backgroundColor: MarketNewsBrand.colors.primary[100],
    borderRadius: MarketNewsBrand.borderRadius.sm,
  },
  skeletonAnimation: {
    opacity: 0.6,
  },
});
