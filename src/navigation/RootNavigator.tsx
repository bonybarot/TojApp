import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import AddressFormScreen from '../screens/Account/AddressFormScreen';
import AddressesScreen from '../screens/Account/AddressesScreen';
import PersonalInfoScreen from '../screens/Account/PersonalInfoScreen';
import SettingsScreen from '../screens/Account/SettingsScreen';
import SupportScreen from '../screens/Account/SupportScreen';
import CompleteProfileScreen from '../screens/Auth/CompleteProfileScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import OtpScreen from '../screens/Auth/OtpScreen';
import CheckoutScreen from '../screens/Checkout/CheckoutScreen';
import OrderConfirmationScreen from '../screens/Checkout/OrderConfirmationScreen';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import OrderHistoryScreen from '../screens/Orders/OrderHistoryScreen';
import WriteReviewScreen from '../screens/Orders/WriteReviewScreen';
import ProductDetailsScreen from '../screens/Shop/ProductDetailsScreen';
import ProductListScreen from '../screens/Shop/ProductListScreen';
import SearchScreen from '../screens/Shop/SearchScreen';
import WishlistScreen from '../screens/Shop/WishlistScreen';
import { useProductStore } from '../store/productStore';
import { colors, typography } from '../utils/theme';
import { MainTabs } from './MainTabs';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/** Guest browsing is open; account screens are pushed on demand (D-8). */
export const RootNavigator: React.FC = () => {
  const loadProducts = useProductStore(s => s.loadProducts);
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerBackButtonDisplayMode: 'minimal',
        headerTitleStyle: { ...typography.h3, color: colors.text },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ProductList" component={ProductListScreen} options={({ route }) => ({ title: route.params.title ?? 'Products' })} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: '' }} />
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search', animation: 'fade' }} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: 'Order' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Review' }} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} options={{ title: 'Personal Information' }} />
      <Stack.Screen name="Addresses" component={AddressesScreen} options={{ title: 'Addresses' }} />
      <Stack.Screen name="AddressForm" component={AddressFormScreen} options={({ route }) => ({ title: route.params?.addressId ? 'Edit address' : 'New address' })} />
      <Stack.Screen name="Support" component={SupportScreen} options={{ title: 'Help & Support' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '', presentation: 'modal' }} />
      <Stack.Screen name="Otp" component={OtpScreen} options={{ title: '' }} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ title: '', headerBackVisible: false, gestureEnabled: false }} />
    </Stack.Navigator>
  );
};
