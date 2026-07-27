export type Role = 'OWNER' | 'ADMIN' | 'SALES' | 'PROJECT_MANAGER' | 'CONTRIBUTOR' | 'VIEWER';
export type Permission = 'members:manage' | 'clients:write' | 'pricing:write' | 'proposals:send' | 'records:view';

const grants: Record<Role, ReadonlySet<Permission>> = {
  OWNER: new Set(['members:manage', 'clients:write', 'pricing:write', 'proposals:send', 'records:view']),
  ADMIN: new Set(['members:manage', 'clients:write', 'pricing:write', 'proposals:send', 'records:view']),
  SALES: new Set(['clients:write', 'pricing:write', 'proposals:send', 'records:view']),
  PROJECT_MANAGER: new Set(['clients:write', 'records:view']),
  CONTRIBUTOR: new Set(['clients:write', 'records:view']),
  VIEWER: new Set(['records:view']),
};

export const can = (role: Role, permission: Permission): boolean => grants[role]?.has(permission) ?? false;
