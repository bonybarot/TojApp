import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import HomeScreen from '../screens/Home/HomeScreen';
import ProductDetailsScreen from '../screens/Home/ProductDetailsScreen';
import ProductListScreen from '../screens/Home/ProductListScreen';

export type HomeStackParamList = {
  Home: undefined;
  ProductList: { category?: string };
  ProductDetails: { productId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
    </Stack.Navigator>
  );
};
