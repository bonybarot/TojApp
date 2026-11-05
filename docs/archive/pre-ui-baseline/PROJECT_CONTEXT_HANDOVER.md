# TojApp — Project Context Handover

Status: Handover report — current state verified, planning content reported as-is
Report date: 2026-10-30
Repository state inspected: commit `66044c5`, branch `main`, dated 2026-09-03
Author: AI assistant (Claude), read-only inspection; no application file was modified

> **How to use this report.** Read `AGENTS.md`, then this file, then the documents listed in
> §29. Every claim here is tagged as one of: **VERIFIED** (checked this session against code,
> manifests or a command's output), **DOCUMENTED** (taken from `docs/` or `AGENTS.md`, not
> independently re-checked), **DECIDED** (recorded by the product owner), **PROPOSED**
> (recommended, not approved), **OPEN** (unanswered), **INFERRED** (my reasoning from
> evidence; labelled so you can discount it).
>
> This report invents no product or architecture decisions. Where I make a recommendation it
> is labelled **RECOMMENDATION** and is not binding.

---

## 1. Report purpose and scope

**Purpose.** Let another AI assistant or developer continue TojApp without the owner
re-explaining its history, decisions and state.

**In scope.** Business and product direction; the actual implementation; architecture;
known defects; decision history; open questions; readiness; a prioritised backlog.

**Out of scope.** Implementation. This task changed no application file, installed nothing
and fixed nothing. It created this one file.

**Method.**

| Step | What I did |
|---|---|
| Docs | Read `AGENTS.md`, `docs/README.md`, `docs/decisions/README.md`, `docs/requirements/product-vision.md`, `docs/current-state/known-issues.md` in full. Read targeted sections of `product-requirements.md`, `implementation-phases.md`, `engineering-standards.md`, `changelog.md`, `data-flow.md`. Skimmed headings of the rest. **I did not read all 11,719 lines** of `docs/`. |
| Code | Read every file under `src/`, plus `App.tsx`, `index.js`, `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `jest.config.js`, `__tests__/App.test.tsx`. Native config: targeted greps only (§30). |
| Commands (read-only) | `git status/log/diff/show`, `npx tsc --noEmit`, `npx eslint .`, `npx jest` (cache redirected outside the repo), a Node one-liner reading Metro's default `sourceExts`, installed-version lookups in `node_modules`. |
| Not done | The app was **not** launched on a device or simulator. Nothing here is a runtime observation. See §30. |

---

## 2. Current repository snapshot

| Item | Value | Tag |
|---|---|---|
| Project | `TojApp` (`app.json`); README says only "clothing app" | VERIFIED |
| Branch / HEAD | `main` / `66044c5` "fix: app not working on the android issue fixed" (2026-09-03) | VERIFIED |
| Git history | 3 commits: `c4a8e83` Initial commit (2025-11-14, 1 file) · `c19596a` "feat: initial ios ui setup of the app" (2025-11-16, 93 files, +20,166) · `66044c5` (2026-09-03, `package.json` only: Reanimated `^3.7.0`→`~4.1.7`, adds `react-native-worklets ~0.6.1`) | VERIFIED |
| Remote / PRs / tags / releases | No tags or releases (DOCUMENTED). Remote status not inspected | — |
| Working tree | `M ios/Podfile.lock`, `M package-lock.json`, `?? AGENTS.md`, `?? docs/` | VERIFIED |
| **Docs are untracked** | `AGENTS.md` and all of `docs/` (now 54 + 1 files) have **never been committed**. They exist only in this working tree | VERIFIED |
| Source changed since docs? | No. `git status` shows no modified file under `src/`; docs are stamped 2026-09-03 against the same commit. Docs are 57 days old but the code they describe is unchanged | VERIFIED |
| Size | 38 files under `src/` (15 screens, 8 navigation, 5 data, 4 stores, 4 components, 2 utils) | VERIFIED |
| Tests | `__tests__/App.test.tsx` only; **0 tests execute** (§20) | VERIFIED |
| CI | None: no `.github/`, `fastlane/` | VERIFIED (`.gitlab-ci.yml`/`.circleci` taken from docs) |
| Env files | No `.env*` found; no environment configuration anywhere | VERIFIED |

### 2.1 The two pre-existing uncommitted modifications — provenance narrowed

`AGENTS.md` §5 and `known-issues.md` PLAT-08 list the provenance of `ios/Podfile.lock` and
`package-lock.json` as **UNKNOWN**. Evidence now narrows it (**INFERRED**, strongly):

| Fact | Evidence |
|---|---|
| Committed `package.json` requires Reanimated `~4.1.7` + `react-native-worklets ~0.6.1` | `git show 66044c5 -- package.json` |
| The **committed** `package-lock.json` still locks Reanimated **3.19.4**, has no `react-native-worklets`, and its root dependency says `^3.7.0` | `git show HEAD:package-lock.json` |
| The **working-tree** lockfile locks Reanimated **4.1.7** and worklets **0.6.1** | `package-lock.json` |
| The `Podfile.lock` diff swaps `RNReanimated 3.19.4 → 4.1.7` and adds `RNWorklets` (and `RNScreens 4.18.0`) | `git diff ios/Podfile.lock` |

**Reading:** the two modifications are the lockfile changes that belong to the Reanimated 4
upgrade in `66044c5`, but were never committed. As committed, `package.json` and
`package-lock.json` disagree. A fresh clone with `npm ci` would fail or install different
versions than were tested. **Do not revert these files.** Whether to commit them is the
owner's decision.

---

## 3. Executive summary

TojApp is a React Native 0.82.1 / React 19.1.1 / TypeScript app: a **front-end prototype**
of a clothing store with **no backend, no real authentication, no orders, no persistence,
no payments and no working tests**. Every screen renders from hardcoded arrays.

The product direction was **decided on 2026-09-03** (D-1…D-16): a real commercial,
customer-facing mobile shopping app for **one men's-clothing store in one city**, evolving
into a multi-vendor clothing marketplace later. Guest browsing; account (mobile + OTP)
required before checkout; delivery or per-product store pickup; online payment; order
tracking; wishlist/reviews conditional. A backend will exist, but the approved strategy is
**UI + static data first**.

Since then, **no code has changed.** The work after 2026-09-03 was documentation:
~11.7k lines under `docs/` recording current state (65 catalogued issues), proposed
requirements/architecture, a 9-phase plan, and 29 ADRs that must be written. **No ADR is
written; no phase is approved.** `AGENTS.md` forbids source changes until a phase is approved.

The single most important technical fact: **two parallel `.js`/`.ts` copies of the product
data and theme exist, and Metro runs the `.js` ones** (electronics catalogue with `name`
instead of `title`; a 5-colour theme missing 6 colours the code uses). TypeScript checks the
other copies. So `tsc` passing says nothing about what runs, and — by code reading — product
titles render blank and category pages are empty. I confirmed the resolver order; I did not
run the app.

The most important *non-technical* fact: **the first phase the owner chose (UI + static
data) is gated on an OPEN design-system decision (O-10 / ADR-0029) that has no
recommendation written**, and the phase plan has no phase for it.

---

## 4. Business vision and product direction

All items below are **DECIDED** by the product owner on 2026-09-03 unless marked
otherwise. Source: `docs/requirements/product-vision.md` (the stated authority; where other
docs disagree with it, it wins). I did not independently confirm these with the owner; they
are recorded as the owner's decisions per the docs and the memory index.

| Dimension | Position |
|---|---|
| What TojApp is intended to become | A **real commercial** customer-facing mobile shopping app — "not a demo and not a prototype" (D-7) |
| Initial product | One clothing store, **men's clothing**, iOS + Android (D-2, D-7) |
| Long-term | **Multi-vendor clothing marketplace**: independent shops register, list, manage inventory/orders (D-3). Possibly beyond clothing "if the business eventually requires it" — FUTURE |
| Problem solved | **Not stated in any source.** The docs describe *what* is built, not the customer problem or competitive thesis. **OPEN/UNDOCUMENTED** |
| Customers | Consumers of men's clothing in one city (D-7). Persona detail, age, price band: not documented |
| Sellers | v1: exactly one store, identity **unspecified** (OPEN). Future: independent sellers (D-5 says seller/admin are future products) |
| Geography | **One city** at launch; which city is not recorded. Expansion "as practical" |
| Revenue model | **Not decided.** v1 appears to be direct retail from one store. Marketplace commission/payout model is explicitly OPEN |
| Currency/tax/markets | OPEN (O-5). Note the code hardcodes `$`/USD and country `USA` (§19) — this is prototype residue, not a decision |
| Brand / app name | OPEN (O-10). "TojApp"/"TOJ" is the current working name only |
| Governing constraint | Build so marketplace stays possible **without** building marketplace complexity into v1 (`marketplace-roadmap.md` §4: one column on three tables, one enum value, one empty table, one token claim) |
| UX references | Myntra and similar may be *UX references*; TojApp must not clone them |

**Not documented anywhere I read:** target price positioning, unit economics, competitor
analysis, validation evidence (interviews, demand tests), launch date, budget, team size.
The doc set itself flags team/budget/timeline as OPEN (O-2) and as the thing that actually
decides the backend choice.

---

## 5. Confirmed decisions and assumptions

### 5.1 Confirmed (DECIDED, 2026-09-03, from the product owner)

| # | Decision |
|---|---|
| D-1 | Clothing store; the electronics dataset is **not** the product |
| D-2 | v1 = customer-facing mobile shopping app for a single store |
| D-3 | Long-term = multi-vendor clothing-first marketplace |
| D-4 | A backend will exist |
| D-5 | Seller and admin are future products, not v1 |
| D-6 | Documentation-first: document → decide → record → implement |
| D-7 | v1 = men's clothing, one city, real commercial product |
| D-8 | Guest browsing allowed; account required **before checkout** |
| D-9 | Initial credential: **mobile number + OTP** |
| D-10 | Store pickup supported, **modelled per product** — never assume all products support it |
| D-11 | Notifications: order-related only, initially |
| D-12 | Search, filters, promotions **deferred**; categories are discovery |
| D-13 | Profile = exactly Personal Information, My Orders, Wishlist, Help/Support, Logout. Settings: only genuinely functional ones |
| D-14 | Wishlist and reviews desired for MVP, **conditional** on not delaying the core flow; reviews need a verified purchase |
| D-15 | **UI + static data first**; no premature backend, payment gateway, seller platform, marketplace infra |
| D-16 | Engineering standards C1–C15 and the "no gratuitous library" rule are binding on new code |

Also decided in `product-vision.md` (not numbered D-n): customer-facing order vocabulary
`PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED` with side flows for
cancellation/return/refund; size/variant/inventory must be modelled properly, not as a UI
field; inventory deducted automatically on successful order.

### 5.2 Process rules (from `AGENTS.md` and the owner's memory entry)

- Source is not to be modified until a phase is approved and its ADRs written (`AGENTS.md` §8).
- Significant architectural change needs explicit human approval; AI must not silently decide product/architecture.
- Never add a library/pattern because it is popular; state the problem, why the current stack can't solve it, cost, simpler option, and whether it is needed *now* (`AGENTS.md` §7a).
- Documentation-concurrency rule (stated 2026-09-03, memory `documentation-concurrency-rule`): a feature branch edits its own feature's docs; project-wide source-of-truth docs only when the implementation changes a project-wide rule, called out in the PR; never silently resolve a doc conflict; feature docs ship in the same PR; never rewrite a historical ADR — supersede it.
- Workflow: INSPECT → EXPLAIN → PLAN → IMPLEMENT → TYPECHECK → LINT → TEST → FIX → DOCUMENT → REPORT.

### 5.3 Assumptions I found embedded in the docs (not owner-confirmed)

| Assumption | Where | Status |
|---|---|---|
| Domain contract: `title`, string `id`, `categoryId`, ordered images (ADR-0001) | `domain-model.md` §2 | PROPOSED |
| Money as integer minor units (ADR-0011) | `domain-model.md` §4 | PROPOSED |
| `storeId` on catalogue/order rows from day one (ADR-0013) | `marketplace-roadmap.md` | PROPOSED |
| Keep Zustand; add TanStack Query only when server state arrives; MMKV; REST+OpenAPI; Maestro E2E | ADRs 0003/0004/0005/0008/0023 | Direction for C7/C8 approved via D-16; the rest PROPOSED |
| Migrate, don't rewrite | `migration-plan.md` | Recorded as REJECTED: full rewrite. Reasoning is the doc author's; owner's endorsement is implied by D-16/product-vision §11 "Migration, not rewrite" (DECIDED principle) |

---

## 6. Initial release scope

**Customer capability list — DECIDED** (`product-vision.md` §3): open app · browse as guest ·
browse categories · open product · view images/details · select size where applicable · add
to cart · log in/register before checkout · provide/select delivery info · choose delivery
or eligible pickup · pay online · place order · receive order updates · view order history ·
view order detail/status · manage profile · wishlist (conditional) · reviews (conditional).

**Must-Have for v1** per `product-requirements.md` §6 (**PROPOSED** placement by the doc
author, built on the decided direction): single-language source tree; executing tests;
real signing keystore; distinct bundle IDs; product variants; mobile+OTP auth; backend
catalogue/cart-validation/order creation; server-side total and stock validation; real
payment; real order history; cart+session persistence; loading/error/empty states; crash
reporting; accessibility basics; address capture; delivery-or-pickup selection; size
selection before add-to-cart.

**Explicitly out of v1 scope (DECIDED):** catalogue search, filters (maybe a few later),
coupons/promotions, marketing notifications, seller platform, admin platform, marketplace
infrastructure, multi-store.

**Does the code match the intended v1?** No. Of the 18 customer capabilities, the code has
a rough UI for: browse, categories, product detail, add-to-cart, cart, a checkout *form*,
and a static order list. Missing entirely: size selection, pickup, payment, real order
creation, real auth (the screens collect email+password, not mobile+OTP), persistence,
wishlist, reviews, help/support, notifications. Details in §8.

**Conflict to note:** `product-requirements.md` still places "Backend catalogue … Real
payment" as v1 Must-Haves while D-15 says UI + static data comes first and backend/payment
are "not now". These are compatible only if "v1" means the shippable release and D-15
describes the *sequencing* of work. The docs do not state that explicitly. Treat as
**needs owner confirmation** (§25 Q-P7).

---

## 7. Long-term product vision

DECIDED as direction, FUTURE as scope (`marketplace-roadmap.md`, `product-vision.md` §2, §6):
multiple independent sellers, seller self-registration, seller product/inventory/order
management, multiple stores, store discovery and store pages, marketplace functionality,
seller/admin platform, possible expansion beyond clothing.

**Still OPEN and not to be invented:** seller identity, first store identity, marketplace
rules, onboarding, commission model, payout model, seller-app platform (a "mobile seller app
first" is recorded as REJECTED because sellers manage catalogues on a keyboard; the actual
seller surface is OPEN, ADR-0024 "not yet needed"), multi-store cart splitting, per-store
shipping.

The hard marketplace problems the docs name early (`marketplace-roadmap.md` §4) are
payouts, multi-store carts, tenant isolation and moderation. None is built or required for v1.

---

## 8. Current feature inventory

Status vocabulary per the task. "Verified" here means **verified by reading the code and,
where noted, by command output — not by running the app.** Nothing in the app is
"implemented and verified" in the sense of tested, because no test executes.

| Feature | Business purpose | Status | Files | Data / state dependency | Backend | Limitations / outstanding | Evidence |
|---|---|---|---|---|---|---|---|
| **Auth — login** | Gate checkout/orders | **Mocked** | `screens/auth/LoginScreen.tsx`, `store/userStore.ts:21` | `userStore.login` | none | Ignores password; fabricates user "John Doe", id `'1'`; collects email+password, **contradicts D-9** | VERIFIED (code) |
| **Auth — signup** | Account creation | **Mocked** | `screens/auth/SignupScreen.tsx:22-35` | `userStore.login` | none | Calls the same `login(email, password)`; entered name is discarded; no verification | VERIFIED |
| **Auth gate / guest browsing** | D-8 | **Not implemented** | `navigation/RootNavigator.tsx:15` | `isLoggedIn` | none | App is **login-first**: `isLoggedIn ? Drawer : AuthStack`. Guests see nothing. **Contradicts D-8.** No "continue as guest" | VERIFIED |
| **Mobile + OTP auth** | D-9 | Planned, not implemented | — | — | needs provider (O-7) | No phone input, OTP screen or session | VERIFIED absent |
| **Navigation shell** | Move between areas | Implemented (unverified at runtime), with defects | `src/navigation/*` (8 files, 17 registrations) | — | — | §12 | VERIFIED (code) |
| **Home** | Product entry | **Partial/prototype** | `screens/Home/HomeScreen.tsx` | `productStore.filteredProducts` | none | Shows all products in a 2-col grid; no categories, banners, sections | VERIFIED |
| **Categories** | D-12 discovery | **Partial; likely broken** | `screens/Categories/CategoriesScreen.tsx`, `data/categories.ts` | direct import of `categories` (bypasses store) | none | 8 categories, but only 3 have products (§14). Navigation via `getParent()?.navigate(…as never)` — see §12.3 | VERIFIED (code); runtime behaviour **suspected**, not run |
| **Product list** | Category browsing | **Partial; likely broken at runtime** | `screens/Home/ProductListScreen.tsx` | `productStore.products` + inline filter | none | `p.category === category`; runtime data (`.js`) has no `category` → empty. Re-implements `filterByCategory` | VERIFIED (code + resolver order) |
| **Product details** | Show/purchase | **Prototype** | `screens/Home/ProductDetailsScreen.tsx` | `productStore.getProductById`, `cartStore.addToCart` | none | One image only (`images[]` unused); **no size/variant selection**; no stock; `Alert` on add | VERIFIED |
| **Variants / sizes / inventory** | Core to clothing (D-… product-vision §5) | **Not implemented** | — | — | — | No data model exists | VERIFIED absent |
| **Search / filters** | — | **Not implemented — deliberately deferred (D-12)** | — | — | — | — | VERIFIED absent |
| **Cart** | Collect items | **Implemented, not persisted, unverified by tests** | `screens/Cart/CartScreen.tsx`, `store/cartStore.ts` | `cartStore` | none | add/remove/quantity/total work by logic reading; cart lost on relaunch; not cleared on logout (APP-11); total duplicated 3× | VERIFIED (code) |
| **Checkout** | Place order | **Partial / mock** | `screens/Cart/CheckoutScreen.tsx` | `cartStore`, local address state | none | Validates 4 address fields; hardcoded "Credit Card ending in 1234"; country default `USA`; success `Alert` → `clearCart()` → `goBack()`. **No order created, no payment, no pickup option, no delivery fee, no auth check** | VERIFIED |
| **Payments** | Pay online | **Not implemented** | — | — | provider OPEN (O-4) | — | VERIFIED absent |
| **Order history / details** | Track orders | **Mocked** | `screens/Orders/*`, `data/orders.ts` | direct import of static `orders` (4 fixtures) | none | Not tied to anything the user did; statuses use a *different* vocabulary (`pending/processing/shipped/delivered/cancelled`) than the decided one; status colours `undefined` at runtime (theme shadow) | VERIFIED |
| **Profile** | D-13 | **Placeholder** | `screens/User/ProfileScreen.tsx` | `userStore.user` | none | Shows name/email/avatar. All 6 menu rows have no `onPress`, and 4 of them (Change Password, Payment Methods, Shipping Addresses, plus password concept) are **not in D-13's list** | VERIFIED |
| **Settings** | D-13 | **Placeholder; contradicts D-13** | `screens/User/SettingsScreen.tsx` | local `useState` | none | Inert toggles/rows (push, email, language, currency, theme, version, ToS, privacy). D-13 forbids decorative settings | VERIFIED |
| **Wishlist** | D-14 | Not implemented (inert Profile row only) | `ProfileScreen.tsx` | — | — | No store, screen or model | VERIFIED absent |
| **Reviews** | D-14 | Not implemented | — | — | needs orders first | Verified-purchase rule needs real order lines | VERIFIED absent |
| **Help / Support** | D-13 | Not implemented | — | — | O-12 | No row, no destination | VERIFIED absent |
| **Notifications** | D-11 | Not implemented | — | — | O-13 | The two Settings switches are decorative | VERIFIED absent |
| **Persistence** | Survive relaunch | **Not implemented** | — | — | — | No AsyncStorage/MMKV/Keychain/`zustand/persist` | VERIFIED (not in `package.json`; no import in `src/`) |
| **Drawer** | Nav + logout | Implemented | `navigation/DrawerNavigator.tsx`, `components/DrawerHeader.tsx` | `userStore` | — | Logout item; `logout()` clears user only | VERIFIED |
| **Purchase-history screen (old)** | — | **Deprecated/unreachable** | `screens/History/*`, `components/HistoryItem.js`, `data/history.js` | — | — | Registered in no navigator | VERIFIED |
| **Theme/design system** | UI consistency | Partial | `utils/theme.ts` / `.js` | — | — | §19 | VERIFIED |
| **Accessibility, i18n, dark mode, RTL** | — | Not implemented | — | — | — | 0 `accessibility*` props (DOCUMENTED, APP-15) | DOCUMENTED |
| **Error handling / loading / empty states** | UX | Not implemented | — | — | — | No `try/catch`, no error boundary, no `ListEmptyComponent` | DOCUMENTED (APP-09/10); spot-checked |

---

## 9. Technology stack

All versions below: manifest range from `package.json`, **installed** version read from
`node_modules/*/package.json` this session.

| Concern | Choice | Manifest | Installed |
|---|---|---|---|
| Framework | React Native | `0.82.1` | 0.82.1 |
| React | React | `19.1.1` | 19.1.1 |
| Language | TypeScript (`strict`, via `@react-native/typescript-config`) | `^5.8.3` | 5.9.3 |
| Navigation | `@react-navigation/native` | `^7.1.19` | 7.1.20 |
| | `native-stack` / `bottom-tabs` / `drawer` | `^7.6.2` / `^7.8.4` / `^7.1.3` | 7.6.3 / 7.8.5 / 7.7.3 |
| State | Zustand (no middleware/persist) | `^4.5.2` | 4.5.7 |
| Animation | `react-native-reanimated` / `react-native-worklets` | `~4.1.7` / `~0.6.1` | 4.1.7 / 0.6.1 |
| Native deps | `gesture-handler` `^2.20.2`, `screens` `^4.4.0`, `safe-area-context` `^5.5.2` | | — |
| Styling | `StyleSheet.create` + `src/utils/theme` | — | — |
| `nativewind` | `^4.2.1` — **installed, entirely unused** (no config, no `className`, absent from Babel/Metro) | | 4.2.1 |
| Persistence | **None** | | |
| Test | Jest `^29.6.3` + `react-test-renderer 19.1.1` | | jest 29.7.0 — broken (§20) |
| Lint / format | ESLint 8 with `@react-native` config; Prettier 2.8.8 (`singleQuote`, `trailingComma: all`, `arrowParens: avoid`) | | Prettier not enforced |
| Build | Metro (`@react-native/metro-config`, defaults only), Babel (`module:@react-native/babel-preset` + `react-native-reanimated/plugin`), RN CLI 20.0.0 | | |
| Node | `engines.node >=20` | | Node 20.17.0 on this machine |
| Never referenced | `@react-native/new-app-screen`, `@babel/preset-env` | | |

**Android** (VERIFIED from files): `applicationId com.tojapp`, `versionCode 1`/`versionName "1.0"`,
`minSdk 24`, `compileSdk/targetSdk 36`, `newArchEnabled=true`, `hermesEnabled=true`,
`allowBackup=false`, `supportsRtl=true`, INTERNET permission. **`release` buildType uses
`signingConfigs.debug`** (`build.gradle:103`) with the debug keystore committed and passwords
`android`/`android` in plaintext (`build.gradle:89-93`).

**iOS** (VERIFIED from files): deployment target 15.1; `RCTNewArchEnabled`; ATS
`NSAllowsArbitraryLoads=false`, `NSAllowsLocalNetworking=true`; bundle id is the template
placeholder `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)`; `Podfile` uses
`use_frameworks!` with a linkage setting; `NSLocationWhenInUseUsageDescription` present and
empty (DOCUMENTED, PLAT-01 — I confirmed the plist keys exist).

---

## 10. Repository and directory structure

```text
TojApp/
├── App.tsx                  entry component: SafeAreaProvider > NavigationContainer(ref) > RootNavigator
├── index.js                 AppRegistry; imports gesture-handler
├── app.json                 {name, displayName}
├── AGENTS.md                agent instructions (untracked)
├── docs/                    54 docs + this report (untracked)
├── __tests__/App.test.tsx   the only test; does not execute
├── android/  ios/           native projects (RN template + minimal changes)
└── src/
    ├── components/          CategoryCard.tsx, ProductCard.tsx, DrawerHeader.tsx, HistoryItem.js (dead)
    ├── data/                products.ts (15, clothing) + products.js (6, electronics, WINS)
    │                        categories.ts (8), orders.ts (4), history.js (dead)
    ├── navigation/          RootNavigator, AuthStack, DrawerNavigator, MainTabs,
    │                        HomeStack, CartStack, OrdersStack, StackKeys (mostly dead)
    ├── screens/             auth/ Cart/ Categories/ History/(dead) Home/ Orders/ User/
    ├── store/               userStore.ts, cartStore.ts, productStore.ts, authStore.js (dead)
    └── utils/               theme.ts + theme.js (WINS)
```

Organised **by technical type**, not by feature (C11 says feature-first is the approved
direction; not yet applied). No hooks directory, no `types/`, no `services/`/`repositories/`,
no `config`/env. The `README.md` is two lines.

**Dead or unreachable (8 files, DOCUMENTED + checked):** `store/authStore.js`,
`data/history.js`, `components/HistoryItem.js`, `screens/History/HistoryScreen.js`,
`screens/History/index.tsx`, `screens/auth/Login.tsx` — plus the two shadow files
`products.js`/`theme.js`, which are dead *to the compiler* but are what actually runs.

---

## 11. Application architecture

Flow today: `Screen → Zustand store → import of src/data/*`, except Orders and Categories
which import the data file directly (APP-05). There is **no data-access layer**, no
repository seam, no service layer, no hooks. Business rules live in screens: cart total
computed in `CartScreen`, `CheckoutScreen`, and an unused selector in `cartStore`; category
filtering in `ProductListScreen` and an unused store action; `getStatusColor` duplicated in
both order screens.

Boot sequence: `index.js` registers `App` → `App.tsx` wraps `SafeAreaProvider` and a
`NavigationContainer` (given a `navigationRef` that nothing uses) → `RootNavigator` calls
`productStore.loadProducts()` in an effect (synchronous copy of the fixture into state;
there is a first render with an empty product list) and renders `DrawerNavigator` if
`isLoggedIn`, else `AuthStack`.

Gaps relative to C-standards (DOCUMENTED): C5, C6, C11, C12, C14 not conformant; C7
conformant; C8 correctly not applicable yet.

---

## 12. Navigation architecture

### 12.1 Actual tree (VERIFIED from `src/navigation/*`)

```text
NavigationContainer (navigationRef, unused)
└─ RootNavigator  — isLoggedIn ? Drawer : AuthStack
   ├─ AuthStack (native-stack, header shown)           [params type declared, NOT attached]
   │    ├─ Login      → LoginScreen
   │    └─ Signup     → SignupScreen
   └─ Drawer (headerShown, custom content with Logout)   [params type declared, NOT attached]
        ├─ MainTabs  (label "Home", title '')
        │    └─ Tab.Navigator (bottom tabs, headers hidden)
        │         ├─ HomeStack  (tab "Home")
        │         │    ├─ Home           → HomeScreen
        │         │    ├─ ProductList    {category?: string}   → ProductListScreen
        │         │    └─ ProductDetails {productId: string}   → ProductDetailsScreen
        │         ├─ CartStack  (tab "Cart")
        │         │    ├─ Cart           → CartScreen
        │         │    └─ Checkout       → CheckoutScreen
        │         └─ Profile    (tab "Profile") → ProfileScreen
        ├─ Categories   → CategoriesScreen
        ├─ OrdersStack  (title "Orders")
        │    ├─ OrderHistory → OrderHistoryScreen
        │    └─ OrderDetails {orderId: string} → OrderDetailsScreen
        ├─ Profile      → ProfileScreen          (second registration of the same screen)
        └─ Settings     → SettingsScreen
```

17 screen registrations. Parameters: only `category?` (string title, not id), `productId`,
`orderId`. No deep links, no linking config, no `RootParamList` global declaration.

### 12.2 Known navigation problems (DOCUMENTED NAV-01…08; the ones I confirmed in code)

`Profile` registered twice (tab + drawer) · `AuthStackParamList`/`DrawerParamList` declared
but never passed to `createNativeStackNavigator`/`createDrawerNavigator` · three `as never`
casts (`LoginScreen.tsx:61`, `SignupScreen.tsx:86`, `CategoriesScreen.tsx:24`) · inner
navigators hide headers so detail screens have no title or back button · route params typed
anonymously per screen · `useNavigation<NativeStackNavigationProp<any>>` in `ProductListScreen`.

### 12.3 One suspected runtime defect (new emphasis — **SUSPECTED, not run**)

`CategoriesScreen` is a direct child of the **root** Drawer navigator and navigates with
`navigation.getParent()?.navigate('MainTabs', …)`. A root navigator's screen has no parent
navigator, so `getParent()` should be `undefined` and the optional chain would make the tap
a **silent no-op**. The docs observe this fall-through (`categories.md:117,127`) but do not
conclude it happens. If true, category browsing fails *regardless* of the `.js`/`.ts`
defect. **Verify by running the app before relying on this.**

### 12.4 Open decision

Drawer vs tabs as primary navigation is OPEN (O-6, ADR-0015). The current app uses both, plus
a duplicate Profile entry, which D-13's five-item profile conflicts with.

---

## 13. State management

Four Zustand stores; none persisted; no middleware. (VERIFIED)

| Store | File | State | Actions | Consumers | Notes |
|---|---|---|---|---|---|
| `userStore` | `store/userStore.ts` | `user: User\|null`, `isLoggedIn` | `login(email, password)` (mock), `logout`, `setUser` (no callers) | RootNavigator, Login, Signup, DrawerNavigator, DrawerHeader, ProfileScreen, CheckoutScreen (selected, unused) | `isLoggedIn` duplicates `user !== null`. Mock user has avatar from `i.pravatar.cc` |
| `cartStore` | `store/cartStore.ts` | `items: CartItem[]` (`id,title,price,image,quantity`) | `addToCart` (qty+1 if present), `removeFromCart`, `updateQuantity` (≤0 removes), `clearCart` | ProductDetails, Cart, Checkout | Not user-scoped; **survives logout**; `useCartTotalPrice` exported but unused; no variant dimension, so size cannot be represented |
| `productStore` | `store/productStore.ts` | `products`, `filteredProducts`, `selectedCategory` | `loadProducts`, `filterByCategory` (never called), `getProductById` | RootNavigator, Home, ProductList, ProductDetails | `Product` interface duplicated from `data/products.ts` |
| `authStore` | `store/authStore.js` | `isLoggedIn` | `login`, `logout` | **none** | Dead; has the more discoverable name. Do not wire to it |

There is no store for orders, wishlist, addresses, settings or UI state. Data synchronisation
does not exist because there is no server.

---

## 14. Data models and data flow

### 14.1 The defining defect (VERIFIED: config; runtime effect INFERRED)

`productStore.ts` imports `'../data/products'`; every screen imports `'../utils/theme'`.
Both specifiers have a `.ts` and a `.js` file.

- Metro default `sourceExts` = `js,jsx,json,ts,tsx` — **I printed this from `getDefaultConfig`**; `metro.config.js` adds nothing. Metro therefore resolves **`.js`**.
- TypeScript (`moduleResolution` from `@react-native/typescript-config`) resolves **`.ts`**.

| | `products.ts` (what `tsc` sees) | `products.js` (what runs) |
|---|---|---|
| Items | 15 clothing items | 6 electronics items |
| Name field | `title` | `name` |
| `id` | `'1'` (string) | `1` (number) |
| `category` | `Tops`/`Bottoms`/`Outerwear` (5 each) | **absent** |
| `images[]` | present | absent |

| | `theme.ts` | `theme.js` |
|---|---|---|
| Colours | 11 (adds `textSecondary`, `border`, `error`, `success`, `warning`, `info`) | 5 |
| `spacing`, `typography`, `borderRadius` | exported, **imported by nothing** | not exported |

**Consequences by code reading (INFERRED, consistent with docs; not observed on a device):**
product names blank in grid/details/cart/checkout (`ProductCard` reads `title`); every
category page empty; ~51 of 146 colour references `undefined` (tab/drawer inactive tint, borders, error red on Logout, all order-status colours); `FlatList` `keyExtractor` returns numbers.
`tsc` is clean on this because it never sees the `.js` files. Six `: any` annotations hide
the `title`/`name` mismatch from the compiler.

### 14.2 Entities that exist

| Entity | Where | Shape | Notes |
|---|---|---|---|
| Product | `data/products.ts`, duplicated in `productStore.ts` | `{id,title,price,image,category,description,images?}`; price as JS `number` | No variants, sizes, stock, pickup flag, store id, `categoryId` |
| Category | `data/categories.ts` | `{id,title,image}` | 8: Tops, Bottoms, Outerwear, Accessories, Shoes, Activewear, Formal, Sale. **5 have zero products.** `Sale` is a merchandising flag, not a garment category. Taxonomy is OPEN (O-11) |
| CartItem | `cartStore.ts` | `{id,title,price,image,quantity}` | Snapshot of product fields |
| User | `userStore.ts` | `{id,name,email,avatar?}` | No phone number; no address |
| Order | `data/orders.ts` | `{id,date,status,items,total,shippingAddress,paymentMethod}`, 4 fixtures `ORD-…` | Status enum differs from the decided vocabulary; US-style address; dates in 2024 |
| Address | inline in `CheckoutScreen` and `orders.ts` | `street, city, state, zipCode, country` | US-centric; not persisted |
| Variant, Inventory, Wishlist, Review, Store, Payment, Notification | — | **do not exist** | |

The proposed target model is in `docs/architecture/domain-model.md` (PROPOSED; its authors
mark it as such).

### 14.3 Data flow summary

Fixtures → `productStore.loadProducts()` (once, at root mount) → Home grid and
ProductDetails; ProductList filters `products` inline; Cart items are copies pushed from
ProductDetails; Checkout reads cart and local form state; **Orders and Categories read
fixtures directly**; nothing flows back anywhere. All images are remote Unsplash/pravatar
URLs — no local assets, no image caching.

---

## 15. Authentication and user management

| Aspect | Reality (VERIFIED) | Target |
|---|---|---|
| Credential | email + password text fields | mobile + OTP (D-9) — DECIDED |
| Verification | none; any non-empty strings succeed (`LoginScreen.tsx:27` → `userStore.ts:21`) | OTP provider/policy OPEN (O-7, ADR-0025) |
| Session | in-memory boolean + object; lost on relaunch | secure token storage (Keychain/Keystore) — PROPOSED |
| Guest browsing | **not possible** — `RootNavigator` shows only `AuthStack` when logged out | allowed (D-8) |
| Gate at checkout | none — checkout is reachable only because login is mandatory first | required before checkout (D-8) |
| Sign-up | indistinguishable from login | account creation |
| Logout | `logout()` clears `user`/`isLoggedIn`; **cart is kept** (APP-11) | OPEN: account-switch semantics |
| Password reset / change | Profile row "Change Password" is inert; not applicable to D-9 | superseded |
| Account recovery | n/a | OPEN: what happens if a customer loses their number (O-7) |
| Authorisation | none | not needed until seller/admin |

Auth screens are **the wrong credential type and the wrong gate model**. They are
candidates for replacement, not extension (`decisions/README.md` §4 disposition: Replace).

---

## 16. Cart and checkout

**Cart (VERIFIED, logic read).** In-memory only. Adding the same product increments
quantity. `updateQuantity(id, q≤0)` removes the line. Total = Σ price×quantity as a JS
float, formatted `toFixed(2)` with a hardcoded `$`. The empty state is a plain text. A
remove button exists in the screen. No size/variant, no stock check, no max quantity,
no server validation, not user-scoped, not persisted.

**Checkout (VERIFIED).** Local form: street, city, state, zip, country (default `USA`).
`handleConfirmOrder` rejects if street/city/state/zip is empty, otherwise shows
`Alert('Success', 'Your order has been placed!')`, and on OK calls `clearCart()` and
`navigation.goBack()`. The payment section is a hardcoded string. No delivery/pickup choice,
fees, tax, order record, idempotency, or authentication check. The user is never asked for
a phone number or name. Pickup (D-10) has no model at all.

**Mismatch with requirements:** `product-requirements.md` requires server-side totals,
delivery-or-pickup selection, address capture appropriate to the launch city, and an order
record. None exists. Commerce policy (delivery pricing, free-delivery threshold, minimum
order, cancellation/return/refund rules) is OPEN (O-8) and **blocks finishing the checkout
UI**.

---

## 17. Orders and payments

**Orders.** `OrderHistoryScreen`/`OrderDetailsScreen` render the static `orders` array
directly. Four fixtures; statuses `delivered/shipped/processing/pending/cancelled` — **not**
the decided vocabulary (`PLACED…DELIVERED`). A newly "placed" order never appears. Status
badge colours rely on theme keys missing from the running `theme.js`, so badges are
probably uncoloured at runtime. `OrderHistoryScreen.tsx:111,113` has a duplicate `fontWeight`
key (the only `tsc` error). There is no cancel, return, refund, reorder or tracking.

**Payments.** Nothing exists: no SDK, no provider, no PCI scoping. Payment provider and
markets are OPEN (O-4, O-5). `AGENTS.md`/`product-vision.md` explicitly forbid choosing or
implementing a gateway without approval.

**Proposed internal order model:** payment-status × fulfilment-status with a derived display
status (ADR-0012, PROPOSED), mapped onto the decided customer vocabulary in
`checkout-and-order-requirements.md` §2.

---

## 18. Persistence and backend readiness

| Capability | State |
|---|---|
| HTTP client / API / base URL | **None.** No `fetch` or client anywhere in `src/` (DOCUMENTED; consistent with the dependency list) |
| Backend platform | **OPEN** (O-1; blocked on O-2 team/budget/timeline) |
| Database, hosting | OPEN |
| Authentication provider | OPEN (O-7) |
| Payments / shipping | OPEN (O-4, O-5) |
| Image hosting | None; remote Unsplash/pravatar URLs |
| Analytics / crash reporting / logging | None (ADR-0021 PROPOSED; crash reporting is a proposed v1 Must) |
| Push | None (O-13) |
| Env/config | No env files, no config module, no build flavours (ADR-0020 PROPOSED) |
| Local persistence | None. Cart and session die on cold start. ADR-0005 proposes MMKV, ADR-0006 Keychain/Keystore — both PROPOSED, neither approved |
| Repository seam | Not present. The plan (C6, direction approved) is Screen → Hook → Repository → Fixture/API so the UI survives the later data-source swap |

**Readiness:** the app is **not** backend-ready. The UI imports fixtures directly in two
places, uses `number` money, has no loading/error states, no idempotency and no variant
model. The docs' position (DOCUMENTED, owner-endorsed principle of migration over rewrite)
is that the navigation tree, store shapes and component set are sound enough to keep, and
the defects sit in the data layer and infrastructure.

---

## 19. UI and design system

- **Final design system: OPEN** (O-10, ADR-0029). `product-vision.md` §10: "Do not invent the
  final design system." Branding, name, identity: OPEN.
- Current styling: `StyleSheet.create` per screen; monochrome palette (`#000` primary,
  `#fff` background, `#f5f5f5` card). Colours are centralised; `spacing`, `typography`,
  `borderRadius` tokens exist in `theme.ts` and are imported by nothing, so screens hardcode
  values (e.g. `borderRadius: 8` in 12 places).
- Because of the `theme.js` shadow, the live palette is only 5 colours.
- Components: `ProductCard`, `CategoryCard`, `DrawerHeader` (+ dead `HistoryItem`). Both
  cards take an `id` prop and ignore it (2 of the 6 ESLint errors).
- `nativewind` is installed and unused; whether it was a plan or an accident is UNKNOWN. The
  proposed ADR-0017 is to remove it (PROPOSED; needs approval).
- Missing: loading/empty/error patterns, accessibility, i18n (hardcoded English, `$`),
  dark mode, landscape handling (landscape is permitted by iOS plist with no layout), safe-area
  insets (provider mounted, no screen reads an inset), `GestureHandlerRootView`.
- Direction (DECIDED, aspirational): modern, minimal, premium, fashion-commerce; strong photography; clear CTAs.

---

## 20. Testing and quality status

Re-run this session (exit output reproduced from my commands):

| Gate | Result | Matches docs? |
|---|---|---|
| `npx tsc --noEmit` | **1 error**: `OrderHistoryScreen.tsx(113,5) TS1117` duplicate property | Yes |
| `npx eslint .` | **6 errors, 2 warnings** (`no-unused-vars` ×5, `no-dupe-keys`, `react/no-unstable-nested-components`, one `no-unused-vars` warning in `HistoryScreen.js`) | Yes |
| `npx jest` | **1 suite failed, 0 tests**: `SyntaxError: Cannot use import statement outside a module` at `react-native-reanimated/lib/module/index.js:3`, reached from `App.tsx:1` | Yes |

- Reanimated 4 ships ESM; Jest's `react-native` preset doesn't transform it. Reanimated is imported once in `App.tsx` as a side effect and used nowhere else in `src/`; it exists because the drawer requires it.
- `react-native-reanimated/plugin` is still the Babel plugin in `babel.config.js`. Reanimated 4 relocated its plugin to `react-native-worklets`; whether the old path still resolves was **not verified** here. Checked only that the app config exists, not that it builds.
- No `typecheck` or `format` npm script. No CI. No hooks.
- Fixing the three static gates is bounded: the 1 `tsc` error and 6 ESLint errors are each one-line issues (docs `technical-debt-plan.md` dispositions them; I did not read it in full).
- The only test is the CRA-style "renders correctly" smoke test, which, even if it ran, would not test any behaviour.
- Test strategy, tooling (Testing Library, Maestro) and phase-gate testing are PROPOSED in `docs/implementation/testing-plan.md` (ADR-0018, ADR-0023). Not approved.

---

## 21. Security and configuration

| Item | Severity (my reading) | Evidence |
|---|---|---|
| Android release signed with committed debug keystore; plaintext `android/android` passwords in repo | **P0** if ever shipped | `build.gradle:89-93,103`; `android/app/debug.keystore` exists |
| Auth is fake — no credential is checked | P1 for any real use; irrelevant while no backend exists | `userStore.ts:21-33` |
| iOS bundle id is a template placeholder; no iOS signing config | P1 for release | `project.pbxproj:276,303`; no `DEVELOPMENT_TEAM` (DOCUMENTED) |
| Release R8/ProGuard disabled, empty rules | P2 | DOCUMENTED BUILD-04 |
| `usesCleartextTraffic="${usesCleartextTraffic}"` placeholder in the manifest; I did not trace where it is set | Needs verification | `AndroidManifest.xml:12` |
| Empty `NSLocationWhenInUseUsageDescription` in a non-location app | P2, app-review risk | `Info.plist` |
| No secrets in code; no env files; no tokens stored | Informational | grep |
| No input validation beyond "non-empty"; no sanitisation (nothing is sent anywhere) | Informational until a backend exists | screens |
| Plain HTTP/ATS: `NSAllowsArbitraryLoads=false`, local networking allowed | OK | `Info.plist` |
| Dependency vulnerabilities: **not audited** (`npm audit` not run) | Unknown | — |

The proposed threat model, session design (in-memory access token, rotating refresh), and
payment security approach are in `docs/architecture/security-architecture.md` (PROPOSED,
not read in full by me).

---

## 22. Known issues and technical debt

The authoritative register is `docs/current-state/known-issues.md`: **65 issues — P0 ×1,
P1 ×11, P2 ×25, P3 ×28** (BUILD 8, DATA 8, QUAL 11, DEAD 7, NAV 8, APP 15, PLAT 8). I
re-verified the items below against code or command output and found them **accurate**.
Register entries were previously documented unless stated.

| # | Issue | Sev | Evidence (this session) | Impact | Status | Next action (RECOMMENDATION, not executed) |
|---|---|---|---|---|---|---|
| 1 | `products.js`/`theme.js` shadow the `.ts` twins (DATA-01/04) | P1 | Metro `sourceExts` printed; both files exist; `tsc` blind to `.js` | Running app ≠ type-checked app; blank titles, empty categories, undefined colours (INFERRED) | Confirmed config; runtime effect unobserved | Needs ADR-0002; verify on a device first |
| 2 | Release signed with debug keystore (BUILD-01) | P0 | `build.gradle:103` | Irreversible if published | Confirmed | Needs ADR-0019; do before any distribution |
| 3 | Auth is mock; signup = login (APP-01/02) | P1 | `userStore.ts:21` | No account exists | Confirmed | Replace per D-9, after O-7 |
| 4 | Checkout creates no order (APP-03) | P1 | `CheckoutScreen.tsx:45-49` | Cart empties, nothing recorded | Confirmed | Needs order model + backend decision |
| 5 | Nothing persisted (APP-04) | P1 | no persistence dep | Cart/session lost on relaunch | Confirmed | ADR-0005/0006 |
| 6 | 0 tests execute (QUAL-01) | P1 | `npx jest` output | No verification possible | Confirmed | ADR-0018 |
| 7 | App is login-first; **guest browsing impossible** | P1 (new framing) | `RootNavigator.tsx:15` | **Directly contradicts D-8.** The docs list auth as "mock" but frame the gate issue mostly in the requirements, not as a defect | Confirmed | Restructure root navigation; decide O-6 first |
| 8 | Auth, profile and settings screens contradict D-9/D-13 | P2 | screens read | Wrong credential; 4 of 6 profile rows and most settings are outside D-13 | Documented in `decisions/README.md` §4 | Replace/remove per D-13 |
| 9 | Category taxonomy mismatched with catalogue (DATA-07) | P2 | categories.ts vs products.ts | 5 of 8 categories empty even after fix | Confirmed | O-11 |
| 10 | Category tap may be a silent no-op (§12.3) | P1 if true | `CategoriesScreen.tsx:20-24` | Discovery path broken | **SUSPECTED, unverified** | Run the app; then NAV-04 fix |
| 11 | Committed lockfiles disagree with `package.json` (§2.1) | P2 | `git show HEAD:package-lock.json` | Clean-clone installs drift/fail | **New** — docs call provenance UNKNOWN | Owner decides whether to commit the modified lockfiles |
| 12 | Docs and `AGENTS.md` are uncommitted | P2 | `git status` | Total loss risk of ~11.7k lines of decisions | **New** | Owner decides; I did not commit |
| 13 | Duplicate `fontWeight`, unused vars, unstable drawer component (QUAL-02…08) | P2/P3 | `tsc`/`eslint` output | Gates red | Confirmed | Small, bounded fixes (when a phase is approved) |
| 14 | Business rules duplicated; no repository seam (APP-05/06, C5/C6) | P2 | code read | Blocks UI-survives-backend goal (§12 of vision) | Confirmed | Phase 2 |
| 15 | No loading/error/empty states; no accessibility (APP-09/10/15) | P2/P3 | DOCUMENTED; spot-checked | Poor UX; part of v1 Must list | Not re-counted | — |
| 16 | `password` unused, `id` props unused, `navigation`/`user` unused | P3 | ESLint | Noise | Confirmed | — |
| 17 | Money is JS float | P2 | `price: number`, `toFixed` | Rounding on a payment path | Confirmed | ADR-0011 PROPOSED |
| 18 | Unused deps: `nativewind`, `@react-native/new-app-screen`, `@babel/preset-env` | P3 | `package.json`; no usage in `src/` | Misleading | Confirmed | ADR-0017 PROPOSED |

**Doc-accuracy findings (minor).** Line citations in some docs have drifted by 1–10 lines:
`known-issues.md` cites `CheckoutScreen.tsx:33-54` and `SignupScreen.tsx:34`; actual
locations are `:45` (alert) and `:35` (`login(...)`). `AGENTS.md` says "6 untyped `.js`
files"; I count 7 `.js` files under `src/` (`HistoryItem.js`, `history.js`, `products.js`,
`HistoryScreen.js`, `authStore.js`, `theme.js` = 6, **plus none** — the 6 is right; the seventh
I thought I saw was `index.js` at the root, which is outside `src/`). No documentation claim
I checked was substantively wrong.

---

## 23. Project history and milestones

| Date | Commit | Event | Evidence |
|---|---|---|---|
| 2025-11-14 | `c4a8e83` | Initial commit (1 file) | `git show --stat` |
| 2025-11-16 | `c19596a` | "feat: initial ios ui setup of the app" — 93 files, +20,166: the RN template, the whole `src/` tree (~38 files), iOS and Android native projects. Despite the message it contains the Android project too (60 `src/`/`android/` paths) | `git show --stat` |
| 2026-09-03 | `66044c5` | "fix: app not working on the android issue fixed" — `package.json` only: Reanimated 3→4.1.7, adds worklets 0.6.1. **INFERRED:** Reanimated 3 was failing on RN 0.82 Android; the lockfiles for this change were never committed | `git show 66044c5` |
| 2026-09-03 | — (uncommitted) | Documentation baseline: current-state set, 65-issue register, then planning set | `docs/releases/changelog.md` |
| 2026-09-03 | — | Product direction decided (D-7…D-16): men's clothing, one city, guest browsing, mobile+OTP, pickup, deferral of search/promos, profile contents, UI+static-first, standards C1–C15 | `decisions/README.md` |
| 2026-10-30 | — | This report | — |

**Gap:** between `c19596a` (2025-11-16) and `66044c5` (2026-09-03) there are ~9.5 months with no
commits; no history explains why the iOS-first prototype was left. **Prior audits:** the
`docs/current-state/` set *is* the audit; I found no separate earlier audit document.
**Unfinished work:** the `History` purchase-history screens (abandoned), `authStore.js`,
`navigationRef`/`StackKeys` enums, unused theme tokens, `nativewind` install.
**Regressions:** none can be established — there is no baseline of working behaviour or test.

---

## 24. Decision register

| ID | Decision / item | Category | Source |
|---|---|---|---|
| D-1…D-16 | See §5.1 | **Confirmed** | `decisions/README.md`, `product-vision.md` |
| — | Customer-facing order vocabulary `PLACED…DELIVERED` | **Confirmed** | `product-vision.md` §4 |
| — | Principle "Migration, not rewrite" | **Confirmed** (principle) | `product-vision.md` §11 |
| — | Keep React Native 0.82.1, New Architecture, Hermes, React Navigation v7, Zustand, `StyleSheet`, TS strict | **Confirmed implicitly** by D-16 direction/C7/C9 and documented as "keep" | `decisions/README.md` §4 |
| C6, C7, C8, C9, C11 | Directions approved by D-16; ADRs still required | **Confirmed direction, ADR pending** | `decisions/README.md` §2 |
| ADR-0001 … 0028 (24+ items) | Canonical product contract, TS-only tree, Zustand, TanStack Query, MMKV, Keychain, REST+OpenAPI, money in minor units, order model, storeId, feature-first folders, testing, CI/signing, env config, observability, variants/inventory, E2E, pickup, notifications, wishlist/reviews | **Proposed** | `decisions/README.md` §3 |
| ADR-0007, 0014, 0025, 0029 | Backend platform; payment provider; OTP provider/policy; design system | **Unresolved (blocked on product answers)** | same |
| ADR-0015, 0027 | Nav structure; order notifications | **Unresolved (need O-6, O-13)** | same |
| O-1…O-13 | See §25 | **Unresolved** | same |
| Full rewrite | Rejected | **Rejected** | `migration-plan.md` §1 |
| Keep electronics catalogue; guest checkout in v1; floating-point money; mobile seller app first; search in first phase; coupons now; marketing notifications; decorative settings | Rejected | **Rejected** | `decisions/README.md` |
| Email+password; password reset as Must; catalogue search as Should; reviews as Could; push as "nice" | Superseded by D-9/D-12/D-14/D-11 | **Superseded** (old text intact in `authentication-requirements.md`, `product-requirements.md`) | `decisions/README.md` |
| ADR index | **Empty. "No ADR written yet."** | — | `decisions/README.md` §7 |
| Phase plan vs D-15 | No phase exists for design system / UI quality | **Needs owner decision** | `implementation-phases.md` alignment section |
| Whether lockfile mods are intentional | — | **Needs verification** | §2.1 |
| Whether `usesCleartextTraffic` placeholder is safely set | — | **Needs verification** | §21 |
| Whether `react-native-reanimated/plugin` is correct for Reanimated 4 | — | **Needs verification** | §20 |
| Whether `getParent()` is `undefined` in `CategoriesScreen` | — | **Needs verification (run app)** | §12.3 |

**Note.** The docs describe "29 ADRs"; the decisions page counts "24" in `AGENTS.md` §4 and
"29" in its own §3. These numbers disagree (the 24 predates D-7…D-16, which added 0025–0029).
Treat 29 as current. (VERIFIED by reading both.)

---

## 25. Unresolved questions

Prioritised within each group. "Required before impl." = a decision must exist before the
related code can be written (the project's own rule, D-6).

### 25.1 Business

| ID | Question | Why it matters | Known | Options | Depends | Required before impl.? |
|---|---|---|---|---|---|---|
| Q-B1 | Which store, which city, how many products, what launch date? (O-3) | Sizes fixtures, taxonomy, pickup rules, release plan | Men's clothing, one city, real product | — | — | Before catalogue seeding and Phase 7 |
| Q-B2 | Team size, budget, timeline, in-house backend skill (O-2) | **This is what actually decides the backend choice** | Unknown | — | — | Before ADR-0007 |
| Q-B3 | Revenue model beyond retail; marketplace commission/payouts | Shapes data model hooks | Single-store retail implied | — | Q-B1 | No (FUTURE) |
| Q-B4 | What customer problem does TojApp solve, and what is the validation evidence? | Informs scope, branding and what *not* to build | Not documented | Customer interviews, demand test, store-owner letter of intent | — | No code dependency, high value |
| Q-B5 | Brand, app name, identity (O-10) | Blocks UI direction, store listing, bundle IDs | "TojApp/TOJ" working name | — | — | Before major UI work (D-15's first phase!) and Phase 7 |

### 25.2 Product

| ID | Question | Why it matters | Known | Options | Required before impl.? |
|---|---|---|---|---|---|
| Q-P1 | Category taxonomy (O-11) | 5 of 8 categories are empty; `Sale` isn't a category | 8 placeholder categories | Garment-type tree; gender/occasion; flat list | Before catalogue/category UI |
| Q-P2 | Commerce policy: delivery price, free-delivery threshold, minimum order, cancel/return/refund (O-8) | Checkout UI cannot be finished | Capabilities decided, rules not | — | Before checkout UI |
| Q-P3 | Pickup rules: which stores/products, hold period, ID at collection (O-9) | Needed for the checkout branch | Per-product eligibility decided | — | Model: no; rules: yes |
| Q-P4 | Which *functional* Settings exist? | D-13 forbids decorative ones | "Minimal, functional only" | Possibly none in v1 | Before touching `SettingsScreen` |
| Q-P5 | Help/Support implementation (O-12) | Profile row has no destination | Required row | Email/WhatsApp link; FAQ page; chat | Before Profile |
| Q-P6 | Size scheme and size-chart data; are colours a variant? | Variant model (ADR-0022) | Size "where applicable"; optional size chart | — | Before product detail/cart redesign |
| Q-P7 | Does "v1" include backend+payment, or does D-15 mean they come after a UI-only milestone? | Docs list backend+payment as v1 Must **and** "not now" | See §6 | Clarify milestone names: M1 UI/static, M2 commerce, M3 release | Before the plan is approved |
| Q-P8 | Wishlist/reviews: in or out of MVP? | Conditional per D-14 | Conditional | Build wishlist first (no order dependency); reviews after orders | Per feature |
| Q-P9 | Is a guest allowed to add to cart / persist a cart before login? | Affects cart ownership and merge-at-login | Browsing: yes; checkout: login | Persist locally; merge on login | Before Phase 3/5 |

### 25.3 Technical

| ID | Question | Why it matters | Known | Options | Dependencies | Required before impl.? |
|---|---|---|---|---|---|---|
| Q-T1 | Backend: custom, BaaS or headless commerce (O-1) | Gates Phases 4–6 | Backend will exist (D-4) | Custom API; BaaS (e.g. Supabase/Firebase); headless commerce | Q-B2 | Before Phase 4 |
| Q-T2 | Payment provider and markets (O-4/O-5) | Gates Phase 6; PCI scope | Online payment decided | — | Q-B1 | Before Phase 6 |
| Q-T3 | OTP provider and policy; recovery when number lost (O-7) | Gates Phase 5 | Mobile+OTP decided | — | Q-T1 | Before Phase 5 |
| Q-T4 | Drawer vs tabs as primary nav (O-6) | Navigation restructure | Both exist | Tabs only; drawer only; tabs + profile stack | — | Before Phase 2 |
| Q-T5 | How to repair `.js`/`.ts` shadowing (delete `.js`; migrate to TS only) | Defining defect | ADR-0002 PROPOSED | Delete `.js` twins; convert remaining `.js`→`.ts` | — | Yes (ADR-0002) |
| Q-T6 | Local storage engine (MMKV vs AsyncStorage) and key versioning | Phase 3 | ADR-0005 proposes MMKV | MMKV; AsyncStorage; SQLite | — | Yes |
| Q-T7 | Push provider; ship in v1? (O-13) | Notifications | Order-related only | FCM/APNs direct; third-party | Q-T1 | Before ADR-0027 |
| Q-T8 | Android release signing, bundle identifiers, CI (ADR-0019) | Release | Debug-signed | — | Q-B5 (names) | Yes, Phase 0 |
| Q-T9 | Should the pre-existing lockfile changes be committed? | Reproducible installs | See §2.1 | Commit as-is; regenerate | — | Housekeeping |

### 25.4 UX/UI

| ID | Question | Why it matters | Known | Required before impl.? |
|---|---|---|---|---|
| Q-U1 | Design system: tokens, component inventory, loading/empty/error patterns (O-10, ADR-0029) | D-15's first phase depends on it; no written recommendation | Direction words only | **Yes, for major UI work** |
| Q-U2 | Final navigation structure | See Q-T4 | — | Yes |
| Q-U3 | Measurable UX criteria ("fast", "premium") | Vision gives qualities, not acceptance criteria | None | Before acceptance of UI work |
| Q-U4 | Orientation policy (lock portrait?) | PLAT-02 | Cheapest fix is lock | Minor |
| Q-U5 | Image strategy (hosting, aspect ratios, caching) | "Strong product photography" is a goal | Remote Unsplash URLs | Before catalogue seeding |

---

## 26. Implementation readiness assessment

**Status:** the product direction is ready; the technical plan is a proposal with zero
recorded ADRs; **no phase is approved** (`AGENTS.md` §1a: "Do not begin one").

| Category | Items |
|---|---|
| **Can safely proceed (needs only an ADR/approval, no product answer)** | Phase 0: make the repo verifiable — fix the 1 `tsc` + 6 ESLint errors, make Jest load Reanimated 4, add a `typecheck` script, set up CI, real Android keystore (ADR-0018, ADR-0019). Phase 1: one data source per module (ADR-0001/0002/0017). |
| **Needs product clarification** | O-3, O-8, O-9, O-11, O-12, Q-P4, Q-P6, Q-P7, Q-P9 |
| **Needs business clarification** | O-2, O-3, Q-B4, Q-B5 |
| **Needs technical decision** | ADR-0015 (nav), 0003/0016 (structure), 0011 (money), 0005/0006 (storage), then 0007…0014, 0025 |
| **Must be fixed before further feature work** | The shadow-file defect, a runnable test gate, and a device-level confirmation of current behaviour (§12.3). Without these, nothing built on top can be trusted. |
| **Validate before investing** | Business validation (Q-B4); Reanimated 4 and the drawer actually run on both platforms; the Categories navigation (§12.3) |
| **Can be postponed** | Backend, API, payments, OTP provider, push, seller/admin, marketplace, search, filters, promotions, dark mode, i18n, tablet layouts |
| **Should not be built yet** | Payment SDK, seller platform, marketplace tables beyond the 4 items in `marketplace-roadmap.md` §4, coupon/promo infrastructure, catalogue search, TanStack Query (C8: not before server state), `nativewind`-based styling |
| **Gate that is most under-specified** | **ADR-0029 / O-10 design system** — the approved first phase (UI + static data) depends on it, yet it has no recommendation and no phase |

---

## 27. Prioritised backlog

P-levels are my **RECOMMENDATION**. None is approved or started. All implementation items
are subject to the "no phase approved" rule.

| Pri | Item | Rationale | Depends on | Done when |
|---|---|---|---|---|
| **P0** | Owner decision: approve / amend the phase plan; resolve whether a UI/design-system phase is inserted (gap in `implementation-phases.md`) | Nothing may start until a phase is approved; the first-chosen phase has a hole | Owner | A written decision; phase plan updated per the supersede-don't-rewrite rule |
| **P0** | Commit (or deliberately not) `AGENTS.md`, `docs/`, and the two lockfile changes | The decision record and the lockfile reflecting `package.json` exist only in a dirty working tree | Owner | Owner-directed commit/PR; clean `npm ci` works |
| **P0** | Write and approve ADR-0018 (testing) and ADR-0019 (CI + signing) | Phase 0's only prerequisites; BUILD-01 is the one P0 defect | Owner approval | Two ADRs in `docs/decisions/`, index updated |
| **P0** | Run the app on both platforms and record what actually happens (blank titles? empty categories? category-tap no-op? Reanimated 4 plugin OK?) | Every runtime claim in the docs is inferred from code; this converts INFERRED to VERIFIED | None | Short observation log committed to docs |
| **P1** | Phase 0: red→green `tsc`/`eslint`/`jest`; typecheck script; CI | Makes change verifiable | P0 ADRs | `npm run typecheck`, `lint`, `test` all pass in CI; ≥1 real test runs |
| **P1** | Phase 1: delete the `.js` shadows, one product contract (ADR-0001/0002) | Defining defect | ADR approvals | Device shows 15 clothing products with titles; theme tokens resolve |
| **P1** | Resolve O-10 / write ADR-0029 | Gates D-15's first phase | Owner (brand/design input) | An approved ADR with a token set and state patterns |
| **P1** | Resolve O-6 (nav) and Q-P7 (milestone meaning) | Phase 2 structure; plan clarity | Owner | Recorded answers |
| **P2** | Replace auth screens with a mobile+OTP UI against a fixture repository; guest-first root navigation | D-8/D-9; UI can be built before the provider | Phase 2 seam, O-6 | Guest can browse; checkout triggers login |
| **P2** | Product variants/sizes in the model and UI (ADR-0022); size selection before add-to-cart | Core to clothing | Q-P6, ADR-0001 | Cart distinguishes sizes |
| **P2** | Persistence (Phase 3): cart survives relaunch; cart cleared/merged at logout per decision | APP-04, APP-11 | ADR-0005/0006, Q-P9 | Cold-start test passes |
| **P2** | Answer O-8/O-9/O-11/O-12 and Q-P4 | Unblock checkout, profile, settings, taxonomy | Owner | Recorded policies |
| **P2** | Backend choice (O-1/O-2) | Gates Phases 4–6 | Q-B2 | ADR-0007 approved |
| **P3** | Remove dead files and dead deps; fix minor lint/type nits; accessibility labels; empty states | Cleanliness; some are v1 Musts later | Phase 1/2 | Register items closed |
| **P3** | Business validation work (Q-B4) | Cheap insurance against building the wrong thing | Owner | Evidence summarised in `docs/requirements/` |
| **P3** | Wishlist (D-14) after core flow | Conditional | Core flow stable | Optional |
| Later | Payments, push, reviews, seller/admin, marketplace, search | Deferred by decision | — | — |

---

## 28. Recommended continuation workflow

**RECOMMENDATION.** The evidence supports one reordering of the template sequence: insert
a **"verify actual behaviour"** step before reconciling anything, because the central
documented risk (the shadowing defect) is inferred from config and code, not observed.

| # | Phase | Prerequisites | Deliverables | Completion criteria |
|---|---|---|---|---|
| 1 | **Secure the record** | Owner consent | `AGENTS.md` + `docs/` and the intended lockfiles committed to a branch/PR | Clean working tree; `npm ci` reproduces installed versions |
| 2 | **Observe the real app** | Working iOS/Android toolchain | Dated log of runtime behaviour on both platforms; updates to the INFERRED items in this report | Each §22/§12.3 suspicion is confirmed or refuted |
| 3 | **Confirm business direction** | Owner | Answers to Q-B1, Q-B2, Q-B4, Q-B5 (as much as available) | Recorded in `product-vision.md` OPEN list or a new note |
| 4 | **Confirm product requirements** | Owner | Q-P1…Q-P9; clarification of "v1" milestones | `product-requirements.md` §7 updated per the supersede rule |
| 5 | **Approve the plan** | 3–4 | Decision on a UI/design-system phase; approved Phase 0 scope | Phase plan amended with owner approval |
| 6 | **Phase 0 — verifiable repo** | ADR-0018, ADR-0019 | Green gates, CI, real signing | CI green on a PR |
| 7 | **Phase 1 — canonical data** | ADR-0001, 0002, 0017 | One source tree; 15-item clothing catalogue running on device | Device check + test |
| 8 | **Design system (new, if approved)** | ADR-0029 / O-10 | Token set, component inventory, state patterns | Approved ADR; components built to it |
| 9 | **Phase 2 — structure and nav; Phase 3 — persistence** | ADR-0003/0011/0015/0016; ADR-0005/0006 | Repository seam, typed nav, guest-first root, persisted cart | Tests at the phase gate |
| 10 | **Backend decision; Phases 4–6** | O-1, O-2, O-4, O-7 | API, auth, orders, payments | Per phase |
| 11 | **Phase 7 — release readiness** | O-10, store accounts | Branding, signing, crash reporting, store submission | Submitted build |

At each step: update docs in the same PR (`AGENTS.md` §2), record decisions as ADRs
(supersede, never rewrite), keep project-wide docs untouched unless a project-wide rule
changed (and say so in the PR).

---

## 29. Exact files and documentation another AI should read first

Read in this order. Total required reading is far smaller than the 11.7k-line doc set.

| Order | File | Why |
|---|---|---|
| 1 | `AGENTS.md` | Rules, current state, the `.js`/`.ts` warning, §8 "do not change source" |
| 2 | `docs/PROJECT_CONTEXT_HANDOVER.md` (this file) | Verified state, gaps, open questions |
| 3 | `docs/requirements/product-vision.md` | Authoritative product intent and the full OPEN list |
| 4 | `docs/decisions/README.md` | D-1…D-16, O-1…O-13, 29-ADR list |
| 5 | `docs/current-state/known-issues.md` | The 65-issue register (re-verified; accurate) |
| 6 | `docs/current-state/data-flow.md` | The shadowing defect in detail |
| 7 | `docs/development/engineering-standards.md` | C1–C15 (binding) |
| 8 | `docs/implementation/implementation-phases.md` | Phases 0–8, the alignment gap, the readiness checklist |
| 9 | `docs/requirements/product-requirements.md` §6–§7 | MVP scope; decided vs open |
| 10 | `docs/architecture/domain-model.md` | Proposed entity/contract (PROPOSED) |
| — | Source, in this order | `src/navigation/RootNavigator.tsx`, `src/store/*.ts`, `src/data/products.{ts,js}`, `src/utils/theme.{ts,js}`, `src/screens/Cart/CheckoutScreen.tsx`, `src/screens/Categories/CategoriesScreen.tsx` |
| Then as needed | `docs/current-state/{navigation,state-management,architecture,application-flow}.md`; `docs/features/*`; `docs/requirements/{authentication,checkout-and-order,marketplace-roadmap}`; `docs/architecture/{target-architecture,security-architecture}.md`; `docs/implementation/{migration-plan,technical-debt-plan,testing-plan}.md`; `docs/documentation-strategy.md` |

---

## 30. Limitations of this report and items that still require verification

**Not inspected / not done**

- **The app was never run.** Every statement about runtime behaviour (blank titles, empty
  categories, undefined colours, the Categories no-op, whether Reanimated 4's Babel plugin
  path is valid, whether the Android build works) is INFERRED from config and code.
  Metro `sourceExts` order, `tsc`, `eslint` and `jest` outputs were verified directly.
- Android/iOS native directories: **grep-level only** — `build.gradle`, `gradle.properties`,
  `AndroidManifest.xml`, `Info.plist`, `project.pbxproj` keys, `Podfile`. I did not read
  Gradle settings, MainApplication/AppDelegate, signing in `project.pbxproj` in full, or
  the where-set of the `usesCleartextTraffic` placeholder.
- `docs/`: read fully only `README.md`, `decisions/README.md`, `product-vision.md`,
  `known-issues.md`; partially `product-requirements.md`, `implementation-phases.md`,
  `engineering-standards.md`, `changelog.md`, `data-flow.md`. **Not read:** `domain-model`
  (headings only), `target-architecture`, `security-architecture`, `migration-plan`,
  `technical-debt-plan`, `testing-plan`, `authentication-requirements`,
  `checkout-and-order-requirements`, `marketplace-roadmap` (headings only), `features/*`,
  `components/*`, and most of `current-state/*`. Statements citing those are
  DOCUMENTED-by-index only.
- `node_modules`: read installed versions only; no dependency or vulnerability audit.
- Git: local history only; no remote, PR, issue or branch review.
- No Figma, ClickUp, Mixpanel or other connected-tool data was consulted.
- Package-lock diff (938 insertions) was characterised by the Reanimated/worklets entries only.

**Still to verify** (listed with owner action where relevant)

| Item | How |
|---|---|
| Category tap behaviour (§12.3) | Run on a simulator; tap each category |
| Blank titles / empty categories / undefined colours (§14.1) | Run on a simulator |
| `react-native-reanimated/plugin` validity under Reanimated 4 | Check Reanimated 4 migration notes; build both platforms |
| `usesCleartextTraffic` placeholder source | Read `android/app/build.gradle` manifestPlaceholders and `gradle.properties` |
| Lockfile provenance (§2.1) | Ask the owner; compare with their local install |
| Product problem statement, validation, price positioning, store identity, city | Ask the owner — nothing in the repository answers these |

**Pre-existing changes.** `ios/Podfile.lock` and `package-lock.json` were modified before
this task. I did not touch, revert or claim them. `AGENTS.md` and `docs/` (except this file)
were also pre-existing and untracked.

**Confidence.** High for the structure and the defect list (the register matched every item
I re-checked). Moderate for runtime effects. Low for the business sections — they are the
owner's stated decisions as recorded in docs, with no independent evidence in the repository.
