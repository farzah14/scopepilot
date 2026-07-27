import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(2).max(120),
});

const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export async function createOrganization(db: any, userId: string, input: unknown) {
  const data = schema.parse(input);
  return db.$transaction(async (tx: any) => {
    const organization = await tx.organization.create({
      data: {
        name: data.name,
        slug: slugify(data.name),
      },
    });

    await tx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: 'OWNER',
      },
    });

    return organization;
  });
}
