import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { ClerkProvider as ClerkProviderBase } from '@clerk/clerk-expo';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Logger } from '../utils/logger';
import { LogModule } from '../types/logging';
import { AppConfig } from '@/config/app';
import { useTranslation } from '../hooks/useTranslation';
import { AuthListener } from './AuthListener';
import { MarketNewsBrand } from '@/config/brand';

// Token 缓存配置
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err: any) {
      Logger.error(LogModule.AUTH, 'Error getting Clerk token:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err: any) {
      Logger.error(LogModule.AUTH, 'Error saving Clerk token:', err);
    }
  },
};

interface ClerkProviderProps {
  children: React.ReactNode;
}

// Fallback UI 组件
function ClerkProviderFallback({ onRetry, error }: { onRetry: () => void; error?: string }) {
  const { t } = useTranslation();
  
  return (
    <View style={styles.fallbackContainer}>
      <Text style={styles.fallbackTitle}>{t('login.clerk.authInitFailed')}</Text>
      <Text style={styles.fallbackText}>
        {error || t('login.clerk.authServiceUnavailable')}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryButtonText}>{t('login.clerk.retryLogin')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Loading UI 组件
function ClerkProviderLoading() {
  const { t } = useTranslation();
  
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>{t('login.clerk.processing')}</Text>
    </View>
  );
}

export function ClerkProvider({ children }: ClerkProviderProps) {
  const [initState, setInitState] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { t } = useTranslation();
  
  // 获取 Clerk publishable key
  const publishableKey = AppConfig.CLERK.PUBLISHABLE_KEY;
  
  // 验证 publishable key
  const isPublishableKeyValid = publishableKey && !publishableKey.includes('your_clerk_publishable_key_here');
  
  // 使用 useMemo 来稳定 Provider 的 props
  const stableProps = useMemo(() => ({
    publishableKey,
    tokenCache,
  }), [publishableKey]);
  
  // 初始化 Clerk
  useEffect(() => {
    const initializeClerk = async () => {
      try {
        setInitState('loading');
        setError(null);
        
        if (!isPublishableKeyValid) {
          throw new Error(t('login.clerk.missingPublishableKey'));
        }

        setInitState('success');
        Logger.info(LogModule.AUTH, '✅ Clerk Provider 初始化成功');
      } catch (err: any) {
        Logger.error(LogModule.AUTH, '❌ Clerk Provider 初始化失败:', err);
        setError(err.message || t('login.clerk.authInitFailed'));
        setInitState('error');
      }
    };
    
    initializeClerk();
  }, [isPublishableKeyValid, retryCount, t]);
  
  // 重试函数
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  // 如果 publishable key 无效，显示错误
  if (!isPublishableKeyValid) {
    return (
      <ClerkProviderFallback 
        onRetry={handleRetry}
        error={t('login.clerk.missingPublishableKey')}
      />
    );
  }
  
  // 加载状态
  if (initState === 'loading') {
    return <ClerkProviderLoading />;
  }
  
  // 错误状态
  if (initState === 'error') {
    return <ClerkProviderFallback onRetry={handleRetry} error={error || undefined} />;
  }
  
  // 成功状态 - 使用标准渲染方式
  return (
    <ClerkProviderBase
      publishableKey={stableProps.publishableKey}
      tokenCache={stableProps.tokenCache}
      signInUrl="com.marketrendnews.top://oauth-native-callback"
      signUpUrl="com.marketrendnews.top://oauth-native-callback"
      waitlistUrl="com.marketrendnews.top://oauth-native-callback"
    >
      <AuthListener />
      {children}
    </ClerkProviderBase>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    padding: 20,
  },
  fallbackTitle: {
    fontSize: MarketNewsBrand.typography.fontSize.lg,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
    color: MarketNewsBrand.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: MarketNewsBrand.typography.fontSize.sm,
    color: MarketNewsBrand.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: MarketNewsBrand.colors.primary[500],
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: MarketNewsBrand.borderRadius.lg,
  },
  retryButtonText: {
    color: MarketNewsBrand.colors.text.inverse,
    fontSize: MarketNewsBrand.typography.fontSize.base,
    fontWeight: MarketNewsBrand.typography.fontWeight.semibold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
  },
  loadingText: {
    fontSize: MarketNewsBrand.typography.fontSize.base,
    color: MarketNewsBrand.colors.text.secondary,
    marginTop: 16,
  },
}); 