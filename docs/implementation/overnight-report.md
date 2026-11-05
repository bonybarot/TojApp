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
