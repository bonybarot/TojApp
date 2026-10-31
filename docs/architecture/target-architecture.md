# Target Architecture

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — no architecture decision has been approved
Last Verified: 2026-09-03
Source: [../archive/pre-ui-baseline/current-state/architecture.md](../archive/pre-ui-baseline/current-state/architecture.md) + the requirements docs

> Nothing on this page exists. Everything on it needs an ADR before implementation.
> The current architecture is documented separately and is the authority on what is real:
> [../archive/pre-ui-baseline/current-state/architecture.md](../archive/pre-ui-baseline/current-state/architecture.md).

---

## 1. What the current architecture gets right

Preserve these. A rewrite would throw them away for nothing.

| Property | Evidence |
|---|---|
| Acyclic, one-way import graph — screens → components → utils, screens → store → data | [../archive/pre-ui-baseline/current-state/architecture.md](../archive/pre-ui-baseline/current-state/architecture.md) "Import direction" |
| Selector-based store subscriptions at nearly every consumer | `CartScreen.tsx:20-25`, `HomeScreen.tsx:14` |
| A correct cart store: immutable updates, merged duplicate lines, removal at zero, no side effects | `src/store/cartStore.ts` |
| Auth gate by tree swap rather than per-route guards | `RootNavigator.tsx:15` — the React Navigation-recommended pattern |
| TypeScript `strict: true` with, currently, one error | `tsconfig.json` |
| Order fixtures snapshot price and address rather than referencing them | `src/data/orders.ts` |

## 2. What the current architecture is missing

| Missing layer | Consequence today |
|---|---|
| A single source per module specifier | Metro and TypeScript load different files (DATA-01/DATA-04) — the defining defect |
| A service / repository seam | Three screens import fixtures directly (APP-05); a real orders API means editing screens, not one module |
| A transformation boundary | Fixture shapes are used directly as component props; whatever an API returns must match fixture field names exactly |
| Persistence | Cart and session die on cold start (APP-04) |
| Loading / error / empty states | 0 `try`/`catch`, no error boundary, no `ListEmptyComponent` (APP-09/APP-10) |
| One home for a business rule | Cart total implemented 3×, `getStatusColor` 2×, category filter 2× — each with a canonical version nobody calls |
| Executable tests | 0 tests run (QUAL-01) |

---

## 3. Target layer chain

```text
Native entry            index.js
   ↓
App shell               providers: error boundary, query client, theme, safe area,
                        navigation container, gesture handler root
   ↓
Navigation              root stack: [ App tabs ] + [ Auth modal ] + [ Checkout modal ]
   ↓
Feature screens         src/features/<feature>/screens
   ↓
Feature hooks           useProducts(), usePlaceOrder() — the only thing screens call
   ↓
Repositories            ProductRepository, OrderRepository, CartRepository  ← the seam
   ↓ ┌──────────────────────────────┬──────────────────────────────┐
     │ HTTP client + DTO mappers    │ Local fixtures (pre-backend) │
     └──────────────────────────────┴──────────────────────────────┘
   ↓
Storage                 secure store (tokens) · fast KV (cart, prefs, cache)
   ↓
Backend                 REST API
```

**The repository interface is the whole point of the design.** It is what lets Phase 4
replace fixtures with a real API by changing one implementation, instead of editing
`OrderHistoryScreen.tsx:11`, `OrderDetailsScreen.tsx:4` and `CategoriesScreen.tsx:6` — the
three screens that today import data directly and therefore have no seam at all.

### Folder structure — PROPOSED

```text
src/
├── app/               providers, bootstrap, error boundary
├── navigation/        navigators, param lists, linking config
├── features/
│   ├── catalog/       screens, components, hooks, repository, model
│   ├── cart/
│   ├── checkout/
│   ├── orders/
│   ├── account/
│   └── auth/
├── shared/
│   ├── ui/            genuinely reusable presentational components
│   ├── theme/         tokens: colours, spacing, typography, radii
│   ├── lib/           money, formatting, validation
│   └── types/
└── services/          http client, storage, secure store, telemetry
```

**Dependency rules.**

| Rule | Reason |
|---|---|
| A feature never imports another feature's internals | Otherwise `getStatusColor` gets duplicated again — it was duplicated precisely because no module owned "orders" |
| Cross-feature needs are promoted to `shared/` or exposed through a feature's public entry | Keeps the import graph acyclic, which it already is |
| `shared/` and `services/` never import `features/` | Direction stays one-way |
| Only repositories talk to `services/http` | One place to add auth headers, retries and error mapping |
| Screens never import `services/` or `data/` directly | The current APP-05 defect, structurally prevented |

**Is feature-first over-engineering for 38 files?** It would be, if the structure were the
goal. It is not: the three duplicated business rules and the three seam-less screens exist
*because* there is no module that owns a domain. The migration is a move-and-rename pass
(Phase 2) with no behaviour change, and it is far cheaper before the backend lands than
after.

---

## 4. Backend platform — OPEN (O-1), the largest single decision

| Option | Fits when | Cost |
|---|---|---|
| **A. Headless commerce engine** (e.g. Medusa, Saleor) — self-hosted, PostgreSQL | The team is small and time-to-first-sale matters | Cart, order lifecycle, inventory reservation, refunds, tax and payment-provider abstraction arrive built and battle-tested — that is the expensive, boring, easy-to-get-wrong part. Cost: framework lock-in, upgrade treadmill, and marketplace rules that fight the engine's assumptions |
| **B. BaaS** (e.g. Supabase, Firebase) | Speed matters more than commerce semantics | Auth, database and storage in a day. But *no commerce domain at all*: order state machines, reservations and refunds are all yours, written in edge functions. Multi-vendor authorisation on top of row-level security gets hard fast |
| **C. Custom service** (Node/Nest + PostgreSQL) | Marketplace rules are known now and are unusual | Total control, no ceiling. Also: you write the order state machine, the reservation logic, the payment reconciliation and the admin surface — historically the most under-estimated work in any commerce project |

**Conditional recommendation.**

- Marketplace rules still being discovered, small team, launch date matters → **A**.
- Commission, payout and multi-store rules already specified and non-standard → **C**.
- **B is not recommended for this product**: the domain it omits is exactly the domain
  TojApp is.

**What decides it, and is currently UNKNOWN:** team size and backend experience, budget,
target launch date, whether payouts/commission are needed at Stage 5 or Stage 6, and
hosting/compliance constraints. These are business facts, not technical ones — the decision
should not be taken until they are answered.

**Marketplace impact.** A: Compatible (multi-vendor is an extension, sometimes an awkward
one). B: Risky. C: Safe but slowest.

**Status: OPEN — ADR-0007. Blocks Phases 4–6. Does not block Phases 0–3.**

> Phases 0–3 are deliberately designed to be independent of this decision. Roughly half the
> migration can proceed while it is still open.

---

## 5. API — PROPOSED

**REST over HTTPS, JSON, described by an OpenAPI document that is the contract of record.**

**Reason.** The client is a single mobile app with ~12 screens and predictable queries;
GraphQL's over-fetching benefit is small here while its cost — schema, codegen, caching
semantics, N+1 risk on the server — is not. Every candidate backend in §4 ships REST.
OpenAPI gives typed client generation, which removes the hand-written DTO drift that the
current codebase already suffers from (`Product` declared twice, independently).

**Alternatives.** GraphQL — reconsider if a web seller platform with very different query
shapes is built (marketplace-roadmap §5). tRPC — rejected: it assumes a TypeScript backend
and couples client and server deployment.

**Rules.** Versioned base path; cursor pagination on every collection; a single error
envelope; idempotency keys on order creation (CO-8); no endpoint returns another customer's
data on any code path (A-7). Endpoint-level documentation is written when endpoints exist,
per §30 of the planning brief — **no endpoints are invented here**.

**Marketplace impact: Compatible.** **Status: PROPOSED — ADR-0008.**

---

## 6. Navigation — PROPOSED

### Current problems

`Profile` registered twice (NAV-01) · two ParamLists declared but not attached (NAV-02) ·
three `as never` casts (NAV-03) · the navigator tree hardcoded inside `CategoriesScreen`
(NAV-04) · detail screens with no header or back affordance (NAV-05) · no `RootParamList`
(NAV-06) · anonymous `RouteProp`s (NAV-07) · one `any` navigator (NAV-08) ·
`navigationRef` wired and never used (DEAD-04) · no deep linking · no `GestureHandlerRootView`
(PLAT-03).

### Target shape

```text
NavigationContainer  (linking config, GestureHandlerRootView above it)
└── RootStack
    ├── App            ← always mounted; browsing needs no session (auth A-1)
    │   └── Tabs: Home · Categories · Cart · Account
    ├── Auth           ← presented modally when a session is required
    └── Checkout       ← presented modally; a linear flow, not a tab
```

**Changes and reasons.**

| Change | Reason |
|---|---|
| Auth stops being a root branch and becomes a presented stack | Anonymous browsing (PR-1) is impossible while `RootNavigator.tsx:15` swaps the whole tree on `isLoggedIn` |
| `Profile` registered exactly once | Removes NAV-01's two histories and the ambiguous `navigate('Profile')` |
| Checkout as its own modal stack | It is a linear multi-step flow; leaving it inside `CartStack` is why it has no header and no back affordance |
| Global `RootParamList` via `declare global { namespace ReactNavigation }` | Makes a bare `useNavigation()` typed everywhere; removes all three `as never` casts and the `any` at `ProductListScreen.tsx:16` |
| ParamLists attached to every `createXNavigator<...>()` | NAV-02 exists purely because two calls omit the type argument |
| Route props derived from the ParamList, never declared anonymously | NAV-07: three parallel definitions that can drift |
| Cross-navigator jumps behind a typed helper | NAV-04: `CategoriesScreen.tsx:18-24` hardcodes three levels of nesting and casts it away |
| `linking` config from the start | Payment redirects (3DS) need a return URL — this is a functional requirement, not polish |
| `GestureHandlerRootView` at the root; remove the duplicate import at `App.tsx:7` | PLAT-03/PLAT-04 |
| Delete `navigationRef` and the two dead enums, or use them | DEAD-04 — pick one; do not leave a wired-up ref nobody calls |

### Drawer or tabs? — OPEN (O-6)

The drawer and the tab bar overlap: both reach Home and Profile, which is why Profile is
registered twice. **Recommendation: tabs only for v1.** Fewer navigators, one canonical
route per destination, one less gesture surface, and it removes the
`react-native-drawer`/`GestureHandlerRootView` risk entirely. This is partly a UX call and
needs product sign-off. **Status: RECOMMENDATION — ADR-0015.**

**Marketplace impact: Safe** either way.

---

## 7. State management — PROPOSED

### Keep Zustand. Add a server-state library. They solve different problems.

**Objective comparison, as required.**

| Criterion | Zustand only (today) | Zustand + TanStack Query | Redux Toolkit + RTK Query |
|---|---|---|---|
| Client state (cart pre-backend, UI prefs) | Good — already correct | Unchanged | More ceremony for the same result |
| Server cache, staleness, refetch | Hand-rolled | Built in | Built in |
| Loading / error states | Must be written per store (APP-09: none exist) | Free, per query | Free |
| Request dedupe, retry, background refresh | Hand-rolled | Built in | Built in |
| Migration cost from today | Zero | Low — 3 stores stay as they are, new data goes through queries | High — rewrite all three stores |
| Bundle and concept count | Smallest | +1 library, +1 concept | +2 concepts, +boilerplate |
| Testability | Good | Good | Good |

**Recommendation: keep the three Zustand stores; add TanStack Query for anything that comes
from the server.**

**Reason.** Replacing Zustand is not justified: `cartStore` is the best code in the
repository and `userStore`'s problems are that it is a mock, not that Zustand is wrong.
What is actually missing is a cache with loading, error, staleness and retry semantics —
and hand-rolling that inside Zustand is how every project ends up with a worse version of
TanStack Query. Adding it is additive; nothing existing is rewritten.

**Trade-offs.** Two state systems means a rule for which is which. The rule:
**server-owned data goes in queries; device-owned data goes in Zustand.**

### Ownership after the migration

| State | Owner | Note |
|---|---|---|
| Catalogue, categories, orders | TanStack Query | Today: a store for products, direct imports for the other two (APP-05) |
| Cart, pre-backend | `useCartStore`, persisted | Preserve the existing semantics exactly |
| Cart, post-backend | Server-owned, mirrored in a query | Needed for price and stock validation (CO-1) and multi-device |
| Session flags | `useUserStore`, rebuilt on real auth | Collapse `isLoggedIn` into `user !== null` (APP-12) |
| Tokens | Secure store, **not** a Zustand store | Never in a state container that might be logged or persisted |
| UI preferences | Zustand, persisted | `SettingsScreen`'s toggles become real |
| Ephemeral form state | `useState` | Already correct today |

**Also fixed by this pass:** the allocating selector at `ProductListScreen.tsx:18-23`, which
returns a new array on every store notification and therefore re-renders on every change;
`filterByCategory` and `useCartTotalPrice`, which are correct implementations nobody calls.

**Marketplace impact: Safe.** **Status: PROPOSED — ADR-0003, ADR-0004.**

---

## 8. Persistence — PROPOSED

| Concern | Recommendation | Reason |
|---|---|---|
| Refresh token | iOS Keychain / Android Keystore (`react-native-keychain`) | Hardware-backed, excluded from backups. The only correct home for a credential |
| Access token | In memory only | Not written anywhere; short-lived and re-obtainable |
| Cart, UI prefs, small caches | MMKV | Synchronous reads |
| Server cache | TanStack Query in memory; persist only if a measured need appears | Do not build offline support nobody asked for |
| Navigation state | Not persisted | Restoring into a checkout step mid-payment is worse than starting at Home |

**Why MMKV over AsyncStorage.** MMKV reads synchronously. `App.tsx` has no asynchronous
bootstrap phase and `RootNavigator.tsx:15` decides the tree on first render — with an async
store, every persisted value forces a hydration gate and a splash state that does not exist
today, plus a visible flash of the wrong tree. MMKV keeps the existing synchronous shape.
It is also a TurboModule, which suits `newArchEnabled=true`.

**Trade-offs.** A native dependency (irrelevant here — this is bare React Native, not Expo
Go) and a smaller community than AsyncStorage. AsyncStorage remains a perfectly defensible
fallback if a hydration gate is being added anyway.

**Never persisted:** raw card data (never touched at all — §6 of the security doc), and
anything the server owns authoritatively.

**Marketplace impact: Safe.** **Status: PROPOSED — ADR-0005, ADR-0006.**

---

## 9. Styling — PROPOSED

**Keep `StyleSheet.create` with the `theme.ts` tokens. Adopt `spacing`, `typography` and
`borderRadius`, which currently have zero importers. Remove `nativewind`.**

**Reason.** 18 files already use `StyleSheet`; 20 import `colors`. The problem is not the
styling API — it is that half the tokens resolve to `undefined` at runtime (DATA-04) and
the three non-colour scales are unused while screens hardcode `borderRadius: 8` in twelve
places. Switching to NativeWind would add a Babel and Metro toolchain dependency, rewrite
every screen, and leave that same problem in a different syntax. `nativewind` is installed
with no config, absent from `babel.config.js` and `metro.config.js`, and used zero times
(DEAD-06) — it is a dead dependency, not a plan.

**Trade-offs.** `StyleSheet` has no variant or dark-mode ergonomics; a dark theme later
means a token-swapping provider. Acceptable, and cheaper than the alternative.

**Marketplace impact: Safe.** **Status: PROPOSED — ADR-0017.**

---

## 10. Cross-cutting concerns

| Concern | Target | Status |
|---|---|---|
| Error boundary | One at the app root, one per tab stack | PROPOSED — none exists |
| Loading / error / empty states | Every list and every query; a shared set of three components | PROPOSED — APP-09/APP-10 |
| Crash reporting | One vendor, wired before launch | PROPOSED — Must-Have |
| Logging | A thin logger, redacting by default. `src/` currently has zero `console.*` calls | PROPOSED |
| Analytics | Later; the event schema is a product decision, not a technical one | OPEN |
| Environment config | Build-variant configuration for the API base URL | PROPOSED — ADR-0020; none exists today |
| Feature flags | Later | OPEN |
| i18n | Decide the *intent* in v1 even if unimplemented — retrofitting touches every screen (PLAT-07) | OPEN |
| Dark mode | Could-Have. Cheap once tokens are adopted | OPEN |
| Accessibility | Labels and roles on every touchable, minimum hit targets. Currently zero props exist (APP-15) | PROPOSED — Must-Have floor |

---

## 11. Evaluation against the quality standard (§38)

| Criterion | Assessment |
|---|---|
| **Correctness** | Addresses every P0/P1 in the register. The repository seam is what makes server-side price and stock validation possible at all |
| **Maintainability** | One source per specifier, one owner per business rule, one direction of dependency. The three duplicated rules become one each |
| **Scalability** | Product/Variant/Inventory and `storeId` scale to a marketplace without a data migration. Nothing here assumes one store |
| **Security** | Tokens in hardware-backed storage; ownership enforced server-side; the app never touches card data |
| **Testability** | Repository interfaces are the natural mock boundary — the thing the current architecture has nowhere to put |
| **Operational complexity** | One mobile app, one backend, one database, one payment provider. No microservices, no event bus, no offline sync |
| **Migration cost** | Nine incremental phases, each independently verifiable. No rewrite. Phases 0–3 do not depend on the backend decision |
| **Marketplace compatibility** | Classified per decision in [../requirements/marketplace-roadmap.md](../requirements/marketplace-roadmap.md) §6 |
| **Developer usability** | Feature folders match how work is actually assigned; the dependency rules are four lines long |
| **Documentation quality** | Every boundary above has a stated reason and a named ADR |

**Where this design is deliberately un-ambitious:** no offline-first sync, no monorepo, no
GraphQL, no micro-frontends, no design-system package, no BFF layer, no event sourcing.
None of it is warranted by a single-store clothing app, and each would be a decision to
revisit with evidence rather than to take now.

---

## Related

- [domain-model.md](domain-model.md) · [security-architecture.md](security-architecture.md)
- [../implementation/migration-plan.md](../implementation/migration-plan.md)
- [../archive/pre-ui-baseline/current-state/architecture.md](../archive/pre-ui-baseline/current-state/architecture.md) — what actually exists
