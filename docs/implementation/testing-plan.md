# Testing Strategy

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED
Last Verified: 2026-09-03
Source: `docs/archive/pre-ui-baseline/current-state/testing.md` + the requirements set

---

## 1. Where testing starts from

| Fact | Evidence |
|---|---|
| `npx jest` executes **0 tests** | `known-issues.md` QUAL-01 |
| Cause | Reanimated 4 ships untranspiled ESM; the default RN preset does not transform it |
| Test files in the repository | 1 (`__tests__/App.test.tsx`), which does not run |
| Coverage | 0% |
| E2E tooling | None |
| CI | None |

So there is no regression net at all. Every claim in this document about "what
tests protect" describes a thing that does not yet exist.

This matters more than usual here, because Phase 1 deliberately changes what the app
displays. Without tests, "the catalogue changed" and "the catalogue broke" look identical.

---

## 2. What is actually worth testing

The failure modes worth spending test effort on, ranked by what they cost when they escape:

| Rank | Failure | Cost | Tested by |
|---|---|---|---|
| 1 | Wrong money — total, tax, currency, rounding | Refunds, chargebacks, trust | Unit + integration |
| 2 | Duplicate order or double charge | Direct financial loss | Integration |
| 3 | Overselling stock | Cancellations, manual recovery | Integration |
| 4 | One customer sees another's order | Breach | Integration, per endpoint |
| 5 | Session lost or refresh deadlock mid-checkout | Abandoned carts | Unit + integration |
| 6 | Cart lost on relaunch | Abandoned carts | Unit |
| 7 | A network error renders a blank screen | Looks broken; support load | Component |
| 8 | Navigation dead end | Support load | E2E |
| 9 | A screen renders wrong | Cosmetic, usually caught by eye | Component, sparingly |

**Nothing below rank 9 gets a test written for it on purpose.** No snapshot suites, no
tests that assert a `StyleSheet` value, no test that a component renders without crashing
and asserts nothing further. Those cost maintenance and catch nothing.

---

## 3. The layers

### Unit — pure logic, no React, no network

The natural targets, all of which are currently untested pure functions or would become
them:

- money: parsing, arithmetic, rounding, formatting for display (PR-9)
- cart: add, merge same variant, remove at quantity zero, line total, cart total
- display-status derivation from `paymentStatus` × `fulfilmentStatus` (CO-4)
- DTO ↔ domain mappers, including the tolerated-nulls cases
- the refresh-token single-flight queue (A-5)
- validators: address, email, quantity bounds

Fast, no mocking framework needed, and they are where the business rules actually live
once Phase 2 puts each rule in one place. This is the layer that should have the most tests
and the least ceremony.

### Component — a screen or component with its states

One test per **state**, not per element:

- loading renders the loading state
- error renders the error state with a working retry
- empty renders the empty state
- populated renders the rows

Plus interaction tests only where a component owns real logic: the quantity stepper's
bounds, the variant selector disabling out-of-stock sizes, the checkout form's validation
messages.

`@testing-library/react-native` rather than raw `react-test-renderer` — the current test
file uses the latter and asserts nothing. Query by accessible role and label, which makes
the tests double as an accessibility check.

### Contract — the seam that makes the backend swappable

Written in Phase 2 against the fixture repository, re-run unchanged in Phase 4 against the
HTTP repository. One suite, two implementations, both must pass.

This is the single highest-leverage test investment in the plan: it is what makes the
"fixtures now, API later" strategy real rather than aspirational, and it is what catches
the inevitable small disagreements between the seeded catalogue and the fixture data.

### Integration — the app against a real test backend

Everything on the money and identity paths:

- register, login, refresh, logout, password reset
- expired access token transparently refreshed mid-request
- identical responses for known and unknown emails on reset (A-6)
- checkout re-prices server-side; a tampered client total is rejected
- the same idempotency key twice creates one order (CO-8)
- two concurrent checkouts for the last unit: one succeeds, one fails cleanly
- payment webhook replay creates no second order
- customer B requesting customer A's order gets 404, not 403 (A-7)

These run against a seeded test backend, not mocks. A mock cannot be concurrent with
itself, and concurrency is where three of these bugs live.

### E2E — the critical journeys only

Detox or Maestro; the choice is ADR-0023 and is genuinely open — Maestro's flows are far
cheaper to write and maintain, Detox gives finer control. Recommendation is Maestro unless
a specific need for Detox's determinism appears.

Three flows, no more:

1. Browse → open product → select size → add to cart → checkout → pay (test mode) → order appears in history
2. Register → browse → log out → log in → the cart is still there
3. Category → product list → product → back → back, ending where it started

E2E is the slowest and flakiest layer. Three stable flows that people trust beats twenty
that get muted after the third false failure.

---

## 4. Requirement → test mapping

| Requirement | Verified by |
|---|---|
| PR-1 anonymous browsing | E2E flow 1 starts logged out |
| PR-4 variants | Component: size selector; integration: an order line carries the variant |
| PR-5 cart persistence | Unit: round trip; E2E flow 2 |
| PR-6 server pricing | Integration: tampered total rejected |
| PR-7 payment | Integration: idempotency, webhook replay; E2E flow 1 |
| PR-8 order record | Integration: order exists with the right total after payment |
| PR-9 money | Unit: rounding and formatting |
| PR-10 inventory | Integration: concurrent last-unit checkout |
| PR-11 auth | Integration: the auth suite |
| PR-13 order history | Integration: ownership; component: the three states |
| CO-4 two-axis status | Unit: the display mapping table, every combination |
| CO-8 idempotency | Integration: repeated key |
| A-5 token storage | Unit: refresh queue; CI grep: no token outside the secure store |
| A-7 ownership | Integration: 404 for another customer's order |

Every row in `product-requirements.md` and `checkout-and-order-requirements.md` that is not
listed here is either UI-only or Later-scoped. That is deliberate, not an omission.

---

## 5. What CI runs

| Trigger | Runs |
|---|---|
| Every push and PR | typecheck, lint, unit, component, contract |
| Every PR | the above, plus integration against an ephemeral test backend |
| Nightly and pre-release | the above, plus E2E on both platforms |
| Pre-release | plus a release-build regression pass and an accessibility audit |

Two extra CI checks that are not tests but belong in the same gate:

- **no secret in the tree** — the keystore and any `.env` must not be committed (BUILD-01)
- **no token outside the secure store** — a grep for token writes to unencrypted storage

Both are cheap and both guard mistakes that are expensive and quiet.

---

## 6. Coverage

No global coverage threshold. A percentage target on this codebase would be met by testing
the easy 70% — components and constants — and would say nothing about the money path.

Instead: **the modules in §2 ranks 1–6 must have tests, reviewed by inspection at each phase
gate.** A percentage may be added later as a ratchet against regression, never as a goal.

---

## 7. Test data

- Unit and component: inline fixtures in the test, no shared fixture module that every test
  quietly depends on
- Contract: the same fixture set the fixture repository serves, so the two implementations
  are compared on identical data
- Integration: a seeded backend reset per run
- E2E: a dedicated test account and the payment provider's test cards

No test touches production. No test uses a real payment method.

---

## 8. What is deliberately not planned

| Not doing | Why |
|---|---|
| Snapshot tests | They fail on every intentional change and get regenerated without reading. Negative value |
| Visual regression | Needs a stable design first; revisit after Phase 7 |
| Load testing | No traffic to model. Revisit when there is |
| Mutation testing | Not until the suite it would measure exists |
| 100% coverage | See §6 |

---

## Related

- [implementation-phases.md](implementation-phases.md) — the per-phase test obligations
- [../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md) — what exists today
- [../architecture/security-architecture.md](../architecture/security-architecture.md) §8
