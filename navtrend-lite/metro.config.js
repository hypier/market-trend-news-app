const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// 禁用 package exports 以解决 Firebase 兼容性问题
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
  alias: {
    '@': path.resolve(projectRoot, './'),
  },
};

// 优化 Hermes 构建
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: true,
    mangle: {
      keep_fnames: true,
    },
  },
};

module.exports = config; 