# Implementation Phases

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — no phase approved for implementation
Last Verified: 2026-09-03
Source: [migration-plan.md](migration-plan.md) + the requirements and architecture set

> Sequencing rationale: [migration-plan.md](migration-plan.md).
> Each phase below uses the fields the planning brief requires: **Goal · Requirements ·
> Architecture · Files affected · Dependencies · Migration steps · Risks · Rollback ·
> Tests · Verification · Documentation · Completion criteria.**
> No phase may begin before its ADRs are approved.

---

## The verification pipeline

Applied at the end of **every** phase. A phase is not done when the code compiles.

```text
typecheck (tsc --noEmit)
   ↓
lint (eslint .)
   ↓
unit tests
   ↓
component tests
   ↓
integration tests            (from Phase 4)
   ↓
E2E smoke on the critical journeys   (from Phase 6)
   ↓
manual verification of the phase's own completion criteria
   ↓
platform verification: a real iOS device and a real Android device
   ↓
documentation updated in the same change
   ↓
changelog entry written
```

Current baseline, unchanged and re-verified on 2026-09-03: **tsc 1 error · eslint 6 errors,
2 warnings · jest 0 tests executed.** Phase 0 exists to turn all three green.

---

## Alignment with the approved development strategy — added 2026-09-03

The product owner has approved a development strategy (D-15): **UI + static data first**;
backend, payment gateway, seller platform and marketplace infrastructure are not built
prematurely. This section records how the phases below relate to it. **The phase plan has
not been rewritten** — doing so is an approval decision, not a documentation one.

| Strategy element | Phase plan position |
|---|---|
| Correct product model | Phase 1 — aligned |
| Correct navigation | Phase 2 — aligned |
| Static fixtures, local state | Phases 1–3 — aligned; Phases 0–3 need no backend answer |
| Loading / empty / error states | Phase 2 — aligned |
| Repository seam so the UI survives a data-source swap | Phase 2 — aligned, and now mandatory under C6 |
| Backend deferred | Phase 4 — aligned |
| Payment deferred | Phase 6 — aligned |
| Seller / marketplace deferred | Phase 8+ — aligned |
| **Design system, UI components, screen quality, "smooth UX"** | **No phase covers this. Gap.** |

### The gap — OPEN

The approved strategy makes the design system and UI quality a **first-phase concern**. The
phase plan treats styling only as ADR-0017 (keep `StyleSheet`, adopt the existing tokens,
remove `nativewind`) inside Phase 1, which is a cleanup, not a design system.

What is missing, and what it depends on:

| Missing | Depends on |
|---|---|
| A design-token set beyond colours (spacing, typography, radius already exist unused) | Nothing — the tokens are already in `theme.ts` and imported by zero files |
| A component inventory and the states each component must render | ADR-0029 |
| The loading / empty / error state patterns applied consistently | ADR-0029 |
| The final UI direction itself | **O-10 — OPEN.** Branding, app name and design system are undecided, and the owner has stated the final UI is decided separately before major UI implementation |

**Consequence:** the strategy's first phase is the phase with the largest unanswered
question in front of it. Phases 0–3 as written can proceed without O-10 because they change
structure rather than appearance — but the "modern, premium, consistent" outcome the vision
describes cannot be delivered until O-10 is answered.

**Status: OPEN.** Whether to insert a UI/design-system phase, extend Phase 2, or run the
design work in parallel is a planning decision that has not been made. It is not made here.

---

## Phase 0 — Stabilise and make the repository verifiable

**Goal.** A green `typecheck + lint + test` gate in CI, and no irreversible release risk.
**No application behaviour changes.**

| Field | Content |
|---|---|
| **Requirements** | None from the product set. This phase serves every later phase |
| **Architecture** | None. Tooling and build configuration only |
| **Files affected** | `jest.config.js`, a Jest setup file, `package.json` scripts, `tsconfig.json`, `.eslintrc.js`, `android/app/build.gradle`, `ios/TojApp/Info.plist`, a new CI workflow, `OrderHistoryScreen.tsx`, plus six one-line lint fixes |
| **Dependencies** | A CI provider and a secret store for the keystore. No npm dependencies beyond test tooling |
| **Migration steps** | 1. Fix the Jest transform so the suite loads (QUAL-01). 2. Add one real test, so "green" means something. 3. Fix the single TypeScript error and the six lint errors. 4. Add a `typecheck` script; enable `forceConsistentCasingInFileNames`. 5. Decide Prettier: enforce in CI or delete the config. 6. Generate a release keystore, store it as a CI secret, point `release` at it, amend `.gitignore` (BUILD-01). 7. Establish one version source of truth (BUILD-07). 8. Remove the empty location usage string (PLAT-01). 9. Resolve the two stray lockfile modifications (PLAT-08). 10. Wire CI on every push and pull request |
| **Risks** | The Jest fix may surface further failures — timebox it; one passing test beats a perfect suite. Keystore handling is easy to get wrong: the generated key must be backed up somewhere that surviving a laptop loss, because losing it means losing the ability to update a published app |
| **Rollback** | `git revert`. No data, no users, no external state |
| **Tests** | At least one meaningful unit test — the natural first is `cartStore`'s add/merge/remove-at-zero behaviour, which is the correct logic worth pinning before anything else moves |
| **Verification** | `tsc` 0 errors · `eslint` 0 problems · `jest` ≥1 test passing · CI red on a deliberately broken commit · a release build is not signed with `signingConfigs.debug` |
| **Documentation** | `current-state/testing.md`, `known-issues.md` (16 entries close), `development/setup.md`, `development/testing.md`, changelog. ADR-0018 testing strategy, ADR-0019 CI and release signing |
| **Completion criteria** | All three gates green in CI, and a release build signed with a keystore that is not in the repository |

---

## Phase 1 — Canonical data layer

**Goal.** One source per module specifier. The app runs the clothing catalogue it was always
supposed to run. **This phase changes visible behaviour, deliberately.**

| Field | Content |
|---|---|
| **Requirements** | Product direction DECIDED (clothing); [../architecture/domain-model.md](../architecture/domain-model.md) §2 |
| **Architecture** | One canonical `Product` type; the `.js` shadow layer retired |
| **Files affected** | Delete `src/data/products.js`, `src/utils/theme.js`, `src/store/authStore.js`, `src/data/history.js`, `src/components/HistoryItem.js`, `src/screens/History/` (2 files), `src/screens/auth/Login.tsx`. Edit `src/store/productStore.ts` (one `Product` type, imported not redeclared). Remove `nativewind`, `@react-native/new-app-screen`, `@babel/preset-env` |
| **Dependencies** | ADR-0001 (canonical product contract), ADR-0002 (single-language source tree), ADR-0017 (styling) |
| **Migration steps** | 1. Approve the ADRs. 2. Delete the eight dead/shadow files in one commit. 3. Collapse the duplicated `Product` declaration. 4. Run on a real iOS and a real Android device — **two of the deleted files are what previously executed**. 5. Remove the three unused dependencies |
| **Risks** | Behaviour changes visibly: 6 electronics items become 15 clothing items; blank titles get names; five of eight categories become visibly empty (DATA-07, now unmasked). Colours change as 51 `undefined` references start resolving. All expected; all must be screenshotted before and after so nobody reports them as regressions |
| **Rollback** | `git revert`. The deleted files remain in git history |
| **Tests** | A test asserting the catalogue is the clothing set with the expected item count; a test asserting every colour token consumed by a screen is defined |
| **Verification** | Gates green · on device: product titles render · category screens show products for the three populated categories · no `undefined` colour reaches a style |
| **Documentation** | `current-state/data-flow.md` **rewritten** — the headline defect is gone and the page must say so, with the history preserved rather than erased · `api/current-state.md` · `repository-structure.md` · `dependencies.md` · `known-issues.md` (10 close) · changelog |
| **Completion criteria** | No two files in `src/` share a basename with different extensions. `grep -r "products.js"` returns nothing. The app displays clothing on both platforms |

---

## Phase 2 — Structure, contracts, navigation

**Goal.** Introduce the repository seam, one owner per business rule, typed navigation, and
loading/error/empty states — all still over local fixtures. **No user-visible behaviour
change** except the deliberate navigation restructure.

| Field | Content |
|---|---|
| **Requirements** | PR-1 (anonymous browsing needs the root restructure), CO-3 groundwork, APP-05/06/09/10/13, NAV-01…08 |
| **Architecture** | [../architecture/target-architecture.md](../architecture/target-architecture.md) §3, §6, §7 |
| **Files affected** | Most of `src/` — largely moves and renames into `features/`, `shared/`, `services/`. New: repository interfaces + fixture implementations, `RootParamList`, a `Money` type and formatter, error boundary, three shared state components |
| **Dependencies** | ADR-0011 (money), ADR-0015 (navigation), ADR-0016 (folder structure), and O-6 (drawer vs tabs) answered |
| **Migration steps** | 1. Create the folder structure; move files with no logic changes; verify green. 2. Add repository interfaces with fixture implementations; route the three direct-import screens through them. 3. Convert money to integer minor units at the model boundary; adopt `useCartTotalPrice` as the one total rule. 4. One `getStatusColor`, one category filter. 5. Restructure the navigation root; attach every ParamList; add `RootParamList`; delete the `as never` casts and the `any`; single `Profile`; typed cross-navigator helper. 6. `GestureHandlerRootView`; remove the duplicate import; consume safe-area insets. 7. Error boundary + loading/error/empty states everywhere. 8. Adopt `spacing`, `typography`, `borderRadius`. 9. Hide the inert Profile and Settings controls per the product answer |
| **Risks** | Largest diff in the plan. Mitigate by splitting into the nine steps above, each independently green. The navigation restructure is the one part with real behaviour risk — it changes back-stack semantics |
| **Rollback** | `git revert` per step. No behaviour to undo except navigation |
| **Tests** | Repository contract tests that both the fixture and, later, the HTTP implementation must pass · money formatter unit tests, including rounding · display-status mapping unit test · component tests for loading/error/empty on each list |
| **Verification** | Gates green · no screen imports from `src/data/` or `services/` · zero `as never` and zero `any` in `src/navigation/` and the screens · every list renders all three states |
| **Documentation** | `current-state/architecture.md`, `navigation.md`, `state-management.md`, `repository-structure.md`, `coding-standards.md`, component docs, changelog |
| **Completion criteria** | Every data read goes through a repository. Every navigation call is type-checked. Every list has three states. Behaviour is otherwise unchanged from Phase 1 |

---

## Phase 3 — Persistence

**Goal.** Cart and preferences survive relaunch. The token slot exists, unused.

| Field | Content |
|---|---|
| **Requirements** | PR-5, APP-04, APP-11 |
| **Architecture** | [../architecture/target-architecture.md](../architecture/target-architecture.md) §8 |
| **Files affected** | `services/storage`, `services/secure-store`, `cartStore`, a preferences store, app bootstrap |
| **Dependencies** | ADR-0005 (storage engine), ADR-0006 (secure token storage). One native dependency, plus a pod install and an Android rebuild |
| **Migration steps** | 1. Add the storage service behind an interface. 2. Persist the cart with a **versioned** key namespace from the very first write. 3. Persist UI preferences; make the Settings toggles real or remove them. 4. Add the secure store wrapper with no consumer yet. 5. Clear the cart on logout (APP-11) |
| **Risks** | A schema change to persisted data later, with no version key, corrupts real users' carts — hence versioning from write one. Synchronous storage keeps the current no-hydration-gate shape; an async engine would require a bootstrap phase that does not exist |
| **Rollback** | Revert the code and clear the namespace. The version key makes a stale read detectable rather than silently wrong |
| **Tests** | Round-trip persistence unit tests · a migration test from version *n* to *n+1* · a cold-start test with corrupt stored data that must degrade to an empty cart, not a crash |
| **Verification** | Gates green · add to cart, force-quit, relaunch: the cart is intact · log out: the cart is empty · corrupt the stored value by hand: the app starts |
| **Documentation** | `state-management.md`, a persistence section in the architecture set, `known-issues.md`, changelog |
| **Completion criteria** | Cart and preferences survive a cold start on both platforms; nothing sensitive is in unencrypted storage |

---

## Phase 4 — Catalogue over the API

**Goal.** Products and categories come from the server. Read-only. The client behaves
identically to Phase 3 from the user's point of view.

**Blocked on O-1 (backend platform).**

| Field | Content |
|---|---|
| **Requirements** | PR-2, PR-3, PR-15 (schema), DATA-07 taxonomy |
| **Architecture** | Target §3–§5; domain model §5 |
| **Files affected** | `services/http`, DTO mappers, HTTP repository implementations, query client in the app shell. Screens change only where a query's loading and error states are surfaced |
| **Dependencies** | ADR-0007 backend, ADR-0008 API style, ADR-0013 `storeId`, ADR-0020 environment config, ADR-0004 server-state library. A deployed backend with a seeded catalogue |
| **Migration steps** | 1. Define the OpenAPI contract for catalogue reads. 2. Seed the backend with the clothing catalogue and one store row. 3. Implement HTTP repositories against the contract tests written in Phase 2. 4. Select the implementation by configuration so a rollback needs no rebuild. 5. Add retry, timeout and error mapping in one place. 6. Cut over |
| **Risks** | The contract and the fixtures will disagree in small ways — the contract tests from Phase 2 are what catch it. Network error handling is new to this codebase, which has zero `try`/`catch` today |
| **Rollback** | Configuration switch back to the fixture repository |
| **Tests** | Contract tests against a mocked HTTP layer · integration tests against a real test backend · a test that an API failure renders the error state rather than a blank screen |
| **Verification** | Gates green · catalogue renders from the server · airplane mode shows an error state with a retry, not a crash or a blank list · schema review confirms `storeId` is non-null on every product |
| **Documentation** | `docs/archive/pre-ui-baseline/api/` becomes a real contract, replacing "NOT IMPLEMENTED" · `data-flow.md` rewritten · `architecture.md` · changelog |
| **Completion criteria** | No product or category data is compiled into the bundle. Every failure mode has a visible, recoverable state |

---

## Phase 5 — Identity

**Goal.** Real accounts. Anonymous browsing. Authentication required at checkout.

| Field | Content |
|---|---|
| **Requirements** | PR-1, PR-11, authentication-requirements A-1…A-7 |
| **Architecture** | [../architecture/security-architecture.md](../architecture/security-architecture.md) §3–§4 |
| **Files affected** | `features/auth`, `userStore` rebuilt, `services/http` auth interceptor and refresh queue, secure store now consumed, navigation auth modal |
| **Dependencies** | ADR-0009, ADR-0010, ADR-0006. Backend auth endpoints and transactional email |
| **Migration steps** | 1. Register/login/logout/reset against the API. 2. Refresh token to the secure store; access token in memory. 3. Single-flight refresh with request replay. 4. Auth presented modally at the point a session is needed. 5. Collapse `isLoggedIn` into `user !== null`; delete `setUser`. 6. Full logout sequence: revoke, clear storage, clear cart, reset navigation |
| **Risks** | **One-way door** — real accounts exist afterwards. The refresh queue is the classic source of subtle bugs: parallel 401s, refresh-during-refresh, refresh failure during a checkout. It needs its own tests. Enumeration and rate limiting are easy to omit under time pressure and are exactly what gets found later |
| **Rollback** | Not clean once accounts exist. Rehearse the cut-over on a staging environment |
| **Tests** | Unit: refresh single-flight queue · Integration: each endpoint, plus expired-token transparent refresh, plus identical responses for known and unknown emails · E2E: register → browse → log out → log in |
| **Verification** | Gates green · a cold start with no session reaches the catalogue · no token appears in any non-secure store (grep check in CI) · customer B cannot read customer A's data |
| **Documentation** | `features/authentication.md` stops saying MOCK · `security-architecture.md` moves from PROPOSED to CURRENT for the parts delivered · `state-management.md` · changelog |
| **Completion criteria** | The mock login is deleted. Sessions survive relaunch. Ownership is enforced server-side |

---

## Phase 6 — Commerce

**Goal.** A real order, with real money and real stock.

| Field | Content |
|---|---|
| **Requirements** | PR-4, PR-6, PR-7, PR-8, PR-9, PR-10, PR-13, PR-14; all of checkout-and-order-requirements |
| **Architecture** | Domain model §3, §5; checkout-and-order §1–§4; security §6 |
| **Files affected** | `features/catalog` (variant selector), `features/cart` (variant-keyed lines, server cart), `features/checkout` (address, delivery, payment, confirmation), `features/orders` (real orders, two-status model) |
| **Dependencies** | ADR-0012 order state, ADR-0014 payment provider, ADR-0022 inventory. A payment provider account; deep links working, which requires BUILD-02 to be resolved first |
| **Migration steps** | 1. Variants in the API and a size selector on the product screen. 2. Cart lines keyed by variant; cart moves server-side. 3. Server re-pricing and stock check at checkout entry. 4. Address and delivery capture, with `country` validated. 5. Payment via the provider's sheet, with an idempotency key per attempt. 6. Order creation confirmed by webhook, not by the client. 7. Stock reservation and release. 8. Order history and detail from the API with the two-status display mapping |
| **Risks** | **One-way door — real money.** Duplicate orders from retries and webhook replays; oversell under concurrency; a payment succeeding while order creation fails. Every one of these needs an explicit test, not a hope |
| **Rollback** | Not revertible once money moves. Stay in provider test mode until the full E2E suite passes; then a limited rollout |
| **Tests** | Integration: re-pricing, tampered totals rejected, idempotency, concurrent checkout for the last unit · E2E: browse → size → cart → checkout → pay → order visible in history · a test for payment success with order-creation failure |
| **Verification** | Gates green · full E2E in the provider's test mode on both platforms · a manual reconciliation of one real low-value transaction before general release |
| **Documentation** | `features/checkout.md`, `cart.md`, `order-history.md`, `order-details.md`, the order lifecycle page, the API contract, changelog |
| **Completion criteria** | An order placed in the app exists in the backend with the correct total, reserved stock, and a payment record — and appears in that customer's history and nobody else's |

---

## Phase 7 — Release readiness

**Goal.** Shippable.

| Field | Content |
|---|---|
| **Requirements** | PR-16 plus the Fix Before Release debt |
| **Files affected** | iOS project settings, `AndroidManifest.xml`, `build.gradle`, app icons and launch screens, accessibility props across the screens, telemetry setup |
| **Dependencies** | Branding assets; the real bundle identifier; store accounts; ADR-0021 observability |
| **Migration steps** | 1. Real bundle identifiers, matching on both platforms (BUILD-02). 2. iOS signing and team (BUILD-03). 3. Icons and launch screens (BUILD-06). 4. Crash reporting with field scrubbing. 5. Accessibility pass: labels, roles, hit targets (APP-15). 6. Enable R8 and test it (BUILD-04). 7. Lock portrait or build landscape (PLAT-02). 8. Store listings, privacy declarations, account-deletion path. 9. Release pipeline in CI |
| **Risks** | R8 breaking reflection-dependent code at the last minute — enable it early in the phase, not at the end. Store review can reject on privacy declarations and on the account-deletion requirement |
| **Rollback** | Halt the staged rollout |
| **Tests** | Full regression on the release build, not the debug build · accessibility audit with VoiceOver and TalkBack on the critical journeys |
| **Verification** | Signed release builds install and run on real devices from both stores' test tracks · crash reporting receives a deliberately triggered test crash |
| **Documentation** | `current-state/android.md`, `ios.md`, `security.md`, `performance.md`, a release-process page, changelog |
| **Completion criteria** | A signed release build passes full regression and store validation on both platforms |

---

## Phase 8+ — Marketplace enablement

**Later. Not scheduled. Not scoped here.** Entry condition: the single-store app is live and
stable, and the seller surface decision (ADR-0024) is made. Direction only:
[../requirements/marketplace-roadmap.md](../requirements/marketplace-roadmap.md).

---

## Implementation readiness checklist

| Item | State |
|---|---|
| Current state documented and verified | **READY** |
| Issue register complete with evidence | **READY** |
| Product direction for v1 | **READY** — customer app, one clothing store, men's clothing, one city |
| Authoritative product-goal document | **READY** — [../requirements/product-vision.md](../requirements/product-vision.md) |
| Engineering standards C1–C15 | **READY** — approved 2026-09-03 |
| Long-term product vision | **READY** — multi-vendor marketplace |
| Technical debt dispositioned | **READY** |
| Migration sequencing | **READY** — pending review |
| Phase 0 scope | **READY** — needs ADR-0018 and ADR-0019 approved |
| Phase 1 scope | **OPEN** — needs ADR-0001, ADR-0002, ADR-0017 |
| Phase 2 scope | **OPEN** — needs ADR-0011, ADR-0015, ADR-0016 and the drawer/tabs answer (O-6) |
| Phase 3 scope | **OPEN** — needs ADR-0005, ADR-0006 |
| Backend platform | **BLOCKED** — O-1 unanswered. Blocks Phases 4–6 |
| API contract | **BLOCKED** on O-1 |
| Authentication credential type | **READY** — mobile + OTP (D-9) |
| OTP provider and policy, account recovery | **BLOCKED** — O-7 unanswered |
| Authentication architecture | **OPEN** — downstream of O-1 |
| Design system and final UI direction | **BLOCKED** — O-10 unanswered. This gates the phase the approved strategy puts first. See the alignment section above |
| Store pickup rules | **BLOCKED** — O-9 unanswered. The model can be built; the rules cannot be invented |
| Commerce policy (delivery pricing, thresholds, cancellation, returns, refunds) | **BLOCKED** — O-8 unanswered. Blocks finishing the checkout UI |
| Push notifications | **OPEN** — O-13; scope decided, provider and timing are not |
| Wishlist and reviews | **OPEN** — desired for MVP but conditional (D-14); reviews cannot precede order lines |
| Payment provider | **BLOCKED** — O-4 unanswered |
| Countries, currencies, tax, shipping | **BLOCKED** — O-5 unanswered. Blocks checkout detail |
| Taxonomy and merchandising | **BLOCKED** — O-11. DATA-07 needs a product answer |
| Catalogue search | **NOT YET NEEDED** — deferred by D-12 |
| Coupons and promotions | **NOT YET NEEDED** — deferred by D-12 |
| Which Profile rows are v1 | **READY** — D-13 fixes them: Personal Information, My Orders, Wishlist, Help/Support, Logout |
| Which Settings rows are v1 | **OPEN** — D-13 says functional only; which functional settings exist is undecided (APP-08) |
| Customer support implementation | **OPEN** — O-12; the Help/Support row has no destination |
| Branding, app name and identity | **BLOCKED** — O-10. Blocks Phase 7, and now also the UI phase |
| Store accounts and identifiers | **OPEN** — blocks Phase 7 |
| Team size, budget, timeline | **OPEN** — these are what decide O-1 |
| Seller platform | **NOT YET NEEDED** |
| Multi-store catalogue and payouts | **NOT YET NEEDED** |
| Offline support, i18n, dark mode | **NOT YET NEEDED** |

**Phase 0 can begin as soon as its two ADRs are approved. Nothing in it depends on any open
product question.** That remains true after the 2026-09-03 product decisions: Phase 0
changes signing, CI and the test runner, none of which the product direction touches.

---

## Related

- [migration-plan.md](migration-plan.md) · [technical-debt-plan.md](technical-debt-plan.md) · [testing-plan.md](testing-plan.md)
- [../decisions/README.md](../decisions/README.md)
