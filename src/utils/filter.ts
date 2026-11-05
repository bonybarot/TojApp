import { Filters } from '../components/FilterSheet';
import { Product } from '../types';
import { isSoldOut, sizeAvailable } from './catalogue';

export const applyFilters = (list: Product[], f: Filters): Product[] => {
  let out = list.filter(p => {
    if (f.inStockOnly && isSoldOut(p)) {
      return false;
    }
    if (f.pickupOnly && !p.pickupAvailable) {
      return false;
    }
    if (f.sizes.length && !f.sizes.some(z => p.sizes.includes(z) && sizeAvailable(p, z))) {
      return false;
    }
    return true;
  });
  if (f.sort === 'priceAsc') {
    out = [...out].sort((a, b) => a.price - b.price);
  } else if (f.sort === 'priceDesc') {
    out = [...out].sort((a, b) => b.price - a.price);
  }
  return out;
};

export const searchProducts = (list: Product[], q: string): Product[] => {
  const t = q.trim().toLowerCase();
  return t
    ? list.filter(p => `${p.title} ${p.categoryId} ${p.description}`.toLowerCase().includes(t))
    : [];
};
