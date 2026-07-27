import { Page, expect } from '@playwright/test';

export async function signInUser(page: Page, email: string, password: 'Password123!') {
  await page.goto('/api/auth/signin');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Verify successful auth redirect to app
  await page.waitForURL((url) => !url.pathname.includes('/api/auth/signin'), { timeout: 10000 });
}
