import { Platform, StyleSheet } from 'react-native';
import { MarketNewsBrand } from '@/config/brand';

/**
 * 平台特定的样式工具
 * 主要解决安卓设备顶部间距问题
 */

export const PlatformStyles = {
  /**
   * 页面容器的通用样式
   */
  pageContainer: {
    flex: 1,
    backgroundColor: '#fff',
    ...Platform.select({
      android: {
        paddingTop: 10, // 安卓额外顶部间距
      }
    })
  },

  /**
   * 头部区域样式
   */
  headerStyle: {
    backgroundColor: MarketNewsBrand.colors.background.secondary,
    shadowOpacity: 0,
    elevation: 0,
    borderBottomWidth: 0,
    ...Platform.select({
      android: {
        height: 70,
        paddingTop: 15,
      }
    })
  },

  /**
   * 内容区域样式
   */
  contentStyle: {
    ...Platform.select({
      android: {
        paddingTop: 20, // 安卓内容区域额外顶部间距
      }
    })
  },

  /**
   * 安全区域样式
   */
  safeAreaStyle: {
    flex: 1,
    ...Platform.select({
      android: {
        paddingTop: 25, // 安卓状态栏高度补偿
      }
    })
  },

  /**
   * Modal 样式调整
   */
  modalStyle: {
    ...Platform.select({
      android: {
        marginTop: 25, // 安卓模态框顶部间距
      }
    })
  }
};

/**
 * 获取安卓平台专用的顶部间距
 */
export const getAndroidTopPadding = (defaultPadding: number = 0): number => {
  return Platform.OS === 'android' ? defaultPadding + 15 : defaultPadding;
};

/**
 * 获取平台特定的头部高度
 */
export const getHeaderHeight = (): number => {
  return Platform.OS === 'android' ? 70 : 56;
};

/**
 * 创建带平台调整的样式
 */
export const createPlatformStyle = (baseStyle: any) => {
  return StyleSheet.create({
    ...baseStyle,
    container: {
      ...baseStyle.container,
      ...PlatformStyles.pageContainer,
    },
  });
}; 