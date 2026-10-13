import express, { Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import { requestLogger } from './middleware/logger.middleware';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';

// Routes
import healthRoutes from './routes/health.routes';
import booksRoutes from './routes/books.routes';
import authorsRoutes from './routes/authors.routes';
import publishersRoutes from './routes/publishers.routes';
import librariesRoutes from './routes/libraries.routes';
import membersRoutes from './routes/members.routes';
import employeesRoutes from './routes/employees.routes';
import adminsRoutes from './routes/admins.routes';
import requestsRoutes from './routes/requests.routes';
import loansRoutes from './routes/loans.routes';
import analyticsRoutes from './routes/analytics.routes';

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

// Health check routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);

// Domain CRUD API routes
app.use('/api/books', booksRoutes);
app.use('/api/authors', authorsRoutes);
app.use('/api/publishers', publishersRoutes);
app.use('/api/libraries', librariesRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/admin', adminsRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/analytics', analyticsRoutes);


// Catch 404 and forward to error handler
app.use(notFoundHandler);

// Centralized error handling
app.use(globalErrorHandler);

export default app;
