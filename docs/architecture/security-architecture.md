# Security Architecture

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — target security posture; no decision approved
Last Verified: 2026-09-03
Source: [../archive/pre-ui-baseline/current-state/security.md](../archive/pre-ui-baseline/current-state/security.md) + the requirements docs

> Current security state is documented separately and is the authority on what is real:
> [../archive/pre-ui-baseline/current-state/security.md](../archive/pre-ui-baseline/current-state/security.md). This page states what the
> target requires and why. Nothing here is implemented.

---

## 1. Current posture, in one table

| Area | Current |
|---|---|
| Authentication | MOCK — any non-empty credentials succeed; password never read (`src/store/userStore.ts:21`) |
| Authorisation | None — no server, nothing to authorise against |
| Tokens / sessions | None exist |
| Secrets in the repository | **The Android debug keystore is committed**, with its passwords in plaintext at `android/app/build.gradle:91,93`, and `.gitignore:34-35` deliberately allows it |
| Release signing | **Release build type uses the debug signing config** — `android/app/build.gradle:103`. The single P0 |
| Transport | HTTPS only, for images. 24 distinct URLs across two hosts. No API traffic exists |
| Data at rest | Nothing is stored; nothing to protect yet |
| Input validation | Presence checks only; whitespace-only values pass; `country` is excluded from checkout validation |
| Logging | Zero `console.*` calls in `src/` — nothing leaks today, and nothing is recorded either |

No API keys, no third-party secrets and no credentials other than the keystore were found.

---

## 2. Threat model — the target system

| Asset | Threat | Control |
|---|---|---|
| Customer account | Credential stuffing, weak passwords | Rate limiting, lockout/backoff, breached-password rejection, no enumeration on any endpoint |
| Session | Token theft from a lost or rooted device | Short-lived access token in memory; rotating refresh token in hardware-backed storage; server-side revocation |
| Another customer's orders | Broken object-level authorisation | Ownership checked server-side on every request; 404 rather than 403 so existence is not confirmed |
| Payment | Card data exposure | The app never receives or transmits card data — provider SDK/sheet only |
| Order integrity | Client-supplied prices or totals | The server prices everything; client totals are display-only |
| Inventory | Oversell via concurrent checkout | Reservation at payment, enforced by a database constraint |
| Release channel | Anyone signing an "update" | A real keystore, held outside the repository |
| The app binary | Reverse engineering | Accepted risk. No secret is ever shipped in the client |

**Explicitly out of scope for v1:** certificate pinning, jailbreak/root detection, code
obfuscation of the JS bundle, anti-tamper. Each has a real cost and none addresses a threat
that matters before there is a backend to attack.

---

## 3. Authentication and session security

Detail and rationale: [../requirements/authentication-requirements.md](../requirements/authentication-requirements.md) A-3 to A-7.

| Control | Requirement |
|---|---|
| Password storage | Server-side, memory-hard hash (Argon2id or bcrypt). Never in the client, never logged |
| Password policy | Length-first, screened against known-breached lists. No composition rules that push people to `Password1!` |
| Transport | TLS only; no cleartext fallback |
| Access token | ~15 minutes, in memory only |
| Refresh token | Rotating, single-use, revocable, in Keychain/Keystore via `react-native-keychain` |
| Storage prohibition | **Never** store a token in AsyncStorage, MMKV, Redux/Zustand state, or a log line |
| Reset tokens | Single-use, ~30 minutes, invalidate all refresh tokens on use |
| Enumeration | Login, registration and reset all respond identically for known and unknown addresses |
| Rate limiting | Per-IP and per-account, on login, registration and reset |
| Logout | Server-side revocation, Keychain cleared, cart cleared (fixes APP-11), navigation reset |

---

## 4. Authorisation

Every request is authorised on the server against the authenticated principal. The client
enforces nothing — client-side checks are a UX affordance only.

| Rule | v1 | Marketplace |
|---|---|---|
| A customer reads only their own orders, addresses, cart | Required | Required |
| Catalogue reads are public | Required | Required |
| Writes to catalogue and inventory | No client path exists | Seller, scoped to own store; admin, all stores |
| Role claim on the token | Present with the single value `customer` | Extended, not introduced |

**Why the role claim exists in v1 with one value:** adding a claim later means re-minting
every live token and shipping a client that handles both shapes. Adding a *value* to an
existing claim costs nothing.

---

## 5. Secrets and configuration

| Secret | Target home |
|---|---|
| Android release keystore | Outside the repository, in the CI secret store, injected at build time. `.gitignore` amended to exclude keystores |
| Signing passwords | CI secrets. Never in `build.gradle`, never in `gradle.properties` |
| iOS signing | A real bundle identifier, a recorded development team, managed certificates in CI |
| API base URL | Build-variant configuration. Not a secret, but must differ per environment |
| Third-party client keys (payments, crash reporting) | Publishable keys only. Anything secret stays server-side |

**Rule: no secret is ever shipped inside the app binary.** A key in the bundle is a public
key with extra steps.

> **BUILD-01 is the first security task of the whole plan** — migration Phase 0. Once an app
> is published under a signing identity, that identity cannot be changed without a new
> package name and a new listing. Publishing with a committed debug key is the one mistake
> here that is genuinely irreversible.

---

## 6. Payment security

| Control | Requirement |
|---|---|
| PCI scope | The app must stay out of it. Use the provider's native sheet or hosted flow; the app sees a token, never a PAN |
| Prohibited | Any `TextInput` that accepts a card number. No exceptions, no "just for testing" |
| Amount authority | The server tells the provider the amount. The client never does |
| Confirmation | An order is confirmed by a verified provider webhook, not by the client reporting success |
| Idempotency | One key per checkout attempt, enforced server-side (CO-8) |
| Redirect flows | 3DS return handled by a registered deep link, matching the app's real bundle identifier — which is why BUILD-02 blocks payments |

**Status: OPEN — provider not chosen (O-4). The controls above apply to any provider.**

---

## 7. Data protection

| Data | Classification | Handling |
|---|---|---|
| Email, name, phone, address | Personal data | Server-side, TLS in transit, access-controlled. Not logged in full |
| Order history | Personal data | Same |
| Payment method | Provider token only | Never the card |
| Password | Secret | Hashed server-side; never leaves the login form |
| Tokens | Secret | §3 |
| Catalogue | Public | — |

**Logging rule.** A redacting logger, allow-list based. Never log tokens, passwords,
full addresses, or full payloads containing them. Crash reports must scrub the same fields —
crash-reporter breadcrumbs are the usual accidental leak.

**Retention, deletion and privacy-law obligations (GDPR/CCPA applicability, account
deletion, data export): UNKNOWN.** They depend on the target markets (O-5), which have not
been decided. Note that account deletion is an app-store requirement in some jurisdictions
for any app offering account creation — this needs an answer before submission, not after.

---

## 8. Platform security

| Item | Target |
|---|---|
| Android release signing | Real keystore, CI-held (BUILD-01) |
| Android `INTERNET` permission | Keep. It is the only permission and it is required |
| iOS ATS | Keep default. Do not add arbitrary-load exceptions for a dev server; use a build variant |
| `NSLocationWhenInUseUsageDescription` | **Remove** — currently present with an empty string for a capability the app never uses (PLAT-01). An empty purpose string is an App Store rejection if the key is ever exercised |
| ProGuard/R8 | Enable for release (BUILD-04). Modest benefit, non-zero cost — schedule with the release-readiness phase, not before |
| Deep links | Validate every incoming URL. A deep link is untrusted input and is the natural way to reach a screen with a forged parameter |
| Debug artefacts | No dev menu, no verbose logging, no test accounts in release builds |

---

## 9. Verification

| Control | Verified by |
|---|---|
| Ownership enforcement | Integration test per resource: customer B is refused customer A's object with 404 |
| No enumeration | Integration test: identical responses for known and unknown addresses |
| Token storage | Manual + code review: no token appears in MMKV, AsyncStorage or any state container. A grep-based CI check is cheap and worth it |
| Release signing | CI asserts the release build is not signed with `signingConfigs.debug` |
| No secrets committed | Secret scanning in CI |
| No card input | CI check: no card-related `TextInput` in the app source |
| Dependency vulnerabilities | `npm audit` in CI, with a documented triage policy |

---

## 10. Decisions requiring an ADR

ADR-0006 secure token storage · ADR-0009 authentication model · ADR-0010 session and token
lifecycle · ADR-0014 payment provider and PCI scope · ADR-0019 CI/CD and release signing ·
ADR-0020 environment and configuration strategy.

---

## Related

- [../archive/pre-ui-baseline/current-state/security.md](../archive/pre-ui-baseline/current-state/security.md) — what is true today
- [../requirements/authentication-requirements.md](../requirements/authentication-requirements.md)
- [../requirements/checkout-and-order-requirements.md](../requirements/checkout-and-order-requirements.md)
