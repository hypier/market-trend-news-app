// 支持的语言类型
export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'de' | 'ms' | 'id';

// 语言包类型定义
export interface LanguageStrings {
  // 通用
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    confirm: string;
    ok: string;
    back: string;
    save: string;
    edit: string;
    delete: string;
    remove: string;
    search: string;
    clear: string;
    refresh: string;
    login: string;
    logout: string;
    need: string;  // 🆕 添加need字段
    noData: string;
    comingSoon: string;
    success: string;
    failed: string;
    warning: string;
    info: string;
    loadFailed: string;
    tryAgain: string;
    // 时间单位
    hour: string;
    day: string;
    week: string;
    month: string;
    tips: string;
    webView: string;
  };



  // 导航
  navigation: {
    markets: string;
    watchlist: string;
    portfolio: string;
    discover: string;
    news: string;
    profile: string;
    stockDetail: string;
    addPosition: string;
    searchStocks: string;
    oauthCallback: string;
  };

  // 市场页面
  markets: {
    title: string;
    watchlist: string;
    trendingStocks: string;
    noWatchlist: string;
    pleaseLogin: string;
    clickToLogin: string;
    noTrendingData: string;
    loadingTrending: string;
    dataLoadFailed: string;
    watchlistIntroTitle: string;
    watchlistIntroDesc: string;
    countries: {
      US: string;
      JP: string;
      KR: string;
      DE: string;
      MY: string;
      ID: string;
      HK: string;
      TW: string;
    };
  };

  // 交易页面
  trading: {
    title: string;
    subtitle: string;
    marketOverview: string;
    trendingSecurities: string;
    noDataAvailable: string;
    loadingData: string;
    searchPlaceholder: string;
    refreshData: string;
    markets: string;
    leaderboards: string;
  };

  // 关注列表页面
  watchlist: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    browseStocks: string;
    stocksTracked: string;
    removeConfirmTitle: string;
    removeConfirmMessage: string;
    added: string;
    removed: string;
    loginRequired: string;
    stats: {
      followed: string;
      followedStocks: string;
      avgReturn: string;
      totalValue: string;
      bullish: string;
      bearish: string;
      rising: string;
    };
  };

  // 投资组合页面
  portfolio: {
    title: string;
    subtitle: string;
    totalValue: string;
    totalAssets: string;
    totalGain: string;
    totalGainPercent: string;
    positions: string;
    noPositions: string;
    startInvesting: string;
    loginToView: string;
    loginDesc: string;
    loginNow: string;
    currentHoldings: string;
    loadingPositions: string;
    unableToLoad: string;
    clickRetry: string;
    close: string;
  };

  // 发现页面
  discover: {
    title: string;
    newsAndInsights: string;
    searchResults: string;
    noNews: string;
    refreshFailed: string;
    loadMoreFailed: string;
    scrollToBottom: string;
    loadMore: string;
  };

  // 个人页面
  profile: {
    title: string;
    subtitle: string;
    welcome: string;
    signInDesc: string;
    signIn: string;
    continueAsGuest: string;
    account: string;
    preferences: string;
    supportLegal: string;
    accountSettings: string;
    accountSettingsDesc: string;
    security: string;
    securityDesc: string;
    notifications: string;
    notificationsDesc: string;
    language: string;
    selectLanguage: string;
    currency: {
      title: string;
      updating: string;
    };
    darkMode: string;
    darkModeDesc: string;
    helpSupport: string;
    helpSupportDesc: string;
    privacyPolicy: string;
    termsOfService: string;
    aboutApp: string;
    version: string;
    signOut: string;
    signOutConfirm: string;
    deleteAccount: string;
    deleteAccountConfirm: string;
    deleteAccountWarning: string;
    deleteAccountSuccess: string;
    deleteAccountFailed: string;
    deletingAccount: string;
    freeAccount: string;
    languages: {
      zh: string;
      en: string;
      de: string;
      id: string;
      ja: string;
      ko: string;
      ms: string;
    };
    currencies: {
      [key: string]: string;
    };
    about: {
      officialWebsite: string;
      slogan: string;
      version: string;
      aboutTitle: string;
      description: string;
      coreFeatures: string;
      features: {
        realTimeQuotes: string;
        technicalAnalysis: string;
        simulatedPortfolio: string;
        financialNews: string;
      };
      followUs: string;
      copyright: string;
      releaseDate: string;
    };
  };

  // 登录页面
  login: {
    title: string;
    appSubtitle: string;
    welcomeBack: string;
    welcomeTitle: string;
    welcomeDescription: string;
    chooseLoginMethod: string;
    continueWithGoogle: string;
    continueWithApple: string;
    continueWithEmail: string;
    or: string;
    userLogin: string;
    loginDesc: string;
    userId: string;
    userIdPlaceholder: string;
    userName: string;
    userNamePlaceholder: string;
    loginNote: string;
    loginFailed: string;
    loginFailedTryAgain: string;
    enterUserId: string;
    enterUserName: string;
    enterUsernameError: string;
    loginSuccess: string;
    loggingIn: string;
    loginButton: string;
    selectLoginMethod: string;
    googleLogin: string;
    appleLogin: string;
    signingIn: string;
    termsAgreement: string;
    googleLoginFailed: string;
    appleLoginFailed: string;
    loginFailedWithType: string;
    loginErrorWithType: string;
    userCancelledLogin: string;
    googleRequestNotReady: string;
    appleRequestNotReady: string;
    clearAndRetry: string;
    logoutFailed: string;
    oneClickCreateAccount: string;
    oneClickCreateAccountWarning: string;
    oneClickCreateAccountFailed: string;
    // Clerk 相关翻译
    clerk: {
      alreadySignedIn: string;
      cancelled: string;
      tokenExchangeFailed: string;
      oauthIncomplete: string;
      additionalStepsRequired: string;
      additionalStepsFailed: string;
      processing: string;
      platform: string;
      clerkStatus: string;
      appStatus: string;
      clerkLoggedIn: string;
      clerkProcessing: string;
      appAuthenticated: string;
      waitingRedirect: string;
      loggedIn: string;
      authenticated: string;
      web: string;
      mobile: string;
      processing_oauth: string;
      noAuthStatus: string;
      userAuthenticated: string;
      // 新增错误处理翻译
      networkError: string;
      serverError: string;
      tokenParsingError: string;
      sessionDetected: string;
      unexpectedError: string;
      timeout: string;
      timeoutDescription: string;
      enterApp: string;
      retryLogin: string;
      contactSupport: string;
      authInitFailed: string;
      authServiceUnavailable: string;
      tokenExpired: string;
    };
    verification: {
      title: string;
      description: string;
      continue: string;
      emailSent: string;
      checkMethod: string;
      failed: string;
    };
    
    // Authentication state machine messages
    status: {
      waitingLogin: string;
      initializing: string;
      startingAuth: string;
      verifyingIdentity: string;
      gettingToken: string;
      tokenExchange: string;
      finalizing: string;
      loginSuccess: string;
      loggingOut: string;
      preparingRetry: string;
      loginFailed: string;
      unknownState: string;
      checkingExistingSession: string;
      usingExistingSession: string;
      loggingIn: string;
      authenticated: string;
      notAuthenticated: string;
      oauthStarting: string;
      oauthProcessing: string;
      redirecting: string;
    };
    
    // Authentication error messages
    error: {
      cannotGetClerkToken: string;
      googleOAuthIncomplete: string;
      appleOAuthIncomplete: string;
      appleNotAvailable: string;
      alreadySignedIn: string;
      networkError: string;
      timeout: string;
      sessionCleared: string;
      usingExistingToken: string;
    };
  };

  // 搜索页面
  search: {
    title: string;
    placeholder: string;
    searching: string;
    noResults: string;
    searchHint: string;
    searchStocks: string;
    searchDesc: string;
    searchResultsCount: string;
    networkError: string;
  };

  // 股票详情页面
  stock: {
    loading: string;
    loadFailed: string;
    about: string;
    financials: string;
    news: string;
    noNewsAvailable: string;
    searchNews: string;
    noNewsFound: string;
    newsSearchResults: string;
    aboutCompany: string;
    stockSymbol: string;
    stockCode: string;
    companyName: string;
    exchange: string;
    sector: string;
    industry: string;
    country: string;
    website: string;
    currentPrice: string;
    marketCap: string;
    employees: string;
    founded: string;
    headquarters: string;
    noDescription: string;
    noCompanyDescription: string;
    relatedNews: string;
    relatedStocks: string;
    addToWatchlist: string;
    removeFromWatchlist: string;
    watchlistAdded: string;
    watchlistRemoved: string;
    authRequired: string;
    operationFailed: string;
    stockNotFound: string;
    notInWatchlist: string;
    authFailed: string;
    loginFirst: string;
    range: string;
    stockData: {
      unavailable: string;
    };
    aboutPrefix: string;
    // New TradingView fields
    financialInfo: string;
    marketInfo: string;
    tradingSessions: string;
    currency: string;
    timezone: string;
    tradingHours: string;
    tradable: string;
    intradayTrading: string;
    realTimeData: string;
    noFinancialData: string;
    // Trading session status
    market: string;
    outOfSession: string;
    regular: string;
    eps: string;
    beta: string;
    // Technical analysis
    technical: string;
    technicalError: string;
    summary: string;
    oscillators: string;
    movingAverages: string;
    bullish: string;
    bearish: string;
    neutral: string;
    strongBuy: string;
    buy: string;
    sell: string;
    strongSell: string;
    multiTimeframe: string;
    supportResistance: string;
    resistance: string;
    support: string;
    pivot: string;
    aboveResistance: string;
    belowSupport: string;
    indicatorAll: string;
    indicatorMA: string;
    indicatorOther: string;
    timeframes: {
      '1': string;
      '5': string;
      '15': string;
      '60': string;
      '240': string;
      '1D': string;
      '1W': string;
      '1M': string;
    };
  };

  // 持仓管理页面
  position: {
    addPosition: string;
    increase: string;
    decrease: string;
    currentPosition: string;
    averageCost: string;
    shares: string;
    sellPrice: string;
    totalCost: string;
    expectedReturn: string;
    addHolding: string;
    sellStock: string;
    increaseShares: string;
    decreaseShares: string;
    enterShares: string;
    enterPrice: string;
    currentPrice: string;
    noPositionToSell: string;
    sharesMustBePositive: string;
    sharesExceedMax: string;
    sharesCantExceedHolding: string;
    priceMustBePositive: string;
    priceMustBeGreaterThanOrEqual: string;
    priceExceedMax: string;
    enterAverageCost: string;
    enterSellPrice: string;
    stockCodeEmpty: string;
    loginToTrade: string;
    increaseFailed: string;
    decreaseFailed: string;
    retryLater: string;
    operationInProgress: string;
    enterIncreaseShares: string;
    enterDecreaseShares: string;
  };

  // 新闻页面
  news: {
    title: string;
    newsDetail: string;
    detail: string;
    detailPlaceholder: string;
    invalidUrl: string;
    urlRequired: string;
    unableToLoad: string;
    loadContentFailed: string;
    loadFailed: string;
    loading: string;
    unknownError: string;
    openInBrowser: string;
    openBrowserFailed: string;
    tags: string;
    tabs: {
      formal: string;
      flash: string;
    };
    flash: {
      markets: {
        all: string;
        stock: string;
        crypto: string;
        forex: string;
        index: string;
        futures: string;
        etf: string;
        bond: string;
        economic: string;
      };
    };
    errors: {
      fetchTrendingFailed: string;
    };
    // 搜索相关
    searchPlaceholder: string;
    searchHint: string;
    noSearchResults: string;
    searching: string;
    search: string;
    searchFailed: string;
    loadMoreSearchFailed: string;
  };

  // 错误消息
  errors: {
    networkError: string;
    unknownError: string;
    dataLoadFailed: string;
    operationFailed: string;
    authenticationRequired: string;
    invalidInput: string;
    serverError: string;
  };
  
  // 更新相关翻译
  update: {
    title: string;
    currentVersion: string;
    newVersion: string;
    checkUpdate: string;
    checkingUpdate: string;
    updateAvailable: string;
    updateRequired: string;
    latestVersion: string;
    lastCheck: string;
    neverChecked: string;
    justNow: string;
    minutesAgo: string;
    hoursAgo: string;
    daysAgo: string;
    updateNow: string;
    later: string;
    skipVersion: string;
    forceUpdateTitle: string;
    forceUpdateDesc: string;
    optionalUpdateTitle: string;
    optionalUpdateDesc: string;
    versionPrefix: string;
  };

  // 组件相关翻译
  components: {
    banner: {
      title: string;
      subtitle: string;
      learnMore: string;
    };
    news: {
      header: {
        title: string;
        subtitle: string;
      };
      headerScrolling: {
        title: string;
      };
      item: {
        noTitle: string;
        unknownSource: string;
      };
      list: {
        empty: string;
        emptyDescription: string;
        loadingMore: string;
        loading: string;
        renderError: string;
        retryMessage: string;
      };
      relatedStocks: {
        collapse: string;
        expandMore: string;
      };
    };
    portfolio: {
      valueCard: {
        myHoldings: string;
        totalAssets: string;
        noHoldings: string;
        startInvesting: string;
        loginPrompt: string;
        loginNow: string;
        loadingHoldings: string;
      };
      gainLoss: {
        totalGain: string;
        returnRate: string;
        totalInvestment: string;
        totalShares: string;
      };
      holdings: {
        marketValue: string;
        quantity: string;
        currentPrice: string;
        costPrice: string;
        shares: string;
      };
      chart: {
        title: string;
        developmentTitle: string;
        developmentMessage: string;
        loadingChart: string;
        noData: string;
        noDataMessage: string;
        liveData: string;
        points: string;
      };
    };
    stock: {
      header: {
        loadingInfo: string;
        stats: {
          open: string;
          high: string;
          low: string;
          volume: string;
        };
      };
      keyData: {
        title: string;
        loading: string;
        exchange: string;
        currency: string;
        previousClose: string;
        marketStatus: string;
        open: string;
        closed: string;
        high52Week: string;
        low52Week: string;
        marketCap: string;
        peRatio: string;
        eps: string;
        dividend: string;
        dividendYield: string;
        beta: string;
        avgVolume: string;
        sharesOutstanding: string;
        updateTime: string;
      };
      financials: {
        loading: string;
        noData: string;
        sections: {
          valuation: string;
          financial: string;
          dividend: string;
          other: string;
        };
        metrics: {
          marketCap: string;
          peRatio: string;
          pbRatio: string;
          psRatio: string;
          roe: string;
          roa: string;
          eps: string;
          bookValue: string;
          dividendYield: string;
          beta: string;
          sharesOut: string;
          low52Week: string;
          high52Week: string;
          avgVolume: string;
          enterpriseValue: string;
          debtToEquity: string;
          currentRatio: string;
          forwardPE: string;
          grossMargin: string;
          profitMargin: string;
          totalCash: string;
          totalDebt: string;
          revenue: string;
          netIncome: string;
        };
      };
      position: {
        button: {
          loginToAdd: string;
          holdings: string;
          shares: string;
          addPosition: string;
        };
        modal: {
          title: string;
          existingPosition: string;
          shares: string;
          sharesPlaceholder: string;
          avgCost: string;
          avgCostPlaceholder: string;
          currentPrice: string;
          totalCost: string;
          submit: string;
          validation: {
            sharesRequired: string;
            sharesPositive: string;
            sharesMax: string;
            costRequired: string;
            costPositive: string;
            costMax: string;
          };
          error: {
            title: string;
            retry: string;
          };
        };
      };
      chart: {
        loadingChart: string;
        noData: string;
        noDataMessage: string;
        clear: string;
        timePeriods: {
          '1min': string;
          '5min': string;
          '15min': string;
          '1h': string;
          '1day': string;
          '1week': string;
          '1month': string;
        };
      };
      tradingView: {
        loading: string;
        loadFailed: string;
      };
      range: string;
      stockData: {
        unavailable: string;
      };
    };
    debug: {
      title: string;
      toggle: string;
      sections: {
        cache: string;
        watchlist: string;
        loading: string;
        data: string;
      };
      cache: {
        total: string;
        watchlist: string;
        stockData: string;
        other: string;
        refresh: string;
        clearWatchlist: string;
        clearAll: string;
      };
      loading: {
        detail: string;
        quote: string;
        trend: string;
        logo: string;
        loading: string;
        completed: string;
      };
      data: {
        stockDetail: string;
        realTimeQuote: string;
        trendData: string;
        logo: string;
        points: string;
        error: string;
      };
      watchlist: {
        checkStatus: string;
      };
      dialogs: {
        clearAll: {
          title: string;
          message: string;
          cancel: string;
          confirm: string;
        };
        clearWatchlist: {
          title: string;
          message: string;
          cancel: string;
          confirm: string;
        };
      };
    };
  };

  // 认证相关
  auth: {
    loginRequired: string;
    loginToAccessFeature: string;
  };

  assetCategory: {
    ALL: string;
    STOCK: string;
    ETF: string;
    FUNDS: string;
    FUND: string;
    FUTURES: string;
    FOREX: string;
    CRYPTO: string;
    INDEX: string;
    BOND: string;
    ECONOMIC: string;
    OPTIONS: string;
    COMMODITY: string;
    DR: string;
    SPOT: string;
    OTHER: string;
  };

  // 排行榜相关
  leaderboard: {
    title: string;
    subtitle: string;
    retry: string;
    categories: {
      stocks: string;
      crypto: string;
      indices: string;
      commodities: string;
      forex: string;
    };
    error: {
      title: string;
      loadFailed: string;
      notFound: string;
      networkError: string;
    };
    empty: {
      title: string;
      noData: string;
      noDataForCategory: string;
    };
    item: {
      rank: string;
      symbol: string;
      name: string;
      price: string;
      change: string;
      changePercent: string;
      volume: string;
      marketCap: string;
    };
    custom: {
      title: string;
      create: string;
      edit: string;
      delete: string;
      save: string;
      cancel: string;
      form: {
        title: string;
        name: string;
        namePlaceholder: string;
        nameRequired: string;
        category: string;
        selectCategory: string;
        market: string;
        selectMarket: string;
        preset: string;
        selectPreset: string;
        validation: {
          nameRequired: string;
          nameExists: string;
          categoryRequired: string;
          marketRequired: string;
          presetRequired: string;
        };
      };
      confirm: {
        deleteTitle: string;
        deleteMessage: string;
        delete: string;
        cancel: string;
      };
      toast: {
        created: string;
        updated: string;
        deleted: string;
        createFailed: string;
        updateFailed: string;
        deleteFailed: string;
      };
    };
    sort: {
      title: string;
      byRank: string;
      byChange: string;
      byVolume: string;
      byMarketCap: string;
      ascending: string;
      descending: string;
    };
    presets: {
      us_gainers: string;
      us_losers: string;
      us_actives: string;
      us_large_cap: string;
      us_mid_cap: string;
      us_small_cap: string;
      crypto_large_cap: string;
      crypto_mid_cap: string;
      crypto_small_cap: string;
      crypto_gainers: string;
      crypto_losers: string;
      forex_majors: string;
      commodities_energy: string;
      commodities_metals: string;
      indices_global: string;
    };
    descriptions: {
      us_gainers: string;
      us_losers: string;
      us_actives: string;
      us_large_cap: string;
      us_mid_cap: string;
      us_small_cap: string;
      crypto_large_cap: string;
      crypto_mid_cap: string;
      crypto_small_cap: string;
      crypto_gainers: string;
      crypto_losers: string;
      forex_majors: string;
      commodities_energy: string;
      commodities_metals: string;
      indices_global: string;
    };
    refresh: {
      pullToRefresh: string;
      lastUpdated: string;
      updating: string;
      updated: string;
      failed: string;
    };
    navigation: {
      back: string;
      viewDetails: string;
      addToWatchlist: string;
      removeFromWatchlist: string;
    };
    customizer: {
      title: string;
      categories: string;
      leaderboards: string;
      loading: string;
      noConfig: string;
      addButton: string;
      createCategory: string;
      createCategoryTitle: string;
      comingSoon: string;
      renameCategory: string;
      renameLeaderboard: string;
      categoryCount: string;
      emptyCategory: string;
      confirmDelete: string;
      confirmDeleteCategory: string;
      confirmDeleteLeaderboard: string;
      originalName: string;
      resetTitle: string;
      resetConfirm: string;
      resetButton: string;
      resetFailed: string;
    };
    rename: {
      originalName: string;
      placeholder: string;
      hint: string;
      cancel: string;
      save: string;
    };
    sheet: {
      title: string;
      search: string;
      selectCountry: string;
      loading: string;
      added: string;
      selected: string;
      addSelected: string;
      noResults: string;
      groupProgress: string;
      noSelection: string;
      addSuccess: string;
      addFailed: string;
      marketTypes: {
        stock: string;
        crypto: string;
        forex: string;
        indices: string;
        futures: string;
        bonds: string;
        corporate_bonds: string;
        etf: string;
        other: string;
      };
      marketCodes: {
        america: string;
        canada: string;
        mexico: string;
        austria: string;
        belgium: string;
        switzerland: string;
        cyprus: string;
        czech: string;
        germany: string;
        denmark: string;
        estonia: string;
        spain: string;
        finland: string;
        france: string;
        greece: string;
        hungary: string;
        ireland: string;
        iceland: string;
        italy: string;
        lithuania: string;
        latvia: string;
        luxembourg: string;
        netherlands: string;
        norway: string;
        poland: string;
        portugal: string;
        serbia: string;
        russia: string;
        romania: string;
        sweden: string;
        slovakia: string;
        turkey: string;
        uk: string;
        uae: string;
        bahrain: string;
        egypt: string;
        israel: string;
        kenya: string;
        kuwait: string;
        morocco: string;
        nigeria: string;
        qatar: string;
        'saudi-arabia': string;
        tunisia: string;
        'south-africa': string;
        argentina: string;
        brazil: string;
        chile: string;
        colombia: string;
        peru: string;
        venezuela: string;
        australia: string;
        bangladesh: string;
        china: string;
        hongkong: string;
        indonesia: string;
        india: string;
        japan: string;
        korea: string;
        'sri-lanka': string;
        malaysia: string;
        'new-zealand': string;
        philippines: string;
        pakistan: string;
        singapore: string;
        thailand: string;
        taiwan: string;
        vietnam: string;
        africa: string;
      };
    };
  };

  // 价格提醒
  alerts: {
    title: string;
    manageDesc: string;
    empty: string;
    emptyHint: string;
    createAlert: string;
    alertType: string;
    targetPrice: string;
    currentPrice: string;
    alertTypes: {
      above: string;
      below: string;
      change_percent: string;
    };
    placeholder: {
      price: string;
      percent: string;
    };
    status: {
      active: string;
      inactive: string;
    };
    triggered: string;
    lastTriggered: string;
    deleteConfirm: string;
    deleteSuccess: string;
    createSuccess: string;
    createError: string;
    invalidPrice: string;
    invalidPercent: string;
    percentageAlertForm: {
      aboveButton: string;
      belowButton: string;
      aboveAccessibilityLabel: string;
      belowAccessibilityLabel: string;
      quickSelect: string;
      or: string;
      customPercentage: string;
      inputPercentage: string;
    };
  };
} 