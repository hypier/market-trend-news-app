import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useClerk as useClerkAuth,useAuth} from '@clerk/clerk-expo';
import { useTranslation } from '../../hooks/useTranslation';
import { useProfileStore, useAuthStore, useSettingsStore, useUpdateStore } from '@/stores';
import { getSupportedLanguages } from '@/config/i18n';
import UserProfileCard from '../../components/profile/UserProfileCard';
import SettingSection from '../../components/profile/SettingSection';
import { SettingItemData } from '../../components/profile/SettingItem';
import { CommonHeader } from '../../components/ui';
import { ProfileUpdateSection } from '../../components/update';
import { getCurrencySymbol } from '@/utils/currencyFormatter';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

export default function ProfileScreen() {
  const { sessionId } = useAuth();
  const { t, currentLanguage } = useTranslation();


  // 从 Clerk 获取 signOut 方法
  const { signOut: clerkSignOut } = useClerkAuth();
  
  // 从 authStore 获取认证状态
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const authLogout = useAuthStore(state => state.logout);
  const authDeleteAccount = useAuthStore(state => state.deleteAccount);
  const isLogoutLoading = useAuthStore(state => state.isLogoutLoading);
  const authError = useAuthStore(state => state.error);
  const clearError = useAuthStore(state => state.clearError);
  
  // 从 profileStore 获取设置状态
  const {
    showLanguageSelector,
    showCurrencySelector,
  } = useProfileStore();

  // 获取当前货币
  const currency = useSettingsStore(state => state.currency);
  const currencySymbol = getCurrencySymbol(currency || 'USD');
  
  // 更新相关状态
  const { 
    updateInfo, 
    isLoading: updateLoading, 
    ui,
    checkForUpdate,
    showUpdateModal,
    getCurrentVersionInfo,
  } = useUpdateStore();
  
  // 获取当前版本信息
  const [currentVersionInfo, setCurrentVersionInfo] = React.useState<{
    versionName: string;
    buildNumber: number;
  } | null>(null);
  
  React.useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const versionInfo = await getCurrentVersionInfo();
        setCurrentVersionInfo(versionInfo);
      } catch (error) {
        Logger.error(LogModule.ANALYTICS, 'Failed to get version info:', error);
      }
    };
    loadVersionInfo();
  }, [getCurrentVersionInfo]);

  // 处理登录
  const handleLogin = useCallback(() => {
    router.push('/auth/login');
  }, []);


  // 处理登出
  const handleLogout = useCallback(() => {
    clearError();
    
    Alert.alert(
      t('profile.signOut'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.signOut'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // 调用authStore的logout方法，传入clerkSignOut
              await authLogout(clerkSignOut,sessionId);
            } catch (error) {
              Logger.error(LogModule.AUTH, '❌ 登出过程中出现错误:', error);
            }
          }
        },
      ]
    );
  }, [t, authLogout, clerkSignOut, clearError, sessionId]);

  // 处理删除账户
  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      t('profile.deleteAccount'),
      t('profile.deleteAccountWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.deleteAccount'), 
          style: 'destructive',
          onPress: async () => {
            try {
              // 调用 authStore 删除账户
              await authDeleteAccount(clerkSignOut, sessionId);
              
              Alert.alert(
                t('common.success'),
                t('profile.deleteAccountSuccess'),
                [{ text: t('common.ok') }]
              );
            } catch (error: any) {
              Logger.error(LogModule.AUTH, '❌ 删除账户过程中出现错误:', error);
              
              Alert.alert(
                t('common.error'),
                error.message || t('profile.deleteAccountFailed'),
                [{ text: t('common.ok') }]
              );
            }
          }
        },
      ]
    );
  }, [t, authDeleteAccount, clerkSignOut, sessionId]);

  // 处理打开外部链接
  const handleOpenURL = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('common.error'), `无法打开链接: ${url}`);
      }
    } catch {
      Alert.alert(t('common.error'), '打开链接失败');
    }
  }, [t]);

  // 处理手动检查更新
  const handleCheckUpdate = useCallback(() => {
    checkForUpdate(); // 强制刷新
  }, [checkForUpdate]);

  // 处理显示更新模态框
  const handleShowUpdateModal = useCallback(() => {
    showUpdateModal();
  }, [showUpdateModal]);

  // 转换用户数据格式
  const profileUser = useMemo(() => {
    if (!user) return undefined;
    return {
      name: user.name,
      email: user.email,
      accountType: t('profile.freeAccount'),
      picture: user.avatar,
    };
  }, [user, t]);

  // 生成设置项配置
  const settingsData = useMemo((): {
    preferences: SettingItemData[];
    supportLegal: SettingItemData[];
  } => {
    const supportLegalItems: SettingItemData[] = [
      {
        id: 'privacy',
        title: t('profile.privacyPolicy'),
        icon: 'document-text-outline',
        type: 'navigation',
        onPress: () => handleOpenURL('https://www.marketrendnews.top/privacy_policy'),
      },
      {
        id: 'terms',
        title: t('profile.termsOfService'),
        icon: 'document-outline',
        type: 'navigation',
        onPress: () => handleOpenURL('https://www.marketrendnews.top/service'),
      },
      {
        id: 'about',
        title: t('profile.aboutApp'),
        icon: 'information-circle-outline',
        type: 'navigation',
        onPress: () => router.push('/profile/about'),
      },
    ];


    const preferenceItems: SettingItemData[] = [
      {
        id: 'language',
        title: t('profile.language'),
        subtitle: getSupportedLanguages().find(lang => lang.code === currentLanguage)?.nativeName || 'English',
        icon: 'language-outline',
        type: 'navigation',
        onPress: showLanguageSelector,
      },
      {
        id: 'currency',
        title: t('profile.currency.title'),
        subtitle: `${currency || 'USD'} (${currencySymbol})`,
        icon: 'cash-outline',
        type: 'navigation',
        onPress: showCurrencySelector,
      },
    ];

    return {
      preferences: preferenceItems,
      supportLegal: supportLegalItems,
    };
  }, [t, currentLanguage, currency, currencySymbol, showLanguageSelector, showCurrencySelector, handleOpenURL]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 固定的页面头部 */}
      <CommonHeader
        iconName="person-circle"
        titleKey="profile.title"
        subtitleKey="profile.subtitle"
        showSearchButton={false}
      />
      
      <ScrollView style={styles.scrollView}>
        <UserProfileCard
          isLoggedIn={isAuthenticated}
          user={profileUser}
          onLogin={handleLogin}
        />

      {/* 错误提示组件 */}
      {authError && (
        <View style={styles.errorContainer}>
          <View style={styles.errorContent}>
            <Ionicons name="alert-circle-outline" size={22} color={MarketNewsBrand.colors.text.inverse} style={styles.errorIcon} />
            <Text style={styles.errorText}>{authError}</Text>
            <TouchableOpacity style={styles.dismissButton} onPress={clearError}>
              <Ionicons name="close-outline" size={20} color={MarketNewsBrand.colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 版本更新区域 */}
      {currentVersionInfo && (
        <View style={styles.section}>
          <ProfileUpdateSection
            currentVersion={currentVersionInfo.versionName}
            currentBuild={currentVersionInfo.buildNumber}
            updateInfo={updateInfo}
            isLoading={updateLoading.check}
            lastCheckTime={ui.lastCheckTime}
            onCheckUpdate={handleCheckUpdate}
            onShowUpdateModal={handleShowUpdateModal}
          />
        </View>
      )}

      <SettingSection
        title={t('profile.preferences')}
        items={settingsData.preferences}
      />

      <SettingSection
        title={t('profile.supportLegal')}
        items={settingsData.supportLegal}
      />

      {isAuthenticated && (
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.logoutButton, isLogoutLoading && styles.logoutButtonDisabled]}
            onPress={handleLogout}
            disabled={isLogoutLoading}
          >
            <Ionicons name="log-out-outline" size={24} color={isLogoutLoading ? MarketNewsBrand.colors.text.disabled : MarketNewsBrand.colors.market.bearish} />
            <Text style={[styles.logoutText, isLogoutLoading && styles.logoutTextDisabled]}>
              {isLogoutLoading ? t('common.loading') : t('profile.signOut')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteAccountButton, isLogoutLoading && styles.logoutButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isLogoutLoading}
          >
            <Ionicons name="person-remove-outline" size={20} color={isLogoutLoading ? MarketNewsBrand.colors.text.disabled : MarketNewsBrand.colors.text.secondary} />
            <Text style={[styles.deleteAccountText, isLogoutLoading && styles.logoutTextDisabled]}>
              {t('profile.deleteAccount')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: MarketNewsBrand.spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MarketNewsBrand.colors.background.surface,
    padding: MarketNewsBrand.spacing.md,
    marginHorizontal: MarketNewsBrand.spacing.md,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.market.bearish,
  },
  logoutText: {
    fontSize: MarketNewsBrand.typography.fontSize.md,
    color: MarketNewsBrand.colors.market.bearish,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    marginLeft: MarketNewsBrand.spacing.xs,
  },
  errorContainer: {
    backgroundColor: MarketNewsBrand.colors.semantic.error,
    margin: MarketNewsBrand.spacing.md,
    marginTop: 0,
    marginBottom: MarketNewsBrand.spacing.sm,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: MarketNewsBrand.colors.text.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: MarketNewsBrand.spacing.sm,
  },
  errorIcon: {
    marginRight: MarketNewsBrand.spacing.xs,
  },
  errorText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.inverse,
    fontWeight: MarketNewsBrand.typography.fontWeight.medium,
    flex: 1,
  },
  dismissButton: {
    padding: MarketNewsBrand.spacing.xs,
    marginLeft: MarketNewsBrand.spacing.xs,
  },
  logoutButtonDisabled: {
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderColor: MarketNewsBrand.colors.text.disabled,
  },
  logoutTextDisabled: {
    color: MarketNewsBrand.colors.text.tertiary,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: MarketNewsBrand.spacing.md,
    marginHorizontal: MarketNewsBrand.spacing.md,
    marginTop: MarketNewsBrand.spacing.sm,
    borderRadius: MarketNewsBrand.borderRadius.lg,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.border,
  },
  deleteAccountText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    fontWeight: MarketNewsBrand.typography.fontWeight.normal,
    marginLeft: MarketNewsBrand.spacing.xs,
  },
}); 