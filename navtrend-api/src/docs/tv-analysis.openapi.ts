/**
 * TradingView 技术分析 API OpenAPI 文档定义
 * @module docs/tv-analysis.openapi
 */

export const tvAnalysisOpenAPI = {
  tags: [
    {
      name: 'TradingView - Technical Analysis',
      description: '技术分析、搜索与行情代理接口'
    }
  ],

  paths: {
    '/api/v1/tv/quote/{symbol}': {
      get: {
        tags: ['TradingView - Technical Analysis'],
        summary: '获取实时行情报价',
        description: '通过后端代理获取指定交易对的最新报价信息',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: '交易对符号 (格式: EXCHANGE:SYMBOL)',
            schema: {
              type: 'string',
              example: 'NASDAQ:AAPL'
            }
          },
          {
            name: 'session',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              default: 'regular'
            }
          },
          {
            name: 'fields',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              default: 'all'
            }
          }
        ],
        responses: {
          200: {
            description: '成功返回报价数据'
          }
        }
      }
    },

    '/api/v1/tv/price/{symbol}': {
      get: {
        tags: ['TradingView - Technical Analysis'],
        summary: '获取历史 K 线数据',
        description: '通过后端代理获取指定交易对的历史价格数据',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: '交易对符号 (格式: EXCHANGE:SYMBOL)',
            schema: {
              type: 'string',
              example: 'NASDAQ:AAPL'
            }
          },
          {
            name: 'timeframe',
            in: 'query',
            required: false,
            schema: {
              type: 'string',
              default: 'D'
            }
          },
          {
            name: 'range',
            in: 'query',
            required: false,
            schema: {
              type: 'integer',
              default: 30
            }
          }
        ],
        responses: {
          200: {
            description: '成功返回历史 K 线数据'
          }
        }
      }
    },

    '/api/v1/tv/quote/batch': {
      post: {
        tags: ['TradingView - Technical Analysis'],
        summary: '批量获取实时行情报价',
        description: '通过后端代理批量获取多个交易对的报价信息，最多支持 20 个 symbols',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbols'],
                properties: {
                  symbols: {
                    type: 'array',
                    items: {
                      type: 'string'
                    },
                    example: ['NASDAQ:AAPL', 'NASDAQ:MSFT']
                  },
                  session: {
                    type: 'string',
                    default: 'regular'
                  },
                  fields: {
                    type: 'string',
                    default: 'all'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '成功返回批量报价数据'
          }
        }
      }
    },

    '/api/v1/tv/technical-analysis/{symbol}': {
      get: {
        tags: ['TradingView - Technical Analysis'],
        summary: '获取技术分析数据',
        description: '获取指定交易对的技术分析建议（8个时间周期）',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: '交易对符号 (格式: EXCHANGE:SYMBOL，如 BINANCE:BTCUSDT)',
            schema: {
              type: 'string',
              example: 'BINANCE:BTCUSDT'
            }
          }
        ],
        responses: {
          200: {
            description: '成功返回技术分析数据',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    data: { type: 'object' },
                    message: { type: 'string', example: 'Operation successful' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/v1/tv/detailed-indicators/{symbol}': {
      get: {
        tags: ['TradingView - Technical Analysis'],
        summary: '获取详细技术指标数据',
        description: '获取指定交易对的详细技术指标数据，包含50+个专业技术指标',
        parameters: [
          {
            name: 'symbol',
            in: 'path',
            required: true,
            description: '交易对符号 (格式: EXCHANGE:SYMBOL)',
            schema: {
              type: 'string',
              example: 'BINANCE:BTCUSDT'
            }
          }
        ],
        responses: {
          200: {
            description: '成功返回详细技术指标数据',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Operation successful' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/v1/tv/search/market': {
      get: {
        tags: ['TradingView - Technical Analysis'],
        summary: '搜索市场和交易对',
        description: '使用 TradingView Symbol Search API v3 搜索股票、加密货币、外汇、期货等交易品种',
        parameters: [
          {
            name: 'query',
            in: 'query',
            required: true,
            description: '搜索关键词',
            schema: {
              type: 'string',
              example: 'AAPL'
            }
          },
          {
            name: 'filter',
            in: 'query',
            description: '类型过滤',
            schema: {
              type: 'string',
              enum: ['stock', 'funds', 'futures', 'forex', 'crypto', 'index', 'bond', 'economic', 'options', 'undefined'],
              example: 'stock'
            }
          },
          {
            name: 'lang',
            in: 'query',
            description: '语言代码',
            schema: {
              type: 'string',
              default: 'en',
              example: 'en'
            }
          }
        ],
        responses: {
          200: {
            description: '搜索结果列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Operation successful' },
                    data: { type: 'array' }
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

