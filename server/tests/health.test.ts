import request from 'supertest';
import app from '../src/app';
import * as neo4jConfig from '../src/config/neo4j';

describe('Health & Database Readiness Endpoints', () => {
  afterAll(async () => {
    await neo4jConfig.closeDriver();
  });

  describe('GET /health (HTTP Liveness Probe)', () => {
    it('should return 200 OK with UP status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBe('UP');
      expect(typeof res.body.data.uptime).toBe('number');
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.timestamp).toBeDefined();
    });

    it('should return 200 OK when accessed via /api/health', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('UP');
    });
  });

  describe('GET /health/db (Neo4j Readiness Probe)', () => {
    it('should return 200 OK when Neo4j is reachable', async () => {
      const spy = jest.spyOn(neo4jConfig, 'verifyConnectivity').mockResolvedValueOnce({
        connected: true,
        serverAddress: 'bolt://localhost:7687',
      });

      const res = await request(app).get('/health/db');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CONNECTED');
      expect(res.body.data.serverAddress).toBe('bolt://localhost:7687');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    it('should return 503 Service Unavailable when Neo4j is unreachable without fabricating success', async () => {
      const spy = jest.spyOn(neo4jConfig, 'verifyConnectivity').mockResolvedValueOnce({
        connected: false,
        error: 'Failed to connect to Neo4j instance',
      });

      const res = await request(app).get('/health/db');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Neo4j database connection failed');
      expect(res.body.details).toBeDefined();
      expect(res.body.details.status).toBe('DISCONNECTED');
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });
  });
});
