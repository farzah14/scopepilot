import { requireMembership } from '@/auth/require-membership';
import { createProjectInput, updateProjectInput } from './project-schema';
import { canTransitionProject, type ProjectStatus } from './project-status';
import {
  ProjectNotFoundError,
  ClientNotFoundError,
  InvalidInputError,
  InvalidOwnerError,
  InvalidStateTransitionError,
} from '@/errors/domain-errors';

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
    throw new ProjectNotFoundError();
  }

  return project;
}

export async function createProject(
  db: any,
  userId: string,
  organizationId: string,
  input: unknown
) {
  await requireMembership(db, userId, organizationId, 'projects:write');
  const data = createProjectInput.parse(input);

  return db.$transaction(async (tx: any) => {
    const client = await tx.client.findFirst({
      where: { id: data.clientId, organizationId, archivedAt: null },
    });

    if (!client) {
      throw new ClientNotFoundError();
    }

    const ownerMembership = await tx.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: data.ownerId,
          organizationId,
        },
      },
    });

    if (!ownerMembership) {
      throw new InvalidOwnerError();
    }

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
  await requireMembership(db, userId, organizationId, 'projects:write');
  const data = updateProjectInput.parse(input);

  return db.$transaction(async (tx: any) => {
    const existing = await tx.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!existing) {
      throw new ProjectNotFoundError();
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
        throw new InvalidOwnerError();
      }
    }

    // Merge existing values with partial update fields before invariant checks
    const mergedMin = data.budgetMinCents !== undefined ? data.budgetMinCents : existing.budgetMinCents;
    const mergedMax = data.budgetMaxCents !== undefined ? data.budgetMaxCents : existing.budgetMaxCents;
    if (mergedMin !== null && mergedMin !== undefined && mergedMax !== null && mergedMax !== undefined) {
      if (mergedMin > mergedMax) {
        throw new InvalidInputError('budgetMinCents cannot exceed budgetMaxCents');
      }
    }

    const mergedStart = data.targetStartAt !== undefined ? data.targetStartAt : existing.targetStartAt;
    const mergedEnd = data.targetEndAt !== undefined ? data.targetEndAt : existing.targetEndAt;
    if (mergedStart !== null && mergedStart !== undefined && mergedEnd !== null && mergedEnd !== undefined) {
      if (new Date(mergedStart) > new Date(mergedEnd)) {
        throw new InvalidInputError('targetStartAt cannot be after targetEndAt');
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
  await requireMembership(db, userId, organizationId, 'projects:write');

  return db.$transaction(async (tx: any) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, organizationId },
    });

    if (!project) {
      throw new ProjectNotFoundError();
    }

    if (!canTransitionProject(project.status, toStatus)) {
      throw new InvalidStateTransitionError(
        `Cannot transition project status from ${project.status} to ${toStatus}`
      );
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
