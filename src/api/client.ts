import * as Keychain from 'react-native-keychain';
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

// ADR-0006: tokens are kept in the Keychain / Keystore so a cold start keeps the session.
// This-device-only: never synced to iCloud or restored onto another phone.
const STORE = { service: 'toj.session', accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
let tokens: Tokens | null = null;
/** Bumped when a session ends, so answers to its in-flight requests are dropped. */
let sessionEpoch = 0;
let onSessionLost: () => void = () => {};

/** `persist: false` changes only the in-memory session (e.g. offline at start: keep the stored one). */
export const setTokens = (t: Tokens | null, persist = true) => {
  if (!t) {
    sessionEpoch++;
  }
  tokens = t;
  if (persist) {
    (t
      ? Keychain.setGenericPassword('toj', JSON.stringify(t), STORE)
      : Keychain.resetGenericPassword(STORE)
    ).catch(() => {});
  }
};
/** Session saved by a previous launch, or null. */
export const storedTokens = async (): Promise<Tokens | null> => {
  const c = await Keychain.getGenericPassword(STORE).catch(() => false as const);
  try {
    return c ? (JSON.parse(c.password) as Tokens) : null;
  } catch {
    return null;
  }
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
  let json: any;
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
    // Inside the timeout too: headers can arrive and the body then stall.
    json = res.status === 204 ? undefined : await res.json().catch(() => {
      if (ctrl.signal.aborted) {
        throw new Error('timeout');
      }
      return null;
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the TOJ server. Check your connection.');
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 204) {
    return undefined as T;
  }
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
            setTokens({ accessToken: t.accessToken, refreshToken: t.refreshToken });
            return true;
          },
          // Only a rejected refresh token ends the session; unreachable or 5xx/429 is a server problem: rethrow.
          e => (e instanceof ApiError && (e.status === 401 || e.status === 403) ? false : Promise.reject(e)),
        )
      : Promise.resolve(false)
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

export async function api<T>(path: string, o: Options = {}): Promise<T> {
  const epoch = sessionEpoch;
  const signedIn = tokens !== null;
  const out = await call<T>(path, o);
  // Signed out (or session lost) meanwhile: the old account's answer must not reach the guest state.
  if (signedIn && epoch !== sessionEpoch) {
    throw new ApiError(0, 'SESSION_ENDED', 'You were signed out.');
  }
  return out;
}

async function call<T>(path: string, o: Options): Promise<T> {
  try {
    return await raw<T>(path, o);
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401 || !tokens || path.startsWith('/auth/')) {
      throw e;
    }
    if (await refresh()) {
      return raw<T>(path, o);
    }
    // Concurrent 401s share one failed refresh: only the first ends the session.
    if (!tokens) {
      throw e;
    }
    setTokens(null);
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
