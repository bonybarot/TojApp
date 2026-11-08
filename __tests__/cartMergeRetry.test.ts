import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

const mockCalls: { path: string; body?: any; key?: string }[] = [];
let mockN = 0;
let mockFail = true;
let mockHold: Promise<void> = Promise.resolve();
jest.mock('../src/api/client', () => {
  class ApiError extends Error {
    status: number;
    code: string;
    constructor(mockStatus: number, mockCode: string) {
      super(mockCode);
      this.status = mockStatus;
      this.code = mockCode;
    }
  }
  return {
    ApiError,
    hasSession: () => true,
    uuid: () => `key-${++mockN}`,
    api: async (path: string, o: { body?: any; headers?: Record<string, string> } = {}) => {
      mockCalls.push({ path, body: o.body, key: o.headers?.['Idempotency-Key'] });
      await mockHold;
      if (mockFail) {
        throw new ApiError(0, 'NETWORK');
      }
      // Server merge ADDS to what it holds.
      if (path === '/me/cart/merge') {
        mockServer = o.body.items[0].quantity + mockServer;
      } else if (o.body?.quantity !== undefined) {
        mockServer = o.body.quantity;
      }
      return {
        lines: mockServer ? [{ ...mockLine, quantity: mockServer }] : [],
      };
    },
  };
});
let mockServer = 0;

const p = {
  ...products[0],
  stock: { 'Navy|L': 10 },
  variants: [{ id: 'v1', sku: 's', color: 'Navy', size: 'L', stock: 10 }],
};
const mockLine = {
  variantId: 'v1',
  productId: p.id,
  color: 'Navy',
  size: 'L',
  unitPrice: p.price,
};

test('a failed sign-in merge keeps the guest bag, says so, and retries on the next refresh', async () => {
  useProductStore.setState({ products: [p] });
  useCartStore.setState({
    lines: [
      {
        lineId: `${p.id}|Navy|L`,
        productId: p.id,
        color: 'Navy',
        size: 'L',
        quantity: 2,
      },
    ],
  });
  await expect(useCartStore.getState().mergeIntoServer()).rejects.toThrow();
  expect(useCartStore.getState().lines[0].quantity).toBe(2);
  expect(useCartStore.getState().notice).toMatch(/Could not add your bag/);
  useCartStore.getState().setQuantity(`${p.id}|Navy|L`, 3); // stays local until merged
  expect(mockCalls).toHaveLength(1);
  mockFail = false;
  await useCartStore.getState().refresh();
  expect(mockCalls.at(-1)).toEqual({
    path: '/me/cart/merge',
    body: { items: [{ variantId: 'v1', quantity: 3 }] },
    key: mockCalls[0].key, // the retry reuses the key: a merge that landed is not added twice
  });
  expect(mockCalls[0].key).toBeTruthy();
  expect(useCartStore.getState().lines[0].quantity).toBe(3);
  await useCartStore.getState().refresh();
  expect(mockCalls.at(-1)!.path).toBe('/me/cart');
});

test('a refresh while the sign-in merge is in flight does not merge again', async () => {
  mockCalls.length = 0;
  mockServer = 0;
  useCartStore.setState({
    lines: [
      {
        lineId: `${p.id}|Navy|L`,
        productId: p.id,
        color: 'Navy',
        size: 'L',
        quantity: 1,
      },
    ],
  });
  const merge = useCartStore.getState().mergeIntoServer();
  const refresh = useCartStore.getState().refresh();
  await Promise.all([merge, refresh]);
  expect(mockCalls.map(c => c.path)).toEqual(['/me/cart/merge']);
});

test('a tap while the merge is in flight is applied once, on top of the merged bag', async () => {
  mockServer = 1; // the account already holds 1
  useCartStore.setState({
    lines: [
      {
        lineId: `${p.id}|Navy|L`,
        productId: p.id,
        color: 'Navy',
        size: 'L',
        quantity: 2,
      },
    ],
  });
  let release = () => {};
  mockHold = new Promise(r => (release = r));
  const merge = useCartStore.getState().mergeIntoServer();
  useCartStore.getState().setQuantity(`${p.id}|Navy|L`, 3); // +1 during the merge
  release();
  await merge;
  await new Promise<void>(r => setTimeout(r, 0));
  expect(mockServer).toBe(4); // 1 + merged 2 + tapped 1
  expect(useCartStore.getState().lines[0].quantity).toBe(4);
});
