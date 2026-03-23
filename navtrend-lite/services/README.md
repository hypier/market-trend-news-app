# Services 目录

NavTrend Lite 应用的服务层，按功能分类组织，采用单例模式架构。

## 📁 目录结构

```
services/
├── core/              # Layer 0: 核心基础设施
│   ├── api.ts         # API 客户端
│   └── index.ts       
├── auth/              # Layer 1: 认证授权
│   ├── authService.ts
│   ├── clerkService.ts
│   ├── attService.ts
│   ├── networkAwareATTService.ts
│   └── index.ts
├── system/            # Layer 2: 系统服务
│   ├── analyticsService.ts
│   ├── initializationService.ts
│   ├── startupService.ts
│   └── index.ts
├── market/            # Layer 3: 市场数据服务
│   ├── tradingView/
│   │   ├── tradingViewService.ts
│   │   ├── tradingViewWebSocket.ts
│   │   └── index.ts
│   ├── searchService.ts
│   ├── exchangeRateService.ts
│   ├── technicalAnalysisService.ts
│   ├── leaderboardService.ts
│   └── index.ts
├── user/              # Layer 3: 用户数据服务
│   ├── portfolioService.ts
│   ├── watchlistService.ts
│   └── index.ts
├── content/           # Layer 3: 内容服务
│   ├── newsService.ts
│   └── index.ts
├── app/               # Layer 4: 应用管理
│   ├── updateService.ts
│   ├── versionCompareService.ts
│   └── index.ts
├── index.ts           # 统一导出
└── README.md          # 本文件
```

## 🏗️ 架构原则

### 单例模式

所有服务采用单例模式，每个服务导出：
- `export class ServiceName` - 类定义（用于类型引用）
- `export const serviceName = new ServiceName()` - 单例实例
- `export default serviceName` - 默认导出

**示例**（参考 `watchlistService.ts`）：
```typescript
export class WatchlistService {
  private someProperty: string;
  
  constructor() {
    this.someProperty = 'initial';
  }
  
  async fetchData(params: any): Promise<any> {
    // 业务逻辑
  }
}

// 导出单例实例
export const watchlistService = new WatchlistService();
export default watchlistService;
```

### 层级依赖关系

```
Layer 4: app/          → 应用管理
         ↓
Layer 3: market/      → 业务服务
         user/
         content/
         ↓
Layer 2: system/      → 系统服务
         ↓
Layer 1: auth/        → 认证授权
         ↓
Layer 0: core/        → 核心基础设施
```

**规则**：下层不能依赖上层，避免循环依赖。

## 📦 导入方式

### 推荐方式1：从根目录导入（向后兼容）
```typescript
import { authService, tradingViewService, portfolioService } from '@/services';
```

### 推荐方式2：从子目录导入
```typescript
import { authService } from '@/services/auth';
import { tradingViewService } from '@/services/market/tradingView';
```

### 方式3：直接导入文件
```typescript
import authService from '@/services/auth/authService';
import tradingViewService from '@/services/market/tradingView/tradingViewService';
```

## 🔧 使用示例

### 调用服务方法

```typescript
// ✅ 正确：使用实例方法
import { tradingViewService } from '@/services';

const quote = await tradingViewService.getQuote('NASDAQ:AAPL');
const history = await tradingViewService.getHistory('NASDAQ:AAPL', '1day', 30);
```

```typescript
// ❌ 错误：不要使用类的静态方法
import { TradingViewService } from '@/services';

const quote = await TradingViewService.getQuote('NASDAQ:AAPL'); // 错误！
```

### 在 Store 中使用

```typescript
import { create } from 'zustand';
import { tradingViewService } from '@/services/market/tradingView';

export const useStockStore = create((set) => ({
  quote: null,
  
  fetchQuote: async (symbol: string) => {
    const quote = await tradingViewService.getQuote(symbol);
    set({ quote });
  },
}));
```

## 📝 服务功能说明

### Core（核心基础设施）
- **apiClient**: HTTP 请求客户端，统一处理 API 调用、认证、超时、重试

### Auth（认证授权）
- **authService**: JWT 认证、用户登录登出
- **clerkService**: Clerk 集成服务
- **attService**: iOS ATT 权限管理
- **networkAwareATTService**: 网络感知的 ATT 权限请求

### System（系统服务）
- **analyticsService**: 应用分析追踪（PostHog、Firebase）
- **initializationService**: 应用初始化流程
- **startupService**: 启动配置管理

### Market（市场数据）
- **tradingViewService**: TradingView HTTP API，获取股票报价、历史数据
- **tradingViewWebSocket**: TradingView WebSocket，实时数据订阅
- **searchService**: 股票搜索服务
- **exchangeRateService**: 汇率转换服务
- **technicalAnalysisService**: 技术分析服务
- **leaderboardService**: 排行榜服务

### User（用户数据）
- **portfolioService**: 投资组合管理
- **watchlistService**: 关注列表管理

### Content（内容）
- **newsService**: 通用新闻服务

### App（应用管理）
- **updateService**: 应用更新检查
- **versionCompareService**: 版本比较工具

## 🔄 迁移指南

### 从静态方法迁移到实例方法

**之前**：
```typescript
import { TradingViewService } from '@/services';

const quote = await TradingViewService.getQuote(symbol);
```

**之后**：
```typescript
import { tradingViewService } from '@/services';

const quote = await tradingViewService.getQuote(symbol);
```

### 从旧路径迁移到新路径

**之前**：
```typescript
import { authService } from '@/services/authService';
import { tradingViewService } from '@/services/tradingViewService';
```

**之后**：
```typescript
import { authService } from '@/services/auth/authService';
import { tradingViewService } from '@/services/market/tradingView/tradingViewService';
```

或使用根目录导入（推荐）：
```typescript
import { authService, tradingViewService } from '@/services';
```

## ⚠️ 注意事项

1. **单例模式**：所有服务使用单例模式，状态全局共享
2. **避免循环依赖**：遵循层级依赖关系，必要时使用动态导入
3. **实例方法**：所有方法都是实例方法，不是静态方法
4. **类型引用**：需要类型时导入类名，需要实例时导入实例名

## 🧪 测试

运行 TypeScript 编译检查：
```bash
npx tsc --noEmit
```

## 📚 参考

- 单例模式参考：`services/user/watchlistService.ts`
- 完整重构文档：`openspec/changes/refactor-services-stores-structure/`

