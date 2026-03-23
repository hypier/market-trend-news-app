/**
 * 投资组合接口 OpenAPI 文档
 * 基于 portfolio.routes.ts 生成的 API 文档
 * 支持 TradingView 格式标识符（EXCHANGE:SYMBOL）
 */

export const portfolioOpenApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'NavTrend 投资组合 API',
    description: '提供投资组合管理功能，使用 TradingView 标准格式（EXCHANGE:SYMBOL，如 NASDAQ:AAPL）',
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
      name: '投资组合接口',
      description: '投资组合相关API - 需要JWT用户认证',
    }
  ],
  paths: {
    // ============== 投资组合接口 ==============
    '/api/v1/portfolio/overview': {
      get: {
        summary: '获取投资组合概览',
        description: '返回持仓列表和基础统计信息（持仓数量、总投资、总股数）',
        tags: ['投资组合接口'],
        responses: {
          200: {
            description: '成功获取投资组合概览',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    message: { type: 'string', example: 'Portfolio overview retrieved successfully' },
                    data: {
                      type: 'object',
                      properties: {
                        holdingsCount: { 
                          type: 'number', 
                          example: 3,
                          description: '持仓股票种类数量'
                        },
                        totalInvestment: { 
                          type: 'string', 
                          example: '5000.00',
                          description: '总投资金额，所有持仓的成本总和'
                        },
                        totalSharesCount: { 
                          type: 'string', 
                          example: '50.00000000', 
                          description: '总持有股数，所有持仓的股票数量总和'
                        },
                        holdings: {
                          type: 'array',
                          description: '持仓列表',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                              userId: { type: 'string', example: 'auth0|12345' },
                              symbol: { type: 'string', example: 'AAPL' },
                              exchange: { type: 'string', example: 'NASDAQ' },
                              country: { type: 'string', example: 'US' },
                              shares: { type: 'string', example: '15.0000' },
                              avgCost: { type: 'string', example: '152.5000' },
                              createdAt: { type: 'string', format: 'date-time' },
                              updatedAt: { type: 'string', format: 'date-time' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: '未授权',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                    data: { type: 'null' }
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
                    message: { type: 'string', example: 'Failed to retrieve portfolio overview' },
                    data: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/v1/portfolio/holdings': {
      get: {
        summary: '获取用户的所有持仓列表',
        description: '返回当前用户的所有持仓股票（不含统计信息）',
        tags: ['投资组合接口'],
        responses: {
          200: {
            description: '成功获取持仓列表',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    message: { type: 'string', example: 'Holdings retrieved successfully' },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                          userId: { type: 'string', example: 'auth0|12345' },
                          symbol: { type: 'string', example: 'AAPL' },
                          exchange: { type: 'string', example: 'NASDAQ' },
                          country: { type: 'string', example: 'US' },
                          shares: { type: 'string', example: '15.0000' },
                          avgCost: { type: 'string', example: '152.5000' },
                          createdAt: { type: 'string', format: 'date-time' },
                          updatedAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: '未授权',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                    data: { type: 'null' }
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
                    message: { type: 'string', example: 'Failed to retrieve holdings' },
                    data: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/v1/portfolio/holdings/{symbol}': {
      get: {
        summary: '获取特定股票的持仓情况',
        description: '根据 TradingView 格式的股票标识符查询用户的持仓信息（如 NASDAQ:AAPL）',
        tags: ['投资组合接口'],
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
        responses: {
          200: {
            description: '成功获取持仓信息（如未找到持仓，data 为 null）',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    message: { type: 'string', example: 'Holding retrieved successfully' },
                    data: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        userId: { type: 'string', example: 'auth0|12345' },
                        symbol: { type: 'string', example: 'AAPL' },
                        exchange: { type: 'string', example: 'NASDAQ' },
                        country: { type: 'string', example: 'US' },
                        shares: { type: 'string', example: '15.0000' },
                        avgCost: { type: 'string', example: '152.5000' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                },
                examples: {
                  foundHolding: {
                    summary: '找到持仓',
                    value: {
                      code: 0,
                      message: 'Holding retrieved successfully',
                      data: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        userId: 'auth0|12345',
                        symbol: 'AAPL',
                        exchange: 'NASDAQ',
                        country: 'US',
                        shares: '15.0000',
                        avgCost: '152.5000',
                        createdAt: '2023-04-12T10:30:00Z',
                        updatedAt: '2023-04-12T10:30:00Z'
                      }
                    }
                  },
                  notFoundHolding: {
                    summary: '未找到持仓',
                    value: {
                      code: 0,
                      message: 'No holding found for symbol NASDAQ:AAPL',
                      data: null
                    }
                  }
                }
              }
            }
          },
          401: {
            description: '未授权',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                    data: { type: 'null' }
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
                    message: { type: 'string', example: 'Failed to retrieve holding information' },
                    data: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    },

    '/api/v1/portfolio/adjust-position': {
      post: {
        summary: '调整持仓（增持或减持）',
        description: '调整持仓：正数changeShares表示增持，负数表示减持。推荐使用 TradingView 格式（EXCHANGE:SYMBOL，如 NASDAQ:AAPL）指定股票。自动计算平均成本和数量，增持不存在股票时自动创建，减持至零时自动删除。',
        tags: ['投资组合接口'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['symbol', 'changeShares', 'transactionPrice'],
                properties: {
                  symbol: {
                    type: 'string',
                    description: 'TradingView 格式的股票标识符（EXCHANGE:SYMBOL）',
                    example: 'NASDAQ:AAPL'
                  },
                  changeShares: {
                    type: 'number',
                    description: '股数变化量（正数表示增持，负数表示减持）',
                    example: 10
                  },
                  transactionPrice: {
                    type: 'number',
                    description: '交易价格',
                    example: 155.5
                  }
                }
              },
              examples: {
                buyExample: {
                  summary: '增持操作',
                  value: {
                    symbol: 'NASDAQ:AAPL',
                    changeShares: 10,
                    transactionPrice: 155.5
                  }
                },
                sellExample: {
                  summary: '减持操作',
                  value: {
                    symbol: 'NASDAQ:AAPL',
                    changeShares: -5,
                    transactionPrice: 160.75
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '调整持仓成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    message: { type: 'string', example: '成功增持股票 AAPL:NASDAQ' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
                        userId: { type: 'string', example: 'auth0|12345' },
                        symbol: { type: 'string', example: 'AAPL' },
                        exchange: { type: 'string', example: 'NASDAQ' },
                        country: { type: 'string', example: 'US' },
                        shares: { type: 'string', example: '15.0000' },
                        avgCost: { type: 'string', example: '152.5000' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                      }
                    }
                  }
                },
                examples: {
                  buyResult: {
                    summary: '增持结果',
                    value: {
                      code: 0,
                      message: '成功增持股票 AAPL:NASDAQ',
                      data: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        userId: 'auth0|12345',
                        symbol: 'AAPL',
                        exchange: 'NASDAQ',
                        country: 'US',
                        shares: '15.0000',
                        avgCost: '152.5000',
                        createdAt: '2023-04-12T10:30:00Z',
                        updatedAt: '2023-04-12T10:30:00Z'
                      }
                    }
                  },
                  sellResult: {
                    summary: '减持结果',
                    value: {
                      code: 0,
                      message: '成功减持股票 AAPL:NASDAQ',
                      data: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        userId: 'auth0|12345',
                        symbol: 'AAPL',
                        exchange: 'NASDAQ',
                        country: 'US',
                        shares: '5.0000',
                        avgCost: '152.5000',
                        createdAt: '2023-04-12T10:30:00Z',
                        updatedAt: '2023-04-12T11:15:00Z'
                      }
                    }
                  },
                  sellAllResult: {
                    summary: '全部减持结果',
                    value: {
                      code: 0,
                      message: '成功完全减持股票 AAPL:NASDAQ',
                      data: null
                    }
                  }
                }
              }
            }
          },
          400: {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string' },
                    data: { type: 'null' }
                  }
                },
                examples: {
                  invalidSymbol: {
                    summary: '无效的股票代码',
                    value: {
                      code: 400,
                      message: 'Stock symbol cannot be empty',
                      data: null
                    }
                  },
                  zeroShares: {
                    summary: '变化量为零',
                    value: {
                      code: 400,
                      message: 'Change in shares must be non-zero',
                      data: null
                    }
                  },
                  negativePrice: {
                    summary: '负价格',
                    value: {
                      code: 400,
                      message: 'Transaction price must be positive',
                      data: null
                    }
                  },
                  notOwned: {
                    summary: '未拥有的股票',
                    value: {
                      code: 400,
                      message: 'Cannot reduce position for a stock you do not own',
                      data: null
                    }
                  },
                  overSell: {
                    summary: '超量减持',
                    value: {
                      code: 400,
                      message: 'Cannot reduce more than owned. You own 5 shares.',
                      data: null
                    }
                  }
                }
              }
            }
          },
          401: {
            description: '未授权',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Unauthorized' },
                    data: { type: 'null' }
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
                    message: { type: 'string', example: 'Failed to adjust position' },
                    data: { type: 'null' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          code: { type: 'number', example: 0 },
          message: { type: 'string' },
          data: { type: 'object' }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: '未授权',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
                data: { type: 'null' }
              }
            }
          }
        }
      },
      ForbiddenError: {
        description: '禁止访问',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 403 },
                message: { type: 'string', example: 'Forbidden' },
                data: { type: 'null' }
              }
            }
          }
        }
      },
      BadRequest: {
        description: '请求参数错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 400 },
                message: { type: 'string', example: 'Invalid request parameters' },
                data: { type: 'null' }
              }
            }
          }
        }
      },
      ServerError: {
        description: '服务器错误',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', example: 500 },
                message: { type: 'string', example: 'Server error' },
                data: { type: 'null' }
              }
            }
          }
        }
      }
    }
  }
}; 