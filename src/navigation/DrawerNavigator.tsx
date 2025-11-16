import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList,
} from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DrawerHeader } from '../components/DrawerHeader';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import ProfileScreen from '../screens/User/ProfileScreen';
import SettingsScreen from '../screens/User/SettingsScreen';
import { useUserStore } from '../store/userStore';
import { colors } from '../utils/theme';
import { MainTabs } from './MainTabs';
import { OrdersStack } from './OrdersStack';

export type DrawerParamList = {
  MainTabs: undefined;
  Categories: undefined;
  OrdersStack: undefined;
  Profile: undefined;
  Settings: undefined;
};

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const logout = useUserStore(state => state.logout);
  const navigation = useNavigation();

  const handleLogout = () => {
    logout();
    // Navigation will be handled by RootNavigator
  };

  return (
    <View style={styles.drawerContainer}>
      <DrawerHeader />
      <DrawerContentScrollView {...props}>
        <DrawerItemList {...props} />
        <DrawerItem
          label="Logout"
          onPress={handleLogout}
          labelStyle={{ color: colors.error }}
        />
      </DrawerContentScrollView>
    </View>
  );
};

export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ title: '', drawerLabel: 'Home' }}
      />
      <Drawer.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories', headerShown: true }}
      />
      <Drawer.Screen
        name="OrdersStack"
        component={OrdersStack}
        options={{ title: 'Orders', headerShown: true }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
});
