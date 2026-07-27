import { expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

it('accepts the correct password only', async () => {
  const hash = await hashPassword('correct horse battery staple');
  await expect(verifyPassword(hash, 'correct horse battery staple')).resolves.toBe(true);
  await expect(verifyPassword(hash, 'wrong password')).resolves.toBe(false);
});

it('rejects passwords shorter than 12 characters', async () => {
  await expect(hashPassword('short')).rejects.toThrow('PASSWORD_TOO_SHORT');
});
