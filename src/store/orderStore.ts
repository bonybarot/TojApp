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
  load: () => Promise<void>;
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

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  status: 'idle',
  load: async () => {
    set({ status: 'loading' });
    const mine = ++loads;
    try {
      // ponytail: first 50 orders only; add paging when a customer has more.
      const before = get().orders;
      const page = await api<{ items: Order[] }>('/orders?limit=50');
      if (mine !== loads) {
        return;
      }
      // Placed or cancelled while the list loaded: that answer is newer than the list.
      const changed = get().orders.filter(o => !before.includes(o));
      set({ orders: changed.reduce(upsert, page.items), status: 'ready' });
    } catch (e) {
      if (mine === loads) {
        set({ status: 'error' });
      }
      throw e;
    }
  },
  placeOrder: async ({ idempotencyKey, ...body }) => {
    const order = await api<Order>('/orders', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: { fulfilment: 'PICKUP', ...body },
    });
    if (hasSession()) {
      set({ orders: upsert(get().orders, order) });
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
    set({ orders: [], status: 'idle' });
  },
}));
