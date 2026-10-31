import { products } from '../data/products';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../data/stores';
import { CartLine, FulfilmentMethod, Product } from '../types';
import { stockFor } from './catalogue';

export interface DetailedLine {
  line: CartLine;
  product: Product;
  lineTotal: number;
  maxQuantity: number;
}

export const detailLines = (lines: CartLine[]): DetailedLine[] =>
  lines.flatMap(line => {
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

export const subtotalOf = (d: DetailedLine[]): number =>
  d.reduce((s, x) => s + x.lineTotal, 0);

export const deliveryFeeFor = (
  subtotal: number,
  method: FulfilmentMethod,
): number =>
  method === 'pickup' || subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD
    ? 0
    : DELIVERY_FEE;

export const pickupBlockers = (d: DetailedLine[]): DetailedLine[] =>
  d.filter(x => !x.product.pickupAvailable);
