# Technology Stack

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `package.json`, `ios/Podfile.lock`, `android/build.gradle`, `android/gradle.properties`, `tsc --showConfig`

Every version below is read from a file in the repository. No version is inferred.

---

## Runtime environment

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| Node.js | `>=20` | Build/tooling runtime | Metro, Jest, ESLint, tsc | `package.json` → `engines.node` | Declared, not enforced by any tool |
| React Native | 0.82.1 | Application framework | Everywhere | `package.json`; `ios/Podfile.lock` → `React-Core (0.82.1)` | Active |
| React | 19.1.1 | UI runtime | Everywhere | `package.json` | Active |
| Hermes | 0.82.1 | JS engine | Both platforms | `android/gradle.properties` → `hermesEnabled=true`; `ios/Podfile.lock` → `hermes-engine (0.82.1)` | Enabled |
| New Architecture | — | Fabric renderer + TurboModules | Both platforms | `android/gradle.properties` → `newArchEnabled=true`; `ios/TojApp/Info.plist` → `RCTNewArchEnabled=true` | Enabled |
| Fabric | — | New renderer | Implicit via New Architecture | as above | Active |
| TurboModules | — | Native module system | Implicit via New Architecture | as above | Active |

---

## Language and type system

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| TypeScript | ^5.8.3 | Type checking | 32 of 38 `src/` files | `package.json` devDependencies | Active — **1 error**, see [known-issues.md](known-issues.md) |
| `@react-native/typescript-config` | 0.82.1 | Base tsconfig | `tsconfig.json` `extends` | `tsconfig.json` | Active |

Effective compiler options, resolved with `npx tsc --showConfig`:

| Option | Value | Note |
|---|---|---|
| `strict` | `true` | Not relaxed anywhere |
| `allowJs` | `true` | Lets the 6 `.js` files sit in the tree unchecked |
| `isolatedModules` | `true` | |
| `moduleResolution` | `"bundler"` | TypeScript prefers `.ts` over `.js` — the divergence from Metro |
| `noEmit` | `true` | Type-check only |
| `skipLibCheck` | `true` | |
| `types` | `["jest"]` | |
| `forceConsistentCasingInFileNames` | `false` | |

`tsconfig.json` itself adds only `include: ["**/*.ts", "**/*.tsx"]` and
`exclude: ["**/node_modules", "**/Pods"]`.

---

## Navigation

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| `@react-navigation/native` | ^7.1.19 | Container, `useNavigation`, `useRoute`, `createNavigationContainerRef` | `App.tsx:2`, all 7 navigators, 9 screens | `package.json` | Active |
| `@react-navigation/native-stack` | ^7.6.2 | Auth / Home / Cart / Orders stacks | `AuthStack.tsx`, `HomeStack.tsx`, `CartStack.tsx`, `OrdersStack.tsx` | `package.json` | Active |
| `@react-navigation/bottom-tabs` | ^7.8.4 | Tab bar | `src/navigation/MainTabs.tsx:14` | `package.json` | Active |
| `@react-navigation/drawer` | ^7.1.3 | Side drawer + custom content | `src/navigation/DrawerNavigator.tsx:27` | `package.json` | Active |
| `react-native-screens` | ^4.4.0 | Native screen primitives | Transitive requirement of the above | `package.json` | Active |

Deep linking: **NOT IMPLEMENTED** — no `linking` prop on `NavigationContainer`
(`App.tsx:15`), no URL scheme registered.

---

## State management

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| Zustand | ^4.5.2 | Global client state | `src/store/` — 4 stores | `package.json` | Active |

No middleware is used: no `persist`, no `devtools`, no `immer`, no `subscribeWithSelector`.
No Redux, MobX, Recoil, Jotai or XState. No React Context provider is authored by this
codebase. No server-state library (React Query / SWR / RTK Query).

---

## Styling

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| `StyleSheet` (React Native core) | — | All styling | Every screen and component | e.g. `src/components/ProductCard.tsx:37` | Active |
| `src/utils/theme` | in-repo | Colour tokens | 16 files import `{ colors }` | `src/utils/theme.ts` / `.js` | Active — **but `.js` shadows `.ts`**, see [data-flow.md](data-flow.md) |
| `nativewind` | ^4.2.1 | Tailwind-style RN styling | **Nowhere** | `package.json` | **UNUSED** — no `className` prop anywhere, no `tailwind.config.js`, absent from `babel.config.js` and `metro.config.js` |

`src/utils/theme.ts` also exports `spacing`, `typography` and `borderRadius`.
**No file imports them.** Screens hardcode the equivalent literals.

---

## Animation and gestures

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| `react-native-reanimated` | ~4.1.7 | Drawer animation | Side-effect import at `App.tsx:1`; Babel plugin | `package.json`, `babel.config.js:3` | Active — **breaks Jest**, see [testing.md](testing.md) |
| `react-native-worklets` | ~0.6.1 | Worklet runtime required by Reanimated 4 | No direct import; peer of Reanimated 4 | `package.json` | Active |
| `react-native-gesture-handler` | ^2.20.2 | Drawer gestures | Side-effect import at `index.js:5` and `App.tsx:7` | `package.json` | Active |

Reanimated was upgraded from `^3.7.0` to `~4.1.7` in commit `66044c5`, which also added
`react-native-worklets`. That commit changed only `package.json`.

---

## Layout

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| `react-native-safe-area-context` | ^5.5.2 | `SafeAreaProvider` | `App.tsx:4,13` | `package.json` | Active — only one live consumer; no screen calls `useSafeAreaInsets` |

---

## Storage

**NOT IMPLEMENTED.**

No `@react-native-async-storage/async-storage`, no `react-native-mmkv`, no SQLite, no
`react-native-keychain`, no `expo-secure-store`, no `zustand/persist`. Verified by
inspecting `package.json` dependencies and grepping `src/`.

---

## Networking

**NOT IMPLEMENTED.**

No `axios`, no `ky`, no GraphQL client. No `fetch` call anywhere in `src/`. No base URL,
no `.env` file, no endpoint constant. The Android `INTERNET` permission is declared
(`android/app/src/main/AndroidManifest.xml`), used only for remote `<Image>` loading from
`images.unsplash.com` and `i.pravatar.cc`.

See [../api/current-state.md](../api/current-state.md).

---

## Testing

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| Jest | ^29.6.3 | Test runner | `__tests__/App.test.tsx` | `package.json` | **KNOWN ISSUE — 0 tests execute** |
| `react-test-renderer` | 19.1.1 | Render tree for tests | `__tests__/App.test.tsx:6` | `package.json` | Present |
| `@types/jest` | ^29.5.13 | Jest typings | `tsconfig` `types` | `package.json` | Active |
| `@types/react-test-renderer` | ^19.1.0 | Typings | — | `package.json` | Active |

Not present: `@testing-library/react-native`, Detox, Maestro, coverage thresholds.
See [testing.md](testing.md).

---

## Linting and formatting

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| ESLint | ^8.19.0 | Linting | `.eslintrc.js` | `package.json` | Active — **6 errors, 2 warnings** |
| `@react-native/eslint-config` | 0.82.1 | Rule set | `.eslintrc.js:3` | `.eslintrc.js` | Active |
| Prettier | 2.8.8 | Formatting | `.prettierrc.js` | `package.json` | Configured, **never enforced** — no hook, no CI, no `format` script |

---

## Build tooling

| Technology | Version | Purpose | Where used | Evidence | Status |
|---|---|---|---|---|---|
| Metro | bundled with RN 0.82.1 | JS bundler | `metro.config.js` | `metro.config.js` | Active — **default `sourceExts` cause the shadowing issue** |
| `@react-native/metro-config` | 0.82.1 | Metro defaults | `metro.config.js:1` | `package.json` | Active |
| Babel | `@babel/core` ^7.25.2 | Transpilation | `babel.config.js` | `package.json` | Active |
| `@react-native/babel-preset` | 0.82.1 | RN Babel preset | `babel.config.js:2` | `babel.config.js` | Active |
| `@babel/preset-env` | ^7.25.3 | Present in devDependencies | Not referenced by `babel.config.js` | `package.json` | Unused by the project's own config |
| `@react-native-community/cli` | 20.0.0 | `react-native` CLI | npm scripts | `package.json` | Active |
| Gradle / Android Gradle Plugin | See `android/build.gradle` | Android build | `android/` | `android/build.gradle` | Active |
| CocoaPods | See `ios/Podfile.lock` | iOS dependencies | `ios/` | `ios/Podfile` | Active |

---

## Android tooling

| Setting | Value | Evidence |
|---|---|---|
| `minSdkVersion` | 24 | `android/build.gradle:4` |
| `compileSdkVersion` | 36 | `android/build.gradle:5` |
| `targetSdkVersion` | 36 | `android/build.gradle:6` |
| `applicationId` / `namespace` | `com.tojapp` | `android/app/build.gradle:80,82` |
| ABIs | `armeabi-v7a,arm64-v8a,x86,x86_64` | `android/gradle.properties` |
| Edge-to-edge | `false` | `android/gradle.properties` |
| ProGuard in release | `false` | `android/app/build.gradle:60` |

Full detail: [android.md](android.md)

---

## iOS tooling

| Setting | Value | Evidence |
|---|---|---|
| Deployment target | 15.1 | `ios/TojApp.xcodeproj/project.pbxproj` |
| Bundle identifier | `org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)` | `ios/TojApp.xcodeproj/project.pbxproj` — RN template placeholder |
| Entry point | `AppDelegate.swift` using `RCTReactNativeFactory` | `ios/TojApp/AppDelegate.swift` |
| Privacy manifest | Present | `ios/TojApp/PrivacyInfo.xcprivacy` |

Full detail: [ios.md](ios.md)

---

## Unused / inert dependencies

| Package | Version | Why it is here | Status |
|---|---|---|---|
| `nativewind` | ^4.2.1 | UNKNOWN — no configuration, no usage | Inert |
| `@react-native/new-app-screen` | 0.82.1 | React Native template welcome screen | Inert — `App.tsx` never imports it |
| `@babel/preset-env` | ^7.25.3 | Not referenced by `babel.config.js` | Inert for this project's config |

---

## Related documents

- [dependencies.md](dependencies.md) — per-dependency purpose and known issues
- [configuration.md](configuration.md) — the config files themselves
- [known-issues.md](known-issues.md)
