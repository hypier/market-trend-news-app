# navtrend-lite

> MarketNews 移动端应用 — 基于 **React Native**、**Expo Router** 和 **Clerk** 认证。支持 iOS 和 Android，通过 EAS Build 云端编译并发布到 App Store / Google Play。

[![Expo](https://img.shields.io/badge/Expo-54-black)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://typescriptlang.org)

**官网：** [marketrendnews.top](https://marketrendnews.top/)

**语言：** [English](./README.md) | 中文

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | React Native 0.81 + Expo 54 |
| 路由 | Expo Router v6（文件系统路由） |
| 状态管理 | Zustand |
| 用户认证 | Clerk（`@clerk/clerk-expo`） |
| 图表 | TradingView Charts API |
| 数据分析 | PostHog |
| 构建 | EAS Build（Expo Application Services） |
| JS 引擎 | Hermes |
| 架构 | React Native 新架构（已启用） |
| 语言 | TypeScript 5.7 |

---

## 前置条件

- Node.js >= 18.0.0
- 已运行的 **navtrend-api** 实例（参见 [../navtrend-api/README.zh.md](../navtrend-api/README.zh.md)）
- [Clerk 账号](https://clerk.com)——与后端 API 使用同一个应用
- [Expo 账号](https://expo.dev)，已开通 EAS 服务（用于构建）
- App Store 上架需要 Apple 开发者计划会员资格
- Google Play 上架需要 Google Play 开发者账号
- 安装 CLI 工具：

```bash
npm install -g eas-cli
```

---

## 本地开发

### 1. 安装依赖

```bash
cd navtrend-lite
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```ini
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8787/api
EXPO_PUBLIC_API_SECRET_KEY=your_api_secret_key_here
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

> **重要**：`EXPO_PUBLIC_API_BASE_URL` 必须指向你运行的 `navtrend-api` 实例。在真机上测试时，请使用电脑的局域网 IP 地址，`localhost` 在真机上无法访问。

各变量说明见下方[环境变量说明](#环境变量说明)。

### 3. 启动 Metro 打包器

```bash
npm start
# 或清除缓存后启动：
npm run start:clean
```

扫描二维码可用 **Expo Go** 快速预览，或使用 **development build**（需要完整原生功能时推荐）。

### 4. 在模拟器 / 真机上运行

```bash
npm run ios       # iOS 模拟器（仅 macOS）
npm run android   # Android 模拟器
```

### 5. Web 预览（可选）

```bash
npm run web
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 | 获取方式 |
|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | **是** | navtrend-api 服务地址 | 部署后的 Workers URL，或本地 `http://192.168.x.x:8787/api` |
| `EXPO_PUBLIC_API_SECRET_KEY` | **是** | HMAC 共享密钥，必须与 navtrend-api 的 `API_SECRET_KEY` 一致 | 与 `navtrend-api/.dev.vars` 中保持相同 |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | **是** | Clerk 发布密钥（`pk_test_` 或 `pk_live_` 开头） | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |

> 所有 `EXPO_PUBLIC_` 开头的变量会被打包进 App 二进制文件，请勿存放私密信息。

---

## EAS 构建配置

`eas.json` 定义了三个构建配置：

| 配置 | 平台 | 输出格式 | 使用场景 |
|---|---|---|---|
| `development` | iOS + Android | Debug APK / Debug IPA | 开发测试，配合 dev client 使用 |
| `preview` | iOS + Android | Release APK / Release IPA | 内部分发 / QA 测试 |
| `production` | iOS + Android | AAB（Android）/ IPA（iOS） | 提交 App Store / Google Play |

### 初始化 EAS 项目

```bash
# 登录 Expo 账号
eas login

# 关联 EAS 项目（自动更新 eas.json 和 app.config.js）
eas build:configure
```

在 `app.config.js` 中更新你的 EAS 项目 ID：

```js
extra: {
  eas: {
    projectId: "你的 EAS 项目 ID"
  }
}
```

同时更新 Bundle Identifier / Package Name：

```js
ios: {
  bundleIdentifier: "com.yourcompany.yourapp"
},
android: {
  package: "com.yourcompany.yourapp"
}
```

---

## 构建

### 开发构建（含 dev client）

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### 预览构建（内部测试）

```bash
eas build --profile preview --platform all
```

### 生产构建（提交应用商店）

```bash
# iOS — 生成 .ipa 上传 App Store
eas build --profile production --platform ios

# Android — 生成 .aab 上传 Google Play
eas build --profile production --platform android

# 同时构建两个平台
eas build --profile production --platform all
```

或使用 npm 脚本：

```bash
npm run build:production:ios
npm run build:production:android
```

---

## 上架应用商店

### App Store（iOS）

```bash
eas submit --platform ios
```

要求：
- Apple 开发者计划账号
- 在 [App Store Connect](https://appstoreconnect.apple.com) 中已创建应用
- EAS 证书已配置（支持自动管理或手动上传）

### Google Play（Android）

```bash
eas submit --platform android
```

要求：
- Google Play 开发者账号
- 在 [Google Play Console](https://play.google.com/console) 中已创建应用
- EAS 中已配置 Service Account JSON 密钥

---

## 应用配置说明

发布为自己的 App 前，需要修改 `app.config.js` 中的以下字段：

| 字段 | 位置 | 说明 |
|---|---|---|
| `name` | `expo.name` | App 显示名称 |
| `slug` | `expo.slug` | EAS 唯一标识符 |
| `version` | `expo.version` | 版本号字符串 |
| `bundleIdentifier` | `expo.ios.bundleIdentifier` | iOS Bundle ID |
| `package` | `expo.android.package` | Android 包名 |
| `buildNumber` | `expo.ios.buildNumber` | iOS 构建号（每次发版递增） |
| `versionCode` | `expo.android.versionCode` | Android 版本号（每次发版递增） |
| `projectId` | `expo.extra.eas.projectId` | 你的 EAS 项目 ID |

---

## 项目结构

```
navtrend-lite/
├── app/                    # Expo Router 路由（文件即路由）
│   ├── (tabs)/             # 底部标签导航
│   │   ├── trading.tsx     # 交易 / 持仓
│   │   ├── watchlist.tsx   # 自选股
│   │   ├── news.tsx        # 新闻
│   │   ├── wealth.tsx      # 财富
│   │   └── profile.tsx     # 个人资料
│   ├── stock/              # 股票详情页
│   ├── auth/               # 认证流程页
│   └── news-flash/         # 新闻快讯页
│
├── components/             # 可复用 UI 组件
│   ├── ui/                 # 基础 UI 组件
│   ├── stock/              # 股票相关组件
│   ├── portfolio/          # 持仓组件
│   └── ...
│
├── services/               # 业务逻辑（严格分层，禁止反向引用）
│   ├── core/               # Layer 0：API 客户端（基础设施）
│   ├── auth/               # Layer 1：用户认证
│   ├── system/             # Layer 2：系统服务
│   ├── market/             # Layer 3：行情数据 + TradingView SDK
│   ├── user/               # Layer 3：用户数据
│   ├── content/            # Layer 3：内容 / 新闻
│   └── app/                # Layer 4：应用层编排
│
├── stores/                 # Zustand 状态管理（单例）
│   ├── auth/
│   ├── market/
│   ├── user/
│   └── ...
│
├── hooks/                  # 自定义 React Hooks
├── utils/locales/          # 国际化翻译文件（en、zh、ja、ko、de、id、ms）
├── types/                  # TypeScript 类型定义
│   └── tradingview/        # TradingView SDK 类型
│
├── app.config.js           # Expo 应用配置
├── eas.json                # EAS 构建配置
└── .env.example            # 环境变量模板
```

### 服务层规则

服务按层级组织，**高层不可引用低层**，防止循环依赖：

```
Layer 0（core）   ← 仅被 Layer 1+ 引用
Layer 1（auth）   ← 仅被 Layer 2+ 引用
Layer 2（system） ← 仅被 Layer 3+ 引用
Layer 3（market、user、content） ← 仅被 Layer 4 引用
Layer 4（app）    ← 顶层编排，不被任何层引用
```

---

## 代码检查

```bash
npm run lint
```
