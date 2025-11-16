import { create } from 'zustand';

export interface CartItem {
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addToCart: (product: {
    id: string;
    title: string;
    price: number;
    image: string;
  }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  addToCart: product => {
    const items = get().items;
    const existingItem = items.find(item => item.id === product.id);

    if (existingItem) {
      set({
        items: items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      });
    } else {
      set({
        items: [...items, { ...product, quantity: 1 }],
      });
    }
  },
  removeFromCart: id => {
    set({
      items: get().items.filter(item => item.id !== id),
    });
  },
  updateQuantity: (id, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    set({
      items: get().items.map(item =>
        item.id === id ? { ...item, quantity } : item,
      ),
    });
  },
  clearCart: () => {
    set({ items: [] });
  },
}));

// Selector for total price
export const useCartTotalPrice = () => {
  return useCartStore(state =>
    state.items.reduce((total, item) => total + item.price * item.quantity, 0),
  );
};
