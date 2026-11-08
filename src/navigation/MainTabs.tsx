import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import CartScreen from '../screens/Cart/CartScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import ShopScreen from '../screens/Shop/ShopScreen';
import { selectCartCount, useCartStore } from '../store/cartStore';
import { colors, typography } from '../utils/theme';
import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const label = (text: string) => ({ focused }: { focused: boolean }) => (
  <Text style={[styles.label, focused ? styles.on : styles.off]} maxFontSizeMultiplier={1.2} numberOfLines={1}>{text.toUpperCase()}</Text>
);

export const MainTabs: React.FC = () => {
  const count = useCartStore(selectCartCount);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: 'none' },
        tabBarStyle: { backgroundColor: colors.background, borderTopColor: colors.border },
        tabBarItemStyle: styles.item,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: label('Home') }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ tabBarLabel: label('Shop') }} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: label(count > 0 ? `Bag · ${count}` : 'Bag'),
          tabBarAccessibilityLabel: count > 0 ? `Bag, ${count} ${count === 1 ? 'item' : 'items'}` : 'Bag',
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: label('Account') }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  label: { ...typography.label, fontSize: 10 },
  on: { color: colors.primary },
  off: { color: colors.textSecondary },
  item: { justifyContent: 'center' },
});
