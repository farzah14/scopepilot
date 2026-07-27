export class DomainError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'DOMAIN_ERROR', statusCode: number = 400) {
    const fullMessage = message.includes(code) ? message : `${code}: ${message}`;
    super(fullMessage);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied for requested resource') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
    super(message, code, 404);
  }
}

export class ClientNotFoundError extends NotFoundError {
  constructor(message: string = 'Client not found') {
    super(message, 'CLIENT_NOT_FOUND');
  }
}

export class ProjectNotFoundError extends NotFoundError {
  constructor(message: string = 'Project not found') {
    super(message, 'PROJECT_NOT_FOUND');
  }
}

export class InvalidInputError extends DomainError {
  constructor(message: string = 'Invalid input parameters', code: string = 'INVALID_INPUT') {
    super(message, code, 400);
  }
}

export class InvalidOwnerError extends InvalidInputError {
  constructor(message: string = 'Owner does not belong to organization') {
    super(message, 'INVALID_OWNER');
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(message: string = 'Invalid project status transition') {
    super(message, 'INVALID_PROJECT_TRANSITION', 400);
  }
}
