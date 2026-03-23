# navtrend-lite

> Mobile application for MarketNews — built with **React Native**, **Expo Router**, and **Clerk** authentication. Supports iOS and Android, with EAS Build for cloud compilation and App Store / Google Play submission.

[![Expo](https://img.shields.io/badge/Expo-54-black)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue)](https://reactnative.dev)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-purple)](https://clerk.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://typescriptlang.org)

**Website:** [marketrendnews.top](https://marketrendnews.top/)

**Language:** English | [中文](./README.zh.md)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 54 |
| Routing | Expo Router v6 (file-system based) |
| State | Zustand |
| Auth | Clerk (`@clerk/clerk-expo`) |
| Charts | TradingView Charts API |
| Analytics | PostHog |
| Build | EAS Build (Expo Application Services) |
| JS Engine | Hermes |
| Architecture | React Native New Architecture (enabled) |
| Language | TypeScript 5.7 |

---

## Prerequisites

- Node.js >= 18.0.0
- A running instance of **navtrend-api** (see [../navtrend-api/README.md](../navtrend-api/README.md))
- A [Clerk account](https://clerk.com) — same app as the API backend
- An [Expo account](https://expo.dev) with EAS enabled (for builds)
- For App Store submission: Apple Developer Program membership
- For Google Play submission: Google Play Developer account
- CLIs installed:

```bash
npm install -g eas-cli
```

---

## Local Development

### 1. Install dependencies

```bash
cd navtrend-lite
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```ini
EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8787/api
EXPO_PUBLIC_API_SECRET_KEY=your_api_secret_key_here
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

> **Important**: `EXPO_PUBLIC_API_BASE_URL` must point to your running `navtrend-api` instance. When testing on a physical device, use your machine's LAN IP — `localhost` will not work on a device.

See the [Environment Variables](#environment-variables) section below for details.

### 3. Start Metro bundler

```bash
npm start
# or, to clear cache first:
npm run start:clean
```

Scan the QR code with **Expo Go** (for quick preview) or use a **development build** (required for full native features).

### 4. Run on simulator / emulator

```bash
npm run ios       # iOS simulator (macOS only)
npm run android   # Android emulator
```

### 5. Web preview (optional)

```bash
npm run web
```

---

## Environment Variables

| Variable | Required | Description | Where to get |
|---|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | **Yes** | Base URL of your navtrend-api instance | Your deployed Workers URL or local `http://192.168.x.x:8787/api` |
| `EXPO_PUBLIC_API_SECRET_KEY` | **Yes** | Shared HMAC secret — must match `API_SECRET_KEY` in navtrend-api | Same value you set in `navtrend-api/.dev.vars` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key (starts with `pk_test_` or `pk_live_`) | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys |

> All `EXPO_PUBLIC_` variables are bundled into the app binary. Do not put secrets here — only values safe to expose to clients.

---

## EAS Configuration

The `eas.json` file defines three build profiles:

| Profile | Platform | Output | Use case |
|---|---|---|---|
| `development` | iOS + Android | Debug APK / Debug IPA | Internal dev testing with dev client |
| `preview` | iOS + Android | Release APK / Release IPA | Internal distribution / QA testing |
| `production` | iOS + Android | AAB (Android) / IPA (iOS) | App Store / Google Play submission |

### Set up EAS project

```bash
# Log in to Expo account
eas login

# Link to your EAS project (updates eas.json and app.config.js)
eas build:configure
```

Update `app.config.js` with your EAS project ID:

```js
extra: {
  eas: {
    projectId: "your-eas-project-id-here"
  }
}
```

Also update the bundle identifiers to match your app:

```js
ios: {
  bundleIdentifier: "com.yourcompany.yourapp"
},
android: {
  package: "com.yourcompany.yourapp"
}
```

---

## Building

### Development build (with dev client)

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Preview build (internal testing)

```bash
eas build --profile preview --platform all
```

### Production build (App Store / Google Play)

```bash
# iOS — produces .ipa for App Store
eas build --profile production --platform ios

# Android — produces .aab for Google Play
eas build --profile production --platform android

# Both platforms at once
eas build --profile production --platform all
```

Or use the npm scripts:

```bash
npm run build:production:ios
npm run build:production:android
```

---

## Submitting to Stores

### App Store (iOS)

```bash
eas submit --platform ios
```

Requirements:
- Apple Developer Program account
- App created in [App Store Connect](https://appstoreconnect.apple.com)
- EAS credentials configured (auto-managed or manual)

### Google Play (Android)

```bash
eas submit --platform android
```

Requirements:
- Google Play Developer account
- App created in [Google Play Console](https://play.google.com/console)
- Service account JSON key configured in EAS

---

## App Configuration

Key fields to update in `app.config.js` before publishing as your own app:

| Field | Location | Description |
|---|---|---|
| `name` | `expo.name` | App display name |
| `slug` | `expo.slug` | Unique EAS slug |
| `version` | `expo.version` | App version string |
| `bundleIdentifier` | `expo.ios.bundleIdentifier` | iOS bundle ID |
| `package` | `expo.android.package` | Android package name |
| `buildNumber` | `expo.ios.buildNumber` | iOS build number (increment each release) |
| `versionCode` | `expo.android.versionCode` | Android version code (increment each release) |
| `projectId` | `expo.extra.eas.projectId` | Your EAS project ID |

---

## Project Structure

```
navtrend-lite/
├── app/                    # Expo Router screens (file = route)
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── trading.tsx     # Portfolio / Trading tab
│   │   ├── watchlist.tsx   # Watchlist tab
│   │   ├── news.tsx        # News tab
│   │   ├── wealth.tsx      # Wealth tab
│   │   └── profile.tsx     # Profile tab
│   ├── stock/              # Stock detail screens
│   ├── auth/               # Auth flow screens
│   └── news-flash/         # News flash screens
│
├── components/             # Reusable UI components
│   ├── ui/                 # Base UI components
│   ├── stock/              # Stock-related components
│   ├── portfolio/          # Portfolio components
│   └── ...
│
├── services/               # Business logic — strict layer ordering
│   ├── core/               # Layer 0: API client (base infrastructure)
│   ├── auth/               # Layer 1: Authentication
│   ├── system/             # Layer 2: System services
│   ├── market/             # Layer 3: Market data + TradingView SDK
│   ├── user/               # Layer 3: User data
│   ├── content/            # Layer 3: Content/news
│   └── app/                # Layer 4: App-level orchestration
│
├── stores/                 # Zustand state stores (singletons)
│   ├── auth/
│   ├── market/
│   ├── user/
│   └── ...
│
├── hooks/                  # Custom React hooks
├── utils/locales/          # i18n translations (en, zh, ja, ko, de, id, ms)
├── types/                  # TypeScript type definitions
│   └── tradingview/        # TradingView SDK types
│
├── app.config.js           # Expo app configuration
├── eas.json                # EAS build profiles
└── .env.example            # Environment variable template
```

### Service Layer Rules

Services are organized into layers. **Higher-numbered layers may NOT import from lower-numbered layers.** This prevents circular dependencies.

```
Layer 0 (core)   ← only imported by layer 1+
Layer 1 (auth)   ← only imported by layer 2+
Layer 2 (system) ← only imported by layer 3+
Layer 3 (market, user, content) ← only imported by layer 4
Layer 4 (app)    ← top-level orchestration
```

---

## Linting

```bash
npm run lint
```
