import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

// Signed in; each request stays pending until the test answers it.
const mockPending: ((qty: number) => void)[] = [];
const mockFail: (() => void)[] = [];
jest.mock('../src/api/client', () => ({
  hasSession: () => true,
  api: () =>
    new Promise((resolve, reject) => {
      mockPending.push(qty => resolve(qty ? { lines: [{ ...mockLine, quantity: qty }] } : { lines: [], warnings: [{ code: 'UNAVAILABLE' }] }));
      mockFail.push(() => reject(new Error('NETWORK')));
    }),
}));

const p = { ...products[0], stock: { 'Navy|L': 10 }, variants: [{ id: 'v1', sku: 's', color: 'Navy', size: 'L', stock: 10 }] };
const mockLine = { variantId: 'v1', productId: p.id, color: 'Navy', size: 'L', unitPrice: p.price };
const flush = () => new Promise<void>(r => setTimeout(r, 0));

test('rapid taps go to the server one at a time, in order; the last answer wins', async () => {
  useProductStore.setState({ products: [p] });
  const { addToCart, setQuantity } = useCartStore.getState();
  addToCart(p.id, 'Navy', 'L');
  setQuantity(`${p.id}|Navy|L`, 2);
  setQuantity(`${p.id}|Navy|L`, 3);
  await flush();
  expect(mockPending).toHaveLength(1); // the others wait: two in flight could be applied out of order
  for (const q of [1, 2, 3]) {
    mockPending.at(-1)!(q);
    await flush();
  }
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
  await flush();
  mockPending.at(-1)!(2); // the tap's PUT answers first
  mockPending.at(-2)!(1); // then the older GET
  await refresh;
  await flush();
  expect(useCartStore.getState().lines[0].quantity).toBe(2);
});

test('offline: a failed change shows the last bag the server confirmed, not the tap', async () => {
  useCartStore.getState().setQuantity(`${p.id}|Navy|L`, 3); // server holds 2
  await flush();
  mockFail.at(-1)!(); // the PUT fails
  await flush();
  mockFail.at(-1)!(); // and so does the re-fetch
  await flush();
  expect(useCartStore.getState().lines[0].quantity).toBe(2);
  expect(useCartStore.getState().notice).toMatch(/Could not update/);
});

test('a cart answer from before the order does not refill the bag after clearCart', async () => {
  const refresh = useCartStore.getState().refresh();
  useCartStore.getState().clearCart(); // order placed meanwhile
  mockPending.at(-1)!(2);
  await refresh;
  expect(useCartStore.getState().lines).toHaveLength(0);
});

test('settled waits for a bag edit still on the wire', async () => {
  useCartStore.getState().addToCart(p.id, 'Navy', 'L');
  let done = false;
  const s = useCartStore.getState().settled().then(() => (done = true));
  await flush();
  expect(done).toBe(false);
  mockPending.at(-1)!(1);
  await s;
  expect(done).toBe(true);
});
