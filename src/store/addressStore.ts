import { create } from 'zustand';
import { Address } from '../types';

const seed = (): Address[] => [
  {
    id: 'a1',
    label: 'Home',
    fullName: 'Demo Customer',
    phone: '9876543210',
    line1: '24 Garden Road',
    city: 'Your City',
    postalCode: '400001',
  },
];

interface AddressState {
  addresses: Address[];
  selectedId: string | null;
  save: (a: Omit<Address, 'id'> & { id?: string }) => string;
  remove: (id: string) => void;
  select: (id: string) => void;
  reset: () => void;
}

export const useAddressStore = create<AddressState>(set => ({
  addresses: seed(),
  selectedId: 'a1',
  save: a => {
    const id = a.id ?? `a${Date.now()}`;
    const full = { ...a, id } as Address;
    set(s => ({
      addresses: s.addresses.some(x => x.id === id)
        ? s.addresses.map(x => (x.id === id ? full : x))
        : [...s.addresses, full],
      selectedId: s.selectedId ?? id,
    }));
    return id;
  },
  remove: id =>
    set(s => {
      const addresses = s.addresses.filter(x => x.id !== id);
      return {
        addresses,
        selectedId: s.selectedId === id ? addresses[0]?.id ?? null : s.selectedId,
      };
    }),
  select: id => set({ selectedId: id }),
  reset: () => set({ addresses: seed(), selectedId: 'a1' }),
}));
