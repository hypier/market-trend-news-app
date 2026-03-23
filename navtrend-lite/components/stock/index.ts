/**
 * 股票组件统一导出模块
 * 
 * 提供所有股票相关组件的统一导出入口，方便页面导入使用。
 * 
 * @author MarketNews Team
 * @version 1.0.0
 */

// 原有组件
export { StockHeader } from './StockHeader';
export { TradingViewWidget } from './TradingViewWidget';
export { StockKeyData } from './StockKeyData';
export { AddPositionModal } from './AddPositionModal';
export { StockFinancials } from './StockFinancials';
export { StatsCard } from './StatsCard';

// 新增的重构组件
export { FloatingActionButtons } from './FloatingActionButtons';
export { PositionButton } from './PositionButton';
export { StockPriceCard } from './StockPriceCard';
export { StockDetailHeader } from './StockDetailHeader';
export { StockStatsGrid } from './StockStatsGrid';
export { ErrorStateView } from './ErrorStateView';
export { AboutTabContent } from './AboutTabContent';
export { BidAskSpread } from './BidAskSpread';
export { NewsListItem } from './NewsListItem';

// 拆分后的功能组件
export { StockAboutTab } from './StockAboutTab';
export { StockTechnicalTab } from './StockTechnicalTab';
export { StockNewsTab } from './StockNewsTab';
export { StockChartSection } from './StockChartSection';

// 新的图表组件（蜡烛图拆分）
export { SimpleAreaChart } from './SimpleAreaChart';
export { AdvancedCandlestickChart } from './AdvancedCandlestickChart';
export { ChartContainer } from './ChartContainer';
export { TimePeriodSelector, TIME_PERIODS } from './TimePeriodSelector'; 