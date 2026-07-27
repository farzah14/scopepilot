import { describe, expect, it, vi, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://scopepilot:scopepilot@localhost:5432/scopepilot_test';
  process.env.AUTH_SECRET = process.env.AUTH_SECRET || '01234567890123456789012345678901';
  process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || '01234567890123456789012345678901';
});

import { db } from '@/db/client';
import { authOptions } from '@/auth';
import { hashPassword } from '@/auth/password';

describe('NextAuth Credentials & Session Strategy', () => {
  it('uses strategy jwt in session configuration', () => {
    expect(authOptions.session?.strategy).toBe('jwt');
  });

  it('authorizes valid credentials with email normalization', async () => {
    const password = 'validPassword123!';
    const passwordHash = await hashPassword(password);
    const mockUser = {
      id: 'usr-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      passwordHash,
    };

    const provider = authOptions.providers[0] as any;
    const authorizeFn = provider.options.authorize;

    const mockFindUnique = vi.fn().mockResolvedValue(mockUser as any);
    Object.defineProperty(db, 'user', {
      value: { findUnique: mockFindUnique },
      configurable: true,
      writable: true,
    });

    const authorized = await authorizeFn(
      {
        email: ' JANE@EXAMPLE.COM ',
        password,
      },
      {} as any
    );

    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'jane@example.com' } });
    expect(authorized).toEqual({
      id: 'usr-123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      image: undefined,
    });
    expect((authorized as any).passwordHash).toBeUndefined();
  });

  it('rejects invalid password or missing user', async () => {
    const provider = authOptions.providers[0] as any;
    const authorizeFn = provider.options.authorize;

    const mockFindUnique = vi.fn().mockResolvedValue(null);
    Object.defineProperty(db, 'user', {
      value: { findUnique: mockFindUnique },
      configurable: true,
      writable: true,
    });

    const result = await authorizeFn(
      {
        email: 'nobody@example.com',
        password: 'wrongpassword',
      },
      {} as any
    );

    expect(result).toBeNull();
  });

  it('propagates user ID into JWT token', async () => {
    const jwtCallback = authOptions.callbacks?.jwt;
    expect(jwtCallback).toBeDefined();

    const token = await jwtCallback!({
      token: { sub: 'usr-123' } as any,
      user: { id: 'usr-123', email: 'jane@example.com', name: 'Jane' },
    } as any);

    expect(token.id).toBe('usr-123');
  });

  it('propagates user ID into Session user object', async () => {
    const sessionCallback = authOptions.callbacks?.session;
    expect(sessionCallback).toBeDefined();

    const session = await sessionCallback!({
      session: { user: { email: 'jane@example.com', name: 'Jane' } } as any,
      token: { id: 'usr-123' } as any,
    } as any);

    expect((session as any)?.user?.id).toBe('usr-123');
    expect(((session as any)?.user)?.passwordHash).toBeUndefined();
  });
});
