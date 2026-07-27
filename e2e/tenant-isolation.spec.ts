import { test, expect } from '@playwright/test';
import { seedE2EData, SeedData } from './helpers/seed';
import { signInUser } from './helpers/auth';
import { db } from '../src/db/client';

test.describe('Tenant Isolation E2E Verification', () => {
  let seed: SeedData;
  let clientA: any;
  let projectA: any;

  test.beforeEach(async () => {
    seed = await seedE2EData();

    // Create Client A & Project A under Org A
    clientA = await db.client.create({
      data: {
        organizationId: seed.orgA.id,
        name: 'Org A Secret Client',
        contactName: 'Alice Secret',
        email: 'secret@orga.com',
      },
    });

    projectA = await db.project.create({
      data: {
        organizationId: seed.orgA.id,
        clientId: clientA.id,
        ownerId: seed.userA.id,
        name: 'Org A Secret Project',
        projectType: 'WEBSITE',
        status: 'DRAFT',
        budgetMinCents: 500000,
        budgetMaxCents: 1000000,
      },
    });
  });

  test('User B cannot access Client or Project belonging to User A', async ({ page }) => {
    // 1. Sign in as User B (Org B)
    await signInUser(page, seed.userB.email, seed.userB.password);

    // 2. Attempt to navigate directly to User A's Client URL
    await page.goto(`/clients/${clientA.id}`);

    // 3. Verify 404 Page / Not Found displayed, no client details exposed
    await expect(page.getByText('Org A Secret Client')).not.toBeVisible();
    await expect(page.getByText('This page could not be found')).toBeVisible();

    // 4. Attempt to navigate directly to User A's Project URL
    await page.goto(`/projects/${projectA.id}`);

    // 5. Verify 404 Page / Not Found displayed, no project details exposed
    await expect(page.getByText('Org A Secret Project')).not.toBeVisible();
    await expect(page.getByText('This page could not be found')).toBeVisible();
  });
});
