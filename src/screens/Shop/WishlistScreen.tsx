import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { EmptyState } from '../../components/States';
import { ProductGrid } from '../../components/ProductGrid';
import { Screen } from '../../components/Screen';
import { useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { useUserStore } from '../../store/userStore';
import { useWishlistStore } from '../../store/wishlistStore';

const WishlistScreen: React.FC = () => {
  const nav = useRootNavigation();
  const ids = useWishlistStore(s => s.ids);
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        useWishlistStore.getState().refresh().catch(() => {});
      }
    }, [isLoggedIn]),
  );
  const products = useProductStore(s => s.products);
  const data = products.filter(p => ids.includes(p.id));
  return (
    <Screen>
      <ProductGrid
        data={data}
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
