import React, { useEffect, useState, useRef } from "react";
import { useLanguageStore, useAuthStore, useSettingsStore, useUpdateStore } from "@/stores";
import { useTranslation } from "../hooks/useTranslation";
import { SafeAreaProvider,initialWindowMetrics } from "react-native-safe-area-context";
import { AppState, AppStateStatus, Platform } from "react-native";
import { initializationService } from "@/services/system/initializationService";
import { ClerkProvider } from "../components/ClerkProvider";
import { UpdateContainer } from "../components/update";
import { startupService } from "@/services/system/startupService";
import { SystemBars } from "react-native-edge-to-edge";
import { networkAwareATTService } from "@/services/auth/networkAwareATTService";
import { usePathname, Stack } from "expo-router";
import { trackEvent } from '@/services/analytics/postHog';
import { getAppVersion } from "@/config/app";
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

// 配置 Reanimated Logger - 禁用严格模式警告
// 参考: https://docs.swmansion.com/react-native-reanimated/docs/debugging/logger-configuration/
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // 禁用严格模式，避免第三方库（如 react-native-sortables）的警告
});

// 创建一个专门用于处理 PostHog 事件的子组件
function PostHogEventsHandler() {

  const pathname = usePathname();
  // 应用启动时记录
  useEffect(() => {
    
      // 记录应用启动事件
     trackEvent("app_started", { 
        platform: Platform.OS, 
        version: getAppVersion(),
        timestamp: new Date().toISOString()
      });
    
  }, []);

  // 监听路由变化以捕获页面浏览事件
  useEffect(() => {
    if (pathname) {
      // 直接使用路径作为页面标识
      trackEvent("$pageview", { 
        $current_url: pathname
      });
    }
  }, [pathname]);

  return null; // 这个组件不渲染任何内容
}


export default function RootLayout() {
  const { isInitialized: languageInitialized } = useLanguageStore();
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const loadSettings = useSettingsStore(state => state.loadSettings);
  const { t } = useTranslation();
  
  // 更新相关状态
  const { initializeOnAppStart } = useUpdateStore();
  
  // 添加应用状态引用
  const appState = useRef(AppState.currentState);
  
  // ATT权限请求状态
  const [attRequested, setAttRequested] = useState(false);

  // 应用状态变化处理
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    appState.current = nextAppState;
  };


  // ATT权限请求：使用网络感知服务，在网络连接稳定后执行
  useEffect(() => {
    const requestATTWithNetworkAwareness = async () => {
      try {
        Logger.info(LogModule.ANALYTICS, '🔐 [Layout] Starting network-aware ATT permission request');
        
        // 使用网络感知ATT服务，自动处理网络状态和时机
        await networkAwareATTService.requestATTWithNetworkAwareness();
        
        // 标记ATT请求已完成（无论成功与否）
        setAttRequested(true);
        Logger.info(LogModule.ANALYTICS, '🔐 [Layout] ATT request process completed');
        
      } catch (error) {
        Logger.error(LogModule.ANALYTICS, '🔐 [Layout] Network-aware ATT request failed:', error);
        setAttRequested(true);
      }
    };

    requestATTWithNetworkAwareness();
  }, []);

  // 应用启动时初始化认证状态、Firebase 和 AppsFlyer
  // 严格依赖 ATT 权限结果；在 attRequested 为 true 之前不做任何可能涉及跟踪/广告的初始化
  useEffect(() => {
    if (!attRequested) {
      return;
    }

    const initializeApp = async () => {
      // 初始化认证状态与设置
      await checkAuthStatus();
      await loadSettings();

      // 记录启动次数
      await startupService.incrementStartupCount();

      // 初始化分析与归因服务
      try {
        const initResult = await initializationService.initializeAll(true);

        if (!initResult.success) {
          Logger.error(LogModule.ANALYTICS, '❌ Service initialization failed:', initResult.error);
        }
      } catch (error) {
        Logger.error(LogModule.ANALYTICS, '❌ Initialization failure:', error);
      }
      
      // 应用启动后立即检查更新（推荐和必需更新会自动弹出）
      initializeOnAppStart();
    };

    initializeApp();

    // 组件卸载时清理回调
    return () => {
      // 清理其他资源
    };
  }, [attRequested, checkAuthStatus, loadSettings, initializeOnAppStart]);

  // 监听应用状态变化
  useEffect(() => {
    // 添加应用状态监听器
    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    // 清理监听器
    return () => {
      appStateSubscription?.remove();
    };
  }, []);


  // 如果语言未初始化，使用默认文本避免翻译错误
  const getTitle = (key: string, fallback: string) => {
    return languageInitialized ? t(key) : fallback;
  };

  return (
    <ClerkProvider>
      <SafeAreaProvider  initialMetrics={initialWindowMetrics}>
        <PostHogEventsHandler />
        <SystemBars 
          style={{
            statusBar: "dark",
            navigationBar: "dark"
          }}
          hidden={false}
        />
        {/* 更新提醒容器 - 覆盖在所有页面之上 */}
        <UpdateContainer />
        <Stack
          screenOptions={{
            headerBackTitle: getTitle('common.back', 'Back'),
            // 确保返回按钮文本可见
            headerBackVisible: true,
            // edge-to-edge 模式下的头部样式
            headerStyle: {
              backgroundColor: MarketNewsBrand.colors.background.secondary
            }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login"  options={{ title: getTitle("login.title", "Login") }} />
          <Stack.Screen name="oauth-native-callback" options={{
            headerShown: false,
            title: getTitle('navigation.oauthCallback', 'Login Processing'),
          }} />
          <Stack.Screen name="search" options={{
            title: getTitle('navigation.searchStocks', 'Search'),
          }} />
          <Stack.Screen name="stock/[symbol]" options={{ title: getTitle('navigation.stockDetail', 'Stock Detail') }} />
          <Stack.Screen name="stock/position/add/[symbol]" options={{ title: getTitle('navigation.addPosition', 'Add Position') }} />
          <Stack.Screen name="news-flash/[id]" options={{ title: getTitle('navigation.news', 'News') }} />
          <Stack.Screen name="profile/language" options={{ title: getTitle('profile.language', 'Language') }} />
          <Stack.Screen name="profile/currency" options={{ title: getTitle('profile.currency.title', 'Currency') }} />
          <Stack.Screen name="web"  options={{ title: '' }}  />
        </Stack>
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
