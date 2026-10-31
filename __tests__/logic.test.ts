import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { deliveryFeeFor, detailLines, subtotalOf } from '../src/utils/cart';
import { stockFor } from '../src/utils/catalogue';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from '../src/data/stores';

const p = products[0];
const color = p.colors[0].name;
const size = p.sizes.find(s => stockFor(p, color, s) > 0) as string;

beforeEach(() => useCartStore.getState().clearCart());

test('add merges same variant and clamps to stock', () => {
  const max = stockFor(p, color, size);
  const { addToCart } = useCartStore.getState();
  expect(addToCart(p.id, color, size)).toBe('added');
  expect(addToCart(p.id, color, size, max + 5)).toBe('limit');
  const lines = useCartStore.getState().lines;
  expect(lines).toHaveLength(1);
  expect(lines[0].quantity).toBe(max);
});

test('unavailable variant is rejected', () => {
  expect(useCartStore.getState().addToCart(p.id, 'No such colour', size)).toBe('unavailable');
});

test('subtotal and delivery fee', () => {
  useCartStore.getState().addToCart(p.id, color, size, 1);
  const sub = subtotalOf(detailLines(useCartStore.getState().lines));
  expect(sub).toBe(p.price);
  expect(deliveryFeeFor(sub, 'pickup')).toBe(0);
  expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD, 'delivery')).toBe(0);
  expect(deliveryFeeFor(FREE_DELIVERY_THRESHOLD - 1, 'delivery')).toBe(DELIVERY_FEE);
});

test('quantity 0 removes the line', () => {
  useCartStore.getState().addToCart(p.id, color, size);
  useCartStore.getState().setQuantity(`${p.id}|${color}|${size}`, 0);
  expect(useCartStore.getState().lines).toHaveLength(0);
});
