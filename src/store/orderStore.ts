import { create } from 'zustand';
import { seedOrders } from '../data/orders';
import { Order } from '../types';

interface OrderState {
  orders: Order[];
  nextNumber: number;
  placeOrder: (o: Omit<Order, 'id' | 'placedAt' | 'status'>) => string;
  cancelOrder: (id: string) => void;
  reset: () => void;
}

export const CANCELLABLE: Order['status'][] = ['PLACED', 'CONFIRMED'];

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: seedOrders(),
  nextNumber: 1005,
  placeOrder: o => {
    const id = `TOJ-${get().nextNumber}`;
    const order: Order = { ...o, id, placedAt: new Date().toISOString(), status: 'PLACED' };
    set(s => ({ orders: [order, ...s.orders], nextNumber: s.nextNumber + 1 }));
    return id;
  },
  cancelOrder: id =>
    set(s => ({
      orders: s.orders.map(o =>
        o.id === id && CANCELLABLE.includes(o.status) ? { ...o, status: 'CANCELLED' } : o,
      ),
    })),
  reset: () => set({ orders: seedOrders(), nextNumber: 1005 }),
}));
