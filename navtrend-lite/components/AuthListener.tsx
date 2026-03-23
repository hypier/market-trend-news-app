/**
 * AuthListener 组件
 * 
 * 监听 Clerk 的认证状态变化，自动处理:
 * 1. 用户登录 - token交换和认证状态更新
 * 2. 用户登出 - 清理应用状态
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useAuthStore, useWatchlistStore, useWealthStore } from '@/stores';
import { analyticsService } from '@/services/system/analyticsService';
import { Logger } from '@/utils/logger';
import { LogModule } from '@/types/logging';
import { trackEvent, identifyUser, resetPostHogInstance } from '@/services/analytics/postHog';

export function AuthListener() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser(); // 获取用户信息以检测登录方式
  const router = useRouter();
  
  // authStore 方法
  const { 
    isAuthenticated, 
    loginWithClerk, 
    clearUser
  } = useAuthStore();
  
  // 防止重复处理的标记
  const isProcessingAuthRef = useRef(false);
  const lastAuthStateRef = useRef<boolean | null>(null);

  // 处理登录事件
  const handleUserSignedIn = useCallback(async () => {
    if (isProcessingAuthRef.current) return;
    
    try {
      isProcessingAuthRef.current = true;

      // 获取 Clerk token
      const clerkToken = await getToken();
      if (!clerkToken) {
        Logger.error(LogModule.AUTH, '❌ 无法获取Clerk Token');
        isProcessingAuthRef.current = false;
        return;
      }

      // 交换应用token并更新状态
      await loginWithClerk(clerkToken);
      
      // 登录成功后记录事件 - 内联处理
      try {
        if (user && analyticsService.isSDKInitialized()) {
          // 检测登录方式
          let loginMethod = 'clerk_sso';
          if (user.externalAccounts?.length > 0) {
            const provider = user.externalAccounts[0].provider;
            if (provider?.includes('google')) loginMethod = 'google';
            if (provider?.includes('apple')) loginMethod = 'apple';
          }

          // 检测是否新用户 - 内联逻辑
          const isNewUser = user.createdAt ? (() => {
            const createdAt = new Date(user.createdAt);
            const now = new Date();
            const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);
            return diffMinutes <= 5;
          })() : false;
          
          // PostHog 事件记录
          trackEvent("user_logged_in", { 
            user_id: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: user.fullName || '',
            is_new_user: isNewUser,
            login_method: loginMethod
          });
          
          // 识别用户
          identifyUser(user.id, {
            email: user.emailAddresses[0]?.emailAddress,
            name: user.fullName,
          });
          
          // 记录相应事件
          if (isNewUser) {
            await analyticsService.logCompleteRegistration(loginMethod);
          } else {
            await analyticsService.logLogin(loginMethod);
          }
        }
      } catch (error) {
        Logger.warn(LogModule.ANALYTICS, '⚠️ 事件记录失败:', error);
      }
      
      // 获取关注列表
      useWatchlistStore.getState().fetchWatchlist();
      // 导航到主页
      router.replace('/(tabs)/trading' as any);
      
    } catch (error) {
      Logger.error(LogModule.AUTH, '❌ 登录处理失败:', error);
      clearUser(); // 清理可能部分成功的登录状态
    } finally {
      isProcessingAuthRef.current = false;
    }
  }, [getToken, loginWithClerk, clearUser, router, user]);

  // 处理登出事件
  const handleUserSignedOut = useCallback(async () => {
    if (isProcessingAuthRef.current) return;
    
    try {
      isProcessingAuthRef.current = true;
      
      // 清理应用状态
      clearUser();
      // 清除关注列表
      useWatchlistStore.getState().clearWatchlist();
      // 清除持仓列表
      useWealthStore.getState().resetStore();
      // 重置 PostHog 实例
      resetPostHogInstance();
      Logger.info(LogModule.ANALYTICS, '🔄 PostHog 实例已重置');
      // 不自动导航到登录页，保持当前页面
    } catch (error) {
      Logger.error(LogModule.AUTH, '❌ 登出处理失败:', error);
    } finally {
      isProcessingAuthRef.current = false;
    }
  }, [clearUser]);



  // 监听 Clerk 认证状态变化
  useEffect(() => {
    if (!isLoaded) return;

    // 检查认证状态是否发生变化
    if (lastAuthStateRef.current === isSignedIn) return;
    lastAuthStateRef.current = isSignedIn;

    // 防止重复处理
    if (isProcessingAuthRef.current) return;

    // 🔥 获取当前用户的认证类型
    const { user } = useAuthStore.getState();
    const authType = user?.authType;

    // 状态不一致时处理
    if (isSignedIn && !isAuthenticated) {
      handleUserSignedIn();
    } else if (!isSignedIn && isAuthenticated) {
      // 🔥 关键修复：如果是一键登录，不强制退出
      if (authType === 'one_click') {
        return;
      }
      handleUserSignedOut();
    }
  }, [isLoaded, isSignedIn, isAuthenticated, handleUserSignedIn, handleUserSignedOut]);

  // 这个组件不渲染任何UI
  return null;
}