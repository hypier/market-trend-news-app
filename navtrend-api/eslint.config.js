import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        // Cloudflare Workers 全局变量
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        Headers: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        AbortSignal: 'readonly',
        FormData: 'readonly',
        crypto: 'readonly',
        console: 'readonly',
        // 定时器全局变量
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // 测试环境全局变量
        global: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // 未使用的变量：允许以下划线开头的变量
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      // 允许使用 any 类型
      '@typescript-eslint/no-explicit-any': 'off',
      // 不强制要求显式返回类型
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      // 允许非空断言（降为关闭）
      '@typescript-eslint/no-non-null-assertion': 'off',
      // 允许 TS 注释指令
      '@typescript-eslint/ban-ts-comment': 'off',
      // Console 仅警告
      'no-console': 'warn',
      // 优先使用 const（保持错误级别）
      'prefer-const': 'error',
      // 禁止使用 var
      'no-var': 'error',
      // 允许空函数
      '@typescript-eslint/no-empty-function': 'off',
      // 允许空接口
      '@typescript-eslint/no-empty-interface': 'off',
      // 允许空对象类型接口
      '@typescript-eslint/no-empty-object-type': 'off',
      // 允许Function类型
      '@typescript-eslint/no-unsafe-function-type': 'off',
      // 关闭 no-undef 规则，因为我们已经在 globals 中声明了
      'no-undef': 'off',
    },
  },
  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'drizzle/**'],
  },
]; 