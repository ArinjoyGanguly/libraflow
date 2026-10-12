import neo4j, { Driver, Session, SessionConfig, session as sessionMode, ManagedTransaction } from 'neo4j-driver';
import { config } from './env';

let driverInstance: Driver | null = null;

/**
 * Obtain or lazily initialize the singleton Neo4j driver.
 */
export const getDriver = (): Driver => {
  if (!driverInstance) {
    const { uri, username, password } = config.neo4j;
    
    // Create driver with safe timeout and connection pool configuration
    driverInstance = neo4j.driver(
      uri,
      neo4j.auth.basic(username, password),
      {
        userAgent: 'LibraFlow-Backend/1.0',
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000, // 5 seconds acquisition timeout
      }
    );
  }
  return driverInstance;
};

/**
 * Creates a new managed Neo4j Session for querying.
 * Callers using this directly must guarantee calling session.close().
 */
export const getSession = (
  accessMode: 'READ' | 'WRITE' = 'WRITE',
  databaseName: string = config.neo4j.database
): Session => {
  const driver = getDriver();
  const sessionConfig: SessionConfig = {
    database: databaseName,
    defaultAccessMode: accessMode === 'READ' ? sessionMode.READ : sessionMode.WRITE,
  };
  return driver.session(sessionConfig);
};

/**
 * Executes a callback within a managed Neo4j session.
 * Guarantees session closure in a finally block to prevent connection leaks.
 */
export const withSession = async <T>(
  work: (session: Session) => Promise<T>,
  options?: {
    accessMode?: 'READ' | 'WRITE';
    database?: string;
  }
): Promise<T> => {
  const session = getSession(options?.accessMode || 'WRITE', options?.database);
  try {
    return await work(session);
  } finally {
    await session.close();
  }
};

/**
 * Executes work within an ACID transaction (using session.executeWrite or session.executeRead).
 * Handles automatic rollback on failure and safe session closure in a finally block.
 */
export const withTransaction = async <T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  options?: {
    accessMode?: 'READ' | 'WRITE';
    database?: string;
  }
): Promise<T> => {
  const session = getSession(options?.accessMode || 'WRITE', options?.database);
  try {
    if (options?.accessMode === 'READ') {
      return await session.executeRead((tx) => work(tx));
    }
    return await session.executeWrite((tx) => work(tx));
  } finally {
    await session.close();
  }
};


/**
 * Verifies connectivity to the Neo4j instance.
 * Returns honest status information without fabricating success.
 */
export const verifyConnectivity = async (): Promise<{
  connected: boolean;
  serverAddress?: string;
  error?: string;
}> => {
  try {
    const driver = getDriver();
    const serverInfo = await driver.verifyConnectivity();
    return {
      connected: true,
      serverAddress: serverInfo.address,
    };
  } catch (error: any) {
    return {
      connected: false,
      error: error?.message || 'Failed to verify connectivity to Neo4j instance',
    };
  }
};

/**
 * Safely closes the singleton driver instance (e.g. during application shutdown).
 */
export const closeDriver = async (): Promise<void> => {
  if (driverInstance) {
    try {
      await driverInstance.close();
    } finally {
      driverInstance = null;
    }
  }
};
