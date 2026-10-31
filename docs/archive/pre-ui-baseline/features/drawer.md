# Feature: Drawer (Application Shell)

Status: **IMPLEMENTED**
Last Verified: 2026-09-03
Source: `src/navigation/DrawerNavigator.tsx`, `src/components/DrawerHeader.tsx`

---

## Purpose

The shell for the entire signed-in experience. Everything the user can reach after login
lives inside this drawer.

---

## User Flow

```text
isLoggedIn === true → DrawerNavigator
  ├─ header bar with a hamburger on every screen (headerShown: true, :58)
  └─ drawer panel
       ├─ DrawerHeader   avatar · name · email, on a primary-coloured band
       ├─ DrawerItemList five generated items
       │    ├─ Home        → MainTabs   (drawerLabel 'Home', title '')
       │    ├─ Categories  → CategoriesScreen
       │    ├─ Orders      → OrdersStack
       │    ├─ Profile     → ProfileScreen
       │    └─ Settings    → SettingsScreen
       └─ Logout          a manual DrawerItem in error colour
            └─ logout() → user = null, isLoggedIn = false
                 └─ RootNavigator swaps the whole tree back to AuthStack
```

---

## Entry Points

| Entry | Location |
|---|---|
| Mounted when logged in | `src/navigation/RootNavigator.tsx:15` |
| Hamburger on any screen's header | supplied by `@react-navigation/drawer` |
| Edge swipe | the library's default gesture |

---

## Screens

The drawer registers five destinations (`DrawerNavigator.tsx:66-90`). Three of them are
nested navigators, not leaf screens:

| Drawer route | Component | Kind |
|---|---|---|
| `MainTabs` | `MainTabs` | bottom-tab navigator (Home / Cart / Profile) |
| `Categories` | `CategoriesScreen` | screen |
| `OrdersStack` | `OrdersStack` | native-stack navigator |
| `Profile` | `ProfileScreen` | screen — **also** a tab inside `MainTabs` (issue NAV-01) |
| `Settings` | `SettingsScreen` | screen |

---

## Components

| Component | Where | Role |
|---|---|---|
| `DrawerHeader` | `:40` | avatar, name, email |
| `CustomDrawerContent` | `:29-51` | wraps `DrawerContentScrollView`, `DrawerItemList` and the manual Logout item |

`CustomDrawerContent` is passed as `drawerContent={props => <CustomDrawerContent {...props} />}`
(`:56`). That arrow function creates a new component identity on every render of
`DrawerNavigator`, which is why ESLint reports `react/no-unstable-nested-components` there
(issue QUAL-08).

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useUserStore(state => state.logout)` | `:30` | |
| `useNavigation()` | `:31` | **Assigned and never used** — ESLint error `31:9` (issue QUAL-06). The comment at `:35` explains why: `// Navigation will be handled by RootNavigator` |
| `useUserStore(state => state.user)` | `DrawerHeader.tsx:7` | |

---

## State

No local state. `DrawerHeader` reads `user`; `CustomDrawerContent` reads `logout`.

---

## Data

The user identity, from the mock login. `DrawerHeader` returns `null` when `user` is
`null` (`DrawerHeader.tsx:9-11`), so the panel simply has no header band in that case.

---

## Business Logic

| Rule | Where |
|---|---|
| Logout clears the user | `:33-36` → `userStore.ts:34-39` |
| Navigation after logout is implicit | `RootNavigator.tsx:15` re-renders the whole tree; no navigation call is made |
| Logout does **not** clear the cart | `userStore.ts:34-39` (issue APP-11) |
| The Home drawer entry has an empty header title | `:69` — `title: ''` with `drawerLabel: 'Home'` |

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.** Because nothing persists, the drawer is only ever reached by logging
in during the current session.

---

## Error Handling

None required — `logout` is synchronous and local.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| `user === null` while the drawer is mounted | `DrawerHeader` renders nothing; the item list still shows |
| Logout while on a nested screen | The whole tree is replaced; no navigation reset is needed because the navigators unmount |
| Logout with items in the cart | Cart survives into the next login (issue APP-11) |
| Avatar image fails | Blank circle with a white border |
| `DrawerHeader` email colour | `colors.textSecondary` on a `colors.primary` band — at runtime the token is `undefined`, so the email inherits the default text colour on a black band (`theme.js` `primary` is `#000000`) and may be unreadable |

---

## Dependencies

`@react-navigation/drawer` (7.7.3 installed), `react-native-gesture-handler`,
`react-native-reanimated`, `react-native-screens`, `zustand`.

The drawer is the reason `react-native-gesture-handler` and `react-native-reanimated` are
in the dependency list at all.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| PLAT-03 | P2 | **`GestureHandlerRootView` is missing.** `index.js:5` and `App.tsx:7` both import `react-native-gesture-handler`, but no `GestureHandlerRootView` wraps the tree (0 occurrences in the codebase). On the New Architecture this is required for gesture handling to work reliably |
| NAV-01 | P2 | `Profile` registered in both `MainTabs` and the drawer |
| NAV-02 | P2 | `DrawerParamList` declared (`:19-25`) but not attached to `createDrawerNavigator()` (`:27`) |
| QUAL-06 | P3 | `navigation` assigned and never used (`:31`) |
| QUAL-08 | P2 | `CustomDrawerContent` re-created on every render (`:56`) |
| APP-11 | P2 | Cart survives logout |
| DATA-04 | P1 | `colors.error`, `colors.textSecondary` and `colors.border` resolve to `undefined` |
| APP-13 | P3 | `CustomDrawerContent` typed `(props: any)` (`:29`) |

---

## Related Features

- [authentication.md](authentication.md) — logout lives here
- [profile.md](profile.md), [settings.md](settings.md), [categories.md](categories.md),
  [order-history.md](order-history.md) — the destinations

---

## Source Files

`src/navigation/DrawerNavigator.tsx`, `src/components/DrawerHeader.tsx`,
`src/navigation/RootNavigator.tsx`, `src/store/userStore.ts`.

---

## Current Limitations

1. No icons on any drawer item.
2. No badges (cart count, unread orders).
3. No confirmation prompt before logging out.
4. No "close drawer" behaviour customisation.
5. The Home entry's header title is blank rather than "Home".

---

## Unknowns

- Whether a drawer is the intended long-term shell, or whether tabs alone would do —
  **NOT YET DECIDED**.
