import { products } from '../src/data/products';
import { useCartStore } from '../src/store/cartStore';
import { useProductStore } from '../src/store/productStore';

jest.mock('../src/api/client', () => ({ hasSession: () => false, api: jest.fn() }));

test('guest bag drops items that left the catalogue once it loads', () => {
  const [a, b] = products;
  useCartStore.setState({
    lines: [a, b].map(p => ({ lineId: `${p.id}|Navy|L`, productId: p.id, color: 'Navy', size: 'L', quantity: 1 })),
  });
  useProductStore.setState({ products: [a], status: 'loading' });
  expect(useCartStore.getState().lines).toHaveLength(2); // not loaded yet: keep everything
  useProductStore.setState({ status: 'ready' });
  expect(useCartStore.getState().lines.map(l => l.productId)).toEqual([a.id]);
  expect(useCartStore.getState().notice).toMatch(/no longer available/);
});
