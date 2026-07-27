import { z } from 'zod';

const optionalInt = z
  .number()
  .int()
  .nonnegative()
  .optional()
  .or(z.nan().transform(() => undefined));

const optionalDate = z
  .union([z.date(), z.string().datetime(), z.string().length(0)])
  .optional()
  .transform((val) => {
    if (!val || val === '') return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  });

export const createProjectInput = z
  .object({
    clientId: z.string().min(1, 'Client ID is required'),
    ownerId: z.string().min(1, 'Owner ID is required'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160, 'Name must not exceed 160 characters'),
    projectType: z.string().trim().min(1, 'Project type is required').max(100),
    budgetMinCents: optionalInt,
    budgetMaxCents: optionalInt,
    targetStartAt: optionalDate,
    targetEndAt: optionalDate,
  })
  .refine(
    (data) => {
      if (data.budgetMinCents !== undefined && data.budgetMaxCents !== undefined) {
        return data.budgetMinCents <= data.budgetMaxCents;
      }
      return true;
    },
    { message: 'Minimum budget cannot exceed maximum budget', path: ['budgetMinCents'] }
  )
  .refine(
    (data) => {
      if (data.targetStartAt && data.targetEndAt) {
        return data.targetStartAt <= data.targetEndAt;
      }
      return true;
    },
    { message: 'Target start date cannot be after target end date', path: ['targetStartAt'] }
  );

export const updateProjectInput = z
  .object({
    ownerId: z.string().min(1).optional(),
    name: z.string().trim().min(2).max(160).optional(),
    projectType: z.string().trim().min(1).max(100).optional(),
    budgetMinCents: optionalInt,
    budgetMaxCents: optionalInt,
    targetStartAt: optionalDate,
    targetEndAt: optionalDate,
  })
  .refine(
    (data) => {
      if (data.budgetMinCents !== undefined && data.budgetMaxCents !== undefined) {
        return data.budgetMinCents <= data.budgetMaxCents;
      }
      return true;
    },
    { message: 'Minimum budget cannot exceed maximum budget', path: ['budgetMinCents'] }
  )
  .refine(
    (data) => {
      if (data.targetStartAt && data.targetEndAt) {
        return data.targetStartAt <= data.targetEndAt;
      }
      return true;
    },
    { message: 'Target start date cannot be after target end date', path: ['targetStartAt'] }
  );

export type CreateProjectInput = z.infer<typeof createProjectInput>;
export type UpdateProjectInput = z.infer<typeof updateProjectInput>;
