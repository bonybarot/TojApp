import * as Keychain from 'react-native-keychain';
import { StoreApi, UseBoundStore } from 'zustand';
import { hasSession } from '../api/client';

// ADR-0006 amendment: guest bag and wishlist survive a cold start. Signed in, the server holds the copy.
// ponytail: Keychain as a small key-value store; move to AsyncStorage if more non-secret device state appears.
/**
 * Mirror one array field of a store to the device while a guest, or while `held` (signed in but the
 * guest copy is not on the server yet). The copy outlives sign-in until `forget`, called once the
 * merge into the account succeeded, so a kill before that merge does not lose the guest bag.
 */
export const keepForGuest = <S, K extends keyof S>(
  store: UseBoundStore<StoreApi<S>>,
  key: K,
  service: string,
  held: () => boolean = () => false,
) => {
  const opts = { service, accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };
  store.subscribe(s => {
    if (hasSession() && !held()) {
      return;
    }
    const v = s[key] as unknown[];
    (v.length ? Keychain.setGenericPassword('toj', JSON.stringify(v), opts) : Keychain.resetGenericPassword(opts)).catch(
      () => {},
    );
  });
  return {
    /** App start: bring back the last run's copy (unless something was added meanwhile). Signed in, a copy left means its merge never finished. */
    restore: async () => {
      const c = await Keychain.getGenericPassword(opts).catch(() => false as const);
      try {
        if (c && !(store.getState()[key] as unknown[]).length) {
          store.setState({ [key]: JSON.parse(c.password) } as Partial<S>);
        }
      } catch {}
    },
    forget: () => {
      Keychain.resetGenericPassword(opts).catch(() => {});
    },
  };
};
