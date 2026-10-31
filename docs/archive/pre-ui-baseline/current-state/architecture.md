# Current Architecture

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: Repository inspection

This page describes the architecture that **actually exists**, and the points where it
breaks down. It does not propose an architecture.

---

## The layer chain, as implemented

```text
Application Entry        index.js
        ↓
Providers                App.tsx  (SafeAreaProvider, StatusBar, NavigationContainer)
        ↓
Navigation               RootNavigator → AuthStack | DrawerNavigator → MainTabs → stacks
        ↓
Screens                  src/screens/**  (12 reachable)
        ↓
Components               src/components/**  (3 live)
        ↓
Hooks / State            src/store/**  (3 live Zustand stores)   ← NO custom hooks exist
        ↓
Data / Services          src/data/**  (hardcoded arrays)         ← NO service layer exists
        ↓
Persistence              — NOT IMPLEMENTED —
        ↓
Backend                  — NOT IMPLEMENTED —
```

Two of those layers are absent, and one of them (hooks) has no directory at all.

---

## Application entry

**`index.js`**

```js
import 'react-native-gesture-handler';        // line 5 — side effect, must be first
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

**`App.tsx`** (22 lines) — the entire provider tree:

```tsx
import 'react-native-reanimated';             // line 1 — side effect
...
import 'react-native-gesture-handler';        // line 7 — duplicate of index.js:5

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

Notes on what is **not** here:

- No error boundary anywhere in the tree.
- No splash screen, no hydration gate, no async bootstrap phase.
- No theme provider — `useColorScheme()` at `App.tsx:10` is the only dark-mode-aware line
  in the entire application, and it affects only the status bar.
- `navigationRef` is passed at line 15 but **never called** from anywhere.
- `react-native-gesture-handler` is imported twice (`index.js:5` and `App.tsx:7`). The
  `index.js` import alone is the documented requirement.

---

## Bootstrap

**`src/navigation/RootNavigator.tsx`** — 16 lines, and the only bootstrap logic in the app:

```tsx
export const RootNavigator: React.FC = () => {
  const isLoggedIn = useUserStore(state => state.isLoggedIn);      // line 8
  const loadProducts = useProductStore(state => state.loadProducts); // line 9

  useEffect(() => {
    loadProducts();                                                 // line 12
  }, [loadProducts]);

  return isLoggedIn ? <DrawerNavigator /> : <AuthStack />;          // line 15
};
```

`loadProducts()` performs a synchronous `set()` from a module-level import
(`src/store/productStore.ts:27-32`). There is nothing asynchronous to wait for, which is
why no loading state exists.

The auth decision at line 15 is made synchronously on first render. That is correct
**today only because there is nothing to restore from disk** — no persisted session
exists to hydrate.

---

## Screen → data: two different patterns coexist

The chain *Screen → Hook → Service → Storage* does not exist. Screens reach data in two
mutually inconsistent ways:

### Pattern A — through a Zustand store

| Screen | Store | Seam for a future API? |
|---|---|---|
| `HomeScreen.tsx:14` | `useProductStore(state => state.filteredProducts)` | Yes |
| `ProductListScreen.tsx:18` | `useProductStore(...)` with an inline filter | Yes |
| `ProductDetailsScreen.tsx:24` | `useProductStore(state => state.getProductById)` | Yes |
| `CartScreen.tsx:20-25` | `useCartStore` — four narrow selectors | Yes |
| `CheckoutScreen.tsx:18-23` | `useCartStore` + `useUserStore` | Yes |
| `ProfileScreen.tsx:14` | `useUserStore(state => state.user)` | Yes |

### Pattern B — direct module import, bypassing all state

| Screen | Import | Seam for a future API? |
|---|---|---|
| `OrderHistoryScreen.tsx:11` | `import { orders } from '../../data/orders'` | **No** |
| `OrderDetailsScreen.tsx:4` | `import { orders } from '../../data/orders'` | **No** |
| `CategoriesScreen.tsx:6` | `import { categories } from '../../data/categories'` | **No** |

`OrderDetailsScreen.tsx:15` goes further and performs its own lookup in the component
body:

```tsx
const order = orders.find(o => o.id === orderId);
```

**Consequence:** introducing a real orders API means editing screens, not one store. And
because two patterns coexist with nothing marking either as canonical, a new contributor
cannot tell which is intended.

---

## Where the architecture breaks down

### 1. Module resolution splits the application in two

Metro's default `sourceExts` (`js, jsx, json, ts, tsx`) resolves `.js` first; TypeScript
resolves `.ts` first. For `src/data/products` and `src/utils/theme` — the two basenames
that exist in both extensions — the toolchains load **different files**.

```text
productStore.ts:2  →  '../data/products'
                      TypeScript ⟶ src/data/products.ts  (15 clothing items)
                      Metro      ⟶ src/data/products.js  (6 electronics items)
```

This is the single most important fact about the current architecture.
Full detail: [data-flow.md](data-flow.md).

### 2. No service layer

There is no `src/services/`, no HTTP client, no `fetch` call, no base URL, no request or
response handling, no interceptor, no environment configuration. Nine data interactions
exist across the app; none of them cross a network boundary.
See [../api/current-state.md](../api/current-state.md).

### 3. No transformation layer

Fixture record shapes are used **directly** as component props. `HomeScreen.tsx:21-25`
passes `item.title`, `item.price`, `item.image` straight into `ProductCard`. There is no
mapper, adapter or DTO boundary anywhere, so whatever a future API returns must match the
fixture field names exactly or every list screen changes.

### 4. No persistence layer

No storage dependency is installed. Cart contents and login session are in-memory only
and are lost on every cold start.

### 5. Business logic duplicated across screens

| Rule | Implementations |
|---|---|
| Cart total | `cartStore.ts:66` (**unused**), `CartScreen.tsx:21`, `CheckoutScreen.tsx:19` |
| `getStatusColor` | `OrderHistoryScreen.tsx:21`, `OrderDetailsScreen.tsx:25` — byte-identical |
| Category filtering | `productStore.ts:33` (**unused**), `ProductListScreen.tsx:18` |

Each duplicated rule has a canonical implementation in a store that no screen calls.

### 6. Duplicated state ownership

`src/store/authStore.js:4` and `src/store/userStore.ts:12` each own an `isLoggedIn`
boolean with `login`/`logout` actions. Only `userStore` is wired. `authStore` — the more
obvious name — is permanently `false` and unreachable.

### 7. Duplicated type declarations

| Type | Declared in |
|---|---|
| `Product` | `src/data/products.ts:1` **and** `src/store/productStore.ts:4` — same 7 fields, verbatim |
| `CartItem` / `OrderItem` | `src/store/cartStore.ts:3` and `src/data/orders.ts:1` — structurally identical, different names, no stated relationship |

### 8. Navigation structure encoded inside a screen

`src/screens/Categories/CategoriesScreen.tsx:18-24` hardcodes the exact three-level
nesting of the navigator tree and casts it away:

```tsx
navigation.getParent()?.navigate('MainTabs', {
  screen: 'HomeStack',
  params: { screen: 'ProductList', params: { category } },
} as never);
```

Renaming or reordering any navigator in that chain breaks this call silently at runtime.

---

## Import direction — what is healthy

The dependency graph is **acyclic and one-way**:

```text
screens ──→ components ──→ utils
   │             │
   │             └────────→ store  (only DrawerHeader.tsx:3)
   ├────────→ store ───────→ data
   └────────→ data          (Pattern B, 3 screens)
```

No circular imports exist. Nothing depends upward. This is a good foundation and should
survive any future restructuring.

---

## Cross-cutting concerns

| Concern | Status |
|---|---|
| Error boundaries | NOT IMPLEMENTED |
| Loading states | NOT IMPLEMENTED — every read is synchronous |
| Error states | NOT IMPLEMENTED — only two "not found" branches exist |
| Empty states | PARTIAL — only `CartScreen.tsx` has one |
| Logging | NOT IMPLEMENTED — zero `console.*` calls in `src/` |
| Analytics | NOT IMPLEMENTED |
| Crash reporting | NOT IMPLEMENTED |
| Feature flags | NOT IMPLEMENTED |
| i18n | NOT IMPLEMENTED — `SettingsScreen` shows a static "English" row |
| Theming / dark mode | NOT IMPLEMENTED — `SettingsScreen` shows a static "Light" row |
| Accessibility | NOT IMPLEMENTED — no `accessibilityLabel`/`accessibilityRole` in `src/` |

---

## Related documents

- [application-flow.md](application-flow.md) — the same structure as user journeys
- [navigation.md](navigation.md)
- [state-management.md](state-management.md)
- [data-flow.md](data-flow.md)
- [known-issues.md](known-issues.md)
