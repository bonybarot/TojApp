import { create } from 'zustand';
import { api } from '../api/client';
import { categories as fixtureCategories } from '../data/categories';
import { PICKUP_STORE } from '../data/stores';
import { Category, PickupLocation, Product } from '../types';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface Page<T> {
  items: T[];
  total: number;
}

interface ProductState {
  products: Product[];
  categories: Category[];
  pickup: PickupLocation;
  status: LoadStatus;
  loadProducts: () => Promise<void>;
}

/**
 * Catalogue from GET /products, /categories, /pickup-locations.
 * ponytail: the whole catalogue (<=50 items, one page) is loaded once and searched/filtered
 * on the device; switch to server-side q/filters when it outgrows one page.
 */
export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: fixtureCategories,
  pickup: { id: '', ...PICKUP_STORE },
  status: 'idle',
  loadProducts: async () => {
    if (get().status === 'loading') {
      return;
    }
    set({ status: 'loading' });
    try {
      const [page, categories, pickups] = await Promise.all([
        api<Page<Product>>('/products?limit=50&sort=featured'),
        api<Category[]>('/categories'),
        api<PickupLocation[]>('/pickup-locations'),
      ]);
      set({
        products: page.items,
        categories,
        pickup: pickups[0] ?? get().pickup,
        status: 'ready',
      });
    } catch {
      set({ status: 'error' });
    }
  },
}));

/** Variant id for a colour/size, needed by cart and order endpoints. */
export const variantIdFor = (productId: string, color: string, size: string): string | undefined =>
  useProductStore
    .getState()
    .products.find(p => p.id === productId)
    ?.variants?.find(v => v.color === color && v.size === size)?.id;
