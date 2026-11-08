import { create } from 'zustand';
import { api, ApiError, hasSession, uuid } from '../api/client';
import { CartLine } from '../types';
import { keepForGuest } from './guestCopy';
import { stockFor } from '../utils/catalogue';
import { useProductStore, variantIdFor } from './productStore';

export type AddResult = 'added' | 'limit' | 'unavailable';

/** GET/PUT /me/cart response (subset the app uses). */
interface ServerCart {
  lines: { variantId: string; productId: string; color: string; size: string; quantity: number; unitPrice: number }[];
  warnings?: { code: 'QUANTITY_CLAMPED' | 'UNAVAILABLE' }[];
}

interface CartStore {
  lines: CartLine[];
  /** Set when the server removed sold-out lines or cut quantities to stock; the Bag shows it once. */
  notice: string | null;
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

const noticeOf = (c: ServerCart): string | null => {
  const w = c.warnings ?? [];
  if (w.some(x => x.code === 'UNAVAILABLE')) {
    return 'Some items sold out and were removed from your bag.';
  }
  return w.length ? 'Some quantities were reduced to the stock available.' : null;
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
  // Sign-in merge failed: the local lines are the guest bag, not yet on the server.
  let unmerged = false;
  // One key per guest bag, reused by retries: a merge that landed but timed out is not added twice.
  let mergeKey = '';
  // The server ADDS merged quantities, so only one merge may be in flight, and no PUT beside it.
  let merging: Promise<void> | null = null;
  // Last bag the server confirmed: shown again when a change fails and the server is unreachable.
  let confirmed: CartLine[] | null = null;
  const take = (c: ServerCart) => (confirmed = fromServer(c));
  const sync = (l: CartLine, quantity: number) => {
    // Unmerged: edits stay local and ride in the retried merge (the server adds merged quantities).
    if (!hasSession() || unmerged || merging) {
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
    const adopt = (c: ServerCart) => {
      const lines = take(c);
      return mine === latest && set({ lines });
    };
    req
      .then(adopt, () => {
        if (!hasSession()) {
          return; // Signed out meanwhile: nothing to report or re-adopt.
        }
        // Failed change: say so, then fall back to the server's bag, or, offline, the last one it confirmed.
        set({ notice: 'Could not update your bag. Check your connection and try again.' });
        return api<ServerCart>('/me/cart').then(adopt, () => {
          if (mine === latest && confirmed && hasSession()) {
            set({ lines: confirmed });
          }
        });
      })
      .catch(() => {});
  };

  const merge = async () => {
    const before = get().lines;
    const items = before.flatMap(l => {
      const variantId = variantIdFor(l.productId, l.color, l.size);
      return variantId ? [{ variantId, quantity: Math.min(l.quantity, 20) }] : [];
    });
    if (!unmerged) {
      mergeKey = uuid();
    }
    let c: ServerCart;
    try {
      c = await (items.length
        ? api<ServerCart>('/me/cart/merge', { method: 'POST', body: { items }, headers: { 'Idempotency-Key': mergeKey } })
        : api<ServerCart>('/me/cart'));
    } catch (e) {
      // Retry later only what may pass later (offline, 5xx, 429); not after sign-out, not a rejected payload.
      const retry = e instanceof ApiError && (e.code === 'NETWORK' || e.status >= 500 || e.status === 429);
      if (retry && hasSession()) {
        // Keep the guest lines on screen; the next refresh (Bag focus, foreground) retries the merge.
        unmerged = true;
        set({ notice: 'Could not add your bag to your account yet. Check your connection.' });
      }
      throw e;
    }
    if (!hasSession()) {
      return; // signed out meanwhile: the account bag must not land in the guest bag
    }
    unmerged = false;
    merging = null; // the re-applied taps below must sync
    const after = get().lines;
    set({ lines: take(c), notice: noticeOf(c) });
    // Taps while the merge ran stayed local: re-apply them as changes on top of the merged bag.
    const qty = (ls: CartLine[], id: string) => ls.find(l => l.lineId === id)?.quantity ?? 0;
    for (const l of new Set([...before, ...after].map(x => x.lineId))) {
      const d = qty(after, l) - qty(before, l);
      const line = [...after, ...before].find(x => x.lineId === l)!;
      if (d && get().lines.some(x => x.lineId === l)) {
        get().setQuantity(l, qty(get().lines, l) + d);
      } else if (d > 0) {
        get().addToCart(line.productId, line.color, line.size, d);
      }
    }
  };

  return {
    lines: [],
    notice: null,
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
    clearCart: () => {
      unmerged = false;
      confirmed = null;
      set({ lines: [] });
    },
    mergeIntoServer: () => {
      merging ??= merge().finally(() => {
        merging = null;
      });
      return merging;
    },
    refresh: async () => {
      if (unmerged || merging) {
        return get().mergeIntoServer();
      }
      const mine = latest;
      const c = await api<ServerCart>('/me/cart');
      if (mine !== latest || !hasSession()) {
        return; // A tap meanwhile (its own answer is newer), or signed out.
      }
      // Keep an unread notice: the Bag's own focus refresh comes back clean.
      set({ lines: take(c), notice: noticeOf(c) ?? get().notice });
    },
  };
});

export const restoreGuestBag = keepForGuest(useCartStore, 'lines', 'toj.guestBag');

export const selectCartCount = (s: CartStore): number =>
  s.lines.reduce((n, l) => n + l.quantity, 0);

// Guest bag: drop lines whose product left the catalogue (the server does this for signed-in bags),
// so the tab badge never counts items the Bag cannot show.
// ponytail: assumes the whole catalogue is loaded (<=50, productStore); check page.total when paging lands.
useProductStore.subscribe(({ status, products }) => {
  const { lines } = useCartStore.getState();
  const keep = lines.filter(l => products.some(p => p.id === l.productId));
  if (status === 'ready' && !hasSession() && keep.length < lines.length) {
    useCartStore.setState({ lines: keep, notice: 'Some items are no longer available and were removed from your bag.' });
  }
});
