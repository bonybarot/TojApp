import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';

/** Mirrors the backend envelope `{error:{code,message,details,requestId}}`. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// Tokens live in memory only (no device persistence is approved): a cold start signs out.
let tokens: Tokens | null = null;
let onSessionLost: () => void = () => {};

export const setTokens = (t: Tokens | null) => {
  tokens = t;
};
export const hasSession = () => tokens !== null;
export const currentRefreshToken = () => tokens?.refreshToken ?? null;
export const setSessionLostHandler = (fn: () => void) => {
  onSessionLost = fn;
};

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

async function raw<T>(path: string, o: Options = {}): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: o.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(o.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(tokens ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
        ...o.headers,
      },
      body: o.body !== undefined ? JSON.stringify(o.body) : undefined,
      signal: ctrl.signal,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the TOJ server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? 'INTERNAL', e?.message ?? 'Something went wrong.', e?.details);
  }
  return json as T;
}

// Single-flight: concurrent 401s share one refresh call (rotation would revoke the family otherwise).
let refreshing: Promise<boolean> | null = null;
const refresh = (): Promise<boolean> => {
  if (!refreshing) {
    const rt = tokens?.refreshToken;
    refreshing = (rt
      ? raw<Tokens>('/auth/refresh', { method: 'POST', body: { refreshToken: rt } }).then(
          t => {
            tokens = { accessToken: t.accessToken, refreshToken: t.refreshToken };
            return true;
          },
          // Unreachable server is not a lost session: rethrow so the caller shows a network error.
          e => (e instanceof ApiError && e.status === 0 ? Promise.reject(e) : false),
        )
      : Promise.resolve(false)
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

export async function api<T>(path: string, o: Options = {}): Promise<T> {
  try {
    return await raw<T>(path, o);
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401 || !tokens || path.startsWith('/auth/')) {
      throw e;
    }
    if (await refresh()) {
      return raw<T>(path, o);
    }
    tokens = null;
    onSessionLost();
    throw e;
  }
}

/** UUID v4 for Idempotency-Key; Math.random is fine for a retry-dedup key. */
export const uuid = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : 8 + (r % 4)).toString(16);
  });
