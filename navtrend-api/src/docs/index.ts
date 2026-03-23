import { authOpenAPI } from './auth.openapi';
import { portfolioOpenApiSpec } from './portfolio.openapi';
import { watchlistOpenApiSpec } from './watchlist.openapi';
import { leaderboardOpenAPI } from './tv-leaderboard.openapi';
import { updateOpenAPI } from './update.openapi';
import { tvAnalysisOpenAPI } from './tv-analysis.openapi';
import { tvNewsOpenAPI } from './tv-news.openapi';
import { tvWebSocketOpenAPI } from './tv-websocket.openapi';

// 合并所有 OpenAPI 规范
export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'NavTrend API',
    version: '2.0.0',
    description: `NavTrend 投资组合管理和股票行情应用API`,
  },
  servers: [
    {
      url: 'http://localhost:8787',
      description: '开发环境',
    },
    {
      url: 'https://api.navtrend.net',
      description: 'NavTrend生产环境',
    },
    {
      url: 'https://api.marketrendnews.top',
      description: 'MarketNews生产环境',
    },
    {
      url: 'https://api-dev.navtrend.net',
      description: 'NavTrend开发环境',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Token 用户认证，通过 /api/v1/auth/token 获取',
      },
    },
    schemas: {
      ...(updateOpenAPI.components?.schemas || {}),
      ...(leaderboardOpenAPI.components?.schemas || {}),
      // 基础响应模式
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Error message' },
          error: { type: 'string', example: 'Detailed error description' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: '认证失败 - JWT Token缺失、无效或过期',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 401 },
                data: { type: 'null' },
                message: { type: 'string', example: 'JWT Token is required' }
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: '权限不足 - JWT Token 无效或过期',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 403 },
                data: { type: 'null' },
                message: { type: 'string', example: 'Invalid or expired JWT token' }
              }
            }
          }
        }
      },
      ServerError: {
        description: '服务器内部错误',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    ...authOpenAPI.tags,
    ...portfolioOpenApiSpec.tags,
    ...watchlistOpenApiSpec.tags,
    ...updateOpenAPI.tags,
    ...tvAnalysisOpenAPI.tags,
    ...tvNewsOpenAPI.tags,
    ...leaderboardOpenAPI.tags,
    ...tvWebSocketOpenAPI.tags,
  ],
  paths: {
    ...authOpenAPI.paths,
    ...portfolioOpenApiSpec.paths,
    ...watchlistOpenApiSpec.paths,
    ...updateOpenAPI.paths,
    ...tvAnalysisOpenAPI.paths,
    ...tvNewsOpenAPI.paths,
    ...leaderboardOpenAPI.paths,
    ...tvWebSocketOpenAPI.paths,
  },
}; 