/**
 * UpdateContainer - 统一更新管理组件
 * 
 * 功能：
 * - 统一管理更新UI组件和状态
 * - 连接UpdateStore状态管理
 * - 处理更新逻辑和用户交互
 * - 统一使用Modal显示所有更新提示
 * - 集成分析事件追踪
 * - 支持强制更新和可选更新
 * - 多语言支持
 * - 用户操作追踪
 */

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUpdateStore, useUserPreferenceStore } from '@/stores';
import { useTranslation } from '../../hooks/useTranslation';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '../../utils/logger';

// 使用统一的品牌配置，带安全回退值
const COLORS = {
  primary: MarketNewsBrand.colors.primary?.[400] || '#12D18E',      // 品牌主色
  primaryDark: MarketNewsBrand.colors.primary?.[500] || '#0EA872',  // 深色主色
  primaryLight: MarketNewsBrand.colors.primary?.[300] || '#4DD8A8', // 浅色主色
  success: MarketNewsBrand.colors.semantic?.success || '#10B981',  // 成功色
  warning: MarketNewsBrand.colors.semantic?.warning || '#F59E0B',  // 警告色
  error: MarketNewsBrand.colors.semantic?.error || '#EF4444',      // 错误色
  background: MarketNewsBrand.colors.background?.primary || '#FFFFFF',   // 背景色
  surface: MarketNewsBrand.colors.background?.secondary || '#F9FAFB',    // 表面色
  overlay: MarketNewsBrand.colors.background?.overlay || 'rgba(0, 0, 0, 0.5)',      // 遮罩层
  textPrimary: MarketNewsBrand.colors.text?.primary || '#111827',        // 主文字
  textSecondary: MarketNewsBrand.colors.text?.secondary || '#6B7280',    // 次要文字
  textInverse: MarketNewsBrand.colors.text?.inverse || '#FFFFFF',        // 反色文字
  border: '#E5E7EB',                                       // 边框色
};

const SPACING = MarketNewsBrand.spacing || {
  xs: 4,
  sm: 8, 
  md: 12,
  lg: 16,
  xl: 20,
};

const BORDER_RADIUS = MarketNewsBrand.borderRadius || {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const UpdateContainer: React.FC = () => {
  const { t } = useTranslation();
  const updateStore = useUpdateStore();
  const userPreferenceStore = useUserPreferenceStore();

  const {
    updateInfo,
    ui,
    error,
    handleUpdateAction,
    showUpdateModal,
  } = updateStore;

  const {
    shouldShowReminder,
  } = userPreferenceStore;

  // 处理立即更新
  const handleUpdate = () => {
    handleUpdateAction('update');
  };

  // 处理暂时忽略（稍后更新）
  const handleDismiss = async () => {
    try {
      await handleUpdateAction('dismiss');
    } catch (error) {
      Logger.error(LogModule.UPDATE, 'Failed to handle dismiss action:', error);
    }
  };

  // 处理跳过版本
  const handleSkip = async () => {
    const version = updateInfo?.version?.versionName;
    if (!version) return;
    
    try {
      await updateStore.skipVersion();
    } catch (error) {
      Logger.error(LogModule.UPDATE, 'Failed to skip version:', error);
    }
  };

  // 自动显示更新提醒逻辑 - 统一使用模态框
  useEffect(() => {
    const checkAndShowReminder = async () => {
      if (updateInfo?.available && !error) {
        const { required, version } = updateInfo;
        const updateType = version.updateType;
        
        if (required || updateType === 'required') {
          // 必需更新：直接显示模态框
          showUpdateModal();
        } else if (updateType === 'recommended') {
          // 推荐更新：立即显示模态框（启动时弹出）
          try {
            const shouldShow = await shouldShowReminder(updateInfo);
            if (shouldShow) {
              showUpdateModal();
            }
          } catch (error) {
            Logger.error(LogModule.UPDATE, 'Failed to check should show reminder:', error);
          }
        } else {
          // 可选更新：检查是否应该显示提醒（延迟显示）
          try {
            const shouldShow = await shouldShowReminder(updateInfo);
            if (shouldShow) {
              showUpdateModal();
            }
          } catch (error) {
            Logger.error(LogModule.UPDATE, 'Failed to check should show reminder:', error);
          }
        }
      }
    };

    checkAndShowReminder();
  }, [updateInfo, error, shouldShowReminder, showUpdateModal]);

  // 如果没有更新信息，不渲染任何内容
  if (!updateInfo?.available) {
    return null;
  }

  const { required: isForceUpdate, version } = updateInfo;
  const { width: screenWidth } = Dimensions.get('window');

  // 决定是否显示跳过按钮（仅可选更新且提供了跳过回调）
  const showSkipButton = !isForceUpdate;
  
  // 决定是否显示稍后按钮（非强制更新且提供了取消回调）
  const showLaterButton = !isForceUpdate;

  return (
    <Modal
      visible={ui.isModalVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modalContainer, { maxWidth: screenWidth - 40 }]}>
            
            {/* 头部图标 */}
            <View style={styles.iconContainer}>
              <View style={[
                styles.iconWrapper,
                { backgroundColor: isForceUpdate ? COLORS.warning : COLORS.primary }
              ]}>
                <Ionicons
                  name={isForceUpdate ? "warning" : "arrow-up-circle"}
                  size={32}
                  color={COLORS.textInverse}
                />
              </View>
            </View>

            {/* 标题 */}
            <Text style={styles.title}>
              {isForceUpdate ? t('update.forceUpdateTitle') : t('update.optionalUpdateTitle')}
            </Text>

            {/* 版本信息 */}
            <Text style={styles.version}>
              {t('update.versionPrefix')} {version.versionName}
            </Text>

            {/* 描述文字 */}
            <Text style={styles.description}>
              {isForceUpdate 
                ? t('update.forceUpdateDesc')
                : t('update.optionalUpdateDesc')
              }
            </Text>

            {/* 按钮区域 */}
            <View style={styles.buttonContainer}>
              {isForceUpdate ? (
                // 强制更新：只显示更新按钮
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleUpdate}
                  activeOpacity={0.8}
                >
                  <Text 
                    style={{
                      fontSize: MarketNewsBrand.typography.fontSize.base,
                      fontWeight: '600',
                      color: 'white',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                    allowFontScaling={false} // 禁用字体缩放
                  >
                    {t('update.updateNow')}
                  </Text>
                </TouchableOpacity>
              ) : (
                // 可选更新：显示多个按钮
                <View style={styles.buttonRow}>
                  {showLaterButton && (
                    <TouchableOpacity
                      style={[styles.button, styles.secondaryButton]}
                      onPress={handleDismiss}
                      activeOpacity={0.8}
                    >
                      <Text 
                        style={{
                          fontSize: MarketNewsBrand.typography.fontSize.base,
                          fontWeight: MarketNewsBrand.typography.fontWeight.medium,
                          color: '#374151',
                          textAlign: 'center',
                          flexShrink: 0,
                        }}
                        allowFontScaling={false}
                      >
                        {t('update.later')}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton, { flex: 1, marginLeft: showLaterButton ? 8 : 0 }]}
                    onPress={handleUpdate}
                    activeOpacity={0.8}
                  >
                    <Text 
                      style={{
                        fontSize: MarketNewsBrand.typography.fontSize.base,
                        fontWeight: '600',
                        color: 'white',
                        textAlign: 'center',
                        flexShrink: 0,
                      }}
                      allowFontScaling={false}
                    >
                      {t('update.updateNow')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 跳过按钮（仅可选更新） */}
              {showSkipButton && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  activeOpacity={0.8}
                >
                  <Text 
                    style={{
                      fontSize: MarketNewsBrand.typography.fontSize.sm,
                      fontWeight: MarketNewsBrand.typography.fontWeight.medium,
                      color: '#6B7280',
                      textAlign: 'center',
                      textDecorationLine: 'underline',
                      flexShrink: 0,
                    }}
                    allowFontScaling={false}
                  >
                    {t('update.skipVersion')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  
  modalContainer: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    minWidth: 300,
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: MarketNewsBrand.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  title: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  
  version: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  
  description: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  
  buttonContainer: {
    width: '100%',
    alignItems: 'center', // 按钮容器居中对齐
  },
  
  buttonRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%', // 确保按钮行占满宽度
    justifyContent: 'space-between', // 按钮之间均匀分布
  },
  
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 100, // 确保按钮有最小宽度
  },
  
  primaryButton: {
    backgroundColor: '#12D18E',
    ...Platform.select({
      ios: {
        shadowColor: '#12D18E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  primaryButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF', // 确保按钮文字为白色
    textAlign: 'center',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    flex: 1,
    marginRight: 8,
    minWidth: 80, // 次要按钮最小宽度
  },
  
  secondaryButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: '#374151', // 确保次要按钮文字为深灰色
    textAlign: 'center',
  },
  
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  skipButtonText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    color: '#6B7280', // 确保跳过按钮文字为灰色
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
});
