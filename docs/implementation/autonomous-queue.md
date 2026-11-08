# Autonomous work queue

Status: Working document for unattended agent runs
Started: 2026-11-05 01:40 IST
Owner instruction (2026-11-05, verbatim summary): push work to new branches, never to `main`; do not stop for human verification; make the app work end to end with a local DB and backend on dummy data; going live is a later decision; installing libraries and tools is allowed.

## Rules for every run

1. Lock: if `/Users/bonybarot/Desktop/projects/Test/.toj-agent.lock` was modified less than 45 minutes ago, another run is working: exit without changes. Otherwise `touch` it, and touch it again after every task.
2. Branches: TojApp `feature/api-integration`, toj-backend `feature/backend-core`. Never commit or push to `main`. Never force-push.
3. Take the first unchecked task below. Do it, then run the checks named in it. Commit with a conventional message, push the branch, tick the task, add a line to the log.
4. A task that needs an owner decision: record it under "Blocked: needs owner", tick it as skipped, move on. Never stop the run for a question.
5. Never: push to `main`, run `prisma migrate reset` or set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`, commit `.env`, enter credentials, start payment gateway / real SMS / production hosting work.
6. Stack: backend at `../toj-backend` (`eval "$(fnm env)" && fnm use` for Node 24; `npm run db:up`). App at `TojApp` (Node via system, iOS simulator).

## Backend (`toj-backend`, branch `feature/backend-core`)

- [x] B1 Full Prisma schema, migration, constraint SQL, idempotent seed from `prisma/seed-data/` (copied fixtures, INR paise demo prices). Checks: `npm run db:deploy`, seed twice, lint, typecheck, test
- [x] B2 Common: error filter with `{error:{code,message,details,requestId}}`, request id, `@Public()`, pagination DTO, throttler
- [x] B3 Catalogue: `GET /categories`, `/products` (q, filters, sort, pagination), `/products/:id`, `/store`, `/pickup-locations`. Unit tests for query building, e2e for endpoints
- [x] B4 Auth: OTP request/verify (fixed/random), JWT access, refresh rotation with family revocation, logout, `GET/PATCH /me`, global deny-by-default guard. e2e
- [x] B5 Wishlist and addresses (+merge), ownership tests
- [x] B6 Cart (clamp, merge, warnings)
- [x] B7 Checkout validate, order create transaction + idempotency + stock guard, list, detail, cancel + restock. Concurrency e2e (no overselling)
- [x] B8 Admin login, admin orders transition, admin inventory list/adjust
- [x] B9 `openapi.json` export script + committed file; docs (`IMPLEMENTATION_PROGRESS.md`, `LOCAL_DEVELOPMENT.md`)

## App (`TojApp`, branch `feature/api-integration`)

- [x] A1 `src/config/env.ts` base URL (iOS `localhost`, Android `10.0.2.2`), `src/api/client.ts` (fetch, timeout, ApiError, bearer, single-flight refresh), API types
- [x] A2 Catalogue from API (categories, products, product detail), loading/error states; fixtures kept for tests
- [x] A3 Auth from API (OTP request/verify, needsProfile, logout), tokens in memory only
- [x] A4 Wishlist, addresses, cart against API when signed in; guest merge at login
- [x] A5 Checkout validate + place order + orders list/detail/cancel; pickup-only UI; ₹ formatting from paise; pickup statuses
- [x] A6 Run on iOS simulator against local backend, walk the demo journey, fix what breaks
- [x] A7 Docs: ADR for API integration choices, `current-state.md`, `AGENTS.md`, changelog

## Phase 2 (added 2026-11-08; owner: "keep working, fix all gaps, improve features and UI")

Also after each task: merge `feature/api-integration` into `integration/v1` (`git worktree add -q ../.int-toj integration/v1`, `git pull --ff-only`, merge, push, `git worktree remove ../.int-toj`). Never merge into `main`. Never run Android and iOS builds at once (8 GB Mac).

- [x] B10 Product list and detail carry `rating: { average, count } | null` (one grouped aggregate per page, no N+1). e2e
- [x] A8 Product cards show `★ 4.0 (3)` when rated; PDP uses product rating for the summary line
- [x] B11 Moderation: `DELETE /admin/reviews/:id` (admin role), e2e; docs
- [x] A9 iOS: walk write/edit/delete review as demo customer 9876543210 (collected order 1002); fix what breaks
- [x] A10 Large text: Android font scale 1.3 and iOS largest Dynamic Type on Home, PDP, Bag, Checkout, Order details; fix clipping
- [x] A11 Pass over every screen for empty, loading and API-down states; fix gaps
- [x] A12 Sweep `docs/` for stale statements (test counts, NOT IMPLEMENTED lists); refresh `overnight-report.md`
- [x] A13 Android: API-down states (offline launch, search, resume)
- [x] B12 Revoked sessions in the JWT guard: decided no (backend B-31)
- [x] B13 pg concurrent-query warning: upstream adapter, recorded (backend B-32)
- [x] A14 Pull-to-refresh on Home, Bag, Wishlist
- [x] A15 Remove unused packages and unreachable address screens (ADR-0032)
- [x] A16 Android walk: filters, search, wishlist, checkout, cancel, Support, Settings
- [x] A17 Unlabeled tap targets: Android scan clean; card heart exposed as a screen-reader action
- [x] A18 Pickup address and hours on order confirmation and order details
- [x] A19 Bag: notice for server-removed sold-out lines and clamped quantities; guest sold-out lines block checkout
- [x] A20 OTP resend countdown (30 s, server cooldown)
- [x] A21 Personal info save busy/unchanged state; reset demo data confirms result
- [x] A22 Branded iOS launch screen (TOJ wordmark)
- [x] A23 Read-only Input styling
- [x] A24 Shop: All products / Sale tiles get their own images
- [x] A25 PDP: size error scrolls to size picker
- [x] A26 Gradient scrims keep photo colours
- [x] A27 Order details: pull to refresh
- [x] A28 After order: Back goes to My Orders
- [x] A29 App display name TOJ
- [x] A30 Unbranded shoe and coat images
- [x] A31 One photo per garment; Tank Top renamed Crew Neck Tee
- [x] A32 Help FAQ uses the server pickup store and hours
- [x] A33 Name inputs capped at the server's 60 characters
- [x] A34 OTP code submits itself on the sixth digit
- [x] A35 App stays light when the phone is in dark mode
- [x] A36 TOJ app icon on iOS and Android
- [x] A37 Product page pickup line uses the server store
- [x] A38 My Orders shows a spinner on first load and +N for long orders
- [x] A39 Guest bag waits for the catalogue instead of showing empty
- [x] A40 Android: no crash when the activity is recreated

## Blocked: needs owner

- Store identifiers: iOS bundle ID is still the template `org.reactjs.native.example.TojApp` (Android `com.tojapp`). The final reverse-domain ID depends on the company domain and cannot change after store release. Changing it now also signs every simulator out once (Keychain is per bundle ID).

## Log

- 2026-11-05 01:40 queue created; branches cut from `feature/toj-customer-ui` (TojApp) and `main` (toj-backend)
- 2026-11-05 B1-B6 schema, common, catalogue, auth, wishlist/addresses, cart (toj-backend `5d5348b`..`a9eb96f`)
- 2026-11-05 spec alignment of routes and shapes (`2e9b9ce`)
- 2026-11-05 B7 checkout + orders, no-oversell concurrency e2e (`987aa8f`)
- 2026-11-05 B8 admin auth, transitions, inventory (`b217837`)
- 2026-11-05 B9 openapi.json (32 paths), docs, decisions B-19..B-28 (`b3971b4`); lint/typecheck clean, unit 17, e2e 27
- 2026-11-05 A1-A5 API client, catalogue, auth, cart/wishlist/addresses, pickup-only checkout and orders against the local API; tsc/lint clean, jest 5
- 2026-11-05 A6 iOS build fixed for Xcode 26.4+/iOS 27 (fmt C++17, UIScene adoption, `bcd3b2f`); app launches and loads catalogue from the API. UI tap-through not done (simulator panel needs owner approval)
- 2026-11-05 A7 ADR-0031, current-state, AGENTS, changelog (`9a16b3c`); report in `overnight-report.md`
- 2026-11-05 05:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5; live API smoke pass (order 1006 placed and cancelled)
- 2026-11-05 06:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5
- 2026-11-05 06:58 UI journey walked on iOS simulator (TOJ-1007 placed and cancelled); copy fixes `577450f`; Android emulator build and launch OK
- 2026-11-05 08:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5
- 2026-11-05 08:37 UI journey walked on Android emulator (TOJ-1008 placed and cancelled); no fixes needed
- 2026-11-08 B10 product `rating` on list/detail/wishlist (backend `46087a7`); A8 cards show `★ 4.0 (n)`, PDP summary uses it until reviews load. Verified Android Tops grid
- 2026-11-08 A10: display text (logo, headings, labels, prices, buttons, tabs) capped at `FONT_CAP` 1.4 (tabs 1.2); glyph icons do not scale; body text scales fully. Checked iOS AX5 Home/PDP/Bag/Account/Orders/Order details, Android 1.3 Home/Bag.
- 2026-11-08 B11 admin `DELETE /admin/reviews/:id` (backend `85f021e`). A9 iOS: write 4★, edit 5★, delete; API and PDP agree each step. Fixed: order items open product details; My Orders kept its scroll position on return (focus reload no longer drives the iOS pull-to-refresh spinner)
- 2026-11-08 A11: Search and Wishlist show loading/error instead of "no results"/"empty" before the catalogue arrives; Addresses reloads on focus, shows an error with retry, delete failure alerts. Offline launch with a saved session resumes it once the catalogue loads again (iOS verified: API down, guest; API up, Try again, signed in)
- 2026-11-08 A12: current-state refreshed (signing, offline resume, large text, revoked-session note); overnight report gets a current summary and A9-A11; test counts 15 everywhere
- 2026-11-08 A13 Android: offline launch shows Home error, Search shows error not "no results", Try again resumes the session. B12/B13 recorded as backend B-31/B-32 (`92c9085`). A14: `usePull` hook; Home, Bag, Wishlist pull to refresh; Android Home and Bag spinner checked
- 2026-11-08 A15: removed nativewind, drawer, gesture-handler, reanimated, worklets, new-app-screen and the address screens (ADR-0032); fixed bag doubling when Fast Refresh re-ran `restore()` (test added, jest 16). A16 Android walk TOJ-1021 placed and cancelled. A17 uiautomator scan of tabs, list, PDP, orders: no unlabeled clickables; product-card wishlist heart now a custom accessibility action
- 2026-11-08 A18: pickup address and hours on confirmation and order details (iOS TOJ-1017, Android TOJ-1022 placed and cancelled)
- 2026-11-08 A19: cart `warnings` were ignored, so sold-out lines vanished silently. Bag notice + guest "Sold out" block; Android walked signed-in drop, guest block, merge at sign-in (stock set to 0 via psql, restored). jest 17
- 2026-11-08 A20: OTP resend countdown; Android screenshot "Code resent. Resend in 5s", then sign-in. uiautomator dumps go stale while the timer ticks (UI never idle); use screencap there
- 2026-11-08 A21: PersonalInfo busy + disabled-when-unchanged; Settings reset alerts "Demo data cleared" or server error. Android verified both
- 2026-11-08 A22: iOS LaunchScreen.storyboard was the RN template; now "T O J" light 40pt centred. Removed empty NSLocationWhenInUseUsageDescription. iOS rebuilt (xcodebuild OK, warning gone), splash screenshot checked
- 2026-11-08 A23: Input editable=false styled surface/secondary; iOS screenshot of Personal Information checked. iOS walk also confirmed: session survives reinstall, Save disabled when unchanged
- 2026-11-08 A24: Shop 'All products' and 'Sale' tiles reused Tops/Outerwear images; now pick product images not used by any category (sale tile from a discounted product). iOS: reset-demo confirm + 'Demo data cleared' alert verified; Shop grid shows 7 distinct tiles
- 2026-11-08 A25: tapping Add to bag without a size showed the hint below the fold on short screens; PDP now scrolls to the SIZE row. iOS verified (iPhone 17)
- 2026-11-08 A26: Home hero and category tiles used a flat 30-45% black overlay that greyed whole photos; now a bottom gradient (`experimental_backgroundImage`) behind the label only. Verified iOS (iPhone 17) and Android (Pixel 9 Pro)
- 2026-11-08 A27: Order details only refreshed on focus, so a status change while open (store confirms, collects) stayed stale and still offered Cancel. `Screen` takes a `pull` prop (RefreshControl); Order details uses it. Android verified: admin CONFIRMED TOJ-1025, pull showed it. Also walked guest bag, sign-in redirect to Checkout, order, collect, review post/edit on Android
- 2026-11-08 A28: "View order" after checkout replaced the confirmation, so Back landed on the emptied Bag/Home. Now resets to Account tab > My Orders > Order. Android verified (TOJ-1026)
- 2026-11-08 A29: home-screen name was "TojApp"; now "TOJ" (`CFBundleDisplayName`, Android `app_name`, `app.json` displayName). Verified built Info.plist and `aapt` label
- 2026-11-08 A30: shoe tile and shoe products showed Nike logos, Wool Coat a woman. Swapped seed + fixture images for unbranded ones; re-seeded; checked Shop > Shoes on Android.
- 2026-11-08 A31: several products showed another product's photo (Chinos = sweatpants, Bomber = leather jacket, Joggers = chinos, Jeans = Levi's). Gave each its own; Tops/Bottoms tiles changed; product 13 renamed Crew Neck Tee to match its photo. Checked Home on Android.
- 2026-11-08 A32: Help & Support FAQ had a hard-coded store and no hours answer. It now reads name, address and hours from the server pickup store. Checked on iOS.
- 2026-11-08 A33: a name over 60 characters got the server's generic "Request validation failed". Name inputs (sign-up, Personal Information) now stop at 60. Personal Information save checked on iOS and against PATCH /me.
- 2026-11-08 A34: the code screen waited for a Verify tap even after six digits or an SMS autofill. It now submits when the sixth digit arrives (once per entry; Verify still works). New-account sign-up checked on Android.
- 2026-11-08 A35: the app has no dark palette, but native alerts and pickers followed the phone's dark mode, giving dark dialogs over light screens. Android theme is now `Theme.AppCompat.Light.NoActionBar` and iOS `UIUserInterfaceStyle` is `Light`. Checked with the emulator in night mode.
- 2026-11-08 A36: Android still showed the stock robot icon and iOS had no icon. New TOJ wordmark icon (thin white strokes on black, drawn as shapes so no font licence is involved), generated by `scripts/make-icons.py`: iOS single 1024 px universal icon, Android legacy and round mipmaps plus an adaptive icon (API 26+). Checked in the Android launcher and on the iOS home screen.
- 2026-11-08 A37: the product page's "Available at …" line read the fixture store, not `GET /pickup-locations` (same miss as A32). It now reads `useProductStore.pickup`; only the store's initial value still comes from the fixture. Same text today, so no visible change.
- 2026-11-08 A38: My Orders flashed "No orders yet" before the first load finished; it now shows the spinner until the list arrives. Orders with more than four lines show "+N" after the thumbnails. Checked on Android.
- 2026-11-08 A39: on a cold start the Bag tab could show "Your bag is empty" for a saved guest bag, because it read the catalogue once with `getState()` and never re-rendered when it arrived. It now subscribes to the catalogue and shows a spinner, or an error with Try again, until it loads. Checked on Android with the API paused (SIGSTOP): spinner, then error after the 10 s timeout, then the bag after resume and Try again.
- 2026-11-08 A40: Android crashed ("Screen fragments should never be restored") whenever MainActivity was recreated: changing the system font size or language, or restoring the app after the OS killed it in the background. `MainActivity.onCreate` now sets react-native-screens' `RNScreensFragmentFactory`, as its README says. Checked on the emulator: font scale 1.3 then 1.0 while on My Orders; the app restarts at Home with no crash and stays signed in. Layout at 1.3x checked on Home and the product page.
