import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Sends a standardized successful JSON response.
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  return res.status(statusCode).json(payload);
};

/**
 * Sends a standardized error JSON response.
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  details?: unknown
): Response => {
  const payload: ApiResponse = {
    success: false,
    error: message,
    details: details !== undefined ? details : undefined,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(payload);
};
