/**
 * 持仓表单输入组件
 * 
 * 用于输入持仓数量、价格，并显示总成本/总收益
 * 
 * @author NavTrend Team
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPriceWithCode, formatNumber } from '@/utils/currencyFormatter';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';

export interface PositionFormInputsProps {
  operationType: 'add' | 'reduce';
  shares: string;
  avgCost: string;
  errors: { shares?: string; avgCost?: string };
  currentPrice: number;
  displayCurrency: string;
  position?: { quantity: number; averagePrice: number } | null;
  totalAmount: string;
  isLoading: boolean;
  onSharesChange: (value: string) => void;
  onAvgCostChange: (value: string) => void;
  onUseCurrentPrice: () => void;
  // 汇率转换相关
  convertedAvgCost?: number;      // 转换后的平均成本
  convertedTotalAmount?: number;   // 转换后的总成本
}

/**
 * PositionFormInputs 组件
 * 表单输入区域，包含持仓信息、输入框、总计
 */
export const PositionFormInputs: React.FC<PositionFormInputsProps> = ({
  operationType,
  shares,
  avgCost,
  errors,
  currentPrice,
  displayCurrency,
  position,
  totalAmount,
  isLoading,
  onSharesChange,
  onAvgCostChange,
  onUseCurrentPrice,
  convertedAvgCost,
  convertedTotalAmount,
}) => {
  const { t } = useTranslation();
  
  // 是否需要显示转换值（当目标货币不是USD时）
  const showConversion = displayCurrency !== 'USD' && convertedAvgCost !== undefined;

  return (
    <View style={styles.container}>
      {/* 现有持仓信息（如有） */}
      {position && position.quantity > 0 && (
        <View style={styles.existingPositionCard}>
          <View style={styles.existingPositionHeader}>
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={MarketNewsBrand.colors.primary[400]}
            />
            <Text style={styles.existingPositionTitle}>
              {t('position.currentPosition')}
            </Text>
          </View>
          <View style={styles.existingPositionContent}>
            <View style={styles.existingPositionItem}>
              <Text style={styles.existingPositionLabel}>
                {t('position.shares')}
              </Text>
              <Text style={styles.existingPositionValue}>
                {formatNumber(position.quantity, 4)}
              </Text>
            </View>
            <View style={styles.existingPositionItem}>
              <Text style={styles.existingPositionLabel}>
                {t('position.averageCost')}
              </Text>
              <Text style={styles.existingPositionValue}>
                {formatPriceWithCode(position.averagePrice, 'USD')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 股数输入 */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{t('position.shares')}</Text>
        <View style={[styles.inputWrapper, errors.shares && styles.inputError]}>
          <TextInput
            style={styles.input}
            value={shares}
            onChangeText={onSharesChange}
            placeholder={operationType === 'add' ? t('position.enterIncreaseShares') : t('position.enterDecreaseShares')}
            placeholderTextColor={MarketNewsBrand.colors.text.tertiary}
            keyboardType="numeric"
            editable={!isLoading}
          />
          <Ionicons
            name="layers-outline"
            size={20}
            color={MarketNewsBrand.colors.text.tertiary}
          />
        </View>
        {errors.shares && (
          <Text style={styles.errorText}>{errors.shares}</Text>
        )}
      </View>

      {/* 价格输入 */}
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabel}>
            {operationType === 'add' ? t('position.averageCost') : t('position.sellPrice')}
          </Text>
          <TouchableOpacity
            onPress={onUseCurrentPrice}
            disabled={isLoading || currentPrice <= 0}
            style={styles.useCurrentPriceButton}
          >
            <Ionicons
              name="download-outline"
              size={16}
              color={MarketNewsBrand.colors.primary[400]}
            />
            <Text style={styles.useCurrentPriceText}>
              {t('position.currentPrice')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.inputWrapper, errors.avgCost && styles.inputError]}>
          <TextInput
            style={styles.input}
            value={avgCost}
            onChangeText={onAvgCostChange}
            placeholder={operationType === 'add' ? t('position.enterAverageCost') : t('position.enterSellPrice')}
            placeholderTextColor={MarketNewsBrand.colors.text.tertiary}
            keyboardType="numeric"
            editable={!isLoading}
          />
          <Text style={styles.currencyLabel}>USD</Text>
        </View>
        {errors.avgCost && (
          <Text style={styles.errorText}>{errors.avgCost}</Text>
        )}
      </View>

      {/* 总计提示（包含汇率转换） */}
      {shares && avgCost && !errors.shares && !errors.avgCost && (
        <View style={styles.totalHint}>
          <Ionicons
            name="calculator-outline"
            size={14}
            color={MarketNewsBrand.colors.text.tertiary}
          />
          <View style={styles.totalHintContent}>
            {/* 第一行：平均成本 */}
            <Text style={styles.totalHintText}>
              {operationType === 'add' ? t('position.averageCost') : t('position.sellPrice')}
              : <Text style={styles.totalHintValue}>{avgCost} USD</Text>
              {showConversion && convertedAvgCost && (
                <Text style={styles.totalHintConverted}> ≈ {formatPriceWithCode(convertedAvgCost, displayCurrency)}</Text>
              )}
            </Text>
            {/* 第二行：总成本 */}
            <Text style={styles.totalHintText}>
              {operationType === 'add'
                ? t('position.totalCost')
                : t('position.expectedReturn')}
              : <Text style={styles.totalHintValue}>{totalAmount} USD</Text>
              {showConversion && convertedTotalAmount && (
                <Text style={styles.totalHintConverted}> ≈ {formatPriceWithCode(convertedTotalAmount, displayCurrency)}</Text>
              )}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: MarketNewsBrand.spacing.lg,
  },
  existingPositionCard: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    padding: MarketNewsBrand.spacing.lg,
    marginBottom: MarketNewsBrand.spacing.md,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.border,
  },
  existingPositionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: MarketNewsBrand.spacing.md,
    gap: MarketNewsBrand.spacing.xs,
  },
  existingPositionTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    color: MarketNewsBrand.colors.text.primary,
  },
  existingPositionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  existingPositionItem: {
    flex: 1,
  },
  existingPositionLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: 4,
  },
  existingPositionValue: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
  },
  inputGroup: {
    marginBottom: MarketNewsBrand.spacing.md,
  },
  inputLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
    color: MarketNewsBrand.colors.text.secondary,
    marginBottom: MarketNewsBrand.spacing.xs,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: MarketNewsBrand.spacing.xs,
  },
  useCurrentPriceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  useCurrentPriceText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.primary[400],
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: MarketNewsBrand.borderRadius.md,
    paddingHorizontal: MarketNewsBrand.spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.border,
  },
  inputError: {
    borderColor: MarketNewsBrand.colors.semantic.error,
  },
  input: {
    flex: 1,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.text.primary,
    padding: 0,
  },
  currencyLabel: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.semantic.error,
    marginTop: 4,
  },
  // 弱化的总计提示（无外框，灰色小字，支持两行）
  totalHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  totalHintContent: {
    flex: 1,
    gap: 4,
  },
  totalHintText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal as any,
    lineHeight: MarketNewsBrand.typography.fontSize.sm * 1.4,
  },
  totalHintValue: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
  },
  totalHintConverted: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal as any,
  },
});

