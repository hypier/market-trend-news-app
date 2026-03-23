/**
 * TradingView WebSocket Token API OpenAPI 文档定义
 * @module docs/tv-websocket.openapi
 */

export const tvWebSocketOpenAPI = {
  tags: [
    {
      name: 'TradingView - WebSocket Auth',
      description: 'WebSocket 动态认证接口'
    }
  ],

  paths: {
    '/api/v1/tv/ws/token': {
      get: {
        tags: ['TradingView - WebSocket Auth'],
        summary: '获取 WebSocket 连接 Token',
        description: '动态获取 TradingView WebSocket 连接所需的 URL 和 JWT token，支持三种过期时间类型',
        parameters: [
          {
            name: 'type',
            in: 'query',
            required: false,
            description: 'Token 过期时间类型：1 (30分钟)、2 (6小时)、3 (24小时)',
            schema: {
              type: 'integer',
              enum: [1, 2, 3],
              default: 2
            },
            example: 2
          }
        ],
        responses: {
          200: {
            description: '成功获取 WebSocket Token',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'integer',
                      example: 0,
                      description: '响应状态码，0 表示成功'
                    },
                    data: {
                      type: 'object',
                      properties: {
                        wsUrl: {
                          type: 'string',
                          description: 'WebSocket 服务地址',
                          example: 'ws://localhost:8080'
                        },
                        token: {
                          type: 'string',
                          description: 'JWT Token',
                          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3MDU1NjQyOTAsImV4cCI6MTcwNTU4NTg5MCwic291cmNlIjoid3Mtand0In0.abc123'
                        },
                        expiresAt: {
                          type: 'integer',
                          description: '过期时间戳（毫秒）',
                          example: 1705585890123
                        },
                        expiresIn: {
                          type: 'string',
                          description: '过期时间描述',
                          example: '6 hours'
                        }
                      },
                      required: ['wsUrl', 'token', 'expiresAt', 'expiresIn']
                    }
                  }
                }
              }
            }
          },
          400: {
            description: '参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'integer',
                      example: 400,
                      description: '错误状态码'
                    },
                    message: {
                      type: 'string',
                      example: 'type 参数必须为 1 (30分钟)、2 (6小时) 或 3 (24小时)',
                      description: '错误信息'
                    }
                  }
                }
              }
            }
          },
          500: {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'integer',
                      example: 500,
                      description: '错误状态码'
                    },
                    message: {
                      type: 'string',
                      example: '获取 WebSocket Token 失败',
                      description: '错误信息'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
