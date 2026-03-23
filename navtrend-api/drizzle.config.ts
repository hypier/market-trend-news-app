import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: '.env' });
// 尝试加载本地环境变量
dotenv.config({ path: '.env.local' });
// 尝试加载开发环境变量
dotenv.config({ path: '.dev.vars' });

// D1 配置
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const databaseId = process.env.D1_DATABASE_ID || '';
const token = process.env.CLOUDFLARE_API_TOKEN || '';

if (!accountId || !databaseId) {
  console.warn('⚠️  警告: CLOUDFLARE_ACCOUNT_ID 或 D1_DATABASE_ID 未设置');
  console.warn('   某些 Drizzle Kit 命令可能无法正常工作');
  console.warn('   请在 .dev.vars 文件中设置这些环境变量');
}

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: ['./src/db/schema.ts'],
  out: './drizzle',
  dbCredentials: {
    accountId: accountId,
    databaseId: databaseId,
    token: token,
  },
  verbose: true,
  strict: true,
});
