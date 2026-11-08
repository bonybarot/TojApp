# 0032. Remove unused dependencies and the address screens from the app

Date: 2026-11-08
Status: Accepted (agent, Level 2 under AGENTS.md §1b; reversible via git)

## Context
- `nativewind`, `@react-navigation/drawer`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-worklets` and `@react-native/new-app-screen` were installed but imported nowhere (Reanimated/Worklets only through the babel plugin, gesture-handler only through `index.js`). Each adds native pods, build time and upgrade surface.
- Addresses and AddressForm screens plus `addressStore` were reachable from nothing: checkout is pickup-only (Q-2, ADR-0031 §6) and Profile is fixed by D-13. They still loaded `/me/addresses` on every sign-in.

## Decision
1. Remove the six packages, the Reanimated babel plugin and the gesture-handler import. Lockfiles and `ios/Podfile.lock` change in the same commit.
2. Delete `AddressesScreen`, `AddressFormScreen`, `addressStore` and their routes. The backend address API is unchanged.

## Alternatives
- Keep them "for later": rejected, AGENTS.md §7a; git keeps them.
- Link Addresses from Profile: rejected, D-13 fixes Profile entries and nothing uses an address yet.

## Consequences
- Delivery (if approved) restores the screens from git (`git log --diff-filter=D -- src/screens/Account/AddressesScreen.tsx`) and adds a Profile entry by product decision.
- A drawer or gesture-driven animation would reinstall its package with its own justification.

## Verification
tsc 0 errors, lint clean, jest 6 suites / 16 tests. iOS pod install and rebuild; Android rebuild and walk 2026-11-08.
