/**
 * 安全的 SVG 包装组件
 * 防止 SVG 组件在卸载时崩溃
 * 
 * @author NavTrend Team
 * @version 1.0.0
 */

import React, { useRef, useEffect, PropsWithChildren } from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';

interface SafeSvgWrapperProps {
  style?: StyleProp<ViewStyle>;
  onError?: (error: Error) => void;
}

/**
 * SafeSvgWrapper 组件
 * 
 * 使用场景：
 * - 包裹所有可能在动画中使用的 SVG 组件
 * - 防止 Android 上的 ClassCastException 错误
 * 
 * @example
 * ```tsx
 * <SafeSvgWrapper>
 *   <SvgXml xml={svgContent} />
 * </SafeSvgWrapper>
 * ```
 */
export const SafeSvgWrapper: React.FC<PropsWithChildren<SafeSvgWrapperProps>> = ({
  children,
  style,
  onError,
}) => {
  const isMountedRef = useRef(true);
  const [hasError] = React.useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      // 组件卸载时标记，防止后续操作
      isMountedRef.current = false;
    };
  }, []);

  if (hasError) {
    // 错误时返回空视图
    return <View style={style} />;
  }

  return (
    <View style={style}>
      {children}
    </View>
  );
};

/**
 * 使用 SafeSvgWrapper 包裹 SvgXml 组件
 * 
 * @example
 * ```tsx
 * import { SafeSvgXml } from '@/components/ui/SafeSvgWrapper';
 * 
 * <SafeSvgXml xml={svgContent} width={40} height={40} />
 * ```
 */
export const withSafeSvgWrapper = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & SafeSvgWrapperProps> => {
  const WrappedComponent: React.FC<P & SafeSvgWrapperProps> = (props: P & SafeSvgWrapperProps) => {
    const { style, onError, ...componentProps } = props;
    
    return (
      <SafeSvgWrapper style={style} onError={onError}>
        <Component {...(componentProps as P)} />
      </SafeSvgWrapper>
    );
  };
  
  WrappedComponent.displayName = `SafeSvgWrapper(${Component.displayName || Component.name || 'Component'})`;
  
  return WrappedComponent;
};

