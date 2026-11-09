import { useOrderStore } from '../src/store/orderStore';

// Server: cancel is refused (store already packed it); GET returns the packed order.
let mockList: (items: unknown[], total?: number) => void = () => {};
let mockSession = true;
jest.mock('../src/api/client', () => ({
  hasSession: () => mockSession,
  api: (path: string) =>
    path.startsWith('/orders?')
      ? new Promise(r => (mockList = (items, total) => r({ items, total })))
      : path.endsWith('/cancel')
      ? Promise.reject(new Error('This order can no longer be cancelled'))
      : Promise.resolve({ id: 'TOJ-1', status: 'PACKED' }),
}));

test('a refused cancel shows the real status', async () => {
  useOrderStore.setState({
    orders: [{ id: 'TOJ-1', status: 'PLACED' } as never],
  });
  await expect(useOrderStore.getState().cancelOrder('TOJ-1')).rejects.toThrow(
    'no longer',
  );
  await new Promise<void>(r => setTimeout(r, 0));
  expect(useOrderStore.getState().orders[0].status).toBe('PACKED');
});

test('an order placed while the list loads is not dropped by the older list', async () => {
  useOrderStore.setState({ orders: [] });
  const load = useOrderStore.getState().load();
  await useOrderStore
    .getState()
    .placeOrder({
      pickupLocationId: 'p',
      paymentMethod: 'PAY_AT_STORE',
      idempotencyKey: 'k',
      expectedTotal: 1,
    });
  mockList([{ id: 'TOJ-0', status: 'COMPLETED' }]);
  await load;
  expect(useOrderStore.getState().orders.map(o => o.id)).toEqual([
    'TOJ-1',
    'TOJ-0',
  ]);
});

test('of two overlapping list loads, the older answer does not override the newer one', async () => {
  const first = useOrderStore.getState().load();
  const answerFirst = mockList;
  const second = useOrderStore.getState().load();
  answerFirst([{ id: 'TOJ-1', status: 'PLACED' }]); // older load answers first
  await first;
  mockList([{ id: 'TOJ-1', status: 'CANCELLED' }]);
  await second;
  expect(useOrderStore.getState().orders[0].status).toBe('CANCELLED');
});

test('a list or order answered after sign-out does not reappear', async () => {
  useOrderStore.setState({ orders: [] });
  const load = useOrderStore.getState().load();
  const one = useOrderStore.getState().refreshOne('TOJ-1');
  mockSession = false;
  useOrderStore.getState().reset();
  mockList([{ id: 'TOJ-9', status: 'PLACED' }]);
  await Promise.all([load, one]);
  expect(useOrderStore.getState()).toMatchObject({ orders: [], status: 'idle' });
  mockSession = true;
});

test('older orders page in on demand, and a refresh keeps the pages already shown', async () => {
  useOrderStore.getState().reset();
  const load = useOrderStore.getState().load();
  mockList([{ id: 'TOJ-3' }, { id: 'TOJ-2' }], 3);
  await load;
  const more = useOrderStore.getState().loadMore();
  expect(useOrderStore.getState().loadMore()).toBe(more); // one page on the wire at a time
  mockList([{ id: 'TOJ-2' }, { id: 'TOJ-1' }], 3); // a shifted page repeats a row: deduped
  await more;
  expect(useOrderStore.getState().orders.map(o => o.id)).toEqual(['TOJ-3', 'TOJ-2', 'TOJ-1']);
  const again = useOrderStore.getState().load();
  mockList([{ id: 'TOJ-3' }, { id: 'TOJ-2' }], 3);
  await again;
  expect(useOrderStore.getState().orders).toHaveLength(3);
  await useOrderStore.getState().loadMore(); // all loaded: no request
});
