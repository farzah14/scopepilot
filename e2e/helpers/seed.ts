import { db } from '../../src/db/client';
import { hashPassword } from '../../src/auth/password';

export interface SeedData {
  runId: string;
  userA: { id: string; email: string; password: 'Password123!'; name: string };
  orgA: { id: string; slug: string; name: string };
  userB: { id: string; email: string; password: 'Password123!'; name: string };
  orgB: { id: string; slug: string; name: string };
}

export function assertSafeTestDatabase(url: string | undefined): void {
  if (!url) {
    throw new Error('DATABASE_URL is not set. Refusing to run E2E tests.');
  }

  let dbName = '';
  try {
    const parsed = new URL(url);
    dbName = parsed.pathname.replace(/^\//, '');
  } catch {
    throw new Error(`Invalid DATABASE_URL format: ${url}`);
  }

  const isTestDb =
    dbName.includes('test') ||
    dbName.includes('integration') ||
    dbName.includes('scopepilot_test');

  const isProduction =
    dbName === 'production' ||
    dbName === 'prod' ||
    dbName === 'scopepilot_prod';

  if (!isTestDb || isProduction) {
    throw new Error(
      `UNSAFE DATABASE TARGET: Refusing to run E2E tests or perform cleanup on database "${dbName}". ` +
      `Target database name must contain "test", "integration", or "scopepilot_test".`
    );
  }
}

export async function seedE2EData(): Promise<SeedData> {
  const dbUrl = process.env.DATABASE_URL;
  assertSafeTestDatabase(dbUrl);

  const runId = 'e2e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  const passwordHash = await hashPassword('Password123!');

  // Clean up previous E2E test runs safely
  await db.auditEvent.deleteMany({ where: { organization: { slug: { startsWith: 'org-e2e-' } } } });
  await db.project.deleteMany({ where: { organization: { slug: { startsWith: 'org-e2e-' } } } });
  await db.client.deleteMany({ where: { organization: { slug: { startsWith: 'org-e2e-' } } } });
  await db.membership.deleteMany({ where: { organization: { slug: { startsWith: 'org-e2e-' } } } });
  await db.organization.deleteMany({ where: { slug: { startsWith: 'org-e2e-' } } });
  await db.user.deleteMany({ where: { email: { contains: '@e2e.test' } } });

  // Create User A & Org A
  const userA = await db.user.create({
    data: {
      email: `usera_${runId}@e2e.test`,
      name: `User A ${runId}`,
      passwordHash,
    },
  });

  const orgA = await db.organization.create({
    data: {
      name: `Org A E2E ${runId}`,
      slug: `org-e2e-a-${runId}`,
      defaultCurrency: 'USD',
    },
  });

  await db.membership.create({
    data: {
      userId: userA.id,
      organizationId: orgA.id,
      role: 'OWNER',
    },
  });

  // Create User B & Org B
  const userB = await db.user.create({
    data: {
      email: `userb_${runId}@e2e.test`,
      name: `User B ${runId}`,
      passwordHash,
    },
  });

  const orgB = await db.organization.create({
    data: {
      name: `Org B E2E ${runId}`,
      slug: `org-e2e-b-${runId}`,
      defaultCurrency: 'EUR',
    },
  });

  await db.membership.create({
    data: {
      userId: userB.id,
      organizationId: orgB.id,
      role: 'OWNER',
    },
  });

  return {
    runId,
    userA: { id: userA.id, email: userA.email, password: 'Password123!', name: userA.name },
    orgA: { id: orgA.id, slug: orgA.slug, name: orgA.name },
    userB: { id: userB.id, email: userB.email, password: 'Password123!', name: userB.name },
    orgB: { id: orgB.id, slug: orgB.slug, name: orgB.name },
  };
}

export async function cleanE2EData(seed: SeedData): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  assertSafeTestDatabase(dbUrl);

  const orgSlugs = [seed.orgA.slug, seed.orgB.slug];
  const userIds = [seed.userA.id, seed.userB.id];

  await db.auditEvent.deleteMany({ where: { organization: { slug: { in: orgSlugs } } } });
  await db.project.deleteMany({ where: { organization: { slug: { in: orgSlugs } } } });
  await db.client.deleteMany({ where: { organization: { slug: { in: orgSlugs } } } });
  await db.membership.deleteMany({ where: { organization: { slug: { in: orgSlugs } } } });
  await db.organization.deleteMany({ where: { slug: { in: orgSlugs } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
}
