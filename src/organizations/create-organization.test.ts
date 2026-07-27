import { expect, it, vi } from 'vitest';
import { createOrganization } from './create-organization';

it('creates owner membership atomically', async () => {
  const transaction = vi.fn(async (fn) =>
    fn({
      organization: { create: vi.fn().mockResolvedValue({ id: 'o1', name: 'Acme', slug: 'acme' }) },
      membership: { create: vi.fn().mockResolvedValue({ id: 'm1', userId: 'u1', organizationId: 'o1', role: 'OWNER' }) },
    })
  );
  await expect(createOrganization({ $transaction: transaction } as never, 'u1', { name: 'Acme' })).resolves.toMatchObject({
    id: 'o1',
    slug: 'acme',
  });
});
