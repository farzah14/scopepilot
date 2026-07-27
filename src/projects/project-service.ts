import { requireMembership } from '@/auth/require-membership';
import { createProjectInput, updateProjectInput } from './project-schema';
import { canTransitionProject, type ProjectStatus } from './project-status';

export async function listProjects(
  db: any,
  userId: string,
  organizationId: string,
  filter?: { clientId?: string }
) {
  await requireMembership(db, userId, organizationId, 'records:view');
  const where: any = { organizationId };
  if (filter?.clientId) {
    where.clientId = filter.clientId;
  }

  return db.project.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      client: {
        select: { id: true, name: true, contactName: true, email: true },
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getProject(
  db: any,
  userId: string,
  organizationId: string,
  projectId: string
) {
  await requireMembership(db, userId, organizationId, 'records:view');
  const project = await db.project.findFirst({
    where: { id: projectId, organizationId },
    include: {
      client: {
        select: { id: true, name: true, contactName: true, email: true, phone: true, industry: true },
      },
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!project) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  return project;
}

export async function createProject(
  db: any,
  userId: string,
  organizationId: string,
  input: unknown
) {
  await requireMembership(db, userId, organizationId, 'clients:write');
  const data = createProjectInput.parse(input);

  return db.$transaction(async (tx: any) => {
    // 1. Verify client belongs to same organization and is active
    const client = await tx.client.findFirst({
      where: { id: data.clientId, organizationId, archivedAt: null },
    });

    if (!client) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    // 2. Verify assigned owner has membership in organization
    const ownerMembership = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: data.ownerId,
          organizationId,
        },
      },
    });

    if (!ownerMembership) {
      throw new Error('INVALID_OWNER');
    }

    // 3. Create project
    const project = await tx.project.create({
      data: {
        organizationId,
        clientId: data.clientId,
        ownerId: data.ownerId,
        name: data.name,
        projectType: data.projectType,
        status: 'DRAFT',
        budgetMinCents: data.budgetMinCents ?? null,
        budgetMaxCents: data.budgetMaxCents ?? null,
        targetStartAt: data.targetStartAt ?? null,
        targetEndAt: data.targetEndAt ?? null,
      },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    // 4. Create atomic audit event
    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'project.created',
        objectType: 'Project',
        objectId: project.id,
        metadata: { name: project.name, clientId: project.clientId, ownerId: project.ownerId },
      },
    });

    return project;
  });
}

export async function updateProject(
  db: any,
  userId: string,
  organizationId: string,
  projectId: string,
  input: unknown
) {
  await requireMembership(db, userId, organizationId, 'clients:write');
  const data = updateProjectInput.parse(input);

  return db.$transaction(async (tx: any) => {
    const existing = await tx.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    if (data.ownerId && data.ownerId !== existing.ownerId) {
      const ownerMembership = await tx.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: data.ownerId,
            organizationId,
          },
        },
      });

      if (!ownerMembership) {
        throw new Error('INVALID_OWNER');
      }
    }

    const updated = await tx.project.update({
      where: { id: projectId },
      data,
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'project.updated',
        objectType: 'Project',
        objectId: projectId,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  });
}

export async function transitionProjectStatus(
  db: any,
  userId: string,
  organizationId: string,
  projectId: string,
  toStatus: ProjectStatus
) {
  await requireMembership(db, userId, organizationId, 'clients:write');

  return db.$transaction(async (tx: any) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new Error('PROJECT_NOT_FOUND');
    }

    if (!canTransitionProject(project.status, toStatus)) {
      throw new Error('INVALID_PROJECT_TRANSITION');
    }

    const updated = await tx.project.update({
      where: { id: projectId },
      data: { status: toStatus },
      include: {
        client: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'project.status_changed',
        objectType: 'Project',
        objectId: projectId,
        metadata: { from: project.status, to: toStatus },
      },
    });

    return updated;
  });
}

export async function archiveProject(
  db: any,
  userId: string,
  organizationId: string,
  projectId: string
) {
  return transitionProjectStatus(db, userId, organizationId, projectId, 'ARCHIVED');
}
