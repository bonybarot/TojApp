import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Home: undefined;
  Shop: undefined;
  Cart: undefined;
  Profile: undefined;
};

export type AuthRedirect = 'Checkout' | undefined;

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  ProductList: { categoryId?: string; title?: string; onSale?: boolean };
  ProductDetails: { productId: string };
  Search: undefined;
  Wishlist: undefined;
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  OrderHistory: undefined;
  OrderDetails: { orderId: string };
  WriteReview: { productId: string; title: string };
  PersonalInfo: undefined;
  Addresses: { selecting?: boolean } | undefined;
  AddressForm: { addressId?: string } | undefined;
  Support: undefined;
  Settings: undefined;
  Login: { redirect?: AuthRedirect } | undefined;
  Otp: { phone: string; redirect?: AuthRedirect };
  CompleteProfile: { phone: string; code: string; redirect?: AuthRedirect };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
