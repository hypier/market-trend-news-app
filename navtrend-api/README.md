# navtrend-api

> Backend API for MarketNews — built on **Hono**, deployed on **Cloudflare Workers**, with **D1** (SQLite) for persistence and **KV** for caching.

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com)
[![Hono](https://img.shields.io/badge/Hono-4.x-red)](https://hono.dev)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)](https://orm.drizzle.team)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)

**Market Data powered by [tradingviewapi.com](https://www.tradingviewapi.com/)**

**Language:** English | [中文](./README.zh.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Cloudflare Workers |
| Framework | Hono |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV |
| ORM | Drizzle ORM |
| Auth | Clerk (JWT + HMAC-SHA256) |
| Market Data | TradingView API via [tradingviewapi.com](https://www.tradingviewapi.com/) (RapidAPI) |
| Testing | Vitest + Miniflare |
| Language | TypeScript |

---

## Prerequisites

- Node.js >= 18.0.0
- A [Cloudflare account](https://cloudflare.com) (free tier works)
- A [Clerk account](https://clerk.com) and application
- A [RapidAPI account](https://rapidapi.com/hypier/api/tradingview-data1) with access to [TradingView API](https://www.tradingviewapi.com/)
- Wrangler CLI installed:

```bash
npm install -g wrangler
wrangler login
```

---

## Local Development

### 1. Install dependencies

```bash
cd navtrend-api
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:

```ini
RAPIDAPI_KEY=your_rapidapi_key_here
JWT_SECRET=your_jwt_secret_here
API_SECRET_KEY=your_api_secret_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

See the [Environment Variables](#environment-variables) section below for details on each variable.

> **Note**: `.dev.vars` is for local development only and must never be committed to git.

### 3. Set up local database

```bash
# Initialize the local D1 database and run migrations
npm run db:migrate:local
```

### 4. Start the development server

```bash
npm run dev
# Server runs at http://localhost:8787
```

---

## Environment Variables

| Variable | Required | Description | Where to get |
|---|---|---|---|
| `RAPIDAPI_KEY` | **Yes** | API key for TradingView market data | [rapidapi.com](https://rapidapi.com/hypier/api/tradingview-data1) → subscribe to [TradingView API](https://www.tradingviewapi.com/) |
| `CLERK_SECRET_KEY` | **Yes** | Clerk backend secret key for JWT verification | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |
| `API_SECRET_KEY` | **Yes** | Shared secret for HMAC-SHA256 request signing between app and API | Generate with: `openssl rand -hex 32` |
| `JWT_SECRET` | **Yes** | Secret for internal JWT signing | Generate with: `openssl rand -base64 64` |

**For production**, set these as Cloudflare Workers secrets (never in `wrangler.jsonc`):

```bash
wrangler secret put RAPIDAPI_KEY
wrangler secret put CLERK_SECRET_KEY
wrangler secret put API_SECRET_KEY
wrangler secret put JWT_SECRET
```

---

## Cloudflare Resources Setup

Before deploying, you need to create a **D1 database** and a **KV namespace** in your Cloudflare account.

### Create D1 Database

```bash
wrangler d1 create navtrend-db
```

Copy the output `database_id` and update `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "navtrend-db",
    "database_id": "YOUR_DATABASE_ID_HERE"   // <-- replace this
  }
]
```

### Create KV Namespace

```bash
# Production KV
wrangler kv:namespace create CACHE

# Preview KV (for local dev preview)
wrangler kv:namespace create CACHE --preview
```

Copy the output `id` values and update `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "CACHE",
    "id": "YOUR_KV_ID_HERE",             // <-- replace this
    "preview_id": "YOUR_KV_PREVIEW_ID"   // <-- replace this
  }
]
```

---

## Database Migrations

```bash
# Generate migration files from schema changes
npm run db:generate

# Apply migrations to local D1
npm run db:migrate:local

# Apply migrations to remote (production) D1
npx wrangler d1 migrations apply navtrend-db --remote

# Open Drizzle Studio (local DB GUI)
npm run db:studio
```

**Schema overview** (`src/db/schema.ts`):

| Table | Description |
|---|---|
| `users` | User profile, language, timezone, push notification settings |
| `portfolios` | User stock holdings (symbol, shares, average cost) |
| `watchlists` | User watchlist symbols |

---

## Deployment

### Deploy to development environment

```bash
npm run deploy:dev
```

### Deploy to production

```bash
npm run deploy:prod
```

> Make sure you have set all secrets via `wrangler secret put` before deploying to production.

---

## API Routes

All routes are prefixed with `/api/v1/`.

| Method | Path | Description |
|---|---|---|
| `GET/POST` | `/auth/*` | Authentication endpoints |
| `GET/POST` | `/portfolio/*` | Portfolio management (holdings) |
| `GET/POST` | `/watchlist/*` | Watchlist management |
| `GET` | `/tv/analysis` | TradingView technical analysis |
| `GET` | `/tv/news` | Market news feed |
| `GET` | `/tv/leaderboard` | Market leaderboard / movers |
| `WS` | `/tv/websocket` | Real-time quote WebSocket |
| `GET` | `/update` | App version update check |

---

## Auth Architecture

Every request from the mobile app includes an `X-API-Signature` header — an HMAC-SHA256 signature computed using `API_SECRET_KEY`. The middleware validates this signature before processing.

User identity is established via Clerk JWT tokens in the `Authorization: Bearer <token>` header.

```
Request → HMAC Signature Check → Clerk JWT Verify → Route Handler
```

---

## Testing

```bash
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # E2E tests only
npm run test:coverage     # Coverage report

# Run a single test file
npx vitest run __tests__/unit/your.test.ts

# Watch mode
npm run test:watch
```

---

## Linting

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

---

## Project Structure

```
navtrend-api/
├── src/
│   ├── index.ts          # App entry — Hono setup, middleware, route mounting
│   ├── routes/           # Route handlers (one file per domain)
│   ├── services/         # Business logic; factory.ts provides DI container
│   ├── middleware/       # servicesMiddleware (DI), apiAuthMiddleware (HMAC)
│   ├── db/
│   │   └── schema.ts     # Drizzle ORM table definitions
│   ├── config/           # App configuration
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Shared utilities
├── __tests__/            # unit / integration / e2e
├── drizzle/              # Generated migration files
├── wrangler.jsonc        # Cloudflare Workers configuration
├── drizzle.config.ts     # Drizzle ORM configuration
└── .dev.vars.example     # Environment variable template
```
