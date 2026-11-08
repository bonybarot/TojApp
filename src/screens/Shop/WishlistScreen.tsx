import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../components/States';
import { ProductGrid } from '../../components/ProductGrid';
import { Screen } from '../../components/Screen';
import { usePull, useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { useUserStore } from '../../store/userStore';
import { useWishlistStore } from '../../store/wishlistStore';

const reloadWishlist = () =>
  Promise.all([useProductStore.getState().loadProducts(), useUserStore.getState().isLoggedIn && useWishlistStore.getState().refresh()]);

const WishlistScreen: React.FC = () => {
  const nav = useRootNavigation();
  const ids = useWishlistStore(s => s.ids);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const pull = usePull(reloadWishlist);
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        useWishlistStore.getState().refresh().catch(() => {});
      }
    }, [isLoggedIn]),
  );
  const products = useProductStore(s => s.products);
  const status = useProductStore(s => s.status);
  const data = products.filter(p => ids.includes(p.id));
  // Saved ids but no catalogue yet: say why instead of "empty".
  if (ids.length > 0 && products.length === 0) {
    return (
      <Screen>
        {status === 'error' ? <ErrorState onRetry={useProductStore.getState().loadProducts} /> : <LoadingState />}
      </Screen>
    );
  }
  return (
    <Screen>
      <ProductGrid
        data={data}
        {...pull}
        empty={
          <EmptyState
            title="Your wishlist is empty"
            message="Tap the heart on any product to save it here."
            actionLabel="Start shopping"
            onAction={() => nav.navigate('Tabs', { screen: 'Shop' })}
          />
        }
      />
    </Screen>
  );
};

export default WishlistScreen;
