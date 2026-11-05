# Authentication Requirements

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: **Partly DECIDED** (2026-09-03) — see the supersession notice below. The rest is PROPOSED
Last Verified: 2026-09-03
Source: `src/store/userStore.ts`, `src/navigation/RootNavigator.tsx`, `src/screens/auth/*`

Every section below uses the format the planning brief requires:
**Requirement · Options · Recommendation · Reason · Trade-offs · Marketplace implications · Status.**

---

## Supersession notice — 2026-09-03

This page was written before the product owner stated the authentication direction. Three
positions on it have since been decided, and the original reasoning is left intact below
rather than rewritten, per [../documentation-strategy.md](../documentation-strategy.md) §4.

| Section | Was | Now |
|---|---|---|
| A-1 anonymous browsing | PROPOSED (recommended) | **DECIDED — guest browsing is allowed** |
| A-2 guest checkout | PROPOSED (recommended against) | **DECIDED — an account is required before checkout** |
| A-3 credential type | PROPOSED — email + password for v1 | **SUPERSEDED — the initial credential type is mobile number + OTP** |
| A-6 password reset | Must-Have | **No longer applies to v1** — an OTP flow has no password. Re-applies only if a password credential is added |

Source: [product-vision.md](product-vision.md) §4. A-4, A-5, A-7 and A-8 are unchanged.

---

## 0. CURRENT behaviour (for contrast — do not confuse with any of the below)

| Fact | Evidence |
|---|---|
| Any non-empty email and password authenticates | `src/store/userStore.ts:21-33` |
| `password` is accepted and never read (one of the 6 lint errors) | `userStore.ts:21` |
| The user is always `John Doe`, whatever was typed | `userStore.ts:25` |
| Sign-up calls the same `login` action and discards the entered name | `SignupScreen.tsx:34` |
| No token, no session, no expiry, no refresh, no revocation | whole file |
| Nothing is persisted — every launch starts logged out | `docs/archive/pre-ui-baseline/current-state/state-management.md` |
| The whole app is gated: unauthenticated users see only Login/Signup | `RootNavigator.tsx:15` |
| The cart is **not** cleared on logout | `userStore.ts:34-39` (APP-11) |

Status of the current implementation: **MOCK / PROTOTYPE**.

---

## A-1. Can a customer browse without an account?

**Requirement.** PR-1. A shopper should be able to see the catalogue before committing to
anything.

**Options.**

| Option | Description |
|---|---|
| A. Anonymous browsing, authenticate at checkout | Catalogue and cart are public; the auth wall sits in front of payment |
| B. Full gate (today's behaviour) | Nothing is visible before login |
| C. Anonymous browsing + guest checkout | No account ever required |

**Recommendation: A.**

**Reason.** Requiring an account before a shopper has seen a single garment is the largest
avoidable drop-off in a retail funnel, and the catalogue contains nothing private. Option C
is rejected separately in A-2. Option B also has a technical cost specific to this codebase:
`RootNavigator.tsx:15` swaps the entire navigator tree on `isLoggedIn`, so the catalogue
cannot be pre-warmed, deep-linked, or shown behind the auth screen.

**Trade-offs.** The navigator root must be restructured (auth becomes a presented stack
rather than a root branch) — that is Phase 2 work, and it also removes the `Profile`
duplication (NAV-01) as a side effect. Cart must be able to exist without a customer id,
then be claimed on login.

**Marketplace implications.** **Safe.** Public catalogue is a hard requirement for a
marketplace (storefront pages must be linkable and indexable).

**Status: DECIDED 2026-09-03 — Option A. Still needs ADR-0009 to record the reasoning and
the navigator consequences.**

---

## A-2. Guest checkout?

**Requirement.** BR-1 vs BR-4: buy easily, but be able to see your orders afterwards.

**Options.** Guest checkout with email-only order lookup · account required · guest with
optional post-purchase account creation.

**Recommendation: account required for v1.**

**Reason.** Order history is a Must-Have (PR-9), and an order that belongs to an email
address rather than a user is a second ownership model: every order query, every
authorisation check, and every later "claim my guest orders" migration has to handle both.
The saving is one screen; the cost is permanent branching in the order authorisation path.
Revisit once conversion data exists.

**Trade-offs.** Some measurable conversion loss at the checkout step. Accepted because the
first release is about correctness, and because the decision is reversible in one direction
(adding guest checkout later is easier than removing it).

**Marketplace implications.** **Compatible.** Marketplaces generally do offer guest
checkout; deferring it does not block anything, because the ownership model stays
single-valued (`Order.customerId`) until it is deliberately widened.

**Status: DECIDED 2026-09-03 — account required before checkout. Still needs ADR-0009.**

---

## A-3. Credential type

**Requirement.** PR-11.

**Options.**

| Option | Note |
|---|---|
| A. Email + password | What the current screens already collect (`LoginScreen`, `SignupScreen`) |
| B. Phone + OTP | No password to forget; per-message cost; needs an SMS provider |
| C. Social (Apple / Google) | Apple sign-in is **mandatory** on iOS if any other social login is offered |
| D. Magic link | No password; depends entirely on email deliverability |

### DECIDED 2026-09-03 — Option B, phone + OTP

The product owner has selected **mobile number + OTP** as the initial authentication
method. The recommendation below (Option A) is **SUPERSEDED** and is kept for its reasoning
about Option C, which is unaffected.

**Consequences of the decision, which were not analysed when this page was written:**

| Consequence | Note |
|---|---|
| The two existing auth screens do not match | `LoginScreen` and `SignupScreen` collect email and password. Both need redesign — this is UI work in the static-data phase, not backend work |
| An SMS/OTP provider is now a hard dependency | Per-message cost, per-country deliverability, and a rate-limiting requirement. **Provider: OPEN (O-7)** |
| Password reset (A-6) drops out of v1 | There is no password. See the supersession notice |
| OTP is a security surface of its own | Code length and entropy, expiry, attempt limits, resend throttling, per-number and per-device rate limits, and replay protection. None of these existed as requirements before this decision. See [../architecture/security-architecture.md](../architecture/security-architecture.md) |
| Account recovery becomes phone-number recovery | A customer who loses their number loses the account unless a recovery path exists. **OPEN** |
| Identity is keyed on a phone number | Phone numbers are reassigned by carriers. The stable key must be an internal user id, never the number itself |
| A verified phone number is a fulfilment asset | CO-4 already requires a phone for carrier delivery; OTP means it arrives verified |

**Status: DECIDED (credential type) — needs ADR-0009. OTP policy and provider: OPEN (O-7).**

---

### Original recommendation — SUPERSEDED 2026-09-03

**Recommendation: A for v1. Add C (Apple + Google together) in the release that follows.
B and D: Later / not planned.**

**Reason.** The two auth screens already collect exactly email and password, so A is the
only option with zero UI redesign. C is deferred rather than rejected because it forces the
Apple review requirement and a second identity-linking path (same human, two credentials) —
that is real design work, not a checkbox, and it should not be inside the release that also
introduces the backend.

**Trade-offs.** Password handling means password reset, rate limiting, and breach exposure
that C would avoid. Mitigations in [../architecture/security-architecture.md](../architecture/security-architecture.md) §3.

**Marketplace implications.** **Safe**, provided identity is modelled as a `User` that
*has* credentials rather than a user row *being* an email/password pair — otherwise adding
providers later rewrites the table. See [../architecture/domain-model.md](../architecture/domain-model.md) §5.

This last point is now **more** important, not less: a phone-only identity that later gains
email, Apple or Google credentials must not require a second account.

**Status of the original recommendation: SUPERSEDED by the decision above.**

---

## A-4. Identity provider: build or buy?

**Requirement.** PR-11 without inventing security primitives.

**Options.** Backend-native auth (whatever O-1 selects) · dedicated identity provider
(Auth0/Clerk/Cognito/Supabase Auth) · hand-rolled.

**Recommendation: use whatever the chosen backend provides natively; do not hand-roll.
If the backend has no credible auth story, add a dedicated provider.**

**Reason.** This decision is downstream of O-1 (backend platform) and should not be taken
first. Hand-rolling is rejected outright: password hashing, reset-token entropy and expiry,
timing-safe comparison, and lockout are all easy to get subtly wrong and expensive to get
wrong.

**Trade-offs.** A native backend auth couples identity to that backend, which raises the
cost of ever replacing it. A dedicated provider avoids that but adds a vendor, a per-MAU
cost, and a second system to keep in sync with the `Customer` profile.

**Marketplace implications.** **Risky if chosen carelessly.** A marketplace needs one
identity that can hold *both* a customer profile and a seller profile, plus roles and
permissions. Any provider chosen must support custom claims/roles. Rule out anything that
cannot.

**Status: OPEN — blocked on O-1.**

---

## A-5. Session and token handling

**Requirement.** A returning customer should not have to log in on every launch (PR-5 is
the cart equivalent), and a stolen device should not be a permanent account compromise.

**Recommendation.**

| Element | Recommendation |
|---|---|
| Access token | Short-lived (~15 min), JWT or opaque, held **in memory only** |
| Refresh token | Long-lived, rotating, stored in **iOS Keychain / Android Keystore** |
| Storage mechanism | `react-native-keychain` (or equivalent). **Never** AsyncStorage or MMKV for tokens |
| Refresh trigger | On 401, single-flight, queue and replay the failed requests |
| Logout | Revoke the refresh token server-side, clear Keychain, clear the cart (fixes APP-11), reset navigation |
| Expiry handling | Silent refresh; only surface a login prompt when refresh itself fails |
| Multi-device | Allowed; each device holds its own refresh token so one logout does not kill the others |

**Reason for in-memory access tokens.** Anything written to disk is readable on a rooted or
jailbroken device and in device backups. Keeping only the long-lived credential in
hardware-backed storage keeps the blast radius to one revocable token.

**Trade-offs.** A refresh round-trip on every cold start, and a single-flight refresh queue
is genuinely fiddly code — it needs a test (see [../implementation/testing-plan.md](../implementation/testing-plan.md) §4).

**Marketplace implications.** **Safe**, provided the token carries a role/scope claim from
the beginning even when the only value is `customer`. Adding a claim later means every
issued token must be re-minted.

**Status: PROPOSED — needs ADR-0010.**

---

## A-6. Password reset — NOT APPLICABLE to v1 as decided

> **Superseded 2026-09-03.** The decided credential type (A-3) has no password, so there is
> nothing to reset. This section applies only if a password credential is added later, and
> the reasoning below is kept for that case. The v1 equivalent problem is **account
> recovery when a customer loses access to their phone number**, which is **OPEN**.

**Requirement (if a password credential exists).** PR-11.

**Recommendation.** Emailed single-use, time-limited (~30 min) reset token; reset invalidates
all existing refresh tokens; the request endpoint responds identically whether or not the
address exists.

**Reason.** The identical-response rule prevents the endpoint being used to enumerate which
email addresses have accounts. Invalidating sessions on reset is what makes a reset an
actual recovery from compromise rather than a password change alongside an attacker's live
session.

**Trade-offs.** Requires transactional email before launch — a dependency worth surfacing
early because it also serves order confirmations.

**Marketplace implications.** **Safe.**

**Status: NOT APPLICABLE to v1. Retained for a future password credential.**

---

## A-7. Authorisation

**Requirement.** BR-4: a customer sees their own orders and nobody else's.

**Recommendation.** Ownership enforced **server-side on every request**, never by the
client. Roles exist from day one as a field with a single value (`customer`), not as an
absent concept.

**Reason.** `OrderDetailsScreen.tsx:15` currently does `orders.find(o => o.id === orderId)`
in the component body against a static array. When that becomes an API call, the natural
translation is `GET /orders/:id` — and if the server does not check ownership, order
detail becomes an enumeration hole. Naming this now prevents that specific translation bug.

**Trade-offs.** None material.

**Marketplace implications.** **Blocking if omitted.** Sellers see only their own store's
orders; admins see all. A permission model retrofitted after seller onboarding means
auditing every existing endpoint.

**Status: PROPOSED — needs ADR-0009; role and permission detail deferred to the seller ADR.**

---

## A-8. What must NOT be carried forward from the prototype

| Current behaviour | Disposition |
|---|---|
| Fabricated `John Doe` user | Delete. Phase 5. |
| `isLoggedIn` boolean alongside `user` (APP-12) | Collapse to one derived source of truth |
| `useAuthStore` (`src/store/authStore.js`) — dead, duplicate, better-named than the live store | Delete in Phase 1 before anyone wires it up by mistake |
| `setUser` — no callers (DEAD-05) | Delete unless the new flow needs it |
| Cart surviving logout (APP-11) | Fix as part of the logout sequence in A-5 |
| Whole-app auth gate | Replaced per A-1 |

---

## Verification (§8 traceability)

| Requirement | Verified by |
|---|---|
| PR-1 anonymous browsing | E2E: cold start with no session reaches the catalogue |
| PR-11 register/login/logout | Integration tests per endpoint + one E2E happy path |
| A-3 OTP policy | Integration: an expired code is rejected; a code is single-use; the attempt limit locks further tries; resend is throttled; a code issued for one number cannot authenticate another |
| A-5 token lifecycle | Unit test on the refresh single-flight queue; integration test that an expired access token transparently refreshes once |
| A-6 no enumeration (if a password credential is added) | Integration test: reset request for an unknown address returns the same status and body as for a known one. The same rule applies to OTP request: the response must not reveal whether the number has an account |
| A-7 ownership | Integration test: customer B requesting customer A's order id receives 404 (not 403 — do not confirm existence) |

---

## Related

- [../architecture/security-architecture.md](../architecture/security-architecture.md)
- [../archive/pre-ui-baseline/features/authentication.md](../archive/pre-ui-baseline/features/authentication.md) — current MOCK behaviour
- [product-requirements.md](product-requirements.md)
- [product-vision.md](product-vision.md) §4 — the decided authentication direction
