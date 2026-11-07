# Overnight report: 2026-11-05

Status: Completion report for the autonomous queue ([autonomous-queue.md](autonomous-queue.md))

## Completed
- **Backend B1-B9** (`toj-backend`, branch `feature/backend-core`): schema and seed, common error and request handling, catalogue, OTP auth with JWT refresh rotation, wishlist, addresses, cart, checkout and orders with idempotency and no-oversell, admin orders and inventory, `openapi.json`. Lint and typecheck clean; unit 17, e2e 27.
- **App A1-A5** (`TojApp`, branch `feature/api-integration`): fetch API client, catalogue, OTP auth, cart, wishlist, addresses, pickup-only checkout and orders against the local API ([ADR-0031](../decisions/0031-app-api-integration.md)).
- **A6**: iOS build fixed for Xcode 26.4+ / iOS 27 (fmt C++17 Podfile override; UIScene lifecycle adoption). App launches on the iPhone 17 simulator and renders the catalogue from the API.
- **A7**: ADR-0031, `current-state.md`, `AGENTS.md`, changelog, this report.

## Verification
| Check | Result |
|---|---|
| `npx tsc --noEmit`, `npm run lint` | 0 errors, 0 warnings |
| `npm test` | 2 suites, 5 tests pass |
| API journey script (OTP new account, cart merge, wishlist, address, order, idempotent replay, cancel, refresh, logout) | Pass against `localhost:3000` |
| iOS simulator | Builds, launches, home screen shows API products (product store starts empty, so the hero proves an API load) |
| Tapping through the UI journey on the simulator | Done 06:52 IST, see below |
| Android | Pixel 9 Pro emulator (API via `10.0.2.2`): builds, launches, journey tapped through 08:37 IST, see below |

## Re-verification run (2026-11-05 05:13 IST)
Queue had no unchecked tasks; this run re-ran every check on the pushed heads (`toj-backend` `feature/backend-core`, `TojApp` `d2aa093`). No code changed.

| Check | Result |
|---|---|
| Backend `db:deploy` | No pending migrations |
| Backend lint, typecheck | Clean |
| Backend unit / e2e (vitest) | 17 / 27 pass |
| App tsc, lint, jest | Clean, clean, 5 pass |
| Live API smoke (seeded demo account): categories, products (`pickup&inStock`), detail, pickup locations, OTP request/verify, `/me`, cart set, wishlist add, checkout validate, place order, list, detail, cancel | Pass; order 1006 placed then cancelled (stock restored) |

Still not done: UI tap-through on the simulator, Android run.

## Re-verification run (2026-11-05 06:13 IST)
No unchecked tasks; checks re-run on pushed heads (`TojApp` `01651b6`, `toj-backend` `feature/backend-core`). No code changed.

| Check | Result |
|---|---|
| Backend `db:deploy` | No pending migrations |
| Backend lint, typecheck | Clean |
| Backend unit / e2e (vitest) | 17 / 27 pass |
| App tsc, lint, jest | Clean, clean, 5 pass |

## Re-verification run (2026-11-05 08:13 IST)
No unchecked tasks; checks re-run on pushed heads (`TojApp` `ff88b34`, `toj-backend` `b3971b4`). No code changed.

| Check | Result |
|---|---|
| Backend `db:deploy` | No pending migrations |
| Backend lint, typecheck | Clean |
| Backend unit / e2e (vitest) | 17 / 27 pass |
| App tsc, lint, jest | Clean, clean, 5 pass |

## UI walkthrough (2026-11-05 06:52 IST, iPhone 17 simulator, iOS 27.2)
Guest adds Classic White T-Shirt (White, M) to bag, then "Sign in to checkout", phone `9876543210`, OTP `123456`, back to Checkout with the guest bag merged. Pay at store, place order: TOJ-1007, ₹2,999, store pickup. View order, cancel: CANCELLED. My Orders lists it. Log out returns to the guest profile. All pass.

Fixed during the walk (`577450f`):
- Product detail said "Home delivery available. Free over $100"; now shows store pickup only.
- Support FAQ described delivery fees; now says orders are collected from the store.
- Profile showed `+9876543210`; now `+91 9876543210`.
- Order list said "1 items"; now singular.

tsc, lint and jest (5) clean after the fixes.

## Android walkthrough (2026-11-05 08:37 IST, Pixel 9 Pro emulator)
Same journey as iOS: guest adds Classic White T-Shirt (White, M), "Sign in to checkout", `9876543210` / `123456`, Checkout with the merged bag, Pay at store, place order: TOJ-1008, ₹2,999, store pickup. View order, cancel via the native dialog: CANCELLED. My Orders lists TOJ-1008, then 1007, 1006. Log out returns to the guest profile. All pass; no code change needed, no JS errors in logcat. The iOS copy fixes (`577450f`) show correctly on Android.

## Decisions made (Level 1-2)
- ADR-0031: fetch client, base URL in `src/config/env.ts`, tokens in memory, server as source of truth with guest merge, catalogue loaded once (50 max), pickup-only checkout with idempotency key and `expectedTotal`.
- Podfile override for fmt / RCT-Folly (remove when React Native ships a fixed fmt).
- `SceneDelegate` in `AppDelegate.swift` starts React Native in the scene window.

## Limitations
- Cold start signs out (no device persistence, not approved).
- OTP is the fixed demo code `123456`; no SMS.
- Catalogue is filtered on device; ceiling 50 products.
- Historical seed orders TOJ-1001..1004 include delivery orders that predate pickup-only.

## Needs owner decision (Level 3)
1. Device persistence of the session token (Keychain) so a cold start keeps the user signed in.
2. Search, filters, sort and sale rails exist although D-12 deferred them: keep or hide.
3. Merge `feature/backend-core` and `feature/api-integration` (not done: merges need owner authorisation).

## Next milestone
Owner decisions above (session persistence, D-12 rails, merging the two feature branches).

## Android flow testing (2026-11-05 08:50 IST, Pixel 9 Pro emulator)
New account (9000000123, name validation), empty states, profile edit, wishlist sync, low-stock clamp, guest-cart merge into a non-empty server cart, stale stock at checkout, cancel restock. Two bugs fixed:
- Non-pickup items could reach the bag but never be ordered: product details and bag now block them.
- Checkout kept stale stock after `INSUFFICIENT_STOCK`: now refreshes catalogue and server cart (order TOJ-1009 placed after refresh, then cancelled; inventory restored).

Dev note: Metro hot reload of a store or client module re-creates the in-memory session, so the app signs out. Expected for in-memory tokens.

## Backend-down and token refresh (2026-11-05 09:10 IST, Android)
- API paused: Home and All products show skeleton then "Something went wrong / Try again" after the 10 s timeout; sign-in shows "Cannot reach the TOJ server". Resuming the API and tapping Try again loads 21 products.
- Fixed: a network failure during token refresh signed the user out. `api/client.ts` now rethrows the network error and keeps the session.
- Access token expired (15 min) then pull-to-refresh on My Orders: refresh rotated the session silently (`Session.rotatedAt` set), orders reloaded.

## Small and tablet screens (2026-11-05 09:37 IST, Android emulator via `wm size`)
- 720x1280 @ 320 (360x640 dp): PDP, bag, sign-in, OTP, profile, personal info, checkout usable. Fixed: keyboard covered Send code / Verify (Android 15 forces edge-to-edge, so `adjustResize` no longer shrinks the window; KAV was also off by the header height). `Screen` now uses `behavior="padding"` on both platforms with `keyboardVerticalOffset` = its `measure()` page Y.
- 1600x2560 @ 320 (800x1280 dp): grids were 2 huge columns. Now `useGridColumns()` (width / 220, min 2): 3 columns on this tablet, 2 on phones. Home hero capped at 420 dp. Checkout full width, usable.
- tsc 0, lint 0, jest 6/6. iOS not re-checked for the keyboard change (simulator taps unavailable this session).

## iOS flows and server revalidation (2026-11-05 09:47 IST, iPhone 17 simulator)
- New account 9000000123 signed in; Personal Information with the keyboard up keeps Save visible (the `Screen` keyboard change from the Android run holds on iOS).
- Fixed: My Orders kept the list loaded at sign-in. TOJ-1010 placed through the API did not appear; it now reloads on open (`8de1b32`). Cancelling TOJ-1010 in the app after it was already cancelled server-side shows CANCELLED with no error (cancel is idempotent).
- Fixed: a signed-in bag change made while the server was down stayed local. Bag now re-adopts the server cart on focus: quantity 2 set through the API appeared on opening Bag (`6aee72e`).
- `CART_EMPTY` at checkout (server cart emptied elsewhere): bag refreshed, Checkout shows "Your bag is empty", no order created.
- Note: `Addresses` / `AddressForm` screens are registered but unreachable (pickup-only checkout). Left in place for delivery later.

## Revoked session (2026-11-07 15:05 IST, Android + iOS)
- Backend: customer access-token TTL now env `ACCESS_TTL_S` (default 900; `toj-backend` 45dc596). Local `.env` set to 60 to test expiry. e2e pins 900.
- Sessions revoked in the DB, then My Orders opened after the access token expired: refresh fails, "Signed out" alert, app lands on the guest Account tab. Before the fix, the reset targeted a non-existent tab route (`Account`; the route is `Profile`) and landed on Home.
- The JWT guard does not check the session table, so a revoked session stays usable until its access token expires (up to `ACCESS_TTL_S`). Accepted for now; note for owner review.

## Cross-device sync (2026-11-07, Android + iOS)
Same account (9000000123) signed in on the Pixel 9 Pro emulator and the iPhone 17 simulator.
- Bag: Polo Navy L added on Android shows in iOS Bag; quantity 2 set on iOS shows on Android (₹7,998).
- Fixed: Wishlist kept the list loaded at sign-in. It now re-reads the server wishlist on focus (`wishlistStore.refresh`). Hearts on grids and product details update after the Wishlist screen is visited (not on their own focus).
- Order TOJ-1011 placed on Android, cancelled on iOS: CANCELLED in the DB.
- Fixed: Order details showed the stale "Order placed" after a cancel on another device. It now re-reads the order on focus (`orderStore.refreshOne`). Verified: TOJ-1012 placed on Android, cancelled through the API, "View order" shows CANCELLED.
- OTP limit (5 codes per phone per hour) blocked re-sign-in during testing; cleared the test phone's `OtpChallenge` rows in the local DB. Backend e2e 27/27.
- tsc 0, lint 0, jest 6/6.

## Foreground refresh and demo reset (2026-11-08, Android + iOS)
- Returning the app to the foreground re-reads cart, wishlist and orders when signed in. Verified on both: Classic White T-Shirt hearted through the API while backgrounded shows filled on resume.
- Fixed: "Reset demo data" cleared only the device; signed-in bag and wishlist came back on the next refresh. It now deletes the server cart and wishlist too.
- iOS tooling note: the simulator MCP screenshot lags several seconds; `xcrun simctl io booted screenshot` is current.
