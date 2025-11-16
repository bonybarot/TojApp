import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import OrderDetailsScreen from '../screens/Orders/OrderDetailsScreen';
import OrderHistoryScreen from '../screens/Orders/OrderHistoryScreen';

export type OrdersStackParamList = {
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
};

const Stack = createNativeStackNavigator<OrdersStackParamList>();

export const OrdersStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    </Stack.Navigator>
  );
};
