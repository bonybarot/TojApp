# Project Overview

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: Repository inspection (commit `66044c5`, branch `main`)

---

## Project Status

```text
Project Status:
Prototype / Early Development
```

Evidence for this classification: no backend of any kind, mock authentication that
ignores the password (`src/store/userStore.ts:21`), checkout that creates no order
(`src/screens/Cart/CheckoutScreen.tsx:33`), no persistence, 0 executing tests, and 3
commits of history in which the entire `src/` tree arrived in one commit (`c19596a`).

---

## Purpose

`README.md` describes the project in two lines:

```text
# TojApp
clothing app
```

That is the only written statement of intent in the repository. The TypeScript data
fixtures agree with it: `src/data/products.ts` contains 15 clothing items and
`src/data/categories.ts` contains 8 clothing categories.

**UNKNOWN:** the target audience, the business model, the intended market, and whether
iOS or Android is the priority platform. None of this is recorded anywhere.

---

## Current product concept

An e-commerce mobile app with a conventional shape:

- browse a product catalogue on a home grid
- browse by category
- open product details
- add to a cart, adjust quantities
- enter a shipping address and "place" an order
- review past orders
- a profile and a settings screen
- log in / sign up

All of this is present as UI. Almost none of it is connected to anything real.

---

## Current implementation maturity

| Area | Maturity |
|---|---|
| Navigation | IMPLEMENTED — 7 navigators, 12 distinct routes |
| UI screens | IMPLEMENTED — 12 reachable screens, all render |
| Cart logic | IMPLEMENTED — the most complete part of the codebase |
| Product catalogue | BROKEN at runtime — see [data-flow.md](data-flow.md) |
| Category browsing | BROKEN at runtime — see [data-flow.md](data-flow.md) |
| Checkout | PARTIAL — collects an address, discards it, creates no order |
| Orders | MOCK — 4 hardcoded orders, never reflects user activity |
| Authentication | MOCK — any non-empty credentials succeed |
| Profile / Settings | PLACEHOLDER — controls that do nothing |
| Backend / API | NOT IMPLEMENTED |
| Persistence | NOT IMPLEMENTED |
| Search | NOT IMPLEMENTED |
| Wishlist | NOT IMPLEMENTED — a menu row only |
| Tests | KNOWN ISSUE — 0 executed |

---

## Current platform

| | |
|---|---|
| Framework | React Native **0.82.1** (`package.json`, corroborated by `ios/Podfile.lock` → `React-Core (0.82.1)`) |
| React | **19.1.1** |
| New Architecture | **Enabled** — `newArchEnabled=true` in `android/gradle.properties`; `RCTNewArchEnabled=true` in `ios/TojApp/Info.plist` |
| Hermes | **Enabled** — `hermesEnabled=true`; `hermes-engine (0.82.1)` in `ios/Podfile.lock` |
| Fabric / TurboModules | Active, as a consequence of the New Architecture being enabled |
| Android | `applicationId "com.tojapp"`, minSdk 24, compileSdk 36, targetSdk 36 |
| iOS | Deployment target 15.1; bundle identifier still the RN template placeholder |
| Node | `>=20` declared in `package.json` `engines` |

Full detail: [technology-stack.md](technology-stack.md)

---

## Current architecture status

The layer chain that exists:

```text
index.js → App.tsx → NavigationContainer → RootNavigator
                                              ↓
                              AuthStack  or  DrawerNavigator
                                              ↓
                                           Screens
                                              ↓
                              Components  ·  Zustand stores
                                              ↓
                                    Hardcoded data modules
```

Two layers that a production app would have are absent: there is **no service/API
layer** and **no persistence layer**. Three screens skip the store layer entirely and
import fixture modules directly.

Full detail: [architecture.md](architecture.md)

---

## Major implemented areas

- **Navigation** — `src/navigation/`, 7 navigator files, one per feature area, each
  exporting its own `ParamList` type.
- **Cart** — `src/store/cartStore.ts` handles merge-on-re-add, quantity updates, and
  removal at `quantity <= 0`. Correct as written.
- **Auth gating** — `src/navigation/RootNavigator.tsx:15` mounts one of two trees based
  on `isLoggedIn`. The standard React Navigation pattern, correctly applied.
- **Screen UI** — every reachable screen renders a complete layout with empty/not-found
  branches where the author thought about them.
- **Design tokens** — `src/utils/theme.ts` defines a coherent palette and scale set
  (though the scales are unused, and the `.ts` file is not what runs — see below).

---

## Major missing areas

| Missing | Consequence |
|---|---|
| Backend / API | Nothing the user does leaves the device |
| Persistence | Cart and login session are lost on every cold start |
| Real authentication | No credential verification, no token, no session restore |
| Order creation | Checkout and Order History are not connected |
| Search | No search input exists anywhere |
| Loading / error states | Every read is synchronous, so no screen has one |
| Data transformation layer | Fixture record shapes are used directly as component props |
| Custom hooks | No `src/hooks/` directory; logic lives inline in screens |
| Working test suite | `npx jest` executes 0 tests |
| CI / git hooks | No `.github/`, no husky, no lint-staged |

---

## Major known risks

Listed in full in [known-issues.md](known-issues.md). The four highest:

1. **`.js` files shadow `.ts` files at bundle time.** The application that ships is not
   the application the type checker validates. See [data-flow.md](data-flow.md).
2. **The test suite cannot run.** No automated verification of any change is possible
   today. See [testing.md](testing.md).
3. **Type checking and linting are both red.** 1 TypeScript error, 6 ESLint errors.
   Neither can be used as a gate while failing.
4. **The Android release build is signed with the committed debug keystore**
   (`android/app/build.gradle:103`). Irreversible once an artifact is published.

---

## Related documents

- [architecture.md](architecture.md) — how the layers connect
- [data-flow.md](data-flow.md) — the resolution conflict, in detail
- [known-issues.md](known-issues.md) — the full issue register
- [../../../decisions/README.md](../../../decisions/README.md) — what has not been decided
