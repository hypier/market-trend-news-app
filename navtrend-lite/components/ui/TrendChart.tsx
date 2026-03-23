import React, { useRef, useEffect } from 'react';
import Svg, { Polyline, Line } from 'react-native-svg';
import { MarketNewsBrand } from '@/config/brand';
import { SafeSvgWrapper } from './SafeSvgWrapper';

// 趋势判断方式
// 趋势判断方式：
// 1. firstLast - 首尾比较（原方式）：比较第一个和最后一个数据点，简单但可能不准确
// 2. slope - 线性回归斜率：计算整体趋势线的斜率，更科学，考虑所有数据点
// 3. halfAverage - 前后半段平均值：比较前半段和后半段的平均值，平滑波动，减少噪音影响
// 4. weighted - 加权趋势（推荐）：给近期数据更高权重，既考虑整体趋势，又突出最新变化
// 默认使用weighted方式，因为它最符合金融数据分析的需求：
// ✅ 考虑所有数据点
// ✅ 突出近期趋势
// ✅ 减少噪音干扰
// ✅ 更准确反映当前走势
export type TrendMethod = 'firstLast' | 'slope' | 'weighted' | 'halfAverage';

interface TrendChartProps {
  data: number[];
  isPositive?: boolean; // 改为可选，如果不传则自动判断
  width?: number;
  height?: number;
  color?: string;
  showMidLine?: boolean; // 是否显示中线，默认true
  trendMethod?: TrendMethod; // 趋势判断方式，默认加权方式
}

// 趋势判断函数
const calculateTrend = (data: number[], method: TrendMethod = 'weighted'): boolean => {
  if (data.length < 2) return true;
  
  switch (method) {
    case 'firstLast':
      // 方式1：比较首尾
      return data[data.length - 1] >= data[0];
      
    case 'slope':
      // 方式2：线性回归斜率
      const n = data.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = data.reduce((sum, val) => sum + val, 0);
      const sumXY = data.reduce((sum, val, index) => sum + index * val, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope > 0;
      
    case 'halfAverage':
      // 方式3：前后半段平均值比较
      const midPoint = Math.floor(data.length / 2);
      const firstHalfAvg = data.slice(0, midPoint).reduce((sum, val) => sum + val, 0) / midPoint;
      const secondHalfAvg = data.slice(midPoint).reduce((sum, val) => sum + val, 0) / (data.length - midPoint);
      return secondHalfAvg >= firstHalfAvg;
      
    case 'weighted':
    default:
      // 方式4：加权趋势（推荐）- 给近期数据更高权重
      let weightedSum = 0;
      let totalWeight = 0;
      
      data.forEach((value, index) => {
        const weight = index + 1; // 越靠后权重越高
        weightedSum += value * weight;
        totalWeight += weight;
      });
      
      const weightedAvg = weightedSum / totalWeight;
      const simpleAvg = data.reduce((sum, val) => sum + val, 0) / data.length;
      
      return weightedAvg >= simpleAvg;
  }
};

export const TrendChart: React.FC<TrendChartProps> = React.memo(({ 
  data, 
  isPositive, 
  width = 60, 
  height = 30,
  color,
  showMidLine = true,
  trendMethod = 'weighted' // 默认使用加权方式
}) => {
  const isMountedRef = useRef(true);
  
  // 组件挂载状态管理
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // 调试日志已移除
  
  // 如果没有数据或数据不足，显示平线
  if (!data || data.length < 2) {
    const midY = height / 2;
    const points = `0,${midY} ${width},${midY}`;
    const strokeColor = color || MarketNewsBrand.colors.text.disabled;
    
    return (
      <SafeSvgWrapper style={{ width, height }}>
        <Svg width={width} height={height}>
          <Polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          />
        </Svg>
      </SafeSvgWrapper>
    );
  }

  // 使用指定方式判断涨跌趋势
  const autoIsPositive = calculateTrend(data, trendMethod);
  
  // 使用传入的isPositive参数，如果没有则使用自动判断的结果
  const finalIsPositive = isPositive !== undefined ? isPositive : autoIsPositive;

  // 找到数据的最大值和最小值，用于缩放
  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const valueRange = maxValue - minValue;
  
  // 如果所有数据点相同，显示平线
  if (valueRange === 0) {
    const midY = height / 2;
    const points = `0,${midY} ${width},${midY}`;
    const strokeColor = color || MarketNewsBrand.colors.text.disabled; // 平线用灰色
    
    return (
      <SafeSvgWrapper style={{ width, height }}>
        <Svg width={width} height={height}>
          <Polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
          />
        </Svg>
      </SafeSvgWrapper>
    );
  }

  // 计算中线位置（数据范围的中点）
  const midValue = (minValue + maxValue) / 2;
  const midLineY = height - ((midValue - minValue) / valueRange) * height;

  // 计算每个点的坐标，将数据缩放到图表高度
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    // 将数据值映射到图表高度，翻转Y轴（SVG的Y轴向下）
    const normalizedValue = (value - minValue) / valueRange;
    const y = height - (normalizedValue * height);
    return `${x},${y}`;
  }).join(' ');

  // 根据涨跌情况选择颜色
  const strokeColor = color || (finalIsPositive ? MarketNewsBrand.colors.market.bullish : MarketNewsBrand.colors.market.bearish);

  return (
    <SafeSvgWrapper style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* 中线 */}
        {showMidLine && (
          <Line
            x1="0"
            y1={midLineY}
            x2={width}
            y2={midLineY}
            stroke="#E0E0E0"
            strokeWidth="1"
            strokeDasharray="2,2"
          />
        )}
        
        {/* 趋势线 */}
        <Polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
        />
      </Svg>
    </SafeSvgWrapper>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数，避免不必要的重渲染
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    prevProps.isPositive === nextProps.isPositive &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.color === nextProps.color &&
    prevProps.showMidLine === nextProps.showMidLine &&
    prevProps.trendMethod === nextProps.trendMethod
  );
});

// 添加 displayName 便于调试
TrendChart.displayName = 'TrendChart'; 