/**
 * 应用更新检查 OpenAPI 规范
 * 定义版本检查相关的API接口文档（配置文件驱动）
 */
export const updateOpenAPI = {
  tags: [
    {
      name: 'update',
      description: '应用更新检查API - 支持版本检查、更新提示、多语言等功能（从配置文件读取版本信息）',
    },
  ],
  paths: {
    '/api/v1/update/check': {
      post: {
        tags: ['update'],
        summary: '检查应用更新',
        description: '检查当前应用版本是否需要更新，支持iOS和Android平台，返回更新信息和多语言消息',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  platform: {
                    type: 'string',
                    enum: ['ios', 'android'],
                    description: '应用平台',
                    example: 'ios',
                  },
                  currentBuildNumber: {
                    type: 'integer',
                    minimum: 1,
                    description: '当前应用构建号',
                    example: 100,
                  },
                  currentVersionName: {
                    type: 'string',
                    minLength: 1,
                    description: '当前版本名称',
                    example: '2.0.0',
                  },
                  locale: {
                    type: 'string',
                    description: '用户语言代码（可选，默认en）',
                    example: 'zh',
                    default: 'en',
                  },
                },
                required: ['platform', 'currentBuildNumber', 'currentVersionName'],
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          200: {
            description: '版本检查成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: {
                      type: 'integer',
                      example: 200,
                      description: '响应状态码',
                    },
                    data: {
                      $ref: '#/components/schemas/UpdateCheckResponse',
                    },
                    message: {
                      type: 'string',
                      example: 'Update available',
                      description: '响应消息',
                    },
                  },
                  required: ['code', 'data', 'message'],
                },
              },
            },
          },
          400: {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                examples: {
                  invalidPlatform: {
                    summary: '无效平台',
                    value: {
                      code: 400,
                      message: 'Platform must be either "ios" or "android"',
                      data: null,
                    },
                  },
                  noBuildNumber: {
                    summary: '缺少构建号配置',
                    value: {
                      code: 400,
                      message: 'No build number configured for ios platform',
                      data: null,
                    },
                  },
                },
              },
            },
          },
          500: {
            description: '服务器内部错误',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
                example: {
                  code: 500,
                  message: 'Internal server error',
                  data: null,
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      UpdateCheckResponse: {
        type: 'object',
        description: '版本检查响应数据',
        properties: {
          updateAvailable: {
            type: 'boolean',
            description: '是否有更新可用',
            example: true,
          },
          versionInfo: {
            type: 'object',
            nullable: true,
            description: '版本信息（有更新时返回）',
            properties: {
              versionName: {
                type: 'string',
                description: '最新版本名称',
                example: '2.1.0',
              },
              buildNumberIos: {
                type: 'integer',
                nullable: true,
                description: 'iOS构建号',
                example: 102,
              },
              buildNumberAndroid: {
                type: 'integer',
                nullable: true,
                description: 'Android构建号',
                example: 202,
              },
              updateType: {
                type: 'string',
                enum: ['optional', 'recommended', 'required'],
                description: '更新类型',
                example: 'recommended',
              },
              downloadUrls: {
                type: 'object',
                description: '应用商店下载链接',
                properties: {
                  ios: {
                    type: 'string',
                    format: 'uri',
                    description: 'iOS应用商店链接',
                    example: 'https://apps.apple.com/app/navtrend/id123456789',
                  },
                  android: {
                    type: 'string',
                    format: 'uri',
                    description: 'Android应用商店链接',
                    example: 'https://www.marketrendnews.top/apk',
                  },
                },
                required: ['ios', 'android'],
              },
              minimumSupportedBuildNumberIos: {
                type: 'integer',
                nullable: true,
                description: 'iOS最低支持构建号',
                example: 100,
              },
              minimumSupportedBuildNumberAndroid: {
                type: 'integer',
                nullable: true,
                description: 'Android最低支持构建号',
                example: 100,
              },
              reminderInterval: {
                type: 'integer',
                minimum: 1,
                description: '提醒间隔天数',
                example: 3,
              },
            },
            required: [
              'versionName',
              'buildNumberIos',
              'buildNumberAndroid',
              'updateType',
              'downloadUrls',
              'minimumSupportedBuildNumberIos',
              'minimumSupportedBuildNumberAndroid',
              'reminderInterval',
            ],
          },
        },
        required: ['updateAvailable', 'versionInfo'],
      },
      ErrorResponse: {
        type: 'object',
        description: '错误响应格式',
        properties: {
          code: {
            type: 'integer',
            description: '错误状态码',
            example: 400,
          },
          message: {
            type: 'string',
            description: '错误消息',
            example: 'Parameter validation failed',
          },
          data: {
            nullable: true,
            description: '错误详细信息（通常为null）',
            example: null,
          },
        },
        required: ['code', 'message', 'data'],
      },
    },
  },
};
