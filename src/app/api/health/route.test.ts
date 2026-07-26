import { expect, it, vi } from 'vitest';

vi.mock('../../../db/client', () => ({
  db: { $queryRaw: vi.fn().mockResolvedValue([{ ok: 1 }]) },
}));

import { GET } from './route';

it('returns HTTP 200 when database is healthy', async () => {
  const res = await GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: 'ok', database: 'ok' });
});
