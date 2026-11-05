# Feature: Authentication

Status: **MOCK / PROTOTYPE**
Last Verified: 2026-09-03
Source: `src/screens/auth/`, `src/store/userStore.ts`, `src/navigation/RootNavigator.tsx`, `src/navigation/AuthStack.tsx`

---

## Status

**MOCK / PROTOTYPE.** The navigation gate around authentication is real and correctly
built. The credential check behind it does not exist. Any non-empty email and any non-empty
password sign the user in as a hardcoded person called *John Doe*.

The code says so itself — `src/store/userStore.ts:22`:
`// Mock login - in real app, this would call an API`.

---

## Purpose

Decide whether the application shows the shopping experience or the sign-in experience, and
hold an identity for the profile screen and the drawer header to display.

---

## User Flow

```text
App launch
  └─ isLoggedIn === false  (always — nothing is persisted)
      └─ AuthStack → Login
           │
           ├─ Sign In pressed
           │    ├─ email or password empty → Alert 'Error' / 'Please fill in all fields'
           │    └─ both non-empty → login(email, password)
           │         ├─ user  = { id: '1', name: 'John Doe', email, avatar: 'https://i.pravatar.cc/150?img=1' }
           │         ├─ isLoggedIn = true
           │         └─ RootNavigator re-renders → DrawerNavigator mounts → MainTabs → Home
           │
           └─ "Don't have an account? Sign Up" → Signup
                 │
                 ├─ any of 4 fields empty      → Alert 'Please fill in all fields'
                 ├─ password !== confirm       → Alert 'Passwords do not match'
                 └─ otherwise → login(email, password)   ← the SAME action as Login
                       └─ the entered name is discarded; the user is still 'John Doe'

Drawer → Logout
  └─ logout() → user = null, isLoggedIn = false → AuthStack remounts at Login
```

---

## Entry Points

| Entry | Location |
|---|---|
| Cold start with `isLoggedIn === false` | `src/navigation/RootNavigator.tsx:15` |
| Logout from the drawer | `src/navigation/DrawerNavigator.tsx:33-36` |
| Login → Signup link | `src/screens/auth/LoginScreen.tsx:61` |
| Signup → Login link | `src/screens/auth/SignupScreen.tsx:86` |

There is no other way into or out of this feature. Deep linking does not exist.

---

## Screens

| Screen | File | Route | Notes |
|---|---|---|---|
| Login | `src/screens/auth/LoginScreen.tsx` (127 lines) | `AuthStack` → `Login` | "Welcome Back" / "Sign in to continue", 2 inputs, Sign In button, Sign Up link |
| Signup | `src/screens/auth/SignupScreen.tsx` (152 lines) | `AuthStack` → `Signup` | "Create Account" / "Sign up to get started", 4 inputs, Sign Up button, Sign In link |
| Login (stub) | `src/screens/auth/Login.tsx` (12 lines) | **none** | Dead placeholder returning `<Text>LogIn</Text>`; registered in no navigator |

`AuthStack` sets `headerShown: true` (`AuthStack.tsx:18`), so these two screens are the
only ones in the app with a real navigator header.

---

## Components

None. Both screens are built from React Native primitives — `View`, `Text`, `TextInput`,
`TouchableOpacity`. There is no shared `Button`, `FormField` or `Input` component, which is
why the two screens duplicate their input styling verbatim
(`LoginScreen.tsx:95-103` and `SignupScreen.tsx:120-128` are identical style blocks).

---

## Hooks

| Hook | Where | Purpose |
|---|---|---|
| `useState` × 2 | `LoginScreen.tsx:17-18` | `email`, `password` |
| `useState` × 4 | `SignupScreen.tsx:17-20` | `name`, `email`, `password`, `confirmPassword` |
| `useUserStore` | `LoginScreen.tsx:16`, `SignupScreen.tsx:16` | selects `login` |
| `useNavigation` | `LoginScreen.tsx:15`, `SignupScreen.tsx:15` | **untyped** — no type argument |
| `useUserStore` | `RootNavigator.tsx:8` | selects `isLoggedIn` |

No custom hooks. `src/hooks/` does not exist.

---

## State

| State | Owner | Lifetime |
|---|---|---|
| `email`, `password`, `name`, `confirmPassword` | local `useState` in each screen | until unmount |
| `user: User \| null` | `useUserStore` (`userStore.ts:19`) | process lifetime |
| `isLoggedIn: boolean` | `useUserStore` (`userStore.ts:20`) | process lifetime |

Full store documentation: [../current-state/state-management.md](../current-state/state-management.md).

---

## Data

The only "data" this feature produces is fabricated in `src/store/userStore.ts:23-28`:

```ts
const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: email,                                    // the one real input
  avatar: 'https://i.pravatar.cc/150?img=1',
};
```

`email` is the sole field that reflects what the user typed. There is no user database, no
account record and no directory of any kind.

---

## Business Logic

| Rule | Where | Implementation |
|---|---|---|
| Login requires both fields non-empty | `LoginScreen.tsx:21-24` | `if (!email \|\| !password)` |
| Signup requires all four fields non-empty | `SignupScreen.tsx:23-26` | `if (!name \|\| !email \|\| !password \|\| !confirmPassword)` |
| Passwords must match | `SignupScreen.tsx:28-31` | `password !== confirmPassword` |
| Credentials are verified | **nowhere** | the `password` parameter is never read (`userStore.ts:21`) |
| Signup creates an account | **nowhere** | it calls the same `login` action (`SignupScreen.tsx:35`) |
| Email format is validated | **nowhere** | `keyboardType="email-address"` is a keyboard hint, not validation |
| Password strength | **nowhere** | any single character passes |

---

## API

**NOT IMPLEMENTED.** No endpoint, no token, no session, no refresh, no logout call. The two
"real app" comments (`LoginScreen.tsx:26`, `SignupScreen.tsx:33`) mark where a call would
go. See [../api/current-state.md](../api/current-state.md).

---

## Persistence

**NOT IMPLEMENTED.** `isLoggedIn` starts `false` on every launch (`userStore.ts:20`).
There is no secure storage, no token store and no "remember me". Closing the app logs the
user out.

---

## Error Handling

Three `Alert.alert('Error', …)` calls, all client-side validation:

| Message | Location |
|---|---|
| `Please fill in all fields` | `LoginScreen.tsx:22` |
| `Please fill in all fields` | `SignupScreen.tsx:24` |
| `Passwords do not match` | `SignupScreen.tsx:29` |

There is no error path for a failed credential check, because there is no check. No
`try`/`catch`, no error boundary, no inline field errors, no error state on the inputs.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Whitespace-only email (`"   "`) | **Passes** — truthiness only; a space is truthy |
| Malformed email (`"notanemail"`) | **Passes** — no format check |
| One-character password | **Passes** |
| Wrong password for an existing "account" | Meaningless — no account exists |
| Rapid double-tap on Sign In | `login()` twice; idempotent, no visible effect, no button disabling |
| Log in as A, log out, log in as B | Works, **but the cart from A is still there** — `logout` does not clear `useCartStore` |
| Relaunch after logging in | Back at Login |
| Backgrounding the app | State survives while the process lives; nothing is restored after a cold start |

---

## Dependencies

| Dependency | Why |
|---|---|
| `zustand` | the user store |
| `@react-navigation/native` | `useNavigation` |
| `@react-navigation/native-stack` | `AuthStack` |
| `react-native` | `Alert`, `TextInput`, `TouchableOpacity` |

No form library, no validation library, no auth SDK.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| APP-01 | P1 | Any non-empty credentials authenticate; `password` is never read |
| APP-02 | P1 | Signup creates nothing and discards the entered name |
| APP-04 | P1 | No persistence — logged out on every relaunch |
| APP-11 | P2 | Cart is not cleared on logout |
| APP-12 | P3 | `isLoggedIn` duplicates information already carried by `user` |
| QUAL-04 | P2 | `'password' is defined but never used` — one of the 6 ESLint errors (`userStore.ts:21:26`) |
| NAV-02 | P2 | `AuthStackParamList` is declared (`AuthStack.tsx:7-10`) but not attached to the navigator (`:12`) |
| NAV-03 | P2 | Both cross-links use `as never` (`LoginScreen.tsx:61`, `SignupScreen.tsx:86`) — a direct consequence of NAV-02 |
| DATA-04 | P1 | `placeholderTextColor={colors.textSecondary}` resolves to `undefined` at runtime on all six inputs |
| DEAD-01 | P2 | `src/screens/auth/Login.tsx` is a dead stub |
| — | P3 | No `textContentType` / `autoComplete` on any field — password managers get no signal |
| — | P3 | No loading state and no button disabling during "sign in" |

Register: [../current-state/known-issues.md](../current-state/known-issues.md)

---

## Related Features

- [drawer.md](drawer.md) — hosts Logout and displays the user
- [profile.md](profile.md) — the only consumer of the `user` object besides the drawer
- [cart.md](cart.md) — survives logout (APP-11)

---

## Source Files

| File | Lines | Role |
|---|---|---|
| `src/screens/auth/LoginScreen.tsx` | 127 | Login screen |
| `src/screens/auth/SignupScreen.tsx` | 152 | Signup screen |
| `src/screens/auth/Login.tsx` | 12 | Dead stub |
| `src/store/userStore.ts` | 43 | The store |
| `src/navigation/AuthStack.tsx` | ~33 | The unauthenticated navigator |
| `src/navigation/RootNavigator.tsx` | 16 | The gate |

---

## Current Limitations

1. No real authentication of any kind.
2. No account creation, password reset, email verification, or account deletion.
3. No session — nothing to expire, refresh, or revoke.
4. No social or SSO sign-in.
5. No biometric unlock.
6. No multi-user support: the identity is a constant.
7. No accessibility labelling on any input or button.

---

## Unknowns

- Whether the product intends email/password, social sign-in, phone OTP, or guest checkout —
  **NOT YET DECIDED**.
- Whether an account is required to browse, or only to check out — **NOT YET DECIDED**.
- What identity provider or backend will be used — **NOT YET DECIDED**.
- Whether the `avatar` field should come from a real upload — **UNKNOWN**.
