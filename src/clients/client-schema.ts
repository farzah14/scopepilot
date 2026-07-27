import { z } from 'zod';

const optionalString = (maxLen: number) =>
  z
    .string()
    .trim()
    .max(maxLen)
    .optional()
    .transform((val) => (val === '' || val === undefined ? undefined : val));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .optional()
  .transform((val) => (val === '' || val === undefined ? undefined : val))
  .pipe(z.string().email().optional());

export const clientInput = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(160, 'Name must not exceed 160 characters'),
  contactName: optionalString(120),
  email: optionalEmail,
  phone: optionalString(40),
  industry: optionalString(100),
  notes: optionalString(5000),
});

export const updateClientInput = clientInput.partial();

export type ClientInput = z.infer<typeof clientInput>;
export type UpdateClientInput = z.infer<typeof updateClientInput>;
