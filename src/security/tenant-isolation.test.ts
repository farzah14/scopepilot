import { describe, expect, it, vi } from 'vitest';
import {
  createClient,
  getClient,
  listClients,
  updateClient,
  archiveClient,
} from '@/clients/client-service';
import {
  createProject,
  getProject,
  listProjects,
  updateProject,
  archiveProject,
} from '@/projects/project-service';

describe('Tenant Isolation & Authorization Security Verification', () => {
  // Setup 2 distinct organizations and memberships
  // User 1 belongs ONLY to Org 1 (Role: OWNER)
  // User 2 belongs ONLY to Org 2 (Role: OWNER)
  // User Viewer belongs ONLY to Org 1 (Role: VIEWER)

  const setupMockDb = () => {
    const clients: Record<string, any> = {
      'client-org1': {
        id: 'client-org1',
        organizationId: 'org-1',
        name: 'Org 1 Client',
        archivedAt: null,
      },
      'client-org2': {
        id: 'client-org2',
        organizationId: 'org-2',
        name: 'Org 2 Client',
        archivedAt: null,
      },
    };

    const projects: Record<string, any> = {
      'proj-org1': {
        id: 'proj-org1',
        organizationId: 'org-1',
        clientId: 'client-org1',
        ownerId: 'user-1',
        name: 'Org 1 Project',
        projectType: 'WEBSITE',
        status: 'DRAFT',
      },
      'proj-org2': {
        id: 'proj-org2',
        organizationId: 'org-2',
        clientId: 'client-org2',
        ownerId: 'user-2',
        name: 'Org 2 Project',
        projectType: 'WEBSITE',
        status: 'DRAFT',
      },
    };

    const memberships: Record<string, string> = {
      'user-1:org-1': 'OWNER',
      'user-viewer-1:org-1': 'VIEWER',
      'user-2:org-2': 'OWNER',
    };

    const mockTx = {
      client: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const client = Object.values(clients).find(
            (c) =>
              c.id === where.id &&
              c.organizationId === where.organizationId &&
              (where.archivedAt === null ? c.archivedAt === null : true)
          );
          return Promise.resolve(client || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const id = `client-${Date.now()}`;
          const c = { id, ...data };
          clients[id] = c;
          return Promise.resolve(c);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          if (clients[where.id]) {
            Object.assign(clients[where.id], data);
            return Promise.resolve(clients[where.id]);
          }
          return Promise.resolve(null);
        }),
      },
      project: {
        findFirst: vi.fn().mockImplementation(({ where }) => {
          const proj = Object.values(projects).find(
            (p) => p.id === where.id && p.organizationId === where.organizationId
          );
          return Promise.resolve(proj || null);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const id = `proj-${Date.now()}`;
          const p = { id, ...data };
          projects[id] = p;
          return Promise.resolve(p);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          if (projects[where.id]) {
            Object.assign(projects[where.id], data);
            return Promise.resolve(projects[where.id]);
          }
          return Promise.resolve(null);
        }),
      },
      membership: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const key = `${where.userId_organizationId.userId}:${where.userId_organizationId.organizationId}`;
          const role = memberships[key];
          return Promise.resolve(role ? { role } : null);
        }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    return {
      membership: mockTx.membership,
      client: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          const res = Object.values(clients).filter(
            (c) => c.organizationId === where.organizationId && c.archivedAt === null
          );
          return Promise.resolve(res);
        }),
        findFirst: mockTx.client.findFirst,
      },
      project: {
        findMany: vi.fn().mockImplementation(({ where }) => {
          const res = Object.values(projects).filter(
            (p) => p.organizationId === where.organizationId
          );
          return Promise.resolve(res);
        }),
        findFirst: mockTx.project.findFirst,
      },
      $transaction: vi.fn().mockImplementation((fn) => fn(mockTx)),
      _tx: mockTx,
    };
  };

  describe('Cross-tenant Client Security Prohibitions', () => {
    it('prohibits user from reading another organization client', async () => {
      const db = setupMockDb();
      // User 1 in Org 1 tries to fetch client-org2 in Org 1 -> null / CLIENT_NOT_FOUND
      await expect(getClient(db as any, 'user-1', 'org-1', 'client-org2')).rejects.toThrow(
        'CLIENT_NOT_FOUND'
      );
    });

    it('prohibits user from updating another organization client', async () => {
      const db = setupMockDb();
      await expect(
        updateClient(db as any, 'user-1', 'org-1', 'client-org2', { name: 'Hacked Name' })
      ).rejects.toThrow('CLIENT_NOT_FOUND');
    });

    it('prohibits user from archiving another organization client', async () => {
      const db = setupMockDb();
      await expect(archiveClient(db as any, 'user-1', 'org-1', 'client-org2')).rejects.toThrow(
        'CLIENT_NOT_FOUND'
      );
    });
  });

  describe('Cross-tenant Project Security Prohibitions', () => {
    it('prohibits user from reading another organization project', async () => {
      const db = setupMockDb();
      await expect(getProject(db as any, 'user-1', 'org-1', 'proj-org2')).rejects.toThrow(
        'PROJECT_NOT_FOUND'
      );
    });

    it('prohibits user from updating another organization project', async () => {
      const db = setupMockDb();
      await expect(
        updateProject(db as any, 'user-1', 'org-1', 'proj-org2', { name: 'Hacked Project' })
      ).rejects.toThrow('PROJECT_NOT_FOUND');
    });

    it('prohibits user from archiving another organization project', async () => {
      const db = setupMockDb();
      await expect(archiveProject(db as any, 'user-1', 'org-1', 'proj-org2')).rejects.toThrow(
        'PROJECT_NOT_FOUND'
      );
    });

    it('prohibits creating a project using another organization client', async () => {
      const db = setupMockDb();
      await expect(
        createProject(db as any, 'user-1', 'org-1', {
          clientId: 'client-org2',
          ownerId: 'user-1',
          name: 'Cross Tenant Project',
          projectType: 'WEBSITE',
        })
      ).rejects.toThrow('CLIENT_NOT_FOUND');
    });

    it('prohibits assigning another organization user as project owner', async () => {
      const db = setupMockDb();
      await expect(
        createProject(db as any, 'user-1', 'org-1', {
          clientId: 'client-org1',
          ownerId: 'user-2', // User 2 is in Org 2
          name: 'Invalid Owner Project',
          projectType: 'WEBSITE',
        })
      ).rejects.toThrow('INVALID_OWNER');
    });
  });

  describe('Permission & Membership Authorization', () => {
    it('denies operation with FORBIDDEN when user lacks membership in requested org', async () => {
      const db = setupMockDb();
      await expect(listClients(db as any, 'user-stranger', 'org-1')).rejects.toThrow('FORBIDDEN');
      await expect(listProjects(db as any, 'user-stranger', 'org-1')).rejects.toThrow('FORBIDDEN');
    });

    it('denies mutation operations to VIEWER role with FORBIDDEN', async () => {
      const db = setupMockDb();
      await expect(
        createClient(db as any, 'user-viewer-1', 'org-1', { name: 'New Client' })
      ).rejects.toThrow('FORBIDDEN');
      await expect(
        createProject(db as any, 'user-viewer-1', 'org-1', {
          clientId: 'client-org1',
          ownerId: 'user-1',
          name: 'New Project',
          projectType: 'WEBSITE',
        })
      ).rejects.toThrow('FORBIDDEN');
    });
  });

  describe('Atomic Audit Logging', () => {
    it('creates AuditEvent atomically inside transaction on client create', async () => {
      const db = setupMockDb();
      await createClient(db as any, 'user-1', 'org-1', { name: 'New Client' });

      expect(db._tx.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          actorId: 'user-1',
          action: 'client.created',
          objectType: 'Client',
        }),
      });
    });

    it('creates AuditEvent atomically inside transaction on project create', async () => {
      const db = setupMockDb();
      await createProject(db as any, 'user-1', 'org-1', {
        clientId: 'client-org1',
        ownerId: 'user-1',
        name: 'New Project',
        projectType: 'WEBSITE',
      });

      expect(db._tx.auditEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: 'org-1',
          actorId: 'user-1',
          action: 'project.created',
          objectType: 'Project',
        }),
      });
    });
  });
});
