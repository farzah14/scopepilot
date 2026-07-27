import { redirect, notFound, forbidden } from 'next/navigation';
import {
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
} from '@/errors/domain-errors';

export function handlePageError(error: unknown): never {
  if (error instanceof UnauthenticatedError) {
    redirect('/api/auth/signin');
  }

  if (error instanceof ForbiddenError) {
    forbidden();
  }

  if (error instanceof NotFoundError) {
    notFound();
  }

  throw error;
}
