# Feature: Purchase History (abandoned)

Status: **NOT IMPLEMENTED / UNREACHABLE — dead code**
Last Verified: 2026-09-03
Source: `src/screens/History/`, `src/components/HistoryItem.js`, `src/data/history.js`

---

## Status

An earlier, parallel attempt at an order-history feature. **None of it is registered in any
navigator and none of it is imported by any live screen.** It is documented here so that a
future reader knows it exists, knows it is not running, and does not mistake it for the
current order-history feature.

The live feature is [order-history.md](order-history.md).

---

## Purpose

As written: list past purchases with an image, product name, date and price.

---

## User Flow

**None.** There is no route to any of these files. `git grep` finds no navigator entry and
no screen importing them.

---

## Entry Points

**None.** `RouteNavigator.History = 'History'` exists as an enum member in
`src/navigation/StackKeys.tsx:5`, but that enum has no consumers either (issue DEAD-04).

---

## Screens

| File | Lines | Content |
|---|---|---|
| `src/screens/History/HistoryScreen.js` | 33 | A working implementation — `SafeAreaView` + `FlatList` of `HistoryItem`, fed by `history` |
| `src/screens/History/index.tsx` | 12 | A different, unrelated stub that renders `<Text>HistoryScreen</Text>` |

Both export a default named `HistoryScreen`. **`index.tsx` and `HistoryScreen.js` are two
different components with the same name in the same folder.** An import of
`'../../screens/History'` would resolve to `index.tsx`; an import of
`'../../screens/History/HistoryScreen'` would resolve to the `.js`. Neither import exists.

`index.tsx` is also the file with the most visible Prettier drift in the repository — no
semicolons and no trailing newline (`index.tsx:12`).

---

## Components

| File | Lines | Notes |
|---|---|---|
| `src/components/HistoryItem.js` | 61 | Renders `item.image`, `item.name`, `item.date`, `item.price`. Imported **only** by `HistoryScreen.js`, which is itself unreachable |

`HistoryItem.js` is the **only** component in `src/components/` that is not TypeScript. It
is also the only file anywhere in `src/` that reads `colors.secondary` (`:50`) — that token
is defined in both `theme.js` and `theme.ts`, and this dead file is its single consumer.

---

## Hooks

None.

---

## State

None.

---

## Data

`src/data/history.js` (30 lines) — 4 purchase records, electronics, with `id` (number),
`name`, `date`, `price` and `image`.

These records use `name`, matching `products.js` and **not** matching the `title` used by
`products.ts`, `orders.ts` and `cartStore.ts`. The whole `.js` layer of this project
consistently uses `name`; the whole `.ts` layer consistently uses `title`. See
[../current-state/data-flow.md](../current-state/data-flow.md).

---

## Business Logic

None beyond `item.price.toFixed(2)` (`HistoryItem.js:12`) and
`keyExtractor={(item) => item.id.toString()}` (`HistoryScreen.js:14`) — note that this dead
screen is the **only** `FlatList` in the repository that correctly converts its key to a
string.

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.**

## Error Handling

None.

---

## Edge Cases

Not applicable — the code never executes.

---

## Dependencies

`react-native`, `react-native-safe-area-context`.

`HistoryScreen.js:3` is the **only** file in the entire repository that imports
`SafeAreaView` from `react-native-safe-area-context` — and it never runs. `App.tsx:13`
installs `SafeAreaProvider`, but no live screen consumes an inset, so content on notched
devices is laid out without safe-area padding.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DEAD-01 | P2 | Four unreachable files: `History/HistoryScreen.js`, `History/index.tsx`, `components/HistoryItem.js`, `data/history.js` |
| QUAL-03 | P2 | `HistoryScreen.js:2:10` — unused `View` import, one of the 2 ESLint warnings |
| DEAD-04 | P3 | `RouteNavigator.History` enum member with no consumer |
| QUAL-10 | P3 | `index.tsx` has no semicolons and no trailing newline; Prettier is never run, so nothing reports it |
| — | P3 | Two different components named `HistoryScreen` in one folder |

---

## Related Features

- [order-history.md](order-history.md) — the live feature that supersedes this

---

## Source Files

| File | Status |
|---|---|
| `src/screens/History/HistoryScreen.js` | dead |
| `src/screens/History/index.tsx` | dead |
| `src/components/HistoryItem.js` | dead |
| `src/data/history.js` | dead |

---

## Current Limitations

The feature does not run. Nothing about it is usable as-is.

---

## Unknowns

- Whether this was an abandoned first attempt or an intended future screen —
  **UNKNOWN**. Both `src/data/history.js` and `src/data/orders.ts` were added in the same
  commit (`c19596a`), so the duplication was introduced deliberately or by a merge, not by
  gradual drift.
- Whether it should be deleted — **NOT YET DECIDED**. It is listed for removal in the
  suspended cleanup pass, which the user paused in favour of documenting first.
