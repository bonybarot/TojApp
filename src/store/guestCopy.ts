import * as Keychain from 'react-native-keychain';
import { StoreApi, UseBoundStore } from 'zustand';
import { hasSession } from '../api/client';

// ADR-0006 amendment: guest bag and wishlist survive a cold start. Signed in, the server holds the copy.
// ponytail: Keychain as a small key-value store; move to AsyncStorage if more non-secret device state appears.
/** Mirror one array field of a store to the device while a guest; returns the start-up restore. */
export const keepForGuest = <S, K extends keyof S>(store: UseBoundStore<StoreApi<S>>, key: K, service: string) => {
  const opts = { service, accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
  store.subscribe(s => {
    const v = s[key] as unknown[];
    (hasSession() || !v.length
      ? Keychain.resetGenericPassword(opts)
      : Keychain.setGenericPassword('toj', JSON.stringify(v), opts)
    ).catch(() => {});
  });
  /** App start as a guest: bring back the last run's copy (unless something was added meanwhile). */
  return async () => {
    const c = await Keychain.getGenericPassword(opts).catch(() => false as const);
    try {
      if (c && !hasSession() && !(store.getState()[key] as unknown[]).length) {
        store.setState({ [key]: JSON.parse(c.password) } as Partial<S>);
      }
    } catch {}
  };
};
