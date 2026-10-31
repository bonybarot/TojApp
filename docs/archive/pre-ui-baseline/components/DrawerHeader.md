# Component: DrawerHeader

Status: **IMPLEMENTED — displays a fabricated identity**
Last Verified: 2026-09-03
Source: `src/components/DrawerHeader.tsx` (51 lines)

---

## Purpose

The identity band at the top of the navigation drawer: avatar, name, email.

---

## Props

**None.** This is the only component in the app that reads a store directly rather than
receiving data through props.

---

## Structure

```tsx
const user = useUserStore(state => state.user);   // :7

if (!user) { return null; }                        // :9-11

<View style={styles.container}>                    // :14
  <Image source={{ uri: user.avatar || 'https://i.pravatar.cc/150?img=1' }} … />  // :15-18
  <Text style={styles.name}>{user.name}</Text>     // :19
  <Text style={styles.email}>{user.email}</Text>   // :20
</View>
```

---

## State

Subscribes to `useUserStore(state => state.user)` (`:7`). Re-renders whenever the user
object changes — which, in this app, happens exactly twice per session (login and logout).

---

## Styling

| Style | Value | Line |
|---|---|---|
| `container` | `padding: 24`, `paddingTop: 32`, `backgroundColor: colors.primary`, centred | `:26-31` |
| `avatar` | 80 × 80, `borderRadius: 9999`, 2px `colors.background` border | `:32-39` |
| `name` | 20 / `'600'` / `colors.background` | `:40-45` |
| `email` | 14 / `'400'` / **`colors.textSecondary`** | `:46-50` |

### A visible contrast defect

`colors.primary` is `#000000` in `theme.js` (`theme.js:2`). The name uses
`colors.background` (`#ffffff`) and reads fine. The email uses `colors.textSecondary`,
which **`theme.js` does not define** — so at runtime it is `undefined` and the email falls
back to React Native's default text colour (black) **on a black band**. The email is
effectively invisible.

This is a concrete, user-visible instance of issue DATA-04. See
[../current-state/data-flow.md](../current-state/data-flow.md).

---

## Used by

| Caller | Line |
|---|---|
| `src/navigation/DrawerNavigator.tsx` | `:40`, inside `CustomDrawerContent` |

One call site. It sits **outside** `DrawerContentScrollView` (`:39-41`), so the band is
fixed while the item list below it scrolls.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| `user === null` | Returns `null`; the drawer shows only the item list |
| `avatar` empty or `undefined` | Falls back to `https://i.pravatar.cc/150?img=1` — the same URL the store hardcodes, so the fallback is unreachable in practice |
| Avatar URL unreachable | Blank white-bordered circle |
| Long name or email | No `numberOfLines`; text wraps and grows the band |

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-04 | P1 | The email renders black-on-black — `colors.textSecondary` is `undefined` at runtime |
| APP-01 | P1 | The identity shown is always "John Doe" |
| — | P3 | Reads the store directly instead of taking props, so it cannot be reused or tested in isolation |
| — | P3 | The avatar fallback duplicates the store's hardcoded URL |
| DATA-08 | P3 | Hardcoded spacing and type sizes |
| APP-15 | P3 | No accessibility labels; the avatar has no `accessibilityLabel` |

---

## Related

- [../features/drawer.md](../features/drawer.md) — the shell it belongs to
- [../features/profile.md](../features/profile.md) — renders the same three fields, independently
- [../current-state/state-management.md](../current-state/state-management.md) — `userStore`
