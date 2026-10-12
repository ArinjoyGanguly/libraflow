import { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError } from '../utils/errors';
import { sendError } from '../utils/response';
import { config } from '../config/env';

/**
 * 404 Not Found handler for unmatched routes.
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

/**
 * Centralized global error handling middleware.
 */
export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'Neo4jError') {
    // Neo4j database errors
    statusCode = 500;
    message = 'Database operation failed';
    if (err.code && err.code.includes('ConstraintValidationFailed')) {
      statusCode = 409;
      message = 'Database constraint violation';
    }
    details = config.nodeEnv === 'development' ? { code: err.code, message: err.message } : undefined;
  } else if (err.type === 'entity.parse.failed') {
    // Malformed JSON body
    statusCode = 400;
    message = 'Invalid JSON payload received';
  } else if (err instanceof Error) {
    message = err.message;
    if (config.nodeEnv === 'development') {
      details = { stack: err.stack };
    }
  }

  // Log error details for operational visibility
  if (statusCode >= 500) {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}:`, err);
  } else {
    console.warn(`[WARN] [${new Date().toISOString()}] HTTP ${statusCode}: ${message}`);
  }

  sendError(res, message, statusCode, details);
};
