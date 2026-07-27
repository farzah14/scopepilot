import { test, expect } from '@playwright/test';
import { seedE2EData, SeedData } from './helpers/seed';
import { signInUser } from './helpers/auth';
import { db } from '../src/db/client';

test.describe('Client and Project End-to-End Workflow', () => {
  let seed: SeedData;

  test.beforeEach(async () => {
    seed = await seedE2EData();
  });

  test('authenticated user can create client, create project, transition status, and persist to PostgreSQL', async ({ page }) => {
    const clientName = `Acme Client ${seed.runId}`;
    const contactName = `John Doe ${seed.runId}`;
    const clientEmail = `john_${seed.runId}@acme.com`;

    const projectName = `Website Redesign ${seed.runId}`;

    // 1. User A signs in via real Credentials provider
    await signInUser(page, seed.userA.email, seed.userA.password);

    // 2. User A navigates to Client List page (Organization A context)
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();

    // 3. User A creates a client through the UI
    await page.click('text=New Client');
    await expect(page.getByRole('heading', { name: 'Create New Client' })).toBeVisible();
    await page.fill('input[name="name"]', clientName);
    await page.fill('input[name="contactName"]', contactName);
    await page.fill('input[name="email"]', clientEmail);
    await page.click('button[type="submit"]');

    // 4. Verify redirected to Client Detail page and client appears in details
    await expect(page.getByRole('heading', { name: clientName })).toBeVisible();
    await expect(page.getByText(`Contact: ${contactName}`)).toBeVisible();

    // Verify client appears in the Client List page
    await page.goto('/clients');
    await expect(page.getByText(clientName)).toBeVisible();

    // 5. User A opens the client detail page
    await page.click(`text=${clientName}`);
    await expect(page.getByRole('heading', { name: clientName })).toBeVisible();

    // 6. User A creates a project through the UI
    await page.fill('input[name="name"]', projectName);
    await page.selectOption('select[name="projectType"]', 'WEBSITE');
    await page.click('button:has-text("Create Project")');

    // 7. Project details show correct client, owner, and initial status (DRAFT)
    await expect(page.getByRole('heading', { name: projectName })).toBeVisible();
    await expect(page.locator('span', { hasText: 'DRAFT' })).toBeVisible();
    await expect(page.getByText(`Client: ${clientName}`)).toBeVisible();
    await expect(page.getByText(`Owner: ${seed.userA.name}`)).toBeVisible();

    // 8. User A performs a valid status transition (DISCOVERY)
    await page.click('button:has-text("Transition to DISCOVERY")');
    await expect(page.locator('span', { hasText: 'DISCOVERY' })).toBeVisible();

    // 9. The new status persists after reload
    await page.reload();
    await expect(page.locator('span', { hasText: 'DISCOVERY' })).toBeVisible();

    // 10. Created records exist in PostgreSQL database via Prisma client
    const createdClientInDb = await db.client.findFirst({
      where: {
        organizationId: seed.orgA.id,
        name: clientName,
      },
    });
    expect(createdClientInDb).not.toBeNull();
    expect(createdClientInDb?.contactName).toBe(contactName);
    expect(createdClientInDb?.email).toBe(clientEmail);

    const createdProjectInDb = await db.project.findFirst({
      where: {
        organizationId: seed.orgA.id,
        clientId: createdClientInDb!.id,
        name: projectName,
      },
    });
    expect(createdProjectInDb).not.toBeNull();
    expect(createdProjectInDb?.ownerId).toBe(seed.userA.id);
    expect(createdProjectInDb?.status).toBe('DISCOVERY');
  });
});
