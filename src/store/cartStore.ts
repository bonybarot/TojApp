import * as Keychain from 'react-native-keychain';
import { create } from 'zustand';
import { api, hasSession } from '../api/client';
import { CartLine } from '../types';
import { stockFor } from '../utils/catalogue';
import { useProductStore, variantIdFor } from './productStore';

export type AddResult = 'added' | 'limit' | 'unavailable';

/** GET/PUT /me/cart response (subset the app uses). */
interface ServerCart {
  lines: { variantId: string; productId: string; color: string; size: string; quantity: number; unitPrice: number }[];
}

interface CartStore {
  lines: CartLine[];
  addToCart: (productId: string, color: string, size: string, qty?: number) => AddResult;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  /** Local only: the server empties its cart when an order is placed. */
  clearCart: () => void;
  /** After sign-in: merge the guest bag into the server cart and adopt the result. */
  mergeIntoServer: () => Promise<void>;
  /** Signed in: adopt the server cart (it clamps lines to current stock). */
  refresh: () => Promise<void>;
}

const keyOf = (l: { productId: string; color: string; size: string }) => `${l.productId}|${l.color}|${l.size}`;

const fromServer = (c: ServerCart): CartLine[] => {
  // The bag prices from the catalogue loaded at start; a server price change means it is stale.
  const ps = useProductStore.getState();
  const stale = (l: ServerCart['lines'][number]) => {
    const p = ps.products.find(x => x.id === l.productId);
    return !!p && p.price !== l.unitPrice;
  };
  if (c.lines.some(stale)) {
    ps.loadProducts().catch(() => {});
  }
  return c.lines.map(l => ({ lineId: keyOf(l), productId: l.productId, color: l.color, size: l.size, quantity: l.quantity }));
};

const maxFor = (l: { productId: string; color: string; size: string }): number => {
  const p = useProductStore.getState().products.find(x => x.id === l.productId);
  return p ? stockFor(p, l.color, l.size) : 0;
};

export const useCartStore = create<CartStore>((set, get) => {
  /**
   * Signed in: the server cart is the source of truth. The local change is applied
   * optimistically, then replaced by the server's answer (which clamps to stock).
   */
  // Rapid taps send several requests; adopting an older answer would undo newer taps.
  let latest = 0;
  const sync = (l: CartLine, quantity: number) => {
    if (!hasSession()) {
      return;
    }
    const vid = variantIdFor(l.productId, l.color, l.size);
    if (!vid) {
      return;
    }
    const mine = ++latest;
    const req =
      quantity > 0
        ? api<ServerCart>(`/me/cart/items/${vid}`, { method: 'PUT', body: { quantity: Math.min(quantity, 20) } })
        : api<ServerCart>(`/me/cart/items/${vid}`, { method: 'DELETE' });
    req
      .catch(() => api<ServerCart>('/me/cart'))
      .then(c => mine === latest && set({ lines: fromServer(c) }))
      .catch(() => {});
  };

  return {
    lines: [],
    addToCart: (productId, color, size, qty = 1) => {
      const max = maxFor({ productId, color, size });
      if (max <= 0) {
        return 'unavailable';
      }
      const lineId = keyOf({ productId, color, size });
      const existing = get().lines.find(l => l.lineId === lineId);
      const wanted = (existing?.quantity ?? 0) + qty;
      const quantity = Math.min(wanted, max);
      const line = { lineId, productId, color, size, quantity };
      set({
        lines: existing
          ? get().lines.map(l => (l.lineId === lineId ? line : l))
          : [...get().lines, line],
      });
      sync(line, quantity);
      return wanted > max ? 'limit' : 'added';
    },
    setQuantity: (lineId, quantity) => {
      if (quantity <= 0) {
        get().removeLine(lineId);
        return;
      }
      const line = get().lines.find(l => l.lineId === lineId);
      if (!line) {
        return;
      }
      const q = Math.min(quantity, maxFor(line));
      set({ lines: get().lines.map(l => (l.lineId === lineId ? { ...l, quantity: q } : l)) });
      sync(line, q);
    },
    removeLine: lineId => {
      const line = get().lines.find(l => l.lineId === lineId);
      set({ lines: get().lines.filter(l => l.lineId !== lineId) });
      if (line) {
        sync(line, 0);
      }
    },
    clearCart: () => set({ lines: [] }),
    mergeIntoServer: async () => {
      const items = get().lines.flatMap(l => {
        const variantId = variantIdFor(l.productId, l.color, l.size);
        return variantId ? [{ variantId, quantity: Math.min(l.quantity, 20) }] : [];
      });
      const c = items.length
        ? await api<ServerCart>('/me/cart/merge', { method: 'POST', body: { items } })
        : await api<ServerCart>('/me/cart');
      set({ lines: fromServer(c) });
    },
    refresh: async () => {
      set({ lines: fromServer(await api<ServerCart>('/me/cart')) });
    },
  };
});

// ADR-0006 amendment: the guest bag survives a cold start. Signed in, the server cart is the copy.
// ponytail: Keychain as a small key-value store; move to AsyncStorage if more non-secret device state appears.
const BAG = { service: 'toj.guestBag', accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
useCartStore.subscribe(s => {
  (hasSession() || !s.lines.length
    ? Keychain.resetGenericPassword(BAG)
    : Keychain.setGenericPassword('toj', JSON.stringify(s.lines), BAG)
  ).catch(() => {});
});

/** App start as a guest: bring back the bag from the last run (unless something was added meanwhile). */
export const restoreGuestBag = async () => {
  const c = await Keychain.getGenericPassword(BAG).catch(() => false as const);
  try {
    if (c && !hasSession() && !useCartStore.getState().lines.length) {
      useCartStore.setState({ lines: JSON.parse(c.password) as CartLine[] });
    }
  } catch {}
};

export const selectCartCount = (s: CartStore): number =>
  s.lines.reduce((n, l) => n + l.quantity, 0);
