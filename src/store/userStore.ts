import { Alert, AppState } from 'react-native';
import { create } from 'zustand';
import { api, currentRefreshToken, hasSession, setSessionLostHandler, setTokens, storedTokens, Tokens } from '../api/client';
import { navigationRef } from '../navigation/ref';
import { User } from '../types';
import { restoreGuestBag, useCartStore } from './cartStore';
import { useOrderStore } from './orderStore';
import { useProductStore } from './productStore';
import { restoreGuestWishlist, useWishlistStore } from './wishlistStore';

interface VerifyOk extends Tokens {
  customer: { id: string; name: string; phone: string };
}
type VerifyResult = { needsProfile: true } | VerifyOk;

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  requestOtp: (phone: string) => Promise<void>;
  /** 'needsProfile' when the number is new and no name was given yet. */
  verifyOtp: (phone: string, code: string, name?: string) => Promise<'ok' | 'needsProfile'>;
  updateName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  /** App start: resume the session saved in the Keychain, if any. */
  restore: () => Promise<void>;
}

const restoreGuest = () => Promise.all([restoreGuestBag(), restoreGuestWishlist()]).then(() => {});
/** The API stores +91XXXXXXXXXX; the app shows and edits the 10-digit number. */
const toUser = (c: VerifyOk['customer']): User => ({ id: c.id, name: c.name, phone: c.phone.slice(-10) });

const loadAccountData = () =>
  Promise.allSettled([
    useCartStore.getState().mergeIntoServer(),
    useWishlistStore.getState().mergeIntoServer(),
    useOrderStore.getState().load(),
  ]);

const clearAccountData = () => {
  useCartStore.getState().clearCart();
  useWishlistStore.getState().clear();
  useOrderStore.getState().reset();
};

export const useUserStore = create<UserState>(set => ({
  user: null,
  isLoggedIn: false,
  requestOtp: async phone => {
    await api('/auth/otp/request', { method: 'POST', body: { phone } });
  },
  verifyOtp: async (phone, code, name) => {
    const r = await api<VerifyResult>('/auth/otp/verify', { method: 'POST', body: { phone, code, name } });
    if ('needsProfile' in r) {
      return 'needsProfile';
    }
    setTokens({ accessToken: r.accessToken, refreshToken: r.refreshToken });
    set({ user: toUser(r.customer), isLoggedIn: true });
    // Guest bag and hearts move into the account (D-8); then load account data.
    await loadAccountData();
    return 'ok';
  },
  updateName: async name => {
    const c = await api<VerifyOk['customer']>('/me', { method: 'PATCH', body: { name } });
    set({ user: toUser(c) });
  },
  logout: async () => {
    const rt = currentRefreshToken();
    if (rt) {
      await api('/auth/logout', { method: 'POST', body: { refreshToken: rt } }).catch(() => {});
    }
    setTokens(null);
    set({ user: null, isLoggedIn: false });
    clearAccountData();
  },
  // Single-flight: launch and the back-online listener can both call it; two merges would double the bag.
  restore: () => (restoring ??= restoreOnce().finally(() => { restoring = null; })),
}));

let restoring: Promise<void> | null = null;
const restoreOnce = async () => {
  // Already signed in (e.g. Fast Refresh re-ran App): a second merge would add the server bag to itself.
  if (useUserStore.getState().isLoggedIn) {
    return;
  }
  const t = await storedTokens();
  if (!t) {
    return restoreGuest();
  }
  setTokens(t, false);
  try {
    useUserStore.setState({ user: toUser(await api<VerifyOk['customer']>('/me')), isLoggedIn: true });
  } catch {
    // Expired or revoked: api() already cleared it. Offline: stay guest this run, keep it for the next launch.
    if (hasSession()) {
      setTokens(null, false);
    }
    return restoreGuest();
  }
  await loadAccountData();
};

// Refresh failed (expired or revoked): drop to guest; account data stays on the server.
setSessionLostHandler(() => {
  useUserStore.setState({ user: null, isLoggedIn: false });
  clearAccountData();
  // Account-only screens (My Orders, Checkout) would otherwise show a misleading error.
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'Profile' } }] });
  }
  Alert.alert('Signed out', 'Your session has ended. Please sign in again.');
});

// Back in the foreground: prices and stock may have changed; account data may have changed on another device.
AppState.addEventListener('change', state => {
  if (state === 'active') {
    useProductStore.getState().loadProducts();
  }
  if (state === 'active' && useUserStore.getState().isLoggedIn) {
    Promise.allSettled([
      useCartStore.getState().refresh(),
      useWishlistStore.getState().refresh(),
      useOrderStore.getState().load(),
    ]);
  }
});

// Offline at launch left a saved session unused: resume it once the server answers again.
// A retry goes error → loading → ready, so remember the failure instead of comparing with prev.
let wasOffline = false;
useProductStore.subscribe(s => {
  if (s.status === 'error') {
    wasOffline = true;
  } else if (s.status === 'ready' && wasOffline) {
    wasOffline = false;
    if (!useUserStore.getState().isLoggedIn) {
      storedTokens().then(t => { if (t) { useUserStore.getState().restore(); } });
    }
  }
});
