import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { requestLogger } from './middleware/logger.middleware';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';
import healthRoutes from './routes/health.routes';

const app: Application = express();

// Security and CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (skip in test environment to keep test output clean)
if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

// Health check routes mounted at root and /api for consistency
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Centralized error handling
app.use(globalErrorHandler);

export default app;
