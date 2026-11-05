# Testing

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `__tests__/`, `jest.config.js`, `package.json`, verified by running the tools

---

## Headline

> **0 tests execute.** The test suite cannot load. This is a configuration failure, not a
> failing assertion.

```console
$ npx jest
Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.196 s
```

---

## What exists

One test file, the unmodified React Native template smoke test:

`__tests__/App.test.tsx` (13 lines):

```tsx
import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});
```

That is the entire automated test coverage of the project.

| Test type | Count | Status |
|---|---|---|
| Unit tests | 0 | NOT IMPLEMENTED |
| Component tests | 0 | NOT IMPLEMENTED |
| Integration tests | 0 | NOT IMPLEMENTED |
| Navigation tests | 0 | NOT IMPLEMENTED |
| Store tests | 0 | NOT IMPLEMENTED |
| Snapshot tests | 0 | NOT IMPLEMENTED |
| E2E tests | 0 | NOT IMPLEMENTED — no Detox, no Maestro |
| Smoke test | 1 written, **0 executed** | BROKEN |

---

## Why it fails

Full error (verified 2026-09-03):

```text
/…/node_modules/react-native-reanimated/lib/module/index.js:3
import './publicGlobals';
^^^^^^

SyntaxError: Cannot use import statement outside a module

  > 1 | import 'react-native-reanimated';
      | ^
    2 | import { NavigationContainer } from '@react-navigation/native';

  at Runtime.createScriptFromCode (node_modules/jest-runtime/build/index.js:1505:14)
  at Object.require (App.tsx:1:1)
  at Object.require (__tests__/App.test.tsx:7:1)
```

### The chain

1. `jest.config.js` is `module.exports = { preset: 'react-native' };` — nothing else.
2. The RN preset's `transformIgnorePatterns` skips Babel for most of `node_modules`, with an
   allow-list for packages known to ship untranspiled ESM.
3. **`react-native-reanimated` 4.x ships `lib/module/**` as native ESM.** It is not covered
   by the allow-list as configured here.
4. Jest hands `lib/module/index.js` to Node as CommonJS; Node sees `import` and throws.
5. `App.tsx:1` imports Reanimated for its side effects. `__tests__/App.test.tsx:7` imports
   `App`. The file therefore cannot be loaded, and Jest reports the suite as failed with
   zero tests.

### Provenance — commit `66044c5`

```text
66044c5  fix: app not working on the android issue fixed
         1 file changed, 2 insertions(+), 1 deletion(-)
         package.json
```

That commit — the most recent in the repository — upgraded
`react-native-reanimated` from `^3.7.0` to `~4.1.7` and added `react-native-worklets ~0.6.1`.
It fixed the Android runtime and broke Jest in the same change. No accompanying test
configuration change was made, and the breakage is not recorded anywhere in the repository
outside this documentation.

> **Not fixed here.** Per the standing instruction in [../../AGENTS.md](../../AGENTS.md),
> this pass documents; it changes nothing. Fixing it requires a `jest.config.js` change
> (a `transformIgnorePatterns` override and/or a Reanimated mock in `setupFiles`), which is
> out of scope for documentation.

---

## Missing test infrastructure

| Piece | Status |
|---|---|
| `transformIgnorePatterns` override | absent — the direct cause of the failure |
| `setupFiles` / `setupFilesAfterEach` | absent — no Reanimated mock, no gesture-handler mock |
| `@testing-library/react-native` | **not installed** |
| `jest.mock` helpers for navigation | absent |
| Coverage configuration / thresholds | absent |
| `test:watch`, `test:coverage` scripts | absent |
| CI running tests | absent — no CI at all |

---

## Type checking

`tsc` is the only static gate that currently produces a meaningful signal.

```console
$ npx tsc --noEmit
src/screens/Orders/OrderHistoryScreen.tsx(113,5): error TS1117: An object literal cannot
have multiple properties with the same name.
```

**Exactly one error.** `OrderHistoryScreen.tsx:111` declares `fontWeight: '400'` and
`:113` declares `fontWeight: '600'` in the same `statusText` style object; the second wins
silently at runtime.

There is **no `typecheck` npm script** — `tsc` is not part of any documented workflow.

> Note what `tsc` does **not** catch: it type-checks `src/data/products.ts` and
> `src/utils/theme.ts`, neither of which Metro bundles. Its clean bill of health for the
> data layer is therefore about files that never run. See [data-flow.md](data-flow.md).

---

## Linting

```console
$ npx eslint .
✖ 8 problems (6 errors, 2 warnings)
```

| File:line | Rule | Message |
|---|---|---|
| `src/components/CategoryCard.tsx:13:3` | `@typescript-eslint/no-unused-vars` | `'id' is defined but never used` |
| `src/components/ProductCard.tsx:14:3` | `@typescript-eslint/no-unused-vars` | `'id' is defined but never used` |
| `src/navigation/DrawerNavigator.tsx:31:9` | `@typescript-eslint/no-unused-vars` | `'navigation' is assigned a value but never used` |
| `src/navigation/DrawerNavigator.tsx:56:22` | `react/no-unstable-nested-components` (warning) | component defined during render |
| `src/screens/Cart/CheckoutScreen.tsx:23:9` | `@typescript-eslint/no-unused-vars` | `'user' is assigned a value but never used` |
| `src/screens/History/HistoryScreen.js:2:10` | `no-unused-vars` (warning) | `'View' is defined but never used` |
| `src/screens/Orders/OrderHistoryScreen.tsx:113:5` | `no-dupe-keys` | `Duplicate key 'fontWeight'` |
| `src/store/userStore.ts:21:26` | `@typescript-eslint/no-unused-vars` | `'password' is defined but never used` |

Two of these are the same defect seen from two angles: `no-dupe-keys` at
`OrderHistoryScreen.tsx:113` is TS1117.

`npm run lint` exits non-zero, so any CI gate added later fails on day one until these are
addressed.

---

## Formatting

Prettier is configured (`.prettierrc.js`) but **not enforced** — `@react-native/eslint-config`
extends `eslint-config-prettier`, which disables formatting rules rather than checking
them, and there is no `format` script or pre-commit hook. See
[configuration.md](configuration.md).

---

## Manual testing

There is no documented manual test plan, no QA checklist, and no recorded device matrix in
the repository. What is known:

- Android **did** run as of commit `66044c5` (that is what the commit message asserts).
- iOS build state is **UNKNOWN**.
- No build of either platform was run during this documentation pass.

---

## Current quality gate summary

| Gate | Command | Result | Blocking? |
|---|---|---|---|
| Types | `npx tsc --noEmit` | 1 error | no script, not wired anywhere |
| Lint | `npm run lint` | 6 errors, 2 warnings | not wired anywhere |
| Tests | `npm test` | 1 suite failed, 0 tests | not wired anywhere |
| Format | — | not checked | — |
| CI | — | does not exist | — |

**Nothing prevents a broken change from being committed.**

---

## Related documents

- [dependencies.md](dependencies.md)
- [configuration.md](configuration.md)
- [known-issues.md](known-issues.md)
- [../../../development/testing.md](../../../development/testing.md)
