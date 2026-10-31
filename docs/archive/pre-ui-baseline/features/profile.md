# Feature: Profile

Status: **MOCK / PROTOTYPE — displays a fabricated user; every menu row is inert**
Last Verified: 2026-09-03
Source: `src/screens/User/ProfileScreen.tsx`, `src/store/userStore.ts`

---

## Purpose

Show the signed-in user and offer account actions.

---

## User Flow

```text
Tab bar → Profile   (or)   Drawer → Profile
  ├─ user === null → "No user data available"
  └─ otherwise
       ├─ header: avatar (100×100, circular, primary-coloured border), name, email
       ├─ section 1: Edit Profile · Change Password · Payment Methods · Shipping Addresses
       └─ section 2: Order History · Wishlist

  → tapping any of the six rows does nothing at all
```

---

## Entry Points

| Entry | Location |
|---|---|
| Profile tab | `src/navigation/MainTabs.tsx:43-49` |
| Drawer item "Profile" | `src/navigation/DrawerNavigator.tsx:81-85` |

The same component is registered in **two different navigators** (issue NAV-01). Reaching
it from the tab bar and from the drawer produces two independent instances with separate
scroll positions; only the drawer instance has a header titled "Profile".

---

## Screens

| Screen | File | Routes |
|---|---|---|
| Profile | `src/screens/User/ProfileScreen.tsx` (128 lines) | `MainTabs` → `Profile`, `Drawer` → `Profile` |

---

## Components

None. `DrawerHeader` renders a similar block but is a separate component
(`src/components/DrawerHeader.tsx`) — see [../components/DrawerHeader.md](../components/DrawerHeader.md).

---

## Hooks

| Hook | Line |
|---|---|
| `useUserStore(state => state.user)` | `:14` |

---

## State

None local. Read-only projection of `userStore.user`.

---

## Data

The `user` object created by the mock login (`userStore.ts:23-28`):

| Field | Value | Displayed at |
|---|---|---|
| `name` | always `'John Doe'` | `:31` |
| `email` | whatever was typed at login | `:32` |
| `avatar` | always `https://i.pravatar.cc/150?img=1` | `:28` |
| `id` | always `'1'` | not displayed |

`:28` applies a fallback — `user.avatar || 'https://i.pravatar.cc/150?img=1'` — to the same
URL the store already hardcodes, so the fallback can never differ from the value.

---

## Business Logic

| Rule | Where |
|---|---|
| No user renders an error message | `:16-22` |
| Avatar falls back to a default URL | `:28` |
| Menu rows perform actions | **none do** — six `TouchableOpacity` elements at `:36`, `:40`, `:44`, `:48`, `:55`, `:59` have no `onPress` prop (issue APP-07) |

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.** Nothing here is editable, so nothing needs saving.

---

## Error Handling

One branch: `"No user data available"` (`:19`). Not reachable in normal use — Profile is
only mounted inside `DrawerNavigator`, which only mounts when `isLoggedIn` is true, and
`login` always sets both fields together. It becomes reachable if `user` and `isLoggedIn`
ever disagree (issue APP-12).

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| `user === null` | The error message |
| Avatar URL unreachable | Blank circle with a primary-coloured border; no placeholder, no `onError` |
| Very long name or email | No `numberOfLines`; text wraps and pushes the layout down |
| Tapping any row | Visual touch feedback (`TouchableOpacity` default opacity) and nothing else — actively misleading |

---

## Dependencies

`react-native` (`Image`, `ScrollView`, `TouchableOpacity`), `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| APP-07 | P2 | All six menu rows are inert but look tappable |
| APP-01 | P1 | The displayed identity is fabricated — always "John Doe" |
| NAV-01 | P2 | Registered in two navigators; two instances exist |
| DATA-04 | P1 | `colors.textSecondary`, `colors.border` and `colors.error` used here resolve to `undefined` |
| APP-15 | P3 | No accessibility roles or labels on the rows |
| — | P3 | The avatar fallback duplicates the hardcoded store value |
| — | P3 | The "Order History" row does not link to [order-history.md](order-history.md), which exists |

---

## Related Features

- [authentication.md](authentication.md) — the source of the user object
- [drawer.md](drawer.md) — renders the same identity in `DrawerHeader`
- [settings.md](settings.md) — the other User-section screen

---

## Source Files

`src/screens/User/ProfileScreen.tsx`, `src/store/userStore.ts`,
`src/navigation/MainTabs.tsx`, `src/navigation/DrawerNavigator.tsx`.

---

## Current Limitations

1. Read-only — no field can be edited.
2. No avatar upload.
3. No password change.
4. No payment methods or address book.
5. No wishlist (the row exists; the feature does not).
6. The "Order History" row does not navigate to the order history that exists.

---

## Unknowns

- Which of the six rows are actually intended features — **NOT YET DECIDED**.
- Whether Profile belongs in the tab bar, the drawer, or both — **NOT YET DECIDED**.
