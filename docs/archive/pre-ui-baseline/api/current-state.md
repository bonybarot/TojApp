# API — Current State

**API status: NOT IMPLEMENTED**

Last Verified: 2026-09-03
Source: whole repository — verified by absence

---

## Summary

The application makes **no API calls of any kind**. There is no backend, no client, no
endpoint constant, no base URL, no authentication token, and no networking layer.

Every piece of data the app displays is a hardcoded JavaScript array compiled into the
bundle.

---

## Evidence of absence

Each of these was run against the repository on 2026-09-03:

| Check | Result |
|---|---|
| `grep -rn "fetch(" src/` | 0 matches |
| `grep -rn "axios" src/` | 0 matches |
| `grep -rn "XMLHttpRequest" src/` | 0 matches |
| `grep -rn "WebSocket" src/` | 0 matches |
| `grep -rn "\.env" src/` | 0 matches |
| HTTP client in `package.json` | none — no `axios`, no `ky`, no `got` |
| Data-fetching library | none — no `@tanstack/react-query`, no `swr`, no `apollo`, no `urql` |
| GraphQL | none — no `graphql` dependency, no `.graphql` files |
| `src/api/`, `src/services/`, `src/repositories/` | do not exist |
| `.env`, `.env.example` | do not exist |
| Base URL or endpoint constant anywhere | none |

The only network activity the app performs is loading remote images — 24 distinct HTTPS
URLs across `images.unsplash.com` and `i.pravatar.cc`, rendered by React Native's `<Image>`
component. See [../current-state/security.md](../current-state/security.md).

---

## Mock data sources

These files stand in for what a server would otherwise supply.

| File | Lines | Shape | Consumed by | Notes |
|---|---|---|---|---|
| `src/data/products.ts` | 15 items | `{ id: string, title, price, image, category, description, images? }` | `productStore.ts:2` — **as TypeScript sees it** | Clothing: Tops ×5, Bottoms ×5, Outerwear ×5 |
| `src/data/products.js` | 6 items | `{ id: number, name, price, description, image }` | `productStore.ts:2` — **as Metro actually bundles it** | Electronics. No `category`, no `title` |
| `src/data/categories.ts` | 8 items | `{ id, title, image }` | `CategoriesScreen.tsx:6` — direct import | 5 of the 8 match no product even in `products.ts` |
| `src/data/orders.ts` | 4 orders | `{ id, date, status, total, items[], shippingAddress, paymentMethod }` | `OrderHistoryScreen.tsx:11`, `OrderDetailsScreen.tsx:4` — direct imports | No `.js` twin; unambiguous |
| `src/data/history.js` | 4 records | `{ id: number, name, date, price, image }` | `HistoryScreen.js:5` — **unreachable** | Dead code |
| fabricated in code | 1 user | `{ id: '1', name: 'John Doe', email, avatar }` | `userStore.ts:23-28` | Not a file — constructed inside the mock `login` action |

**`src/data/products.js` and `src/data/products.ts` both answer the import specifier
`'../data/products'`, and Metro resolves the `.js`.** This is the single most consequential
fact about the data layer. Full explanation:
[../current-state/data-flow.md](../current-state/data-flow.md).

---

## Operations that would need a server, and what they do instead

| Operation | Where the user triggers it | What actually happens |
|---|---|---|
| Log in | `LoginScreen.tsx:27` | `userStore.login` fabricates a user object. The password is never read (`userStore.ts:21`) |
| Sign up | `SignupScreen.tsx:35` | Calls the same `login` action. The entered name is discarded |
| Log out | `DrawerNavigator.tsx:34` | Sets `user = null`, `isLoggedIn = false`. No server call, no token revocation |
| Load products | `RootNavigator.tsx:12` | `loadProducts()` copies a module-level array into the store (`productStore.ts:27-32`) |
| Filter by category | `ProductListScreen.tsx:18-23` | `Array.prototype.filter` over the in-memory array |
| Add to cart | `ProductDetailsScreen.tsx:37-42` | Mutates a zustand store in memory |
| Place an order | `CheckoutScreen.tsx:33-54` | Shows `Alert.alert('Success', 'Your order has been placed!')`, clears the cart, and goes back. **No order record is created anywhere** |
| Load order history | `OrderHistoryScreen.tsx:11` | Imports the 4 hardcoded orders |
| Change a setting | `SettingsScreen.tsx:13-14` | Two local `useState` booleans that nothing reads |

The codebase contains exactly four comments acknowledging this, all of the same form:

| Comment | Location |
|---|---|
| `// Mock login - in real app, this would call an API` | `src/store/userStore.ts:22` |
| `// Mock login - in real app, this would validate with backend` | `src/screens/auth/LoginScreen.tsx:26` |
| `// Mock signup - in real app, this would create account via API` | `src/screens/auth/SignupScreen.tsx:33` |
| `// In a real app, this would create an order via API` | `src/screens/Cart/CheckoutScreen.tsx:44` |

---

## Supporting infrastructure that also does not exist

| Concern | Status |
|---|---|
| Environment configuration | **NOT IMPLEMENTED** — no `.env`, no `react-native-config`, no build-variant config |
| Secrets management | **NOT IMPLEMENTED** — no secrets exist because nothing authenticates |
| Token storage | **NOT IMPLEMENTED** — no keychain, no `AsyncStorage`, no `MMKV` |
| Request/response types | **NOT IMPLEMENTED** — no DTOs; the `Product` interface is declared twice independently (`products.ts:1-9` and `productStore.ts:4-12`) |
| Error model | **NOT IMPLEMENTED** — 0 `try`/`catch` in `src/`; no error boundary |
| Loading states | **NOT IMPLEMENTED** — no screen has one |
| Retry / offline handling | **NOT IMPLEMENTED** — no `@react-native-community/netinfo` |
| Caching | **NOT IMPLEMENTED** — remote images are re-fetched; no `react-native-fast-image` |
| Logging / telemetry | **NOT IMPLEMENTED** — 0 `console.*` calls in `src/`, no crash reporter, no analytics |
| API mocking for tests | **NOT IMPLEMENTED** — no MSW, no fixtures, and no tests execute at all (see [../current-state/testing.md](../current-state/testing.md)) |

---

## Future API

**NOT YET DECIDED.**

No endpoints are proposed here. No transport, protocol, provider, schema, authentication
scheme, or data model for a future backend has been chosen. Designing that is the next
phase of work, after the current-state documentation is reviewed — see
[../../../decisions/README.md](../../../decisions/README.md).

---

## Related

- [../current-state/data-flow.md](../current-state/data-flow.md) — where the mock data comes from and how it breaks
- [../current-state/state-management.md](../current-state/state-management.md) — the stores that hold it
- [../current-state/security.md](../current-state/security.md) — transport and secrets
- [../features/checkout.md](../features/checkout.md), [../features/authentication.md](../features/authentication.md) — the two flows most affected
