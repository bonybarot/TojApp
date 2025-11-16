import React, { useEffect } from 'react';
import { AuthStack } from './AuthStack';
import { DrawerNavigator } from './DrawerNavigator';
import { useUserStore } from '../store/userStore';
import { useProductStore } from '../store/productStore';

export const RootNavigator: React.FC = () => {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);
  const loadProducts = useProductStore(state => state.loadProducts);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return isLoggedIn ? <DrawerNavigator /> : <AuthStack />;
};
