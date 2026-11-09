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
  /** Resolves false when the request failed (never rejects). */
  loadProducts: () => Promise<boolean>;
}

/**
 * Catalogue from GET /products, /categories, /pickup-locations.
 * ponytail: the whole catalogue (<=50 items, one page) is loaded once and searched/filtered
 * on the device; switch to server-side q/filters when it outgrows one page.
 */
// One request at a time. A caller during one (e.g. after placing an order) gets one queued follow-up,
// shared by every such caller: the running request may predate the change they need to see.
let inflight: Promise<boolean> | null = null;
let queued: Promise<boolean> | null = null;

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: fixtureCategories,
  pickup: { id: '', ...PICKUP_STORE },
  status: 'idle',
  loadProducts: () => {
    if (inflight) {
      return (queued ??= inflight.then(() => {
        queued = null;
        return get().loadProducts();
      }));
    }
    return (inflight = (async () => {
      // A refresh (catalogue already shown) stays quiet: no skeleton flash, and a failure keeps the old data.
      const quiet = get().products.length > 0;
      if (!quiet) {
        set({ status: 'loading' });
      }
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
        return true;
      } catch {
        if (!quiet) {
          set({ status: 'error' });
        }
        return false;
      } finally {
        inflight = null;
      }
    })());
  },
}));

/** For pull-to-refresh: rejects on failure so the pull can say so. */
export const reloadProducts = () =>
  useProductStore.getState().loadProducts().then(ok => {
    if (!ok) {
      throw new Error('Could not refresh');
    }
  });

/** Variant id for a colour/size, needed by cart and order endpoints. */
export const variantIdFor = (productId: string, color: string, size: string): string | undefined =>
  useProductStore
    .getState()
    .products.find(p => p.id === productId)
    ?.variants?.find(v => v.color === color && v.size === size)?.id;
