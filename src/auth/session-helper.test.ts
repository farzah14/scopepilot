import { describe, expect, it, vi } from 'vitest';

vi.mock('next-auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next-auth')>();
  return {
    ...actual,
    default: vi.fn(),
    getServerSession: vi.fn(),
  };
});

import { requireAuthenticatedUser, getWorkspaceContext } from '@/auth/session-helper';
import { UnauthenticatedError, ForbiddenError } from '@/errors/domain-errors';
import { getServerSession } from 'next-auth';

describe('session-helper', () => {
  describe('requireAuthenticatedUser', () => {
    it('returns authenticated user when session is valid', async () => {
      vi.mocked(getServerSession).mockResolvedValue({
        user: { id: 'usr-1', name: 'Alice', email: 'alice@example.com' },
      } as any);

      const user = await requireAuthenticatedUser();
      expect(user).toEqual({ id: 'usr-1', name: 'Alice', email: 'alice@example.com' });
    });

    it('throws UnauthenticatedError when session is missing or user ID is absent', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);
      await expect(requireAuthenticatedUser()).rejects.toThrow(UnauthenticatedError);

      vi.mocked(getServerSession).mockResolvedValue({ user: {} } as any);
      await expect(requireAuthenticatedUser()).rejects.toThrow(UnauthenticatedError);
    });
  });

  describe('getWorkspaceContext', () => {
    it('returns workspace context when preferredOrgId is provided and membership is valid', async () => {
      const mockDb = {
        membership: {
          findUnique: vi.fn().mockResolvedValue({
            userId: 'usr-1',
            organizationId: 'org-1',
            role: 'OWNER',
          }),
        },
      } as any;

      const context = await getWorkspaceContext(mockDb, 'usr-1', 'org-1');
      expect(context).toEqual({
        userId: 'usr-1',
        organizationId: 'org-1',
        role: 'OWNER',
      });
    });

    it('returns single workspace membership when no preferredOrgId is passed', async () => {
      const mockDb = {
        membership: {
          findMany: vi.fn().mockResolvedValue([
            { userId: 'usr-1', organizationId: 'org-1', role: 'ADMIN' },
          ]),
          findUnique: vi.fn().mockResolvedValue({
            userId: 'usr-1',
            organizationId: 'org-1',
            role: 'ADMIN',
          }),
        },
      } as any;

      const context = await getWorkspaceContext(mockDb, 'usr-1');
      expect(context).toEqual({
        userId: 'usr-1',
        organizationId: 'org-1',
        role: 'ADMIN',
      });
    });

    it('throws ForbiddenError when user has multiple workspaces and no preferredOrgId is specified', async () => {
      const mockDb = {
        membership: {
          findMany: vi.fn().mockResolvedValue([
            { userId: 'usr-1', organizationId: 'org-1', role: 'ADMIN' },
            { userId: 'usr-1', organizationId: 'org-2', role: 'VIEWER' },
          ]),
        },
      } as any;

      await expect(getWorkspaceContext(mockDb, 'usr-1')).rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError when user has no memberships', async () => {
      const mockDb = {
        membership: {
          findMany: vi.fn().mockResolvedValue([]),
        },
      } as any;

      await expect(getWorkspaceContext(mockDb, 'usr-1')).rejects.toThrow(ForbiddenError);
    });
  });
});
