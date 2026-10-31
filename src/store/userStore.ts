import { create } from 'zustand';
import { DEMO_EXISTING_PHONE } from '../data/stores';
import { User } from '../types';
import { useAddressStore } from './addressStore';
import { useOrderStore } from './orderStore';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  /** Simulated sign-in after a (simulated) OTP check. */
  signIn: (phone: string, name?: string) => void;
  updateName: (name: string) => void;
  logout: () => void;
}

export const isExistingPhone = (phone: string): boolean =>
  phone === DEMO_EXISTING_PHONE;

export const useUserStore = create<UserState>(set => ({
  user: null,
  isLoggedIn: false,
  signIn: (phone, name) => {
    // Only the demo account owns the seeded address and order history.
    if (isExistingPhone(phone)) {
      useAddressStore.getState().reset();
      useOrderStore.getState().reset();
    } else {
      useAddressStore.setState({ addresses: [], selectedId: null });
      useOrderStore.setState({ orders: [], nextNumber: 1005 });
    }
    set({
      user: {
        id: `u-${phone}`,
        phone,
        name: name?.trim() || (isExistingPhone(phone) ? 'Demo Customer' : 'TOJ Customer'),
      },
      isLoggedIn: true,
    });
  },
  updateName: name =>
    set(state => (state.user ? { user: { ...state.user, name: name.trim() } } : state)),
  logout: () => set({ user: null, isLoggedIn: false }),
}));
