import type {
  ApiResponse,
  Book,
  Member,
  Employee,
  Admin,
  Library,
  Loan,
  OverdueLoan,
  RequestItem,
  Author,
  Publisher,
  DashboardStats,
  RelatedBooksResult,
  PaginatedResult,
  PaginationQuery,
  CreateBookInput,
  CreateMemberInput,
  CreateEmployeeInput,
  CreateAdminInput,
  CreateLibraryInput,
  CreateRequestInput,
  UpdateRequestInput,
  IssueBookInput,
  ReturnBookInput,
  AnalyticsResult,
  MemberRecommendationsResult,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Serializes query object into a URL query string
 */
function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

/**
 * Standard typed HTTP request helper
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const query = buildQueryString(queryParams);
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}${query}`;

  const token = localStorage.getItem('libraflow_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    let json: ApiResponse<T>;

    try {
      json = await res.json();
    } catch {
      // Non-JSON response
      if (!res.ok) {
        return {
          success: false,
          error: `HTTP ${res.status}: ${res.statusText || 'Server Error'}`,
        };
      }
      return {
        success: true,
        data: undefined as unknown as T,
      };
    }

    if (!res.ok && json.success !== false) {
      return {
        success: false,
        error: json.error || `HTTP ${res.status}: ${res.statusText}`,
        details: json.details,
      };
    }

    return json;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network connection failed. Backend may be offline.',
    };
  }
}

/**
 * System and Neo4j Health Check Probes
 */
export async function probeBackendHealth(): Promise<{
  server: boolean;
  database: boolean;
  uptime?: number;
  environment?: string;
  error?: string;
}> {
  try {
    const healthRoot = API_BASE.startsWith('http')
      ? API_BASE.replace(/\/api\/?$/, '')
      : '';
    const serverUrl = `${healthRoot}/health`;
    const dbUrl = `${healthRoot}/health/db`;

    let serverOk = false;
    let uptime: number | undefined;
    let environment: string | undefined;

    try {
      const serverRes = await fetch(serverUrl);
      if (serverRes.ok) {
        serverOk = true;
        const sJson = await serverRes.json();
        uptime = sJson.uptime;
        environment = sJson.environment;
      }
    } catch {
      serverOk = false;
    }

    let dbOk = false;
    let errorDetail: string | undefined;
    try {
      const dbRes = await fetch(dbUrl);
      const dbJson = await dbRes.json();
      dbOk = dbRes.ok && dbJson.data?.status === 'CONNECTED';
      if (!dbOk && dbJson.error) {
        errorDetail = dbJson.error;
      }
    } catch (e) {
      dbOk = false;
      errorDetail = e instanceof Error ? e.message : 'Database health probe failed';
    }

    return { server: serverOk, database: dbOk, uptime, environment, error: errorDetail };
  } catch (err) {
    return {
      server: false,
      database: false,
      error: err instanceof Error ? err.message : 'Network unreachable',
    };
  }
}

/**
 * LibraFlow Central Typed API Client
 */
export const api = {
  // Generic raw methods
  get: <T>(endpoint: string, query?: Record<string, unknown>) =>
    request<T>(endpoint, { method: 'GET' }, query),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  // Health namespace
  health: {
    probe: probeBackendHealth,
    server: () => request<{ status: string; uptime: number }>('/health'),
    db: () => request<{ status: string; database: string }>('/health/db'),
  },

  // Books namespace
  books: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Book>>('/books', { method: 'GET' }, query as Record<string, unknown>),
    get: (bookId: string) =>
      request<Book>(`/books/${bookId}`, { method: 'GET' }),
    create: (data: CreateBookInput) =>
      request<Book>('/books', { method: 'POST', body: JSON.stringify(data) }),
    update: (bookId: string, data: Partial<CreateBookInput>) =>
      request<Book>(`/books/${bookId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (bookId: string) =>
      request<{ message: string }>(`/books/${bookId}`, { method: 'DELETE' }),
    related: (bookId: string) =>
      request<RelatedBooksResult>(`/books/${bookId}/related`, { method: 'GET' }),
  },

  // Loans & Circulation namespace
  loans: {
    list: (query?: { status?: string; memberId?: string; bookId?: string; page?: number; limit?: number }) =>
      request<PaginatedResult<Loan>>('/loans', { method: 'GET' }, query as Record<string, unknown>),
    get: (loanId: string) =>
      request<Loan>(`/loans/${loanId}`, { method: 'GET' }),
    overdue: () =>
      request<OverdueLoan[]>('/loans/overdue', { method: 'GET' }),
    issue: (data: IssueBookInput) =>
      request<Loan>('/loans/issue', { method: 'POST', body: JSON.stringify(data) }),
    return: (loanId: string, data?: ReturnBookInput) =>
      request<Loan>(`/loans/${loanId}/return`, { method: 'PUT', body: JSON.stringify(data || {}) }),
  },

  // Member Requests namespace
  requests: {
    list: (query?: { status?: string; memberId?: string; page?: number; limit?: number }) =>
      request<PaginatedResult<RequestItem>>('/requests', { method: 'GET' }, query as Record<string, unknown>),
    get: (requestId: string) =>
      request<RequestItem>(`/requests/${requestId}`, { method: 'GET' }),
    create: (data: CreateRequestInput) => {
      const payload = {
        ...data,
        requestId: data.requestId || `REQ${Date.now().toString().slice(-6)}`,
      };
      return request<RequestItem>('/requests', { method: 'POST', body: JSON.stringify(payload) });
    },
    update: (requestId: string, data: UpdateRequestInput) =>
      request<RequestItem>(`/requests/${requestId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (requestId: string) =>
      request<{ message: string }>(`/requests/${requestId}`, { method: 'DELETE' }),
  },

  // Members namespace
  members: {
    list: (query?: { status?: string; search?: string; page?: number; limit?: number }) =>
      request<PaginatedResult<Member>>('/members', { method: 'GET' }, query as Record<string, unknown>),
    get: (memberId: string) =>
      request<Member>(`/members/${memberId}`, { method: 'GET' }),
    loans: (memberId: string) =>
      request<Loan[]>(`/members/${memberId}/loans`, { method: 'GET' }),
    create: (data: CreateMemberInput) =>
      request<Member>('/members', { method: 'POST', body: JSON.stringify(data) }),
    update: (memberId: string, data: Partial<CreateMemberInput>) =>
      request<Member>(`/members/${memberId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (memberId: string) =>
      request<{ message: string }>(`/members/${memberId}`, { method: 'DELETE' }),
  },

  // Employees namespace
  employees: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Employee>>('/employees', { method: 'GET' }, query as Record<string, unknown>),
    get: (employeeId: string) =>
      request<Employee>(`/employees/${employeeId}`, { method: 'GET' }),
    create: (data: CreateEmployeeInput) => {
      const payload = {
        ...data,
        employeeId: data.employeeId || `EMP${Date.now().toString().slice(-4)}`,
      };
      return request<Employee>('/employees', { method: 'POST', body: JSON.stringify(payload) });
    },
    update: (employeeId: string, data: Partial<CreateEmployeeInput>) =>
      request<Employee>(`/employees/${employeeId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (employeeId: string) =>
      request<{ message: string }>(`/employees/${employeeId}`, { method: 'DELETE' }),
  },

  // Admins namespace
  admins: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Admin>>('/admins', { method: 'GET' }, query as Record<string, unknown>),
    get: (adminId: string) =>
      request<Admin>(`/admins/${adminId}`, { method: 'GET' }),
    create: (data: CreateAdminInput) => {
      const payload = {
        ...data,
        adminId: data.adminId || `ADM${Date.now().toString().slice(-4)}`,
      };
      return request<Admin>('/admins', { method: 'POST', body: JSON.stringify(payload) });
    },
    update: (adminId: string, data: Partial<CreateAdminInput>) =>
      request<Admin>(`/admins/${adminId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (adminId: string) =>
      request<{ message: string }>(`/admins/${adminId}`, { method: 'DELETE' }),
  },

  // Admin stats namespace
  admin: {
    stats: () => request<DashboardStats>('/admin/stats', { method: 'GET' }),
  },

  // Libraries namespace
  libraries: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Library>>('/libraries', { method: 'GET' }, query as Record<string, unknown>),
    get: (libraryId: string) =>
      request<Library>(`/libraries/${libraryId}`, { method: 'GET' }),
    create: (data: CreateLibraryInput) =>
      request<Library>('/libraries', { method: 'POST', body: JSON.stringify(data) }),
    update: (libraryId: string, data: Partial<CreateLibraryInput>) =>
      request<Library>(`/libraries/${libraryId}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (libraryId: string) =>
      request<{ message: string }>(`/libraries/${libraryId}`, { method: 'DELETE' }),
  },

  // Authors & Publishers namespace
  authors: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Author>>('/authors', { method: 'GET' }, query as Record<string, unknown>),
    get: (authorId: string) =>
      request<Author>(`/authors/${authorId}`, { method: 'GET' }),
  },
  publishers: {
    list: (query?: PaginationQuery) =>
      request<PaginatedResult<Publisher>>('/publishers', { method: 'GET' }, query as Record<string, unknown>),
    get: (publisherId: string) =>
      request<Publisher>(`/publishers/${publisherId}`, { method: 'GET' }),
  },

  // Analytics & Recommendations namespace
  analytics: {
    dashboard: () => request<AnalyticsResult>('/analytics', { method: 'GET' }),
    memberRecommendations: (memberId: string) =>
      request<MemberRecommendationsResult>(`/analytics/members/${memberId}/recommendations`, { method: 'GET' }),
  },
};
