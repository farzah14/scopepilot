if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '@/db/client';
import { Prisma } from '@/generated/prisma/client';

function assertSafeTestDatabase(url: string | undefined): void {
  if (!url) {
    throw new Error('DATABASE_URL is not set. Refusing to execute integration tests.');
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
      `UNSAFE DATABASE TARGET: Refusing to run integration tests or perform cleanup on database "${dbName}". ` +
      `Target database name must contain "test", "integration", or "scopepilot_test".`
    );
  }
}

describe('Real PostgreSQL Tenant DB Integrity Constraints', () => {
  const runId = 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);

  const createdProjectIds: string[] = [];
  const createdClientIds: string[] = [];
  const createdMembershipIds: string[] = [];
  const createdOrgIds: string[] = [];
  const createdUserIds: string[] = [];

  let userA: { id: string };
  let userB: { id: string };
  let orgA: { id: string };
  let orgB: { id: string };
  let clientA: { id: string };
  let clientB: { id: string };

  beforeAll(async () => {
    assertSafeTestDatabase(process.env.DATABASE_URL);
    await db.$connect();

    // Create User A
    userA = await db.user.create({
      data: {
        name: `User A ${runId}`,
        email: `usera_${runId}@example.com`,
      },
    });
    createdUserIds.push(userA.id);

    // Create Organization A
    orgA = await db.organization.create({
      data: {
        name: `Org A ${runId}`,
        slug: `orga-${runId}`,
      },
    });
    createdOrgIds.push(orgA.id);

    // Create Membership A linking User A to Organization A
    const membershipA = await db.membership.create({
      data: {
        userId: userA.id,
        organizationId: orgA.id,
        role: 'OWNER',
      },
    });
    createdMembershipIds.push(membershipA.id);

    // Create Client A belonging to Organization A
    clientA = await db.client.create({
      data: {
        organizationId: orgA.id,
        name: `Client A ${runId}`,
      },
    });
    createdClientIds.push(clientA.id);
  });

  afterAll(async () => {
    assertSafeTestDatabase(process.env.DATABASE_URL);

    if (createdProjectIds.length > 0) {
      await db.project.deleteMany({
        where: { id: { in: createdProjectIds } },
      });
    }
    if (createdClientIds.length > 0) {
      await db.client.deleteMany({
        where: { id: { in: createdClientIds } },
      });
    }
    if (createdMembershipIds.length > 0) {
      await db.membership.deleteMany({
        where: { id: { in: createdMembershipIds } },
      });
    }
    if (createdOrgIds.length > 0) {
      await db.organization.deleteMany({
        where: { id: { in: createdOrgIds } },
      });
    }
    if (createdUserIds.length > 0) {
      await db.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await db.$disconnect();
  });

  it('CASE A — valid tenant-consistent project creation succeeds', async () => {
    const projectA = await db.project.create({
      data: {
        organizationId: orgA.id,
        clientId: clientA.id,
        ownerId: userA.id,
        name: `Project A ${runId}`,
        projectType: 'SOFTWARE',
      },
    });
    createdProjectIds.push(projectA.id);

    expect(projectA.id).toBeDefined();
    expect(projectA.organizationId).toBe(orgA.id);
    expect(projectA.clientId).toBe(clientA.id);
    expect(projectA.ownerId).toBe(userA.id);
  });

  it('CASE B — cross-organization client reference is rejected by composite foreign key', async () => {
    orgB = await db.organization.create({
      data: {
        name: `Org B ${runId}`,
        slug: `orgb-${runId}`,
      },
    });
    createdOrgIds.push(orgB.id);

    clientB = await db.client.create({
      data: {
        organizationId: orgB.id,
        name: `Client B ${runId}`,
      },
    });
    createdClientIds.push(clientB.id);

    try {
      await db.project.create({
        data: {
          organizationId: orgA.id,
          clientId: clientB.id, // Belongs to Org B, not Org A
          ownerId: userA.id,
          name: `Cross Org Client Project ${runId}`,
          projectType: 'SOFTWARE',
        },
      });
      expect.fail('Expected composite FK violation on Project-to-Client relation');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      expect(prismaErr.code).toBe('P2003');
      const targetStr = String(prismaErr.meta?.field_name || prismaErr.meta?.target || prismaErr.message);
      expect(targetStr).toContain('Project_clientId_organizationId_fkey');
    }
  });

  it('CASE C — owner without membership in project organization is rejected', async () => {
    userB = await db.user.create({
      data: {
        name: `User B ${runId}`,
        email: `userb_${runId}@example.com`,
      },
    });
    createdUserIds.push(userB.id);

    try {
      await db.project.create({
        data: {
          organizationId: orgA.id,
          clientId: clientA.id,
          ownerId: userB.id, // User B has no membership in Org A
          name: `No Membership Owner Project ${runId}`,
          projectType: 'SOFTWARE',
        },
      });
      expect.fail('Expected composite FK violation on Project-to-Membership relation');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      expect(prismaErr.code).toBe('P2003');
      const targetStr = String(prismaErr.meta?.field_name || prismaErr.meta?.target || prismaErr.message);
      expect(targetStr).toContain('Project_ownerId_organizationId_fkey');
    }
  });

  it('CASE D — owner membership in another organization only is rejected', async () => {
    const membershipBOrgB = await db.membership.create({
      data: {
        userId: userB.id,
        organizationId: orgB.id,
        role: 'OWNER',
      },
    });
    createdMembershipIds.push(membershipBOrgB.id);

    try {
      await db.project.create({
        data: {
          organizationId: orgA.id,
          clientId: clientA.id,
          ownerId: userB.id, // User B is only member of Org B, trying to own Project in Org A
          name: `Wrong Org Membership Owner Project ${runId}`,
          projectType: 'SOFTWARE',
        },
      });
      expect.fail('Expected composite FK violation on Project-to-Membership relation');
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
      const prismaErr = err as Prisma.PrismaClientKnownRequestError;
      expect(prismaErr.code).toBe('P2003');
      const targetStr = String(prismaErr.meta?.field_name || prismaErr.meta?.target || prismaErr.message);
      expect(targetStr).toContain('Project_ownerId_organizationId_fkey');
    }
  });

  it('CASE E — valid owner succeeds after matching membership in project organization exists', async () => {
    const membershipBOrgA = await db.membership.create({
      data: {
        userId: userB.id,
        organizationId: orgA.id,
        role: 'CONTRIBUTOR',
      },
    });
    createdMembershipIds.push(membershipBOrgA.id);

    const projectB = await db.project.create({
      data: {
        organizationId: orgA.id,
        clientId: clientA.id,
        ownerId: userB.id,
        name: `Project with User B Owner ${runId}`,
        projectType: 'SOFTWARE',
      },
    });
    createdProjectIds.push(projectB.id);

    expect(projectB.id).toBeDefined();
    expect(projectB.organizationId).toBe(orgA.id);
    expect(projectB.clientId).toBe(clientA.id);
    expect(projectB.ownerId).toBe(userB.id);
  });
});
