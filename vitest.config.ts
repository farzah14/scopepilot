import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    env: {
      DATABASE_URL: 'postgresql://scopepilot:scopepilot@localhost:5432/scopepilot_test',
      AUTH_SECRET: '01234567890123456789012345678901',
      NEXTAUTH_SECRET: '01234567890123456789012345678901',
      APP_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
