import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

/** After sign-in: back into checkout if that is where the user came from, else Profile. */
export const finishAuth = (nav: NavigationProp<RootStackParamList>, redirect?: 'Checkout') =>
  nav.reset(
    redirect === 'Checkout'
      ? { index: 1, routes: [{ name: 'Tabs', params: { screen: 'Cart' } }, { name: 'Checkout' }] }
      : { index: 0, routes: [{ name: 'Tabs', params: { screen: 'Profile' } }] },
  );
