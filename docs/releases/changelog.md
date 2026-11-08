# Changelog


## [Unreleased] — 2026-11-05 app connected to the local API (`feature/api-integration`)

### Added
- Product cards show the star average and review count when rated; the API carries `rating` on products (ADR-0028)
- `src/api/client.ts`, `src/config/env.ts`; [ADR-0031](../decisions/0031-app-api-integration.md).
- Session survives a cold start: tokens in Keychain/Keystore via `react-native-keychain` 10.0.0, restored with `GET /me` at launch; wiped on logout and session loss ([ADR-0006](../decisions/0006-secure-token-storage.md), `__tests__/sessionRestore.test.ts`).
- Android release signing reads the upload key from `TOJ_UPLOAD_*` gradle properties (BUILD-01 config; falls back to the debug key for local builds).
- Guest bag survives a cold start (Keychain service `toj.guestBag`, ADR-0006 amendment); wiped once a session exists. Guest wishlist hearts too (`toj.guestWishlist`).
- Product reviews ([ADR-0028](../decisions/0028-reviews.md)): REVIEWS section on product details; "Write a review" on collected orders; `WriteReview` screen; `src/api/reviews.ts`.
- Product details shows the star average and review count under the price (above the fold).
- Order details: tapping an item's image or title opens its product.
- OTP screen: "Resend in Ns" countdown matching the server's 30-second cooldown, instead of a rate-limit error.
- Bag says when the server removed sold-out items or reduced quantities to stock (cart `warnings`), once per visit. A guest line that sold out is marked "Sold out" and blocks checkout.
- Order confirmation and order details show the pickup store's address and opening hours (hidden once cancelled).
- Pull-to-refresh on Home (catalogue), Bag (prices, stock, server bag) and Wishlist; shared `usePull` hook in `src/hooks.ts` (My Orders uses it too).

### Changed
- Bag tab screen-reader label says "1 item", not "1 items".
- Catalogue, auth (OTP request/verify, needsProfile, logout), cart, wishlist, addresses, orders come from `toj-backend`. Guest cart and wishlist merge at sign-in.
- Checkout pickup-only (Q-2) with idempotency key; delivery fee removed; payment `PAY_AT_STORE` / `CARD_SIMULATED`.
- Prices in paise, shown as `₹` with Indian grouping. Order statuses `READY_FOR_PICKUP`, `COLLECTED`.
- `ios/Podfile`: `fmt` and `RCT-Folly` pods built as C++17 so they compile with Xcode 26.4+ clang.

### Removed
- Unused packages `nativewind`, `@react-navigation/drawer`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets`, `@react-native/new-app-screen` and the Reanimated babel plugin ([ADR-0032](../decisions/0032-remove-unused-app-code.md)).
- Addresses and AddressForm screens and `addressStore`: unreachable with pickup-only checkout; backend API unchanged.

### Fixed

- Shop: the "All products" and "Sale" tiles no longer repeat the Tops and Outerwear images; they use catalogue product images no category uses (A24).
- Product details: "Add to bag" without a size now scrolls to the size picker so the "Please select a size" hint is visible (A25).
- Home hero and category tiles: photos keep their real colours; a bottom gradient keeps the label legible (A26).
- Order details: pull down to refresh the status (A27).
- After placing an order, Back from the order goes to My Orders (A28).
- The app is named "TOJ" on the home screen (A29).
- Shoe and coat photos no longer show other brands' logos or womenswear (A30).
- Each product shows its own photo; "Tank Top" is now "Crew Neck Tee" (A31).
- Help & Support shows the pickup store, address and opening hours from the server (A32).
- Name fields stop at 60 characters, the server limit (A33).
- Read-only inputs (Personal Information mobile number) looked editable; `Input` with `editable={false}` now uses the surface background and secondary text.
- iOS launch screen showed React Native's template ("TojApp", "Powered by React Native"); it now shows the TOJ wordmark centred. Empty `NSLocationWhenInUseUsageDescription` removed from `Info.plist` (the app uses no location; App Review rejects empty usage strings).
- Personal Information: Save showed no progress and could send twice; it now shows a spinner and is disabled while the name is unchanged.
- Settings → Reset demo data gave no feedback; it now confirms, or says the server could not be reached.
- `src/screens/auth/` was tracked lowercase while imports and disk use `Auth/`; a case-sensitive clone (Linux CI) could not resolve the sign-in screens. Renamed in git.
- Bag quantities doubled when Fast Refresh re-ran session restore while signed in; `restore()` now returns early when already signed in.
- Product-card wishlist heart was unreachable by VoiceOver/TalkBack (nested in the card button); the card now offers "Add to wishlist" as an accessibility action.
- API down: Search and Wishlist showed "no results" and "empty"; they now show loading or an error with Try again. Addresses reloads when opened, shows an error with retry, and a failed delete says so.
- A saved session left unused by an offline launch now resumes once the catalogue loads again (no relaunch needed).
- Largest text sizes (iOS Dynamic Type, Android font scale): headings, prices, labels, buttons and tab labels are capped at 1.4× (`FONT_CAP` in `utils/theme.ts`; tabs 1.2×) so they no longer clip or overlap; icon glyphs no longer scale out of their circles; body text still scales fully.

- Sign-in and OTP: the keyboard's submit key now sends the code / verifies (on short screens the keyboard covers the buttons). OTP field hints SMS code autofill.
- Order confirmation said no order was sent to a store; orders now exist on the server. Copy now points to My Orders.
- Returning to the foreground did nothing until a screen using the account store had opened (guests on Home, Shop): Metro's inline requires deferred `userStore` and its `AppState` listener. `App.tsx` now imports it eagerly. Foreground return also reloads the catalogue (prices, stock), quietly: no skeleton, and a failed refresh keeps the shown data (`__tests__/productRefresh.test.ts`). Verified on Android as guest: price changed while backgrounded shows on resume.
- Product details on short screens (360x640 dp): the square image pushed title and price below the fold. The image is now capped at 45% of window height.
- My Orders reloads each time it comes into view, so a status the store changed while order details were open shows on return.
- My Orders jumped to the top on return from order details (iOS): the focus reload drove the pull-to-refresh spinner. The spinner now shows only for a user pull.
- Bag reloads the catalogue when the server cart reports a changed unit price, so the bag no longer shows a stale price.
- Items without store pickup could be added to the bag but never ordered. Product details now disables "Add to bag" for them; the bag marks them and disables Checkout.
- Checkout kept stale stock after the server rejected an order (`INSUFFICIENT_STOCK`, `PRICE_CHANGED`, `VARIANT_UNAVAILABLE`, `PICKUP_NOT_AVAILABLE`). It now reloads the catalogue and the clamped server cart and asks the customer to review. Verified on Android (TOJ-1009).
- A network failure during token refresh signed the user out; the session is now kept and the network error shown (`67f1aa6`).
- Android 15+ (edge-to-edge) and screens under a stack header: the keyboard covered inputs and the sticky footer (Send code, Verify). `Screen` now pads with `KeyboardAvoidingView` on both platforms, offset by its measured page Y.
- Tablets: product and category grids were fixed at 2 columns with very large cards; columns now follow window width (`useGridColumns`, about 220 dp per card). Home hero capped at 420 dp tall.
- My Orders showed a stale list (status changes made by the store never appeared). It now reloads from the server on open, with an error state and retry when that fails (`8de1b32`).
- A bag change that failed while the server was unreachable stayed local. The Bag tab now re-adopts the server cart on focus when signed in; `CART_EMPTY` at checkout also refreshes the bag (`6aee72e`).

- A revoked or expired session left account screens (My Orders, Checkout) showing errors. Session loss now resets navigation to the guest Account tab and shows "Signed out" (`src/navigation/ref.ts`). Verified on Android and iOS with `ACCESS_TTL_S=60`.
- Wishlist and Order details showed data loaded earlier, so changes made on another device never appeared. Both now re-read from the server on focus when signed in (`wishlistStore.refresh`, `orderStore.refreshOne`). Verified Android + iOS on one account.
- Hearts on product lists and details, the bag and orders stayed stale after changes on another device until their screen was reopened. Returning the app to the foreground now re-reads cart, wishlist and orders when signed in (`userStore`, `AppState`). Verified on Android and iOS: item hearted through the API while backgrounded shows filled on resume.
- OTP rate limit now says how long to wait (`toj-backend` dcf9907).
- Bag quantity: fast taps on + or − were lost (the stepper sent its render-time value) and an older server answer could undo a newer tap. The stepper now sends a step applied to the store's current quantity, and only the latest cart request's answer is adopted (`__tests__/cartSync.test.ts`). Verified on Android: 5 fast taps from 1 give 6 in the UI and the DB; 11 taps clamp at stock 10.
- Order details: cancelling an order the store had already packed showed "This order can no longer be cancelled" but left the stale status and the Cancel button. A refused cancel now re-reads the order (`__tests__/orderCancel.test.ts`). Verified on Android with TOJ-1016.
- Accessibility: wishlist hearts on product cards all read "Add to wishlist"; they now name the product ("Add Classic White T-Shirt to wishlist").
- Settings > "Reset demo data" cleared the bag and wishlist only on the device; when signed in they came back on the next refresh. It now also clears the server cart and wishlist. Verified on Android (DB counts 1/2 to 0/0).

### Verified
tsc 0, lint 0, jest 6/6. API journey script (OTP, needsProfile, merge cart, wishlist, address, pickup order, idempotent replay, cancel, refresh, logout) against local backend.

## [Unreleased] — 2026-11-05 backend moved to its own repository

### Changed
- `backend/`, `docs/backend/` and `docs/BACKEND_READINESS_AUDIT.md` moved to the new `toj-backend` repository (sibling folder, first commit `8af4b46`). [ADR-0030](../decisions/0030-separate-backend-repository.md) accepted.
- Root `tsconfig.json`, `jest.config.js`, `.eslintrc.js`, `metro.config.js`, `.gitignore`: backend exclusions reverted (back to their committed state).
- `AGENTS.md` §1, §1a, §1b, §7b, `docs/README.md`, `docs/current-state.md`, ADR index: point to `toj-backend`. ADR-0007 status notes the amendment.

### Verified
`toj-backend`: lint, typecheck, unit 5/5, build, e2e 3/3. App: see the commit or PR for tsc, lint, jest.

## [Unreleased] — 2026-10-31 backend foundation (Day 1)

### Added
- `backend/`: NestJS 12 + Prisma 7 + PostgreSQL 17 foundation (health endpoints, config validation, Swagger, unit and e2e tests). (Now in the `toj-backend` repository.)
- ADRs 0007-0013, 0020, 0022, 0026 (Accepted). ADR index populated.
- `docs/backend/` blueprint (11 files) and `IMPLEMENTATION_PROGRESS.md`.

### Changed
- `AGENTS.md`: backend gate lifted; autonomous engineering policy added.
- Root `tsconfig.json`, `jest.config.js`, `.eslintrc.js`, `metro.config.js`, `.gitignore` exclude `backend/` (RN app unaffected; verified by tsc, lint, jest, Metro bundle).

### Verified
Backend unit 5/5, e2e 3/3, lint and typecheck clean; root tsc 0 errors, jest 5/5. Not verified: any RN-to-API call (not built yet).

## 2026-10-31: documentation baseline for `feature/toj-customer-ui`

- Moved the pre-UI `current-state/`, `features/`, `components/`, `api/` pages and the handover
  report to `docs/archive/pre-ui-baseline/` and marked them HISTORICAL; relative links in the
  planning docs updated.
- Added `docs/current-state.md` as the single accurate current-state page.
- Added baseline notes to the requirements, architecture, implementation, decisions and
  development pages; rewrote `docs/README.md` and `AGENTS.md` to match.
- Planning content, decisions D-1..D-16 and ADR status are unchanged.

Status: Started 2026-09-03 with the documentation baseline
Last Verified: 2026-09-03
Source: `git log`, `docs/`

---

## Scope of this file

This changelog begins at the documentation baseline. It does **not** attempt to
reconstruct a release history that was never recorded — no releases have been made, no tags
exist, and no build has been distributed. Entries before 2026-09-03 are the raw git history,
reproduced without reinterpretation.

Format: reverse chronological. Each entry states what changed and what did **not**.

---

## [Unreleased] — Product direction documented — 2026-09-03

Documentation only. No application code, dependency, configuration, navigation or UI was
changed. `git status` shows the same two pre-existing lockfile modifications as before.

### Added

- `docs/requirements/product-vision.md` — **the authoritative product-goal document.**
  Vision, business model, customer experience goal, MVP direction, catalog direction,
  marketplace direction, product principles, development strategy, and the full OPEN list.
- `docs/development/engineering-standards.md` — the approved **C1–C15** standards, the rule
  governing the introduction of any new library or pattern, and the AI development
  workflow. Kept separate from `coding-standards.md`, which stays descriptive.

### Decided

| # | Decision |
|---|---|
| D-7 | v1 is men's clothing, launching in one city, as a real commercial product |
| D-8 | Guest browsing allowed; an account is required before checkout |
| D-9 | Initial credential type is mobile number + OTP |
| D-10 | Store pickup is supported, modelled per product |
| D-11 | Notifications are order-related only initially |
| D-12 | Search, filters and promotions are deferred |
| D-13 | Profile contents fixed; settings stay functional-only |
| D-14 | Wishlist and reviews are desired for MVP, conditional; reviews require a verified purchase |
| D-15 | UI + static data first; backend, payments, seller platform and marketplace infrastructure are not built prematurely |
| D-16 | The C1–C15 engineering standards are binding on new code |

D-1 to D-6 are unchanged.

### Changed

- `docs/requirements/product-requirements.md` — men's clothing and single-city launch
  recorded; PR-17 to PR-21 added (pickup, order notifications, wishlist, verified-purchase
  reviews, size chart); the catalog gap table extended; MVP scope corrected; §7 rewritten
  and its local open-question numbering replaced with the canonical O-register.
- `docs/requirements/authentication-requirements.md` — supersession notice added. A-1 and
  A-2 become DECIDED; A-3's email + password recommendation is superseded by mobile + OTP,
  with the consequences of that switch analysed; A-6 password reset marked not applicable.
  The original reasoning is retained, not rewritten.
- `docs/requirements/checkout-and-order-requirements.md` — pickup added to the checkout
  flow and as CO-10 to CO-13; the decided customer-facing order vocabulary mapped onto the
  proposed payment × fulfilment model; an order-notification section added.
- `docs/architecture/domain-model.md` — identity re-keyed on phone with an internal id as
  the stable key; `pickupEligible`, `sizeChartId`, `fulfilmentMethod`, `pickupStoreId`
  added; `SizeChart`, `Wishlist` and `Review` entities specified, with a review bound to an
  order line; three invariants added.
- `docs/requirements/marketplace-roadmap.md` — geography separated from the stage model;
  store discovery and an All Products category named; expansion beyond clothing recorded as
  unplanned; three rows added to the marketplace-impact table.
- `docs/implementation/implementation-phases.md` — an alignment section comparing the phase
  plan against the approved development strategy, and a rewritten readiness checklist.
- `docs/decisions/README.md` — D-7 to D-16 recorded; O-7 to O-13 added; four new REJECTED
  entries and a new SUPERSEDED table; five new ADRs (0025 OTP, 0026 pickup, 0027
  notifications, 0028 wishlist and reviews, 0029 design system). **29 ADRs required, four
  hard-blocked.**
- `AGENTS.md`, `docs/README.md` — pointers to the two new documents.

### Conflicts found and resolved in favour of the stated direction

| Conflict | Resolution |
|---|---|
| Docs recommended email + password; direction is mobile + OTP | Superseded, with consequences analysed |
| Password reset was a v1 Must-Have | Removed — no password exists. The real v1 problem is phone-number account recovery, now OPEN |
| Search was a Should-Have | Deferred |
| Reviews were a Could-Have, marketplace-era | Conditional MVP, purchase-verified |
| Push notifications were "nice; polling works" | Order notifications are the decided initial scope |
| Store pickup appeared in no document | Added to requirements, checkout and the domain model |
| Two different O-1..O-6 numbering schemes existed | `docs/decisions/README.md` is now the single register |

### Gaps recorded, not closed

- The approved "UI + static data first" strategy has **no phase covering the design system
  and UI quality**, and the design system is blocked on an undecided final UI direction
  (O-10). Recorded in `implementation-phases.md`; not resolved here.
- `OUT_FOR_DELIVERY` cannot be distinguished from `SHIPPED` without carrier data.
- The decided order vocabulary has no pickup states. `READY_FOR_PICKUP` and `COLLECTED` are
  proposed, not approved.

---

## [Unreleased] — Planning baseline — 2026-09-03

### Added

Requirements, target architecture and implementation planning. No application code was
touched; no dependency was added or removed; no configuration was changed.

- `docs/requirements/` — `product-requirements`, `authentication-requirements`,
  `checkout-and-order-requirements`, `marketplace-roadmap`.
- `docs/architecture/` — `domain-model`, `target-architecture`, `security-architecture`.
- `docs/implementation/` — `implementation-phases`, `migration-plan`,
  `technical-debt-plan`, `testing-plan`.
- `docs/documentation-strategy.md` — structure, ownership, and the rule that an accepted
  ADR is superseded rather than rewritten.

### Changed

- `docs/decisions/README.md` — rewritten from "NOT YET DECIDED" into a decision log.
  Product direction is now **DECIDED** (D-1 to D-6); six questions remain **OPEN**; five
  options are recorded as **REJECTED** with reasons; 24 required ADRs are registered
  against the phase that needs each one.
- `docs/README.md` — index extended with the requirements, architecture and implementation
  sections, and the current-state / planning split made explicit.
- `AGENTS.md` — product direction recorded as decided; pointer added to the planning set.

### Decided

| # | Decision |
|---|---|
| D-1 | The product is a clothing store. The electronics dataset is not the product |
| D-2 | v1 is a customer-facing mobile shopping app for a single store |
| D-3 | The long-term direction is a multi-vendor clothing-first marketplace |
| D-4 | A backend will exist |
| D-5 | Seller and admin surfaces are future products |
| D-6 | Documentation-first: document, decide, record, then implement |

### Recorded, not implemented

- All 65 known issues dispositioned: Fix Now 16 · Fix During Migration 37 · Fix Before
  Release 5 · Defer 3 · Needs Product Decision 4. Twelve of the 37 are deletions.
- Nine implementation phases specified, each with rollback, tests and completion criteria.
- A functional gap not in the current-state register: **the product model has no size or
  variant**, which makes a clothing order unfulfillable. Captured as a requirement
  (PR-4) and in the domain model, not as an observed defect.

### Not changed

`git status` shows only the two pre-existing modifications, `ios/Podfile.lock` and
`package-lock.json`, plus the untracked `AGENTS.md` and `docs/`. The verified baseline
below is unchanged: `tsc` 1 error, `eslint` 6 errors and 2 warnings, `jest` 0 tests
executed.

---

## [Unreleased] — Documentation baseline — 2026-09-03

### Added

Complete current-state documentation. No application code was touched.

- `AGENTS.md` at the repository root — orientation for developers and AI agents, including
  the `.js`/`.ts` resolution warning and the "do not assume" list.
- `docs/README.md` — documentation index with a START HERE flow.
- `docs/archive/pre-ui-baseline/current-state/` — 16 documents:
  `project-overview`, `technology-stack`, `repository-structure`, `architecture`,
  `application-flow`, `navigation`, `state-management`, `data-flow`, `dependencies`,
  `configuration`, `android`, `ios`, `testing`, `security`, `performance`, `known-issues`.
- `docs/archive/pre-ui-baseline/features/` — 13 feature documents, one per real feature, including the abandoned
  purchase-history code.
- `docs/archive/pre-ui-baseline/components/` — an inventory plus `ProductCard`, `CategoryCard` and `DrawerHeader`.
- `docs/archive/pre-ui-baseline/api/current-state.md` — records that no API exists, with the evidence.
- `docs/development/` — `setup`, `coding-standards`, `testing`, `debugging`.
- `docs/decisions/README.md` — the ADR area, with an explicit list of what is
  **NOT YET DECIDED**.
- `docs/releases/changelog.md` — this file.

### Established as the verified baseline

Measured on 2026-09-03 against an unmodified working tree:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | 1 error — `OrderHistoryScreen.tsx(113,5) TS1117` |
| `npx eslint .` | 8 problems (6 errors, 2 warnings) |
| `npx jest` | 1 suite failed, **0 tests executed** |
| Known issues catalogued | **65** — P0: 1, P1: 11, P2: 25, P3: 28 |
| Files under `src/` | 38 tracked |
| Dead or unreachable files | 8 |
| Remote hosts contacted | 2, both HTTPS |
| API endpoints | 0 |

### Not changed

No source file, dependency, configuration file, Android or iOS setting, or package version
was modified. The only non-documentation entries in `git status` — `ios/Podfile.lock` and
`package-lock.json` — were already modified before this work began and were left as found.

### Notable findings recorded

- **P0** — the Android release build type is signed with the committed debug keystore
  (`android/app/build.gradle:103`).
- **P1** — `src/data/products.js` and `src/utils/theme.js` shadow their `.ts` counterparts at
  bundle time. The application that runs is not the application the type-checker reads.
- **P1** — authentication, sign-up and checkout are mocks that create nothing.
- **P1** — nothing is persisted; every relaunch starts logged out with an empty cart.
- **P1** — the test suite cannot load, so no change to this codebase can currently be
  verified automatically.

---

## Prior git history

Reproduced from `git log`. No release was cut from any of these commits.

### `66044c5` — fix: app not working on the android issue fixed

Brought the app to a runnable state on Android. This is also the commit that introduced the
dependency set in which `react-native-reanimated` 4.1.7 ships untranspiled ESM, which is
what breaks Jest.

### `c19596a` — feat: initial ios ui setup of the app

The bulk of the current application: navigation, screens, stores, components and mock data.
This commit added **both** `src/data/products.ts` and `src/data/products.js`, and both
`src/utils/theme.ts` and `src/utils/theme.js` — the shadowing pairs were introduced together
here, not by later drift.

### `c4a8e83` — Initial commit

React Native 0.82.1 project template.

---

## Versioning

The project states its version in five places, and they do not agree:

| Location | Value |
|---|---|
| `package.json` `version` | `0.0.1` |
| `app.json` | no version field |
| `android/app/build.gradle` `versionName` | `"1.0"` (versionCode `1`) |
| `ios` `MARKETING_VERSION` | `1.0` (`CURRENT_PROJECT_VERSION` `1`) |
| `SettingsScreen.tsx:60` | `1.0.0`, hardcoded in the UI |

No versioning scheme has been chosen — **NOT YET DECIDED**. See
[../decisions/README.md](../decisions/README.md).

---

## How to add an entry

Add a new section at the top under a version heading or `[Unreleased]`, with
`### Added` / `### Changed` / `### Fixed` / `### Removed` subsections as needed. State what
was verified and how. If a change was not verified, say so — the project currently has no
automated test that can verify anything.
