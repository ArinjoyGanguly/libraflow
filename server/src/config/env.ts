import dotenv from 'dotenv';
import path from 'path';

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface Config {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  neo4j: {
    uri: string;
    username: string;
    password: string;
    database: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  business: {
    fineRatePerDay: number;
    loanPeriodDays: number;
  };
}

export const config: Config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  neo4j: {
    uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
    // Support NEO4J_USERNAME as primary requirement, NEO4J_USER as fallback
    username: process.env.NEO4J_USERNAME || process.env.NEO4J_USER || 'neo4j',
    password: process.env.NEO4J_PASSWORD || '',
    database: process.env.NEO4J_DATABASE || 'neo4j',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production_min_32_chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  business: {
    fineRatePerDay: parseFloat(process.env.FINE_RATE_PER_DAY || '2'),
    loanPeriodDays: parseInt(process.env.LOAN_PERIOD_DAYS || '14', 10),
  },
};
