/**
 * 排行榜 API OpenAPI 规范
 * Leaderboard API OpenAPI Specification
 */

export const leaderboardOpenAPI = {
  tags: [
    {
      name: 'TradingView - Leaderboards',
      description: '排行榜 - 提供排行榜配置查询和数据获取的核心功能'
    }
  ],
  
  paths: {
    // 获取默认排行榜配置（前端显示用）
    '/api/v1/tv/leaderboards/default-config': {
      get: {
        tags: ['TradingView - Leaderboards'],
        summary: '获取默认排行榜配置',
        description: `
获取前端显示用的默认排行榜配置，包含分类信息和默认排行榜列表。

**特性**：
- 包含完整的分类（categories）和排行榜（leaderboards）定义
- icon 字段已移除，由前端 UI 层动态生成
- 后端缓存 7 天，前端建议缓存 7 天
- 用于前端构建排行榜 UI 界面

**使用场景**：
- 应用启动时初始化排行榜配置
- 用户管理自定义排行榜时获取可选列表
        `,
        responses: {
          200: {
            description: '成功获取默认配置',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    data: { $ref: '#/components/schemas/DefaultLeaderboardConfig' },
                    message: { 
                      type: 'string', 
                      example: 'Default leaderboard configuration retrieved successfully' 
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
                    code: { type: 'number', example: 500 },
                    message: { 
                      type: 'string', 
                      example: 'Failed to retrieve default leaderboard configuration' 
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // 获取排行榜配置列表
    '/api/v1/tv/leaderboards/configs': {
      get: {
        tags: ['TradingView - Leaderboards'],
        summary: '获取排行榜配置列表',
        description: '返回系统中所有激活的排行榜配置信息，包括市场类型、预设参数等',
        responses: {
          200: {
            description: '成功获取排行榜配置列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/LeaderboardConfig' }
                    },
                    message: { type: 'string', example: 'Leaderboard configurations retrieved successfully' }
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
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Failed to retrieve leaderboard configurations' }
                  }
                }
              }
            }
          }
        }
      }
    },
    
    // 获取排行榜数据
    '/api/v1/tv/leaderboards/{configCode}/data': {
      get: {
        tags: ['TradingView - Leaderboards'],
        summary: '获取排行榜数据',
        description: '根据配置代码获取对应的排行榜数据，支持分页和语言参数',
        parameters: [
          {
            name: 'configCode',
            in: 'path',
            required: true,
            schema: {
              type: 'string'
            },
            description: 'stocks_market_movers.gainers, crypto_coins.total_value_locked',
            example: 'stocks_market_movers.gainers'
          },
          {
            name: 'market_code',
            in: 'query',
            required: false,
            schema: {
              type: 'string'
            },
            description: '市场代码（仅股票类型需要），如：america, china, hongkong',
            example: 'america'
          },
          {
            name: 'start',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 0,
              default: 0
            },
            description: '起始索引，默认为0'
          },
          {
            name: 'count',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 150,
              default: 50
            },
            description: '返回数量，默认50，最大150'
          },
          {
            name: 'lang',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              enum: ['zh', 'en'],
              default: 'en'
            },
            description: '语言代码'
          }
        ],
        responses: {
          200: {
            description: '成功获取排行榜数据',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    data: { $ref: '#/components/schemas/LeaderboardDataResponse' },
                    message: { type: 'string', example: 'Leaderboard data retrieved successfully' }
                  }
                }
              }
            }
          },
          404: {
            description: '排行榜配置不存在',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 404 },
                    message: { type: 'string', example: 'Leaderboard configuration not found' }
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
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Failed to retrieve leaderboard data' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },

  // Schema 定义
  components: {
    schemas: {
      // 默认排行榜配置（前端显示用）
      DefaultLeaderboardConfig: {
        type: 'object',
        description: '默认排行榜配置，包含分类和排行榜定义',
        properties: {
          version: {
            type: 'string',
            description: '配置版本号',
            example: '1.0.1'
          },
          last_updated: {
            type: 'string',
            format: 'date',
            description: '最后更新日期',
            example: '2025-01-24'
          },
          description: {
            type: 'string',
            description: '配置说明',
            example: 'NavTrend 默认排行榜配置文件 - icon 字段已移除，由 UI 层控制'
          },
          categories: {
            type: 'array',
            description: '排行榜分类列表',
            items: { $ref: '#/components/schemas/DefaultLeaderboardCategory' }
          },
          leaderboards: {
            type: 'object',
            description: '排行榜定义字典（key 为排行榜 code）',
            additionalProperties: { $ref: '#/components/schemas/DefaultLeaderboard' },
            example: {
              'us_gainers': {
                'code': 'us_gainers',
                'market_type': 'stock',
                'market_code': 'america',
                'preset': 'gainers',
                'name_translations': {
                  'zh': '美股涨幅榜',
                  'en': 'US Gainers'
                },
                'description_translations': {
                  'zh': '美国股市今日涨幅最大的股票',
                  'en': 'Top gaining stocks in US market today'
                }
              }
            }
          }
        },
        required: ['version', 'last_updated', 'categories', 'leaderboards']
      },

      // 默认排行榜分类
      DefaultLeaderboardCategory: {
        type: 'object',
        description: '排行榜分类（用于 UI 分组显示）',
        properties: {
          id: {
            type: 'string',
            description: '分类 ID',
            example: 'recommended'
          },
          name_translations: {
            type: 'object',
            description: '多语言名称',
            properties: {
              zh: { type: 'string', example: '推荐' },
              en: { type: 'string', example: 'Recommended' }
            },
            required: ['zh', 'en']
          },
          leaderboards: {
            type: 'array',
            description: '该分类包含的排行榜代码列表',
            items: { type: 'string' },
            example: ['us_gainers', 'crypto_large_cap', 'indices_major']
          }
        },
        required: ['id', 'name_translations', 'leaderboards']
      },

      // 默认排行榜定义
      DefaultLeaderboard: {
        type: 'object',
        description: '单个排行榜的完整定义',
        properties: {
          code: {
            type: 'string',
            description: '排行榜代码（唯一标识）',
            example: 'us_gainers'
          },
          market_type: {
            type: 'string',
            enum: ['stock', 'crypto', 'forex', 'futures', 'etf', 'indices'],
            description: '市场类型',
            example: 'stock'
          },
          market_code: {
            type: 'string',
            description: '市场代码（仅股票类型需要）',
            example: 'america',
            nullable: true
          },
          preset: {
            type: 'string',
            description: 'TradingView 预设类型',
            example: 'gainers'
          },
          name_translations: {
            type: 'object',
            description: '多语言名称',
            properties: {
              zh: { type: 'string', example: '美股涨幅榜' },
              en: { type: 'string', example: 'US Gainers' }
            },
            required: ['zh', 'en']
          },
          description_translations: {
            type: 'object',
            description: '多语言描述（可选）',
            properties: {
              zh: { type: 'string', example: '美国股市今日涨幅最大的股票' },
              en: { type: 'string', example: 'Top gaining stocks in US market today' }
            },
            nullable: true
          }
        },
        required: ['code', 'market_type', 'preset', 'name_translations']
      },

      // 排行榜配置（数据库存储的配置）
      LeaderboardConfig: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: '配置代码（唯一标识）',
            example: 'us_gainers'
          },
          market_type: {
            type: 'string',
            enum: ['stock', 'crypto', 'forex', 'futures', 'etf', 'indices'],
            description: '市场类型',
            example: 'stock'
          },
          market_code: {
            type: 'string',
            description: '市场代码（仅股票类型需要）',
            example: 'america',
            nullable: true
          },
          preset: {
            type: 'string',
            description: '预设类型',
            example: 'gainers'
          },
          screener_config: {
            type: 'object',
            description: '筛选器配置（排序、过滤、缓存等参数）',
            properties: {
              sortBy: {
                type: 'string',
                description: '排序字段（如：change, 24h_close_change|5, market_cap_calc）',
                example: 'change'
              },
              sortOrder: {
                type: 'string',
                enum: ['asc', 'desc'],
                description: '排序方向',
                example: 'desc'
              },
              filterConfig: {
                type: 'object',
                description: '过滤配置（可选，用于复杂过滤场景）',
                nullable: true
              },
              cacheDuration: {
                type: 'integer',
                description: '缓存时间（秒）',
                example: 300
              },
              defaultLimit: {
                type: 'integer',
                description: '默认返回条数',
                example: 20
              },
              maxLimit: {
                type: 'integer',
                description: '最大返回条数限制',
                example: 100
              }
            },
            required: ['sortBy', 'sortOrder']
          },
          name_translations: {
            type: 'object',
            description: '多语言名称',
            properties: {
              zh: { type: 'string', example: '美股涨幅榜' },
              en: { type: 'string', example: 'US Gainers' }
            }
          },
          description_translations: {
            type: 'object',
            description: '多语言描述',
            properties: {
              zh: { type: 'string', example: '美国股市今日涨幅最大的股票' },
              en: { type: 'string', example: 'Top gaining stocks in US market today' }
            },
            nullable: true
          },
          icon: {
            type: 'string',
            description: '图标标识',
            example: 'trending-up',
            nullable: true
          },
          is_active: {
            type: 'boolean',
            description: '是否激活',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: '创建时间'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: '更新时间'
          }
        },
        required: ['code', 'market_type', 'preset', 'screener_config', 'name_translations', 'is_active', 'created_at', 'updated_at']
      },

      // 排行榜数据响应
      LeaderboardDataResponse: {
        type: 'object',
        properties: {
          totalCount: {
            type: 'integer',
            description: '总数据条数',
            example: 150
          },
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/LeaderboardRow' },
            description: '排行榜数据列表'
          },
          config: {
            $ref: '#/components/schemas/LeaderboardConfig',
            description: '关联的配置信息'
          }
        },
        required: ['totalCount', 'data', 'config']
      },

      // 排行榜数据行
      LeaderboardRow: {
        type: 'object',
        properties: {
          rank: {
            type: 'integer',
            description: '排名',
            example: 1
          },
          symbol: {
            type: 'string',
            description: '完整符号（格式：EXCHANGE:SYMBOL）',
            example: 'NASDAQ:AAPL'
          },
          name: {
            type: 'string',
            description: '代码/名称',
            example: 'AAPL'
          },
          description: {
            type: 'string',
            description: '描述（公司名称等）',
            example: 'Apple Inc.'
          },
          exchange: {
            type: 'string',
            description: '交易所代码',
            example: 'NASDAQ'
          },
          logoid: {
            type: 'string',
            description: 'Logo ID（TradingView 图标标识）',
            example: 'apple'
          },
          type: {
            type: 'string',
            description: '资产类型',
            example: 'stock'
          },
          currency: {
            type: 'string',
            description: '币种',
            example: 'USD',
            nullable: true
          },
          price: {
            type: 'number',
            description: '当前价格',
            example: 174.25
          },
          change: {
            type: 'number',
            description: '涨跌幅（百分比小数形式）',
            example: 0.0227
          },
          changeAbs: {
            type: 'number',
            description: '涨跌额（绝对值）',
            example: 3.95
          },
          pricescale: {
            type: 'integer',
            description: '价格精度',
            example: 100,
            nullable: true
          },
          baseCurrencyLogoid: {
            type: 'string',
            description: '基础货币Logo（外汇特有）',
            nullable: true
          }
        },
        required: ['rank', 'symbol', 'name', 'description', 'exchange', 'logoid', 'type', 'price', 'change', 'changeAbs']
      }
    }
  }
};
