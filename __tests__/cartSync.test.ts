import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

// Signed in; each request stays pending until the test answers it.
const mockPending: ((qty: number) => void)[] = [];
jest.mock('../src/api/client', () => ({
  hasSession: () => true,
  api: () => new Promise(resolve => mockPending.push(qty => resolve(qty ? { lines: [{ ...mockLine, quantity: qty }] } : { lines: [], warnings: [{ code: 'UNAVAILABLE' }] }))),
}));

const p = { ...products[0], stock: { 'Navy|L': 10 }, variants: [{ id: 'v1', sku: 's', color: 'Navy', size: 'L', stock: 10 }] };
const mockLine = { variantId: 'v1', productId: p.id, color: 'Navy', size: 'L', unitPrice: p.price };
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
  expect(mockPending).toHaveLength(3); // prices match: no catalogue reload
});

test('a sold-out line the server dropped leaves a notice that a clean refresh keeps', async () => {
  const refresh = useCartStore.getState().refresh();
  mockPending.at(-1)!(0);
  await refresh;
  expect(useCartStore.getState().lines).toHaveLength(0);
  expect(useCartStore.getState().notice).toMatch(/sold out/);
  const again = useCartStore.getState().refresh();
  mockPending.at(-1)!(1);
  await again;
  expect(useCartStore.getState().notice).toMatch(/sold out/);
});

test('a refresh that answers after a tap does not undo the tap', async () => {
  const refresh = useCartStore.getState().refresh();
  useCartStore.getState().setQuantity(`${p.id}|Navy|L`, 2);
  mockPending.at(-1)!(2); // the tap's PUT answers first
  mockPending.at(-2)!(1); // then the older GET
  await refresh;
  await flush();
  expect(useCartStore.getState().lines[0].quantity).toBe(2);
});
