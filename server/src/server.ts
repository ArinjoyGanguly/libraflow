import app from './app';
import { config } from './config/env';
import { verifyConnectivity, closeDriver } from './config/neo4j';

const PORT = config.port;

const server = app.listen(PORT, async () => {
  console.log(`[SERVER] LibraFlow Backend running on port ${PORT} [${config.nodeEnv}]`);
  console.log(`[SERVER] HTTP Liveness: http://localhost:${PORT}/health`);
  console.log(`[SERVER] DB Readiness:  http://localhost:${PORT}/health/db`);

  // Attempt initial Neo4j connectivity check
  console.log(`[NEO4J] Verifying connection to ${config.neo4j.uri} (database: ${config.neo4j.database})...`);
  const dbStatus = await verifyConnectivity();
  if (dbStatus.connected) {
    console.log(`[NEO4J] Connected successfully! Server address: ${dbStatus.serverAddress}`);
  } else {
    console.warn(`[NEO4J] Database currently unreachable: ${dbStatus.error}`);
    console.warn(`[NEO4J] The HTTP server will remain available; check /health/db for live status.`);
  }
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server and Neo4j connections...`);
  server.close(async () => {
    console.log('[SHUTDOWN] HTTP server closed.');
    await closeDriver();
    console.log('[SHUTDOWN] Neo4j driver closed. Exiting process.');
    process.exit(0);
  });

  // Force exit if shutdown hangs beyond 10 seconds
  setTimeout(() => {
    console.error('[SHUTDOWN] Forceful shutdown timeout exceeded. Exiting.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
