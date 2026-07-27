import { expect, it, vi } from 'vitest';
import { registerUser } from './register';

it('normalizes email before create', async () => {
  const create = vi.fn().mockResolvedValue({ id: 'u1' });
  await registerUser({ user: { create } } as never, { name: 'Owner', email: ' OWNER@EXAMPLE.COM ', password: 'correct horse battery staple' });
  expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ email: 'owner@example.com' }) });
});
