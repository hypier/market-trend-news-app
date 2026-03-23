import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './__tests__'),
    },
  },
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        CACHE: 'CACHE',
      },
      kvNamespaces: ['CACHE'],
    },
    
    // FIRST原则 - Fast（快速）
    // 单元测试超时阈值（50ms目标，实际设置50s以容纳复杂测试）
    testTimeout: 50000,
    hookTimeout: 10000,
    
    // 并行执行支持 - 禁用以确保测试隔离（WatchlistCoordinator测试需要）
    threads: false,
    maxConcurrency: 1,
    isolate: true, // 确保测试隔离
    
    // FIRST原则 - Repeatable（可重复）
    // 固定随机种子确保可重复性
    sequence: {
      shuffle: false, // 禁用随机顺序以确保可重复性
      concurrent: true, // 允许并发执行
    },
    
    // 覆盖率配置（FIRST原则 - Self-validating）
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      
      // 覆盖率排除规则
      exclude: [
        'node_modules/**',
        'dist/**',
        'drizzle/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts', // 排除入口文件
        '__tests__/**', // 排除测试文件本身
        'src/config/**', // 排除配置文件
        'src/docs/**', // 排除文档
        'scripts/**', // 排除脚本
      ],
      
      // FIRST原则质量目标 - 覆盖率阈值
      thresholds: {
        global: {
          lines: 85,      // 整体行覆盖率 > 85%
          functions: 85,  // 函数覆盖率
          branches: 80,   // 分支覆盖率
          statements: 85, // 语句覆盖率
        },
        // 关键文件单独阈值
        'src/durable-objects/price-monitor/**': {
          lines: 95,      // PriceMonitor覆盖率 > 95%
          functions: 95,
          branches: 90,
          statements: 95,
        },
        'src/queues/push-queue.consumer.ts': {
          lines: 95,      // 推送队列消费者覆盖率 > 95%
          functions: 95,
          branches: 90,
          statements: 95,
        },
        // 领域层和应用服务层阈值
        'src/domain/**': {
          lines: 90,      // 领域层覆盖率 > 90%
          functions: 90,
          branches: 85,
          statements: 90,
        },
        'src/services/**': {
          lines: 90,      // 应用服务层覆盖率 > 90%
          functions: 90,
          branches: 85,
          statements: 90,
        },
      },
      
      // 关键文件单独跟踪
      perFile: true,
      all: true, // 包含所有文件（包括未测试的）
    },
    
    // 测试文件匹配模式
    include: [
      '__tests__/**/*.test.ts',
      '__tests__/**/*.spec.ts',
    ],
    
    // 排除文件
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*.d.ts',
    ],
    
    // 报告器配置
    reporter: ['verbose', 'html'],
    outputFile: {
      html: './coverage/index.html',
    },
    
    // 监听模式配置
    watch: false, // 默认关闭watch，通过脚本控制
    
    // 全局设置
    setupFiles: ['__tests__/helpers/setup.ts'],
    
    // 性能监控
    logHeapUsage: true,
    
    // 失败时停止（Fast原则）
    bail: 5, // 5个测试失败后停止
  },
}); 