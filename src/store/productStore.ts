import { create } from 'zustand';
import { products } from '../data/products';
import { Product } from '../types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ProductState {
  products: Product[];
  status: LoadStatus;
  /** Simulates a network fetch so loading/error states are real UI paths. */
  loadProducts: () => Promise<void>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  status: 'idle',
  loadProducts: async () => {
    if (get().status === 'loading') {
      return;
    }
    set({ status: 'loading' });
    await new Promise<void>(r => setTimeout(r, 600));
    set({ products, status: 'ready' });
  },
}));
