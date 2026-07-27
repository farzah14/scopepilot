import { can, type Permission, type Role } from './roles';
import { ForbiddenError } from '@/errors/domain-errors';

export async function requireMembership(db: any, userId: string, organizationId: string, permission: Permission) {
  const membership = await db.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId } },
    select: { role: true },
  });

  if (!membership || !can(membership.role as Role, permission)) {
    throw new ForbiddenError(`User lacks permission ${permission} in organization ${organizationId}`);
  }

  return membership;
}
