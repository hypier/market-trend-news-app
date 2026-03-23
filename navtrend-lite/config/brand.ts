/**
 * MarketNews 品牌配置系统
 * 
 * 定义了全新的品牌视觉系统，包括：
 * - 天空蓝色主题色彩系统 (#0EA5E9)
 * - 字体和排版系统
 * - 间距和布局系统
 * - 设计令牌和语义化颜色
 * 
 * 专为 MarketNews 财经应用定制的设计系统
 */

export interface BrandColors {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    main?: string; // 添加 main 属性
    light?: string; // 添加 light 属性
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  gradients: {
    primary: string[];
    hero: string[];
    success: string[];
    warning: string[];
    error: string[];
  };
  market: {
    bullish: string;
    bearish: string;
    neutral: string;
    volume: string;
    // 扩展的市场颜色
    success: string;
    danger: string;
    // 状态相关的浅色背景
    successLight: string;
    successBg: string;
    dangerLight: string;
    dangerBg: string;
    neutralLight: string;
    neutralBg: string;
    // 覆盖层颜色
    successOverlay: string;
    dangerOverlay: string;
    neutralOverlay: string;
  };
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    surface: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    disabled: string;
  };
  // 边框颜色系统
  border: {
    default: string;
    light: string;
    dark: string;
  };
  // 添加缺失的颜色属性
  info?: string;
}

export interface BrandTypography {
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
  };
  fontWeight: {
    light: '300';
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extrabold: '800';
    // 数字专用字重
    numericLight: '400';
    numericMedium: '500';
    numericBold: '600';
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

export interface BrandSpacing {
  unit: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

export interface BrandBorderRadius {
  none: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface BrandShadow {
  sm: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  md: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  lg: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
}

/**
 * MarketNews 品牌配置
 * 基于天空蓝色主题 (#0EA5E9) 的全新视觉系统
 */
export const MarketNewsBrand = {
  // 品牌信息
  name: 'MarketNews',
  tagline: 'Stay Informed, Trade Smart',
  version: '1.0.0',

  // 色彩系统 - 天空蓝色主题
  colors: {
    // 主色调 - 天空蓝色系
    primary: {
      50: '#F0F9FF',   // 极浅天空蓝
      100: '#E0F2FE',  // 浅天空蓝
      200: '#BAE6FD',  // 中浅天空蓝
      300: '#7DD3FC',  // 中天空蓝
      400: '#0EA5E9',  // 主天空蓝 (品牌主色)
      500: '#0284C7',  // 深天空蓝
      600: '#0369A1',  // 更深天空蓝
      700: '#0C4A6E',  // 深蓝
      800: '#075985',  // 极深蓝
      900: '#020617',  // 最深蓝
      main: '#0EA5E9', // 主色别名
      light: '#7DD3FC', // 浅色别名
    },

    // 语义化颜色
    semantic: {
      success: '#10B981',  // 绿色 (成功/涨)
      warning: '#F59E0B',  // 橙色 (警告)
      error: '#EF4444',    // 红色 (错误/跌)
      info: '#0EA5E9',     // 使用主天空蓝色 (信息)
    },

    // 渐变色系
    gradients: {
      primary: ['#0EA5E9', '#0284C7'],           // 主天空蓝渐变
      hero: ['#0EA5E9', '#38BDF8', '#7DD3FC'],   // 首页英雄区渐变
      success: ['#10B981', '#34D399'],           // 成功渐变
      warning: ['#F59E0B', '#FBBF24'],           // 警告渐变
      error: ['#EF4444', '#F87171'],             // 错误渐变
    },

    // 市场相关颜色
    market: {
      bullish: '#10B981',    // 绿色 (看涨) - 调暗后的绿色
      bearish: '#EF4444',    // 红色 (看跌)
      neutral: '#6B7280',    // 灰色 (中性)
      volume: '#0EA5E9',     // 天空蓝色 (成交量)
      // 扩展的市场颜色
      success: '#10B981',    // 成功/盈利色 - 与 bullish 保持一致
      danger: '#EF4444',     // 危险/亏损色 - 与 bearish 保持一致
      // 状态相关的浅色背景
      successLight: '#E6F7ED', // 成功色对应的浅色背景
      successBg: '#F0FFF0',    // 更淡的成功色背景
      dangerLight: '#FFE8E8',  // 危险色对应的浅色背景  
      dangerBg: '#FFF5F5',     // 更淡的危险色背景
      neutralLight: '#F1F5F9', // 中性色对应的浅色背景
      neutralBg: '#FAFBFC',    // 更淡的中性色背景
      // 覆盖层颜色
      successOverlay: 'rgba(42, 172, 95, 0.1)', // 成功色覆盖层
      dangerOverlay: 'rgba(255, 68, 68, 0.1)',  // 危险色覆盖层
      neutralOverlay: 'rgba(100, 116, 139, 0.1)', // 中性色覆盖层
    },

    // 背景色系
    background: {
      primary: '#FFFFFF',    // 主背景 (白色)
      secondary: '#F8FAFC',  // 次要背景 (浅灰)
      tertiary: '#F1F5F9',   // 第三背景 (更浅灰)
      surface: '#FFFFFF',    // 表面色 (卡片背景)
      overlay: 'rgba(0, 0, 0, 0.5)', // 遮罩层
    },

    // 文字颜色
    text: {
      primary: '#1F2937',    // 主文字 (深灰)
      secondary: '#6B7280',  // 次要文字 (中灰)
      tertiary: '#9CA3AF',   // 第三文字 (浅灰)
      inverse: '#FFFFFF',    // 反色文字 (白色)
      disabled: '#D1D5DB',   // 禁用文字 (极浅灰)
    },

    // 边框颜色系统
    border: {
      default: '#E5E7EB',   // 默认边框
      light: '#F3F4F6',     // 浅色边框
      dark: '#D1D5DB',      // 深色边框
    },
    
    // 添加缺失的顶级颜色属性
    info: '#0EA5E9',        // 信息颜色
  } as BrandColors,

  // 字体和排版系统
  typography: {
    // 字体大小 (标准比例)
    fontSize: {
      xs: 11,       // 标准小字号
      sm: 12,       // 标准次小字号
      base: 14,     // 标准基础字号
      md: 16,       // 标准中等字号
      lg: 18,       // 标准大字号
      xl: 20,       // 标准超大字号
      '2xl': 24,    // 标准特大字号
      '3xl': 28,    // 标准超特大字号
      '4xl': 32,    // 标准巨大字号
    },

    // 字重系统 (优化跨平台显示)
    fontWeight: {
      light: '300',    // 轻字重
      normal: '400',   // 正常字重
      medium: '500',   // 中等字重 (恢复原值)
      semibold: '600', // 半粗体 (恢复原值)
      bold: '700',     // 粗体 (恢复原值)
      extrabold: '800', // 特粗体 (恢复原值)
      // 数字专用字重 (优化安卓显示)
      numericLight: '400',  // 数字轻字重
      numericMedium: '500', // 数字中等字重
      numericBold: '600',   // 数字粗字重
    },

    // 行高
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },

    // 字间距
    letterSpacing: {
      tight: -0.5,
      normal: 0,
      wide: 0.5,
    },
  } as BrandTypography,

  // 间距系统 (基于 6px 而不是 4px)
  spacing: {
    unit: 6,      // 基础单位
    xs: 6,        // 6px
    sm: 12,       // 12px
    md: 18,       // 18px
    lg: 24,       // 24px
    xl: 30,       // 30px
    xxl: 36,      // 36px
    xxxl: 42,     // 42px
  } as BrandSpacing,

  // 圆角系统 (更方正的设计)
  borderRadius: {
    none: 0,
    sm: 4,        // 小圆角 (原 6)
    md: 6,        // 中圆角 (原 8)
    lg: 8,        // 大圆角 (原 12)
    xl: 12,       // 超大圆角 (原 16)
    full: 9999,   // 完全圆角
  } as BrandBorderRadius,

  // 阴影系统
  shadow: {
    sm: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  } as BrandShadow,

  // 设计令牌
  tokens: {
    // 卡片设计令牌
    card: {
      backgroundColor: '#FFFFFF',
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: '#0EA5E9',
      padding: 18,
      marginBottom: 12,
      shadowColor: '#0EA5E9',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },

    // 按钮设计令牌
    button: {
      primary: {
        backgroundColor: '#0EA5E9',
        borderRadius: 8,
        paddingHorizontal: 30,
        paddingVertical: 18,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
      secondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#0EA5E9',
        borderRadius: 8,
        paddingHorizontal: 28,
        paddingVertical: 16,
      },
      text: {
        backgroundColor: 'transparent',
        paddingHorizontal: 18,
        paddingVertical: 12,
      },
    },

    // 输入框设计令牌
    input: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      paddingHorizontal: 18,
      paddingVertical: 15,
      fontSize: 15,
      color: '#1F2937',
    },

    // 导航设计令牌
    navigation: {
      backgroundColor: '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      height: 84,
      paddingBottom: 8,
      activeTintColor: '#0EA5E9',
      inactiveTintColor: '#9CA3AF',
    },

    // 头部设计令牌
    header: {
      backgroundColor: '#0EA5E9',
      shadowOpacity: 0,
      elevation: 0,
      titleColor: '#FFFFFF',
      titleFontSize: 18,
      titleFontWeight: '700',
    },
  },
} as const;

/**
 * 颜色替换映射表
 * 用于从旧的紫色系统迁移到新的天空蓝色系统
 */
export const ColorMigrationMap = {
  // 主色替换
  '#6366F1': MarketNewsBrand.colors.primary[400], // 紫色 -> 主天空蓝
  '#4F46E5': MarketNewsBrand.colors.primary[500], // 深紫色 -> 深天空蓝
  '#4338CA': MarketNewsBrand.colors.primary[600], // 更深紫色 -> 更深天空蓝
  
  // 渐变色替换
  'linear-gradient(135deg, #6366F1, #4F46E5)': `linear-gradient(135deg, ${MarketNewsBrand.colors.primary[400]}, ${MarketNewsBrand.colors.primary[500]})`,
  
  // 语义化颜色保持不变
  '#10B981': MarketNewsBrand.colors.semantic.success, // 绿色保持
  '#EF4444': MarketNewsBrand.colors.semantic.error,   // 红色保持
  '#F59E0B': MarketNewsBrand.colors.semantic.warning, // 橙色保持
} as const;

/**
 * 获取品牌颜色的辅助函数
 */
export const getBrandColor = (colorPath: string): string => {
  const paths = colorPath.split('.');
  let color: any = MarketNewsBrand.colors;
  
  for (const path of paths) {
    color = color[path];
    if (!color) {
      console.warn(`Brand color path "${colorPath}" not found`);
      return MarketNewsBrand.colors.primary[400]; // 返回默认主色
    }
  }
  
  return color;
};

/**
 * 获取品牌间距的辅助函数
 */
export const getBrandSpacing = (size: keyof BrandSpacing): number => {
  return MarketNewsBrand.spacing[size];
};

/**
 * 获取品牌字体大小的辅助函数
 */
export const getBrandFontSize = (size: keyof BrandTypography['fontSize']): number => {
  return MarketNewsBrand.typography.fontSize[size];
};

/**
 * 获取品牌圆角的辅助函数
 */
export const getBrandBorderRadius = (size: keyof BrandBorderRadius): number => {
  return MarketNewsBrand.borderRadius[size];
};

/**
 * 获取跨平台优化的字重
 * 安卓系统字重显示通常比iOS更重，需要调整
 */
export const getCrossPlatformFontWeight = (weight: keyof BrandTypography['fontWeight']) => {
  return MarketNewsBrand.typography.fontWeight[weight];
};

/**
 * 获取数字显示专用字重
 * 优化数字在不同平台上的显示效果
 */
export const getNumericFontWeight = (level: 'light' | 'medium' | 'bold' = 'medium') => {
  const weightMap = {
    light: MarketNewsBrand.typography.fontWeight.numericLight,
    medium: MarketNewsBrand.typography.fontWeight.numericMedium,
    bold: MarketNewsBrand.typography.fontWeight.numericBold,
  };
  return weightMap[level];
};

/**
 * 创建品牌样式的辅助函数
 */
export const createBrandStyle = (styleConfig: any) => {
  return {
    ...styleConfig,
    // 自动应用品牌色彩
    backgroundColor: styleConfig.backgroundColor || MarketNewsBrand.colors.background.primary,
    color: styleConfig.color || MarketNewsBrand.colors.text.primary,
    // 自动应用品牌间距
    padding: styleConfig.padding || MarketNewsBrand.spacing.md,
    margin: styleConfig.margin || MarketNewsBrand.spacing.sm,
    // 自动应用品牌圆角
    borderRadius: styleConfig.borderRadius || MarketNewsBrand.borderRadius.md,
  };
};

/**
 * 导出默认品牌配置
 */
export default MarketNewsBrand;