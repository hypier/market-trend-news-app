import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useSSO, useAuth, useSession } from '@clerk/clerk-expo';

import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { useTranslation } from '@/hooks/useTranslation';
import { useRouter } from 'expo-router';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MarketNewsBrand } from '../../config/brand';
import { useAuthStore } from '@/stores';
import { useAnalytics } from '@/hooks/useAnalytics';
import { identifyUser, trackEvent } from '@/services/analytics/postHog';



const { height: screenHeight } = Dimensions.get('window');

// 响应式尺寸计算
const isSmallScreen = screenHeight < 700; // iPhone SE, 小屏安卓手机
const isTinyScreen = screenHeight < 600;  // 极小屏幕

// 动态尺寸计算
const getResponsiveSize = (base: number, small: number = base * 0.8, tiny: number = base * 0.7) => {
  if (isTinyScreen) return tiny;
  if (isSmallScreen) return small;
  return base;
};

// 动态间距计算
const getResponsiveSpacing = (base: number) => {
  if (isTinyScreen) return base * 0.6;
  if (isSmallScreen) return base * 0.75;
  return base;
};

// 定义重定向URL - 使用常量确保一致性
const REDIRECT_URL = 'com.marketrendnews.top://oauth-native-callback';

// 浏览器预热优化
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    }
  }, []);
}

// 处理任何待处理的认证会话
WebBrowser.maybeCompleteAuthSession();

// SSO登录策略类型
type SSOStrategy = 'oauth_google' | 'oauth_apple';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { isSignedIn, signOut } = useAuth();
  const { session } = useSession();
  const router = useRouter();
  const navigation = useNavigation();
  
  // 引入 AuthStore 中的一键登录功能
  const { oneClickLogin, isOneClickLoading } = useAuthStore();
  
  // 引入分析服务
  const { logCompleteRegistration } = useAnalytics();
  
  // 预热浏览器
  useWarmUpBrowser();

  // 统一的加载状态管理
  const [loadingStates, setLoadingStates] = useState({
    google: false,
    apple: false,
    signOut: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [showOneClickModal, setShowOneClickModal] = useState(false);

  // 使用新的 useSSO hook
  const { startSSOFlow } = useSSO();
  
  // 清除错误
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 统一的加载状态更新
  const setLoading = useCallback((key: 'google' | 'apple' | 'signOut', loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  // 检查是否有任何操作在进行中
  const isAnyLoading = loadingStates.google || loadingStates.apple || loadingStates.signOut || isOneClickLoading;

  // 监听加载状态变化，动态更新手势启用状态
  useFocusEffect(
    useCallback(() => {
      // 当isAnyLoading为true时禁用手势
      navigation.setOptions({
        gestureEnabled: !isAnyLoading,
        headerBackVisible: !isAnyLoading,  // 隐藏返回按钮
      });
    }, [isAnyLoading, navigation])
  );
  // 在组件顶部添加重试计数器状态
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRY_COUNT = 3; // 最多重试一次

  // 统一的SSO登录处理方法
  const handleSSOLogin = useCallback(async (strategy: SSOStrategy) => {
    // Apple登录平台检查
    if (strategy === 'oauth_apple' && Platform.OS !== 'ios') {
      setError(t('login.error.appleNotAvailable'));
      return;
    }

    const loadingKey = strategy === 'oauth_google' ? 'google' : 'apple';
    
    try {
      // 自动处理已有会话，不再显示确认对话框
      if (isSignedIn && session) {
        setLoading('signOut', true);
        Logger.info(LogModule.AUTH, '🔄 ------------------检测到已有会话，自动清除');
        try {
          if (signOut) {
            await signOut();
            Logger.info(LogModule.AUTH, '✅ ------------------已有会话清除成功');
          }
        } catch (signOutError) {
          Logger.warn(LogModule.AUTH, '⚠️ 清除已有会话失败，继续尝试新登录', signOutError);
          // 即使清除失败也继续尝试登录
        } finally {
          setLoading('signOut', false);
        }
      }
      
      setLoading(loadingKey, true);
      setError(null);
      
      Logger.info(LogModule.AUTH, `🚀 开始 ${strategy} SSO 登录流程`);
      
      // 使用 startSSOFlow 启动 SSO 流程 - 确保使用正确的重定向URL
      const result = await startSSOFlow({
        strategy,
        //redirectUrl: 使用硬编码,  
        redirectUrl:'com.marketrendnews.top://oauth-native-callback',
      });
      
      // 检查登录结果
      if (result.createdSessionId && result.setActive) {
        Logger.info(LogModule.AUTH, `✅ ${strategy} SSO 创建了新会话，激活会话`);
        await result.setActive({ session: result.createdSessionId });
        Logger.info(LogModule.AUTH, `🎉 ${strategy} SSO 登录成功，AuthListener 将处理后续逻辑`);
        
        // 登录成功后不立即重置状态，让后续页面跳转自然发生
      } else {
        // 如果没有 createdSessionId，可能需要额外步骤
        Logger.info(LogModule.AUTH, `🔄 ${strategy} SSO 流程未完成，可能需要额外步骤`);
        setLoading(loadingKey, false);
      }
    } catch (error: any) {
      Logger.error(LogModule.AUTH, `❌ ${strategy} SSO 登录失败:`, error);
      
      // 用户取消操作
      if (error.message?.includes('cancelled') || 
          error.message?.includes('canceled') || 
          error.message?.includes('User cancelled') ||
          error.message?.includes('User canceled') ||
          error.message?.includes('dismissed') ||
          error.code === 1001 || // Apple ID取消
          error.code === 'ERR_REQUEST_CANCELED') {
        Logger.info(LogModule.AUTH, `🚫 用户取消 ${strategy} 登录`);
      } 
      // 网络错误
      else if (error.message?.includes('network') || error.message?.includes('Network')) {
        setError(t('login.clerk.networkError'));
      }
      else if (error.message?.includes('You are signed out')) {
        handleSSOLogin(strategy)
        return;
      }
      // 特定的SSO错误
      else if (error.message?.includes('Missing external verification redirect URL')) {
        Logger.error(LogModule.AUTH, '重定向URL配置错误:', REDIRECT_URL);
        if (retryCount < MAX_RETRY_COUNT) {
          setRetryCount(prev => prev + 1);
          handleSSOLogin(strategy);
          return
        } else {
          setError(t('login.clerk.redirectUrlError'));
        }
      }
      // 已登录错误
      else if (error.message?.includes('already signed in')) {
        Logger.warn(LogModule.AUTH, '⚠️ 检测到已登录错误，自动清除会话并重试');
        // 尝试清除会话后重试一次
        if (signOut && retryCount < MAX_RETRY_COUNT) {
          // 增加重试计数
          setRetryCount(prev => prev + 1);
          await signOut();
          // 短暂延迟后重试同一登录方法
          setTimeout(() => handleSSOLogin(strategy), 500);
          return;
        } else {
          setError(t('login.error.alreadySignedIn'));
        }
      }
      // 其他错误
      else {
        const fallbackKey = strategy === 'oauth_google' ? 'login.googleLoginFailed' : 'login.appleLoginFailed';
        setError(error.message || t(fallbackKey));
      }
      
      setLoading(loadingKey, false);
    }
  }, [startSSOFlow, setLoading, t, isSignedIn, session, signOut, retryCount]);

  // Google 登录处理
  const handleGoogleLogin = () => {
    handleSSOLogin('oauth_google');
  }
  // Apple 登录处理
  const handleAppleLogin = () => {
    handleSSOLogin('oauth_apple');
  }

  // 记录一键注册事件
  const recordOneClickRegistrationEvent = useCallback(async () => {
    try {
      // 原有的分析事件记录
      await logCompleteRegistration('one_click');
      Logger.info(LogModule.ANALYTICS, '🎆 Analytics: 一键注册事件已记录');
    } catch (error) {
      Logger.warn(LogModule.ANALYTICS, '⚠️ Analytics: 一键注册事件记录失败:', error);
    }
  }, [logCompleteRegistration]);

  // 执行一键创建账户的实际逻辑
  const executeOneClickLogin = useCallback(async () => {
    try {
      clearError();
      Logger.info(LogModule.AUTH, '🚀 开始一键创建账户');
      await oneClickLogin();
      Logger.info(LogModule.AUTH, '✅ 一键创建账户成功');
      
      // 从 AuthStore 获取登录成功的用户信息
      const { user } = useAuthStore.getState();
      if (user) {
        // 识别用户
        identifyUser(user.id, {
          email: user.email,
          name: user.name || user.email,
        });
        Logger.info(LogModule.ANALYTICS, '📊 PostHog: 一键登录用户识别已记录');
      }
            
      // 记录注册事件
      await recordOneClickRegistrationEvent();
      
      // 一键登录成功后，手动跳转到主页
      // 因为一键登录不经过 Clerk，AuthListener 不会处理跳转
      // 使用延迟导航避免 Fragment 冲突
      setTimeout(() => {
        router.replace('/(tabs)/trading' as any);
        Logger.info(LogModule.AUTH, '✅ 已跳转到主页');
      }, 100);
      Logger.info(LogModule.AUTH, '✅ 一键创建账户成功，准备跳转');
      
    } catch (error: any) {
      Logger.error(LogModule.AUTH, '❌ 一键创建账户失败:', error);
      
      // 用户取消或网络错误等不显示错误信息
      if (error.message?.includes('cancelled') || 
          error.message?.includes('canceled') ||
          error.message?.includes('network') || 
          error.message?.includes('Network')) {
        Logger.info(LogModule.AUTH, '🚫 一键创建账户被取消或网络错误');
      } else {
        setError(error.message || t('login.oneClickCreateAccountFailed'));
      }
    }
  }, [oneClickLogin, clearError, setError, t, router, recordOneClickRegistrationEvent]);

  // 一键创建账户处理 - 显示自定义确认弹窗
  const handleOneClickLogin = useCallback(() => {
    setShowOneClickModal(true);
  }, []);

  // 确认创建账户
  const handleConfirmOneClick = useCallback(() => {
    // PostHog 事件：用户确认一键登录
    trackEvent("one_click_login_started", {
      timestamp: new Date().toISOString(),
      source: 'login_screen'
    });
    Logger.info(LogModule.ANALYTICS, '📊 PostHog: 一键登录开始事件已记录');
    
    setShowOneClickModal(false);
    executeOneClickLogin();
  }, [executeOneClickLogin]);

  // 取消创建账户
  const handleCancelOneClick = useCallback(() => {
    // PostHog 事件：用户取消一键登录
    trackEvent("one_click_login_cancelled", {
      timestamp: new Date().toISOString(),
      source: 'login_screen'
    });
    Logger.info(LogModule.ANALYTICS, '📊 PostHog: 一键登录取消事件已记录');
    
    setShowOneClickModal(false);
  }, []);
  // 手动清理会话并重新开始
  const handleRetryLogin = useCallback(async () => {
    clearError();
    
    try {
      // 先尝试清除已有会话
      if (isSignedIn && signOut) {
        setLoading('signOut', true);
        await signOut();
        setLoading('signOut', false);
      }
      
      // 刷新页面状态
      setError(null);
      setLoadingStates({ google: false, apple: false, signOut: false });
    } catch (error) {
      Logger.error(LogModule.AUTH, '❌ 清除登录状态失败:', error);
    }
  }, [clearError, isSignedIn, signOut, setLoading]);

  // 关闭键盘
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <LinearGradient
      colors={[MarketNewsBrand.colors.primary[50], MarketNewsBrand.colors.background.secondary]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[
                styles.scrollContent,
                isTinyScreen && { justifyContent: 'flex-start', paddingTop: 20 },
                { justifyContent: 'center' }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 装饰性背景元素 - 小屏幕隐藏 */}
              {!isTinyScreen && (
                <>
                  <View style={styles.decorativeCircle1} />
                  <View style={styles.decorativeCircle2} />
                  <View style={styles.decorativeCircle3} />
                </>
              )}

              {/* 应用头部 */}
              <View style={styles.headerContainer}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('@/assets/images/adaptive-icon.svg')}
                    style={styles.logo}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.appName}>MarketNews</Text>
                <Text style={styles.subtitle}>{t('login.appSubtitle')}</Text>
              </View>

              {/* 登录表单 */}
              <View style={styles.formContainer}>
                <View style={styles.welcomeSection}>
                  <Text style={styles.formTitle}>{t('login.welcomeTitle')}</Text>
                  <Text style={styles.formSubtitle}>{t('login.welcomeDescription')}</Text>
                </View>

                {/* 登录按钮组 */}
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isAnyLoading && styles.loginButtonDisabled
                    ]}
                    onPress={handleGoogleLogin}
                    disabled={isAnyLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={MarketNewsBrand.colors.gradients.primary as [string, string, ...string[]]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loadingStates.google ? (
                        <ActivityIndicator size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                      ) : (
                        <Ionicons name="logo-google" size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                      )}
                      <Text style={styles.loginButtonText}>
                        {loadingStates.google ? t('login.signingIn') : t('login.googleLogin')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={[
                        styles.loginButton,
                        isAnyLoading && styles.loginButtonDisabled
                      ]}
                      onPress={handleAppleLogin}
                      disabled={isAnyLoading}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={[MarketNewsBrand.colors.primary[800], MarketNewsBrand.colors.primary[700]]}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        {loadingStates.apple ? (
                          <ActivityIndicator size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                        ) : (
                          <Ionicons name="logo-apple" size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                        )}
                        <Text style={styles.loginButtonText}>
                          {loadingStates.apple ? t('login.signingIn') : t('login.appleLogin')}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  {/* 一键创建账户按钮 */}
                  <TouchableOpacity
                    style={[
                      styles.loginButton,
                      isAnyLoading && styles.loginButtonDisabled
                    ]}
                    onPress={handleOneClickLogin}
                    disabled={isAnyLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[MarketNewsBrand.colors.primary[600], MarketNewsBrand.colors.primary[500]]}
                      style={styles.buttonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {isOneClickLoading ? (
                        <ActivityIndicator size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                      ) : (
                        <Ionicons name="flash-outline" size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.buttonIcon} />
                      )}
                      <Text style={styles.loginButtonText}>
                        {isOneClickLoading ? t('login.signingIn') : t('login.oneClickCreateAccount')}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>


                </View>

                {/* 错误状态显示 */}
                {error && !isAnyLoading && (
                  <View style={styles.errorContainer}>
                    <LinearGradient
                      colors={MarketNewsBrand.colors.gradients.error as [string, string, ...string[]]}
                      style={styles.errorGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.errorContent}>
                        <View style={styles.errorHeader}>
                          <Ionicons name="warning-outline" size={20} color={MarketNewsBrand.colors.text.inverse} />
                          <Text style={styles.errorTitle}>{t('login.loginFailed')}</Text>
                        </View>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={handleRetryLogin}
                        >
                          <Ionicons name="refresh-outline" size={16} color={MarketNewsBrand.colors.text.inverse} />
                          <Text style={styles.retryButtonText}>{t('login.clearAndRetry')}</Text>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </View>
                )}

                {/* 使用条款提示 */}
                <View style={styles.termsContainer}>
                  <Ionicons name="information-circle-outline" size={16} color={MarketNewsBrand.colors.text.tertiary} style={styles.termsIcon} />
                  <Text style={styles.termsText}>
                    {t('login.termsAgreement')}
                  </Text>
                </View>
              </View>

              {/* 底部间距 */}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* 一键创建账户确认弹窗 */}
      <Modal
        visible={showOneClickModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelOneClick}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* 弹窗头部 */}
            <View style={styles.modalHeader}>
              <Ionicons name="flash-outline" size={24} color={MarketNewsBrand.colors.primary[600]} />
              <Text style={styles.modalTitle}>{t('login.oneClickCreateAccount')}</Text>
            </View>
            
            {/* 弹窗内容 */}
            <View style={styles.modalContent}>
              <View style={styles.warningSection}>
                <Ionicons name="warning-outline" size={20} color={MarketNewsBrand.colors.semantic.warning} />
                <Text style={styles.modalWarningText}>
                  {t('login.oneClickCreateAccountWarning')}
                </Text>
              </View>
            </View>
            
            {/* 弹窗按钮 */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancelOneClick}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmOneClick}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[MarketNewsBrand.colors.primary[600], MarketNewsBrand.colors.primary[500]]}
                  style={styles.confirmButtonGradient}
                >
                  <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: getResponsiveSpacing(24),
    paddingTop: getResponsiveSpacing(60),
    paddingBottom: getResponsiveSpacing(40),
  },

  // 装饰背景元素 - 响应式调整，使用品牌紫色
  decorativeCircle1: {
    position: 'absolute',
    top: getResponsiveSize(-100, -60, -40),
    right: getResponsiveSize(-100, -60, -40),
    width: getResponsiveSize(200, 120, 80),
    height: getResponsiveSize(200, 120, 80),
    borderRadius: getResponsiveSize(100, 60, 40),
    backgroundColor: `${MarketNewsBrand.colors.primary[400]}15`, // 透明度15
  },
  decorativeCircle2: {
    position: 'absolute',
    top: screenHeight * 0.3,
    left: getResponsiveSize(-80, -50, -30),
    width: getResponsiveSize(160, 100, 60),
    height: getResponsiveSize(160, 100, 60),
    borderRadius: getResponsiveSize(80, 50, 30),
    backgroundColor: `${MarketNewsBrand.colors.primary[400]}10`, // 透明度10
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: getResponsiveSize(-120, -80, -50),
    right: getResponsiveSize(-60, -40, -20),
    width: getResponsiveSize(240, 150, 100),
    height: getResponsiveSize(240, 150, 100),
    borderRadius: getResponsiveSize(120, 75, 50),
    backgroundColor: `${MarketNewsBrand.colors.primary[400]}08`, // 透明度08
  },

  // 头部样式 - 响应式调整
  headerContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(36),
    zIndex: 1,
  },
  logoContainer: {
    width: getResponsiveSize(120, 90, 70),
    height: getResponsiveSize(120, 90, 70),
    borderRadius: 9999, // 使用极大值确保完全圆形
    backgroundColor: MarketNewsBrand.colors.background.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(24),
    // 使用品牌阴影系统，创建更立体的效果
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: getResponsiveSize(8, 6, 4) },
    shadowOpacity: 0.25,
    shadowRadius: getResponsiveSize(20, 15, 10),
    elevation: getResponsiveSize(15, 10, 8),
    // 添加边框增强圆形效果
    borderWidth: 3,
    borderColor: `${MarketNewsBrand.colors.primary[400]}20`,
    // 确保内容居中且圆形效果明显
    overflow: 'hidden',
  },
  logo: {
    width: getResponsiveSize(100, 75, 55),
    height: getResponsiveSize(100, 75, 55),
    // 让logo本身也是圆形，与容器匹配
    borderRadius: 9999,
    backgroundColor: 'transparent',
  },
  appName: {
    fontSize: getResponsiveSize(32, 28, 24),
    fontWeight: MarketNewsBrand.typography.fontWeight.extrabold as any,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: getResponsiveSpacing(8),
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: getResponsiveSize(18, 16, 14),
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
    textAlign: 'center',
    paddingHorizontal: getResponsiveSpacing(16), // 小屏幕增加水平边距
  },

  // 表单样式 - 响应式调整，使用品牌配置
  formContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: getResponsiveSize(20, 16, 12),
    padding: getResponsiveSpacing(28),
    marginHorizontal: getResponsiveSpacing(16),
    // 使用品牌阴影系统
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: getResponsiveSize(6, 4, 3) },
    shadowOpacity: 0.12,
    shadowRadius: getResponsiveSize(16, 12, 8),
    elevation: getResponsiveSize(10, 8, 6),
    zIndex: 1,
    // 添加轻微边框增强层次感
    borderWidth: 1,
    borderColor: `${MarketNewsBrand.colors.primary[400]}10`,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(28),
  },
  formTitle: {
    fontSize: getResponsiveSize(22, 20, 18),
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: getResponsiveSpacing(6),
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: getResponsiveSize(15, 14, 13),
    color: MarketNewsBrand.colors.text.tertiary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal as any,
    textAlign: 'center',
    paddingHorizontal: getResponsiveSpacing(8), // 小屏幕增加边距
  },

  // 按钮组 - 响应式调整
  buttonGroup: {
    gap: getResponsiveSpacing(12),
    marginBottom: getResponsiveSpacing(20),
  },
  loginButton: {
    borderRadius: MarketNewsBrand.borderRadius.lg,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: getResponsiveSize(3, 2, 1) },
    shadowOpacity: 0.15,
    shadowRadius: getResponsiveSize(10, 8, 6),
    elevation: getResponsiveSize(6, 4, 3),
    marginBottom: getResponsiveSpacing(8),
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSpacing(16),
    paddingHorizontal: getResponsiveSpacing(24),
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginRight: getResponsiveSpacing(12),
  },
  loginButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: getResponsiveSize(17, 16, 15),
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    letterSpacing: 0.3,
  },

  // 错误状态 - 响应式调整，使用品牌配置
  errorContainer: {
    borderRadius: MarketNewsBrand.borderRadius.xl,
    marginBottom: getResponsiveSpacing(20),
    shadowColor: MarketNewsBrand.colors.semantic.error,
    shadowOffset: { width: 0, height: getResponsiveSize(3, 2, 1) },
    shadowOpacity: 0.2,
    shadowRadius: getResponsiveSize(10, 8, 6),
    elevation: getResponsiveSize(6, 4, 3),
  },
  errorGradient: {
    borderRadius: MarketNewsBrand.borderRadius.xl,
  },
  errorContent: {
    padding: getResponsiveSpacing(20),
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing(12),
  },
  errorTitle: {
    fontSize: getResponsiveSize(16, 15, 14),
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    color: MarketNewsBrand.colors.text.inverse,
    marginLeft: getResponsiveSpacing(8),
  },
  errorText: {
    fontSize: getResponsiveSize(14, 13, 12),
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: getResponsiveSize(20, 18, 16),
    marginBottom: getResponsiveSpacing(16),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: getResponsiveSpacing(12),
    paddingHorizontal: getResponsiveSpacing(20),
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  retryButtonText: {
    fontSize: getResponsiveSize(14, 13, 12),
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    marginLeft: getResponsiveSpacing(6),
  },

  // 条款提示 - 响应式调整
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  termsIcon: {
    marginRight: getResponsiveSpacing(6),
    marginTop: 1,
  },
  termsText: {
    fontSize: getResponsiveSize(13, 12, 11),
    color: MarketNewsBrand.colors.text.tertiary,
    lineHeight: getResponsiveSize(18, 16, 14),
    textAlign: 'left',
    flex: 1,
  },

  bottomSpacer: {
    height: getResponsiveSpacing(80),
  },

  // 弹窗样式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing(24),
  },
  modalContainer: {
    backgroundColor: MarketNewsBrand.colors.background.surface,
    borderRadius: getResponsiveSize(20, 16, 12),
    width: '100%',
    maxWidth: 400,
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: getResponsiveSize(8, 6, 4) },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(20, 15, 10),
    elevation: getResponsiveSize(15, 10, 8),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: getResponsiveSpacing(24),
    paddingHorizontal: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(16),
  },
  modalTitle: {
    fontSize: getResponsiveSize(20, 18, 16),
    fontWeight: MarketNewsBrand.typography.fontWeight.bold as any,
    color: MarketNewsBrand.colors.text.primary,
    marginLeft: getResponsiveSpacing(12),
  },
  modalContent: {
    paddingHorizontal: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(24),
  },
  warningSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: MarketNewsBrand.colors.semantic.warning + '20', // 添加透明度
    padding: getResponsiveSpacing(16),
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: MarketNewsBrand.colors.semantic.warning,
  },
  modalWarningText: {
    fontSize: getResponsiveSize(15, 14, 13),
    color: MarketNewsBrand.colors.semantic.warning,
    lineHeight: getResponsiveSize(22, 20, 18),
    marginLeft: getResponsiveSpacing(12),
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing(24),
    paddingBottom: getResponsiveSpacing(24),
    gap: getResponsiveSpacing(12),
  },
  modalButton: {
    flex: 1,
    height: getResponsiveSize(52, 48, 44), // 固定高度确保一致性
    borderRadius: MarketNewsBrand.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.text.disabled,
  },
  cancelButtonText: {
    fontSize: getResponsiveSize(16, 15, 14),
    fontWeight: MarketNewsBrand.typography.fontWeight.medium as any,
    color: MarketNewsBrand.colors.text.secondary,
  },
  confirmButton: {
    shadowColor: MarketNewsBrand.colors.primary[400],
    shadowOffset: { width: 0, height: getResponsiveSize(3, 2, 1) },
    shadowOpacity: 0.15,
    shadowRadius: getResponsiveSize(8, 6, 4),
    elevation: getResponsiveSize(4, 3, 2),
  },
  confirmButtonGradient: {
    width: '100%',
    height: '100%', // 使用100%高度而不是padding
    borderRadius: MarketNewsBrand.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: getResponsiveSize(16, 15, 14),
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold as any,
    color: MarketNewsBrand.colors.text.inverse,
  },
}); 