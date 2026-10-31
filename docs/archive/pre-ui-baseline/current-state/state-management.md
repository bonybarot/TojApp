# State Management

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `src/store/*`, all consuming screens and components

---

## Library

**zustand `^4.5.2`** (`package.json` dependencies). No middleware of any kind is used:

| Middleware | Used? | Evidence |
|---|---|---|
| `persist` | **No** | no import of `zustand/middleware` anywhere in `src/` |
| `devtools` | **No** | same |
| `immer` | **No** | same |
| `subscribeWithSelector` | **No** | same |
| `combine` | **No** | same |

No React Context provider, no Redux, no MobX, no React Query / SWR, no `useReducer`.
Every store is a module-level singleton created by `create(...)` at import time.

---

## Store inventory

| Store | File | Lines | Consumers | Status |
|---|---|---|---|---|
| `useCartStore` | `src/store/cartStore.ts` | 70 | 3 screens | IMPLEMENTED |
| `useUserStore` | `src/store/userStore.ts` | 43 | 5 call sites | MOCK / PROTOTYPE |
| `useProductStore` | `src/store/productStore.ts` | 49 | 4 call sites | IMPLEMENTED (over static data) |
| `useAuthStore` | `src/store/authStore.js` | 8 | **0** | DEAD CODE |

---

## `useCartStore` — `src/store/cartStore.ts`

### Shape

```ts
export interface CartItem {          // :3-9
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartStore {                 // :11-22
  items: CartItem[];
  addToCart: (product: { id; title; price; image }) => void;   // note: no quantity
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
}
```

### Actions

| Action | Lines | Behaviour |
|---|---|---|
| `addToCart` | 26-43 | Looks up `items.find(item => item.id === product.id)`. If present, maps and returns `{ ...item, quantity: item.quantity + 1 }`. If absent, appends `{ ...product, quantity: 1 }`. |
| `removeFromCart` | 44-48 | `items.filter(item => item.id !== id)` |
| `updateQuantity` | 49-59 | `if (quantity <= 0) { get().removeFromCart(id); return; }` then maps the matching id to the new quantity |
| `clearCart` | 60-62 | `set({ items: [] })` |

### Why the audit found this store correct

This is the reference implementation in the codebase. It is documented here as the pattern
to preserve, **not** as something to change.

1. **Immutable updates throughout.** Every mutation path returns a new array
   (`.map`, `.filter`, `[...items, x]`); no element or array is mutated in place. zustand's
   reference-equality check therefore fires correctly for subscribers.
2. **`get()` used for reads, `set()` for writes.** Actions read the current state via
   `get().items` (`:27`, `:46`, `:51`, `:55`) rather than closing over a stale value.
3. **Duplicate handling is explicit.** `addToCart` does not blindly append; it increments
   an existing line (`:30-37`). This is the correct e-commerce cart semantic and it is
   handled in the store, not scattered across screens.
4. **Deletion semantics are centralised.** `updateQuantity` delegates to `removeFromCart`
   at zero (`:50-53`) instead of leaving a `quantity: 0` ghost row for the UI to filter.
   One rule, one place.
5. **No side effects in the store.** No navigation, no alerts, no I/O — actions are pure
   state transitions, so the store stays testable in isolation.
6. **Selector-based subscriptions at every consumer.** Screens subscribe to slices, not
   the whole store:
   - `CartScreen.tsx:20` — `useCartStore(state => state.items)`
   - `CartScreen.tsx:24-25` — `removeFromCart`, `updateQuantity` selected individually
   - `CheckoutScreen.tsx:18,22` — `items`, `clearCart`
   - `ProductDetailsScreen.tsx` — `addToCart` only

   A component that only needs an action does not re-render when `items` changes.
7. **The type accurately describes the contract.** `addToCart` takes a product *without*
   `quantity` and the store owns the quantity — the caller cannot get it wrong.

**Do not change this store.** Any future work (persistence, server sync) should extend it
without disturbing the above.

### Known issues in this store

| Issue | Location | Note |
|---|---|---|
| `useCartTotalPrice` is exported and imported by nothing | `:66-69` | Dead. Both `CartScreen.tsx:21-23` and `CheckoutScreen.tsx:19-21` re-implement the identical `reduce` inline instead. |
| Cart is not persisted | whole file | Closing the app empties it. See [known-issues.md](known-issues.md). |
| Cart is not cleared on logout | `userStore.ts:34-39` | The next user to log in inherits the previous cart (within the same process). |
| `CartItem` duplicates fields of `Product` | `:3-9` vs `productStore.ts:4-12` | Deliberate decoupling or accidental duplication is **UNKNOWN**. |

---

## `useUserStore` — `src/store/userStore.ts`

### Shape

```ts
export interface User {              // :3-8
  id: string; name: string; email: string; avatar?: string;
}
interface UserStore {                // :10-16
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, password: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}
```

Initial state: `user: null` (`:19`), `isLoggedIn: false` (`:20`).

### Actions

| Action | Lines | Behaviour | Status |
|---|---|---|---|
| `login` | 21-33 | Builds a hardcoded `mockUser` — `id: '1'`, `name: 'John Doe'`, the supplied `email`, `avatar: 'https://i.pravatar.cc/150?img=1'` — and sets `isLoggedIn: true`. | **MOCK / PROTOTYPE** |
| `logout` | 34-39 | `user: null`, `isLoggedIn: false` | IMPLEMENTED |
| `setUser` | 40-42 | `set({ user })` | Implemented, **zero callers** |

`userStore.ts:22` carries the author's own note: `// Mock login - in real app, this would
call an API`.

### Known issues

| Issue | Location |
|---|---|
| `password` is declared and **never read** — this is one of the 6 ESLint errors | `:21` (`21:26  error  'password' is defined but never used`) |
| Any non-empty email/password pair authenticates | `:21-33` |
| The user is always `John Doe`, whatever the sign-up form said | `:25` |
| No token, no session, no expiry, no refresh | whole file |
| Not persisted — every launch starts logged out | whole file |
| `setUser` is dead | `:40-42` |
| `isLoggedIn` is derivable from `user !== null`; two sources of truth for one fact | `:11-12` |

### Consumers

| Site | Selector |
|---|---|
| `RootNavigator.tsx:8` | `state => state.isLoggedIn` |
| `LoginScreen.tsx:16` | `state => state.login` |
| `SignupScreen.tsx:16` | `state => state.login` |
| `DrawerNavigator.tsx:32` | `state => state.logout` |
| `DrawerHeader.tsx:7` | `state => state.user` |
| `ProfileScreen.tsx:14` | `state => state.user` |
| `CheckoutScreen.tsx:23` | `state => state.user` — **selected and never used** (ESLint error `23:9`) |

---

## `useProductStore` — `src/store/productStore.ts`

### Shape

```ts
export interface Product {           // :4-12
  id: string; title: string; price: number; image: string;
  category: string; description: string; images?: string[];
}
interface ProductStore {             // :14-21
  products: Product[];
  filteredProducts: Product[];
  selectedCategory: string | null;
  loadProducts: () => void;
  filterByCategory: (category: string | null) => void;
  getProductById: (id: string) => Product | undefined;
}
```

Initial state: `products: []`, `filteredProducts: []`, `selectedCategory: null` (`:24-26`).

### Actions

| Action | Lines | Behaviour | Status |
|---|---|---|---|
| `loadProducts` | 27-32 | Copies the statically-imported `products` (`:2`) into both `products` and `filteredProducts`. Synchronous, no loading/error state. | IMPLEMENTED |
| `filterByCategory` | 33-45 | `null` resets to the full list; otherwise filters by `p.category === category` and records `selectedCategory`. | **DEAD — zero callers** |
| `getProductById` | 46-48 | `get().products.find(p => p.id === id)` | IMPLEMENTED |

### Known issues

| # | Issue | Evidence |
|---|---|---|
| 1 | **`filterByCategory` is never called.** `ProductListScreen.tsx:18-23` re-implements the same filter inline against `state.products` instead. `selectedCategory` therefore never leaves `null`. | grep for `filterByCategory` — one definition, no call sites |
| 2 | The `Product` interface duplicates the one in `src/data/products.ts`; there is no shared type | `productStore.ts:4-12` |
| 3 | `products` and `filteredProducts` hold the **same array reference** after `loadProducts` | `:29-30` |
| 4 | The `import { products } from '../data/products'` at `:2` resolves to a **different file** under Metro than under TypeScript | see [data-flow.md](data-flow.md) |
| 5 | No loading, error or "loaded" flag — nothing distinguishes "not yet loaded" from "loaded, empty" | `:23-26` |

### Consumers

| Site | Selector |
|---|---|
| `RootNavigator.tsx:9` | `state => state.loadProducts` |
| `HomeScreen.tsx:14` | `state => state.filteredProducts` |
| `ProductListScreen.tsx:18-23` | `state => state.products.filter(...)` — **filters inside the selector** |
| `ProductDetailsScreen.tsx:24` | `state => state.getProductById` |

> **KNOWN ISSUE** — `ProductListScreen.tsx:18-23` returns a **new array from the selector on
> every store notification**. zustand v4 compares with `Object.is`, so the new reference
> never equals the previous one and the screen re-renders on every store change regardless
> of whether the filtered result differed.

---

## `useAuthStore` — `src/store/authStore.js`

```js
export const useAuthStore = create((set) => ({
  isLoggedIn: false,
  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),
}));
```

**DEAD CODE.** Nothing imports `authStore`. It is a plain-JS, untyped precursor of the
`isLoggedIn` half of `useUserStore`, and it is the only remaining `.js` file in
`src/store/`. Because the two stores are independent zustand instances, if it were ever
wired up alongside `useUserStore` the app would hold two disagreeing login flags.

---

## Local component state

`useState` is used for genuinely local, ephemeral concerns only:

| Screen | State | Lines |
|---|---|---|
| `LoginScreen` | `email`, `password` | 13-14 |
| `SignupScreen` | `name`, `email`, `password`, `confirmPassword` | 12-15 |
| `CheckoutScreen` | `address` object (`country` defaults to `'USA'`) | 25-31 |
| `SettingsScreen` | `notificationsEnabled`, `darkModeEnabled` | 13-14 |

No `useReducer`, no `useContext`, no custom hooks — `src/hooks/` does not exist.

> **KNOWN ISSUE** — `SettingsScreen`'s two switches are pure local state. Nothing reads
> them, and toggling dark mode changes nothing (there is no dark theme). They reset on
> unmount.

---

## Server state

**NOT IMPLEMENTED.** There is no server. No `fetch`, no `axios`, no React Query, no cache,
no revalidation. Every "data" read is a synchronous module import. See
[../api/current-state.md](../api/current-state.md).

## Persistence

**NOT IMPLEMENTED.** No `AsyncStorage`, no MMKV, no SQLite, no `zustand/persist`, no
Keychain/Keystore. All state is in memory and dies with the process. Consequences:

- Login does not survive a relaunch.
- The cart does not survive a relaunch.
- Settings toggles do not survive a screen unmount.

## State that exists but is not owned by a store

| Data | Where it lives | Read by |
|---|---|---|
| Orders | `src/data/orders.ts` (static module) | `OrderHistoryScreen.tsx:11`, `OrderDetailsScreen.tsx:4` |
| Categories | `src/data/categories.ts` (static module) | `CategoriesScreen.tsx:6` |

These bypass the store layer entirely. See "Pattern A vs Pattern B" in
[architecture.md](architecture.md).

---

## Summary table

| Concern | Owner | Status |
|---|---|---|
| Cart | `useCartStore` | IMPLEMENTED — correct |
| Session / user | `useUserStore` | MOCK / PROTOTYPE |
| Product catalogue | `useProductStore` | IMPLEMENTED over static data |
| Category filter | *nobody* — inline in `ProductListScreen` | KNOWN ISSUE |
| Orders | *nobody* — direct module import | KNOWN ISSUE |
| Categories | *nobody* — direct module import | KNOWN ISSUE |
| Settings | local `useState` | NOT IMPLEMENTED (no effect) |
| Persistence | — | NOT IMPLEMENTED |
| Server state | — | NOT IMPLEMENTED |

---

## Related documents

- [architecture.md](architecture.md)
- [data-flow.md](data-flow.md)
- [known-issues.md](known-issues.md)
