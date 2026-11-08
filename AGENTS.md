# AGENTS.md — Instructions for AI Coding Agents

Status: Current State
Last Verified: 2026-11-08 (A12 doc sweep)
Source: branch `feature/toj-customer-ui`, on top of commit `66044c5`. The UI described below lands in the commit that follows this documentation baseline

Read this file first. Then read the documentation it points to. Then read the code.

---

## 1. What this project currently is

**TojApp** is a React Native 0.82.1 customer-facing **men's clothing** app. The UI for the
whole v1 customer journey runs against the **local API with seeded dummy data**. It is not a
production system and is not deployed.

On branch `feature/api-integration` the app **calls the local `toj-backend` API** ([ADR-0031](docs/decisions/0031-app-api-integration.md)); the backend lives in the separate **`toj-backend`** repository (sibling folder `../toj-backend`; see §1a, §7b, [ADR-0030](docs/decisions/0030-separate-backend-repository.md)). Fixtures in `src/data/` remain for tests.

| Aspect | Current reality |
|---|---|
| Platform | React Native 0.82.1, iOS + Android |
| Language | TypeScript 5.8.3 (`strict: true`); no `.js` source files remain |
| Navigation | React Navigation v7: root native-stack + bottom tabs (Home, Shop, Bag, Account). No drawer |
| State | Zustand 4.5.2, stores: cart, user, wishlist, order, product. Device keeps session tokens and guest bag/wishlist (ADR-0006) |
| Styling | `StyleSheet.create` + `src/utils/theme.ts` tokens. No inline styles (ESLint-enforced) |
| Data | Local API via `src/api/client.ts` (fetch; tokens in Keychain/Keystore, ADR-0006). Fixtures `products.ts`, `categories.ts`, `orders.ts`, `stores.ts` for tests |
| Money | Integer paise, INR; format via `utils/format.ts` |
| Backend | Separate repo `toj-backend` (`../toj-backend`), NestJS 12, Prisma 7, PostgreSQL 17, Node 24: catalogue, OTP auth, cart, wishlist, addresses, pickup orders, reviews ([ADR-0028](docs/decisions/0028-reviews.md)), admin (branch `feature/backend-core`). Progress: `toj-backend/docs/IMPLEMENTATION_PROGRESS.md` |
| Payment / real OTP | NOT IMPLEMENTED. All simulated and labelled as demo in the UI |
| Tests | Jest: `__tests__/App.test.tsx` (render) + `__tests__/logic.test.ts` + `__tests__/cartSync.test.ts` + `__tests__/orderCancel.test.ts` + `__tests__/productRefresh.test.ts` + `__tests__/sessionRestore.test.ts` + `__tests__/guestBagPrune.test.ts`; 18 tests pass |
| tsc / ESLint | 0 errors / 0 warnings |

Screen inventory, navigation and mock behaviour:
[`docs/UI_IMPLEMENTATION_PROGRESS.md`](docs/UI_IMPLEMENTATION_PROGRESS.md).
Current-state summary: [`docs/current-state.md`](docs/current-state.md). Historical pre-UI pages:
[`docs/archive/pre-ui-baseline/`](docs/archive/pre-ui-baseline/README.md).

---

## 1a. What this project is becoming — DECIDED 2026-09-03

The product direction is no longer open. It is:

| # | Decision |
|---|---|
| D-1 | The product is a **clothing** store. The electronics dataset in `src/data/products.js` is **not** the product |
| D-2 | v1 is a **customer-facing mobile shopping app for a single store** |
| D-3 | The long-term direction is a **multi-vendor clothing-first marketplace** |
| D-4 | A **backend will exist** |
| D-5 | Seller and admin are **future products**, not v1 |
| D-6 | **Documentation-first**: document, decide, record the decision, then implement |
| D-7 | v1 is **men's clothing**, launching in **one city**, as a real commercial product |
| D-8 | **Guest browsing allowed**; an **account is required before checkout** |
| D-9 | Initial credential type is **mobile number + OTP** — the existing email/password screens do not match it |
| D-10 | **Store pickup** is supported and modelled **per product**. Never assume every product supports pickup |
| D-11 | Notifications are **order-related only** initially |
| D-12 | **Search, filters and promotions are deferred.** Categories are the discovery mechanism |
| D-13 | Profile is exactly: Personal Information, My Orders, Wishlist, Help/Support, Logout. **Settings contain only genuinely functional settings** — do not add decorative ones |
| D-14 | Wishlist and reviews are **desired for MVP, conditional** on not delaying the core flow. Reviews require a verified purchase |
| D-15 | **UI + static data first.** Backend, payment gateway, seller platform and marketplace infrastructure are not built prematurely |
| D-16 | The **C1–C15 engineering standards** are approved and binding on new code |

The full statements, and everything that is still OPEN, are in
[`docs/requirements/product-vision.md`](docs/requirements/product-vision.md) — the
authoritative product-goal document.

**Customer UI is implemented against the local API** (§1, §3). Payments, real SMS OTP,
seller/admin products and hosting are not. The planning set that follows from these decisions:

| Read for | Document |
|---|---|
| **What TojApp is and where it is going** | [`docs/requirements/product-vision.md`](docs/requirements/product-vision.md) |
| How code must be written | [`docs/development/engineering-standards.md`](docs/development/engineering-standards.md) |
| What the product must do | [`docs/requirements/product-requirements.md`](docs/requirements/product-requirements.md) |
| Entities, product contract, money | [`docs/architecture/domain-model.md`](docs/architecture/domain-model.md) |
| How it will be built | [`docs/architecture/target-architecture.md`](docs/architecture/target-architecture.md) |
| In what order, with what rollback | [`docs/implementation/implementation-phases.md`](docs/implementation/implementation-phases.md) |
| What is decided, open, rejected | [`docs/decisions/README.md`](docs/decisions/README.md) |

**The v1 customer UI (static data) was implemented on explicit request.**

**Backend gate LIFTED 2026-10-31.** The product owner approved the backend blueprint
(now `toj-backend/docs/`) and decisions Q-1 (Node 24 via fnm, Docker), Q-2
(INR, integer paise, pickup-only demo checkout), Q-5 (customer cancel only from PLACED and
CONFIRMED; CANCELLED terminal; no refund integration), Q-7 (keep search/filters/sort/sale,
server-backed) and Q-8. ADRs 0007-0013, 0020, 0022, 0026 are Accepted. Still NOT approved:
payment gateway, real SMS OTP, seller/admin products, production hosting
and deployment. Do not begin those.

---

## 1b. Autonomous engineering and decision-making policy (approved 2026-10-31)

Act as senior engineer, architect, QA and documentation owner.

| Level | Kind | Who decides |
|---|---|---|
| 1 | Internal technical (naming, structure, tests, tooling inside the approved stack) | Agent, documented |
| 2 | Reversible architectural (module boundaries, library choice within approved decisions, config) | Agent, recorded in `toj-backend/docs/DECISIONS.md` (backend) or an ADR here |
| 3 | Customer-facing business behaviour, pricing/payments/refunds/cancellations, privacy, legal, scope, recurring costs, irreversible data migrations or destructive operations, production releases, git commits/pushes/merges/deployments | Product owner. Batch every blocking question into one report |

Standards:
- Verify against official docs; never claim a test passed unless it was executed.
- Document what changed, why, alternatives, assumptions, testing, limitations and migration implications, in the same change.
- Git safety: never commit, push, merge, rebase or modify protected branches without explicit authorisation. Never discard, overwrite or reset pre-existing user changes. Lockfiles are committed and must stay in sync with `package.json` (`npm ci` must pass on a clean clone). Inspect `git status` before and after work.
- Destructive database commands (`prisma migrate reset`) are blocked for agents by Prisma; do not set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` without the owner's consent.
- Completion report lists: completed work, technical decisions, files created or modified, tests and verification, limitations, blockers, decisions needing approval, recommended next milestone.

---

## 2. Documentation-first rule

Every agent working on this repository follows this order:

1. **Read `AGENTS.md`** (this file).
2. **Read the relevant documentation** under [`docs/`](docs/README.md).
3. **Inspect the relevant source code.** Documentation describes the repository at the
   date stamped on each page; the code is the final authority.
4. **Understand existing behaviour** before changing it. Trace the real flow end to end.
5. **Make the smallest appropriate change.**
6. **Update the documentation** in the same change whenever behaviour, architecture,
   file layout, dependencies or configuration change.
7. **Update or add tests** where applicable (`npm test`; see
   [`docs/development/testing.md`](docs/development/testing.md)).

The project follows: **DOCUMENT → DISCUSS → DECIDE → DOCUMENT DECISION → PLAN →
IMPLEMENT → TEST → DOCUMENT RESULT**.

Architectural decisions are recorded in [`docs/decisions/`](docs/decisions/README.md),
not made silently inside code.

---

## 3. Mock behaviour you must know

- **Demo OTP is `123456`** (server `OTP_MODE=fixed`). Demo existing account phone is `9876543210`
  (seeded by `toj-backend`). Any other number creates a new account on the server (name required).
- **The local backend must be running** (§7b). iOS uses `localhost`, Android `10.0.2.2`.
- **Guest browsing allowed; checkout requires sign-in** (D-8). `utils/authFlow.ts` redirects back.
- **Stock is per `color|size`.** Cart lines are keyed `productId|color|size` and quantity is
  clamped to stock. Pickup is per product (`pickupAvailable`); checkout blocks pickup if any
  line does not support it.
- **Checkout is pickup-only** (Q-2). Placing an order creates it on the local server
  (`TOJ-1005…`); nothing is charged. Orders can be cancelled while placed/confirmed.
- **Session survives a cold start** (tokens in Keychain/Keystore, ADR-0006); logout wipes them. The guest bag and wishlist are kept on the device too (ADR-0006 amendment). Orders, signed-in cart and
  wishlist live on the server. Settings → "Reset demo data" clears the bag and wishlist (on the server too when signed in).
- **Search, filters, sort and sale rails exist** although D-12 deferred them; they were built
  per the UI brief and are flagged for product review.

---

## 4. Do NOT assume

| Do not assume | Reality |
|---|---|
| The API is deployed | It is not. It runs locally only (`../toj-backend`); hosting is not approved. Images are remote Unsplash URLs |
| Authentication is real | PARTIAL. Server-side OTP + JWT, but the OTP is a fixed demo code and no SMS is sent |
| Checkout takes payment | It does not. Orders are created on the local server; payment is `PAY_AT_STORE` or `CARD_SIMULATED` |
| Persistence exists | Server-side only (Postgres). On the device only the session tokens and the guest bag and wishlist (Keychain/Keystore, ADR-0006) |
| Release signing is production-ready | PARTIAL. `release` uses the upload key when `TOJ_UPLOAD_*` gradle properties are set, else the debug keystore; the real key is not generated yet |
| VoiceOver / TalkBack tested | NOT TESTED. Labels, roles and 44pt targets exist in code and were inspected via the iOS accessibility tree only |
| A future architecture has been chosen | **Proposed, not approved.** Architecture is `PROPOSED` and gated on unwritten ADRs ([`docs/decisions/README.md`](docs/decisions/README.md)) |
| Planning documents describe working code | Everything under `docs/requirements/`, `docs/architecture/`, `docs/implementation/` is a plan |

---

## 5. Repository characteristics worth knowing

- The previous drawer/login-first navigation, dead screens, `authStore.js`, and the `.js`
  twins of `products`/`theme` were **deleted**; `.ts` is canonical. Recoverable via git.
- `nativewind`, drawer, gesture-handler, Reanimated and Worklets were removed 2026-11-08 (ADR-0032). The app address screens were removed too (pickup-only checkout).
- Business rules live once in `src/utils/` (`cart.ts`, `filter.ts`, `orderStatus.ts`, `catalogue.ts`).
- `jest.config.js` adds `transformIgnorePatterns` so React Navigation ESM modules load. The
  Reanimated import was removed from `App.tsx` because nothing uses Reanimated.
- `package-lock.json` and `ios/Podfile.lock` were out of sync with `package.json` (Reanimated 4 +
  Worklets) until commit `2ab68a2`. Do not regenerate them casually; change them only with a
  dependency change, in the same commit.

---

## 6. Terminology used across the documentation

| Term | Meaning |
|---|---|
| `IMPLEMENTED` | Works as written against the current data source. |
| `PARTIAL` | Some of the feature works; a stated part does not. |
| `MOCK` / `PROTOTYPE` | Runs, but against fabricated data or a fake implementation. |
| `BROKEN` / `KNOWN ISSUE` | Does not do what the code appears to intend. |
| `NOT IMPLEMENTED` | Does not exist in the repository. |
| `UNKNOWN` | Cannot be determined from the repository alone. |
| `NOT YET DECIDED` | A decision that is deliberately open. |

---

## 7. Commands

```bash
npm install          # install dependencies
npm start            # Metro bundler
npm run android      # build + run Android
npm run ios          # build + run iOS (requires pod install first)
npm run lint         # eslint .            → 0 errors, 0 warnings
npx tsc --noEmit     # type check          → 0 errors
npm test             # jest                → 7 suites, 18 tests pass
```

Full detail: [`docs/development/setup.md`](docs/development/setup.md)

---

## 7a. The rule about introducing anything new

> **Never introduce a library, architectural pattern, abstraction, or infrastructure
> component merely because it is popular, modern, convenient, or considered "best
> practice".**

Before proposing one, state: what problem it solves · why the existing stack cannot solve it
adequately · what complexity and maintenance cost it adds · whether a simpler solution
exists · whether it is required **at the current project phase**.

**Significant architectural changes require explicit human approval.** AI must not silently
make product or architectural decisions. Full standards:
[`docs/development/engineering-standards.md`](docs/development/engineering-standards.md).

The AI workflow is:

```text
INSPECT → EXPLAIN → PLAN → IMPLEMENT → TYPECHECK → LINT → TEST → FIX → DOCUMENT → REPORT CHANGES
```

Do not skip verification. Report what was verified and what was not.

---

## 7b. Backend (separate repository `toj-backend`)

The backend is its own repository since 2026-11-05 ([ADR-0030](docs/decisions/0030-separate-backend-repository.md)),
cloned as `../toj-backend`. Read its `AGENTS.md` before working on it. This repo keeps the
product docs and the single ADR register; new ADRs from either repo are numbered here.
The API contract is the OpenAPI document at `/api/docs`.

```bash
eval "$(fnm env)" && cd ../toj-backend && fnm use   # Node 24 from .nvmrc
npm run db:up                                   # Postgres 17 in Docker (127.0.0.1:5432)
npm run db:deploy                               # apply migrations
npm run start:dev                               # API at http://localhost:3000/api/v1
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

Swagger: `/api/docs` (non-production). Details: `toj-backend/docs/LOCAL_DEVELOPMENT.md`.

---

## 8. Before you change anything

1. The UI calls the local backend, which is approved and in progress (§1a). Payment and real SMS OTP are **not** approved; do not start
   them until their ADRs exist.
2. If you believe something must change, write it down — an issue, an ADR, a note on the
   relevant page — rather than changing it.
3. Documentation is updated in the same change as the code. See
   [`docs/documentation-strategy.md`](docs/documentation-strategy.md) §5.
