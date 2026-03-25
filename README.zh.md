# MarketNews — NavTrend

> **完整的、可自托管的股票市场移动应用。**
> 实时行情、TradingView 图表、新闻资讯、持仓管理、自选股——全部开源，支持自行部署上架。

**官网：** [marketrendnews.top](https://marketrendnews.top/) &nbsp;|&nbsp; **行情数据 API：** [tradingviewapi.com](https://www.tradingviewapi.com/)

**语言：** [English](./README.md) | 中文

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18-green)](https://nodejs.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![Expo](https://img.shields.io/badge/Expo-54-black)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev)

---

## 应用截图

| 行情首页 | 股票详情（上涨） | 新闻资讯 | 搜索 |
|:---:|:---:|:---:|:---:|
| ![行情首页](./docs/shots/screen-markets.webp) | ![股票详情上涨](./docs/shots/screen-stock-detail-up.webp) | ![新闻](./docs/shots/screen-news.webp) | ![搜索](./docs/shots/screen-search.webp) |

| 股票详情（下跌） | 股票新闻 | K 线图表 |
|:---:|:---:|:---:|
| ![股票详情下跌](./docs/shots/screen-stock-detail-down.webp) | ![股票新闻](./docs/shots/screen-stock-news.webp) | ![K线图](./docs/shots/screen-chart-candlestick.webp) |

---

## 架构概览

这是一个 **Monorepo**，包含两个独立子项目：

```
navtrend-expo-app/
├── navtrend-api/      # 后端 — Hono on Cloudflare Workers + D1 + KV
└── navtrend-lite/     # 移动端 — React Native + Expo Router
```

```
移动端 App (Expo)
      │  HTTPS + HMAC-SHA256 签名认证
      ▼
navtrend-api（Cloudflare Workers 边缘节点）
      │
      ├── D1 数据库（SQLite）  — 用户、持仓、自选股
      ├── KV 缓存              — 行情数据缓存
      └── TradingView API      — 实时行情、新闻、图表
             via tradingviewapi.com（RapidAPI）
```

---

## 功能特性

| 功能 | 说明 |
|---|---|
| 实时行情 | 通过 TradingView API 获取实时股价 |
| K 线图表 | 含技术指标的交互式 TradingView 图表 |
| 新闻资讯 | 按股票代码聚合的市场新闻 |
| 持仓管理 | 记录持股数量、均价、盈亏 |
| 自选股 | 多股票自选列表，支持云端同步 |
| 排行榜 | 涨跌幅排行、市场热门榜单 |
| 用户认证 | Clerk OAuth（Apple、Google、邮箱登录） |
| 多语言 | 支持中、英、日、韩、德、印尼、马来语 |

---

## 前置条件

开始之前，请准备以下服务的账号和密钥：

| 服务 | 用途 | 链接 |
|---|---|---|
| [Cloudflare](https://cloudflare.com) | 部署 Workers、D1 数据库、KV 缓存 | 免费套餐可用 |
| [Clerk](https://clerk.com) | 用户认证 | 免费套餐可用 |
| [RapidAPI — TradingView](https://rapidapi.com/hypier/api/tradingview-data1) | 行情数据（实时报价、新闻、图表） | 付费 API，通过 RapidAPI 订阅 |
| [Expo / EAS](https://expo.dev) | 移动端构建与发布 | 免费套餐可用 |
| Apple 开发者 / Google Play | 应用商店上架 | 付费账号 |

**本地工具要求：**

```bash
node >= 18.0.0
npm  >= 9.0.0
wrangler   # Cloudflare Workers CLI
eas-cli    # Expo Application Services CLI
```

安装 CLI 工具：

```bash
npm install -g wrangler eas-cli
```

---

## 快速开始

### 第一步 — 克隆仓库并安装依赖

```bash
git clone https://github.com/your-org/navtrend-expo-app.git
cd navtrend-expo-app

# 安装后端依赖
npm run api:install

# 安装移动端依赖
npm run lite:install
```

### 第二步 — 配置后端 API

```bash
cd navtrend-api
cp .dev.vars.example .dev.vars
# 编辑 .dev.vars，填入 RAPIDAPI_KEY、CLERK_SECRET_KEY 等
```

完整的 Cloudflare 配置和部署说明请查看 **[navtrend-api/README.zh.md](./navtrend-api/README.zh.md)**。

### 第三步 — 配置移动端应用

```bash
cd navtrend-lite
cp .env.example .env
# 编辑 .env，填入 API 地址、CLERK_PUBLISHABLE_KEY 等
```

完整的 EAS 构建和上架说明请查看 **[navtrend-lite/README.zh.md](./navtrend-lite/README.zh.md)**。

### 第四步 — 本地运行

```bash
# 终端 1 — 启动 API 服务（http://localhost:8787）
npm run api:dev

# 终端 2 — 启动移动端（Expo Metro）
npm run lite:dev
```

---

## 子项目文档

| 子项目 | 文档 | 说明 |
|---|---|---|
| `navtrend-api` | [navtrend-api/README.zh.md](./navtrend-api/README.zh.md) | 后端配置、数据库迁移、Cloudflare 部署 |
| `navtrend-lite` | [navtrend-lite/README.zh.md](./navtrend-lite/README.zh.md) | 移动端配置、EAS 构建、应用商店上架 |

---

## 参与贡献

欢迎提交 Pull Request。重大改动请先开 Issue 讨论。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交代码：`git commit -m 'feat: add my feature'`
4. 推送分支：`git push origin feature/my-feature`
5. 发起 Pull Request

---

## 开源协议

[MIT](LICENSE)
