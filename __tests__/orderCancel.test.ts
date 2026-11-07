import { useOrderStore } from '../src/store/orderStore';

// Server: cancel is refused (store already packed it); GET returns the packed order.
jest.mock('../src/api/client', () => ({
  api: (path: string) =>
    path.endsWith('/cancel')
      ? Promise.reject(new Error('This order can no longer be cancelled'))
      : Promise.resolve({ id: 'TOJ-1', status: 'PACKED' }),
}));

test('a refused cancel shows the real status', async () => {
  useOrderStore.setState({ orders: [{ id: 'TOJ-1', status: 'PLACED' } as never] });
  await expect(useOrderStore.getState().cancelOrder('TOJ-1')).rejects.toThrow('no longer');
  await new Promise<void>(r => setTimeout(r, 0));
  expect(useOrderStore.getState().orders[0].status).toBe('PACKED');
});
