import NextAuth, { type AuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';
import { db } from '@/db/client';
import { verifyPassword } from '@/auth/password';

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(db as any),
  session: { strategy: 'database' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const parsed = z.object({ email: z.string().email(), password: z.string() }).safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
        return user?.passwordHash && (await verifyPassword(user.passwordHash, parsed.data.password)) ? user : null;
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export const handlers = {
  GET: handler,
  POST: handler,
};

export { handler as auth, handler as signIn, handler as signOut };
