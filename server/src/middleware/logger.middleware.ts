import { Request, Response, NextFunction } from 'express';

/**
 * Lightweight HTTP request logging middleware.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Use structured format for development/production log aggregators
    console.log(
      `[HTTP] ${new Date().toISOString()} | ${method} ${originalUrl} | ${statusCode} | ${duration}ms`
    );
  });

  next();
};
