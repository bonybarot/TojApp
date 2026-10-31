import { Product } from '../types';

export const stockFor = (p: Product, color: string, size: string): number =>
  p.stock[`${color}|${size}`] ?? 0;

export const totalStock = (p: Product): number =>
  Object.values(p.stock).reduce((a, b) => a + b, 0);

export const sizeAvailable = (p: Product, size: string): boolean =>
  p.colors.some(c => stockFor(p, c.name, size) > 0);

export const isSoldOut = (p: Product): boolean => totalStock(p) === 0;

export const discountPercent = (p: Product): number =>
  p.compareAtPrice
    ? Math.round((1 - p.price / p.compareAtPrice) * 100)
    : 0;
