// In-memory Keychain for Jest.
const store = new Map<string, string>();
export const ACCESSIBLE = { AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AfterFirstUnlockThisDeviceOnly' };
export const setGenericPassword = async (username: string, password: string, o: { service: string }) => {
  store.set(o.service, password);
  return { service: o.service, storage: 'mock' };
};
export const getGenericPassword = async (o: { service: string }) =>
  store.has(o.service) ? { username: 'toj', password: store.get(o.service)!, service: o.service, storage: 'mock' } : false;
export const resetGenericPassword = async (o: { service: string }) => store.delete(o.service);
