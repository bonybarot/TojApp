import * as Keychain from 'react-native-keychain';
import { hasSession, setTokens, storedTokens } from '../src/api/client';
import { restoreGuestBag, useCartStore } from '../src/store/cartStore';
import { useUserStore } from '../src/store/userStore';
import { restoreGuestWishlist, useWishlistStore } from '../src/store/wishlistStore';

const STORE = { service: 'toj.session' };
const saved = { accessToken: 'a', refreshToken: 'r' };
const fetchMock = jest.fn();
globalThis.fetch = fetchMock as never;
const reply = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });

beforeEach(() => {
  fetchMock.mockReset();
  useUserStore.setState({ user: null, isLoggedIn: false });
});

test('cold start resumes the saved session', async () => {
  await Keychain.setGenericPassword('toj', JSON.stringify(saved), STORE);
  fetchMock.mockImplementation((url: string) =>
    reply(url.endsWith('/me') ? { id: 'c1', name: 'Ravi', phone: '+919000000123' } : url.includes('/orders') ? { items: [] } : { lines: [] }),
  );
  await useUserStore.getState().restore();
  expect(useUserStore.getState().user).toEqual({ id: 'c1', name: 'Ravi', phone: '9000000123' });
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer a');
});

test('offline at start: stays guest, keeps the saved session for next launch', async () => {
  await Keychain.setGenericPassword('toj', JSON.stringify(saved), STORE);
  fetchMock.mockRejectedValue(new Error('offline'));
  await useUserStore.getState().restore();
  expect(useUserStore.getState().isLoggedIn).toBe(false);
  expect(hasSession()).toBe(false);
  expect(await storedTokens()).toEqual(saved);
});

test('logout wipes the saved session', async () => {
  await Keychain.setGenericPassword('toj', JSON.stringify(saved), STORE);
  fetchMock.mockImplementation(() => reply({}));
  await useUserStore.getState().logout();
  await new Promise<void>(r => setTimeout(r, 0));
  expect(await storedTokens()).toBeNull();
});

test('guest bag survives a cold start; signing in moves it to the server and wipes the device copy', async () => {
  const BAG = { service: 'toj.guestBag' };
  const line = { lineId: 'p1|Black|M', productId: 'p1', color: 'Black', size: 'M', quantity: 2 };
  useCartStore.setState({ lines: [line] });
  await new Promise<void>(r => setTimeout(r, 0));
  const kept = await Keychain.getGenericPassword(BAG);
  useCartStore.setState({ lines: [] }); // a fresh process starts with an empty bag
  await new Promise<void>(r => setTimeout(r, 0));
  await Keychain.setGenericPassword('toj', kept ? kept.password : '', BAG);
  await restoreGuestBag();
  expect(useCartStore.getState().lines).toEqual([line]);
  setTokens(saved, false);
  useCartStore.setState({ lines: [line] });
  await new Promise<void>(r => setTimeout(r, 0));
  expect(await Keychain.getGenericPassword(BAG)).toBe(false);
  setTokens(null, false);
});

test('guest wishlist survives a cold start', async () => {
  const W = { service: 'toj.guestWishlist' };
  useWishlistStore.setState({ ids: ['p1'] });
  await new Promise<void>(r => setTimeout(r, 0));
  const kept = await Keychain.getGenericPassword(W);
  useWishlistStore.setState({ ids: [] });
  await new Promise<void>(r => setTimeout(r, 0));
  await Keychain.setGenericPassword('toj', kept ? kept.password : '', W);
  await restoreGuestWishlist();
  expect(useWishlistStore.getState().ids).toEqual(['p1']);
});
