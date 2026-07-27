import { db } from '../../src/db/client';
import { hashPassword } from '../../src/auth/password';

export interface SeedData {
  userA: { id: string; email: string; password: 'Password123!' };
  orgA: { id: string; slug: string };
  userB: { id: string; email: string; password: 'Password123!' };
  orgB: { id: string; slug: string };
}

export async function seedE2EData(): Promise<SeedData> {
  const passwordHash = await hashPassword('Password123!');

  // Cleanup pre-existing test data safely
  await db.auditEvent.deleteMany({ where: { organization: { slug: { in: ['org-e2e-a', 'org-e2e-b'] } } } });
  await db.project.deleteMany({ where: { organization: { slug: { in: ['org-e2e-a', 'org-e2e-b'] } } } });
  await db.client.deleteMany({ where: { organization: { slug: { in: ['org-e2e-a', 'org-e2e-b'] } } } });
  await db.membership.deleteMany({ where: { organization: { slug: { in: ['org-e2e-a', 'org-e2e-b'] } } } });
  await db.organization.deleteMany({ where: { slug: { in: ['org-e2e-a', 'org-e2e-b'] } } });
  await db.user.deleteMany({ where: { email: { in: ['usera@e2e.test', 'userb@e2e.test'] } } });

  // Create User A & Org A
  const userA = await db.user.create({
    data: {
      email: 'usera@e2e.test',
      name: 'User A',
      passwordHash,
    },
  });

  const orgA = await db.organization.create({
    data: {
      name: 'Org A E2E',
      slug: 'org-e2e-a',
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
      email: 'userb@e2e.test',
      name: 'User B',
      passwordHash,
    },
  });

  const orgB = await db.organization.create({
    data: {
      name: 'Org B E2E',
      slug: 'org-e2e-b',
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
    userA: { id: userA.id, email: userA.email, password: 'Password123!' },
    orgA: { id: orgA.id, slug: orgA.slug },
    userB: { id: userB.id, email: userB.email, password: 'Password123!' },
    orgB: { id: orgB.id, slug: orgB.slug },
  };
}
