# TojApp Documentation

Status: Current state documented · Target state PROPOSED
Last Verified: 2026-10-31
Source: Working tree on branch `feature/toj-customer-ui`

Three kinds of document, kept apart:

- **Current state**: [current-state.md](current-state.md) is the one accurate description of
  what exists. Agents should start at [`../AGENTS.md`](../AGENTS.md).
- **Planning**: requirements, target architecture, implementation sequence and decisions. Dated
  2026-09-03 against the pre-UI baseline; each carries a banner. `PROPOSED` or `DECIDED`, never
  presented as built, except where the banner says the UI has since been implemented.
- **History**: [archive/pre-ui-baseline/](archive/pre-ui-baseline/README.md), the former
  per-feature and current-state pages. Evidence for the plans; not true of today's code.

The authoritative statement of **product intent** is
[requirements/product-vision.md](requirements/product-vision.md).

## Current state

| Document | Covers |
|---|---|
| [current-state.md](current-state.md) | Stack, layout, mock behaviour, known gaps |
| [UI_IMPLEMENTATION_PROGRESS.md](UI_IMPLEMENTATION_PROGRESS.md) | Screen inventory, verification, limitations (added with the UI commit) |

## Development

| Document | |
|---|---|
| [development/setup.md](development/setup.md) | Install and run, including what currently fails |
| [development/coding-standards.md](development/coding-standards.md) | Conventions observable in the code today |
| [development/testing.md](development/testing.md) | How to run tests and why they do not run |
| [development/debugging.md](development/debugging.md) | Debugging, including the resolution-conflict trap |
| [development/engineering-standards.md](development/engineering-standards.md) | **DECIDED** — the approved C1–C15 standards and the rule for introducing anything new |

## Requirements — PROPOSED / DECIDED

| Document | Covers |
|---|---|
| [requirements/product-vision.md](requirements/product-vision.md) | **The authoritative product-goal document** — vision, business model, MVP direction, principles, what is OPEN |
| [requirements/product-requirements.md](requirements/product-requirements.md) | Business and product requirements, MVP scope, the blocking open questions |
| [requirements/authentication-requirements.md](requirements/authentication-requirements.md) | Accounts, sessions, guest checkout, what identity must do |
| [requirements/checkout-and-order-requirements.md](requirements/checkout-and-order-requirements.md) | Pricing, payment, idempotency, the order lifecycle |
| [requirements/marketplace-roadmap.md](requirements/marketplace-roadmap.md) | Single store → multi-vendor, and what v1 must not preclude |

## Architecture — PROPOSED

| Document | Covers |
|---|---|
| [architecture/domain-model.md](architecture/domain-model.md) | Entities, the canonical product contract, variants, money |
| [architecture/target-architecture.md](architecture/target-architecture.md) | Target layers, folder structure, state, persistence, API |
| [architecture/security-architecture.md](architecture/security-architecture.md) | Threat model, auth, secrets, payment security |

## Implementation plan — PROPOSED

| Document | Covers |
|---|---|
| [implementation/implementation-phases.md](implementation/implementation-phases.md) | Phases 0–8 in full, plus the readiness checklist |
| [implementation/migration-plan.md](implementation/migration-plan.md) | Why migrate rather than rewrite; sequencing and rollback |
| [implementation/technical-debt-plan.md](implementation/technical-debt-plan.md) | All 65 known issues, dispositioned |
| [implementation/testing-plan.md](implementation/testing-plan.md) | What is tested, at which layer, and what is not |

## Decisions

| Document | |
|---|---|
| [decisions/README.md](decisions/README.md) | The decision log — DECIDED / OPEN / REJECTED — and the 24 ADRs required |
| [documentation-strategy.md](documentation-strategy.md) | How this documentation is structured and kept true |

## Releases

| Document | |
|---|---|
| [releases/changelog.md](releases/changelog.md) | Documentation change log |

---

## Reading this documentation

Every page carries a metadata block:

```text
Status: Current State
Last Verified: 2026-09-03
Source: Repository inspection
```

Status vocabulary is defined in [`../AGENTS.md`](../AGENTS.md) §6.

Every significant technical statement cites a file path, and where useful a line number
and symbol name — for example `src/screens/Orders/OrderHistoryScreen.tsx:113`.
