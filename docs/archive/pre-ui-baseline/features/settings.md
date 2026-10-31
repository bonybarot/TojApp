# Feature: Settings

Status: **MOCK / PROTOTYPE — every control is inert**
Last Verified: 2026-09-03
Source: `src/screens/User/SettingsScreen.tsx`

---

## Status

The screen is a static mock-up. Two switches hold local state that nothing reads; seven
rows have no `onPress`. Nothing on this screen changes the behaviour of the app.

---

## Purpose

Present application preferences and about information.

---

## User Flow

```text
Drawer → Settings
  ├─ Notifications
  │    ├─ Push Notifications   [Switch, default on]
  │    └─ Email Notifications  [Switch, default on]
  ├─ App Settings
  │    ├─ Language   English
  │    ├─ Currency   USD ($)
  │    └─ Theme      Light
  └─ About
       ├─ Version           1.0.0
       ├─ Terms of Service  ›
       └─ Privacy Policy    ›
```

Toggling a switch flips its own visual state and nothing else. Tapping any of the seven
rows does nothing.

---

## Entry Points

| Entry | Location |
|---|---|
| Drawer item "Settings" | `src/navigation/DrawerNavigator.tsx:86-90` |

Settings is only in the drawer.

---

## Screens

| Screen | File | Route |
|---|---|---|
| Settings | `src/screens/User/SettingsScreen.tsx` (129 lines) | `Drawer` → `Settings` |

---

## Components

None. Uses React Native's `Switch` directly.

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `React.useState(true)` — `notificationsEnabled` | `:13` | Read only by its own `Switch` |
| `React.useState(true)` — `emailNotifications` | `:14` | Read only by its own `Switch` |

Note this file uses `React.useState` rather than the named import used elsewhere — a small
stylistic inconsistency.

---

## State

Two booleans, local, defaulting to `true`, discarded on unmount. No store, no persistence,
no consumer.

---

## Data

Everything else on the screen is a hardcoded string literal:

| Row | Value | Line |
|---|---|---|
| Language | `English` | `:44` |
| Currency | `USD ($)` | `:48` |
| Theme | `Light` | `:52` |
| Version | `1.0.0` | `:60` |

The version string `1.0.0` is a **fifth** independent statement of the app version, and it
agrees with none of the others exactly — `package.json` says `0.0.1`, `app.json` has no
version, Android `versionName` is `"1.0"`, iOS `MARKETING_VERSION` is `1.0`. See
[../current-state/configuration.md](../current-state/configuration.md).

---

## Business Logic

None. There is no logic on this screen.

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.** Switch positions reset to `true` every time the screen is mounted.

---

## Error Handling

Not applicable — nothing can fail.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Toggle a switch, navigate away, come back | Reset to `true` — the drawer unmounts inactive screens by default |
| Tap Language / Currency / Theme | Nothing |
| Tap Terms of Service / Privacy Policy | Nothing — there are no documents and no links |
| Device is in dark mode | Ignored. `App.tsx:10` reads `useColorScheme()` but uses it **only** for the `StatusBar` bar style; the rest of the app is fixed-colour, and there is no dark palette. The "Theme: Light" row is therefore accurate by accident |

---

## Dependencies

`react-native` (`ScrollView`, `Switch`, `TouchableOpacity`).

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| APP-08 | P2 | Both switches are inert — the state is read by nothing |
| APP-07 | P2 | Seven rows have no `onPress` |
| DATA-04 | P1 | `colors.border` and `colors.textSecondary` resolve to `undefined` |
| — | P3 | Version `1.0.0` is a fifth, hardcoded version string |
| — | P3 | No Terms of Service or Privacy Policy document exists to link to |
| APP-15 | P3 | No accessibility labels on the switches |

---

## Related Features

- [profile.md](profile.md) — the other User screen
- [drawer.md](drawer.md) — the only entry point

---

## Source Files

`src/screens/User/SettingsScreen.tsx`, `src/navigation/DrawerNavigator.tsx`.

---

## Current Limitations

1. No setting actually applies.
2. No persistence.
3. No dark theme to switch to.
4. No localisation — "English" is a label, not a choice; there is no i18n library.
5. No currency handling — prices are hardcoded `$` in every screen.
6. No push-notification integration (no permission request, no token, no library).
7. No legal documents.

---

## Unknowns

- Which settings are real product requirements — **NOT YET DECIDED**.
- Whether dark mode is in scope — **NOT YET DECIDED**.
- Whether the app will be localised — **NOT YET DECIDED**.
