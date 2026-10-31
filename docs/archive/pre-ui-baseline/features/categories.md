# Feature: Categories

Status: **IMPLEMENTED (against mock data) — every category leads to an empty list at runtime**
Last Verified: 2026-09-03
Source: `src/screens/Categories/CategoriesScreen.tsx`, `src/data/categories.ts`, `src/components/CategoryCard.tsx`

---

## Purpose

A two-column grid of category tiles that jumps the user into the filtered product list.

---

## User Flow

```text
Drawer → Categories
  └─ 2-column grid of 8 CategoryCards (image + dark overlay + centred title)
       └─ tap → getParent()?.navigate('MainTabs', {
                   screen: 'HomeStack',
                   params: { screen: 'ProductList', params: { category: item.title } },
                 } as never)
            └─ the drawer closes, the tab bar reappears, ProductList opens
```

The tap **leaves the drawer's own screen stack** and lands in a different navigator branch.
That cross-navigator jump is the most intricate piece of navigation in the app.

---

## Entry Points

| Entry | Location |
|---|---|
| Drawer item "Categories" | `src/navigation/DrawerNavigator.tsx:71-75` |

Categories is **only** in the drawer — it has no tab and no link from Home.

---

## Screens

| Screen | File | Route |
|---|---|---|
| Categories | `src/screens/Categories/CategoriesScreen.tsx` (64 lines) | `Drawer` → `Categories` |

`options={{ title: 'Categories', headerShown: true }}` (`DrawerNavigator.tsx:74`), so this
screen does have a header with a title.

---

## Components

| Component | Usage |
|---|---|
| `CategoryCard` | `CategoriesScreen.tsx:28-33` — `id`, `title`, `image`, `onPress` |

See [../components/CategoryCard.md](../components/CategoryCard.md).

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useNavigation<CategoriesScreenNavigationProp>()` | `:14` | Typed against **`HomeStackParamList`** — the wrong ParamList. This screen lives in the drawer, not in `HomeStack`. The `as never` at `:24` exists to silence the resulting error |

---

## State

None. No store is involved at all.

---

## Data

`import { categories } from '../../data/categories';` (`:6`) — a **direct module import**,
bypassing any store. There is no `categoryStore`.

`src/data/categories.ts` declares 8 categories. Cross-referenced against
`src/data/products.ts`, only three of the eight have any products:

| Category | Products in `products.ts` | Products in `products.js` (runtime) |
|---|---|---|
| Tops | 5 | 0 |
| Bottoms | 5 | 0 |
| Outerwear | 5 | 0 |
| the other 5 | 0 | 0 |

At runtime `products.js` has no `category` field at all, so **all eight tiles lead to an
empty grid** (issue DATA-03). Even in the `.ts` catalogue, five of eight are empty
(issue DATA-07).

---

## Business Logic

| Rule | Where |
|---|---|
| The category's **title** is passed as the filter value, not its `id` | `:32` — `handleCategoryPress(item.title)` |
| The target navigator path is hardcoded three levels deep | `:18-24` |

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.**

## Error Handling

None. `getParent()` is called with optional chaining (`:18`), so if there were no parent
navigator the tap would silently do nothing rather than throw.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Category with no products | Navigates anyway; the destination shows the category name over a blank grid |
| `getParent()` returns `undefined` | Silent no-op |
| Category image fails to load | The dark overlay and the title still render over a blank box |
| Odd number of categories | 8 is even; a 9th would sit alone on the last row |

---

## Dependencies

`react-native`, `@react-navigation/native`, `@react-navigation/native-stack` (for the type
only).

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-03 | P1 | Every category yields an empty product list at runtime |
| DATA-07 | P2 | 5 of 8 categories are empty even in the TypeScript catalogue |
| NAV-03 | P2 | `as never` cast at `:24` |
| NAV-04 | P2 | The nested navigator structure is hardcoded inside a screen |
| APP-05 | P2 | Category data bypasses the store layer |
| QUAL-05 | P3 | `CategoryCard` receives an `id` it never reads |
| APP-13 | P3 | `{ item: any }` at `:27` |
| — | P3 | The navigation hook is typed against `HomeStackParamList`, which does not describe this screen |

---

## Related Features

- [product-browsing.md](product-browsing.md) — the destination
- [drawer.md](drawer.md) — the only entry point

---

## Source Files

`src/screens/Categories/CategoriesScreen.tsx`, `src/components/CategoryCard.tsx`,
`src/data/categories.ts`, `src/navigation/DrawerNavigator.tsx`.

---

## Current Limitations

1. Flat list — no subcategories or hierarchy.
2. No product counts on the tiles.
3. Not reachable from Home.
4. Category images are remote URLs with no caching or placeholder.

---

## Unknowns

- Whether categories should be a taxonomy with ids and slugs — **NOT YET DECIDED**.
- Whether the 8 categories are the intended catalogue — **UNKNOWN**; they do not match the
  products in either data file.
