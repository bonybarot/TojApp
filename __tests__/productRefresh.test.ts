import { reloadProducts, useProductStore } from '../src/store/productStore';

let mockFail = false;
jest.mock('../src/api/client', () => ({
  api: (path: string) =>
    mockFail
      ? Promise.reject(new Error('offline'))
      : Promise.resolve(path.startsWith('/products') ? { items: [{ id: 'p1', price: 299900 }], total: 1 } : []),
}));

test('a catalogue refresh is quiet: keeps old data on failure, adopts new prices on success', async () => {
  useProductStore.setState({ products: [{ id: 'p1', price: 349900 } as never], status: 'ready' });
  mockFail = true;
  await useProductStore.getState().loadProducts();
  expect(useProductStore.getState().status).toBe('ready');
  expect(useProductStore.getState().products[0].price).toBe(349900);
  mockFail = false;
  const p = useProductStore.getState().loadProducts();
  expect(useProductStore.getState().status).toBe('ready'); // no skeleton flash
  await p;
  expect(useProductStore.getState().products[0].price).toBe(299900);
});

test('a pull during a background load shares its outcome (a failed load fails the pull too)', async () => {
  mockFail = true;
  const background = useProductStore.getState().loadProducts();
  await expect(reloadProducts()).rejects.toThrow();
  expect(await background).toBe(false);
  mockFail = false;
});
