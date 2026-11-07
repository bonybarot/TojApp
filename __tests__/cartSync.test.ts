import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

// Signed in; each request stays pending until the test answers it.
const mockPending: ((qty: number) => void)[] = [];
jest.mock('../src/api/client', () => ({
  hasSession: () => true,
  api: () => new Promise(resolve => mockPending.push(qty => resolve({ lines: [{ ...mockLine, quantity: qty }] }))),
}));

const p = { ...products[0], stock: { 'Navy|L': 10 }, variants: [{ id: 'v1', sku: 's', color: 'Navy', size: 'L', stock: 10 }] };
const mockLine = { variantId: 'v1', productId: p.id, color: 'Navy', size: 'L' };
const flush = () => new Promise<void>(r => setTimeout(r, 0));

test('an older server answer does not undo a newer tap', async () => {
  useProductStore.setState({ products: [p] });
  const { addToCart, setQuantity } = useCartStore.getState();
  addToCart(p.id, 'Navy', 'L');
  setQuantity(`${p.id}|Navy|L`, 2);
  setQuantity(`${p.id}|Navy|L`, 3);
  mockPending[2](3); // newest answers first
  mockPending[1](2);
  mockPending[0](1);
  await flush();
  expect(useCartStore.getState().lines[0].quantity).toBe(3);
});
