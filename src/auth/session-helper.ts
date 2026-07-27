import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { UnauthenticatedError, ForbiddenError } from '@/errors/domain-errors';
import { requireMembership } from '@/auth/require-membership';
import type { PrismaClient } from '@/generated/prisma/client';
import type { Permission } from '@/auth/roles';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceContext {
  userId: string;
  organizationId: string;
  role: string;
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    throw new UnauthenticatedError();
  }
  return {
    id: session.user.id,
    name: session.user.name || '',
    email: session.user.email || '',
  };
}

export async function getWorkspaceContext(
  db: PrismaClient | any,
  userId: string,
  preferredOrgId?: string,
  requiredPermission: Permission = 'records:view'
): Promise<WorkspaceContext> {
  if (preferredOrgId) {
    const membership = await requireMembership(db, userId, preferredOrgId, requiredPermission);
    return {
      userId,
      organizationId: preferredOrgId,
      role: membership.role,
    };
  }

  const memberships = await db.membership.findMany({
    where: { userId },
  });

  if (memberships.length === 0) {
    throw new ForbiddenError('User has no workspace memberships');
  }

  if (memberships.length > 1) {
    throw new ForbiddenError('Multiple workspaces available. Explicit organization ID required');
  }

  const membership = memberships[0];
  await requireMembership(db, userId, membership.organizationId, requiredPermission);

  return {
    userId,
    organizationId: membership.organizationId,
    role: membership.role,
  };
}
