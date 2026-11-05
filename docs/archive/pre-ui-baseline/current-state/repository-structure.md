# Repository Structure

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: Repository inspection (`find`, file reads)

38 files under `src/`, ~2,900 lines. This page explains what each directory is
responsible for — not just what it contains.

---

## Top level

```text
TojApp/
├── AGENTS.md              AI agent instructions (documentation)
├── App.tsx                Provider tree + NavigationContainer
├── index.js               AppRegistry entry point
├── app.json               App name registration
├── babel.config.js        RN preset + Reanimated plugin
├── metro.config.js        Stock Metro config (empty override)
├── jest.config.js         Three lines — RN preset only
├── tsconfig.json          Extends @react-native/typescript-config
├── .eslintrc.js           Extends @react-native
├── .prettierrc.js         singleQuote, trailingComma all, arrowParens avoid
├── package.json           14 runtime deps, 18 dev deps
├── README.md              Two lines: "# TojApp" / "clothing app"
├── __tests__/             One smoke test (cannot execute)
├── docs/                  This documentation
├── android/               Android native project
├── ios/                   iOS native project
└── src/                   Application source
```

---

## `src/navigation/` — 8 files

**Purpose:** define the navigator tree and route types.

**Responsibility:** one file per navigator, each exporting its own `ParamList` type
alongside its component. This is the most clearly organised directory in the project.

| File | Responsibility |
|---|---|
| `RootNavigator.tsx` | Auth gate + product bootstrap. 16 lines. Chooses `AuthStack` or `DrawerNavigator` on `isLoggedIn`. |
| `AuthStack.tsx` | Login + Signup. Headers shown. |
| `DrawerNavigator.tsx` | Drawer shell + `CustomDrawerContent` + logout. 99 lines. |
| `MainTabs.tsx` | Bottom tabs: HomeStack, CartStack, Profile. |
| `HomeStack.tsx` | Home → ProductList → ProductDetails. |
| `CartStack.tsx` | Cart → Checkout. |
| `OrdersStack.tsx` | OrderHistory → OrderDetails. |
| `StackKeys.tsx` | `navigationRef` + two unused enums. |

**Dependencies:** `@react-navigation/*`, `src/screens/*`, `src/store/userStore`,
`src/utils/theme`, `src/components/DrawerHeader`.

**Current problems:**
- `AuthStack.tsx:12` and `DrawerNavigator.tsx:27` create their navigators **without** the
  generic — `createNativeStackNavigator()` rather than
  `createNativeStackNavigator<AuthStackParamList>()`. The declared ParamLists therefore
  enforce nothing.
- `StackKeys.tsx` is misnamed: it holds `navigationRef` (wired at `App.tsx:15`, never
  called) plus `RouteNavigator` and `Route` enums that nothing imports.
- `DrawerNavigator.tsx:31` declares an unused `navigation` const (ESLint error).
- `DrawerNavigator.tsx:56` passes an inline arrow to `drawerContent`, remounting the
  drawer subtree on every render (ESLint warning, real behavioural defect).

Full detail: [navigation.md](navigation.md)

---

## `src/screens/` — 15 files in 7 domain folders

**Purpose:** one screen component per route, grouped by domain.

**Responsibility:** each screen owns its own layout, its own `StyleSheet`, its own local
form state, and — in several cases — business logic that has no other home.

| Folder | Files | Reachable? |
|---|---|---|
| `Home/` | `HomeScreen.tsx`, `ProductListScreen.tsx`, `ProductDetailsScreen.tsx` | Yes |
| `Cart/` | `CartScreen.tsx`, `CheckoutScreen.tsx` | Yes |
| `Orders/` | `OrderHistoryScreen.tsx`, `OrderDetailsScreen.tsx` | Yes |
| `User/` | `ProfileScreen.tsx`, `SettingsScreen.tsx` | Yes |
| `Categories/` | `CategoriesScreen.tsx` | Yes |
| `auth/` | `LoginScreen.tsx`, `SignupScreen.tsx` | Yes |
| `auth/` | `Login.tsx` | **No — 11-line stub, registered nowhere** |
| `History/` | `HistoryScreen.js`, `index.tsx` | **No — neither registered** |

**Dependencies:** `src/components/*`, `src/store/*`, `src/data/*`, `src/utils/theme`,
`@react-navigation/*`.

**Current problems:**
- Folder casing is inconsistent: `auth` is lowercase, `Home`/`Cart`/`User`/`Orders`/
  `Categories` are capitalised.
- Naming is inconsistent: `LoginScreen.tsx` vs `Login.tsx`, `HistoryScreen.js` vs
  `index.tsx`.
- Domain folders hold only screens — no co-located components, hooks or tests.
- Roughly two-thirds of every screen file is its `StyleSheet.create` block. The largest
  file, `OrderDetailsScreen.tsx`, is 221 lines.
- Three screens are unreachable (above).
- `src/screens/History/` contains two mutually exclusive implementations of the same
  screen. An import of `'../screens/History'` would resolve to the 11-line stub.

---

## `src/components/` — 4 files

**Purpose:** reusable presentational components.

**Responsibility:** currently mixed — two genuinely shared grid tiles, one
single-consumer drawer part, one dead file.

| File | Responsibility | Consumers |
|---|---|---|
| `ProductCard.tsx` | Product grid tile: image, title, price | `HomeScreen`, `ProductListScreen` |
| `CategoryCard.tsx` | Category grid tile: image, overlay, title | `CategoriesScreen` |
| `DrawerHeader.tsx` | Drawer avatar + name + email | `DrawerNavigator` only |
| `HistoryItem.js` | Purchase-history row | **Dead** — only `HistoryScreen.js`, itself dead |

**Dependencies:** `react-native`, `src/utils/theme`; `DrawerHeader.tsx` additionally
imports `src/store/userStore`.

**Current problems:**
- Flat directory, no `ui/` vs `feature/` distinction, no index barrel.
- The three most-repeated UI patterns in the app have **not** been extracted: the primary
  button (hand-written 5 times), the labelled `TextInput` (3 times), the menu row
  (2 times).
- `DrawerHeader.tsx:7` reads a store directly, unlike the other two components which take
  primitives. It is the only component coupled to global state.
- `ProductCard.tsx:14` and `CategoryCard.tsx:13` both accept an `id` prop that is never
  used (ESLint errors).

Full detail: [../components/README.md](../components/README.md)

---

## `src/store/` — 4 files

**Purpose:** global application state via Zustand.

**Responsibility:** split by domain — cart, user/session, products. One file is dead.

| File | Responsibility | Wired? |
|---|---|---|
| `cartStore.ts` | Cart items and mutations | Yes |
| `userStore.ts` | User object + `isLoggedIn` + mock login/logout | Yes |
| `productStore.ts` | Product list, filtered projection, by-id lookup | Yes |
| `authStore.js` | Duplicate `isLoggedIn` + login/logout | **No — zero imports anywhere** |

**Dependencies:** `zustand`; `productStore.ts:2` imports `../data/products`.

**Current problems:**
- `authStore.js` is dead and has the more discoverable name for the job that
  `userStore.ts` actually does.
- `productStore.ts` is structurally a server-state cache with no server: it has
  `loadProducts`, a `filteredProducts` projection and `getProductById`, but no loading
  flag, no error field, and a synchronous `set()`.
- `productStore.ts:33` `filterByCategory` is never called; `ProductListScreen` filters
  inline instead.
- `cartStore.ts:66` exports `useCartTotalPrice`, which no screen imports.

Full detail: [state-management.md](state-management.md)

---

## `src/data/` — 5 files

**Purpose:** hardcoded fixtures standing in for a backend, **and** the domain type
definitions.

**Responsibility:** ambiguous — this directory holds two different kinds of thing under
one name.

| File | Contents | Live? |
|---|---|---|
| `products.ts` | `Product` interface + 15 clothing items (`id: string`, `title`, `category`) | Type-checked, **not what runs** |
| `products.js` | 6 electronics items (`id: number`, `name`, no `category`) | **This is what Metro bundles** |
| `categories.ts` | `Category` interface + 8 clothing categories | Live |
| `orders.ts` | `OrderItem` + `Order` interfaces + 4 mock orders | Live |
| `history.js` | 4 electronics purchase records | **Dead** — only `HistoryScreen.js` |

**Current problems:**
- `products.js` shadows `products.ts` at bundle time. See [data-flow.md](data-flow.md).
- The directory mixes types with fixtures, so there is no obvious answer to where the
  types belong once a real API exists.
- Only 3 of the 8 categories in `categories.ts` (`Tops`, `Bottoms`, `Outerwear`) appear
  as a `category` value in `products.ts`. Even with the shadowing resolved, 5 category
  cards would open an empty list.

---

## `src/utils/` — 2 files

**Purpose:** despite the name, this directory contains **only** the design token system.

| File | Contents | Live? |
|---|---|---|
| `theme.ts` | 11 colours + `spacing` + `typography` + `borderRadius` | Type-checked, **not what runs** |
| `theme.js` | 5 colours only | **This is what Metro bundles** |

**Dependencies:** none.

**Current problems:**
- `theme.js` shadows `theme.ts` for all 16 importers. Six colour tokens
  (`textSecondary`, `border`, `error`, `success`, `warning`, `info`) are `undefined` at
  runtime. See [data-flow.md](data-flow.md).
- `spacing`, `typography` and `borderRadius` have **zero importers**.
- Named `utils/` but contains no utilities, making it the default destination for the
  first date formatter, currency formatter or validator anyone writes.

---

## `__tests__/` — 1 file

`App.test.tsx` — the unmodified React Native template smoke test. Renders `<App />` and
asserts nothing further. **Cannot execute.** See [testing.md](testing.md).

---

## `android/` and `ios/`

Stock React Native 0.82 templates with the New Architecture enabled.

Documented separately: [android.md](android.md), [ios.md](ios.md).

---

## Directories that do NOT exist

| Missing directory | Note |
|---|---|
| `src/hooks/` | No custom hook exists, though duplicated cart-total and status-colour logic wants one |
| `src/services/` or `src/api/` | No API layer of any kind |
| `src/types/` | Types are declared inline beside their consumers, some twice |
| `src/assets/` | Zero local asset files — all imagery is remote URLs |
| `src/constants/` | Route names and literals are inline |
| Co-located tests | No `__tests__` or `*.test.tsx` under `src/` |
| `.github/` | No CI |
| `.husky/` | No git hooks |

---

## Related documents

- [architecture.md](architecture.md)
- [navigation.md](navigation.md)
- [state-management.md](state-management.md)
- [data-flow.md](data-flow.md)
- [known-issues.md](known-issues.md)
