/**
 * 可选择的排行榜项组件
 * 用于底部Sheet中展示可添加的排行榜
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketNewsBrand } from '@/config/brand';
import type { DefaultLeaderboard } from '@/types/leaderboard';
import { useTranslation } from '@/hooks/useTranslation';

interface SelectableLeaderboardItemProps {
  /** 排行榜配置 */
  config: DefaultLeaderboard;

  /** 是否已选中 */
  isSelected: boolean;

  /** 选择/取消选择回调 */
  onToggle: (code: string) => void;

  /** 市场类型 */
  marketType?: string;

  /** 选中的国家代码（仅股票类型） */
  selectedCountry?: string;

  /** 国家标签点击回调（仅股票类型） */
  onCountryClick?: (leaderboardId: string) => void;
}

export function SelectableLeaderboardItem({
  config,
  isSelected,
  onToggle,
  marketType,
  selectedCountry,
  onCountryClick,
}: SelectableLeaderboardItemProps) {
  const { currentLanguage, t } = useTranslation();
  
  const displayName = config.name_translations?.[currentLanguage] ||
    config.name_translations?.zh ||
    config.name_translations?.en ||
    config.id;
  
  const description = config.description_translations?.[currentLanguage] ||
    config.description_translations?.zh ||
    config.description_translations?.en ||
    '';

  // 处理国家标签点击
  const handleCountryClick = () => {
    if (onCountryClick) {
      onCountryClick(config.id);
    }
  };

  // 获取国家显示名称
  const countryName = selectedCountry
    ? t(`leaderboard.sheet.marketCodes.${selectedCountry}`)
    : t('leaderboard.sheet.marketCodes.america');

  return (
    <View style={styles.container}>
      {/* 左侧和中间可点击区域 */}
      <TouchableOpacity
        style={styles.mainContent}
        onPress={() => onToggle(config.id)}
        activeOpacity={0.7}
      >
        {/* 左侧复选框 */}
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected,
        ]}>
          {isSelected && (
            <Ionicons
              name="checkmark"
              size={16}
              color={MarketNewsBrand.colors.text.inverse}
            />
          )}
        </View>

        {/* 中间内容 */}
        <View style={styles.content}>
          <View style={styles.nameRow}>
            <Text
              style={styles.name}
              numberOfLines={1}
            >
              {displayName}
            </Text>
          </View>

          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* 右侧标签 */}
      <View style={styles.tags}>
        {/* 股票类型显示国家标签 */}
        {(marketType === 'stock' || marketType === 'stocks') && (
          <TouchableOpacity
            style={styles.countryTag}
            onPress={handleCountryClick}
            activeOpacity={0.7}
          >
            <Text style={styles.countryTagText}>{countryName}</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={MarketNewsBrand.colors.text.secondary}
            />
          </TouchableOpacity>
        )}

        {config.preset && (
          <View style={[styles.tag, styles.tagPreset]}>
            <Text style={styles.tagTextPreset}>{config.preset}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.primary,
    paddingVertical: MarketNewsBrand.spacing.sm,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: MarketNewsBrand.colors.background.secondary,
  },
  // 主要内容区（复选框+内容）
  mainContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 复选框
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: MarketNewsBrand.borderRadius.sm,
    borderWidth: 2,
    borderColor: MarketNewsBrand.colors.text.disabled,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: MarketNewsBrand.spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderColor: MarketNewsBrand.colors.primary[400],
  },
  
  // 内容区
  content: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    flex: 1,
  },
  
  // 描述
  description: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    lineHeight: 18,
    marginBottom: 6,
  },
  
  // 标签（右侧垂直排列）
  tags: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tag: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: MarketNewsBrand.borderRadius.md,
  },
  tagText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
  },
  tagPreset: {
    backgroundColor: MarketNewsBrand.colors.semantic.warning,
  },
  tagTextPreset: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.semantic.warning,
  },
  // 国家标签
  countryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: MarketNewsBrand.borderRadius.md,
    gap: 4,
  },
  countryTagText: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: MarketNewsBrand.colors.text.secondary,
  },
});

