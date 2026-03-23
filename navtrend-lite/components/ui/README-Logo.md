# Logo 组件使用指南

MarketNews 应用的统一 Logo 组件，基于提供的 SVG 设计实现。

## 特性

- 🎨 支持 SVG 矢量图形，任意缩放不失真
- 📐 多种尺寸预设 (small, medium, large) 和自定义尺寸
- 🎭 三种显示变体 (icon, text, full)
- 🌈 可自定义颜色主题
- ⚡ 高性能渲染，支持缓存

## 快速开始

```tsx
import { Logo } from '@/components/ui';

// 基础用法
<Logo />

// 不同尺寸
<Logo size="small" />   // 24px
<Logo size="medium" />  // 32px (默认)
<Logo size="large" />   // 48px
<Logo size={64} />      // 自定义尺寸

// 不同变体
<Logo variant="icon" />  // 仅图标
<Logo variant="text" />  // 仅文字
<Logo variant="full" />  // 图标+文字 (默认)
```

## Props 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `size` | `'small' \| 'medium' \| 'large' \| number` | `'medium'` | Logo 尺寸 |
| `variant` | `'full' \| 'icon' \| 'text'` | `'full'` | 显示变体 |
| `color` | `string` | `'#33D49D'` | Logo 主色调 |
| `textColor` | `string` | `'#333'` | 文字颜色 |
| `showText` | `boolean` | `true` | 是否显示文字 (仅在 full 变体中有效) |

## 使用场景

### 1. 导航栏 Logo
```tsx
// 适合在 Tab 导航栏中使用
<Logo size="small" variant="full" />
```

### 2. 启动屏幕
```tsx
// 大尺寸的品牌展示
<Logo size={80} variant="icon" />
```

### 3. 登录页面
```tsx
// 中等尺寸的品牌标识
<Logo size={48} variant="icon" />
```

### 4. 页面标题
```tsx
// 仅显示文字品牌
<Logo variant="text" size="large" />
```

## 尺寸参考

| 尺寸 | 像素值 | 适用场景 |
|------|--------|----------|
| `small` | 24px | 导航栏、列表图标 |
| `medium` | 32px | 按钮、卡片 |
| `large` | 48px | 页面标题、表单 |
| 自定义 | 任意 | 启动屏幕、特殊场景 |

## 颜色主题

### 默认主题
```tsx
<Logo color="#33D49D" textColor="#333" />
```

### 深色主题
```tsx
<Logo color="#33D49D" textColor="#fff" />
```

### 自定义主题
```tsx
<Logo color="#007AFF" textColor="#1a1a1a" />
```

## 最佳实践

### ✅ 推荐做法

1. **导航栏使用小尺寸**
   ```tsx
   <Logo size="small" variant="full" />
   ```

2. **启动屏幕使用图标变体**
   ```tsx
   <Logo size={80} variant="icon" />
   ```

3. **保持颜色一致性**
   ```tsx
   <Logo color="#33D49D" /> // 使用品牌色
   ```

### ❌ 避免做法

1. **不要过度放大**
   ```tsx
   <Logo size={200} /> // 过大会影响性能
   ```

2. **不要使用奇怪的颜色组合**
   ```tsx
   <Logo color="#ff0000" textColor="#00ff00" /> // 色彩冲突
   ```

## 性能优化

- 使用 `react-native-svg` 实现矢量渲染
- 渐变和路径数据经过优化
- 支持 React Native 的原生渲染优化

## 兼容性

- ✅ iOS
- ✅ Android  
- ✅ Web (通过 react-native-web)
- ✅ Expo 开发环境

## 更新历史

- v1.0.0 - 初始版本，基于设计师提供的 SVG
- 支持多种尺寸和变体
- 集成到 MarketNews 应用的各个页面 