import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),
  APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export function parseEnv(input: Record<string, string | undefined>) {
  return schema.parse(input);
}

let cachedEnv: z.infer<typeof schema> | undefined;
export const env = new Proxy({} as z.infer<typeof schema>, {
  get(_target, prop) {
    if (!cachedEnv) {
      cachedEnv = parseEnv(process.env);
    }
    return cachedEnv[prop as keyof z.infer<typeof schema>];
  },
});
