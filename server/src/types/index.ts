/**
 * Standardized API Response interface for LibraFlow.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
  meta?: {
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * User roles mapped directly to DA2 entities and permissions.
 */
export type UserRole = 'member' | 'employee' | 'admin';

/**
 * Decoded JWT token payload shape attached to authenticated requests.
 */
export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
  name: string;
}

/**
 * Domain status enums.
 */
export type MemberStatus = 'ACTIVE' | 'SUSPENDED';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Health check status responses.
 */
export interface LivenessStatus {
  status: 'UP' | 'DOWN';
  uptime: number;
  timestamp: string;
  environment: string;
}

export interface DatabaseReadinessStatus {
  status: 'CONNECTED' | 'DISCONNECTED';
  database: string;
  uri: string;
  serverAddress?: string;
  error?: string;
}
