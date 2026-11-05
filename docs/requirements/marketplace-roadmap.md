# Marketplace Roadmap

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: TARGET (long term) — nothing here is v1 scope
Last Verified: 2026-09-03
Source: product direction stated 2026-09-03

> Everything on this page is **Later**. It exists for one reason: to identify the small
> number of v1 decisions that are expensive to reverse once real orders and real money
> exist. Do not implement any of it. Do not let it inflate v1 scope.

---

## 1. Evolution stages

Geography is a separate axis from the stage: the business starts in **one city** and expands
as practical (D-7). Geographic expansion within one store does not require any of the stages
below — but it does interact with O-5 (countries, currencies, tax) as soon as it crosses a
border, and with O-9 (pickup rules) as soon as a second physical store exists.

```text
Stage 1  Prototype                     CURRENT
Stage 2  Single-store clothing app     DECIDED — this cycle
Stage 3  Backend-backed customer app   planned
Stage 4  Production release            planned
Stage 5  Invite-only second store      Later
Stage 6  Open multi-vendor marketplace Later
```

For each transition the changelog must record: what changed, why, what existed before, what
migration ran, what debt was removed, what debt remains, and what became possible. See
[../documentation-strategy.md](../documentation-strategy.md) §4.

---

## 2. Actors

| Actor | Exists in v1? | Surface |
|---|---|---|
| Customer | Yes | Mobile app |
| Store owner / seller | No | OPEN — see §5 |
| Store staff | No | Later, same surface as seller with reduced permissions |
| Platform admin | No | Later, web |
| Support agent | No | Later; may be the admin surface with a restricted role |

---

## 3. Future capability inventory

Grouped, not scheduled. None is v1.

### Seller onboarding
Registration, store profile (name, slug, logo, policies), identity/business verification,
bank details for payouts, tax registration, terms acceptance, approval workflow, suspension.

### Seller catalogue management
Product create/edit/archive, variant and size-run management, image upload and ordering,
bulk import, per-store category mapping, publish/unpublish, price and stock updates.

### Seller order management
Store-scoped order queue, accept/reject, packing slips, mark shipped with tracking, partial
fulfilment, cancellation and refund requests.

### Payments and money
Split payments or platform-collected payments with payouts, commission model, payout
schedule, statements, chargeback handling, refund liability.

### Platform administration
Seller approval and suspension, catalogue moderation, category taxonomy governance, dispute
resolution, fee configuration, impersonation for support.

### Customer-facing marketplace features
Store categories and store discovery, an **All Products** category spanning stores,
store pages, per-store search facets, multi-store cart (or explicit single-store carts),
per-store shipping and delivery estimates, seller ratings and reviews, report-a-listing.

### Analytics
Seller sales dashboards, platform GMV/take-rate reporting, catalogue quality metrics.

---

## 4. The hard problems, named early

These are the parts of a marketplace that are genuinely difficult. Naming them now prevents
v1 from accidentally choosing a design that makes them impossible.

| Problem | Why it is hard | v1 obligation |
|---|---|---|
| **A cart containing two stores' items** | One payment, two fulfilments, two shipping costs, two cancellation rights, one refund liability question | Model fulfilment per store (checkout-and-order-requirements §2), and put `storeId` on the **order line**, not only the order |
| **Money splitting** | Whose money is it between capture and payout? Refund after payout? | Do not model the store's revenue as "the order total". Keep payments as their own records from day one |
| **Trust and moderation** | Fraudulent sellers, counterfeit listings, abandoned stores | Product `status` field exists from v1 even with one store |
| **Catalogue quality across sellers** | Free-text categories and sizes make search unusable at scale | Category as an entity, size as structured variant data — both already required by v1 (product-requirements §5) |
| **Search across stores** | Grows past what a `LIKE` query serves | No v1 obligation; do not prematurely add a search engine |
| **Permissions** | Seller sees own store only; admin sees all; a person can be both customer and seller | `User` separate from `Customer` / `Seller` profiles, and a role claim on the token, from v1 (authentication-requirements A-4, A-7) |

**The v1 obligations above cost, in total: one column on three tables, one enum value, one
extra table that stays empty, and one token claim.** That is the entire price of
marketplace readiness at this stage. Anything beyond it is premature.

---

## 5. Seller / admin surface — OPEN

**Recommendation: web, not mobile, for both seller and admin.**

**Reason.** Catalogue work is data entry — long forms, bulk edits, image upload, spreadsheet
import, wide tables of orders. A phone is the wrong instrument for all of it. Admin
moderation is the same shape. A responsive web app also ships without store review, which
matters when the audience is a few hundred sellers rather than the public.

**Trade-offs.** Sellers genuinely want mobile notifications and a quick "mark as shipped" on
their phone. The likely end state is a web platform plus a small seller mobile companion —
but the companion is not the first thing to build.

**Alternatives considered.**

| Option | Verdict |
|---|---|
| Second mobile app for sellers | Rejected as the first surface: highest build cost, worst fit for catalogue entry, store review on every release |
| Seller mode inside the customer app | Rejected: couples two products' release cycles, and a customer-app crash takes the seller's store offline |
| Web platform (recommended) | Fits the work; independent deploys; no store review |
| Admin-only tooling first, no seller UI | Viable for Stage 5 (invite-only), where a handful of stores can be onboarded manually |

**Status: RECOMMENDATION — needs ADR-0024. Not scheduled.**

### Technology note

If a web surface is built, whether it shares code with the mobile app (a monorepo with
shared domain types and API client) is a **separate** open question. Sharing *types and API
contracts* is almost certainly worth it; sharing *UI* across React Native and web is
usually not. Do not decide this until the backend and the API contract exist, because the
shared layer is defined by them.

---

## 6. Marketplace-impact classification of v1 decisions

Per §45 of the planning brief. `Safe` = no marketplace consequence · `Compatible` = works,
may need extension · `Risky` = works but raises later cost · `Blocking` = must be changed
before a second store exists.

| v1 decision | If decided as recommended | If decided otherwise |
|---|---|---|
| Product model with `storeId` | Safe | **Blocking** — retrofitting a tenant key onto live orders and payments |
| Variant-level price and stock | Safe | Risky — per-seller pricing needs it |
| Category as an entity | Safe | Risky — free-text categories cannot be governed across sellers |
| Money as integer minor units | Safe | **Blocking** for payouts and commission arithmetic |
| Payment status separate from fulfilment status | Compatible | **Blocking** for multi-store orders |
| `User` separate from `Customer` profile | Safe | Risky — a seller who is also a customer needs two accounts |
| Role claim on the token | Safe | Risky — every issued token must be re-minted |
| Order lines snapshot price and title | Safe | Risky — seller price edits would rewrite history |
| Pickup eligibility per product, pickup store on the order | Safe | **Blocking** — a marketplace pickup is per store; an app-wide pickup flag cannot express it |
| Identity keyed on an internal user id, phone as an attribute | Safe | **Blocking** — carriers reassign numbers, and a seller-plus-customer human needs one identity |
| A review bound to an order line | Safe | Risky — cross-seller review fraud is the failure mode a purchase link prevents |
| Account-required checkout (no guest) | Compatible | Compatible either way |
| REST API | Compatible | Compatible either way |
| Zustand for client state | Safe | Safe either way |
| Drawer vs tabs navigation | Safe | Safe either way |

---

---

## 7. Expansion beyond clothing

Possible if the business eventually requires it — **not planned, not designed for**. The v1
obligations in §4 happen to make it survivable (category is an entity, variants are
structured, `storeId` exists), but nothing beyond that is to be built for it. Size-based
variants are a clothing assumption baked into the domain model; a non-clothing category
would need a general attribute model, which is a real piece of work and explicitly out of
scope.

**Status: FUTURE, unplanned.**

---

## Related

- [product-vision.md](product-vision.md) §6 — the decided store/marketplace direction
- [product-requirements.md](product-requirements.md)
- [../architecture/domain-model.md](../architecture/domain-model.md)
- [../architecture/target-architecture.md](../architecture/target-architecture.md)
