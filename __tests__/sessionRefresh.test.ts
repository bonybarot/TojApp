import {
  api,
  hasSession,
  setSessionLostHandler,
  setTokens,
} from '../src/api/client';

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as never;
const status = (s: number) =>
  Promise.resolve({ ok: s < 400, status: s, json: () => Promise.resolve({}) });
const lost = jest.fn();
setSessionLostHandler(lost);

beforeEach(() => {
  fetchMock.mockReset();
  lost.mockReset();
  setTokens({ accessToken: 'a', refreshToken: 'r' }, false);
});

test('a refresh that fails with 5xx keeps the session (server problem, not a lost session)', async () => {
  fetchMock.mockImplementation((url: string) =>
    status(url.endsWith('/auth/refresh') ? 503 : 401),
  );
  await expect(api('/me')).rejects.toMatchObject({ status: 503 });
  expect(hasSession()).toBe(true);
  expect(lost).not.toHaveBeenCalled();
});

test('a rejected refresh token ends the session once, however many calls 401ed together', async () => {
  fetchMock.mockImplementation(() => status(401));
  await Promise.allSettled([
    api('/me/cart'),
    api('/me/wishlist'),
    api('/me/orders'),
  ]);
  expect(hasSession()).toBe(false);
  expect(lost).toHaveBeenCalledTimes(1);
});

test('an answer that lands after sign-out is dropped', async () => {
  let answer!: (v: unknown) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise(r => {
        answer = r;
      }),
  );
  const pending = api('/me/cart');
  setTokens(null, false);
  answer({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ lines: [{ productId: 'old-account' }] }),
  });
  await expect(pending).rejects.toMatchObject({ code: 'SESSION_ENDED' });
});

test('logging out while the token is being renewed does not bring the session back', async () => {
  let renew!: (v: unknown) => void;
  fetchMock.mockImplementation((url: string) =>
    url.endsWith('/auth/refresh')
      ? new Promise(r => {
          renew = r;
        })
      : status(401),
  );
  const pending = api('/me/cart');
  await new Promise<void>(r => setTimeout(r, 0));
  setTokens(null, false);
  renew({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ accessToken: 'b', refreshToken: 's' }),
  });
  await expect(pending).rejects.toBeDefined();
  expect(hasSession()).toBe(false);
});
