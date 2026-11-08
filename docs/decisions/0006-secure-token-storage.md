# 0006. Secure token storage on the device

Date: 2026-11-08
Status: Accepted (agent, under the owner's 2026-11-08 delegation "take the good decisions"). Supersedes decision 3 of [0031](0031-app-api-integration.md)

## Context
Tokens lived in memory only, so every cold start signed the customer out. A shopping app that forgets the login each launch fails D-8 in practice: the account is required before checkout, and re-entering an OTP every time is friction.

## Decision
- Access and refresh token are stored with **`react-native-keychain` 10.0.0** (iOS Keychain, Android Keystore-backed), service `toj.session`, accessibility `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (no iCloud sync, no restore onto another phone).
- Written on sign-in and on every refresh; wiped on logout and when the server rejects the refresh (session lost).
- App start (`userStore.restore`): read tokens, call `GET /me`. Success: signed in, account data loads. 401 + failed refresh: cleared. Network failure: stays guest for this run, tokens kept for the next launch.
- Nothing else is stored on the device (cart and wishlist of a signed-in customer live on the server; a guest bag is still lost on cold start).

## Alternatives rejected
- **AsyncStorage**: plain-text on disk; never for credentials (security-architecture.md).
- **expo-secure-store**: needs Expo modules in a bare app; more native weight for the same result.
- **Keep memory-only**: the cost above.

## Consequences
- One native dependency (pod `RNKeychain`, Android autolinked). Jest uses `__mocks__/react-native-keychain.ts`.
- Test: `__tests__/sessionRestore.test.ts` (resume, offline start, logout wipe).
- Guest bag persistence is a separate, later decision.
