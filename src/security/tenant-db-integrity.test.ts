import { describe, expect, it, vi } from 'vitest';
import { createProject } from '@/projects/project-service';
import { ClientNotFoundError, InvalidInputError } from '@/errors/domain-errors';

describe('Database Tenant Integrity Constraints', () => {
  it('prevents project creation when client belongs to a different organization', async () => {
    const mockTx = {
      client: {
        findFirst: vi.fn().mockResolvedValue(null), // Client not found in org-1
      },
    };

    const mockDb = {
      membership: {
        findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      $transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    };

    await expect(
      createProject(mockDb as any, 'user-1', 'org-1', {
        clientId: 'client-from-org-2',
        ownerId: 'user-1',
        name: 'Cross Tenant Project',
        projectType: 'WEBSITE',
      })
    ).rejects.toThrow(ClientNotFoundError);
  });

  it('prevents project creation when owner has no membership in organization', async () => {
    const mockTx = {
      client: {
        findFirst: vi.fn().mockResolvedValue({ id: 'client-1', organizationId: 'org-1' }),
      },
      membership: {
        findUnique: vi.fn().mockResolvedValue(null), // Owner has no membership in org-1
      },
    };

    const mockDb = {
      membership: {
        findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }),
      },
      $transaction: vi.fn().mockImplementation((cb) => cb(mockTx)),
    };

    await expect(
      createProject(mockDb as any, 'user-1', 'org-1', {
        clientId: 'client-1',
        ownerId: 'user-outside-org',
        name: 'Non Member Owner Project',
        projectType: 'WEBSITE',
      })
    ).rejects.toThrow(InvalidInputError);
  });
});
