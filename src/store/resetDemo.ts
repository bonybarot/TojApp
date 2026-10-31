import { useAddressStore } from './addressStore';
import { useCartStore } from './cartStore';
import { useOrderStore } from './orderStore';
import { useWishlistStore } from './wishlistStore';

export const resetDemoData = (): void => {
  useCartStore.getState().clearCart();
  useWishlistStore.getState().clear();
  useOrderStore.getState().reset();
  useAddressStore.getState().reset();
};
