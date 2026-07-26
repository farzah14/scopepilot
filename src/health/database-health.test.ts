import { expect, it, vi } from 'vitest';
import { checkDatabaseHealth } from './database-health';

it('returns healthy after a successful query', async () => {
  await expect(checkDatabaseHealth({ $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) })).resolves.toEqual({ ok: true });
});
