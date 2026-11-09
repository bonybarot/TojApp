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
 * ponytail: the whole catalogue (up to MAX_PAGES pages of 50) is loaded and searched/filtered
 * on the device; switch to server-side q/filters when it outgrows that.
 */
// One request at a time. A caller during one (e.g. after placing an order) gets one queued follow-up,
// shared by every such caller: the running request may predate the change they need to see.
let inflight: Promise<boolean> | null = null;
const MAX_PAGES = 10;
const productPage = (page: number) => api<Page<Product>>(`/products?limit=50&sort=featured&page=${page}`);
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
          productPage(1),
          api<Category[]>('/categories'),
          api<PickupLocation[]>('/pickup-locations'),
        ]);
        const pages = Math.min(Math.ceil(page.total / 50), MAX_PAGES);
        const rest = await Promise.all(Array.from({ length: Math.max(pages - 1, 0) }, (_, i) => productPage(i + 2)));
        // A product moving between pages mid-load can appear twice: keep its first row.
        const all = [...page.items, ...rest.flatMap(r => r.items)];
        set({
          products: all.filter((p, i) => all.findIndex(x => x.id === p.id) === i),
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
