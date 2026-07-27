import { expect, it } from 'vitest';
import { can } from './roles';

it('grants and restricts permissions correctly across all roles', () => {
  expect(can('OWNER', 'members:manage')).toBe(true);
  expect(can('ADMIN', 'members:manage')).toBe(true);
  expect(can('SALES', 'members:manage')).toBe(false);
  expect(can('SALES', 'pricing:write')).toBe(true);
  expect(can('PROJECT_MANAGER', 'pricing:write')).toBe(false);
  expect(can('PROJECT_MANAGER', 'clients:write')).toBe(true);
  expect(can('CONTRIBUTOR', 'clients:write')).toBe(true);
  expect(can('VIEWER', 'clients:write')).toBe(false);
  expect(can('VIEWER', 'records:view')).toBe(true);
});
