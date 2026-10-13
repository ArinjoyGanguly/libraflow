import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Standard HTTP Request helper
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
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
    const data = await res.json();
    return data;
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Network connection failed',
    };
  }
}

/**
 * System and Neo4j Health Check Probes
 */
export async function probeBackendHealth(): Promise<{ server: boolean; database: boolean }> {
  try {
    const serverRes = await fetch('/health').catch(() => null);
    const serverOk = serverRes ? serverRes.ok : false;

    const dbRes = await fetch('/health/db').catch(() => null);
    let dbOk = false;
    if (dbRes && dbRes.ok) {
      const data = await dbRes.json();
      dbOk = data.data?.status === 'CONNECTED';
    }

    return { server: serverOk, database: dbOk };
  } catch {
    return { server: false, database: false };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
