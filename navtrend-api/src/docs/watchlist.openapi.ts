/**
 * 关注列表接口 OpenAPI 文档
 * 基于 watchlist.routes.ts 生成的 API 文档
 * 支持 TradingView 格式标识符（EXCHANGE:SYMBOL）
 */

export const watchlistOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'NavTrend 关注列表 API',
    description: '提供关注列表管理功能，使用 TradingView 标准格式（EXCHANGE:SYMBOL，如 NASDAQ:AAPL）',
    version: '1.0.0',
  },
  servers: [
    {
      url: 'https://api.navtrend.com/api/v1',
      description: '生产环境',
    },
    {
      url: 'http://localhost:8787/api/v1',
      description: '开发环境',
    },
  ],
  tags: [
    {
      name: '关注列表接口',
      description: '关注列表相关API - 需要JWT用户认证',
    }
  ],
  paths: {
    // ============== 关注列表接口 ==============
    '/api/v1/watchlist': {
      get: {
        summary: '获取用户的关注列表',
        description: '返回当前用户的所有关注股票',
        tags: ['关注列表接口'],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: '成功返回关注列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
                          userId: { type: 'string', example: 'user_2fVEjS5jjrwXtB9RzXwpwpJr7Yz' },
                          symbol: { type: 'string', example: 'AAPL' },
                          exchange: { type: 'string', example: 'NASDAQ' },
                          country: { type: 'string', example: 'US' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    },
                    message: { type: 'string', example: 'Watchlist retrieved successfully' }
                  }
                }
              }
            }
          },
          '401': {
            description: '未授权访问',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Failed to retrieve watchlist' }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        summary: '添加股票到关注列表',
        description: '将指定股票添加到用户关注列表。推荐使用 TradingView 格式（如 NASDAQ:AAPL）。也支持独立字段（symbol + exchange + country）以兼容旧客户端。',
        tags: ['关注列表接口'],
        security: [
          {
            bearerAuth: []
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  symbol: { 
                    type: 'string', 
                    description: 'TradingView 格式的股票标识符（推荐，如 NASDAQ:AAPL）或股票代码（如 AAPL）', 
                    example: 'NASDAQ:AAPL' 
                  },
                  exchange: {
                    type: 'string',
                    description: '交易所代码（可选，如果 symbol 已包含交易所信息则不需要）',
                    example: 'NASDAQ'
                  },
                  country: {
                    type: 'string',
                    description: '国家代码（可选）',
                    example: 'US'
                  }
                },
                required: ['symbol']
              },
              examples: {
                tradingViewFormat: {
                  summary: '推荐：TradingView 标准格式',
                  value: { symbol: 'NASDAQ:AAPL' }
                },
                tradingViewWithCountry: {
                  summary: 'TradingView 完整格式（含国家）',
                  value: { symbol: 'NASDAQ:AAPL:US' }
                },
                cryptoExample: {
                  summary: '加密货币示例',
                  value: { symbol: 'BINANCE:BTCUSDT' }
                },
                legacySeparateFields: {
                  summary: '兼容：独立字段格式（旧版本）',
                  value: { 
                    symbol: 'AAPL',
                    exchange: 'NASDAQ',
                    country: 'US'
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '成功添加到关注列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        userId: { type: 'string' },
                        symbol: { type: 'string', example: 'AAPL' },
                        exchange: { type: 'string', example: 'NASDAQ' },
                        country: { type: 'string', example: 'US' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    },
                    message: { type: 'string', example: 'Stock added to watchlist successfully' }
                  }
                }
              }
            }
          },
          '401': {
            description: '未授权访问'
          },
          '500': {
            description: '服务器错误'
          }
        }
      }
    },

    '/api/v1/watchlist/check/{symbol}': {
      get: {
        summary: '检查特定股票是否在用户的关注列表中',
        description: '根据 TradingView 格式的股票标识符查询关注状态（如 NASDAQ:AAPL）',
        tags: ['关注列表接口'],
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: 'TradingView 格式的股票标识符（EXCHANGE:SYMBOL）',
            schema: {
              type: 'string'
            },
            example: 'NASDAQ:AAPL'
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: '成功检查股票是否在关注列表中',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        symbol: { type: 'string', example: 'AAPL:NASDAQ' },
                        isInWatchlist: { type: 'boolean', example: true },
                        watchlistItem: {
                          type: 'object',
                          nullable: true,
                          properties: {
                            id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
                            userId: { type: 'string', example: 'user_2fVEjS5jjrwXtB9RzXwpwpJr7Yz' },
                            symbol: { type: 'string', example: 'AAPL' },
                            exchange: { type: 'string', example: 'NASDAQ' },
                            country: { type: 'string', example: 'US' },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' }
                          }
                        }
                      }
                    },
                    message: { type: 'string', example: 'Watchlist check completed successfully' }
                  }
                },
                examples: {
                  inWatchlist: {
                    summary: '股票在关注列表中',
                    value: {
                      code: 0,
                      data: {
                        symbol: 'AAPL:NASDAQ',
                        isInWatchlist: true,
                        watchlistItem: {
                          id: '123e4567-e89b-12d3-a456-426614174000',
                          userId: 'user_2fVEjS5jjrwXtB9RzXwpwpJr7Yz',
                          symbol: 'AAPL',
                          exchange: 'NASDAQ',
                          country: 'US',
                          createdAt: '2023-05-01T10:30:00Z',
                          updatedAt: '2023-05-01T10:30:00Z'
                        }
                      },
                      message: 'Watchlist check completed successfully'
                    }
                  },
                  notInWatchlist: {
                    summary: '股票不在关注列表中',
                    value: {
                      code: 0,
                      data: {
                        symbol: 'AAPL:NASDAQ',
                        isInWatchlist: false,
                        watchlistItem: null
                      },
                      message: 'Watchlist check completed successfully'
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: '未授权访问',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' }
                  }
                }
              }
            }
          },
          '500': {
            description: '服务器错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Failed to check watchlist item' }
                  }
                }
              }
            }
          }
        }
      }
    },

    // 从关注列表移除股票（DELETE）
    '/api/v1/watchlist/{symbol}': {
      delete: {
        summary: '从关注列表移除股票',
        description: '根据 TradingView 格式的股票标识符从用户关注列表移除股票（如 NASDAQ:AAPL）。\n\n**自动清理功能**：系统将自动删除该股票的所有关联价格提醒。提醒删除失败不会影响取消关注操作。',
        tags: ['关注列表接口'],
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: 'TradingView 格式的股票标识符（EXCHANGE:SYMBOL），例如 NASDAQ:AAPL',
            schema: { type: 'string' },
            example: 'NASDAQ:AAPL'
          }
        ],
        security: [
          {
            bearerAuth: []
          }
        ],
        responses: {
          '200': {
            description: '成功从关注列表移除',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: { type: 'null' },
                    message: { type: 'string', example: 'Stock removed from watchlist successfully' }
                  }
                }
              }
            }
          },
          '401': {
            description: '未授权访问'
          },
          '500': {
            description: '服务器错误'
          }
        }
      }
    }
  }
}; 