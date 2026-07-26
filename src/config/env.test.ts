import { expect, it } from 'vitest';
import { parseEnv } from './env';

it('rejects malformed configuration', () => {
  expect(() => parseEnv({ DATABASE_URL: 'x', AUTH_SECRET: 'short' })).toThrow();
});

it('accepts complete local configuration', () => {
  expect(
    parseEnv({
      DATABASE_URL: 'postgresql://scopepilot:scopepilot@localhost:5432/scopepilot',
      AUTH_SECRET: '01234567890123456789012345678901',
      NODE_ENV: 'test',
    }).NODE_ENV
  ).toBe('test');
});
