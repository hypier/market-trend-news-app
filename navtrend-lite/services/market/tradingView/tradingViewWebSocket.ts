/**
 * TradingView WebSocket 服务
 * 
 * 提供实时数据订阅功能：
 * - 实时报价更新
 * - 实时K线更新
 * - 自动重连机制
 * - 心跳保活
 * - 连接状态管理
 * - 性能监控
 */

import { AppState, AppStateStatus } from 'react-native';
import { TRADINGVIEW_WS_CONFIG } from '@/services/core';
import { tradingViewTokenService, WebSocketTokenResponse } from './tradingViewTokenService';
import type {
  TradingViewWSMessage,
  TradingViewWSSubscribeRequest,
  TradingViewWSQuoteSubscribeRequest,
  TradingViewWSUnsubscribeRequest,
} from '@/types/tradingview';

/**
 * 订阅回调类型
 */
type SubscriptionCallback = (message: TradingViewWSMessage) => void;

/**
 * 连接状态枚举
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

/**
 * 订阅信息
 */
interface SubscriptionInfo {
  callback: SubscriptionCallback;
  request: TradingViewWSSubscribeRequest | TradingViewWSQuoteSubscribeRequest;
  createdAt: number;
}

/**
 * 性能监控指标
 */
export interface PerformanceMetrics {
  totalMessages: number;
  totalReconnects: number;
  lastReconnectTime: number;
  avgMessageLatency: number;
  connectionUptime: number;
  heartbeatMissCount: number;
}

/**
 * WebSocket 消息类型（用于类型安全的发送）
 */
type WSOutgoingMessage =
  | TradingViewWSSubscribeRequest
  | TradingViewWSQuoteSubscribeRequest
  | TradingViewWSUnsubscribeRequest
  | { action: 'heartbeat' };

/**
 * WebSocket 关闭码映射
 */
const WS_CLOSE_CODES: Record<number, string> = {
  1000: 'Normal Closure',
  1001: 'Going Away',
  1002: 'Protocol Error',
  1003: 'Unsupported Data',
  1006: 'Abnormal Closure',
  1008: 'Policy Violation',
  1011: 'Internal Server Error',
} as const;

/**
 * TradingView WebSocket 服务
 * 
 * 单例模式，全局共享一个WebSocket连接
 */
export class TradingViewWebSocket {
  private ws: WebSocket | null = null;
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private connectPromise: Promise<void> | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  
  // Token 管理
  private tokenData: WebSocketTokenResponse | null = null;
  private tokenRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private tokenRefreshRetryCount: number = 0;
  private readonly MAX_TOKEN_REFRESH_RETRIES = 3;
  
  // 订阅管理（整合为单一数据结构）
  private subscriptions: Map<string, SubscriptionInfo> = new Map();
  
  // 连接状态回调
  private onConnectCallbacks: (() => void)[] = [];
  private onDisconnectCallbacks: (() => void)[] = [];
  private onErrorCallbacks: ((error: Error) => void)[] = [];
  
  // 心跳监控
  private lastHeartbeatAck: number = Date.now();
  private heartbeatMissCount: number = 0;
  private readonly MAX_HEARTBEAT_MISS = 3;
  
  // 性能监控
  private metrics: PerformanceMetrics = {
    totalMessages: 0,
    totalReconnects: 0,
    lastReconnectTime: 0,
    avgMessageLatency: 0,
    connectionUptime: 0,
    heartbeatMissCount: 0,
  };
  private connectedAt: number = 0;
  
  // 应用状态监听
  private appStateSubscription: any = null;

  constructor() {
    this.setupAppStateListener();
  }
  
  /**
   * 设置应用状态监听器
   */
  private setupAppStateListener() {
    // 监听应用前后台切换
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    console.log('[TradingView WS] 📱 AppState listener registered');
  }
  
  /**
   * 处理应用状态变化
   */
  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('[TradingView WS] 📱 AppState changed:', nextAppState);
    
    if (nextAppState === 'active') {
      // 应用进入前台
      if (!this.isConnected()) {
        console.log('[TradingView WS] 🔌 App became active, reconnecting...');
        this.connect().catch((error) => {
          console.error('[TradingView WS] ❌ Auto-reconnect failed:', error);
        });
      } else {
        // 已连接，恢复心跳
        console.log('[TradingView WS] ♻️ App became active, resuming heartbeat');
        this.startHeartbeat();
      }
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      // 应用进入后台，暂停心跳（保持连接）
      console.log('[TradingView WS] 🌙 App entering background, pausing heartbeat');
      this.stopHeartbeat();
    }
  };

  /**
   * 获取 WebSocket Token
   */
  private async fetchToken(): Promise<void> {
    try {
      console.log('[TradingView WS] 🔑 Fetching WebSocket token...');
      this.tokenData = await tradingViewTokenService.fetchWebSocketToken(2); // 默认 6 小时
      console.log('[TradingView WS] ✅ Token obtained, expires at:', new Date(this.tokenData.expiresAt).toISOString());
      
      // 调度 token 刷新
      this.scheduleTokenRefresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TradingView WS] ❌ Failed to fetch token:', message);
      throw new Error(`获取 WebSocket Token 失败: ${message}`);
    }
  }

  /**
   * 调度 Token 刷新
   * 在 token 过期前 5 分钟触发刷新
   */
  private scheduleTokenRefresh(): void {
    // 清除旧的刷新定时器
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }

    if (!this.tokenData) {
      return;
    }

    // 计算刷新时间：过期前 5 分钟
    const now = Date.now();
    const refreshTime = this.tokenData.expiresAt - now - (5 * 60 * 1000);

    if (refreshTime <= 0) {
      // Token 已经过期或即将过期，立即刷新
      console.log('[TradingView WS] ⚠️ Token expired or expiring soon, refreshing immediately');
      this.refreshToken();
      return;
    }

    console.log('[TradingView WS] 🕐 Token refresh scheduled in', Math.round(refreshTime / 1000 / 60), 'minutes');

    this.tokenRefreshTimer = setTimeout(() => {
      this.refreshToken();
    }, refreshTime);
  }

  /**
   * 刷新 Token
   * 保持 WebSocket 连接活跃，不中断订阅
   */
  private async refreshToken(): Promise<void> {
    try {
      console.log('[TradingView WS] 🔄 Refreshing token... (retry count: ${this.tokenRefreshRetryCount})');
      
      await this.fetchToken();
      
      // 刷新成功，重置重试计数
      this.tokenRefreshRetryCount = 0;
      console.log('[TradingView WS] ✅ Token refreshed successfully');
      
      // 注意：不需要重新建立 WebSocket 连接
      // 新 token 将在下次重连时使用
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[TradingView WS] ❌ Token refresh failed:', message);
      
      // 实现指数退避重试策略
      this.tokenRefreshRetryCount++;
      
      if (this.tokenRefreshRetryCount >= this.MAX_TOKEN_REFRESH_RETRIES) {
        console.error(
          '[TradingView WS] ❌ Token refresh failed after',
          this.MAX_TOKEN_REFRESH_RETRIES,
          'retries. Stopping retry attempts.'
        );
        // 停止重试，等待 token 过期后自然重连
        return;
      }
      
      // 计算重试延迟：1分钟、2分钟
      const retryDelay = this.tokenRefreshRetryCount * 60 * 1000; // 1分钟 * 重试次数
      console.log(
        '[TradingView WS] ⏳ Retry',
        this.tokenRefreshRetryCount,
        'scheduled in',
        retryDelay / 1000,
        'seconds'
      );
      
      // 调度重试
      this.tokenRefreshTimer = setTimeout(() => {
        this.refreshToken();
      }, retryDelay);
    }
  }

  /**
   * 构建包含认证 token 的 WebSocket URL
   */
  private buildWebSocketUrl(): string {
    // 使用动态获取的 token 和 URL
    if (this.tokenData) {
      const { wsUrl, token } = this.tokenData;
      const separator = wsUrl.includes('?') ? '&' : '?';
      return `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
    }

    // 如果没有 token 数据，抛出错误
    throw new Error('WebSocket token data not available. Please call fetchToken() first.');
  }

  /**
   * 连接 WebSocket（使用 Promise 队列防止并发）
   */
  connect(): Promise<void> {
    // 如果已连接，直接返回
    if (this.ws?.readyState === WebSocket.OPEN && this.state === ConnectionState.CONNECTED) {
      console.log('[TradingView WS] Already connected');
      return Promise.resolve();
    }

    // 如果正在连接，返回现有的 Promise
    if (this.connectPromise) {
      console.log('[TradingView WS] Reusing existing connection promise');
      return this.connectPromise;
    }

    // 创建新的连接 Promise（带超时机制）
    this.connectPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // 先获取 token（如果还没有或已过期）
        if (!this.tokenData) {
          await this.fetchToken();
        }

        // 构建包含 token 的 WebSocket URL
        const wsUrl = this.buildWebSocketUrl();
        console.log('[TradingView WS] Connecting to:', wsUrl);
        this.state = ConnectionState.CONNECTING;

        // 🔥 添加连接超时机制（10秒超时）
        const connectionTimeout = setTimeout(() => {
          console.error('[TradingView WS] Connection timeout');
          if (this.ws) {
            this.ws.close();
            this.ws = null;
          }
          this.state = ConnectionState.ERROR;
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          // 🔥 清除连接超时定时器
          clearTimeout(connectionTimeout);
          
          console.log('[TradingView WS] ✅ Connected');
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.connectedAt = Date.now();
          this.lastHeartbeatAck = Date.now();
          this.heartbeatMissCount = 0;
          
          // 启动心跳
          this.startHeartbeat();
          
          // 🔥 重连后恢复所有订阅
          if (this.subscriptions.size > 0) {
            console.log('[TradingView WS] ✅ Restoring', this.subscriptions.size, 'subscriptions after reconnect');
            this.subscriptions.forEach(({ request }, id) => {
              console.log('[TradingView WS] Restoring subscription:', id, request.action);
              this.send(request);
            });
          }
          
          // 通知连接成功
          this.onConnectCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (error) {
              console.error('[TradingView WS] Connect callback error:', error);
            }
          });
          
          resolve(undefined);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          // 🔥 清除连接超时定时器
          clearTimeout(connectionTimeout);
          
          console.error('[TradingView WS] ❌ Error:', error);
          this.state = ConnectionState.ERROR;
          
          const wsError = new Error('WebSocket connection error');
          this.onErrorCallbacks.forEach((cb) => {
            try {
              cb(wsError);
            } catch (error) {
              console.error('[TradingView WS] Error callback error:', error);
            }
          });
          
          reject(wsError);
        };

        this.ws.onclose = (event) => {
          const reason = WS_CLOSE_CODES[event.code] || 'Unknown';
          console.log(`[TradingView WS] 🔌 Disconnected: ${event.code} (${reason})`, event.reason || '');
          
          // 根据关闭码决定是否清除订阅
          const isCriticalError = event.code === 1008 || event.code === 1003;
          
          if (isCriticalError) {
            console.error('[TradingView WS] ⚠️ Critical error, not reconnecting');
            this.state = ConnectionState.ERROR;
            this.disconnect(true); // 清除订阅
            return;
          }
          
          this.state = ConnectionState.DISCONNECTED;
          
          // 停止心跳
          this.stopHeartbeat();
          
          // 通知断开连接
          this.onDisconnectCallbacks.forEach((cb) => {
            try {
              cb();
            } catch (error) {
              console.error('[TradingView WS] Disconnect callback error:', error);
            }
          });
          
          // 尝试重连
          this.scheduleReconnect();
        };
      } catch (error) {
        this.state = ConnectionState.ERROR;
        console.error('[TradingView WS] ❌ Connection failed:', error);
        reject(error);
      }
    }).finally(() => {
      // 清理连接 Promise
      this.connectPromise = null;
    });

    return this.connectPromise;
  }

  /**
   * 断开 WebSocket 连接
   * 
   * @param clearSubscriptions 是否清除订阅（默认 false，保留订阅以便重连后恢复）
   */
  disconnect(clearSubscriptions: boolean = false) {
    console.log('[TradingView WS] Disconnecting...', { clearSubscriptions });
    
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // 停止心跳
    this.stopHeartbeat();
    
    // 关闭连接
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    // 更新状态
    this.state = ConnectionState.DISCONNECTED;
    
    // 🔥 只在明确要求时才清除订阅（避免重连后丢失订阅）
    if (clearSubscriptions) {
      console.log('[TradingView WS] Clearing all subscriptions');
      this.subscriptions.clear();
    } else {
      console.log('[TradingView WS] Keeping', this.subscriptions.size, 'subscriptions for reconnect');
    }
  }

  /**
   * 订阅实时报价
   * 
   * @param symbols TradingView 格式的 Symbol 数组
   * @param callback 数据回调函数
   * @returns 订阅 ID
   */
  subscribeQuote(
    symbols: string[],
    callback: SubscriptionCallback
  ): string {
    // 检查是否已有相同 symbols 的订阅（去重）
    const symbolsKey = symbols.sort().join(',');
    const existingId = Array.from(this.subscriptions.entries()).find(([id, info]) => {
      if (info.request.action === 'subscribe_quote') {
        const existing = info.request.symbols.sort().join(',');
        return existing === symbolsKey;
      }
      return false;
    })?.[0];
    
    if (existingId) {
      console.warn('[TradingView WS] ⚠️ Already subscribed to these symbols, reusing:', existingId);
      return existingId;
    }
    
    const subscriptionId = `quote_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('[TradingView WS] Subscribing to quote:', {
      subscriptionId,
      symbols,
    });
    
    // 发送订阅请求
    const request: TradingViewWSQuoteSubscribeRequest = {
      action: 'subscribe_quote',
      id: subscriptionId,
      symbols,
      fields: 'all',
    };
    
    // 🔥 保存订阅信息（统一数据结构）
    this.subscriptions.set(subscriptionId, {
      callback,
      request,
      createdAt: Date.now(),
    });
    
    this.send(request);
    
    return subscriptionId;
  }

  /**
   * 订阅实时K线和指标
   * 
   * @param symbol TradingView 格式的 Symbol
   * @param timeframe 时间周期
   * @param range 数据范围
   * @param indicators 指标列表
   * @param callback 数据回调函数
   * @returns 订阅 ID
   */
  subscribePrice(
    symbol: string,
    timeframe: string,
    range: number,
    indicators: string[] = [],
    callback: SubscriptionCallback
  ): string {
    const subscriptionId = `price_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log('[TradingView WS] Subscribing to price:', {
      subscriptionId,
      symbol,
      timeframe,
      range,
    });
    
    // 发送订阅请求
    const request: TradingViewWSSubscribeRequest = {
      action: 'subscribe',
      id: subscriptionId,
      symbol,
      timeframe,
      range,
      indicators,
    };
    
    // 🔥 保存订阅信息（统一数据结构）
    this.subscriptions.set(subscriptionId, {
      callback,
      request,
      createdAt: Date.now(),
    });
    
    this.send(request);
    
    return subscriptionId;
  }

  /**
   * 取消订阅
   * 
   * @param subscriptionId 订阅 ID
   */
  unsubscribe(subscriptionId: string) {
    console.log('[TradingView WS] Unsubscribing:', subscriptionId);
    
    // 移除订阅信息
    this.subscriptions.delete(subscriptionId);
    
    // 发送取消订阅请求
    const request: TradingViewWSUnsubscribeRequest = {
      action: 'unsubscribe',
      id: subscriptionId,
    };
    
    this.send(request);
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    console.log('[TradingView WS] Unsubscribing all');
    
    // 发送取消订阅请求
    this.subscriptions.forEach((_, id) => {
      const request: TradingViewWSUnsubscribeRequest = {
        action: 'unsubscribe',
        id,
      };
      this.send(request);
    });
    
    // 清除订阅
    this.subscriptions.clear();
  }

  /**
   * 发送消息到 WebSocket（类型安全）
   * 
   * @param data 要发送的数据
   */
  private send(data: WSOutgoingMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[TradingView WS] Cannot send, not connected');
      return;
    }

    try {
      const message = JSON.stringify(data);
      console.log('[TradingView WS] Sending:', data.action, 'id' in data ? data.id : '');
      this.ws.send(message);
    } catch (error) {
      console.error('[TradingView WS] Send error:', error);
    }
  }

  /**
   * 处理收到的消息
   * 
   * @param data 消息数据
   */
  private handleMessage(data: string) {
    try {
      const message: TradingViewWSMessage = JSON.parse(data);
      
      // 更新性能指标
      this.metrics.totalMessages++;
      
      // 心跳响应
      if (message.type === 'heartbeat') {
        this.lastHeartbeatAck = Date.now();
        this.heartbeatMissCount = 0;
        this.metrics.heartbeatMissCount = 0;
        return;
      }
      
      // 连接确认
      if (message.type === 'connected') {
        console.log('[TradingView WS] ✅ Connection confirmed');
        return;
      }
      
      // 错误消息
      if (message.type === 'error') {
        console.error('[TradingView WS] ❌ Server error:', message);
        return;
      }
      
      // 分发消息到订阅回调
      console.log('[TradingView WS] 📨 Received message:', message.type);
      this.subscriptions.forEach(({ callback }) => {
        try {
          callback(message);
        } catch (error) {
          console.error('[TradingView WS] ❌ Callback error:', error);
        }
      });
    } catch (error) {
      console.error('[TradingView WS] ❌ Message parse error:', error);
    }
  }

  /**
   * 启动心跳定时器（包含超时检测）
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      // 检查上次心跳响应时间
      const timeSinceLastAck = Date.now() - this.lastHeartbeatAck;
      const timeout = TRADINGVIEW_WS_CONFIG.heartbeatInterval * 2;
      
      if (timeSinceLastAck > timeout) {
        this.heartbeatMissCount++;
        this.metrics.heartbeatMissCount = this.heartbeatMissCount;
        
        console.warn(
          `[TradingView WS] ⚠️ Heartbeat missed (${this.heartbeatMissCount}/${this.MAX_HEARTBEAT_MISS})`,
          `Last ACK: ${Math.round(timeSinceLastAck / 1000)}s ago`
        );
        
        if (this.heartbeatMissCount >= this.MAX_HEARTBEAT_MISS) {
          console.error('[TradingView WS] ❌ Heartbeat timeout detected, reconnecting...');
          this.state = ConnectionState.RECONNECTING;
          this.ws?.close(); // 触发 onclose 重连
          return;
        }
      }
      
      // 发送心跳
      this.send({ action: 'heartbeat' });
    }, TRADINGVIEW_WS_CONFIG.heartbeatInterval);
  }

  /**
   * 停止心跳定时器
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 调度重连（使用指数退避策略）
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    if (this.reconnectAttempts >= TRADINGVIEW_WS_CONFIG.maxReconnectAttempts) {
      console.error('[TradingView WS] ❌ Max reconnect attempts reached');
      this.state = ConnectionState.ERROR;
      return;
    }
    
    this.state = ConnectionState.RECONNECTING;
    this.reconnectAttempts++;
    this.metrics.totalReconnects++;
    this.metrics.lastReconnectTime = Date.now();
    
    // 🔥 指数退避：3s -> 4.5s -> 6.75s -> ... 最多30s
    const delay = Math.min(
      TRADINGVIEW_WS_CONFIG.reconnectInterval * Math.pow(TRADINGVIEW_WS_CONFIG.reconnectDecay, this.reconnectAttempts - 1),
      TRADINGVIEW_WS_CONFIG.maxReconnectInterval
    );
    
    console.log(
      `[TradingView WS] 🔄 Reconnecting in ${Math.round(delay)}ms`,
      `(attempt ${this.reconnectAttempts}/${TRADINGVIEW_WS_CONFIG.maxReconnectAttempts})`
    );
    
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      console.log('[TradingView WS] 🔌 Attempting reconnect...');
      
      // 检查 token 是否有效
      if (this.tokenData) {
        const now = Date.now();
        const timeUntilExpiry = this.tokenData.expiresAt - now;
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeUntilExpiry <= fiveMinutes) {
          console.log('[TradingView WS] ⚠️ Token expired or expiring soon, refreshing before reconnect...');
          try {
            await this.fetchToken();
            console.log('[TradingView WS] ✅ Token refreshed before reconnect');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[TradingView WS] ❌ Failed to refresh token before reconnect:', message);
            // 继续尝试重连，使用旧 token 或降级到静态配置
          }
        } else {
          console.log('[TradingView WS] ✓ Token is still valid, no refresh needed');
        }
      }
      
      this.connect().catch((error) => {
        console.error('[TradingView WS] ❌ Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * 注册连接成功回调
   */
  onConnect(callback: () => void) {
    this.onConnectCallbacks.push(callback);
  }

  /**
   * 注册断开连接回调
   */
  onDisconnect(callback: () => void) {
    this.onDisconnectCallbacks.push(callback);
  }

  /**
   * 注册错误回调
   */
  onError(callback: (error: Error) => void) {
    this.onErrorCallbacks.push(callback);
  }

  /**
   * 获取连接状态（废弃提示）
   * @deprecated 使用 getState() 获取详细状态
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取当前连接状态
   */
  getState(): ConnectionState {
    return this.state;
  }

  /**
   * 获取活跃订阅数量
   */
  getActiveSubscriptionsCount(): number {
    return this.subscriptions.size;
  }
  
  /**
   * 获取性能监控指标
   */
  getMetrics(): Readonly<PerformanceMetrics> {
    return {
      ...this.metrics,
      connectionUptime: this.connectedAt ? Date.now() - this.connectedAt : 0,
    };
  }
  
  /**
   * 获取订阅详情（用于调试）
   */
  getSubscriptions(): { id: string; action: string; createdAt: number }[] {
    return Array.from(this.subscriptions.entries()).map(([id, info]) => ({
      id,
      action: info.request.action,
      createdAt: info.createdAt,
    }));
  }
  
  /**
   * 销毁 WebSocket 实例（清理所有资源）
   */
  destroy() {
    console.log('[TradingView WS] 🗑️ Destroying instance...');
    
    // 断开连接并清除订阅
    this.disconnect(true);
    
    // 清理 AppState 监听器
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
      console.log('[TradingView WS] 📱 AppState listener removed');
    }
    
    // 清除所有回调
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onErrorCallbacks = [];
    
    console.log('[TradingView WS] ✅ Instance destroyed');
  }
}

// 导出单例实例（参考 watchlistService.ts）
export const tradingViewWS = new TradingViewWebSocket();
export default tradingViewWS;

