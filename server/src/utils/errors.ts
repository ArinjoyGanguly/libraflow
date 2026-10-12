/**
 * Custom base Application Error class.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 500, details?: unknown, isOperational: boolean = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', details?: unknown) {
    super(message, 400, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: unknown) {
    super(message, 401, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: unknown) {
    super(message, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource Not Found', details?: unknown) {
    super(message, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource Conflict', details?: unknown) {
    super(message, 409, details);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable', details?: unknown) {
    super(message, 503, details);
  }
}
