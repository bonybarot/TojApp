# Security

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: full read of `src/`, `android/`, `ios/`, root configuration

> This document records what the code does today. It does **not** invent vulnerabilities,
> and it does not describe a target security model. Several entries below are "not a
> vulnerability yet, because the feature does not exist" — those are marked as such,
> because they become real the moment a backend is added.

---

## Secrets

**No secret, token, API key or password was found in the tracked source during this pass.**

Searched: all of `src/`, root configuration files, `android/` and `ios/` tracked files, for
API keys, bearer tokens, `.env` files, private keys and credential-shaped strings.

Two credential-adjacent artefacts exist and are **not** leaked secrets:

| Artefact | Location | Assessment |
|---|---|---|
| `debug.keystore` and its plaintext passwords | `android/app/debug.keystore`, `android/app/build.gradle:91,93` | The React Native template's **public** debug key, identical in every RN project, deliberately un-ignored at `.gitignore:34-35`. Not a secret. It **is** a configuration defect, because the release build type also uses it — see below. |
| Hardcoded mock password check | — | There isn't one. `userStore.ts:21` accepts a `password` parameter and never reads it. |

There is no `.env` file, no `react-native-config`, and nowhere for a secret to be stored —
consistent with there being no backend.

---

## P0 — Release build signed with the committed debug keystore

`android/app/build.gradle:103` — the `release` build type uses `signingConfig
signingConfigs.debug`.

| | |
|---|---|
| **Severity** | P0 |
| **Impact** | Anyone holding the repository — or any React Native project, since the debug keystore is universal — can build an APK that Android accepts as an update to this app. Google Play rejects debug-signed uploads. Once published under a signing key, an app can never change it without a new package name. |
| **Evidence** | `android/app/build.gradle:88-107`; the template's own warning comment sits unheeded at lines 101-102 |
| **Status** | Documented, **not fixed** — out of scope for this phase |

Detail in [android.md](android.md).

---

## Authentication

**MOCK / PROTOTYPE — there is no authentication.**

`src/store/userStore.ts:21-33`:

```ts
login: (email: string, password: string) => {
  // Mock login - in real app, this would call an API
  const mockUser: User = { id: '1', name: 'John Doe', email, avatar: '…' };
  set({ user: mockUser, isLoggedIn: true });
},
```

| Property | Current state |
|---|---|
| Credential verification | **None** — `password` is accepted and never read |
| Who can log in | Anyone, with any non-empty email and any non-empty password (`LoginScreen.tsx:22` checks only truthiness) |
| Token / session | **None** — no JWT, no cookie, no refresh, no expiry |
| Password storage | **None** — the password is discarded, never stored, never transmitted (there is nowhere to transmit it) |
| Password strength rules | **None** — sign-up checks only "not empty" and "the two fields match" (`SignupScreen.tsx:24,29`) |
| Account lockout / rate limiting | **None** |
| MFA | **None** |
| Biometric unlock | **None** |
| Logout | Clears in-memory state only (`userStore.ts:34-39`) |

This is not currently exploitable in the way a broken real auth system would be — there is
no account and no protected resource behind it. It becomes a critical issue the moment any
real data sits behind the login. The gate itself
(`RootNavigator.tsx:15`) is structurally correct; only the credential check is fake.

---

## Authorisation

**NOT IMPLEMENTED.** No roles, no permissions, no per-screen guards beyond the
mounted/not-mounted split in `RootNavigator`. Not required at the current shape.

---

## Data at rest

**Nothing is stored.** No AsyncStorage, no MMKV, no SQLite, no Keychain/Keystore, no file
writes. All state dies with the process.

| Consequence | Assessment |
|---|---|
| No sensitive data can leak from device storage | positive, by accident |
| No token can be stolen from insecure storage | positive, by accident |
| The cart and session are lost on every relaunch | see [known-issues.md](known-issues.md) |

`android:allowBackup="false"` (`AndroidManifest.xml:10`) — correct, and moot today.

---

## Data in transit

The app makes **no API calls**. Verified: 0 matches for `fetch(` and `axios` in `src/`.

The only network traffic is image loading. All 24 distinct remote URLs in the source (72
occurrences) are **HTTPS**, across two hosts:

| Host | Used for |
|---|---|
| `images.unsplash.com` | product and category imagery |
| `i.pravatar.cc` | the mock user's avatar (`userStore.ts:27`) |

Transport policy:

| Platform | Setting | Assessment |
|---|---|---|
| iOS | `NSAllowsArbitraryLoads: false`, `NSAllowsLocalNetworking: true` (`Info.plist`) | Correct and strict — HTTP blocked, Metro reachable |
| Android | `android:usesCleartextTraffic="${usesCleartextTraffic}"` (`AndroidManifest.xml:12`) | Manifest placeholder — `true` in debug for Metro, `false` in release. Correct. |

No certificate pinning, no custom trust store. Not required today; worth deciding before a
backend exists.

---

## Input handling

| Input | Screen | Handling |
|---|---|---|
| Email | `LoginScreen:42-43`, `SignupScreen:58-59` | `keyboardType="email-address"`, `autoCapitalize="none"` — no format validation |
| Password | `LoginScreen:52`, `SignupScreen:68,77` | `secureTextEntry` set correctly on all three fields |
| Name | `SignupScreen` | no constraints |
| Address (6 fields) | `CheckoutScreen:25-31` | truthiness check only (`:33-54`) — no postcode, state or length validation |

All validation is truthiness. There is no sanitisation, but also **no sink** that would need
it: no `WebView`, no `dangerouslySetInnerHTML` equivalent, no SQL, no `eval`, no dynamic
`require`. Injection is not currently reachable.

`textContentType` / `autoComplete` hints are **not** set on any field, so password managers
get no signal.

---

## Platform permissions

| Platform | Requested |
|---|---|
| Android | `INTERNET` only (`AndroidManifest.xml:3`) |
| iOS | none actually used |

Minimal and appropriate.

> **KNOWN ISSUE.** `ios/TojApp/Info.plist` declares `NSLocationWhenInUseUsageDescription`
> **with an empty string** for a capability the app never uses. Declaring an unused
> permission purpose string invites App Store review questions, and an empty purpose string
> would cause an immediate denial if it were ever used. See [ios.md](ios.md).

---

## Logging and data exposure

| Check | Result |
|---|---|
| `console.*` calls in `src/` | **0** |
| Analytics SDK | none |
| Crash reporter | none |
| Third-party SDK of any kind | none |

Nothing leaves the device except image requests. Note that those requests do disclose to
Unsplash and Pravatar that a device is browsing — irrelevant for mock data, worth
remembering if real catalogue imagery is ever hotlinked from a third party.

---

## Client-side trust

Every business rule currently lives on the device, because there is no server:

| Rule | Where |
|---|---|
| Cart totals | `CartScreen.tsx:21-23`, `CheckoutScreen.tsx:19-21` — inline `reduce` |
| Cart quantity rules | `cartStore.ts:26-59` |
| "Order placed" | `CheckoutScreen.tsx:33-54` — an `Alert`, nothing more |
| Prices | `src/data/products.ts` / `src/data/products.js` — static, in the bundle |

This is normal for a prototype with no backend. It is recorded here because **every one of
these must move server-side** before real money is involved — a client-computed total is
not a total.

---

## Dependency security

| Check | Result |
|---|---|
| `npm audit` wired into a script or CI | **No** |
| Automated dependency updates (Dependabot / Renovate) | **No** |
| Lockfile committed | **Yes** — `package-lock.json` |
| Known-vulnerable package review | **Not performed in this pass** — no audit was run, because running one is a tooling action outside documentation scope. **UNKNOWN.** |

---

## Summary

| Area | Status |
|---|---|
| Secrets in source | **None found** |
| Android release signing | **P0 — debug key** |
| Authentication | MOCK / PROTOTYPE — no verification of any kind |
| Authorisation | NOT IMPLEMENTED |
| Data at rest | Nothing stored |
| Data in transit | HTTPS only; strict ATS; no API calls at all |
| Input validation | Truthiness only; no reachable injection sink |
| Permissions | Minimal (`INTERNET`) — one stray empty iOS usage string |
| Logging | No logging, no third-party SDKs |
| Client-side trust | Total, by necessity — no server exists |
| Dependency auditing | Not configured; current vulnerability state UNKNOWN |

The app is not currently dangerous because it does almost nothing: no data, no network, no
storage. The security work is entirely ahead of it, and the P0 signing issue is the one item
that is a real defect **today**.

---

## Related documents

- [android.md](android.md)
- [ios.md](ios.md)
- [../features/authentication.md](../features/authentication.md)
- [known-issues.md](known-issues.md)
