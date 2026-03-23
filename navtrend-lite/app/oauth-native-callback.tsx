import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '../hooks/useTranslation';
import { Ionicons } from '@expo/vector-icons';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { MarketNewsBrand } from '@/config/brand';

export default function OAuthCallbackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // 设置超时处理
  useEffect(() => {
    Logger.info(LogModule.AUTH, '🔄 OAuth回调页面已加载，正在等待认证完成');
    
    // 20秒超时
    const timeout = setTimeout(() => {
      Logger.warn(LogModule.AUTH, '⚠️ OAuth回调超时，可能是登录流程中断');
      setTimeoutReached(true);
    }, 20000);

    return () => clearTimeout(timeout);
  }, []);

  // 返回主页
  const handleGoToHome = useCallback(() => {
    router.replace('/(tabs)/trading');
  }, [router]);

  // 返回登录页
  const handleRetryLogin = useCallback(() => {
    router.replace('/auth/login');
  }, [router]);

  if (timeoutReached) {
    return (
      <View style={styles.container}>
        <Ionicons name="time-outline" size={48} color={MarketNewsBrand.colors.semantic.error} style={styles.timeoutIcon} />
        <Text style={styles.timeoutTitle}>{t('login.clerk.timeout')}</Text>
        <Text style={styles.timeoutText}>
          {t('login.clerk.timeoutDescription')}
        </Text>
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleGoToHome}>
          <Text style={styles.primaryButtonText}>{t('login.clerk.enterApp')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleRetryLogin}>
          <Text style={styles.secondaryButtonText}>{t('login.clerk.retryLogin')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
      <Text style={styles.text}>{t('login.clerk.processing_oauth')}</Text>
      <Text style={styles.subText}>{t('login.clerk.waitingRedirect')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    padding: 20,
  },
  text: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginTop: 20,
    textAlign: 'center',
  },
  subText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 20,
  },
  timeoutIcon: {
    marginBottom: 16,
  },
  timeoutTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.xl,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  timeoutText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[400],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
  },
  primaryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MarketNewsBrand.colors.primary[400],
    minWidth: 200,
  },
  secondaryButtonText: {
    color: MarketNewsBrand.colors.primary[400],
    fontSize: MarketNewsBrand.typography.fontSize.md,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    textAlign: 'center',
  },
}); 