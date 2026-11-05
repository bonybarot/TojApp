# Known Issues

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: full read of the repository plus `npx tsc --noEmit`, `npx eslint .`, `npx jest`

> Every entry below was observed in the repository as it stands. **None of them has been
> fixed** — this phase is documentation only (see [../../AGENTS.md](../../AGENTS.md)).
> "Current Status" therefore reads `Open — documented, not fixed` for all of them; the
> column records how the issue was confirmed.

## Severity scale

| Level | Meaning |
|---|---|
| **P0** | Blocks release or causes irreversible harm |
| **P1** | Core functionality is wrong or a major flow does not work |
| **P2** | Real defect with a workaround, or significant technical debt |
| **P3** | Cleanliness, polish, or a risk that has not materialised yet |

---

## Build, release and tooling

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **BUILD-01** | **P0** | Release build type is signed with the committed debug keystore | `android/app/build.gradle:103` | `release { signingConfig signingConfigs.debug }`; keystore at `android/app/debug.keystore`, passwords in plaintext at `:91,:93`; `.gitignore:34-35` deliberately commits it | Anyone can build an accepted update to this app. Play Store rejects the upload. Signing identity cannot be changed after publication without a new package name. | Open — documented, not fixed |
| **BUILD-02** | P1 | iOS bundle identifier is the React Native template placeholder and does not match Android | `ios/TojApp.xcodeproj/project.pbxproj:276,303` | `PRODUCT_BUNDLE_IDENTIFIER = "org.reactjs.native.example.$(PRODUCT_NAME:rfc1034identifier)"` vs Android `applicationId "com.tojapp"` | Cannot register the App ID, cannot ship, no push/universal links; the two platforms are different apps | Open — documented, not fixed |
| **BUILD-03** | P1 | iOS signing entirely unconfigured | `ios/TojApp.xcodeproj/project.pbxproj` | no `DEVELOPMENT_TEAM`, no `CODE_SIGN_STYLE` (0 grep matches); only legacy `CODE_SIGN_IDENTITY[sdk=iphoneos*] = "iPhone Developer"` | No device build without manual Xcode setup; nothing records which team | Open — documented, not fixed |
| **BUILD-04** | P2 | ProGuard/R8 disabled and the rules file is empty | `android/app/build.gradle:60`; `android/app/proguard-rules.pro` | `def enableProguardInReleaseBuilds = false`; rules file contains only comments | Larger release APK, no obfuscation of the Java/Kotlin layer | Open — documented, not fixed |
| **BUILD-05** | P3 | All four ABIs shipped in one artefact, no splits or bundle config | `android/gradle.properties` | `reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64` | Larger download; emulator ABIs shipped to users | Open — documented, not fixed |
| **BUILD-06** | P3 | Default React Native launcher icon and launch screen on both platforms; no iOS app-icon artwork at all | `android/app/src/main/res/mipmap-*/`; `ios/TojApp/Images.xcassets/AppIcon.appiconset/Contents.json` | iOS `Contents.json` declares every slot with **no `filename`** on any entry | Not shippable as a branded product | Open — documented, not fixed |
| **BUILD-07** | P3 | Four disagreeing version identities | `package.json:3` `0.0.1`; `android/app/build.gradle:85-86` `1`/`1.0`; `project.pbxproj:262,270` `1`/`1.0`; `SettingsScreen.tsx:59` `1.0.0` | grep | No single source of truth for "what version is this" | Open — documented, not fixed |
| **BUILD-08** | P2 | No CI, no quality gate of any kind | repository root | no `.github/`, `.gitlab-ci.yml`, `.circleci/`, `fastlane/` | Nothing stops a broken commit; `lint` and `test` both currently fail and nobody is told | Open — documented, not fixed |

---

## Module resolution — the shadowing defect

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **DATA-01** | **P1** | `src/data/products.js` shadows `src/data/products.ts` at bundle time | `src/store/productStore.ts:2` | Metro `sourceExts` = `js,jsx,json,ts,tsx` (`.js` first, verified via `getDefaultConfig`); TypeScript `moduleResolution: "bundler"` prefers `.ts`; `tsc --showConfig` `files` lists `products.ts` and never `products.js` | **TypeScript sees 15 clothing items; the device runs 6 electronics items.** The editor and the compiler describe a catalogue that never executes. | Open — documented, not fixed |
| **DATA-02** | P1 | Product titles render blank throughout the app | `ProductCard.tsx:29`, `ProductDetailsScreen.tsx:49`, cart and checkout rows | `products.ts` uses `title`; `products.js` uses `name` (`:4,:11,…`) | Every product name is empty in the grid, on the details screen, in the cart, and at checkout | Open — documented, not fixed |
| **DATA-03** | P1 | Every category list is empty | `ProductListScreen.tsx:18-23` | `state.products.filter(p => p.category === category)`; `products.js` items have **no `category` field** | Tapping any of the 8 category cards yields a blank screen with no message | Open — documented, not fixed |
| **DATA-04** | P1 | `src/utils/theme.js` shadows `src/utils/theme.ts` | 20 files importing `{ colors } from '…/utils/theme'` | `theme.js` defines 5 colours; `theme.ts` defines 11 | **51 of 146 colour references resolve to `undefined` at runtime** — `textSecondary` (27), `border` (11), `error` (7), `success` (2), `warning` (2), `info` (2) | Open — documented, not fixed |
| **DATA-05** | P2 | Every order status badge colour is `undefined` | `OrderHistoryScreen.tsx:21-36`, `OrderDetailsScreen.tsx:25-40` | all six branches return `colors.success` / `info` / `warning` / `textSecondary` / `error`, none of which exist in `theme.js` | Status is colour-coded in source and uniform on screen | Open — documented, not fixed |
| **DATA-06** | P2 | Product `id` is `string` in the type layer and `number` in the bundled data | `products.ts:2` vs `products.js:3,10,…` | every signature declaring `id: string` (`getProductById`, `handleProductPress`, `CartItem.id`, route params) is wrong at runtime; `keyExtractor={item => item.id}` (`HomeScreen.tsx:35`, `ProductListScreen.tsx:49`) returns a number where `FlatList` expects a string | Lookups happen to work (`number === number`), but no type in the product path is trustworthy | Open — documented, not fixed |
| **DATA-07** | P2 | 5 of 8 declared categories have no products even in the `.ts` catalogue | `src/data/categories.ts` vs `src/data/products.ts` | products use only `Tops`, `Bottoms`, `Outerwear` (5 each); `Accessories`, `Shoes`, `Activewear`, `Formal`, `Sale` have none | Category browsing stays half-broken even after DATA-01 is resolved. `Sale` is a merchandising flag, not a garment category — it can never match a single-valued `category`. | Open — documented, not fixed |
| **DATA-08** | P3 | `spacing`, `typography` and `borderRadius` have zero importers | `src/utils/theme.ts:15-57` | grep — no import of any of the three | Every screen hardcodes values instead (`borderRadius: 8` in 12 places); the design system exists on paper only | Open — documented, not fixed |

Full analysis: [data-flow.md](data-flow.md)

---

## Compiler, linter and test failures

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **QUAL-01** | P1 | The test suite cannot load — **0 tests execute** | `jest.config.js`, `App.tsx:1` | `npx jest` → `SyntaxError: Cannot use import statement outside a module` at `react-native-reanimated/lib/module/index.js:3`; `Test Suites: 1 failed, Tests: 0 total`. Reanimated 4 ships ESM; the RN preset's `transformIgnorePatterns` is not overridden | No automated verification of anything. Introduced by commit `66044c5`, which upgraded Reanimated 3→4 and touched only `package.json` | Open — documented, not fixed |
| **QUAL-02** | P2 | Duplicate `fontWeight` key — the only TypeScript error in the project | `src/screens/Orders/OrderHistoryScreen.tsx:111,113` | `tsc`: `error TS1117`; ESLint: `no-dupe-keys` at `113:5` | `'400'` at `:111` is silently discarded; `'600'` wins | Open — documented, not fixed |
| **QUAL-03** | P2 | `npm run lint` fails — 6 errors, 2 warnings | see below | `npx eslint .` → `✖ 8 problems (6 errors, 2 warnings)` | The lint gate is red, so it cannot be enforced | Open — documented, not fixed |
| **QUAL-04** | P2 | `password` parameter accepted and never read | `src/store/userStore.ts:21` | `21:26 error 'password' is defined but never used` | The signature claims to check a credential it ignores | Open — documented, not fixed |
| **QUAL-05** | P3 | Unused `id` prop on both cards | `src/components/ProductCard.tsx:14`, `src/components/CategoryCard.tsx:13` | 2 of the 6 ESLint errors | Callers pass data the component discards | Open — documented, not fixed |
| **QUAL-06** | P3 | Unused `navigation` in the drawer content | `src/navigation/DrawerNavigator.tsx:31` | `31:9 error 'navigation' is assigned a value but never used` | Dead hook call on every drawer render | Open — documented, not fixed |
| **QUAL-07** | P3 | Unused `user` selected in checkout | `src/screens/Cart/CheckoutScreen.tsx:23` | `23:9 error 'user' is assigned a value but never used` | Subscribes the screen to `userStore` for nothing | Open — documented, not fixed |
| **QUAL-08** | P2 | Drawer content component defined during render | `src/navigation/DrawerNavigator.tsx:56` | `56:22 warning react/no-unstable-nested-components` | React destroys and rebuilds the drawer subtree on every `DrawerNavigator` render | Open — documented, not fixed |
| **QUAL-09** | P3 | No `typecheck` script; `tsc` is in no workflow | `package.json` scripts | scripts are `android`, `ios`, `lint`, `start`, `test` | The one working static gate is not wired to anything | Open — documented, not fixed |
| **QUAL-10** | P3 | Prettier configured but never enforced | `.prettierrc.js`, `.eslintrc.js` | `@react-native/eslint-config` extends `eslint-config-prettier`, which **disables** format rules; no `format` script, no hook | Visible drift: `History/index.tsx` and `auth/Login.tsx` have no semicolons and **no trailing newline**; `theme.js`/`products.js` use double quotes | Open — documented, not fixed |
| **QUAL-11** | P3 | `forceConsistentCasingInFileNames` is `false` | resolved `tsconfig` | `npx tsc --showConfig` | Case-only path errors pass on macOS and break on a case-sensitive CI | Open — documented, not fixed |

---

## Dead and unreachable code

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **DEAD-01** | P2 | Eight files are unreferenced or unreachable | listed below | grep for importers | ~21% of `src/` files are noise; two of them (`products.js`, `theme.js`) are worse than noise — they are what actually runs | Open — documented, not fixed |
| **DEAD-02** | P2 | `filterByCategory` is never called | `src/store/productStore.ts:33-45` | 0 call sites; `ProductListScreen.tsx:18-23` re-implements it inline | `selectedCategory` is permanently `null`; the correct implementation sits unused next to a worse one | Open — documented, not fixed |
| **DEAD-03** | P3 | `useCartTotalPrice` is exported and imported by nothing | `src/store/cartStore.ts:66-69` | 0 importers; `CartScreen.tsx:21-23` and `CheckoutScreen.tsx:19-21` each duplicate the `reduce` | Duplicated business rule | Open — documented, not fixed |
| **DEAD-04** | P3 | `navigationRef` wired into the container but never used; two dead enums beside it | `src/navigation/StackKeys.tsx:3-13`, `App.tsx:15` | no `navigationRef.*` call anywhere | Suggests an imperative-navigation plan that was never built | Open — documented, not fixed |
| **DEAD-05** | P3 | `setUser` action has no callers | `src/store/userStore.ts:40-42` | grep | — | Open — documented, not fixed |
| **DEAD-06** | P3 | `nativewind` installed with no configuration and no usage | `package.json:18` | no `tailwind.config.js`; absent from `babel.config.js` and `metro.config.js`; 0 `className` props | Dead dependency; misleading about how the app is styled | Open — documented, not fixed |
| **DEAD-07** | P3 | `@react-native/new-app-screen` and `@babel/preset-env` installed, never referenced | `package.json` | grep; `babel.config.js` loads only `module:@react-native/babel-preset` | Dead dependencies | Open — documented, not fixed |

### The eight unreferenced / unreachable files

| File | Why it is dead |
|---|---|
| `src/data/products.js` | shadows `products.ts` — **not dead at runtime; it is what runs.** Dead only to the compiler |
| `src/utils/theme.js` | same, for the theme |
| `src/store/authStore.js` | zero importers; a precursor to `userStore`'s `isLoggedIn` |
| `src/data/history.js` | only consumer is an unregistered screen |
| `src/components/HistoryItem.js` | only consumer is an unregistered screen |
| `src/screens/History/HistoryScreen.js` | registered in no navigator |
| `src/screens/History/index.tsx` | placeholder stub, registered in no navigator |
| `src/screens/auth/Login.tsx` | placeholder stub, registered in no navigator (the live screen is `LoginScreen.tsx`) |

---

## Navigation

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **NAV-01** | P2 | `Profile` registered in two navigators | `MainTabs.tsx:43`, `DrawerNavigator.tsx:81` | two registrations of the same screen component | Two instances with separate histories; `navigate('Profile')` is ambiguous; back behaviour differs by entry point | Open — documented, not fixed |
| **NAV-02** | P2 | `AuthStackParamList` and `DrawerParamList` declared but not attached to their navigators | `AuthStack.tsx:7-12`, `DrawerNavigator.tsx:19-27` | `createNativeStackNavigator()` / `createDrawerNavigator()` called without the type argument | The types are decoration; routes and params in those trees are unchecked | Open — documented, not fixed |
| **NAV-03** | P2 | Three `as never` casts defeat route type-checking | `LoginScreen.tsx:61`, `SignupScreen.tsx:86`, `CategoriesScreen.tsx:24` | grep | Route names and params are unverified; the first two exist only because of NAV-02 | Open — documented, not fixed |
| **NAV-04** | P2 | The nested navigator structure is hardcoded inside a screen | `CategoriesScreen.tsx:18-24` | `getParent()?.navigate('MainTabs', { screen: 'HomeStack', params: { screen: 'ProductList', … } } as never)` | Renaming or reordering any of three navigators silently breaks category navigation at runtime | Open — documented, not fixed |
| **NAV-05** | P2 | Detail screens have no header title and no back affordance | `HomeStack.tsx:19`, `CartStack.tsx:17`, `OrdersStack.tsx:17`, `MainTabs.tsx:20`, `DrawerNavigator.tsx:69` | all inner navigators set `headerShown: false`; the drawer's `MainTabs` entry sets `title: ''` | `ProductDetails`, `Checkout` and `OrderDetails` render unlabelled with no header back button | Open — documented, not fixed |
| **NAV-06** | P3 | No `RootParamList` / global navigation type registration | `src/navigation/` | grep — no `declare global { namespace ReactNavigation }` | A bare `useNavigation()` is untyped everywhere | Open — documented, not fixed |
| **NAV-07** | P3 | Route props declared anonymously instead of from the ParamList that already describes them | `ProductListScreen.tsx:9`, `ProductDetailsScreen.tsx:16`, `OrderDetailsScreen.tsx:7` | three parallel `RouteProp<{ params: … }, 'params'>` declarations | Param shapes can drift from the routes that feed them | Open — documented, not fixed |
| **NAV-08** | P3 | `useNavigation<NativeStackNavigationProp<any>>()` | `ProductListScreen.tsx:16` | explicit `any` | No route checking on that screen | Open — documented, not fixed |

---

## Application behaviour

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **APP-01** | P1 | Authentication is a mock — any non-empty credentials succeed | `src/store/userStore.ts:21-33` | `// Mock login - in real app, this would call an API` at `:22`; `password` never read; user is always `John Doe` | There is no account, no session and no verification of anything | Open — documented, not fixed |
| **APP-02** | P1 | Sign-up creates nothing and discards the entered name | `SignupScreen.tsx:34` | calls the same `login(email, password)`; `name` state is never passed on | "Create account" is indistinguishable from "log in" | Open — documented, not fixed |
| **APP-03** | P1 | Checkout creates no order | `CheckoutScreen.tsx:33-54` | `// In a real app, this would create an order via API` at `:44`, then `Alert` → `clearCart()` → `goBack()` | The cart empties and nothing is recorded. Order history shows unrelated static data. | Open — documented, not fixed |
| **APP-04** | P1 | Nothing is persisted | `src/store/*` | no AsyncStorage/MMKV/SQLite/`zustand/persist` anywhere | Login and cart are lost on every relaunch; settings toggles are lost on unmount | Open — documented, not fixed |
| **APP-05** | P2 | Orders and categories bypass the store layer entirely | `OrderHistoryScreen.tsx:11`, `OrderDetailsScreen.tsx:4`, `CategoriesScreen.tsx:6` | direct `import { orders } …` / `import { categories } …` | Two contradictory data-access patterns in one app; these screens cannot ever show server data without being rewritten | Open — documented, not fixed |
| **APP-06** | P2 | `getStatusColor` duplicated byte-for-byte across two screens | `OrderHistoryScreen.tsx:21-36`, `OrderDetailsScreen.tsx:25-40` | identical 16-line functions | The two screens will drift | Open — documented, not fixed |
| **APP-07** | P2 | Six profile menu rows have no `onPress` at all | `ProfileScreen.tsx:36,40,44,48,55,59` | Edit Profile, Change Password, Payment Methods, Shipping Addresses, Order History, Wishlist | Rows respond visually to touch and do nothing — the app looks more finished than it is | Open — documented, not fixed |
| **APP-08** | P2 | Settings switches are inert | `SettingsScreen.tsx:13-14` | two local `useState` values read by nothing; there is no dark theme to enable | Toggling changes nothing and resets on unmount | Open — documented, not fixed |
| **APP-09** | P2 | No loading, error or error-boundary handling anywhere | `src/` | 0 `try`/`catch`, no `ErrorBoundary`, no `console.*` | Any future async work has nowhere to report failure; a render error unmounts the whole app | Open — documented, not fixed |
| **APP-10** | P3 | Four `FlatList` screens have no empty state | `HomeScreen`, `ProductListScreen`, `CategoriesScreen`, `OrderHistoryScreen` | no `ListEmptyComponent` | Combined with DATA-03, the user gets a blank screen with no explanation | Open — documented, not fixed |
| **APP-11** | P2 | The cart is not cleared on logout | `userStore.ts:34-39` | `logout` touches only `user` and `isLoggedIn` | The next user in the same process inherits the previous cart | Open — documented, not fixed |
| **APP-12** | P3 | `isLoggedIn` duplicates information already in `user` | `userStore.ts:11-12` | two fields for one fact | They can disagree | Open — documented, not fixed |
| **APP-13** | P3 | Six explicit `: any` annotations, five of them list rows | `DrawerNavigator.tsx:29`, `HomeScreen.tsx:20`, `ProductListScreen.tsx:29`, `CartScreen.tsx:33`, `CategoriesScreen.tsx:27`, `OrderHistoryScreen.tsx:42` | grep `: any` | This is what lets the `title`/`name` mismatch render as a blank string instead of failing | Open — documented, not fixed |
| **APP-14** | P3 | `Product` declared twice, independently | `src/data/products.ts:1-9`, `src/store/productStore.ts:4-12` | structurally identical, no shared type | Guaranteed to drift | Open — documented, not fixed |
| **APP-15** | P3 | No accessibility support of any kind | `src/` | 0 occurrences of `accessibilityLabel`, `accessibilityRole`, `accessible`, `accessibilityHint` | Unusable with a screen reader; no `hitSlop` on small controls | Open — documented, not fixed |

---

## Platform and configuration

| ID | Severity | Issue | Location | Evidence | Impact | Current Status |
|---|---|---|---|---|---|---|
| **PLAT-01** | P2 | `NSLocationWhenInUseUsageDescription` present with an **empty** string, for a capability the app never uses | `ios/TojApp/Info.plist` | `<key>NSLocation…</key><string></string>` | Invites App Store review questions; an empty purpose string would cause immediate denial if ever used | Open — documented, not fixed |
| **PLAT-02** | P2 | Landscape orientations permitted with no landscape layout | `ios/TojApp/Info.plist`; Android handles `orientation` in `configChanges` | every `StyleSheet` is a portrait column; `numColumns={2}` is fixed at `HomeScreen.tsx:36` | Rotating produces a stretched portrait layout | Open — documented, not fixed |
| **PLAT-03** | P2 | **No `GestureHandlerRootView`** anywhere | `App.tsx`, `index.js` | 0 grep matches; only the side-effect import at `index.js:5` and again at `App.tsx:7` | Not the documented setup for `react-native-gesture-handler`; drawer gestures rely on the legacy path | Open — documented, not fixed |
| **PLAT-04** | P3 | `react-native-gesture-handler` imported twice | `index.js:5`, `App.tsx:7` | duplicate side-effect import | Redundant; the `index.js` import alone is the requirement | Open — documented, not fixed |
| **PLAT-05** | P3 | `SafeAreaProvider` mounted but no screen reads an inset | `App.tsx:13`; the only `SafeAreaView` is in the unregistered `HistoryScreen.js:10` | grep | Content can sit under the notch or home indicator on the `headerShown: false` screens | Open — documented, not fixed |
| **PLAT-06** | P3 | `supportsRtl="true"` declared with no RTL-aware styling | `AndroidManifest.xml:13` | no `start`/`end` style props anywhere | RTL is claimed and untested | Open — documented, not fixed |
| **PLAT-07** | P3 | No i18n — all strings hardcoded in English, currency hardcoded to `$` | e.g. `ProductCard.tsx:31` `${price.toFixed(2)}`, `SettingsScreen.tsx:43,47` | grep | Localisation would require touching every screen | Open — documented, not fixed |
| **PLAT-08** | P3 | Two files show as modified in the working tree, unrelated to any documented change | `ios/Podfile.lock` (52 insertions, 16 deletions), `package-lock.json` | `git status` at the start of this documentation pass | Provenance **UNKNOWN**; they predate this work and were left untouched | Open — pre-existing, untouched |

---

## Counts

| Severity | Count |
|---|---|
| P0 | 1 |
| P1 | 11 |
| P2 | 25 |
| P3 | 28 |
| **Total** | **65** |

By area: Build/release 8 · Module resolution 8 · Compiler/lint/test 11 · Dead code 7 ·
Navigation 8 · Application behaviour 15 · Platform/configuration 8.

---

## The five that matter most

1. **BUILD-01** — release signed with the committed debug key. Irreversible if shipped.
2. **DATA-01 / DATA-04** — the shadowing defect. The app you read is not the app that runs;
   every other diagnosis is unreliable until this is settled.
3. **QUAL-01** — 0 tests execute, so no change can be verified.
4. **APP-01 / APP-03** — authentication and checkout are mocks. The two flows the product
   exists for do not do anything.
5. **APP-04** — nothing persists, so nothing survives a relaunch.

---

## Related documents

- [data-flow.md](data-flow.md)
- [architecture.md](architecture.md)
- [testing.md](testing.md)
- [android.md](android.md) · [ios.md](ios.md) · [security.md](security.md)
