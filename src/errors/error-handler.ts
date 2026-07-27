import { redirect, notFound } from 'next/navigation';
import {
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  DomainError,
} from '@/errors/domain-errors';

export function handlePageError(error: unknown): never {
  if (error instanceof UnauthenticatedError) {
    redirect('/api/auth/signin');
  }

  if (error instanceof NotFoundError || error instanceof ForbiddenError) {
    notFound();
  }

  throw error;
}
