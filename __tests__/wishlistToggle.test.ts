import { Alert } from 'react-native';
import { useWishlistStore } from '../src/store/wishlistStore';

const mockSent: string[] = [];
let mockRelease = () => {};
jest.mock('../src/api/client', () => ({
  hasSession: () => true,
  api: (path: string, o: { method?: string } = {}) => {
    if (path === '/me/wishlist') {
      return Promise.resolve([{ id: 'server-only' }]);
    }
    mockSent.push(`${o.method} ${path}`);
    // The first PUT hangs, then fails: offline blip.
    return mockSent.length === 1
      ? new Promise((_, no) => (mockRelease = () => no(new Error('NETWORK'))))
      : Promise.resolve({});
  },
}));
jest.mock('../src/store/guestCopy', () => ({ keepForGuest: () => () => {} }));

test('heart on/off in quick succession: requests in tap order, a late failure does not flip it back', async () => {
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  useWishlistStore.getState().toggle('p1'); // on: PUT hangs
  useWishlistStore.getState().toggle('p1'); // off: DELETE waits for the PUT
  await Promise.resolve();
  expect(mockSent).toEqual(['PUT /me/wishlist/p1']);
  // A focus refresh while toggles are pending must not overwrite them.
  await useWishlistStore.getState().refresh();
  expect(useWishlistStore.getState().ids).toEqual([]);
  mockRelease();
  await new Promise<void>(r => setTimeout(r, 0));
  expect(mockSent).toEqual(['PUT /me/wishlist/p1', 'DELETE /me/wishlist/p1']);
  expect(useWishlistStore.getState().ids).toEqual([]); // no rollback over the later tap
  expect(Alert.alert).not.toHaveBeenCalled();
  await useWishlistStore.getState().refresh(); // nothing pending: server list adopted
  expect(useWishlistStore.getState().ids).toEqual(['server-only']);
});
