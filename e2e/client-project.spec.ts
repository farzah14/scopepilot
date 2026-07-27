import { test, expect } from '@playwright/test';

test.describe('Client and Project Management Flow', () => {
  test('user can view client list page', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New Client' })).toBeVisible();
  });

  test('user can navigate to create new client page', async ({ page }) => {
    await page.goto('/clients/new');
    await expect(page.getByRole('heading', { name: 'Create New Client' })).toBeVisible();
    await expect(page.getByLabel('Client name *')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create client' })).toBeVisible();
  });
});
