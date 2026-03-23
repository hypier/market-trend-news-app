/**
 * TradingView 新闻服务 API OpenAPI 文档定义
 * @module docs/tv-news.openapi
 */

export const tvNewsOpenAPI = {
  tags: [
    {
      name: 'TradingView - News',
      description: '新闻服务接口'
    }
  ],

  paths: {
    '/api/v1/tv/news': {
      get: {
        tags: ['TradingView - News'],
        summary: '获取新闻列表',
        parameters: [
          {
            name: 'symbol',
            in: 'query',
            description: '股票代码 (如: NASDAQ:AAPL)',
            schema: {
              type: 'string',
              example: 'NASDAQ:AAPL'
            }
          },
          {
            name: 'lang',
            in: 'query',
            description: '语言代码',
            schema: {
              type: 'string',
              default: 'en',
              example: 'zh-Hans'
            }
          },
          {
            name: 'market',
            in: 'query',
            description: '市场类型',
            schema: {
              type: 'string',
              example: 'stock'
            }
          }
        ],
        responses: {
          200: { description: '新闻列表' }
        }
      }
    },

    '/api/v1/tv/news/{newsId}': {
      get: {
        tags: ['TradingView - News'],
        summary: '获取新闻详情',
        parameters: [
          {
            name: 'newsId',
            in: 'path',
            required: true,
            description: '新闻ID',
            schema: {
              type: 'string',
              example: 'tag:reuters.com,2025:newsml_L3S3VX17F:0'
            }
          },
          {
            name: 'lang',
            in: 'query',
            description: '语言代码',
            schema: {
              type: 'string',
              default: 'en',
              example: 'zh-Hans'
            }
          }
        ],
        responses: {
          200: { description: '新闻详细内容' }
        }
      }
    }
  }
}
