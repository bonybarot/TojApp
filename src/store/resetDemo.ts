import { api, hasSession } from '../api/client';
import { useCartStore } from './cartStore';
import { useWishlistStore } from './wishlistStore';

/** Clears bag and wishlist; when signed in also on the server, or they would come back on the next refresh.
 *  Resolves false when a server delete failed (those items would come back). */
export const resetDemoData = async (): Promise<boolean> => {
  const local = useWishlistStore.getState().ids;
  // Server list, not the local copy: hearts added on another device would survive the reset.
  const ids = hasSession() ? await api<{ id: string }[]>('/me/wishlist').then(l => l.map(p => p.id), () => local) : local;
  useCartStore.getState().clearCart();
  useWishlistStore.getState().clear();
  if (hasSession()) {
    // ponytail: one DELETE per heart; add a bulk endpoint if wishlists get long.
    const r = await Promise.allSettled([
      api('/me/cart', { method: 'DELETE' }),
      ...ids.map(id => api(`/me/wishlist/${id}`, { method: 'DELETE' })),
    ]);
    return r.every(x => x.status === 'fulfilled');
  }
  return true;
};
