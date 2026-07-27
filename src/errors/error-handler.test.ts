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
}));

describe('error-handler', () => {
  it('redirects to signin for UnauthenticatedError', () => {
    expect(() => handlePageError(new UnauthenticatedError())).toThrow('REDIRECT:/api/auth/signin');
  });

  it('calls notFound() for NotFoundError subclasses', () => {
    expect(() => handlePageError(new NotFoundError())).toThrow('NEXT_NOT_FOUND');
    expect(() => handlePageError(new ClientNotFoundError())).toThrow('NEXT_NOT_FOUND');
    expect(() => handlePageError(new ProjectNotFoundError())).toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound() for ForbiddenError', () => {
    expect(() => handlePageError(new ForbiddenError())).toThrow('NEXT_NOT_FOUND');
  });

  it('rethrows unexpected runtime or database errors', () => {
    const error = new Error('Database connection failed');
    expect(() => handlePageError(error)).toThrow('Database connection failed');
  });
});
