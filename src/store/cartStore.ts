import { create } from 'zustand';
import { products } from '../data/products';
import { CartLine } from '../types';
import { stockFor } from '../utils/catalogue';

export type AddResult = 'added' | 'limit' | 'unavailable';

interface CartStore {
  lines: CartLine[];
  addToCart: (productId: string, color: string, size: string, qty?: number) => AddResult;
  setQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clearCart: () => void;
}

const maxFor = (l: { productId: string; color: string; size: string }): number => {
  const p = products.find(x => x.id === l.productId);
  return p ? stockFor(p, l.color, l.size) : 0;
};

export const useCartStore = create<CartStore>((set, get) => ({
  lines: [],
  addToCart: (productId, color, size, qty = 1) => {
    const max = maxFor({ productId, color, size });
    if (max <= 0) {
      return 'unavailable';
    }
    const lineId = `${productId}|${color}|${size}`;
    const existing = get().lines.find(l => l.lineId === lineId);
    const wanted = (existing?.quantity ?? 0) + qty;
    const quantity = Math.min(wanted, max);
    set({
      lines: existing
        ? get().lines.map(l => (l.lineId === lineId ? { ...l, quantity } : l))
        : [...get().lines, { lineId, productId, color, size, quantity }],
    });
    return wanted > max ? 'limit' : 'added';
  },
  setQuantity: (lineId, quantity) => {
    if (quantity <= 0) {
      get().removeLine(lineId);
      return;
    }
    set({
      lines: get().lines.map(l =>
        l.lineId === lineId ? { ...l, quantity: Math.min(quantity, maxFor(l)) } : l,
      ),
    });
  },
  removeLine: lineId => set({ lines: get().lines.filter(l => l.lineId !== lineId) }),
  clearCart: () => set({ lines: [] }),
}));

export const selectCartCount = (s: CartStore): number =>
  s.lines.reduce((n, l) => n + l.quantity, 0);
