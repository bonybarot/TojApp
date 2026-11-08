import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

const mockCalls: { path: string; body?: any }[] = [];
let mockFail = true;
jest.mock('../src/api/client', () => ({
  hasSession: () => true,
  api: (path: string, o: { body?: any } = {}) => {
    mockCalls.push({ path, body: o.body });
    if (mockFail) {
      return Promise.reject(new Error('offline'));
    }
    return Promise.resolve({ lines: (o.body?.items ?? []).map((i: any) => ({ ...mockLine, quantity: i.quantity })) });
  },
}));

const p = { ...products[0], stock: { 'Navy|L': 10 }, variants: [{ id: 'v1', sku: 's', color: 'Navy', size: 'L', stock: 10 }] };
const mockLine = { variantId: 'v1', productId: p.id, color: 'Navy', size: 'L', unitPrice: p.price };

test('a failed sign-in merge keeps the guest bag, says so, and retries on the next refresh', async () => {
  useProductStore.setState({ products: [p] });
  useCartStore.setState({ lines: [{ lineId: `${p.id}|Navy|L`, productId: p.id, color: 'Navy', size: 'L', quantity: 2 }] });
  await expect(useCartStore.getState().mergeIntoServer()).rejects.toThrow();
  expect(useCartStore.getState().lines[0].quantity).toBe(2);
  expect(useCartStore.getState().notice).toMatch(/Could not add your bag/);
  useCartStore.getState().setQuantity(`${p.id}|Navy|L`, 3); // stays local until merged
  expect(mockCalls).toHaveLength(1);
  mockFail = false;
  await useCartStore.getState().refresh();
  expect(mockCalls.at(-1)).toEqual({ path: '/me/cart/merge', body: { items: [{ variantId: 'v1', quantity: 3 }] } });
  expect(useCartStore.getState().lines[0].quantity).toBe(3);
  await useCartStore.getState().refresh();
  expect(mockCalls.at(-1)!.path).toBe('/me/cart');
});
