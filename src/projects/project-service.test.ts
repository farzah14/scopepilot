import { describe, expect, it, vi } from 'vitest';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  transitionProjectStatus,
  archiveProject,
} from './project-service';
import { InvalidInputError } from '@/errors/domain-errors';

describe('Project Service', () => {
  const mockDb = (userRole: string | null = 'OWNER') => {
    const mockTx = {
      client: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'client-1' && where.organizationId === 'org-1' && where.archivedAt === null) {
            return Promise.resolve({ id: 'client-1', organizationId: 'org-1', name: 'Acme' });
          }
          return Promise.resolve(null);
        }),
      },
      membership: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.userId_organizationId.userId === 'user-owner' && where.userId_organizationId.organizationId === 'org-1') {
            return Promise.resolve({ role: 'OWNER' });
          }
          return Promise.resolve(null);
        }),
      },
      project: {
        create: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({ id: 'proj-1', status: 'DRAFT', ...data })
        ),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'proj-1' && where.organizationId === 'org-1') {
            return Promise.resolve({
              id: 'proj-1',
              organizationId: 'org-1',
              clientId: 'client-1',
              ownerId: 'user-owner',
              name: 'Website Redesign',
              projectType: 'WEBSITE',
              status: 'DRAFT',
              budgetMinCents: 100000,
              budgetMaxCents: 200000,
              targetStartAt: '2026-06-01T00:00:00.000Z',
              targetEndAt: '2026-12-31T00:00:00.000Z',
            });
          }
          return Promise.resolve(null);
        }),
        update: vi.fn().mockImplementation(({ where, data }) =>
          Promise.resolve({ id: where.id, status: data.status || 'DRAFT', ...data })
        ),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    return {
      membership: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (userRole && where.userId_organizationId.userId === 'user-1' && where.userId_organizationId.organizationId === 'org-1') {
            return Promise.resolve({ role: userRole });
          }
          if (userRole && where.userId_organizationId.userId === 'user-owner' && where.userId_organizationId.organizationId === 'org-1') {
            return Promise.resolve({ role: 'OWNER' });
          }
          return Promise.resolve(null);
        }),
      },
      project: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'proj-1', organizationId: 'org-1', name: 'Website Redesign', status: 'DRAFT' },
        ]),
        findFirst: mockTx.project.findFirst,
      },
      $transaction: vi.fn().mockImplementation((callback) => callback(mockTx)),
      _tx: mockTx,
    };
  };

  it('lists projects scoped to organizationId', async () => {
    const db = mockDb();
    const results = await listProjects(db as any, 'user-1', 'org-1');
    expect(db.project.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1' },
      orderBy: { updatedAt: 'desc' },
      include: expect.any(Object),
    });
    expect(results).toHaveLength(1);
  });

  it('creates project and atomic audit event', async () => {
    const db = mockDb();
    const project = await createProject(db as any, 'user-1', 'org-1', {
      clientId: 'client-1',
      ownerId: 'user-owner',
      name: 'Website Redesign',
      projectType: 'WEBSITE',
      budgetMinCents: 100000,
      budgetMaxCents: 200000,
    });

    expect(project.name).toBe('Website Redesign');
    expect(db._tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        actorId: 'user-1',
        action: 'project.created',
        objectType: 'Project',
        objectId: 'proj-1',
      }),
    });
  });

  it('rejects creation if budgetMinCents > budgetMaxCents', async () => {
    const db = mockDb();
    await expect(
      createProject(db as any, 'user-1', 'org-1', {
        clientId: 'client-1',
        ownerId: 'user-owner',
        name: 'Website Redesign',
        projectType: 'WEBSITE',
        budgetMinCents: 500000,
        budgetMaxCents: 100000,
      })
    ).rejects.toThrow();
  });

  it('rejects creation if targetStartAt > targetEndAt', async () => {
    const db = mockDb();
    await expect(
      createProject(db as any, 'user-1', 'org-1', {
        clientId: 'client-1',
        ownerId: 'user-owner',
        name: 'Website Redesign',
        projectType: 'WEBSITE',
        targetStartAt: '2026-12-31T00:00:00Z',
        targetEndAt: '2026-01-01T00:00:00Z',
      })
    ).rejects.toThrow();
  });

  it('rejects project creation if client is from another organization', async () => {
    const db = mockDb();
    await expect(
      createProject(db as any, 'user-1', 'org-1', {
        clientId: 'client-other-org',
        ownerId: 'user-owner',
        name: 'Website Redesign',
        projectType: 'WEBSITE',
      })
    ).rejects.toThrow();
  });

  it('rejects project creation if owner is not a member of the organization', async () => {
    const db = mockDb();
    await expect(
      createProject(db as any, 'user-1', 'org-1', {
        clientId: 'client-1',
        ownerId: 'user-outsider',
        name: 'Website Redesign',
        projectType: 'WEBSITE',
      })
    ).rejects.toThrow();
  });

  it('validates partial update of budgetMaxCents against existing budgetMinCents', async () => {
    const db = mockDb();
    // Existing budgetMinCents is 100000. Trying to update budgetMaxCents to 50000 should fail.
    await expect(
      updateProject(db as any, 'user-1', 'org-1', 'proj-1', {
        budgetMaxCents: 50000,
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('validates partial update of budgetMinCents against existing budgetMaxCents', async () => {
    const db = mockDb();
    // Existing budgetMaxCents is 200000. Trying to update budgetMinCents to 300000 should fail.
    await expect(
      updateProject(db as any, 'user-1', 'org-1', 'proj-1', {
        budgetMinCents: 300000,
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('validates partial update of targetStartAt against existing targetEndAt', async () => {
    const db = mockDb();
    // Existing targetEndAt is 2026-12-31. Trying to update targetStartAt to 2027-01-01 should fail.
    await expect(
      updateProject(db as any, 'user-1', 'org-1', 'proj-1', {
        targetStartAt: '2027-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('validates partial update of targetEndAt against existing targetStartAt', async () => {
    const db = mockDb();
    // Existing targetStartAt is 2026-06-01. Trying to update targetEndAt to 2026-01-01 should fail.
    await expect(
      updateProject(db as any, 'user-1', 'org-1', 'proj-1', {
        targetEndAt: '2026-01-01T00:00:00.000Z',
      })
    ).rejects.toThrow(InvalidInputError);
  });

  it('allows valid partial updates', async () => {
    const db = mockDb();
    const updated = await updateProject(db as any, 'user-1', 'org-1', 'proj-1', {
      budgetMaxCents: 250000,
    });
    expect(updated.budgetMaxCents).toBe(250000);
  });

  it('handles status transitions and records status_changed audit event', async () => {
    const db = mockDb();
    const updated = await transitionProjectStatus(db as any, 'user-1', 'org-1', 'proj-1', 'DISCOVERY');
    expect(updated.status).toBe('DISCOVERY');
    expect(db._tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'project.status_changed',
        metadata: { from: 'DRAFT', to: 'DISCOVERY' },
      }),
    });
  });

  it('rejects invalid status transitions', async () => {
    const db = mockDb();
    await expect(
      transitionProjectStatus(db as any, 'user-1', 'org-1', 'proj-1', 'APPROVED')
    ).rejects.toThrow();
  });

  it('archives project by transitioning status to ARCHIVED', async () => {
    const db = mockDb();
    const archived = await archiveProject(db as any, 'user-1', 'org-1', 'proj-1');
    expect(archived.status).toBe('ARCHIVED');
  });
});
