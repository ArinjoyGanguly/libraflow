import { Router, Request, Response } from 'express';
import { verifyConnectivity } from '../config/neo4j';
import { config } from '../config/env';
import { sendSuccess, sendError } from '../utils/response';
import { LivenessStatus, DatabaseReadinessStatus } from '../types';

const router = Router();

/**
 * GET /health
 * HTTP Liveness probe - validates Express server process availability.
 */
router.get('/', (_req: Request, res: Response) => {
  const liveness: LivenessStatus = {
    status: 'UP',
    uptime: Math.round(process.uptime() * 100) / 100,
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  };
  return sendSuccess(res, liveness);
});

/**
 * GET /health/db
 * Database Readiness probe - validates real connectivity to Neo4j.
 * Strictly checks connectivity via driver.verifyConnectivity() and never fabricates success.
 */
router.get('/db', async (_req: Request, res: Response) => {
  const result = await verifyConnectivity();

  const readiness: DatabaseReadinessStatus = {
    status: result.connected ? 'CONNECTED' : 'DISCONNECTED',
    database: config.neo4j.database,
    uri: config.neo4j.uri,
    serverAddress: result.serverAddress,
    error: result.error,
  };

  if (result.connected) {
    return sendSuccess(res, readiness, 200);
  } else {
    return sendError(
      res,
      'Neo4j database connection failed',
      503,
      readiness
    );
  }
});

export default router;
