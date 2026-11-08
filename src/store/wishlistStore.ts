import { Alert } from 'react-native';
import { create } from 'zustand';
import { api, hasSession } from '../api/client';
import { keepForGuest } from './guestCopy';

interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
  /** After sign-in: merge guest hearts into the account wishlist. */
  mergeIntoServer: () => Promise<void>;
  /** Signed in: adopt the server wishlist (may have changed on another device). */
  refresh: () => Promise<void>;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  toggle: id => {
    const on = !get().ids.includes(id);
    set(s => ({ ids: on ? [...s.ids, id] : s.ids.filter(x => x !== id) }));
    if (hasSession()) {
      api(`/me/wishlist/${id}`, { method: on ? 'PUT' : 'DELETE' }).catch(
        // Roll back so the heart reflects the server (not after sign-out: the guest list is separate).
        () => {
          if (hasSession()) {
            set(s => ({ ids: on ? s.ids.filter(x => x !== id) : [...s.ids, id] }));
            Alert.alert('Wishlist not updated', 'Check your connection and try again.');
          }
        },
      );
    }
  },
  clear: () => set({ ids: [] }),
  mergeIntoServer: async () => {
    const ids = get().ids;
    const list = ids.length
      ? await api<{ id: string }[]>('/me/wishlist/merge', { method: 'POST', body: { productIds: ids } })
      : await api<{ id: string }[]>('/me/wishlist');
    set({ ids: list.map(p => p.id) });
  },
  refresh: async () => {
    const list = await api<{ id: string }[]>('/me/wishlist');
    set({ ids: list.map(p => p.id) });
  },
}));

export const restoreGuestWishlist = keepForGuest(useWishlistStore, 'ids', 'toj.guestWishlist');
