import { test, expect } from '@playwright/test';
import { seedE2EData, SeedData } from './helpers/seed';
import { signInUser } from './helpers/auth';

test.describe('Client and Project End-to-End Workflow', () => {
  let seed: SeedData;

  test.beforeEach(async () => {
    seed = await seedE2EData();
  });

  test('authenticated user can create client, create project, transition status, and archive', async ({ page }) => {
    // 1. Sign in as User A
    await signInUser(page, seed.userA.email, seed.userA.password);

    // 2. Navigate to Client List page
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();

    // 3. Create New Client
    await page.click('text=New Client');
    await expect(page.getByRole('heading', { name: 'Create New Client' })).toBeVisible();
    await page.fill('input[name="name"]', 'Acme E2E Client');
    await page.fill('input[name="contactName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@acme-e2e.com');
    await page.click('button[type="submit"]');

    // 4. Verify redirected to Client Detail page
    await expect(page.getByRole('heading', { name: 'Acme E2E Client' })).toBeVisible();
    await expect(page.getByText('Contact: John Doe')).toBeVisible();

    // 5. Create Project under Client
    await page.fill('input[name="name"]', 'E2E Website Redesign');
    await page.selectOption('select[name="projectType"]', 'WEBSITE');
    await page.click('button:has-text("Create Project")');

    // 6. Verify redirected to Project Detail page
    await expect(page.getByRole('heading', { name: 'E2E Website Redesign' })).toBeVisible();
    await expect(page.getByText('DRAFT')).toBeVisible();

    // 7. Transition Project status to DISCOVERY
    await page.click('button:has-text("Transition to DISCOVERY")');
    await expect(page.getByText('DISCOVERY')).toBeVisible();

    // 8. Archive Project
    await page.click('button:has-text("Archive Project")');
    await expect(page.getByRole('heading', { name: 'Acme E2E Client' })).toBeVisible();
  });
});
