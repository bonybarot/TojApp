import { useProductStore } from '../store/productStore';
import { CartLine, Product } from '../types';
import { stockFor } from './catalogue';

export interface DetailedLine {
  line: CartLine;
  product: Product;
  lineTotal: number;
  maxQuantity: number;
}

export const detailLines = (lines: CartLine[]): DetailedLine[] => {
  const products = useProductStore.getState().products;
  return lines.flatMap(line => {
    const product = products.find(p => p.id === line.productId);
    return product
      ? [
          {
            line,
            product,
            lineTotal: product.price * line.quantity,
            maxQuantity: stockFor(product, line.color, line.size),
          },
        ]
      : [];
  });
};

export const subtotalOf = (d: DetailedLine[]): number =>
  d.reduce((s, x) => s + x.lineTotal, 0);

export const pickupBlockers = (d: DetailedLine[]): DetailedLine[] =>
  d.filter(x => !x.product.pickupAvailable);
