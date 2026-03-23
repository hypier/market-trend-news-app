import React, { useState, useLayoutEffect, useRef, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform, BackHandler, Linking } from 'react-native';
import * as Application from 'expo-application';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { useTranslation } from '@/hooks/useTranslation';
import { Logger, LogModule } from '@/utils/logger';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MarketNewsBrand } from '@/config/brand';

// 定义WebView接收到的消息类型
interface WebViewMessage {
  type: string;
  data: any;
}

// 定义广告事件数据结构
interface AppData {
  eventName: string;
  eventParams: {
    [key: string]: string;
  };
}

/**
 * 通用Web视图页面
 * 用于在应用内打开网页链接
 * 
 * 使用方式: router.push(`/web?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`)
 */
export default function WebViewScreen() {
  const { t } = useTranslation();
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [webTitle, setWebTitle] = useState<string>('');
  const webViewRef = useRef<WebView>(null);
  const { logContactAdd } = useAnalytics();
  const [initialUrl, setInitialUrl] = useState('');
  
  // 解码URL和标题
  const decodedUrl = useMemo(() => decodeURIComponent(url || ''), [url]);
  const decodedTitle = useMemo(() => title ? decodeURIComponent(title) : '', [title]);

  // 设置初始URL以便追踪页面跳转
  useEffect(() => {
    if (decodedUrl) {
      setInitialUrl(decodedUrl);
    }
  }, [decodedUrl]);

  // 优化的用户代理字符串 - 使用 App 标识
  const optimizedUserAgent = useMemo(() => {
    const appName = Application.applicationName || 'MarketNews';
    const appVersion = Application.nativeApplicationVersion || '2.0.0';
    const bundleId = Application.applicationId || 'com.marketrendnews.top';
    const platformName = Platform.OS === 'ios' ? 'iOS' : 'Android';
    const osVersion = typeof Platform.Version === 'string' ? Platform.Version : String(Platform.Version);
    // 统一采用 App 自定义 UA，便于服务端识别
    return `${appName}/${appVersion} (${bundleId}; ${platformName} ${osVersion})`;
  }, []);

  // 计算要显示的标题：优先使用网页标题，然后是传入的标题，最后是默认文本
  const displayTitle = useMemo(() => {
    if (webTitle) return webTitle;
    if (decodedTitle) return decodedTitle;
    if (isLoading) return t('common.loading');
    return t('common.webView');
  }, [webTitle, decodedTitle, isLoading, t]);

  // 设置header标题 - 当webTitle变化时自动更新
  useLayoutEffect(() => {
    navigation.setOptions({
      title: displayTitle,
    });
  }, [navigation, displayTitle]);

  // 处理Android返回按钮
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [canGoBack]);

  // 处理从WebView接收到的消息
  const handleMessage = useCallback((event: any) => {
    try {
      const message: WebViewMessage = JSON.parse(event.nativeEvent.data);
      Logger.debug(LogModule.API, 'WebView消息:', message);

      // 处理buttonClicked消息类型
      if (message.type === 'buttonClicked') {
        const appData: AppData = message.data;
        Logger.info(LogModule.ANALYTICS, 'appData', appData);
        
        // 从 appData 中提取价值和货币信息
        const eventParams = appData.eventParams || {};
        
        const value = parseFloat(eventParams.value || eventParams.af_revenue || '9.9');
        const currency = eventParams.currency || eventParams.af_currency || 'USD';
        
        // 其他参数
        const additionalParams: Record<string, any> = {};
        Object.keys(eventParams).forEach(key => {
          if (key !== 'value' && key !== 'currency' && 
              key !== 'af_revenue' && key !== 'af_currency') {
            additionalParams[key] = eventParams[key];
          }
        });
        
        // 正确调用 logContactAdd
        logContactAdd(value, currency, additionalParams);
        
        // 记录接收到的广告事件数据
        Logger.info(LogModule.ANALYTICS, '发送到AppsFlyer:', { value, currency, additionalParams });
      } else if (message.type === 'pageReady') {
        // 页面准备就绪，可以隐藏loading
        setIsLoading(false);
        Logger.debug(LogModule.API, '页面加载完成:', message.data);
      } else if (message.type === 'titleChanged') {
        // 处理标题变化
        const newTitle = message.data?.title;
        if (newTitle && typeof newTitle === 'string') {
          setWebTitle(newTitle.trim());
          Logger.debug(LogModule.API, '网页标题更新:', newTitle);
        }
      } else if (message.type === 'externalLink') {
        // 处理从JavaScript发送过来的外部链接请求
        const linkUrl = message.data?.url;
        if (linkUrl && typeof linkUrl === 'string') {
          Logger.info(LogModule.API, '打开外部链接:', linkUrl);
          Linking.openURL(linkUrl).catch(err => {
            Logger.error(LogModule.API, '打开外部链接失败:', err);
          });
        }
      }
    } catch (error) {
      Logger.error(LogModule.API, '解析WebView消息失败:', error);
    }
  }, [logContactAdd]);

  // 处理新窗口打开事件 - 用于处理target="_blank"链接（iOS专用）
  const handleOpenWindow = useCallback((event: any) => {
    const { targetUrl } = event.nativeEvent;
    Logger.info(LogModule.API, '捕获到新窗口打开请求:', targetUrl);
    
    if (targetUrl) {
      Linking.openURL(targetUrl).catch(err => {
        Logger.error(LogModule.API, '打开外部链接失败:', err);
      });
    }
  }, []);

  // 优化的注入JavaScript代码 - 增强处理target="_blank"链接
  const injectedJavaScript = useMemo(() => `
    (function() {
      // 快速设置通信接口
      const postMsg = (type, data) => {
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type, data }));
      };
      
      // iOS WKWebView兼容
      if (!window.webkit) {
        window.webkit = {
          messageHandlers: {
            buttonClicked: {
              postMessage: (data) => postMsg('buttonClicked', data)
            }
          }
        };
      }
      
      // Android接口
      if (!window.AndroidInterface) {
        window.AndroidInterface = {
          buttonClicked: (dataString) => {
            const data = typeof dataString === 'string' ? JSON.parse(dataString) : dataString;
            postMsg('buttonClicked', data);
          }
        };
      }
      
      // 监听标题变化
      let lastTitle = document.title;
      const checkTitle = () => {
        if (document.title && document.title !== lastTitle) {
          lastTitle = document.title;
          postMsg('titleChanged', { title: document.title });
        }
      };
      
      // 立即检查标题
      setTimeout(checkTitle, 100);
      
      // 监听标题变化的多种方式
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => checkTitle());
        if (document.querySelector('title')) {
          observer.observe(document.querySelector('title'), {
            childList: true,
            subtree: true,
            characterData: true
          });
        } else {
          observer.observe(document.head, {
            childList: true,
            subtree: true
          });
        }
      }
      
      // 处理target="_blank"链接 - 更强力的方法
      function handleExternalLinks() {
        try {
          // 获取所有链接
          const links = document.querySelectorAll('a[target="_blank"]');
          
          // 修改每个链接的行为
          links.forEach(link => {
            if (!link.hasAttribute('data-processed')) {
              // 标记已处理过的链接，避免重复处理
              link.setAttribute('data-processed', 'true');
              
              // 添加自定义点击处理
              link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const href = this.getAttribute('href');
                if (href) {
                  // 通知React Native打开外部链接
                  postMsg('externalLink', { url: href });
                }
                return false;
              }, true);
            }
          });
        } catch (err) {
          Logger.error(LogModule.ANALYTICS, '处理外部链接时出错:', err);
        }
      }
      
      // 全局点击事件委托 - 捕获所有链接点击
      document.addEventListener('click', function(e) {
        // 查找被点击的链接元素
        let target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentNode;
          if (!target || target === document.body) break;
        }
        
        // 如果找到链接元素
        if (target && target.tagName === 'A') {
          // 检查是否是外部链接或新窗口链接
          const isBlankTarget = target.getAttribute('target') === '_blank';
          const isExternalLink = target.getAttribute('rel') === 'external';
          const href = target.getAttribute('href');
          
          if ((isBlankTarget || isExternalLink) && href) {
            e.preventDefault(); // 阻止默认行为
            e.stopPropagation(); // 阻止事件冒泡
            // 通知React Native打开外部链接
            postMsg('externalLink', { url: href });
            return false;
          }
        }
      }, true); // 使用捕获阶段
      
      // 覆盖window.open方法
      const originalWindowOpen = window.open;
      window.open = function(url, target) {
        // 如果是_blank或没有指定target
        if (target === '_blank' || !target) {
          postMsg('externalLink', { url: url });
          return null; // 阻止实际window.open操作
        }
        // 否则使用原始方法
        return originalWindowOpen.apply(window, arguments);
      };
      
      // 周期性检查并处理外部链接
      function periodicCheck() {
        handleExternalLinks();
        setTimeout(periodicCheck, 2000); // 每2秒检查一次
      }
      
      // 定期检查标题变化（作为备用方案）
      setInterval(checkTitle, 1000);
      
      // 快速加载完成通知
      const notifyReady = () => {
        postMsg('pageReady', { url: location.href });
        // 页面准备好后再次检查标题
        setTimeout(checkTitle, 200);
        // 初始处理外部链接
        handleExternalLinks();
        // 开始周期性检查
        periodicCheck();
      };
      
      if (document.readyState === 'complete') {
        notifyReady();
      } else {
        document.addEventListener('DOMContentLoaded', notifyReady, { once: true });
        window.addEventListener('load', notifyReady, { once: true });
      }
      
      true;
    })();
  `, []);

  // WebView加载状态处理
  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setLoadProgress(0);
    // 清空之前的标题
    setWebTitle('');
  }, []);

  const handleLoadProgress = useCallback((event: any) => {
    setLoadProgress(event.nativeEvent.progress);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    setLoadProgress(1);
  }, []);

  const handleError = useCallback((e: any) => {
    setError(e.nativeEvent.description);
    setIsLoading(false);
    Logger.error(LogModule.API, 'WebView加载错误:', e.nativeEvent);
  }, []);

  const handleNavigationStateChange = useCallback((navState: any) => {
    setCanGoBack(navState.canGoBack);
    
    // 从导航状态中获取标题（备用方案）
    if (navState.title && navState.title !== webTitle) {
      setWebTitle(navState.title);
      Logger.debug(LogModule.API, '从导航状态获取标题:', navState.title);
    }
  }, [webTitle]);

  // 处理iOS上的链接加载请求 - 控制target="_blank"链接的行为
  const handleShouldStartLoadWithRequest = useCallback((request: any) => {
    // 获取当前请求的URL
    const requestUrl = request.url;
    
    // 记录所有加载请求，便于调试
    Logger.debug(LogModule.API, 'WebView加载请求:', {
      url: requestUrl,
      isMainFrame: request.isTopFrame || request.mainDocumentURL === requestUrl,
      navigationType: request.navigationType
    });
    
    // 判断是否是初始URL
    const isInitialLoad = requestUrl === initialUrl;
    
    // 检测特殊链接
    const isExternalScheme = requestUrl.startsWith('tel:') || 
                             requestUrl.startsWith('mailto:') || 
                             requestUrl.startsWith('sms:') ||
                             requestUrl.startsWith('maps:') ||
                             requestUrl.startsWith('itms:') ||
                             requestUrl.startsWith('itms-apps:');
    
    // 检测是否是外部链接或新窗口链接
    const isNewWindowRequest = request.navigationType === 'click' && !request.isTopFrame;
    const isExternalRequest = request.navigationType === 'other' && request.mainDocumentURL !== requestUrl;
    
    // 外部链接或特殊链接在系统浏览器中打开
    if ((isNewWindowRequest || isExternalRequest || isExternalScheme) && !isInitialLoad) {
      Logger.info(LogModule.API, '检测到外部链接，尝试在系统浏览器打开:', requestUrl);
      
      Linking.canOpenURL(requestUrl).then(supported => {
        if (supported) {
          Linking.openURL(requestUrl);
        } else {
          Logger.error(LogModule.API, '无法打开外部链接:', requestUrl);
        }
      }).catch(err => {
        Logger.error(LogModule.API, '打开外部链接失败:', err);
      });
      
      return false; // 阻止WebView加载
    }
    
    // 允许其他所有请求在WebView中加载
    return true;
  }, [initialUrl]);

  if (!decodedUrl) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: t('common.webView') }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: displayTitle }} />
      
      {/* 优化的加载指示器 */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={MarketNewsBrand.colors.primary[400]} />
          {loadProgress > 0 && loadProgress < 1 && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${loadProgress * 100}%` }]} />
            </View>
          )}
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ 
          uri: decodedUrl,
          // 添加缓存控制头提高加载速度
          headers: {
            'Cache-Control': 'max-age=3600',
            'Connection': 'keep-alive'
          }
        }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadProgress={handleLoadProgress}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        
        // 处理target="_blank"链接 - iOS特有属性
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        
        // 处理新窗口打开事件 - 解决iOS target="_blank"问题
        onOpenWindow={handleOpenWindow}
        
        // 核心性能优化
        javaScriptEnabled={true}
        userAgent={optimizedUserAgent}
        domStorageEnabled={true}
        startInLoadingState={false}
        allowsInlineMediaPlayback={true}
        
        // 缓存优化 - 关键提速
        cacheEnabled={true}
        incognito={false}
        
        // 重要功能恢复
        thirdPartyCookiesEnabled={true}  // 恢复第三方Cookie支持
        sharedCookiesEnabled={true}      // 恢复共享Cookie
        
        // 链接在系统浏览器中打开的特殊设置
        allowsLinkPreview={false}        // 禁用链接预览
        decelerationRate={0.998}        // 标准减速率（使用数值代替字符串）
        
        // iOS特有设置
        allowsBackForwardNavigationGestures={true}  // 允许侧滑导航
        {...(Platform.OS === 'ios' && {
          pullToRefreshEnabled: true,    // 下拉刷新
          allowsInlineMediaPlayback: true,  // 内联播放媒体
          allowsFullscreenVideo: true,   // 允许全屏视频
        })}
        
        // 减少不必要功能以提速
        javaScriptCanOpenWindowsAutomatically={true} // 允许JavaScript自动打开窗口
        mediaPlaybackRequiresUserAction={false}
        
        // 基础安全设置
        allowFileAccess={false}
        originWhitelist={['https://*', 'http://*']}
        
        // 平台特定的加速优化
        {...(Platform.OS === 'android' && {
          androidLayerType: 'hardware',
          cacheMode: 'LOAD_CACHE_ELSE_NETWORK'
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MarketNewsBrand.colors.background.secondary,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    zIndex: 1,
  },
  progressBar: {
    width: '80%',
    height: 3,
    backgroundColor: MarketNewsBrand.colors.background.tertiary,
    borderRadius: 1.5,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: MarketNewsBrand.colors.primary[400],
    borderRadius: 1.5,
  },
}); 