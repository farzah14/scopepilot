import { describe, expect, it, vi } from 'vitest';
import { createClient, listClients, getClient, updateClient, archiveClient } from './client-service';

describe('Client Service', () => {
  const mockDb = (membershipRole: string | null = 'OWNER') => {
    const mockTx = {
      client: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'client-1', ...data })),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 'client-1' && where.organizationId === 'org-1' && where.archivedAt === null) {
            return Promise.resolve({ id: 'client-1', organizationId: 'org-1', name: 'Acme', archivedAt: null, projects: [] });
          }
          return Promise.resolve(null);
        }),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'client-1', name: 'Acme Updated', ...data })),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };

    return {
      membership: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (membershipRole && where.userId_organizationId.userId === 'user-1' && where.userId_organizationId.organizationId === 'org-1') {
            return Promise.resolve({ role: membershipRole });
          }
          if (membershipRole && where.userId_organizationId.userId === 'user-viewer' && where.userId_organizationId.organizationId === 'org-1') {
            return Promise.resolve({ role: 'VIEWER' });
          }
          return Promise.resolve(null);
        }),
      },
      client: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'client-1', organizationId: 'org-1', name: 'Acme', archivedAt: null },
        ]),
        findFirst: mockTx.client.findFirst,
      },
      $transaction: vi.fn().mockImplementation((callback) => callback(mockTx)),
      _tx: mockTx,
    };
  };

  it('lists clients filtered strictly by organizationId', async () => {
    const db = mockDb();
    const result = await listClients(db as any, 'user-1', 'org-1');
    expect(db.client.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-1', archivedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { projects: true } } },
    });
    expect(result).toHaveLength(1);
  });

  it('throws FORBIDDEN if user has no membership in organization', async () => {
    const db = mockDb(null);
    await expect(listClients(db as any, 'user-stranger', 'org-1')).rejects.toThrow('FORBIDDEN');
  });

  it('allows VIEWER to list and get clients but throws FORBIDDEN on create/update/archive', async () => {
    const db = mockDb('VIEWER');
    await expect(listClients(db as any, 'user-viewer', 'org-1')).resolves.toBeDefined();
    await expect(createClient(db as any, 'user-viewer', 'org-1', { name: 'Test' })).rejects.toThrow('FORBIDDEN');
    await expect(updateClient(db as any, 'user-viewer', 'org-1', 'client-1', { name: 'Test' })).rejects.toThrow('FORBIDDEN');
    await expect(archiveClient(db as any, 'user-viewer', 'org-1', 'client-1')).rejects.toThrow('FORBIDDEN');
  });

  it('creates client and atomic audit event in transaction', async () => {
    const db = mockDb();
    const client = await createClient(db as any, 'user-1', 'org-1', {
      name: 'Acme Corp',
      email: 'info@acme.com',
    });

    expect(client.name).toBe('Acme Corp');
    expect(db._tx.client.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        name: 'Acme Corp',
        email: 'info@acme.com',
      }),
    });
    expect(db._tx.auditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: 'org-1',
        actorId: 'user-1',
        action: 'client.created',
        objectType: 'Client',
        objectId: 'client-1',
      }),
    });
  });

  it('throws CLIENT_NOT_FOUND when updating or archiving non-existent or wrong tenant client', async () => {
    const db = mockDb();
    await expect(updateClient(db as any, 'user-1', 'org-1', 'client-wrong', { name: 'New Name' })).rejects.toThrow('CLIENT_NOT_FOUND');
    await expect(archiveClient(db as any, 'user-1', 'org-1', 'client-wrong')).rejects.toThrow('CLIENT_NOT_FOUND');
  });
});
