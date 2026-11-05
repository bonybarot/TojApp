# Feature: Product Browsing (Filtered Product List)

Status: **IMPLEMENTED (against mock data) — filtering produces no results at runtime**
Last Verified: 2026-09-03
Source: `src/screens/Home/ProductListScreen.tsx`, `src/store/productStore.ts`

---

## Status

The screen and its filter are implemented. Under the data Metro actually bundles, **the
filter always matches zero products**, because the runtime products have no `category`
field at all.

---

## Purpose

Show a subset of products for one category, reached from the Categories screen.

---

## User Flow

```text
Drawer → Categories → tap a category card
  └─ CategoriesScreen.handleCategoryPress(item.title)
       └─ navigation.getParent()?.navigate('MainTabs', {
            screen: 'HomeStack',
            params: { screen: 'ProductList', params: { category: <title> } },
          } as never)
            └─ HomeStack → ProductList
                 ├─ header band showing the category name (only when a category was passed)
                 └─ two-column grid of products where p.category === category
                      └─ tap a card → ProductDetails
```

`ProductList` can also be reached with no params at all — `route.params || {}`
(`ProductListScreen.tsx:17`) handles that and shows every product with no header band. No
code currently navigates there without params.

---

## Entry Points

| Entry | Location |
|---|---|
| Category tap | `src/screens/Categories/CategoriesScreen.tsx:16-25` |
| Route registration | `src/navigation/HomeStack.tsx:23` |

---

## Screens

| Screen | File | Route |
|---|---|---|
| ProductList | `src/screens/Home/ProductListScreen.tsx` (~75 lines) | `HomeStack` → `ProductList` |

---

## Components

`ProductCard` (`ProductListScreen.tsx:30-36`) — identical usage to Home.

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useRoute<ProductListRouteProp>()` | `:15` | Typed against an **anonymous inline** `RouteProp` (`:9-12`) rather than `HomeStackParamList` — issue NAV-07 |
| `useNavigation<NativeStackNavigationProp<any>>()` | `:16` | Typed as `any`; `navigate('ProductDetails', …)` is therefore unchecked |
| `useProductStore(selector)` | `:18-23` | **Allocating selector** — see below |

### The allocating selector

```ts
const products = useProductStore(state => {
  if (category) {
    return state.products.filter(p => p.category === category);   // :20  new array every call
  }
  return state.products;
});
```

zustand compares selector results with `Object.is`. `filter` returns a **new array
reference every time the store notifies**, so when a category is set this component
re-renders on every store update regardless of whether the result changed. Today the store
never updates after `loadProducts()`, so there is no visible symptom — it becomes one the
moment the store gains a real update path. Recorded as a performance issue in
[../current-state/performance.md](../current-state/performance.md).

---

## State

No local state. `category` comes from route params; the product list is derived in the
selector.

Note that this screen reads `state.products`, while Home reads `state.filteredProducts`.
Both currently hold the same array (`productStore.ts:29-30`).

---

## Data

Same dual-resolution problem as Home. The decisive difference here:

| Resolver | `category` field present? | Filter result |
|---|---|---|
| `products.ts` (what TypeScript sees) | yes — `Tops` ×5, `Bottoms` ×5, `Outerwear` ×5 | 5 matches for those three names, 0 for the other five categories |
| `products.js` (what Metro bundles) | **no such field** | `p.category` is `undefined` for all 6 items, so **every category yields an empty grid** |

There is no empty state, so the user sees the category name in the header band and nothing
below it.

---

## Business Logic

| Rule | Where |
|---|---|
| Filter by exact category string equality | `:20` — `p.category === category` |
| No category param means show everything | `:17`, `:22` |
| Header band renders only when a category is set | `:41-45` |

Matching is case-sensitive, exact-string, and compares the category **title** (not an id) —
`CategoriesScreen.tsx:32` passes `item.title`.

---

## API

**NOT IMPLEMENTED.**

---

## Persistence

**NOT IMPLEMENTED.**

---

## Error Handling

None. No empty state, no error state.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Category with no matching products | Header band + blank grid, silently |
| Navigating with no params | Shows all products, no header band |
| Category name whose casing differs from the product's | No match — comparison is exact |
| Store updates while a category is set | Re-render on every notification (allocating selector) |

---

## Dependencies

`react-native`, `@react-navigation/native`, `@react-navigation/native-stack`, `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-03 | P1 | Runtime products have no `category`, so every filter yields nothing |
| NAV-07 | P2 | Anonymous inline `RouteProp` instead of `HomeStackParamList` |
| NAV-08 | P3 | `NativeStackNavigationProp<any>` defeats route type-checking |
| — | P2 | Allocating selector re-renders on every store notification — see [../current-state/performance.md](../current-state/performance.md) |
| APP-10 | P3 | No empty state for a category with no products |
| APP-13 | P3 | `{ item: any }` at `:29` |
| — | P3 | Reads `state.products` while Home reads `state.filteredProducts` — two sources for the same list |

---

## Related Features

- [categories.md](categories.md) — the only entry point
- [home.md](home.md) — the unfiltered grid
- [product-details.md](product-details.md) — the navigation target

---

## Source Files

`src/screens/Home/ProductListScreen.tsx`, `src/components/ProductCard.tsx`,
`src/store/productStore.ts`, `src/navigation/HomeStack.tsx`.

---

## Current Limitations

1. One filter dimension only (category), and it is a raw string.
2. No price, size, colour, rating or availability filters.
3. No sorting.
4. No result count.
5. No empty state.
6. `filterByCategory` exists in the store (`productStore.ts:33-45`) but **nothing calls it** —
   this screen filters locally instead (issue DEAD-02).

---

## Unknowns

- Whether category should be an id or a display name — **NOT YET DECIDED**.
- Whether filtering belongs in the store, the screen, or a future server query —
  **NOT YET DECIDED**.
