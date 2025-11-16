import { create } from 'zustand';
import { products } from '../data/products';

export interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  description: string;
  images?: string[];
}

interface ProductStore {
  products: Product[];
  filteredProducts: Product[];
  selectedCategory: string | null;
  loadProducts: () => void;
  filterByCategory: (category: string | null) => void;
  getProductById: (id: string) => Product | undefined;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  filteredProducts: [],
  selectedCategory: null,
  loadProducts: () => {
    set({
      products,
      filteredProducts: products,
    });
  },
  filterByCategory: (category: string | null) => {
    if (!category) {
      set({
        filteredProducts: get().products,
        selectedCategory: null,
      });
      return;
    }
    set({
      filteredProducts: get().products.filter(p => p.category === category),
      selectedCategory: category,
    });
  },
  getProductById: (id: string) => {
    return get().products.find(p => p.id === id);
  },
}));
