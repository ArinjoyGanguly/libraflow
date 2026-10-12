import request from 'supertest';
import express, { Request, Response } from 'express';
import { validateRequest } from '../src/middleware/validate.middleware';
import { notFoundHandler, globalErrorHandler } from '../src/middleware/error.middleware';
import { BadRequestError } from '../src/utils/errors';
import { sendSuccess } from '../src/utils/response';

describe('Middleware & Validation Suite', () => {
  let testApp: express.Application;

  beforeEach(() => {
    testApp = express();
    testApp.use(express.json());

    // Test route with validation
    testApp.post(
      '/test-validation',
      validateRequest({ requiredBodyFields: ['title', 'isbn'] }),
      (_req: Request, res: Response) => {
        return sendSuccess(res, { created: true }, 201);
      }
    );

    // Test route that throws custom AppError
    testApp.get('/test-error', () => {
      throw new BadRequestError('Custom validation failure test');
    });

    // 404 & error handlers
    testApp.use(notFoundHandler);
    testApp.use(globalErrorHandler);
  });

  it('should return 404 with structured JSON for non-existent routes', async () => {
    const res = await request(testApp).get('/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Route GET /non-existent-endpoint not found');
    expect(res.body.meta).toBeDefined();
    expect(res.body.meta.timestamp).toBeDefined();
  });

  it('should reject requests missing required validation fields with 400 Bad Request', async () => {
    const res = await request(testApp)
      .post('/test-validation')
      .send({ title: 'The Great Gatsby' }); // missing 'isbn'

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Missing required field(s): isbn');
    expect(res.body.details).toEqual({ missingFields: ['isbn'] });
  });

  it('should succeed when all required validation fields are present', async () => {
    const res = await request(testApp)
      .post('/test-validation')
      .send({ title: 'The Great Gatsby', isbn: '9780743273565' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({ created: true });
  });

  it('should handle custom AppErrors via globalErrorHandler correctly', async () => {
    const res = await request(testApp).get('/test-error');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Custom validation failure test');
  });
});
