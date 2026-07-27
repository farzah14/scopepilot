import { defineConfig, devices } from '@playwright/test';

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://scopepilot:scopepilot@localhost:5432/scopepilot_test';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || '01234567890123456789012345678901';
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '01234567890123456789012345678901';
process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000';
process.env.APP_URL = process.env.APP_URL || 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
});
