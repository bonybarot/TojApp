# Technical Debt Plan

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — disposition of all 65 catalogued issues
Last Verified: 2026-09-03
Source: [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md)

> **None of these has been fixed.** This page assigns each one a disposition and a phase so
> that no effort is spent fixing something the migration deletes, and nothing dangerous is
> deferred by accident. Phases are defined in
> [implementation-phases.md](implementation-phases.md).

## Disposition vocabulary

| Disposition | Meaning |
|---|---|
| **Fix Now** | Phase 0. Cheap, unblocking, or dangerous to leave |
| **Fix During Migration** | Resolved as a by-product of a phase that was happening anyway |
| **Fix Before Release** | Not urgent now, blocks shipping |
| **Defer** | Real, low value, no deadline |
| **Delete / Obsolete** | The code goes away; there is nothing to fix |
| **Needs Product Decision** | Cannot be scheduled until a question is answered |

## Summary

| Disposition | Count |
|---|---|
| Fix Now (Phase 0) | 16 |
| Fix During Migration (Phases 1–6) | 37 |
| Fix Before Release (Phase 7) | 5 |
| Defer | 3 |
| Needs Product Decision | 4 |
| **Total** | **65** |

Of the 37 migration items, **12 are Delete / Obsolete** — code that is removed rather than
repaired. Four further items carry a secondary "needs a product answer" flag noted in their
row.

---

## Fix Now — Phase 0

Phase 0 changes no application behaviour. It makes the repository verifiable and removes
the one irreversible risk.

| ID | Sev | Issue | Disposition | Why now |
|---|---|---|---|---|
| BUILD-01 | **P0** | Release signed with the committed debug keystore | Config fixed 2026-11-08 (`TOJ_UPLOAD_*` gradle properties, setup.md); generating the real upload key stays with the owner | Irreversible once published — the signing identity cannot be changed afterwards without a new package name. Nothing else in the plan competes with this for priority |
| QUAL-01 | P1 | 0 tests execute (Reanimated 4 ESM transform) | Fix Now | **The single highest-leverage fix in the plan.** Until tests run, every later phase is unverifiable and every "done" is an assertion |
| QUAL-02 | P2 | Duplicate `fontWeight` — the only TypeScript error | Fix Now | One line. Blocks a clean `tsc` gate |
| QUAL-03 | P2 | `npm run lint` fails, 6 errors 2 warnings | Fix Now | A red gate cannot be enforced, so it protects nothing |
| QUAL-04 | P2 | `password` accepted and never read | Fix Now (lint), Phase 5 (real fix) | Silence the lint error honestly; the behaviour is replaced with real auth later |
| QUAL-05 | P3 | Unused `id` prop on both cards | Fix Now | Trivial |
| QUAL-06 | P3 | Unused `navigation` in drawer content | Fix Now | Trivial |
| QUAL-07 | P3 | Unused `user` in checkout | Fix Now | Trivial |
| QUAL-08 | P2 | Drawer content component defined during render | Fix Now | A hoist. Rebuilds the drawer subtree on every render today |
| QUAL-09 | P3 | No `typecheck` script | Fix Now | The one static gate that currently works is wired to nothing |
| QUAL-10 | P3 | Prettier configured, never enforced | Fix Now | Decide once: either enforce it in CI or delete `.prettierrc.js`. A config nobody runs is worse than none |
| QUAL-11 | P3 | `forceConsistentCasingInFileNames: false` | Fix Now | Case-only path bugs pass on macOS and break on CI. Enable before CI exists, not after |
| BUILD-07 | P3 | Four disagreeing version identities | Fix Now | Establish one source of truth before a release process depends on it |
| BUILD-08 | P2 | No CI, no quality gate | Fix Now | This is what makes every other Phase 0 fix stick |
| PLAT-01 | P2 | Empty `NSLocationWhenInUseUsageDescription` for an unused capability | Fix Now | Deleting an unused key is a one-line change and removes an App Store review risk |
| PLAT-08 | P3 | Two lockfiles modified in the working tree, provenance unknown | Fix Now | Resolve deliberately — commit or revert. An unexplained lockfile diff will be blamed for the first weird build failure |

---

## Fix During Migration — Phases 1–6

### Phase 1 — canonical data layer

| ID | Sev | Issue | Disposition | Note |
|---|---|---|---|---|
| DATA-01 | P1 | `products.js` shadows `products.ts` | Delete / Obsolete | Root cause. Retire the `.js` layer; adopt the clothing catalogue. **Do not fix by renaming fields** |
| DATA-02 | P1 | Product titles render blank | Fix During Migration | Disappears with DATA-01 — a symptom, not an issue in its own right |
| DATA-03 | P1 | Every category list is empty | Fix During Migration | Partly disappears with DATA-01; the remainder is DATA-07 |
| DATA-04 | P1 | `theme.js` shadows `theme.ts` — 51 of 146 colour references are `undefined` | Delete / Obsolete | Same root cause, same fix |
| DATA-05 | P2 | All six status-badge colours are `undefined` | Fix During Migration | Colour disappears with DATA-04; the status *model* is Phase 6 |
| DATA-06 | P2 | Product `id` is `string` in types, `number` at runtime | Fix During Migration | Settled by ADR-0001 in favour of `string` |
| APP-14 | P3 | `Product` declared twice, independently | Fix During Migration | One canonical type as part of the same pass |
| DEAD-01 | P2 | Eight unreferenced or unreachable files | Delete / Obsolete | Includes both shadow files, `authStore.js`, the abandoned History feature (3 files), and `auth/Login.tsx` |
| DEAD-06 | P3 | `nativewind` installed, unconfigured, unused | Delete / Obsolete | ADR-0017 keeps `StyleSheet`; the dependency goes |
| DEAD-07 | P3 | `@react-native/new-app-screen`, `@babel/preset-env` unused | Delete / Obsolete | — |

> **Root-cause discipline (§44).** Phase 1 is not "rename `name` to `title`". It is
> "one language, one source per module specifier, one canonical product contract" — and the
> blank titles, the empty categories, the `undefined` colours and the id-type conflict all
> resolve as consequences. Fixing any of them individually would leave the mechanism intact.

### Phase 2 — structure, contracts, navigation

| ID | Sev | Issue | Disposition | Note |
|---|---|---|---|---|
| APP-05 | P2 | Orders and categories bypass the store layer | Fix During Migration | The repository seam is the reason this phase exists |
| APP-06 | P2 | `getStatusColor` duplicated byte-for-byte | Fix During Migration | One owner: `features/orders` |
| APP-09 | P2 | No loading, error or error-boundary handling | Fix During Migration | Prerequisite for Phase 4 — an API call needs somewhere to fail |
| APP-10 | P3 | Four lists have no empty state | Fix During Migration | Same pass |
| APP-13 | P3 | Six explicit `: any`, five of them list rows | Fix During Migration | These are what let the `title`/`name` mismatch render blank instead of failing |
| DATA-08 | P3 | `spacing`, `typography`, `borderRadius` have zero importers | Fix During Migration | Adopt the scales; stop hardcoding `borderRadius: 8` in twelve places |
| DEAD-02 | P2 | `filterByCategory` never called | Delete / Obsolete | Superseded by server-side filtering |
| DEAD-03 | P3 | `useCartTotalPrice` dead while two screens duplicate its `reduce` | Fix During Migration | **Adopt** it, do not delete — one money rule, one place (domain-model §4) |
| DEAD-04 | P3 | `navigationRef` wired but unused; two dead enums | Delete / Obsolete | — |
| NAV-01 | P2 | `Profile` registered in two navigators | Fix During Migration | Also flagged Needs Product Decision — see O-6 |
| NAV-02 | P2 | Two ParamLists declared but not attached | Fix During Migration | Cause of two of the three `as never` casts |
| NAV-03 | P2 | Three `as never` casts | Fix During Migration | Consequence of NAV-02 and NAV-06 |
| NAV-04 | P2 | Navigator nesting hardcoded inside a screen | Fix During Migration | Behind a typed helper |
| NAV-05 | P2 | Detail screens have no header title or back affordance | Fix During Migration | Fixed by the root-shape change |
| NAV-06 | P3 | No `RootParamList` / global type registration | Fix During Migration | Removes the `as never` family at the root |
| NAV-07 | P3 | Anonymous `RouteProp` declarations | Fix During Migration | Derive from the ParamList |
| NAV-08 | P3 | `NativeStackNavigationProp<any>` | Fix During Migration | — |
| PLAT-03 | P2 | No `GestureHandlerRootView` | Fix During Migration | Part of the app-shell rebuild |
| PLAT-04 | P3 | `react-native-gesture-handler` imported twice | Fix During Migration | Same pass |
| PLAT-05 | P3 | `SafeAreaProvider` mounted, no screen reads an inset | Fix During Migration | Matters once headers change |

### Phase 3 — persistence

| ID | Sev | Issue | Disposition |
|---|---|---|---|
| APP-04 | P1 | Nothing is persisted | Fix During Migration |
| APP-11 | P2 | Cart not cleared on logout | Fix During Migration — becomes user-visible the moment sessions persist |

### Phase 5 — identity

| ID | Sev | Issue | Disposition |
|---|---|---|---|
| APP-01 | P1 | Authentication is a mock | Fix During Migration |
| APP-02 | P1 | Sign-up creates nothing, discards the name | Fix During Migration |
| APP-12 | P3 | `isLoggedIn` duplicates `user` | Fix During Migration |
| DEAD-05 | P3 | `setUser` has no callers | Delete / Obsolete |

### Phase 6 — commerce

| ID | Sev | Issue | Disposition |
|---|---|---|---|
| APP-03 | P1 | Checkout creates no order | Fix During Migration — the reason Phase 6 exists |

---

## Fix Before Release — Phase 7

| ID | Sev | Issue | Note |
|---|---|---|---|
| BUILD-02 | P1 | iOS bundle identifier is the RN template placeholder and disagrees with Android | Also **Needs Product Decision** — the real identifier and domain. Blocks App Store registration, push, universal links and payment-return deep links |
| BUILD-03 | P1 | iOS signing entirely unconfigured | No device build without manual Xcode setup |
| BUILD-04 | P2 | ProGuard/R8 disabled, empty rules file | Enable and test; R8 breaking reflection is a classic late surprise, so do it before the release candidate, not during it |
| BUILD-06 | P3 | Default RN launcher icon; no iOS app-icon artwork at all | Also **Needs Product Decision** — branding |
| APP-15 | P3 | Zero accessibility props anywhere | Severity understates it: labels, roles and hit targets on interactive elements are the shipping floor, not polish |

---

## Defer

| ID | Sev | Issue | Why defer |
|---|---|---|---|
| BUILD-05 | P3 | All four ABIs in one artefact | Download size only. Revisit with app-bundle configuration when size is measured |
| PLAT-06 | P3 | `supportsRtl="true"` with no RTL-aware styling | Harmless until an RTL locale ships. Tied to the i18n decision |
| PLAT-07 | P3 | No i18n; currency hardcoded to `$` | Deferring the *implementation* is fine; the *intent* should still be decided early (target-architecture §10), because retrofitting touches every screen |

---

## Needs Product Decision

| ID | Sev | Issue | Question | Blocks |
|---|---|---|---|---|
| DATA-07 | P2 | 5 of 8 categories have no products; `Sale` is not a category | What is the real taxonomy, and how is merchandising expressed? | ADR-0023, Phase 4 |
| APP-07 | P2 | Six inert Profile menu rows | Which are v1 features? The rest should be hidden, not left as dead affordances | Phase 2 |
| APP-08 | P2 | Inert Settings switches, including a dark-mode toggle with no dark theme | Same question | Phase 2 |
| PLAT-02 | P2 | Landscape permitted with no landscape layout | Support landscape, or lock portrait? Locking is the one-line answer | Phase 7 |

> **The cheapest resolution for APP-07 and APP-08 is to hide the controls that do nothing.**
> An interface that looks more finished than it is costs more in support and misdirected bug
> reports than the empty space would cost in polish.

---

## What is deliberately not on this list

Issues invented during planning rather than observed. The register contains 65 entries and
this page disposes of exactly those 65. New findings go into
[../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md) first, with evidence,
and are then dispositioned here.

---

## Related

- [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md) — the evidence for every row
- [implementation-phases.md](implementation-phases.md) · [migration-plan.md](migration-plan.md)
