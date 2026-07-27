import { describe, expect, it, vi } from 'vitest';
import { handlePageError } from '@/errors/error-handler';
import {
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  ClientNotFoundError,
  ProjectNotFoundError,
} from '@/errors/domain-errors';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  forbidden: vi.fn(() => {
    throw new Error('NEXT_FORBIDDEN');
  }),
}));

describe('error-handler', () => {
  it('redirects to signin for UnauthenticatedError', () => {
    expect(() => handlePageError(new UnauthenticatedError())).toThrow('REDIRECT:/api/auth/signin');
  });

  it('1. maps insufficient role permission (ForbiddenError) to HTTP 403 (forbidden())', () => {
    const error = new ForbiddenError('User lacks permission clients:write in organization org-1');
    expect(() => handlePageError(error)).toThrow('NEXT_FORBIDDEN');
  });

  it('2. maps missing workspace membership (ForbiddenError) to HTTP 403 (forbidden())', () => {
    const error = new ForbiddenError('User has no workspace memberships');
    expect(() => handlePageError(error)).toThrow('NEXT_FORBIDDEN');
  });

  it('3. maps absent tenant-scoped client (ClientNotFoundError) to HTTP 404 (notFound())', () => {
    expect(() => handlePageError(new ClientNotFoundError())).toThrow('NEXT_NOT_FOUND');
  });

  it('4. maps absent tenant-scoped project (ProjectNotFoundError) to HTTP 404 (notFound())', () => {
    expect(() => handlePageError(new ProjectNotFoundError())).toThrow('NEXT_NOT_FOUND');
  });

  it('5. rethrows unexpected database or runtime errors', () => {
    const error = new Error('Database connection failed');
    expect(() => handlePageError(error)).toThrow('Database connection failed');
  });
});
