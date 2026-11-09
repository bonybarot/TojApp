# Testing — How To (Current State)

> **Baseline note (2026-10-31).** Written against the pre-UI baseline (commit `66044c5`). Statements about failing tests, `.js`/`.ts` shadowing, the drawer or electronics data are historical. Today: `npx tsc --noEmit` 0 errors, `npm run lint` clean, `npm test` 10 suites / 34 tests pass. Current facts: [../current-state.md](../current-state.md).

Status: **Historical** (pre-UI baseline). Tests run today: see the note above
Last Verified: 2026-09-03
Source: `jest.config.js`, `__tests__/App.test.tsx`, `package.json`

---

## Read this first

This page is the *how-to*. The *what-is* — the full failure chain, the provenance, and the
quality-gate summary — is in
[../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md). Read that one to understand the
state; read this one to run things.

---

## Commands

| Command | Purpose | Current result |
|---|---|---|
| `npm test` | run Jest | **fails to load** — 0 tests execute |
| `npx jest --watch` | watch mode | same failure |
| `npx tsc --noEmit` | type check | 1 error |
| `npm run lint` | ESLint | 6 errors, 2 warnings |
| `npx prettier --check .` | formatting | not part of any script; would report drift |

There is no coverage command, no `test:ci`, and no `typecheck` script.

---

## What happens when you run `npm test`

```text
Test Suites: 1 failed, 1 total
Tests:       0 total

SyntaxError: Cannot use import statement outside a module
  at react-native-reanimated/lib/module/index.js:3
```

The chain:

1. `__tests__/App.test.tsx:7` imports `App`.
2. `App.tsx:1` is `import 'react-native-reanimated';`.
3. Reanimated 4.1.7 ships **untranspiled ESM** at `lib/module/index.js`.
4. `jest.config.js` is three lines — `preset: 'react-native'` and nothing else. The preset's
   `transformIgnorePatterns` does not whitelist `react-native-reanimated`, so the file is
   handed to Node as CommonJS.
5. Node sees `import` in a `.js` file and throws before any test body runs.

The single test in the repository is never reached.

---

## The only test that exists

`__tests__/App.test.tsx` (13 lines) — the unmodified React Native template smoke test:

```tsx
test('renders correctly', () => {
  ReactTestRenderer.create(<App />);   // :11
});
```

It asserts nothing beyond "rendering does not throw".

---

## Test coverage by type

| Type | Count |
|---|---|
| Unit tests | 0 |
| Component tests | 0 |
| Store tests | 0 |
| Navigation tests | 0 |
| Integration tests | 0 |
| E2E tests | 0 |
| Snapshot tests | 0 |

No store is tested, despite `cartStore.ts` containing the only real business logic in the
project (quantity merging, removal at zero).

---

## What is missing to make tests runnable

None of this exists today. Listed as a factual gap, **not as an instruction to add it** —
adding it is a change to the repository and is out of scope for the documentation phase.

| Missing | Why it matters |
|---|---|
| `transformIgnorePatterns` covering `react-native-reanimated` (and `react-native-worklets`) | the immediate blocker |
| `react-native-reanimated/mock` or an equivalent setup file | reanimated needs mocking in a test environment even once it transpiles |
| A `jest.setup.js` referenced by `setupFiles` / `setupFilesAfterEach` | nothing exists |
| `@testing-library/react-native` | not installed; `react-test-renderer` alone makes component assertions awkward |
| `@testing-library/jest-native` or built-in matchers | not installed |
| Navigation test helpers | rendering a screen requires a `NavigationContainer` wrapper |
| Store reset between tests | zustand stores are module singletons; state leaks across tests without an explicit reset |
| `testID` props | 0 exist in the codebase, so there is nothing to query by |
| Any CI runner | nothing runs tests automatically |

---

## Provenance

`git log` on the test configuration shows the failure was introduced by commit `66044c5`
("fix: app not working on the android issue fixed"), which upgraded the dependency set.
The template test predates it. See
[../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md) for the detail.

---

## Practical consequence for anyone changing code

**There is no automated safety net.** A change to `cartStore.ts`, to a navigator, or to the
data layer will not be caught by anything. The only feedback loops that currently function
are:

1. `npx tsc --noEmit` — catches type errors, but **never inspects any `.js` file**, which is
   exactly where the two shadowing twins live.
2. `npx eslint .` — catches the 8 known problems and would catch new ones.
3. Running the app by hand.

Verification of any change therefore has to be manual. Record what you actually ran; do not
claim a change is verified because it compiles.

---

## Related

- [../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md) — full current state
- [../archive/pre-ui-baseline/current-state/dependencies.md](../archive/pre-ui-baseline/current-state/dependencies.md) — the Reanimated/Jest incompatibility in dependency terms
- [debugging.md](debugging.md)
