# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two projects:
- **`navtrend-api/`** — Cloudflare Workers backend API (Hono + Drizzle ORM + D1)
- **`navtrend-lite/`** — React Native mobile app (Expo Router + Zustand + Clerk)

## navtrend-api (Backend)

### Commands
```bash
cd navtrend-api

npm run dev              # Local dev server (port 8787)
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix lint issues

# Testing
npm run test             # All tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e         # E2E tests only
npm run test:coverage    # Coverage report
# Run a single test file:
npx vitest run __tests__/unit/some.test.ts

# Database (Drizzle + D1)
npm run db:generate      # Generate migration files
npm run db:migrate:local # Apply migrations locally
npm run db:studio        # Open Drizzle Studio GUI

# Deployment
npm run deploy:dev       # Deploy to dev environment
npm run deploy:prod      # Deploy to production
```

### Architecture

**Request flow**: Routes → Services → Middleware → DB (Drizzle ORM + D1 SQLite)

- `src/index.ts` — Hono app entry, mounts all routes
- `src/routes/` — Route handlers (auth, portfolio, watchlist, tv-analysis, tv-news, tv-leaderboard, tv-websocket, update)
- `src/services/` — Business logic layer; `factory.ts` handles dependency injection
- `src/middleware/` — `servicesMiddleware` injects service factory into context; `apiAuthMiddleware` validates HMAC-SHA256 signatures
- `src/db/schema.ts` — Drizzle schema for `users`, `portfolios`, `watchlists` tables
- `__tests__/` — Vitest tests split by unit/integration/e2e; uses Miniflare for Workers environment

**Auth**: Clerk JWT verification on backend; API requests from mobile require `X-API-Signature` HMAC-SHA256 header.

**Config files**: `wrangler.jsonc` (Workers config), `drizzle.config.ts` (ORM), `vitest.config.ts`, `.dev.vars` (local env vars)

## navtrend-lite (Mobile App)

### Commands
```bash
cd navtrend-lite

npm start                # Start Expo Metro bundler
npm run start:clean     # Start with cache cleared
npm run web             # Web preview
npm run ios             # Run on iOS simulator
npm run android         # Run on Android emulator
npm run lint            # ESLint check

# EAS builds
npm run build:ios                 # iOS EAS build
npm run build:android             # Android EAS build
npm run build:production:ios      # Production iOS build
npm run build:production:android  # Production Android build
```

### Architecture

**Routing**: Expo Router v6 (file-system based). `app/` maps directly to routes. Bottom tabs live in `app/(tabs)/`.

**Service layers** (strict dependency order, do not import upward):
- Layer 0 `services/core/` — API client, base infrastructure
- Layer 1 `services/auth/` — Clerk auth
- Layer 2 `services/system/` — System-level services
- Layer 3 `services/market/`, `services/user/`, `services/content/` — Domain services; `services/market/tradingView/` wraps TradingView SDK
- Layer 4 `services/app/` — App-level orchestration

**State**: Zustand stores in `stores/` (auth, user, market, app, content, system). Stores are singletons; services write to stores, components read from them.

**Key directories**:
- `app/` — Screens/pages (Expo Router)
- `components/stock/` — 26+ stock-related UI components
- `types/tradingview/` — TypeScript type definitions for TradingView SDK

**Config files**: `app.config.js` (Expo config, EAS project ID, API URLs, Clerk keys), `eas.json` (build profiles: development/preview/production), `metro.config.js` (path aliases, Hermes optimization)

**Tech**: React 19, React Native 0.81, Expo 54, New Architecture enabled, targets iOS 16+ / Android SDK 35+

## Monorepo Root

```bash
# From root
npm run dev:api     # Start API dev server
npm run dev:app     # Start mobile app
```

Environment requirements: Node >= 18.0.0, npm >= 9.0.0
