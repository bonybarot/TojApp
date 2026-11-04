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
| Tapping through the UI journey on the simulator | **NOT DONE**: simulator control needs owner approval of the panel, which was not available unattended. Covered at API level by the journey script |
| Android | NOT RUN |

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
Walk the full UI journey on the simulator (sign in, bag, checkout, cancel) with the simulator panel approved, then Android emulator run.
