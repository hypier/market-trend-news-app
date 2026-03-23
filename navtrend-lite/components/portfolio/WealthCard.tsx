import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Card } from "../ui"
import { useTranslation } from "@/hooks/useTranslation"
import { useSettingsStore } from "@/stores"

import { formatPrice, formatChange, formatChangePercent } from "@/utils/currencyFormatter"
import { MarketNewsBrand } from '@/config/brand';
interface WealthCardProps {
	// 基础数据
	totalValue: number
	totalGain: number
	totalGainPercent: number
	isPositive: boolean
	isLoading?: boolean

	// 功能属性
	isAuthenticated?: boolean
	trendData?: number[]
	onLoginPress?: () => void

	// 新增：是否有持仓数据
	hasPositions?: boolean
}

export const WealthCard: React.FC<WealthCardProps> = ({
	totalValue,
	totalGain,
	totalGainPercent,
	isPositive,
	isLoading = false,
	isAuthenticated = true,
	trendData,
	onLoginPress,
	hasPositions = false,
}) => {
	const { t } = useTranslation()

	// 获取用户设置的货币
	const currency = useSettingsStore((state) => state.currency) || "USD"

	// 安全地处理数值，确保它们是有效的数字
	const safeValue = typeof totalValue === "number" && !isNaN(totalValue) ? totalValue : 0
	const safeGain = typeof totalGain === "number" && !isNaN(totalGain) ? totalGain : 0
	const safeGainPercent = typeof totalGainPercent === "number" && !isNaN(totalGainPercent) ? totalGainPercent : 0

	// 投资组合数值处理

	// 未登录状态
	if (!isAuthenticated) {
		return (
			<Card style={styles.card} backgroundColor={MarketNewsBrand.colors.primary[400]} padding={20} borderRadius={MarketNewsBrand.borderRadius.xl} shadow={true}>
				<View style={styles.loginPromptContainer}>
					<View style={styles.loginIcon}>
						<Ionicons name='person-outline' size={32} color='#fff' />
					</View>
					<View style={styles.loginTextContainer}>
						<Text style={styles.loginTitle}>{t("components.portfolio.valueCard.myHoldings")}</Text>
						<Text style={styles.loginSubtitle}>{t("components.portfolio.valueCard.loginPrompt")}</Text>
					</View>
					<TouchableOpacity style={styles.loginButton} onPress={onLoginPress}>
						<Text style={styles.loginButtonText}>{t("components.portfolio.valueCard.loginNow")}</Text>
						<Ionicons name='arrow-forward' size={16} color={MarketNewsBrand.colors.primary[400]} />
					</TouchableOpacity>
				</View>
			</Card>
		)
	}

	// 加载状态
	if (isLoading && hasPositions) {
		return (
			<Card style={styles.card} backgroundColor={MarketNewsBrand.colors.primary[400]} padding={20} borderRadius={MarketNewsBrand.borderRadius.xl} shadow={true}>
				<View style={styles.loadingContainer}>
					<Ionicons name='trending-up' size={32} color='#fff' />
					<Text style={styles.loadingText}>{t("components.portfolio.valueCard.loadingHoldings")}</Text>
				</View>
			</Card>
		)
	}

	// 有数据状态 - 改为检查是否有持仓，而不是只检查总价值
	if (hasPositions) {
		const backgroundColor = isPositive ? MarketNewsBrand.colors.primary[400] : "#FF6B6B"
		const isGainPositive = safeGain > 0
		const isGainZero = Math.abs(safeGain) < 0.005
		return (
			<Card style={styles.card} backgroundColor={backgroundColor} padding={20} borderRadius={MarketNewsBrand.borderRadius.xl} shadow={true}>
				<View style={styles.header}>
					<View style={styles.icon}>
						<Ionicons name='wallet-outline' size={20} color='#fff' />
					</View>
					<View style={styles.info}>
						<Text style={styles.name}>{t("components.portfolio.valueCard.myHoldings")}</Text>
						<Text style={styles.symbol}>{t("components.portfolio.valueCard.totalAssets")}</Text>
					</View>
				</View>

				<View style={styles.priceContainer}>
					<Text style={styles.price}>{formatPrice(safeValue, currency)}</Text>
				</View>

				{/* 收益信息 */}
				<View style={styles.statsContainer}>
					{/* 收益卡片 */}
					<View style={styles.gainCard}>
						{/* 左侧：收益金额 */}
						<View style={styles.gainSection}>
							<View style={styles.gainHeader}>
								<View
									style={[
										styles.iconDot,
										{
											backgroundColor: isGainZero ? MarketNewsBrand.colors.background.tertiary : isGainPositive ? "#D1FAE5" : "#FEE2E2",
										},
									]}>
									<Ionicons
										name={isGainZero ? "remove" : isGainPositive ? "trending-up" : "trending-down"}
										size={12}
										color={isGainZero ? MarketNewsBrand.colors.text.tertiary : isGainPositive ? "#059669" : MarketNewsBrand.colors.semantic.error}
									/>
								</View>
								<Text style={styles.gainLabel}>{t("components.portfolio.gainLoss.totalGain")}</Text>
							</View>
							<Text
								style={[
									styles.gainAmount,
									{
										color: isGainZero ? MarketNewsBrand.colors.text.secondary : isGainPositive ? "#059669" : MarketNewsBrand.colors.semantic.error,
									},
								]}>
								{isGainZero ? formatPrice(0, currency) : formatChange(safeGain, currency)}
							</Text>
						</View>

						{/* 分隔线 */}
						<View style={styles.separator} />

						{/* 右侧：收益率 */}
						<View style={styles.percentSection}>
							<View style={styles.percentHeader}>
								<View
									style={[
										styles.iconDot,
										{
											backgroundColor: isGainZero ? MarketNewsBrand.colors.background.tertiary : isGainPositive ? "#D1FAE5" : "#FEE2E2",
										},
									]}>
									<Ionicons name='analytics' size={12} color={isGainZero ? MarketNewsBrand.colors.text.tertiary : isGainPositive ? "#059669" : MarketNewsBrand.colors.semantic.error} />
								</View>
								<Text style={styles.percentLabel}>{t("components.portfolio.gainLoss.returnRate")}</Text>
							</View>
							<Text
								style={[
									styles.percentAmount,
									{
										color: isGainZero ? MarketNewsBrand.colors.text.secondary : isGainPositive ? "#059669" : MarketNewsBrand.colors.semantic.error,
									},
								]}>
								{isGainZero ? "0.00%" : formatChangePercent(safeGainPercent)}
							</Text>
						</View>
					</View>
				</View>
			</Card>
		)
	}

	// 空状态
	return (
		<Card style={styles.card} backgroundColor={MarketNewsBrand.colors.background.tertiary} padding={20} borderRadius={MarketNewsBrand.borderRadius.xl} shadow={true}>
			<View style={styles.emptyContainer}>
				<Ionicons name='wallet-outline' size={32} color='#fff' />
				<Text style={styles.emptyTitle}>{t("components.portfolio.valueCard.noHoldings")}</Text>
				<Text style={styles.emptySubtitle}>{t("components.portfolio.valueCard.startInvesting")}</Text>
			</View>
		</Card>
	)
}

const styles = StyleSheet.create({
	// 主卡片样式
	card: {
		marginBottom: 12,
	},

	// 卡片头部样式
	header: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
	},

	// 头部图标容器样式
	icon: {
		width: 32,
		height: 32,
		borderRadius: MarketNewsBrand.borderRadius.xl,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 12,
	},

	// 头部信息区域样式
	info: {
		flex: 1,
	},

	// 主标题样式
	name: {
		fontSize: MarketNewsBrand.typography.fontSize.base,
		fontWeight: MarketNewsBrand.typography.fontWeight.bold,
		color: MarketNewsBrand.colors.text.inverse,
	},

	// 副标题样式
	symbol: {
		fontSize: MarketNewsBrand.typography.fontSize.xs,
		color: "rgba(255,255,255,0.8)",
	},

	// 价格容器样式
	priceContainer: {
		alignItems: "flex-end",
	},

	// 主要价格显示样式
	price: {
		fontSize: MarketNewsBrand.typography.fontSize['2xl'],
		fontWeight: MarketNewsBrand.typography.fontWeight.bold,
		color: MarketNewsBrand.colors.text.inverse,
		marginBottom: 4,
	},

	// 变化信息容器样式
	change: {
		marginBottom: 12,
	},

	// 变化信息文字样式
	changeText: {
		fontSize: MarketNewsBrand.typography.fontSize.sm,
		fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
		color: MarketNewsBrand.colors.text.inverse,
	},

	// 趋势图容器样式
	chart: {
		alignItems: "flex-end",
	},

	// === 登录提示样式 ===
	loginPromptContainer: {
		alignItems: "center",
	},
	loginIcon: {
		width: 64,
		height: 64,
		borderRadius: MarketNewsBrand.borderRadius.full,
		backgroundColor: "rgba(255,255,255,0.2)",
		alignItems: "center",
		justifyContent: "center",
		marginBottom: 16,
	},
	loginTextContainer: {
		alignItems: "center",
		marginBottom: 20,
	},
	loginTitle: {
		fontSize: MarketNewsBrand.typography.fontSize.xl,
		fontWeight: MarketNewsBrand.typography.fontWeight.bold,
		color: MarketNewsBrand.colors.text.inverse,
		marginBottom: 4,
	},
	loginSubtitle: {
		fontSize: MarketNewsBrand.typography.fontSize.sm,
		color: "rgba(255,255,255,0.8)",
		textAlign: "center",
	},
	loginButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: MarketNewsBrand.colors.background.primary,
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: MarketNewsBrand.borderRadius.full,
	},
	loginButtonText: {
		fontSize: MarketNewsBrand.typography.fontSize.base,
		fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
		color: MarketNewsBrand.colors.primary[400],
		marginRight: 8,
	},

	// === 加载状态样式 ===
	loadingContainer: {
		alignItems: "center",
		paddingVertical: 20,
	},
	loadingText: {
		fontSize: MarketNewsBrand.typography.fontSize.base,
		color: MarketNewsBrand.colors.text.inverse,
		marginTop: 12,
	},

	// === 空状态样式 ===
	emptyContainer: {
		alignItems: "center",
		paddingVertical: 20,
	},
	emptyTitle: {
		fontSize: MarketNewsBrand.typography.fontSize.lg,
		fontWeight: MarketNewsBrand.typography.fontWeight.bold,
		color: MarketNewsBrand.colors.text.inverse,
		marginTop: 12,
		marginBottom: 4,
	},
	emptySubtitle: {
		fontSize: MarketNewsBrand.typography.fontSize.sm,
		color: "rgba(255,255,255,0.8)",
	},

	// === 收益信息样式 ===
	statsContainer: {
		marginTop: 4,
		borderTopWidth: 1,
		borderTopColor: "rgba(255,255,255,0.2)",
		paddingTop: 10,
	},
	statsRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	statsItem: {
		flex: 1,
	},
	statsLabel: {
		fontSize: MarketNewsBrand.typography.fontSize.xs,
		color: "rgba(255,255,255,0.8)",
		marginBottom: 4,
	},
	statsValue: {
		fontSize: MarketNewsBrand.typography.fontSize.base,
		fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
		color: MarketNewsBrand.colors.text.inverse,
	},
	gainCard: {
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: MarketNewsBrand.borderRadius.xl,
		padding: 20,
		flexDirection: "row",
		alignItems: "center",
	},
	gainSection: {
		flex: 1,
	},
	gainHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	iconDot: {
		width: 20,
		height: 20,
		borderRadius: MarketNewsBrand.borderRadius.md,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 6,
	},
	gainLabel: {
		fontSize: MarketNewsBrand.typography.fontSize.xs,
		color: MarketNewsBrand.colors.text.inverse,
		fontWeight: MarketNewsBrand.typography.fontWeight.medium,
	},
	gainAmount: {
		fontSize: MarketNewsBrand.typography.fontSize.lg,
		fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
		lineHeight: 24,
	},
	separator: {
		width: 1,
		height: 40,
		backgroundColor: "rgba(255,255,255,0.3)",
		marginHorizontal: 20,
	},
	percentSection: {
		flex: 1,
	},
	percentHeader: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 8,
	},
	percentLabel: {
		fontSize: MarketNewsBrand.typography.fontSize.xs,
		color: MarketNewsBrand.colors.text.inverse,
		fontWeight: MarketNewsBrand.typography.fontWeight.medium,
	},
	percentAmount: {
		fontSize: MarketNewsBrand.typography.fontSize.lg,
		fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
		lineHeight: 24,
	},
})
