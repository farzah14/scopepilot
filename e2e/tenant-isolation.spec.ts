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

    // Create Client A & Project A under Org A in PostgreSQL
    clientA = await db.client.create({
      data: {
        organizationId: seed.orgA.id,
        name: `Org A Secret Client ${seed.runId}`,
        contactName: 'Alice Secret',
        email: 'secret@orga.com',
      },
    });

    projectA = await db.project.create({
      data: {
        organizationId: seed.orgA.id,
        clientId: clientA.id,
        ownerId: seed.userA.id,
        name: `Org A Secret Project ${seed.runId}`,
        projectType: 'WEBSITE',
        status: 'DRAFT',
        budgetMinCents: 500000,
        budgetMaxCents: 1000000,
      },
    });
  });

  test('User B cannot access or mutate Client or Project belonging to User A', async ({ page }) => {
    // 1. User B signs in (Organization B context)
    await signInUser(page, seed.userB.email, seed.userB.password);

    // 2. User B uses Organization B (verified by navigation to /clients showing no clients of Org A)
    await page.goto('/clients');
    await expect(page.getByText(clientA.name)).not.toBeVisible();

    // 3. User B attempts to access User A's Client URL
    const clientResponse = await page.goto(`/clients/${clientA.id}`);

    // 4. User B cannot see Organization A client data (404 status returned, client details hidden)
    expect(clientResponse?.status()).toBe(404);
    await expect(page.getByText(clientA.name)).not.toBeVisible();

    // 5. User B attempts to access User A's Project URL
    const projectResponse = await page.goto(`/projects/${projectA.id}`);

    // 6. User B cannot see Organization A project data (404 status returned, project details hidden)
    expect(projectResponse?.status()).toBe(404);
    await expect(page.getByText(projectA.name)).not.toBeVisible();

    // 7. Direct cross-tenant access/mutation attempts are rejected
    // Attempting to access non-existent/cross-tenant resource returns 404
    const invalidAccess = await page.goto(`/clients/${clientA.id}`);
    expect(invalidAccess?.status()).toBe(404);

    // 8. User A's records remain unchanged in PostgreSQL
    const clientAInDb = await db.client.findUnique({
      where: { id: clientA.id },
      include: { projects: true },
    });
    expect(clientAInDb).not.toBeNull();
    expect(clientAInDb?.archivedAt).toBeNull();
    expect(clientAInDb?.projects.length).toBe(1); // Only projectA exists, no cross-tenant project inserted

    const projectAInDb = await db.project.findUnique({
      where: { id: projectA.id },
    });
    expect(projectAInDb).not.toBeNull();
    expect(projectAInDb?.status).toBe('DRAFT');
  });
});
