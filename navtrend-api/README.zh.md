# navtrend-api

> MarketNews 后端 API 服务 — 基于 **Hono** 框架，部署在 **Cloudflare Workers** 边缘节点，使用 **D1**（SQLite）持久化存储，**KV** 缓存行情数据。

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![Hono](https://img.shields.io/badge/Hono-4.x-red)](https://hono.dev)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)

**行情数据由 [tradingviewapi.com](https://www.tradingviewapi.com/) 提供**

**语言：** [English](./README.md) | 中文

---

## 技术栈

| 层级 | 技术 |
|---|---|
| 运行时 | Cloudflare Workers |
| Web 框架 | Hono |
| 数据库 | Cloudflare D1（SQLite） |
| 缓存 | Cloudflare KV |
| ORM | Drizzle ORM |
| 用户认证 | Clerk（JWT + HMAC-SHA256） |
| 行情数据 | TradingView API via [tradingviewapi.com](https://www.tradingviewapi.com/)（RapidAPI） |
| 测试 | Vitest + Miniflare |
| 语言 | TypeScript |

---

## 前置条件

- Node.js >= 18.0.0
- [Cloudflare 账号](https://cloudflare.com)（免费套餐即可）
- [Clerk 账号](https://clerk.com)，并创建应用
- [RapidAPI 账号](https://rapidapi.com/hypier/api/tradingview-data1)，订阅 [TradingView API](https://www.tradingviewapi.com/)
- 安装 Wrangler CLI：

```bash
npm install -g wrangler
wrangler login
```

---

## 本地开发

### 1. 安装依赖

```bash
cd navtrend-api
npm install
```

### 2. 配置环境变量

复制示例文件并填入实际值：

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`：

```ini
RAPIDAPI_KEY=your_rapidapi_key_here
JWT_SECRET=your_jwt_secret_here
API_SECRET_KEY=your_api_secret_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

各变量获取方式见下方[环境变量说明](#环境变量说明)。

> **注意**：`.dev.vars` 仅用于本地开发，绝对不能提交到 Git 仓库。

### 3. 初始化本地数据库

```bash
npm run db:migrate:local
```

### 4. 启动开发服务器

```bash
npm run dev
# 服务运行在 http://localhost:8787
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 | 获取方式 |
|---|---|---|---|
| `RAPIDAPI_KEY` | **是** | TradingView 行情数据 API Key | 登录 [rapidapi.com](https://rapidapi.com/hypier/api/tradingview-data1)，订阅 [TradingView API](https://www.tradingviewapi.com/) |
| `CLERK_SECRET_KEY` | **是** | Clerk 后端密钥，用于 JWT 验证 | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |
| `API_SECRET_KEY` | **是** | App 与 API 之间的 HMAC-SHA256 共享密钥 | 自行生成：`openssl rand -hex 32` |
| `JWT_SECRET` | **是** | 内部 JWT 签名密钥 | 自行生成：`openssl rand -base64 64` |

**生产环境**请通过 Wrangler 设置 Secrets，不要写入 `wrangler.jsonc`：

```bash
wrangler secret put RAPIDAPI_KEY
wrangler secret put CLERK_SECRET_KEY
wrangler secret put API_SECRET_KEY
wrangler secret put JWT_SECRET
```

---

## Cloudflare 资源创建

部署前，需要在 Cloudflare 账号下创建 **D1 数据库** 和 **KV 命名空间**。

### 创建 D1 数据库

```bash
wrangler d1 create navtrend-db
```

将输出的 `database_id` 填入 `wrangler.jsonc`：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "navtrend-db",
    "database_id": "替换为你的 database_id"   // <-- 修改这里
  }
]
```

### 创建 KV 命名空间

```bash
# 生产环境 KV
wrangler kv:namespace create CACHE

# 预览环境 KV（本地开发用）
wrangler kv:namespace create CACHE --preview
```

将输出的 `id` 填入 `wrangler.jsonc`：

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE",
    "id": "替换为你的 KV id",              // <-- 修改这里
    "preview_id": "替换为你的 preview id"  // <-- 修改这里
  }
]
```

---

## 数据库迁移

```bash
# 根据 schema 变更生成迁移文件
npm run db:generate

# 执行本地 D1 迁移
npm run db:migrate:local

# 执行远程（生产环境）D1 迁移
npx wrangler d1 migrations apply navtrend-db --remote

# 打开 Drizzle Studio（可视化本地数据库）
npm run db:studio
```

**数据表说明**（`src/db/schema.ts`）：

| 表名 | 说明 |
|---|---|
| `users` | 用户基本信息、语言、时区、推送通知设置 |
| `portfolios` | 用户持股（股票代码、数量、均价） |
| `watchlists` | 用户自选股列表 |

---

## 部署

### 部署到开发环境

```bash
npm run deploy:dev
```

### 部署到生产环境

```bash
npm run deploy:prod
```

> 生产部署前请确保已通过 `wrangler secret put` 设置所有密钥。

---

## API 路由一览

所有路由以 `/api/v1/` 为前缀。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET/POST` | `/auth/*` | 认证相关接口 |
| `GET/POST` | `/portfolio/*` | 持仓管理 |
| `GET/POST` | `/watchlist/*` | 自选股管理 |
| `GET` | `/tv/analysis` | TradingView 技术分析 |
| `GET` | `/tv/news` | 市场新闻 |
| `GET` | `/tv/leaderboard` | 市场排行榜 |
| `WS` | `/tv/websocket` | 实时行情 WebSocket |
| `GET` | `/update` | App 版本更新检查 |

---

## 认证架构

移动端每次请求都携带 `X-API-Signature` 请求头，该签名使用 `API_SECRET_KEY` 通过 HMAC-SHA256 计算得出。中间件在处理请求前验证签名。

用户身份通过 `Authorization: Bearer <token>` 中的 Clerk JWT 令牌确认。

```
请求 → HMAC 签名校验 → Clerk JWT 验证 → 路由处理器
```

---

## 测试

```bash
npm run test              # 全部测试
npm run test:unit         # 仅单元测试
npm run test:integration  # 仅集成测试
npm run test:e2e          # 仅 E2E 测试
npm run test:coverage     # 覆盖率报告

# 运行单个测试文件
npx vitest run __tests__/unit/your.test.ts

# 监听模式
npm run test:watch
```

---

## 代码检查

```bash
npm run lint        # 检查问题
npm run lint:fix    # 自动修复
```

---

## 项目结构

```
navtrend-api/
├── src/
│   ├── index.ts          # 应用入口 — Hono 初始化、中间件、路由挂载
│   ├── routes/           # 路由处理器（每个业务域一个文件）
│   ├── services/         # 业务逻辑；factory.ts 提供依赖注入容器
│   ├── middleware/       # servicesMiddleware（DI）、apiAuthMiddleware（HMAC）
│   ├── db/
│   │   └── schema.ts     # Drizzle ORM 表定义
│   ├── config/           # 应用配置
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── __tests__/            # 单元 / 集成 / E2E 测试
├── drizzle/              # 自动生成的迁移文件
├── wrangler.jsonc        # Cloudflare Workers 配置
├── drizzle.config.ts     # Drizzle ORM 配置
└── .dev.vars.example     # 环境变量模板
```
