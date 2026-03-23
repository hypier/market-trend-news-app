// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'tsconfig.json'],
  },
  {
    rules: {
      'import/no-unresolved': 'off', // 暂时禁用导入解析检查
    },
  },
]);
