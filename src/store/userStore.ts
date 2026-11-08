import { Alert, AppState } from 'react-native';
import { create } from 'zustand';
import { api, currentRefreshToken, setSessionLostHandler, setTokens, Tokens } from '../api/client';
import { navigationRef } from '../navigation/ref';
import { User } from '../types';
import { useAddressStore } from './addressStore';
import { useCartStore } from './cartStore';
import { useOrderStore } from './orderStore';
import { useProductStore } from './productStore';
import { useWishlistStore } from './wishlistStore';

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
}

/** The API stores +91XXXXXXXXXX; the app shows and edits the 10-digit number. */
const toUser = (c: VerifyOk['customer']): User => ({ id: c.id, name: c.name, phone: c.phone.slice(-10) });

const clearAccountData = () => {
  useCartStore.getState().clearCart();
  useWishlistStore.getState().clear();
  useOrderStore.getState().reset();
  useAddressStore.getState().reset();
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
    await Promise.allSettled([
      useCartStore.getState().mergeIntoServer(),
      useWishlistStore.getState().mergeIntoServer(),
      useAddressStore.getState().load(),
      useOrderStore.getState().load(),
    ]);
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
}));

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
