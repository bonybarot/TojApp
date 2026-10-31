# Feature: Home (Product Grid)

Status: **IMPLEMENTED (against mock data)**
Last Verified: 2026-09-03
Source: `src/screens/Home/HomeScreen.tsx`, `src/store/productStore.ts`, `src/navigation/HomeStack.tsx`

---

## Status

**IMPLEMENTED**, in the sense that the screen renders and navigates correctly. What it
renders is a hardcoded array, and **which** array depends on the bundler — see
[../current-state/data-flow.md](../current-state/data-flow.md).

---

## Purpose

The landing screen after login. Shows every product in a two-column grid; tapping one opens
its details.

---

## User Flow

```text
Login succeeds → DrawerNavigator → MainTabs → HomeStack → Home
  └─ two-column FlatList of every product in productStore.filteredProducts
      └─ tap a card → navigate('ProductDetails', { productId: item.id })
```

There is no search, no sort, no filter control, no pull-to-refresh, no pagination and no
"featured" section on this screen.

---

## Entry Points

| Entry | Location |
|---|---|
| Default screen of `HomeStack` | `src/navigation/HomeStack.tsx:22` |
| Default tab of `MainTabs` | `src/navigation/MainTabs.tsx:29-35` (label "Home") |
| Drawer item "Home" | `src/navigation/DrawerNavigator.tsx:66-70` |

---

## Screens

| Screen | File | Route |
|---|---|---|
| Home | `src/screens/Home/HomeScreen.tsx` (~60 lines) | `HomeStack` → `Home` |

`headerShown: false` on `HomeStack` (`HomeStack.tsx:19`), so the only header visible is the
drawer's (`DrawerNavigator.tsx:69` sets `title: ''` — the header bar renders with an empty
title and just the hamburger).

---

## Components

| Component | Usage |
|---|---|
| `ProductCard` | `HomeScreen.tsx:21-27` — receives `id`, `title`, `price`, `image`, `onPress` |

See [../components/ProductCard.md](../components/ProductCard.md).

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useNavigation<HomeScreenNavigationProp>()` | `:13` | **Correctly typed** against `HomeStackParamList` — one of only four typed navigators in the app |
| `useProductStore(state => state.filteredProducts)` | `:14` | Stable reference selector; does not over-render |

---

## State

Read-only. No local state at all. The screen is a pure projection of
`useProductStore().filteredProducts`.

`filteredProducts` is populated once, at app start, by `loadProducts()` called from
`RootNavigator.tsx:11-13`.

---

## Data

`productStore.ts:2` imports `products` from `../data/products`. Two files answer that
specifier:

| Resolver | File resolved | Items rendered |
|---|---|---|
| TypeScript | `src/data/products.ts` | 15 clothing items with `title` and `category` |
| Metro (runtime) | `src/data/products.js` | 6 electronics with `name` and no `category` |

Metro wins at runtime because `metro.config.js` inherits `sourceExts: js,jsx,json,ts,tsx`.
So the grid a user actually sees is **6 electronics products with blank titles**, because
`ProductCard` is given `item.title` (`HomeScreen.tsx:23`) and `products.js` has no `title`
field — only `name`.

This is issue DATA-01/DATA-02. Full explanation:
[../current-state/data-flow.md](../current-state/data-flow.md).

---

## Business Logic

None. The screen applies no filtering, sorting, or transformation. `filteredProducts` is
whatever `loadProducts()` set it to, which is the entire array.

---

## API

**NOT IMPLEMENTED.** No fetch, no loading state, no retry. See
[../api/current-state.md](../api/current-state.md).

---

## Persistence

**NOT IMPLEMENTED.** Nothing is cached; the array is re-created from the module on every
cold start.

---

## Error Handling

None. There is no error state, no error boundary, and no empty state — an empty
`filteredProducts` renders a blank screen with no message.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| `filteredProducts` empty | Blank white area, no message (`ListEmptyComponent` is not set) |
| Product image URL fails to load | Blank image box; no placeholder, no `onError` |
| Product has no `title` (the runtime case) | `ProductCard` renders an empty `<Text>` — the card shows an image and a price only |
| Odd number of products | Last row has one card at `width: '48%'`, left-aligned by `columnWrapperStyle: { justifyContent: 'space-between' }` |
| `keyExtractor` returns a number | Under `products.js`, `item.id` is a `number`; `keyExtractor` must return a string. React Native warns rather than crashes (issue DATA-06) |
| Very long product list | No `initialNumToRender`, `windowSize`, `maxToRenderPerBatch` or `getItemLayout` — see [../current-state/performance.md](../current-state/performance.md) |

---

## Dependencies

`react-native` (`FlatList`, `View`), `@react-navigation/native`,
`@react-navigation/native-stack`, `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-01 | P1 | `products.js` shadows `products.ts` at runtime |
| DATA-02 | P1 | Blank card titles — `name` vs `title` |
| DATA-06 | P2 | `keyExtractor` returns a number under the runtime data |
| — | P2 | No `FlatList` tuning props, no memoised `renderItem` — see [../current-state/performance.md](../current-state/performance.md) |
| APP-10 | P3 | No empty state |
| APP-13 | P3 | `renderItem` is typed `{ item: any }` (`:20`) — one of 6 explicit `any` in the codebase |
| QUAL-05 | P3 | `ProductCard` receives an `id` prop it never reads |

---

## Related Features

- [product-details.md](product-details.md) — the navigation target
- [product-browsing.md](product-browsing.md) — the filtered variant of this same grid
- [categories.md](categories.md) — the other entry into `ProductList`

---

## Source Files

| File | Role |
|---|---|
| `src/screens/Home/HomeScreen.tsx` | The screen |
| `src/components/ProductCard.tsx` | The grid cell |
| `src/store/productStore.ts` | The data source |
| `src/navigation/HomeStack.tsx` | Route registration |

---

## Current Limitations

1. No search.
2. No sort or filter controls.
3. No pull-to-refresh.
4. No pagination or infinite scroll.
5. No sections (featured / new / recommended).
6. No wishlist or quick-add-to-cart from the grid.
7. No skeleton or loading state.
8. No accessibility labels on the cards.

---

## Unknowns

- Whether Home should be a plain grid or a merchandised homepage — **NOT YET DECIDED**.
- Whether products should be paginated from a server — **NOT YET DECIDED**.
