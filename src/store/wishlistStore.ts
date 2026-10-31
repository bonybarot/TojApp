import { create } from 'zustand';

interface WishlistState {
  ids: string[];
  toggle: (id: string) => void;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>(set => ({
  ids: [],
  toggle: id =>
    set(s => ({ ids: s.ids.includes(id) ? s.ids.filter(x => x !== id) : [...s.ids, id] })),
  clear: () => set({ ids: [] }),
}));
