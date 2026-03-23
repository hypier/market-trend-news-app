import { useEffect, useState, useRef } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore , useLanguageStore } from "@/stores";
import { MarketNewsBrand } from '@/config/brand';
import { Logger, LogModule } from '@/utils/logger';

export default function Index() {
  const router = useRouter();
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);
  const { initializeLanguage } = useLanguageStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false); // 防止重复初始化

  // 应用启动时初始化（只执行一次）
  useEffect(() => {
    // 如果已经初始化过，直接返回
    if (initRef.current) {
      return;
    }
    
    initRef.current = true;
    
    const initializeApp = async () => {
        try {
          await checkAuthStatus();
          await initializeLanguage();
          setIsInitialized(true);
      } catch (error) {
        Logger.error(LogModule.ANALYTICS, '❌ Index: 应用初始化失败:', error);
        setIsInitialized(true); // 即使失败也继续，避免卡在启动页
      }
    };
    
    initializeApp();
  }, [checkAuthStatus, initializeLanguage]);

  // 初始化完成后立即跳转到首页
  useEffect(() => {
    if (isInitialized) {
      Logger.info(LogModule.ANALYTICS, '📱 [Index] Navigating to trading tab');
      router.replace("/(tabs)/trading");
    }
  }, [isInitialized, router]);

  // 显示加载指示器，直到初始化完成
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: MarketNewsBrand.colors.background.secondary }}>
      <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
    </View>
  );
} 