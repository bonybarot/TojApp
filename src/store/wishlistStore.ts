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

// Per-id chain: a quick on/off sends PUT then DELETE in tap order, never crossed.
const pending = new Map<string, Promise<unknown>>();
// A list fetched before a pending toggle, or answered after sign-out, is stale.
const fresh = () => hasSession() && !pending.size;
// Guest hearts not yet on the server (merge failed): refresh retries the merge instead of
// adopting the server list, which would drop them. Merge is a set union, so a retry is safe.
let unmerged = false;
// Toggles right after sign-in wait for the merge, so a DELETE cannot land before the merge re-adds the item.
let merging: Promise<unknown> | null = null;

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: [],
  toggle: id => {
    const on = !get().ids.includes(id);
    set(s => ({ ids: on ? [...s.ids, id] : s.ids.filter(x => x !== id) }));
    if (hasSession()) {
      const p = (pending.get(id) ?? merging?.catch(() => {}) ?? Promise.resolve())
        .then(() => api(`/me/wishlist/${id}`, { method: on ? 'PUT' : 'DELETE' }))
        .catch(() => {
          // Roll back so the heart reflects the server; not after sign-out (the guest list is separate)
          // and not over a later tap, which has its own request.
          if (hasSession() && get().ids.includes(id) === on) {
            set(s => ({ ids: on ? s.ids.filter(x => x !== id) : [...s.ids, id] }));
            Alert.alert('Wishlist not updated', 'Check your connection and try again.');
          }
        })
        .finally(() => pending.get(id) === p && pending.delete(id));
      pending.set(id, p);
    }
  },
  clear: () => {
    unmerged = false;
    set({ ids: [] });
  },
  mergeIntoServer: async () => {
    const ids = get().ids;
    unmerged = ids.length > 0;
    const req = ids.length
      ? api<{ id: string }[]>('/me/wishlist/merge', { method: 'POST', body: { productIds: ids } })
      : api<{ id: string }[]>('/me/wishlist');
    merging = req;
    const list = await req.finally(() => merging === req && (merging = null));
    unmerged = false;
    if (fresh()) {
      set({ ids: list.map(p => p.id) });
    }
  },
  refresh: async () => {
    if (unmerged) {
      return get().mergeIntoServer();
    }
    const list = await api<{ id: string }[]>('/me/wishlist');
    if (fresh()) {
      set({ ids: list.map(p => p.id) });
    }
  },
}));

export const restoreGuestWishlist = keepForGuest(useWishlistStore, 'ids', 'toj.guestWishlist');
