# Overnight report: 2026-11-05

Status: Completion report for the autonomous queue ([autonomous-queue.md](autonomous-queue.md))

## Where it stands (2026-11-09 14:55 IST)
| Check | Result |
|---|---|
| App tsc, lint | 0 errors, 0 warnings |
| App jest | 10 suites, 44 tests |
| iOS simulator (iPhone 17) | Relaunched after the A77 lockfile bump; Home renders the API catalogue |
| Backend lint, typecheck | Clean; no pending migrations |
| Backend unit, e2e (vitest) | 19/19; 40/40 on ten consecutive runs after B26 |
| `npm audit` | Unchanged since A77/B25 |
| Queue | Every task ticked (B1-B26, A1-A78, D1-D2); open items under "Blocked: needs owner" in the queue |
| Heads | toj-backend `feature/backend-core` `264b21b`; TojApp `feature/api-integration` (this report's commit); both merged into their `integration/v1` |

14:43 run: queue was empty (lock stale 74 min). Re-ran every check: backend e2e failed once in seven runs. Cause: admin order search `q=TOJ-1426` also matched customers whose phone contains `1426`. Fixed as B26 (a `TOJ-` term searches the order number only; bare 4+ digits still match order number or phone). A78: iOS smoke after the lockfile bump (launch and Home render only; simulator tap tools are not available to scheduled runs, so no tap-through).

Run locally: `cd ../toj-backend && eval "$(fnm env)" && fnm use && npm run db:up && npm run db:deploy && npm run start:dev`, then in TojApp `npm start` and `npm run ios` (or `npm run android`). Demo phone `9876543210`, OTP `123456`.

Sections below are a dated log; numbers in older sections were true at their time.

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
- Real Android upload key not generated (build reads `TOJ_UPLOAD_*`; owner generates the key).
- OTP is the fixed demo code `123456`; no SMS.
- Catalogue is filtered on device; ceiling 50 products.
- Historical seed orders TOJ-1001..1004 include delivery orders that predate pickup-only.

## Needs owner decision (Level 3)
1. Session persistence: decided by the agent under the owner's 2026-11-08 delegation, ADR-0006 Accepted (Keychain/Keystore).
2. Search, filters, sort and sale rails: kept. Q-7 (approved 2026-10-31) supersedes D-12 for these.
3. Feature branches are merged into `integration/v1` (owner authorised new merge branches, 2026-11-07). `main` stays untouched until the owner merges it.

## Next milestone
Generate the real Android upload key; merge `integration/v1` into `main` when the owner is ready.

## Android flow testing (2026-11-05 08:50 IST, Pixel 9 Pro emulator)
New account (9000000123, name validation), empty states, profile edit, wishlist sync, low-stock clamp, guest-cart merge into a non-empty server cart, stale stock at checkout, cancel restock. Two bugs fixed:
- Non-pickup items could reach the bag but never be ordered: product details and bag now block them.
- Checkout kept stale stock after `INSUFFICIENT_STOCK`: now refreshes catalogue and server cart (order TOJ-1009 placed after refresh, then cancelled; inventory restored).

Dev note (superseded 2026-11-08): tokens were in memory then, so a Metro reload signed the app out. They now live in the Keychain/Keystore (ADR-0006).

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

## Catalogue edge cases and bag stepper (2026-11-08, Android)
- Sold out (Cotton Hoodie, seeded with 0 stock): grid badge "SOLD OUT", sizes announced "unavailable", button "Sold out" disabled.
- Sale category: 4 items, sale and compare-at prices match the DB.
- Price raised in the DB while on Checkout: "Prices changed…" message, summary updated to the new price, no order created; placing again created TOJ-1013 at the new price (then cancelled, price restored).
- Fixed: fast taps on the bag quantity stepper were lost, and an older server answer could undo a newer tap. Now 5 fast taps from 1 give 6 (UI = DB). New jest test `cartSync.test.ts` (fails without the fix).
- Known: product prices in lists, details and the bag come from the catalogue loaded at start (ADR-0031), so they can be stale until Checkout reports `PRICE_CHANGED`. Fixed 2026-11-08: when the server cart reports a `unitPrice` that differs from the catalogue, the app reloads the catalogue (verified on Android: price raised in DB, bag showed 2 × ₹3,499 after the next cart sync; price restored).

## Store-side order statuses (2026-11-08, Android)
- TOJ-1014 moved by the admin API through CONFIRMED, PACKED, READY_FOR_PICKUP, COLLECTED. Order details show each label and the pickup timeline; Cancel shows for placed and confirmed only; My Orders lists COLLECTED in green.
- Fixed: Cancel tapped on a screen still showing "Order placed" after the store packed the order: the error was right but the screen kept the old status and button. A refused cancel now re-reads the order (TOJ-1016).
- Fixed 2026-11-08: My Orders revalidates on focus, so a status changed while details were open shows on return (verified on Android, TOJ-1018 packed by the store).
- Test data: 10 Polo Navy L collected in TOJ-1014; restocked +10 through the admin inventory API.

## Guest wishlist and iOS guest checkout (2026-11-08)
- Android: heart as guest, sign in in-app: the heart is merged into the account wishlist (API and Wishlist screen agree).
- Fixed: card hearts had the same screen-reader label on every product; the label now names the product.
- iOS: guest adds Classic White T-Shirt (M), "Sign in to checkout", 9876543210 / 123456, returns to Checkout with the guest line merged into the account bag (quantities add), places TOJ-1017 (then cancelled through admin).
- Once this session the Android app was found signed out with no revoked session and no process restart; not reproduced (the next session held over 4 minutes with refresh rotations). Most likely a Metro reload during git operations.

## Small screen and foreground catalogue (2026-11-08, Android + iOS)
- Android at 360x640 dp (`wm size 1080x1920`): Home, Shop, All products, Bag fine; product details hid title and price under the square image. Fixed: image capped at 45% of window height.
- iPhone SE (3rd gen, iOS 27.2) simulator: Home layout fine. Deeper walk not done: `idb` taps and `describe-all` fail on iOS 27, and the control tool needs a grant for that device.
- Found: the foreground refresh never ran for guests. Metro's default inline requires load `userStore` (which registers the `AppState` listener) only when a screen first uses it; signed-in sessions had always loaded it, so the earlier verification passed. Fixed with an eager import in `App.tsx`; foreground now also reloads the catalogue. Verified on Android: price set to 309900 while backgrounded, list shows ₹3,099 on resume. Verified on iOS (iPhone 17) too: price set to 319900 while backgrounded, product details shows ₹3,199 on resume (same process).
- Android 360x640 dp, signed-in walk: sign-in (keyboard hides Send code; form scrolls; keyboard submit added), OTP, Account, Personal Information, Bag, Checkout, confirmation, order details, cancel (TOJ-1019, cancelled) all fit.

## Reviews (2026-11-08, Android)
Ravi (9000000123), collected TOJ-1018: "Write a review" shown; posting without stars shows "Choose a star rating."; 4-star review posted; order then shows "Edit your review", editor prefills; product details shows "★★★★☆ 4.0 · 1 review" with "Ravi · 8 Nov 2026 · Verified purchase". Backend e2e 28/28. iOS walked 2026-11-08 (A9, below).

## Reviews on iOS, large text, API-down states (2026-11-08)
- A9 iOS (iPhone 17), 9876543210 on collected order 1002: write 4★, edit to 5★, delete; API and product details agree each step. Fixed: order items open product details; My Orders keeps its scroll position on return.
- A10 large text: display text capped at `FONT_CAP` 1.4 (tabs 1.2), icon glyphs fixed size, body text scales. Checked iOS AX5 and Android 1.3.
- A11 API down: Search and Wishlist showed "no results" / "empty"; now loading or error with Try again. Addresses reloads on open, shows an error with retry; failed delete alerts. Found on iOS: launched offline with a saved session, the app stayed guest after the API came back (retry goes error, loading, ready, so the first fix never fired). Now resumes the session once the catalogue loads; jest covers the real sequence.

## Run 2026-11-09 05:43 IST
- Queue had no unchecked tasks. Re-ran every check (table above): all pass.
- D2 (`b0608a3`): `engineering-standards.md` conformance column and `testing.md` status still described the 2026-09-03 baseline; refreshed against `src/`. Docs only, no code changed.
- Skipped: simulator walks (no code change to verify).
- Owner decisions still open: see "Blocked: needs owner" in [autonomous-queue.md](autonomous-queue.md) (bundle ID, open-order cap, review moderation policy, customer disable flow, OTP abuse, idempotency mismatch, tokenised search, paging, admin lockout, DELIVERED in verified purchase, pg adapter, iPhone SE grant).

### Run everything locally
```bash
eval "$(fnm env)" && cd ../toj-backend && fnm use
npm run db:up && npm run db:deploy && npm run start:dev   # API at http://localhost:3000/api/v1
cd ../TojApp && npm start                                  # Metro
npm run ios      # or: npm run android (not both at once on this Mac)
```
Demo sign-in: 9876543210, OTP 123456.
