# 0006. Secure token storage on the device

Date: 2026-11-08
Status: Accepted (agent, under the owner's 2026-11-08 delegation "take the good decisions"). Supersedes decision 3 of [0031](0031-app-api-integration.md)

## Context
Tokens lived in memory only, so every cold start signed the customer out. A shopping app that forgets the login each launch fails D-8 in practice: the account is required before checkout, and re-entering an OTP every time is friction.

## Decision
- Access and refresh token are stored with **`react-native-keychain` 10.0.0** (iOS Keychain, Android Keystore-backed), service `toj.session`, accessibility `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (no iCloud sync, no restore onto another phone).
- Written on sign-in and on every refresh; wiped on logout and when the server rejects the refresh (session lost).
- App start (`userStore.restore`): read tokens, call `GET /me`. Success: signed in, account data loads. 401 + failed refresh: cleared. Network failure: stays guest for this run, tokens kept for the next launch.
- Cart and wishlist of a signed-in customer live on the server. The guest bag and wishlist are kept on the device (amendment below).

## Alternatives rejected
- **AsyncStorage**: plain-text on disk; never for credentials (security-architecture.md).
- **expo-secure-store**: needs Expo modules in a bare app; more native weight for the same result.
- **Keep memory-only**: the cost above.

## Consequences
- One native dependency (pod `RNKeychain`, Android autolinked). Jest uses `__mocks__/react-native-keychain.ts`.
- Test: `__tests__/sessionRestore.test.ts` (resume, offline start, logout wipe).
- Guest bag and wishlist persistence: see the amendment below.

## Amendment 2026-11-08: guest bag

- The guest bag (cart lines of a customer who is not signed in) is kept in the Keychain/Keystore under service `toj.guestBag`, same accessibility as the session.
- Written on every bag change while there is no session; wiped when the bag is empty or a session exists (after sign-in the server cart is the copy).
- Loaded at start only when no session is restored and the bag is still empty.
- Why the Keychain and not AsyncStorage: `react-native-keychain` is already installed, so no new native dependency or rebuild. Ceiling: it is a secure store used as a small key-value store; move to AsyncStorage if more non-secret device state appears.
- Restored lines are not re-clamped to stock on start; the server clamps them at sign-in merge, and Checkout requires sign-in (D-8).
- Guest wishlist hearts follow the same rules under service `toj.guestWishlist` (product ids). Both go through `src/store/guestCopy.ts`.

## Amendment 2026-11-09: copy kept until the sign-in merge lands (A73)

- Supersedes "wiped when ... a session exists" and "loaded at start only when no session is restored" above.
- Signed in, the device copy is no longer wiped on the next store change. It is wiped (`forget`) once the sign-in merge into the account succeeds, or the server rejects it outright. While a bag merge is pending (failed offline), edits keep updating the copy.
- At a signed-in cold start a copy still present means its merge never landed: it is restored and merged then. Before, killing the app between a failed merge and its retry lost the guest bag.
- Known window: killed while the merge request is on the wire, the next start merges again under a new idempotency key (double add if the first landed).
