import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export interface ValidationSchema {
  requiredBodyFields?: string[];
  requiredQueryFields?: string[];
  custom?: (req: Request) => string | null | undefined;
}

/**
 * Reusable request validation middleware generator.
 */
export const validateRequest = (schema: ValidationSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Check required body fields
    if (schema.requiredBodyFields && schema.requiredBodyFields.length > 0) {
      if (!req.body || typeof req.body !== 'object') {
        throw new BadRequestError('Request body must be a valid JSON object');
      }
      const missingFields: string[] = [];
      for (const field of schema.requiredBodyFields) {
        if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
          missingFields.push(field);
        }
      }
      if (missingFields.length > 0) {
        throw new BadRequestError(
          `Missing required field(s): ${missingFields.join(', ')}`,
          { missingFields }
        );
      }
    }

    // Check required query fields
    if (schema.requiredQueryFields && schema.requiredQueryFields.length > 0) {
      const missingQuery: string[] = [];
      for (const field of schema.requiredQueryFields) {
        if (req.query[field] === undefined || req.query[field] === '') {
          missingQuery.push(field);
        }
      }
      if (missingQuery.length > 0) {
        throw new BadRequestError(
          `Missing required query parameter(s): ${missingQuery.join(', ')}`,
          { missingQuery }
        );
      }
    }

    // Execute custom validation logic if provided
    if (schema.custom) {
      const validationError = schema.custom(req);
      if (validationError) {
        throw new BadRequestError(validationError);
      }
    }

    next();
  };
};
