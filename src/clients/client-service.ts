import { requireMembership } from '@/auth/require-membership';
import { clientInput, updateClientInput } from './client-schema';

export async function listClients(db: any, userId: string, organizationId: string) {
  await requireMembership(db, userId, organizationId, 'records:view');
  return db.client.findMany({
    where: { organizationId, archivedAt: null },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: {
        select: { projects: true },
      },
    },
  });
}

export async function getClient(db: any, userId: string, organizationId: string, clientId: string) {
  await requireMembership(db, userId, organizationId, 'records:view');
  const client = await db.client.findFirst({
    where: { id: clientId, organizationId, archivedAt: null },
    include: {
      projects: {
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND');
  }

  return client;
}

export async function createClient(db: any, userId: string, organizationId: string, input: unknown) {
  await requireMembership(db, userId, organizationId, 'clients:write');
  const data = clientInput.parse(input);

  return db.$transaction(async (tx: any) => {
    const client = await tx.client.create({
      data: {
        organizationId,
        ...data,
      },
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'client.created',
        objectType: 'Client',
        objectId: client.id,
        metadata: { name: client.name },
      },
    });

    return client;
  });
}

export async function updateClient(
  db: any,
  userId: string,
  organizationId: string,
  clientId: string,
  input: unknown
) {
  await requireMembership(db, userId, organizationId, 'clients:write');
  const data = updateClientInput.parse(input);

  return db.$transaction(async (tx: any) => {
    const existing = await tx.client.findFirst({
      where: { id: clientId, organizationId, archivedAt: null },
    });

    if (!existing) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const updated = await tx.client.update({
      where: { id: clientId },
      data,
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'client.updated',
        objectType: 'Client',
        objectId: clientId,
        metadata: { updatedFields: Object.keys(data) },
      },
    });

    return updated;
  });
}

export async function archiveClient(db: any, userId: string, organizationId: string, clientId: string) {
  await requireMembership(db, userId, organizationId, 'clients:write');

  return db.$transaction(async (tx: any) => {
    const existing = await tx.client.findFirst({
      where: { id: clientId, organizationId, archivedAt: null },
    });

    if (!existing) {
      throw new Error('CLIENT_NOT_FOUND');
    }

    const archived = await tx.client.update({
      where: { id: clientId },
      data: { archivedAt: new Date() },
    });

    await tx.auditEvent.create({
      data: {
        organizationId,
        actorId: userId,
        action: 'client.archived',
        objectType: 'Client',
        objectId: clientId,
      },
    });

    return archived;
  });
}
