# Migration Plan — Strategy

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — sequencing strategy, no phase approved
Last Verified: 2026-09-03
Source: the current-state set + [../architecture/target-architecture.md](../architecture/target-architecture.md)

> This page explains **why the phases are in this order** and what makes each one safe.
> The phases themselves are specified in [implementation-phases.md](implementation-phases.md).
> Issue-by-issue disposition is in [technical-debt-plan.md](technical-debt-plan.md).

---

## 1. Migrate, do not rewrite

**Recommendation: incremental migration. A rewrite is not justified.**

**Reason.** The audit found a prototype with a good skeleton and a bad foundation, not a bad
design. The import graph is acyclic and one-way. `cartStore.ts` is genuinely well built. The
auth gate uses the pattern React Navigation recommends. The order fixtures already snapshot
prices and addresses — the thing rewrites usually get wrong. Roughly 2,900 lines exist;
throwing them away would discard those correct decisions along with the defects, and would
replace a known set of 65 catalogued problems with an unknown set.

**What is genuinely rotten is narrow:** two shadowed module specifiers, a mock auth store, a
checkout that creates nothing, and the absence of three layers (service, persistence,
tests). All four are addable without touching the parts that work.

**When to revisit.** If Phase 1 reveals that the clothing catalogue, the navigation tree and
the screens cannot be reconciled with the target domain model without rewriting most screens
anyway, reconsider — and record it as an ADR superseding this one.

---

## 2. Sequencing principles

1. **Verification before change.** Nothing is migrated until the test suite can run.
   With 0 tests executing, every subsequent claim of correctness would be an opinion.
2. **Truth before design.** The `.js`/`.ts` shadowing is settled before any structural work,
   because until then the running app and the readable app are different programs and every
   diagnosis is unreliable.
3. **Boundaries before backend.** The repository seam is introduced while the data is still
   local fixtures. Adding the seam and the network on the same day means two unfamiliar
   failure modes in one diff.
4. **Local before remote.** Persistence lands before the API, so hydration and cold-start
   behaviour are debugged without a network in the picture.
5. **Read before write.** The first backend integration is the catalogue — read-only,
   idempotent, and safe to retry. Identity and money come after.
6. **Money last.** Payments go in when auth, orders, inventory and the error model already
   work, because a payment bug is the most expensive kind to discover in production.
7. **Every phase ships.** Each one leaves the app in a runnable, verifiable state. No phase
   depends on a later phase to make sense.

---

## 3. Phase dependency graph

```text
Phase 0  Stabilise & verify        ← no behaviour change
   │
Phase 1  Canonical data layer      ← the app finally shows clothing
   │
Phase 2  Structure & contracts     ← repository seam, navigation, states
   │
   ├───────────────┐
Phase 3            │               ← persistence (local only)
Persistence        │
   │               │
   └───────────────┤
                   ▼
        [ O-1 backend platform decided ]   ◄── blocks everything below
                   │
Phase 4  Catalogue over the API
   │
Phase 5  Identity
   │
Phase 6  Commerce: cart, inventory, checkout, payment, orders
   │
Phase 7  Release readiness
   │
Phase 8+ Marketplace enablement    ← Later
```

**Phases 0–3 do not depend on the backend decision.** That is deliberate: roughly half the
migration can start while O-1 is still open, and none of it is wasted whichever way O-1 goes.

---

## 4. What makes each step safe

| Mechanism | How it applies here |
|---|---|
| **A green gate before the first change** | Phase 0 delivers `typecheck + lint + test` in CI. Every later phase must leave it green |
| **Behaviour-preserving phases are labelled as such** | Phases 0 and 2 change no user-visible behaviour. If behaviour changes, something is wrong |
| **One unfamiliar thing at a time** | The seam without the network (2), persistence without the network (3), the network without auth (4), auth without money (5) |
| **Characterisation before replacement** | Before replacing a mock, write a test that pins the current observable behaviour, so the replacement is compared against something |
| **Small, revertible commits** | Every phase is several commits; none of them requires the whole phase to land to be revertible |
| **Feature-flag the risky swap** | Phase 4's repository implementation can be selected by configuration, so a bad API can be reverted without a rebuild |

### Rollback

| Phase | Rollback |
|---|---|
| 0 | `git revert`. No data, no users, no external state |
| 1 | `git revert`. The deleted `.js` files remain in history — this is precisely why they should be deleted rather than left in place "just in case" |
| 2 | `git revert`. No behaviour change to undo |
| 3 | Revert the code and clear the persisted namespace. Storage keys are versioned from the first write so a rollback cannot read a future schema |
| 4 | Configuration switch back to the fixture repository |
| 5 | Not cleanly revertible once real accounts exist. Treat the auth cut-over as one-way and rehearse it |
| 6 | Not revertible once real money moves. Payments go behind a provider test mode until a full E2E passes |
| 7 | Standard release rollback: halt the staged rollout |

**Phases 5 and 6 are the one-way doors.** Everything before them is cheap to undo. This is
the strongest argument for doing Phases 0–3 properly rather than rushing to the backend.

---

## 5. Migration risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Phase 1 changes visible behaviour more than expected — the app currently shows 6 electronics items and will show 15 clothing items with working categories | **Certain** | Expected and desired, but it will look like a regression to anyone unaware | State it in the changelog and in the phase's completion criteria. Screenshot before and after |
| Fixing the Jest transform uncovers further failures | Likely | Phase 0 grows | Timebox. If the suite cannot be made green quickly, get *one* test running and treat the rest as its own task |
| Backend decision (O-1) drags | Likely | Phases 4–6 stall | Phases 0–3 are deliberately independent. Do not let the stall push work forward out of order |
| Variant model arrives late and forces cart and checkout rework | Moderate | High | Put variants in the **schema** at Phase 4 even though the UI only uses them at Phase 6 |
| Money represented as floats survives into production | Moderate | **Severe** — reconciliation failures against the payment provider | Convert to integer minor units at Phase 2, before any real money exists |
| Deleting the eight dead files breaks something unnoticed | Low | Medium | Delete in one commit, with the app run on both platforms immediately after. Two of the eight are what currently runs, so this is the one deletion that must be verified on a device, not just in CI |
| `storeId` omitted "because there is only one store" | Moderate | **Severe** later | Named as PR-15 and enforced as a schema invariant |
| Scope creep from the marketplace vision into v1 | High | Schedule | [../requirements/marketplace-roadmap.md](../requirements/marketplace-roadmap.md) §4 fixes the total v1 obligation at one column on three tables, one enum value, one empty table and one token claim |

---

## 6. What is removed, and what remains

| Removed by the end of Phase 6 | Remains as accepted debt |
|---|---|
| Both shadow files and the resolution ambiguity | No offline support |
| All eight dead/unreachable files | No i18n (PLAT-07), unless the decision changes |
| The mock auth store and the fabricated user | Landscape unsupported, if portrait is locked (PLAT-02) |
| Three duplicated business rules | Single ABI/bundle-splitting work (BUILD-05) |
| Direct fixture imports in three screens | No search until the catalogue justifies it |
| `as never` casts and the `any` navigator | No seller or admin surface |
| Float money | |
| `nativewind` and two other unused dependencies | |

Debt that remains is listed so that it stays visible rather than being forgotten as
"finished".

---

## 7. Documentation obligations per phase

Every phase updates documentation **in the same change**, not afterwards. Detail:
[../documentation-strategy.md](../documentation-strategy.md) §3.

| Phase | Documentation that must change |
|---|---|
| 0 | `current-state/testing.md`, `known-issues.md`, `development/setup.md`, changelog, new ADRs 0018/0019 |
| 1 | `current-state/data-flow.md` (the headline defect is gone — the page must say so), `api/current-state.md`, `known-issues.md`, ADRs 0001/0002/0017, changelog |
| 2 | `current-state/architecture.md`, `navigation.md`, `state-management.md`, `repository-structure.md`, component docs, ADRs 0003/0011/0015/0016 |
| 3 | `state-management.md`, a new `architecture/persistence` section, ADRs 0005/0006 |
| 4 | `docs/archive/pre-ui-baseline/api/` becomes a real contract; `data-flow.md` rewritten; ADRs 0007/0008/0013/0020 |
| 5 | `features/authentication.md` stops saying MOCK; `security-architecture.md` moves from PROPOSED to CURRENT; ADRs 0009/0010 |
| 6 | `features/checkout.md`, `cart.md`, `order-history.md`, `order-details.md`; ADRs 0012/0014/0022 |
| 7 | `current-state/android.md`, `ios.md`, `security.md`, `performance.md`, a release-process page |

**A phase is not complete until its documentation is updated.** This is a completion
criterion, not an aspiration — see [implementation-phases.md](implementation-phases.md).

---

## Related

- [implementation-phases.md](implementation-phases.md) · [technical-debt-plan.md](technical-debt-plan.md) · [testing-plan.md](testing-plan.md)
- [../architecture/target-architecture.md](../architecture/target-architecture.md)
