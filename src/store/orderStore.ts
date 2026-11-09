import { create } from 'zustand';
import { api, hasSession } from '../api/client';
import { Order } from '../types';

export interface PlaceOrderInput {
  pickupLocationId: string;
  paymentMethod: 'PAY_AT_STORE' | 'CARD_SIMULATED';
  /** Same key for retries of one checkout attempt, so a retry cannot create a second order. */
  idempotencyKey: string;
  expectedTotal: number;
}

interface OrderState {
  orders: Order[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** Orders the server holds for this account (the list may hold fewer: paged). */
  total: number;
  load: () => Promise<void>;
  /** Next page of older orders; no-op when all are loaded or one is on the wire. */
  loadMore: () => Promise<void>;
  placeOrder: (o: PlaceOrderInput) => Promise<string>;
  cancelOrder: (id: string) => Promise<void>;
  /** Re-read one order (it may have changed on another device). */
  refreshOne: (id: string) => Promise<void>;
  reset: () => void;
}

/** Customer may cancel only from these (Q-5); the server enforces it too. */
export const CANCELLABLE: Order['status'][] = ['PLACED', 'CONFIRMED'];

const upsert = (orders: Order[], o: Order) =>
  orders.some(x => x.id === o.id) ? orders.map(x => (x.id === o.id ? o : x)) : [o, ...orders];

// Overlapping loads (focus + pull): only the newest answer is adopted. reset() bumps it too.
let loads = 0;
const PAGE = 50;
let more: Promise<void> | undefined;
let pages = 0; // pages fetched since the last load: the next one to ask for is pages + 1

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  total: 0,
  status: 'idle',
  load: async () => {
    set({ status: 'loading' });
    const mine = ++loads;
    try {
      const before = get().orders;
      const page = await api<{ items: Order[]; total?: number }>(`/orders?limit=${PAGE}`);
      if (mine !== loads) {
        return;
      }
      // Placed or cancelled while the list loaded: that answer is newer than the list.
      const changed = get().orders.filter(o => !before.includes(o));
      const fresh = changed.reduce(upsert, page.items);
      // Older pages already shown stay (orders are never deleted), so a refresh does not cut the list.
      pages = Math.max(pages, 1);
      const older = before.filter(o => !fresh.some(x => x.id === o.id));
      set({ orders: [...fresh, ...older], total: page.total ?? page.items.length, status: 'ready' });
    } catch (e) {
      if (mine === loads) {
        set({ status: 'error' });
      }
      throw e;
    }
  },
  loadMore: () => {
    const { orders, total, status } = get();
    if (more || status !== 'ready' || orders.length >= total) {
      return more ?? Promise.resolve();
    }
    const mine = loads;
    const next = pages + 1;
    // New orders only push rows down a page, so an offset page can repeat a row (deduped) but not skip one.
    more = api<{ items: Order[]; total?: number }>(`/orders?limit=${PAGE}&page=${next}`)
      .then(page => {
        if (mine === loads) {
          pages = next;
          const now = get().orders;
          set({ orders: [...now, ...page.items.filter(o => !now.some(x => x.id === o.id))], total: page.total ?? now.length });
        }
      })
      .finally(() => (more = undefined));
    return more;
  },
  placeOrder: async ({ idempotencyKey, ...body }) => {
    const order = await api<Order>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: { fulfilment: 'PICKUP', ...body },
    });
    if (hasSession()) {
      const { orders, total } = get();
      set({ orders: upsert(orders, order), total: total + (orders.some(o => o.id === order.id) ? 0 : 1) });
    }
    return order.id;
  },
  cancelOrder: async id => {
    const order = await api<Order>(`/orders/${id}/cancel`, { method: 'POST', body: {} }).catch(e => {
      // The store may have moved it on (e.g. packed): show the real status, then report the error.
      get().refreshOne(id).catch(() => {});
      throw e;
    });
    if (hasSession()) {
      set({ orders: upsert(get().orders, order) });
    }
  },
  refreshOne: async id => {
    const order = await api<Order>(`/orders/${id}`);
    // Answered after sign-out: another account's order must not reappear.
    if (hasSession()) {
      set({ orders: upsert(get().orders, order) });
    }
  },
  reset: () => {
    loads++; // a load still in flight belongs to the signed-out account
    pages = 0;
    set({ orders: [], total: 0, status: 'idle' });
  },
}));
