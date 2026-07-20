// Real backend base URL — the Docker Compose backend service listens on 4000
// (see ../../docker-compose.yml). Override via VITE_API_BASE_URL for other environments.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

// Where AuthProvider (lib/auth.tsx) persists the session JWT. Defined here (not there) so
// this file has no dependency on auth.tsx — auth.tsx imports it from here instead, which
// avoids a circular import (auth.tsx -> auth.service.ts -> this file).
export const TOKEN_KEY = "jc.auth-token";

const readStoredToken = (): string | undefined => (typeof window === "undefined" ? undefined : (window.localStorage.getItem(TOKEN_KEY) ?? undefined));

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  error: string | null;
  errorCode: string | null;
  data: T;
}

export class ApiError extends Error {
  errorCode: string | null;
  status: number;

  constructor(message: string, errorCode: string | null, status: number) {
    super(message);
    this.errorCode = errorCode;
    this.status = status;
  }
}

async function requestEnvelope<T>(path: string, init?: RequestInit & { token?: string }): Promise<ApiEnvelope<T>> {
  const { token, headers, ...rest } = init ?? {};

  // Falls back to the persisted session token when a caller doesn't pass one explicitly —
  // every authenticated request gets attached automatically instead of relying on each
  // call site to remember to thread `token` through (the standard pattern; an axios
  // interceptor would do the same job). An explicit `token` argument still wins when given.
  const authToken = token ?? readStoredToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  // Every backend response — success or failure — carries a human-readable `message`
  // (success) or `error` (failure) string meant to be shown to the user as-is (see
  // lib/alert-store.tsx). ApiError.message intentionally carries `error`, not `message`.
  if (!response.ok || !body?.success) {
    throw new ApiError(body?.error ?? "Request failed.", body?.errorCode ?? null, response.status);
  }

  return body;
}

export async function apiFetch<T>(path: string, init?: RequestInit & { token?: string }): Promise<T> {
  const body = await requestEnvelope<T>(path, init);
  return body.data;
}

// For call sites that also want the backend's own success `message` string (e.g. to show
// via useAlert), not just the unwrapped data.
export async function apiFetchEnvelope<T>(path: string, init?: RequestInit & { token?: string }): Promise<ApiEnvelope<T>> {
  return requestEnvelope<T>(path, init);
}
