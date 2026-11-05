import React from 'react';
import { EmptyState } from '../../components/States';
import { ProductGrid } from '../../components/ProductGrid';
import { Screen } from '../../components/Screen';
import { useRootNavigation } from '../../hooks';
import { useProductStore } from '../../store/productStore';
import { useWishlistStore } from '../../store/wishlistStore';

const WishlistScreen: React.FC = () => {
  const nav = useRootNavigation();
  const ids = useWishlistStore(s => s.ids);
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
