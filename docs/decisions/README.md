# Architecture Decisions

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: Decision log — product direction DECIDED, architecture PROPOSED
Last Verified: 2026-09-03
Source: repository state, and the planning set under `docs/requirements/`, `docs/architecture/`, `docs/implementation/`

---

## 1. Purpose

Architecture Decision Records live here. **No ADR has been written yet.** What follows is
the register of decisions that must be recorded, their current state, and the rules that
govern them.

This page is an index and a log. It is maintained in place. The ADRs it points to are not:
once accepted, an ADR is never edited to say something different — it is superseded.
See [../documentation-strategy.md](../documentation-strategy.md) §4.

---

## 2. Decision log

Six states, used consistently across the whole documentation set:

| State | Meaning |
|---|---|
| **DECIDED** | The user or the team has chosen. Binding |
| **PROPOSED** | A recommendation with reasoning exists. Not binding until approved |
| **OPEN** | The question is identified and genuinely unanswered |
| **REJECTED** | Considered and declined, with the reason recorded |
| **DEPRECATED** | Was true, no longer applies |
| **SUPERSEDED** | Replaced by a later decision, which is named |

### DECIDED

| # | Decision | Recorded |
|---|---|---|
| D-1 | The product is a **clothing** store, not electronics | 2026-09-03, from the user |
| D-2 | v1 is a **customer-facing mobile shopping app for one store** | 2026-09-03, from the user |
| D-3 | The long-term direction is a **multi-vendor clothing-first marketplace** | 2026-09-03, from the user |
| D-4 | A **backend will exist**; the app will not stay fixture-driven | 2026-09-03, from the user |
| D-5 | Seller and admin are **future products**, not v1 | 2026-09-03, from the user |
| D-6 | **Documentation-first**: document, decide, record the decision, then implement | 2026-09-03, from the user |
| D-7 | v1 is **men's clothing**, launching in **one city**, as a real commercial product | 2026-09-03, from the user |
| D-8 | **Guest browsing is allowed**; an **account is required before checkout** | 2026-09-03, from the user |
| D-9 | Initial credential type is **mobile number + OTP** | 2026-09-03, from the user |
| D-10 | **Store pickup** is a supported fulfilment option, modelled **per product** | 2026-09-03, from the user |
| D-11 | Notifications are **order-related only** initially | 2026-09-03, from the user |
| D-12 | **Search, filters and promotions are deferred**; categories are the discovery mechanism | 2026-09-03, from the user |
| D-13 | Profile contains exactly Personal Information, My Orders, Wishlist, Help/Support, Logout. Settings stay minimal and functional only | 2026-09-03, from the user |
| D-14 | **Wishlist and reviews are desired for MVP, conditional** on not delaying the core flow. Reviews are restricted to verified purchasers | 2026-09-03, from the user |
| D-15 | Development strategy: **UI + static data first**; backend, payments, seller platform and marketplace infrastructure are not built prematurely | 2026-09-03, from the user |
| D-16 | The **engineering standards C1–C15** and the no-gratuitous-library rule are approved and binding on new code | 2026-09-03, from the user |

D-1 resolves what this page previously listed as the top open question. Everything in the
`requirements/` and `architecture/` set is built on D-1 to D-5.

### Architecture recommendations that D-16 promotes

D-16 approves the *direction* of several previously PROPOSED architecture positions. They
still need their ADRs — an approved direction is not a recorded decision — but the question
is now "how", not "whether":

| Standard | Was | Now |
|---|---|---|
| C6 — Screen → Hook → Repository → Fixture/API | PROPOSED (ADR-0016) | Direction approved |
| C7 — keep Zustand | PROPOSED (ADR-0003) | Direction approved |
| C8 — TanStack Query only when server state arrives | PROPOSED (ADR-0004) | Direction approved, **including the timing** |
| C9 — StyleSheet + centralized design tokens | PROPOSED (ADR-0017) | Direction approved |
| C11 — feature-first organization | PROPOSED (ADR-0016) | Direction approved |
| C1/C2 — strict TypeScript, no unjustified `any` | Implicit | Explicit standard |

### OPEN — and blocking

| # | Question | Blocks |
|---|---|---|
| O-1 | Backend platform: custom, BaaS, or headless commerce | Phases 4–6, ADR-0007, ADR-0008 |
| O-2 | Team size, budget, timeline, in-house backend skill | O-1 — this is what actually decides it |
| O-3 | Launch scope: how many products, which store, when | Phase 7 planning |
| O-4 | Payment provider and the markets it must serve | ADR-0014, Phase 6 |
| O-5 | Countries, currencies, tax and shipping rules | Checkout detail, the money model's edges |
| O-6 | Drawer or tabs as the primary navigation | ADR-0015, Phase 2 |
| O-7 | OTP delivery provider and OTP policy (length, expiry, attempt and resend limits, per-number rate limit), plus account recovery when a customer loses their number | ADR-0009, Phase 5 |
| O-8 | Commerce policy: delivery pricing, free-delivery threshold, minimum order value, cancellation rules, return window, refund rules | The checkout UI cannot be finished without it |
| O-9 | Store pickup rules: which stores, which products, hold period, identification at collection | PR-17, the pickup checkout branch |
| O-10 | Final UI design system, branding, app name and identity | Major UI implementation. **This is the one that gates the phase D-15 says to do first** |
| O-11 | Exact product category taxonomy | Catalogue seeding, PR-2 |
| O-12 | Customer-support implementation | The Help/Support profile entry (D-13) |
| O-13 | Push notification provider, and whether push ships in v1 | PR-18, D-11 |

Detail: [../requirements/product-requirements.md](../requirements/product-requirements.md) §G.

### REJECTED

| Rejected | Why | Recorded in |
|---|---|---|
| Full rewrite | The navigation tree, store shapes and component set are sound; the defects are data-layer and infrastructure. Nothing found justifies discarding them | [../implementation/migration-plan.md](../implementation/migration-plan.md) §1 |
| Keep the electronics catalogue | Contradicts D-1 | This log |
| Guest checkout in v1 | Adds an order-claiming and identity-merge problem for a marketplace that will need accounts anyway | [../requirements/authentication-requirements.md](../requirements/authentication-requirements.md) A-2 |
| Floating-point money | Rounding errors on a payment path are unrecoverable | [../architecture/domain-model.md](../architecture/domain-model.md) §4 |
| A mobile seller app first | Sellers manage catalogues on a keyboard | [../requirements/marketplace-roadmap.md](../requirements/marketplace-roadmap.md) |
| Catalogue search in the first phase | Deferred by D-12. Categories are the discovery mechanism at launch catalogue size | [../requirements/product-vision.md](../requirements/product-vision.md) §7 |
| Coupon / promotion infrastructure now | Deferred by D-12. A pricing-rules surface with no business rules behind it | Same |
| Marketing / promotional notifications | Not an initial priority (D-11) | Same, §9 |
| Settings entries that do nothing | D-13: settings contain only genuinely functional settings. The current inert toggles are placeholders, not requirements | Same, §8 |

### SUPERSEDED

| Position | Superseded by | Where |
|---|---|---|
| Email + password as the initial credential type | D-9, mobile + OTP | [../requirements/authentication-requirements.md](../requirements/authentication-requirements.md) A-3 |
| Password reset as a v1 Must-Have | D-9 — there is no password. Replaced by phone-number account recovery, which is OPEN (O-7) | Same, A-6 |
| Catalogue search as a Should-Have | D-12 | [../requirements/product-requirements.md](../requirements/product-requirements.md) §6 |
| Reviews as a Could-Have, marketplace-era | D-14 — conditional MVP | Same |
| Push notifications as "nice; polling works" | D-11 — order notifications are the decided initial scope | Same |

---

## 3. ADRs required

None written. Each row is a decision that must be recorded **before** the code implementing
it is written. Grouped by the phase that needs it.

### Before Phase 0

| ID | Title | State |
|---|---|---|
| ADR-0018 | Testing strategy: layers, tooling, what is not tested | PROPOSED — [../implementation/testing-plan.md](../implementation/testing-plan.md) |
| ADR-0019 | CI pipeline and release signing | PROPOSED — closes BUILD-01 |

### Before Phase 1

| ID | Title | State |
|---|---|---|
| ADR-0001 | Canonical product contract: `title`, `id: string`, `categoryId`, ordered images | PROPOSED — [../architecture/domain-model.md](../architecture/domain-model.md) §2 |
| ADR-0002 | Single-language source tree: TypeScript only; the `.js` shadows are deleted | PROPOSED — root cause of the defining defect |
| ADR-0017 | Styling: keep `StyleSheet` + design tokens; remove the unused `nativewind` | PROPOSED — [../architecture/target-architecture.md](../architecture/target-architecture.md) §9 |

### Before Phase 2

| ID | Title | State |
|---|---|---|
| ADR-0003 | Client state: keep Zustand; what it owns and what it does not | PROPOSED |
| ADR-0011 | Money as integer minor units with an explicit currency | PROPOSED |
| ADR-0015 | Navigation structure and typing; drawer vs tabs | PROPOSED — **needs O-6** |
| ADR-0016 | Feature-first folder structure, layering rules, and the repository seam | PROPOSED |

### Before Phase 3

| ID | Title | State |
|---|---|---|
| ADR-0005 | Local storage engine (MMKV recommended) and key versioning | PROPOSED |
| ADR-0006 | Secure token storage: Keychain / Keystore, never plain storage | PROPOSED |

### Before Phase 4

| ID | Title | State |
|---|---|---|
| ADR-0007 | Backend platform | **OPEN — blocked on O-1 and O-2** |
| ADR-0008 | API style: REST + OpenAPI | PROPOSED, contingent on ADR-0007 |
| ADR-0004 | Server-state library (TanStack Query recommended) | PROPOSED |
| ADR-0013 | Multi-tenancy readiness: `storeId` on catalogue and order rows from day one | PROPOSED — cheap now, expensive later |
| ADR-0020 | Environment and configuration strategy | PROPOSED — none exists today |

### Before Phase 5

| ID | Title | State |
|---|---|---|
| ADR-0009 | Authentication model: **mobile + OTP** (D-9), build vs buy | PROPOSED — credential type decided, everything else open |
| ADR-0010 | Session and token lifecycle: in-memory access token, rotating refresh | PROPOSED |
| ADR-0025 | OTP provider and OTP policy: length, expiry, attempt and resend limits, per-number rate limiting, account recovery | **OPEN — blocked on O-7** |

### Before Phase 6

| ID | Title | State |
|---|---|---|
| ADR-0012 | Order state: payment status × fulfilment status, with a derived display status | PROPOSED |
| ADR-0014 | Payment provider and PCI scope | **OPEN — blocked on O-4** |
| ADR-0022 | Product variants and the inventory model | PROPOSED — without this, a clothing order is unfulfillable |
| ADR-0023 | E2E tooling (Maestro recommended) | PROPOSED |
| ADR-0026 | Store pickup: eligibility model, checkout branch, pickup order states | PROPOSED — needs O-9 for the rules, not for the model |
| ADR-0027 | Order notifications: transport, triggers, idempotency | **Needs O-13** |

### Before wishlist and reviews are built (D-14, conditional)

| ID | Title | State |
|---|---|---|
| ADR-0028 | Wishlist and reviews: data model, and how a review is bound to a verified purchase | PROPOSED — reviews cannot precede order lines |

### Before major UI implementation (D-15 puts this first in time)

| ID | Title | State |
|---|---|---|
| ADR-0029 | Design system: tokens, component inventory, loading/empty/error state patterns, and the final UI direction | **OPEN — blocked on O-10.** This is the ADR the approved "UI + static data first" strategy needs soonest, and it is the one with the least written about it |

### Before Phase 7

| ID | Title | State |
|---|---|---|
| ADR-0021 | Observability: crash reporting, logging, and field scrubbing | PROPOSED |

### Later

| ID | Title | State |
|---|---|---|
| ADR-0024 | Seller surface: platform and scope | NOT YET NEEDED |

**29 ADRs. Four are hard-blocked on product answers (0007 backend, 0014 payment provider,
0025 OTP provider, 0029 design system); two need answers that are cheaper to get (0015
needs O-6, 0027 needs O-13). The remaining 23 can be written and approved now.**

ADR-0029 deserves attention out of proportion to its number: the approved development
strategy (D-15) says the UI and static-data phase comes first, and that phase is gated on a
design-system decision that is currently OPEN with no recommendation written.

---

## 4. Decisions made implicitly, before this documentation existed

Not ADRs — choices visible in the code with no recorded rationale. Listed so that anyone
changing them knows what they cost.

| Implicit choice | Evidence | Cost to change today | Disposition |
|---|---|---|---|
| React Native 0.82.1, New Architecture | `package.json`, `gradle.properties`, `Info.plist` | High — the whole platform | Keep. Nothing found argues against it |
| Hermes | `gradle.properties` | Low — a flag | Keep |
| React Navigation v7, drawer + tabs + stacks | `src/navigation/` (7 files) | Medium — 17 registrations | Keep the library; restructure the tree (ADR-0015) |
| Zustand for client state | `src/store/` (4 files, ~160 lines) | Low | Keep (ADR-0003) |
| `StyleSheet.create` + a `colors` module | 18 files, 146 references | Medium | Keep, adopt the unused tokens (ADR-0017) |
| Hardcoded fixtures in `src/data/` | 6 files | Low — replacing them is the plan | Replace in Phase 4 |
| TypeScript `strict: true` | `tsconfig.json` | Low — 1 error total | Keep. Add `forceConsistentCasingInFileNames` |
| Jest + `react-test-renderer` | `jest.config.js`, `__tests__/` | Low — 0 tests run | Keep Jest, add Testing Library (ADR-0018) |
| `nativewind` installed, unconfigured, unused | `package.json` only | None | Remove (ADR-0017) |
| Metro `sourceExts` default order | The RN default | None | Irrelevant once ADR-0002 lands |
| Email + password auth screens | `src/screens/auth/` | Low — two screens, no backend behind them | **Replace.** D-9 decided mobile + OTP; the screens collect the wrong credential |
| Inert Settings toggles | `SettingsScreen.tsx` | None | **Remove or implement.** D-13 forbids decorative settings |

---

## 5. When an ADR is required

Required when a change: adds or removes a dependency · changes a data contract · changes
state, persistence, navigation or authentication · touches money, security or customer
data · or would be expensive to reverse.

Not required for: a bug fix that changes no contract, a patch bump, formatting, or a rename
with no semantic change.

---

## 6. ADR format

File name `NNNN-short-title.md`.

```markdown
# NNNN. <Title>

Date: YYYY-MM-DD
Status: Proposed | Accepted | Rejected | Superseded by [NNNN](NNNN-….md) | Deprecated

## Context
What forced the decision. Cite file:line evidence and the current-state documents.

## Problem
The specific problem being solved.

## Requirements
Which requirements this must satisfy. Reference their IDs.

## Options considered
Each option with its real trade-offs. Not a strawman set.

## Decision
What was chosen, stated plainly.

## Why
The reasoning, including what would have changed the answer.

## Trade-offs accepted
What is worse because of this choice.

## Rejected alternatives
Each, with why it lost.

## Risks
What could go wrong, and the early warning sign for each.

## Consequences
What becomes easier, what becomes harder, what must change in the existing code.

## Marketplace impact
Safe | Compatible | Risky | Blocking — for the multi-vendor direction (D-3).

## Migration considerations
How to get from the current state to this one, and how to reverse it.

## Verification
How anyone can confirm this decision is actually in force.
```

Then add a row to §7 and a line in [../releases/changelog.md](../releases/changelog.md).

---

## 7. ADR index

| ID | Title | Date | Status |
|---|---|---|---|
| — | *No ADR written yet* | — | — |

---

## Related

- [../requirements/product-vision.md](../requirements/product-vision.md) — **the authoritative product-goal document behind D-1 to D-16**
- [../development/engineering-standards.md](../development/engineering-standards.md) — the C1–C15 standards behind D-16
- [../requirements/product-requirements.md](../requirements/product-requirements.md) — the open product questions
- [../implementation/implementation-phases.md](../implementation/implementation-phases.md) — which ADR gates which phase
- [../documentation-strategy.md](../documentation-strategy.md) — the supersede-never-rewrite rule
- [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md) — the 65 findings behind most of these

---

## Status update 2026-10-31

D-15 ("UI + static data first") was exercised: the v1 customer UI was implemented against mock
data on explicit request. No ADR was approved and no backend, auth, payment or persistence phase
was started. ADR-0002 (TypeScript-only tree) is satisfied in practice: the `.js` shadows were
deleted. All other ADRs remain PROPOSED.
