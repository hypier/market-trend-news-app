// 认证相关的 OpenAPI 规范
export const authOpenAPI = {
  tags: [
    {
      name: 'auth',
      description: '认证相关API',
    },
  ],
  paths: {
    '/api/v1/auth/token': {
      post: {
        tags: ['auth'],
        summary: '获取JWT令牌',
        description: '使用完整用户信息获取JWT访问令牌 - 此接口无需认证',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: '用户唯一ID',
                    example: '00808132-e0a9-41b5-b347-8aa9640d5bd0',
                  },
                  auth0_sub: {
                    type: 'string',
                    description: 'Auth0用户标识符',
                    example: 'google-oauth2|104316319789966468246',
                  },
                  name: {
                    type: 'string',
                    description: '用户姓名',
                    example: '刘老师',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    description: '用户邮箱',
                    example: 'liulaoshi938@gmail.com',
                  },
                  app_id: {
                    type: 'string',
                    description: '应用程序ID',
                    example: 'a4da4844-3424-405f-97a4-a561103df65d',
                  },
                },
                required: ['id'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: '成功返回JWT令牌',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        token: {
                          type: 'string',
                          description: 'JWT访问令牌',
                          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                      },
                    },
                    message: { type: 'string', example: 'Token generated successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'Error message' },
                  },
                },
              },
            },
          },
          '401': {
            $ref: '#/components/responses/UnauthorizedError'
          },
        },
      },
    },
    '/api/v1/auth/verify': {
      get: {
        tags: ['auth'],
        summary: '验证JWT令牌',
        description: '验证JWT访问令牌的有效性，返回用户ID - 需要Bearer Token认证',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '令牌验证成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        valid: {
                          type: 'boolean',
                          description: '令牌是否有效',
                          example: true,
                        },
                        userId: {
                          type: 'string',
                          description: '用户ID',
                          example: '00808132-e0a9-41b5-b347-8aa9640d5bd0',
                        },
                      },
                    },
                    message: { type: 'string', example: 'Token valid' },
                  },
                },
              },
            },
          },
          '401': {
            description: '令牌无效或已过期',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Token invalid or expired' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/revoke': {
      post: {
        tags: ['auth'],
        summary: '撤销JWT令牌（登出）',
        description: '撤销JWT访问令牌 - 此操作主要用于记录日志，客户端应删除本地存储的令牌。JWT是无状态的，服务端无法真正撤销令牌',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '令牌撤销成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: { type: 'null' },
                    message: { type: 'string', example: 'Token revoked successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'Error message' },
                  },
                },
              },
            },
          },
          '401': {
            description: '认证失败（令牌格式错误或缺失）',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Missing authorization token' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/clerk/verify': {
      post: {
        tags: ['auth'],
        summary: '验证Clerk Token并获取JWT',
        description: '验证Clerk session token，自动创建或更新用户记录，返回应用JWT token - 此接口无需JWT认证',
        security: [],
        parameters: [
          {
            name: 'appId',
            in: 'header',
            required: true,
            description: '应用ID，用于多应用隔离',
            schema: {
              type: 'string',
              example: '12f9d9e3-cb58-41aa-a02f-8dc4bd6ab1af',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  session_token: {
                    type: 'string',
                    description: 'Clerk session token',
                    example: 'sess_2EOE5c0ZGUvmwAHiXf6R4RmXOOJ',
                  },
                },
                required: ['session_token'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Clerk token验证成功，返回JWT token和用户信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        token: {
                          type: 'string',
                          description: 'JWT访问令牌（有效期6个月）',
                          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        account: {
                          type: 'object',
                          description: '用户账户信息',
                          properties: {
                            id: { type: 'string', example: '00808132-e0a9-41b5-b347-8aa9640d5bd0' },
                            clerkUserId: { type: 'string', example: 'user_2EOE5c0ZGUvmwAHiXf6R4RmXOOJ' },
                            appId: { type: 'string', example: '12f9d9e3-cb58-41aa-a02f-8dc4bd6ab1af' },
                            name: { type: 'string', example: 'John Doe' },
                            email: { type: 'string', example: 'john@example.com' },
                            picture: { type: 'string', example: 'https://img.clerk.com/...' },
                            language: { type: 'string', example: 'en', enum: ['en', 'zh', 'ja', 'ko', 'de', 'id', 'ms'] },
                            isActive: { type: 'boolean', example: true },
                            quietHoursEnabled: { type: 'boolean', example: false },
                            quietHoursStart: { type: 'string', example: '22:00' },
                            quietHoursEnd: { type: 'string', example: '08:00' },
                            timezone: { type: 'string', example: 'UTC' },
                            maxDailyPushes: { type: 'number', example: 20 },
                            createdAt: { type: 'number', example: 1699344000000 },
                            updatedAt: { type: 'number', example: 1699344000000 },
                          },
                        },
                        clerk_user_id: {
                          type: 'string',
                          description: 'Clerk用户ID',
                          example: 'user_2EOE5c0ZGUvmwAHiXf6R4RmXOOJ',
                        },
                        clerk_user_info: {
                          type: 'object',
                          description: 'Clerk用户详细信息',
                          properties: {
                            id: { type: 'string' },
                            firstName: { type: 'string' },
                            lastName: { type: 'string' },
                            username: { type: 'string' },
                            emailAddresses: { type: 'array' },
                            imageUrl: { type: 'string' },
                            createdAt: { type: 'number' },
                            updatedAt: { type: 'number' },
                          },
                        },
                      },
                    },
                    message: { type: 'string', example: 'Clerk token verified successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: '请求参数错误（缺少session_token或appId）',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'session_token is required' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Clerk token无效或已过期',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Token invalid or expired' },
                  },
                },
              },
            },
          },
          '500': {
            description: '服务器内部错误（Clerk服务不可用等）',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Clerk service unavailable' },
                  },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ['auth'],
        summary: '验证Clerk Token并获取JWT（GET方式）',
        description: '验证Clerk session token，自动创建或更新用户记录，返回应用JWT token - 兼容现有前端调用方式',
        security: [],
        parameters: [
          {
            name: 'session_token',
            in: 'query',
            required: true,
            description: 'Clerk session token',
            schema: {
              type: 'string',
              example: 'sess_2EOE5c0ZGUvmwAHiXf6R4RmXOOJ',
            },
          },
          {
            name: 'appId',
            in: 'header',
            required: true,
            description: '应用ID，用于多应用隔离',
            schema: {
              type: 'string',
              example: '12f9d9e3-cb58-41aa-a02f-8dc4bd6ab1af',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Clerk token验证成功，返回JWT token和用户信息',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        token: {
                          type: 'string',
                          description: 'JWT访问令牌（有效期6个月）',
                          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        },
                        account: {
                          type: 'object',
                          description: '用户账户信息',
                        },
                        clerk_user_id: {
                          type: 'string',
                          description: 'Clerk用户ID',
                        },
                        clerk_user_info: {
                          type: 'object',
                          description: 'Clerk用户详细信息',
                        },
                      },
                    },
                    message: { type: 'string', example: 'Clerk token verified successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'session_token is required' },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Clerk token无效或已过期',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Token invalid or expired' },
                  },
                },
              },
            },
          },
          '500': {
            description: '服务器内部错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Internal server error' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/clerk/revoke': {
      post: {
        tags: ['auth'],
        summary: '撤销Clerk会话',
        description: '撤销Clerk会话 - 此接口无需JWT认证，只需提供Clerk会话ID',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  sessionId: {
                    type: 'string',
                    description: 'Clerk会话ID',
                    example: 'sess_2EOE5c0ZGUvmwAHiXf6R4RmXOOJ',
                  },
                },
                required: ['sessionId'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Clerk会话撤销成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: {
                      type: 'object',
                      properties: {
                        revoked: {
                          type: 'boolean',
                          description: '撤销操作是否成功',
                          example: true,
                        },
                      },
                    },
                    message: { type: 'string', example: 'Clerk session revoked successfully' },
                  },
                },
              },
            },
          },
          '400': {
            description: '请求参数错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 400 },
                    message: { type: 'string', example: 'Error message' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/account': {
      delete: {
        tags: ['auth'],
        summary: '注销用户账户',
        description: '永久删除用户账户及所有相关数据（投资组合、关注列表等）- 此操作不可逆',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '账户注销成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 0 },
                    data: { type: 'null' },
                    message: { type: 'string', example: 'Account deleted successfully' },
                  },
                },
              },
            },
          },
          '401': {
            description: '认证失败',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 401 },
                    message: { type: 'string', example: 'Token invalid or expired' },
                  },
                },
              },
            },
          },
          '500': {
            description: '服务器内部错误',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Internal server error' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}; 