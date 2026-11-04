import { useCartStore } from './cartStore';
import { useWishlistStore } from './wishlistStore';

/** Guest-side reset only; account data lives on the server (ADR-0031). */
export const resetDemoData = (): void => {
  useCartStore.getState().clearCart();
  useWishlistStore.getState().clear();
};
