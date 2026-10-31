# Components

Status: Current state as of 2026-09-03
Last Verified: 2026-09-03
Source: `src/components/`

---

## Inventory

`src/components/` holds four files. Three are live; one is dead.

| Component | File | Language | Used by | Status |
|---|---|---|---|---|
| [`ProductCard`](ProductCard.md) | `src/components/ProductCard.tsx` | TypeScript | `HomeScreen`, `ProductListScreen` | Live |
| [`CategoryCard`](CategoryCard.md) | `src/components/CategoryCard.tsx` | TypeScript | `CategoriesScreen` | Live |
| [`DrawerHeader`](DrawerHeader.md) | `src/components/DrawerHeader.tsx` | TypeScript | `DrawerNavigator` | Live |
| `HistoryItem` | `src/components/HistoryItem.js` | JavaScript | `HistoryScreen.js` only — which is itself unreachable | **Dead** (issue DEAD-01) |

`HistoryItem` is documented as part of
[../features/purchase-history-abandoned.md](../features/purchase-history-abandoned.md)
rather than getting its own page, because it is not part of the running application.

---

## What is NOT a component

Everything else in the UI is inline JSX inside a screen. There is no shared:

| Missing | Consequence |
|---|---|
| `Button` | Every screen re-declares its own `TouchableOpacity` + `StyleSheet` button. `LoginScreen.tsx:55-57`, `SignupScreen.tsx:80-82`, `CartScreen.tsx:85-90`, `CheckoutScreen.tsx:115-120`, `ProductDetailsScreen.tsx:56-61` are five independent implementations of the same visual button |
| `Input` / `TextField` | Six identical `TextInput` blocks across the two auth screens, five more in checkout |
| `Card` | `orderCard`, `itemContainer`, `container` in three screens repeat the same `backgroundColor: colors.card` + `borderRadius: 8` + `padding: 16` |
| `StatusBadge` | `getStatusColor` is duplicated byte-for-byte in `OrderHistoryScreen.tsx:21-36` and `OrderDetailsScreen.tsx:25-40` (issue APP-06) |
| `EmptyState` | Only the cart has one (`CartScreen.tsx:64-70`); four other lists have none (issue APP-10) |
| `Screen` / layout wrapper | Every screen re-declares `container: { flex: 1, backgroundColor: colors.background }` |
| `ErrorBoundary` | None anywhere (issue APP-09) |

18 files call `StyleSheet.create`. There are 0 inline `style={{ … }}` object literals in the
codebase — styling discipline is consistent even where the abstractions are missing.

---

## Conventions actually followed

Observed, not prescribed — these are patterns the existing code holds to:

| Convention | Evidence |
|---|---|
| Components are **named** exports; screens are **default** exports | `export const ProductCard` vs `export default HomeScreen` |
| Props are a local `interface XProps` above the component | `ProductCard.tsx:5-11`, `CategoryCard.tsx:5-10` |
| Typed as `React.FC<XProps>` | `ProductCard.tsx:13`, `CategoryCard.tsx:12`, `DrawerHeader.tsx:6` |
| Styles live in a `StyleSheet.create` at the bottom of the same file | all four files |
| Colours come from `import { colors } from '../utils/theme'` | all four files |
| Spacing, font sizes and radii are **hardcoded numbers**, not tokens | `theme.ts` exports `spacing`, `typography` and `borderRadius`; **zero files import them** (issue DATA-08) |
| No memoisation | 0 occurrences of `React.memo`, `useMemo` or `useCallback` in the repository |
| No accessibility props | 0 occurrences of `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` or `accessible` (issue APP-15) |
| No `testID` | 0 occurrences |

---

## The `id` prop pattern

Both card components declare an `id` prop, accept it, and never use it:

- `ProductCard.tsx:6` declares it, `:14` destructures it, the body never reads it
- `CategoryCard.tsx:6` declares it, `:13` destructures it, the body never reads it

These are 2 of the 6 ESLint errors (issue QUAL-05). Callers pass `id={item.id}`
(`HomeScreen.tsx:22`, `ProductListScreen.tsx:31`, `CategoriesScreen.tsx:29`) and separately
close over the same value in `onPress`.

---

## Known issues affecting all components

| ID | Severity | Issue |
|---|---|---|
| DATA-04 | P1 | `theme.js` shadows `theme.ts`; 51 of the 146 colour references in the app resolve to `undefined` |
| DATA-08 | P3 | `spacing`, `typography`, `borderRadius` have zero importers |
| QUAL-05 | P3 | Unused `id` prop on both cards |
| APP-15 | P3 | No accessibility support |
| — | P3 | No `testID` anywhere; no component has a test |

---

## Related

- [../current-state/data-flow.md](../current-state/data-flow.md) — the theme shadowing defect
- [../current-state/performance.md](../current-state/performance.md) — memoisation
- [../../../development/coding-standards.md](../../../development/coding-standards.md) — the conventions above, restated as what the codebase does today
