import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { swaggerUI } from '@hono/swagger-ui'
import { openAPISpec } from './docs/index'
import type { Env } from './types/env.d'
import { success } from './utils/response'

// 导入所有路由
import authRoutes from './routes/auth.routes'
import updateRoutes from './routes/update.routes'
import watchlistRoutes from './routes/watchlist.routes'
import portfolioRoutes from './routes/portfolio.routes'
import leaderboardRoutes from './routes/tv-leaderboard.routes'
import { tvAnalysisRoutes } from './routes/tv-analysis.routes'
import { tvNewsRoutes } from './routes/tv-news.routes'
import { tvWebSocketRoutes } from './routes/tv-websocket.routes'

// 导入服务工厂
import type { Services } from './services/factory'
import { servicesMiddleware } from './middleware/services.middleware'
import { apiAuthMiddleware } from './middleware/apiAuth.middleware'


// 应用变量类型定义
type AppVariables = {
  userId?: string; // 由鉴权中间件添加
  services: Services; // 服务工厂
}

// 创建应用实例
const app = new Hono<{ Bindings: Env; Variables: AppVariables }>()

// 全局中间件
app.use('*', logger())
app.use('*', prettyJSON())

// CORS中间件
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposeHeaders: ['Content-Length', 'X-Total-Count'],
}))

// 服务中间件 - 使用工厂模式创建所有服务
app.use('*', servicesMiddleware)

// 添加 Swagger UI（根据官方文档的正确用法）
app.get('/docs', swaggerUI({ url: '/openapi.json' }))
app.get('/openapi.json', (c) => c.json(openAPISpec))

// 注册路由
// 注意：服务现在通过 DI 容器在各个路由中按需获取

// ============================================
// 应用API认证中间件到需要保护的路由
// ============================================
// 以下路由需要API签名认证（X-API-Signature）
app.use('/api/v1/*', apiAuthMiddleware)

// ============================================
// 普通 API 路由（需要 X-API-Signature）
// ============================================
// API v1 路由
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/update', updateRoutes)
app.route('/api/v1/portfolio', portfolioRoutes)
app.route('/api/v1/watchlist', watchlistRoutes)
app.route('/api/v1/tv', tvAnalysisRoutes)
app.route('/api/v1/tv', tvNewsRoutes)
app.route('/api/v1/tv', leaderboardRoutes)
app.route('/api/v1/tv', tvWebSocketRoutes)

// 根路径
app.get('/', (c) => {
  return c.json(success({
    name: 'NavTrend API',
    version: 'v1',
    environment: c.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
      api_endpoints: {
        auth: '/api/v1/auth',
        portfolio: '/api/v1/portfolio',
        watchlist: '/api/v1/watchlist',
        leaderboards: '/api/v1/leaderboards',
        leaderboards_configs: '/api/v1/leaderboards/configs',
        leaderboards_data: '/api/v1/leaderboards/{configCode}/data',
        tradingview: '/api/v1/tv',
        update: '/api/v1/update',
      },
    docs: '/docs'
  }, 'NavTrend API service'));
})


/**
 * 导出 Worker
 * 
 * 包含:
 * - fetch: HTTP 请求处理（Hono app）
 * - queue: Queue 消费者处理
 * 
 * 队列处理器：处理来自 PUSH_QUEUE 的推送任务
 * 正确的DDD架构：基础设施层解析消息，应用服务层处理业务逻辑
 */
export default {
  fetch: app.fetch,

}
