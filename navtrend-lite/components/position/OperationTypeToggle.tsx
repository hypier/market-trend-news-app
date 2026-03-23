/**
 * 操作类型切换组件
 * 
 * 用于在增持和减持之间切换
 * 
 * @author NavTrend Team
 * @version 1.0.0
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import { useTranslation } from '@/hooks/useTranslation';

export interface OperationTypeToggleProps {
  operationType: 'add' | 'reduce';
  hasPosition: boolean;
  onTypeChange: (type: 'add' | 'reduce') => void;
  disabled?: boolean;
}

/**
 * OperationTypeToggle 组件
 * 增持/减持操作类型切换按钮（独立一行）
 */
export const OperationTypeToggle: React.FC<OperationTypeToggleProps> = ({
  operationType,
  hasPosition,
  onTypeChange,
  disabled = false,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          operationType === 'add' && styles.toggleButtonActiveAdd,
          disabled && styles.toggleButtonDisabled,
        ]}
        onPress={() => onTypeChange('add')}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add-circle-outline"
          size={18}
          color={
            operationType === 'add'
              ? MarketNewsBrand.colors.text.inverse
              : MarketNewsBrand.colors.semantic.success
          }
        />
        <Text
          style={[
            styles.toggleText,
            operationType === 'add' && styles.toggleTextActive,
          ]}
        >
          {t('position.increase')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          operationType === 'reduce' && styles.toggleButtonActiveReduce,
          !hasPosition && styles.toggleButtonDisabled,
          disabled && styles.toggleButtonDisabled,
        ]}
        onPress={() => onTypeChange('reduce')}
        disabled={!hasPosition || disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name="remove-circle-outline"
          size={18}
          color={
            operationType === 'reduce'
              ? MarketNewsBrand.colors.text.inverse
              : !hasPosition
              ? MarketNewsBrand.colors.text.tertiary
              : MarketNewsBrand.colors.semantic.error
          }
        />
        <Text
          style={[
            styles.toggleText,
            operationType === 'reduce' && styles.toggleTextActive,
            !hasPosition && styles.toggleTextDisabled,
          ]}
        >
          {t('position.decrease')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: MarketNewsBrand.spacing.sm,
    gap: MarketNewsBrand.spacing.sm,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: MarketNewsBrand.spacing.md,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderWidth: 1.5,
    borderColor: MarketNewsBrand.colors.border,
    gap: 5,
    ...MarketNewsBrand.shadow.sm,
  },
  toggleButtonActiveAdd: {
    backgroundColor: MarketNewsBrand.colors.semantic.success,
    borderColor: MarketNewsBrand.colors.semantic.success,
  },
  toggleButtonActiveReduce: {
    backgroundColor: MarketNewsBrand.colors.semantic.error,
    borderColor: MarketNewsBrand.colors.semantic.error,
  },
  toggleButtonDisabled: {
    opacity: 0.4,
  },
  toggleText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
  },
  toggleTextActive: {
    color: MarketNewsBrand.colors.text.inverse,
  },
  toggleTextDisabled: {
    color: MarketNewsBrand.colors.text.tertiary,
  },
});

