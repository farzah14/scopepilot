import { Page, expect } from '@playwright/test';

export async function signInUser(page: Page, email: string, password: 'Password123!') {
  await page.goto('/api/auth/signin');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // 1. Wait for navigation away from sign-in page (30s timeout for CI)
  await page.waitForURL((url) => !url.pathname.includes('/api/auth/signin'), { timeout: 30000 });

  // 2. Explicitly assert no authentication error occurred
  expect(page.url()).not.toContain('error=CredentialsSignin');
  expect(page.url()).not.toContain('error=');

  // 3. Verify real session endpoint returns expected authenticated user
  const sessionResponse = await page.request.get('/api/auth/session');
  expect(sessionResponse.ok()).toBe(true);

  const sessionData = await sessionResponse.json();
  expect(sessionData?.user?.email).toBe(email);
}
