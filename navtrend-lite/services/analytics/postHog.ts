import PostHog from 'posthog-react-native';
import { Logger, LogModule } from '@/utils/logger';


// 单例模式实现
let posthogInstance: PostHog | null = null;

// 获取单例的函数
export function getPostHogInstance(): PostHog {
  if (!posthogInstance) {
    posthogInstance = new PostHog(
      "phc_psOAQZRVtNN44wTc20hjG9wZWCMJzvwVEU2ZsrGjE3E",
      {
        host: 'https://ph.ljsdstage.top',
        // 🎯 核心功能：启用应用生命周期事件自动捕获
        captureAppLifecycleEvents: true,
        // 📊 分析优化：保持会话ID在应用重启间的连续性
        enablePersistSessionIdAcrossRestart: true
      }
    );
  }
  return posthogInstance;
}

// 跟踪事件
export function trackEvent(eventName: string, properties?: Record<string, any>) {
    const posthog = getPostHogInstance();
    posthog.capture(eventName, properties);
    Logger.info(LogModule.ANALYTICS, `🎯 PostHog event logged: ${eventName}`, properties);
}

// 识别用户
export function identifyUser(userId: string, traits?: Record<string, any>) {
    const posthog = getPostHogInstance();
    posthog.identify(userId, traits);
}

//重置posthog账户
export function resetPostHogInstance() {
    const posthog = getPostHogInstance();
    posthog.reset();
}

// ========== 🆕 插页式广告事件追踪 ==========

/**
 * 插页式广告显示
 * @param placement 广告位置 (如: 'app_startup')
 */
export function trackInterstitialAdShown(placement: string) {
    trackEvent('ad_interstitial_shown', {
        placement,
        timestamp: Date.now(),
    });
}

/**
 * 插页式广告关闭
 * @param placement 广告位置
 * @param duration 观看时长（毫秒）
 */
export function trackInterstitialAdClosed(placement: string, duration?: number) {
    trackEvent('ad_interstitial_closed', {
        placement,
        duration_ms: duration,
        timestamp: Date.now(),
    });
}

// ========== 插页式广告事件追踪结束 ==========

// 可选：直接导出实例，但不推荐
export const posthogAnalytics = getPostHogInstance();