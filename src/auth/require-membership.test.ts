import { expect, it, vi } from 'vitest';
import { requireMembership } from './require-membership';

it('rejects an unauthorized viewer', async () => {
  const db = { membership: { findUnique: vi.fn().mockResolvedValue({ role: 'VIEWER' }) } };
  await expect(requireMembership(db as never, 'u1', 'org1', 'members:manage')).rejects.toThrow('FORBIDDEN');
});

it('allows an authorized owner', async () => {
  const db = { membership: { findUnique: vi.fn().mockResolvedValue({ role: 'OWNER' }) } };
  await expect(requireMembership(db as never, 'u1', 'org1', 'members:manage')).resolves.toEqual({ role: 'OWNER' });
});

it('rejects when membership does not exist', async () => {
  const db = { membership: { findUnique: vi.fn().mockResolvedValue(null) } };
  await expect(requireMembership(db as never, 'u1', 'org1', 'records:view')).rejects.toThrow('FORBIDDEN');
});
