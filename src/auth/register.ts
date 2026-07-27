import { z } from 'zod';
import { hashPassword } from './password';

const schema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128),
});

export async function registerUser(db: any, input: unknown) {
  const data = schema.parse(input);
  const passwordHash = await hashPassword(data.password);
  return db.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
    },
  });
}
