import { Platform } from 'react-native';
import { trackEvent } from '@/services/analytics/postHog';
import { Logger, LogModule } from '@/utils/logger';

class AnalyticsService {
  private isInitialized = true; // 默认设置为 true，因为 PostHog 在其他地方初始化



  /**
   * 记录事件到 PostHog
   * @param eventName 事件名称
   * @param eventValues 事件参数
   */
  private async logEvent(eventName: string, eventValues: Record<string, any> = {}): Promise<void> {
    try {
      trackEvent(eventName, eventValues);
      Logger.info(LogModule.ANALYTICS, `📊 Event logged: ${eventName}`, eventValues);
    } catch (error) {
      Logger.error(LogModule.ANALYTICS, `事件记录失败 (${eventName}):`, error);
    }
  }

  /**
   * 1. 首次添加持仓信息
   */
  async logFirstAdd(symbol?: string): Promise<void> {
    const eventValues = symbol ? { symbol } : {};
    await this.logEvent('first_add_position', eventValues);
  }

  /**
   * 2. 添加减持信息
   */
  async logAddShell(symbol?: string): Promise<void> {
    const eventValues = symbol ? { symbol } : {};
    await this.logEvent('reduce_position', eventValues);
  }

  /**
   * 3. 添加增持信息（点击保存完成增持）
   */
  async logAddBuy(symbol?: string): Promise<void> {
    const eventValues = symbol ? { symbol } : {};
    await this.logEvent('add_buy_position', eventValues);
  }

  /**
   * 4. 查看股票详情
   */
  async logViewItem(symbol?: string, market?: string): Promise<void> {
    const eventValues: Record<string, any> = {};
    if (symbol) eventValues.symbol = symbol;
    if (market) eventValues.market = market;
    await this.logEvent('view_item', eventValues);
  }

  /**
   * 5. 搜索股票（进入查询页面）
   */
  async logSearchStocks(query?: string): Promise<void> {
    const eventValues = query ? { query } : {};
    await this.logEvent('search_stocks', eventValues);
  }

  /**
   * 6. 首次添加收藏
   */
  async logFirstWatchlist(symbol?: string): Promise<void> {
    const eventValues = symbol ? { symbol } : {};
    await this.logEvent('first_watchlist', eventValues);
  }

  /**
   * 7. 添加收藏
   */
  async logAddWatchlist(symbol?: string): Promise<void> {
    const eventValues = symbol ? { symbol } : {};
    await this.logEvent('add_watchlist', eventValues);
  }

  /**
   * 8. 查看新闻内容
   */
  async logViewNews(newsId?: string, newsTitle?: string): Promise<void> {
    const eventValues: Record<string, any> = {};
    if (newsId) eventValues.newsId = newsId;
    if (newsTitle) eventValues.newsTitle = newsTitle;
    await this.logEvent('view_news', eventValues);
  }

  /**
   * 9. 开启推送权限
   */
  async logOpenNotifications(): Promise<void> {
    const eventValues = {};
    await this.logEvent('Open_notifications', eventValues);
  }

   /**
   * 10. 点击Banner图
   */
   async logBannerClicks(bannerId?: string, bannerUrl?: string): Promise<void> {
    const eventValues: Record<string, any> = {};
    if (bannerId) eventValues.bannerId = bannerId;
    if (bannerUrl) eventValues.bannerUrl = bannerUrl;
    await this.logEvent('banner_click', eventValues);
  }

   /**
   * 11. 完成注册
   * @param method 注册方法 (如: 'google', 'apple', 'email')
   */
   async logCompleteRegistration(method?: string): Promise<void> {
    const eventValues = method ? { method } : {};
    await this.logEvent('complete_registration', eventValues);
  }

   /**
   * 12. 用户登录
   * @param method 登录方法 (如: 'google', 'apple', 'email')
   */
   async logLogin(method?: string): Promise<void> {
    const eventValues = method ? { method } : {};
    await this.logEvent('login', eventValues);
  }

    /**
     * 13. Banner点击统计用户数量数据回调
     * @param value 价值金额 (数字类型，例如: 9.9)
     * @param currency 货币代码 (可选，默认 'USD'，符合 ISO 4217 标准)
     * @param additionalParams 额外参数 (可选)
     */
    async logContactAdd(value: number, currency: string = 'USD', additionalParams?: Record<string, any>): Promise<void> {
        const eventValues = {
            revenue: value,
            currency: currency,
            ...additionalParams
        };

        await this.logEvent('contact_add', eventValues);
    }

       /**
   * 14. 弹窗点击统计
   */
   async logDialogView(bannerId?: string, bannerUrl?: string): Promise<void> {
     const eventValues: Record<string, any> = {};
     if (bannerId) eventValues.bannerId = bannerId;
     if (bannerUrl) eventValues.bannerUrl = bannerUrl;
     await this.logEvent('dialog_view_click', eventValues);
   }

   /**
   * 15. 更新检查
   */
   async logUpdateCheck(hasUpdate: boolean, currentVersion: string, latestVersion?: string): Promise<void> {
     const eventValues: Record<string, any> = {
       has_update: hasUpdate,
       current_version: currentVersion,
     };
     if (latestVersion) eventValues.latest_version = latestVersion;
     await this.logEvent('update_check', eventValues);
   }

   /**
   * 16. 用户更新操作
   */
   async logUpdateAction(action: 'update' | 'dismiss' | 'skip', version: string): Promise<void> {
     const eventValues = {
       action,
       version,
     };
     await this.logEvent('update_action', eventValues);
   }

   /**
   * 17. 应用商店导航
   */
   async logStoreNavigation(version: string): Promise<void> {
     const eventValues = {
       version,
       platform: Platform.OS,
     };
     await this.logEvent('store_navigation', eventValues);
   }


  /**
   * 检查 SDK 是否已初始化
   */
  isSDKInitialized(): boolean {
    return this.isInitialized;
  }
}

// 导出单例实例
export const analyticsService = new AnalyticsService();
export default analyticsService;