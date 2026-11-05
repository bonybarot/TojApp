# Dependencies

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `package.json`, `node_modules/*/package.json` (resolved versions read at verification time), `babel.config.js`, `metro.config.js`

Version columns: **Declared** is the range in `package.json`; **Installed** is what
`node_modules` actually contains right now.

---

## Runtime dependencies (14)

| Package | Declared | Installed | Purpose | Used at | Status |
|---|---|---|---|---|---|
| `react` | `19.1.1` | 19.1.1 | UI runtime | everywhere | Active — pinned exactly |
| `react-native` | `0.82.1` | 0.82.1 | Platform | everywhere | Active — pinned exactly |
| `@react-navigation/native` | `^7.1.19` | 7.1.20 | Navigation core, `NavigationContainer`, `useNavigation`, `useRoute` | `App.tsx:2` + all navigators + 9 screens | Active |
| `@react-navigation/native-stack` | `^7.6.2` | 7.6.3 | Native stack navigators | `AuthStack`, `HomeStack`, `CartStack`, `OrdersStack` | Active |
| `@react-navigation/bottom-tabs` | `^7.8.4` | 7.8.5 | Tab bar | `MainTabs.tsx:14` | Active |
| `@react-navigation/drawer` | `^7.1.3` | 7.7.3 | Drawer | `DrawerNavigator.tsx:27` | Active |
| `react-native-screens` | `^4.4.0` | 4.18.0 | Native screen primitives | **No direct import in `src/`** | Active — transitive peer requirement of React Navigation |
| `react-native-safe-area-context` | `^5.5.2` | 5.6.2 | Safe-area insets | `App.tsx:4` (`SafeAreaProvider`), `src/screens/History/HistoryScreen.js:3` (dead screen) | Active — but see note below |
| `react-native-gesture-handler` | `^2.20.2` | 2.29.1 | Drawer / swipe gestures | side-effect import at `index.js:5` **and** `App.tsx:7` | Active — see Known issues |
| `react-native-reanimated` | `~4.1.7` | 4.1.7 | Animation engine required by drawer | side-effect import at `App.tsx:1`; plugin in `babel.config.js:3` | Active — see Known issues |
| `react-native-worklets` | `~0.6.1` | 0.6.1 | Worklet runtime required by Reanimated 4 | no direct import | Active — peer of Reanimated 4 |
| `zustand` | `^4.5.2` | 4.5.7 | State management | `src/store/*` | Active |
| `nativewind` | `^4.2.1` | 4.2.1 | Tailwind-style styling | **nowhere** | **UNUSED** |
| `@react-native/new-app-screen` | `0.82.1` | — | RN template welcome screen | **nowhere** | **UNUSED** — template leftover |

### Note on `react-native-safe-area-context`

`SafeAreaProvider` wraps the app (`App.tsx:13`), but **no screen consumes an inset**. The
only `SafeAreaView` in the codebase is in `src/screens/History/HistoryScreen.js:10`, which
is registered in no navigator. Screens rely on navigator headers and the tab bar for
spacing instead. This is a design gap, not a crash: content can sit under the notch or the
home indicator on screens with `headerShown: false`.

### Note on `nativewind`

Installed, never wired up:

- no `tailwind.config.js` at the repo root
- absent from `babel.config.js` (`presets: ['module:@react-native/babel-preset']` only)
- absent from `metro.config.js` (no `withNativeWind` wrapper)
- **0** occurrences of the `className` prop across `src/`

All styling is `StyleSheet.create`. Whether nativewind was intended for later adoption or
installed by mistake is **UNKNOWN**.

---

## Development dependencies (18)

| Package | Declared | Installed | Purpose | Status |
|---|---|---|---|---|
| `typescript` | `^5.8.3` | 5.9.3 | Type checking | Active — 1 error, see [testing.md](testing.md) |
| `@types/react` | `^19.1.1` | — | React types | Active |
| `@types/jest` | `^29.5.13` | — | Jest globals; listed in `tsconfig` `types` | Active |
| `@types/react-test-renderer` | `^19.1.0` | — | Test renderer types | Active |
| `jest` | `^29.6.3` | 29.7.0 | Test runner | Active — currently cannot run, see below |
| `react-test-renderer` | `19.1.1` | 19.1.1 | Renders `<App />` in the one test | Active |
| `eslint` | `^8.19.0` | 8.57.1 | Linting | Active — 8 problems |
| `@react-native/eslint-config` | `0.82.1` | — | The only ESLint config (`.eslintrc.js`) | Active |
| `prettier` | `2.8.8` | 2.8.8 | Formatting | Configured (`.prettierrc.js`), **no `format` script** |
| `@babel/core` | `^7.25.2` | — | Babel | Active |
| `@babel/runtime` | `^7.25.0` | — | Babel helpers | Active |
| `@babel/preset-env` | `^7.25.3` | 7.28.5 | Generic JS preset | **UNUSED** — `babel.config.js` references only `module:@react-native/babel-preset` |
| `@react-native/babel-preset` | `0.82.1` | — | The RN Babel preset | Active |
| `@react-native/metro-config` | `0.82.1` | — | Metro defaults | Active |
| `@react-native/typescript-config` | `0.82.1` | — | Base `tsconfig` | Active |
| `@react-native-community/cli` | `20.0.0` | — | `react-native` CLI | Active |
| `@react-native-community/cli-platform-android` | `20.0.0` | — | `run-android` | Active |
| `@react-native-community/cli-platform-ios` | `20.0.0` | — | `run-ios` | Active |

---

## Versioning policy in effect

| Style | Packages | Effect |
|---|---|---|
| Exact pin | `react`, `react-native`, all `@react-native/*`, `@react-native-community/cli*`, `react-test-renderer`, `prettier` | Reproducible |
| Tilde `~` (patch only) | `react-native-reanimated`, `react-native-worklets` | Deliberate — these two are tightly version-coupled |
| Caret `^` (minor) | everything else | `@react-navigation/drawer` has already drifted `7.1.3` → `7.7.3` |

`package-lock.json` is committed, so installs are reproducible via `npm ci` regardless of
the ranges. Note that `package-lock.json` currently shows as modified in
`git status` — this predates the documentation work.

---

## The Reanimated / Jest incompatibility

**This is why the test suite reports 0 tests.**

`npx jest` output (verified 2026-09-03):

```text
/Users/…/node_modules/react-native-reanimated/lib/module/index.js:3
import './publicGlobals';
^^^^^^

SyntaxError: Cannot use import statement outside a module

  > 1 | import 'react-native-reanimated';
      | ^
    2 | import { NavigationContainer } from '@react-navigation/native';

  at Object.require (App.tsx:1:1)
  at Object.require (__tests__/App.test.tsx:7:1)

Test Suites: 1 failed, 1 total
Tests:       0 total
```

### Mechanism

1. `jest.config.js` is one line: `module.exports = { preset: 'react-native' };`
2. That preset ships a `transformIgnorePatterns` that excludes most of `node_modules` from
   Babel, with an allow-list of React Native packages that are known to ship untranspiled
   ESM.
3. `react-native-reanimated` **4.x** ships `lib/module/**` as native ESM (`import`
   statements, no CommonJS build at that path).
4. Reanimated 4 is not covered by the preset's allow-list in this project's configuration,
   so Jest hands the file to Node as CommonJS and Node rejects the `import` keyword.
5. `App.tsx:1` imports Reanimated for its side effects, and `__tests__/App.test.tsx:7`
   imports `App`. The single test file therefore cannot even be loaded.

### Provenance

Commit `66044c5` — *"fix: app not working on the android issue fixed"* — changed **only
`package.json`** (1 file, 2 insertions, 1 deletion): `react-native-reanimated` moved from
`^3.7.0` to `~4.1.7` and `react-native-worklets ~0.6.1` was added. That upgrade fixed the
Android runtime and, as a side effect, broke Jest. No test-configuration change accompanied
it.

> **KNOWN ISSUE — do not treat this as a broken test.** The test itself is the unmodified
> React Native template test. The blocker is Jest configuration, not application code.
> Documented here only; **not fixed** in this phase.

---

## Peer-dependency chain worth knowing

```text
@react-navigation/drawer
  ├── react-native-reanimated   (drawer animation)
  │     └── react-native-worklets   (Reanimated 4 hard requirement)
  ├── react-native-gesture-handler  (swipe to open)
  └── react-native-screens
@react-navigation/native-stack
  └── react-native-screens
@react-navigation/bottom-tabs
  └── react-native-screens
all of the above
  └── react-native-safe-area-context
```

Every one of these is present. The drawer is the reason Reanimated is in the project at
all — no application code calls a Reanimated API directly (`grep -rn "reanimated" src` →
0 hits).

---

## Known issues

| # | Issue | Evidence |
|---|---|---|
| 1 | Reanimated 4 ESM breaks Jest — 0 tests run | above |
| 2 | `nativewind` installed, zero configuration, zero usage | above |
| 3 | `@react-native/new-app-screen` installed, never imported | grep — 0 hits |
| 4 | `@babel/preset-env` is a devDependency Babel never loads | `babel.config.js` |
| 5 | `react-native-gesture-handler` imported twice (`index.js:5`, `App.tsx:7`) | duplicate side-effect import; harmless but redundant |
| 6 | **No `GestureHandlerRootView` anywhere** — the library's documented root wrapper is missing; gestures work today via the older auto-registration path but this is not the supported setup | grep — 0 hits |
| 7 | `SafeAreaProvider` present, no screen reads an inset | above |
| 8 | `prettier` configured but no `format`/`format:check` script | `package.json` `scripts` |
| 9 | No dependency-audit or update tooling configured (`npm audit` not wired into any script or CI) | `package.json`; no CI files in the repo |

Full register: [known-issues.md](known-issues.md)

---

## What is NOT installed

Named here because their absence defines the current architecture:

| Category | Absent |
|---|---|
| HTTP | `axios`, any fetch wrapper |
| Server state | `@tanstack/react-query`, `swr` |
| Persistence | `@react-native-async-storage/async-storage`, `react-native-mmkv`, `realm`, any SQLite binding |
| Secure storage | `react-native-keychain`, `react-native-encrypted-storage` |
| Forms / validation | `react-hook-form`, `formik`, `zod`, `yup` |
| Env / config | `react-native-config`, `react-native-dotenv` |
| i18n | `i18next`, `react-i18next` |
| Crash / analytics | Sentry, Firebase, Bugsnag |
| Image handling | `react-native-fast-image` |
| Icons | any icon library — the UI uses text and emoji glyphs |
| Testing | `@testing-library/react-native`, `detox`, `maestro` |
| CI | no workflow files (`.github/`, `.gitlab-ci.yml`, `fastlane/` all absent) |

---

## Related documents

- [technology-stack.md](technology-stack.md)
- [configuration.md](configuration.md)
- [testing.md](testing.md)
