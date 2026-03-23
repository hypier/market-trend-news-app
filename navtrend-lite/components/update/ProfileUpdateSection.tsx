/**
 * ProfileUpdateSection - 个人中心更新区域组件（简化版）
 * 
 * 功能：
 * - 显示当前应用版本信息
 * - 显示更新检查状态
 * - 提供手动检查更新入口
 * - 显示更新可用状态
 * - 跳转到更新流程
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { UpdateInfo } from '../../types/update';
import { useTranslation } from '../../hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';

// 使用统一的品牌配置
const COLORS = {
  primary: MarketNewsBrand.colors.primary[400],
  success: MarketNewsBrand.colors.semantic.success,
  warning: MarketNewsBrand.colors.semantic.warning,
  background: MarketNewsBrand.colors.background.primary,
  surface: MarketNewsBrand.colors.background.secondary,
  textPrimary: MarketNewsBrand.colors.text.primary,
  textSecondary: MarketNewsBrand.colors.text.secondary,
  textTertiary: MarketNewsBrand.colors.text.tertiary,
  border: MarketNewsBrand.colors.border,
  dot: MarketNewsBrand.colors.semantic.error,
};

const SPACING = MarketNewsBrand.spacing;

interface ProfileUpdateSectionProps {
  currentVersion: string;
  currentBuild?: number;
  updateInfo: UpdateInfo | null;
  isLoading: boolean;
  lastCheckTime: string | null;
  onCheckUpdate: () => void;
  onShowUpdateModal?: () => void;
}

export const ProfileUpdateSection: React.FC<ProfileUpdateSectionProps> = ({
  currentVersion,
  currentBuild,
  updateInfo,
  isLoading,
  lastCheckTime,
  onCheckUpdate,
  onShowUpdateModal,
}) => {
  const { t } = useTranslation();

  // 格式化最后检查时间
  const formatLastCheckTime = (timeString: string | null): string => {
    if (!timeString) return t('update.neverChecked');
    
    const now = new Date();
    const checkTime = new Date(timeString);
    const diffMs = now.getTime() - checkTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return t('update.justNow');
    if (diffMins < 60) return t('update.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('update.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('update.daysAgo', { count: diffDays });
    
    return checkTime.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 获取更新状态信息
  const getUpdateStatus = () => {
    if (isLoading) {
      return {
        text: t('update.checkingUpdate'),
        color: COLORS.textSecondary,
        icon: null,
        showDot: false,
      };
    }
    
    if (updateInfo?.available) {
      return {
        text: updateInfo.required ? t('update.updateRequired') : t('update.updateAvailable'),
        color: updateInfo.required ? COLORS.warning : COLORS.success,
        icon: updateInfo.required ? 'warning' : 'checkmark-circle',
        showDot: true,
      };
    }
    
    return {
      text: t('update.latestVersion'),
      color: COLORS.textSecondary,
      icon: 'checkmark-circle',
      showDot: false,
    };
  };

  const statusInfo = getUpdateStatus();

  const handlePress = () => {
    if (updateInfo?.available && onShowUpdateModal) {
      onShowUpdateModal();
    } else {
      onCheckUpdate();
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* 左侧图标区域 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconWrapper}>
            <Ionicons
              name="phone-portrait-outline"
              size={24}
              color={COLORS.primary}
            />
          </View>
          {statusInfo.showDot && (
            <View style={styles.notificationDot} />
          )}
        </View>

        {/* 中间内容区域 */}
        <View style={styles.textContainer}>
          {/* 主标题 */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{t('update.title')}</Text>
            {statusInfo.icon && (
              <Ionicons
                name={statusInfo.icon as any}
                size={16}
                color={statusInfo.color}
                style={styles.statusIcon}
              />
            )}
          </View>

          {/* 版本信息 */}
          <Text style={styles.version}>
            {t('update.currentVersion')} {currentVersion}
            {currentBuild && ` (${currentBuild})`}
          </Text>

          {/* 状态信息 */}
          <View style={styles.statusRow}>
            <Text style={[styles.status, { color: statusInfo.color }]}>
              {statusInfo.text}
            </Text>
            {updateInfo?.available && (
              <Text style={styles.newVersion}>
                → {updateInfo.version.versionName}
              </Text>
            )}
          </View>

          {/* 最后检查时间 */}
          <Text style={styles.lastCheck}>
            {t('update.lastCheck')}: {formatLastCheckTime(lastCheckTime)}
          </Text>
        </View>

        {/* 右侧操作区域 */}
        <View style={styles.actionContainer}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons
              name="chevron-forward"
              size={20}
              color={COLORS.textTertiary}
            />
          )}
        </View>
      </View>

      {/* 底部分隔线 */}
      <View style={styles.separator} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    minHeight: 80,
  },

  iconContainer: {
    position: 'relative',
    marginRight: SPACING.lg,
  },

  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: MarketNewsBrand.borderRadius.md,
    backgroundColor: COLORS.dot,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  textContainer: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  title: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: COLORS.textPrimary,
  },

  statusIcon: {
    marginLeft: SPACING.sm,
  },

  version: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },

  status: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
  },

  newVersion: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },

  lastCheck: {
    fontSize: MarketNewsBrand.typography.fontSize.xs,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    color: COLORS.textTertiary,
  },

  actionContainer: {
    marginLeft: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },

  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 76, // 对齐文字内容
  },
});
