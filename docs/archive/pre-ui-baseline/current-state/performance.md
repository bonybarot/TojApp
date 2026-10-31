# Performance

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: static reading of `src/`, `android/gradle.properties`, `ios/TojApp/Info.plist`

> **No profiling was performed.** Nothing in this document is a measurement. Every entry is
> a structural observation from reading the code. Where a claim would require a measurement,
> it is marked **UNKNOWN**. Nothing was optimised — this is documentation only.

---

## What is favourable today

| Factor | Evidence |
|---|---|
| Hermes on both platforms | `android/gradle.properties` `hermesEnabled=true`; `ios/Podfile.lock` `hermes-engine (0.82.1)` |
| New Architecture (Fabric + TurboModules) | `newArchEnabled=true`; `RCTNewArchEnabled` `true` |
| Native stack navigators | `@react-navigation/native-stack` on all four stacks — native transitions, not JS-driven |
| All data is synchronous | no network waterfall, no loading spinners, no request latency |
| Tiny bundle surface | 38 source files, 14 runtime dependencies, no icon library, no image library |
| `StyleSheet.create` everywhere | 18 files; **0** inline `style={{ }}` object literals |
| Selector-based store subscriptions | screens subscribe to slices, not whole stores — see [state-management.md](state-management.md) |
| ProMotion enabled on iOS | `CADisableMinimumFrameDurationOnPhone` `true` |

The app is small and the data is local. Nothing here is likely to be slow at the current
scale — **at the current scale** is the operative qualifier for everything below.

---

## Structural issues that will matter as data grows

### 1. No memoisation anywhere

| Check | Count in `src/` |
|---|---|
| `React.memo` | **0** |
| `useMemo` | **0** |
| `useCallback` | **0** |

Consequences visible in the code:

- **`renderItem` is redefined on every render** in all five real list screens
  (`HomeScreen.tsx:20`, `ProductListScreen.tsx:29`, `CartScreen.tsx:33`,
  `CategoriesScreen.tsx:27`, `OrderHistoryScreen.tsx:42`). `FlatList` receives a new function
  identity each time and re-renders rows.
- **9 inline `onPress={() => …}` arrows** create a new handler per row per render.
- `ProductCard`, `CategoryCard` and `DrawerHeader` are plain components — a parent render
  re-renders every card.

At 6–15 items this is invisible. At a few hundred it is not.

### 2. A selector that allocates on every store notification

`src/screens/Home/ProductListScreen.tsx:18-23`:

```tsx
const products = useProductStore(state =>
  state.products.filter(p => p.category === category),
);
```

zustand v4 compares the selector result with `Object.is`. `.filter()` returns a **new array
every time**, so the comparison always fails and the screen re-renders on every store
change, whether or not the filtered result changed. The store already has
`filterByCategory` (`productStore.ts:33-45`) which would avoid this — it is never called.

### 3. No `FlatList` tuning

Zero occurrences of `getItemLayout`, `initialNumToRender`, `maxToRenderPerBatch`,
`windowSize` or `removeClippedSubviews` across the 8 `FlatList` usages. Defaults are fine
for the current list sizes; they are the first thing to revisit with a real catalogue.

`HomeScreen.tsx:36` hardcodes `numColumns={2}` — no responsive column count, and changing
`numColumns` on a mounted `FlatList` is a known re-mount cost if it ever becomes dynamic.

### 4. Remote images with no caching layer

8 `<Image>` usages, every source a remote HTTPS URL (Unsplash, Pravatar). React Native's
built-in `Image` has only the platform's own cache — no `react-native-fast-image`, no
preloading, no placeholder, no progressive load, no explicit `defaultSource`. `resizeMode`
is set in 4 of 8 places.

The URLs do carry a width parameter (`?w=400` / `?w=500`), so the payloads are at least not
full-resolution.

### 5. Two duplicated `reduce` passes over the cart

`CartScreen.tsx:21-23` and `CheckoutScreen.tsx:19-21` each recompute the cart total inline
on every render. The store already exports `useCartTotalPrice` (`cartStore.ts:66-69`), which
nothing imports. Negligible cost at cart scale; noted as duplication rather than as a
performance problem.

### 6. Drawer content redefined during render

`DrawerNavigator.tsx:56`:

```tsx
drawerContent={props => <CustomDrawerContent {...props} />}
```

ESLint flags this (`react/no-unstable-nested-components`, warning at 56:22). React sees a
new component type on every render of `DrawerNavigator` and destroys and rebuilds the
drawer subtree, discarding its state.

---

## Startup

| Step | Cost |
|---|---|
| Native init + Hermes | platform baseline |
| Bundle parse | small — 38 source files |
| `loadProducts()` at `RootNavigator.tsx:11-13` | a synchronous array assignment; effectively free |
| First screen | `LoginScreen` — a form, no list, no images |

No splash screen is configured on either platform, so the user sees the system launch
screen until React mounts. No inline-requires or RAM-bundle configuration; not needed at
this size.

Actual cold-start time is **UNKNOWN** — not measured.

---

## Rendering and animation

- The only animation in the app is the drawer's, driven by Reanimated 4 on the UI thread.
  No application code calls a Reanimated API (`grep -rn "reanimated" src` → 0 hits).
- No `LayoutAnimation`, no `Animated` API usage, no custom gestures.
- 17 `ScrollView` usages; none nests a `FlatList` (which would be the common mistake here).
- The status-badge colour is computed per row via `getStatusColor(item.status)` inside an
  array style at `OrderHistoryScreen.tsx:50` and `OrderDetailsScreen.tsx:57` — a new style
  array per render. Trivial at 4 orders.

---

## Bundle and binary size

| Factor | State |
|---|---|
| Hermes bytecode | yes — smaller and faster to start than JSC |
| ProGuard / R8 | **disabled** (`android/app/build.gradle:60`) |
| `shrinkResources` | not set |
| ABI splits | not configured — all four ABIs in one artefact (`reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64`) |
| Unused dependencies shipped | `nativewind`, `@react-native/new-app-screen` — both installed, neither imported |
| Unreferenced source in the tree | 8 files, ~4% of `src/` — see [repository-structure.md](repository-structure.md) |
| Actual APK / IPA size | **UNKNOWN** — no build was run |

---

## Memory

Nothing is cached, nothing is persisted, no listener is registered outside React, no timer
or interval exists, no subscription needs teardown. The single `useEffect` in the app
(`RootNavigator.tsx:11-13`) has a correct dependency array and no cleanup requirement.

No leak pattern was identified by reading. Runtime memory behaviour is **UNKNOWN** — not
measured.

---

## Type-safety cost to performance work

Six `: any` annotations (`DrawerNavigator.tsx:29` and the five `renderItem` signatures)
mean the compiler cannot verify what a list row actually contains. This is what allows the
`title` / `name` mismatch in [data-flow.md](data-flow.md) to render as a blank string
rather than fail — and it will equally hide the shape errors that any future
memoisation or virtualisation work introduces.

---

## Summary

| Observation | Impact today | Impact at scale |
|---|---|---|
| No `useMemo` / `useCallback` / `React.memo` anywhere | none | high |
| Allocating selector in `ProductListScreen` | negligible | high |
| No `FlatList` tuning | none | medium |
| Remote images, no caching library | mild | medium |
| Drawer content redefined per render | subtree rebuild | medium |
| Duplicated cart `reduce` | negligible | negligible |
| R8 disabled, all ABIs shipped | larger APK | medium |
| Hermes + New Architecture + native stacks | favourable | favourable |

Nothing needs optimising at the current data volume. The point of this document is that the
patterns which will need to change are already in place in five list screens, and are
cheapest to change now.

---

## Related documents

- [architecture.md](architecture.md)
- [state-management.md](state-management.md)
- [known-issues.md](known-issues.md)
