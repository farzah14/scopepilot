import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

it('contains the product name', async () => {
  expect(await readFile('src/app/page.tsx', 'utf8')).toContain('ScopePilot');
});
