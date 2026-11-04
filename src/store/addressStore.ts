import { create } from 'zustand';
import { api } from '../api/client';
import { Address } from '../types';

type ServerAddress = Address & { isDefault: boolean };

interface AddressState {
  addresses: Address[];
  selectedId: string | null;
  load: () => Promise<void>;
  /** Creates or updates on the server; resolves to the saved id. */
  save: (a: Omit<Address, 'id'> & { id?: string }) => Promise<string>;
  remove: (id: string) => Promise<void>;
  select: (id: string) => void;
  reset: () => void;
}

/** Addresses exist only on a signed-in account (all screens that use them require sign-in). */
export const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  selectedId: null,
  load: async () => {
    const list = await api<ServerAddress[]>('/me/addresses');
    const keep = list.some(a => a.id === get().selectedId);
    set({
      addresses: list,
      selectedId: keep ? get().selectedId : (list.find(a => a.isDefault) ?? list[0])?.id ?? null,
    });
  },
  save: async ({ id, ...body }) => {
    const saved = await api<ServerAddress>(id ? `/me/addresses/${id}` : '/me/addresses', {
      method: id ? 'PATCH' : 'POST',
      body,
    });
    await get().load();
    return saved.id;
  },
  remove: async id => {
    await api(`/me/addresses/${id}`, { method: 'DELETE' });
    await get().load();
  },
  select: id => set({ selectedId: id }),
  reset: () => set({ addresses: [], selectedId: null }),
}));
