# Product Requirements

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: TARGET / PROPOSED — see per-item labels
Last Verified: 2026-09-03
Source: user product direction (2026-09-03) + `docs/archive/pre-ui-baseline/current-state/*`

> Label key (AGENTS.md §6 vocabulary, extended for this phase):
> `DECIDED` — agreed by the product owner. `PROPOSED` — recommended here, awaiting approval.
> `OPEN` — genuinely undecided, listed with options. `CURRENT` — true of the code today.
> Nothing on this page is implemented. See [../archive/pre-ui-baseline/current-state/](../archive/pre-ui-baseline/current-state/) for what is.

**The authoritative statement of product intent is [product-vision.md](product-vision.md).**
This page derives requirement IDs from it. Where the two disagree, the vision page wins and
this page is corrected.

---

## 1. Product definition — CURRENT

A React Native prototype. 12 reachable screens rendering hardcoded arrays. No backend, no
persistence, no real authentication, no order creation. The bundled catalogue is 6
consumer-electronics items (`src/data/products.js`), not the 15 clothing items the
TypeScript layer describes. Full detail: [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md).

## 2. Product definition — DECIDED (initial release)

**TojApp v1 is a customer-facing mobile shopping application for a single clothing store,
initially focused on men's clothing.**

| Dimension | Decision | Status |
|---|---|---|
| Audience | Shoppers. Customer-only. | DECIDED |
| Merchandise | Clothing — **men's clothing initially** | DECIDED |
| Stores | One | DECIDED |
| Geography | **One city at launch**, expanding as practical | DECIDED |
| Commercial intent | A real commercial product, not a demo | DECIDED |
| Platforms | iOS + Android (React Native, bare) | DECIDED |
| Seller surface | Out of scope for v1 | DECIDED |
| Admin surface | Out of scope for v1 | DECIDED |
| Backend | Will exist; does not yet | DECIDED (existence), OPEN (platform) |

### Consequence of "clothing" for the data conflict

`src/data/products.ts` (clothing) is the canonical intent; `src/data/products.js`
(electronics) is obsolete. This resolves the *product* question. It does **not** by itself
resolve the *contract* questions (`title` vs `name`, `string` vs `number` id) — those are
[../architecture/domain-model.md](../architecture/domain-model.md) §2 and need an ADR.

The electronics file is not to be deleted during this phase. Its disposition is
`Delete / Obsolete` in [../implementation/technical-debt-plan.md](../implementation/technical-debt-plan.md),
executed in migration Phase 1.

## 3. Product definition — FUTURE (multi-vendor marketplace)

**TojApp becomes a marketplace where independent store owners register a store and sell.**
Clothing first, other categories possible later.

```text
Stage 1  Prototype                        ← CURRENT
Stage 2  Single-store clothing app        ← DECIDED, this cycle
Stage 3  Backend-backed customer app
Stage 4  Production release
Stage 5  Seller onboarding (one extra store, invite-only)
Stage 6  Open multi-vendor marketplace
```

Detail: [marketplace-roadmap.md](marketplace-roadmap.md).

The only thing the marketplace vision is allowed to influence in v1 is **data shape**, not
features. See [../architecture/target-architecture.md](../architecture/target-architecture.md) §8.

---

## 4. Business requirements → product requirements

Traceability chain per §8 of the planning brief. `BR` = business, `PR` = product.

| ID | Business requirement | Derived product requirements |
|---|---|---|
| BR-1 | A customer can buy a garment and receive it | PR-1…PR-8 |
| BR-2 | The store is paid, once, for what was actually bought | PR-6, PR-7, PR-14 |
| BR-3 | The store never sells stock it does not have | PR-4, PR-13 |
| BR-4 | A customer can see what they ordered and where it is | PR-9, PR-10 |
| BR-5 | The platform can add a second store without re-modelling orders or payments | PR-15 |
| BR-6 | The business can tell when the app is broken in production | PR-16 |

| ID | Product requirement | Traces to | Status |
|---|---|---|---|
| PR-1 | Browse a clothing catalogue without an account | BR-1 | PROPOSED — today the app gates everything behind a mock login |
| PR-2 | Browse by category, from a real category taxonomy | BR-1 | DECIDED |
| PR-3 | View a product: images, name, description, price, availability | BR-1 | DECIDED |
| PR-4 | Choose a **size** (and colour where offered) before adding to cart | BR-1, BR-3 | PROPOSED — **not modelled anywhere today** |
| PR-5 | Cart survives app relaunch | BR-1 | DECIDED (persistence required), OPEN (mechanism) |
| PR-6 | Prices and stock are re-validated by the server at checkout | BR-2, BR-3 | PROPOSED |
| PR-7 | Pay with a real payment method | BR-2 | DECIDED (needed), OPEN (provider) |
| PR-8 | Placing an order creates a durable order record | BR-1, BR-2 | DECIDED |
| PR-9 | View own order history and order detail | BR-4 | DECIDED |
| PR-10 | Order carries a status the customer can understand | BR-4 | DECIDED |
| PR-11 | Register, log in, log out, reset a forgotten password | BR-1 | DECIDED |
| PR-12 | Manage shipping addresses | BR-1 | PROPOSED (at minimum: one address captured at checkout) |
| PR-13 | Stock is decremented/reserved when an order is placed | BR-3 | PROPOSED |
| PR-14 | Order totals are computed server-side and never trusted from the client | BR-2 | PROPOSED |
| PR-15 | Every product and order line carries a store identifier | BR-5 | PROPOSED — see [../architecture/domain-model.md](../architecture/domain-model.md) §5 |
| PR-16 | Crashes and fatal errors are reported off-device | BR-6 | PROPOSED |
| PR-17 | A product may be collected by **store pickup** where the product allows it; pickup eligibility is a property of the product/fulfilment, never an app-wide assumption | BR-1 | DECIDED (capability), OPEN (rules) — **not modelled anywhere today** |
| PR-18 | The customer receives **order status updates** (confirmed, packed, shipped, out for delivery, delivered, pickup ready) | BR-4 | DECIDED (capability), OPEN (channel and timing) |
| PR-19 | The customer can save products to a **wishlist** | BR-1 | DECIDED as desired for MVP, **conditional on not delaying the core flow** |
| PR-20 | A customer can **review a product they have actually purchased**, and only such a product | BR-1 | DECIDED as desired for MVP, **conditional**; the purchase-verification constraint is binding whenever it is built |
| PR-21 | A product may carry an **optional size chart** | BR-1 | DECIDED (capability), OPEN (content and format) |

**Unknown / Requires Verification:** shipping model (flat rate? free over X? carrier-rated?),
tax handling, target country/currency set, and returns policy. None of these is derivable
from the repository. They block PR-6 and PR-14 detail, not the architecture.

---

## 5. Catalog requirements (§23 of the brief)

### Current product record

| Layer | Fields |
|---|---|
| `src/data/products.ts` | `id: string`, `title`, `price: number`, `image`, `category: string`, `description`, `images?: string[]` |
| `src/data/products.js` (what runs) | `id: number`, `name`, `price`, `image`, `description` |

`images` is present in the type layer and read **nowhere** (0 matches for `.images` in `src/`).

### Required for a clothing store — gap analysis

| Attribute | Today | Required v1 | Why |
|---|---|---|---|
| Stable identity | `id`, type disputed | `id: string` | Survives a backend migration; UUIDs are strings |
| Display name | `title` / `name` split | one field, `title` | See domain-model §2 |
| Description | present | present | — |
| Images | one `image`, dead `images[]` | ordered image list | Garments need multiple views; a single hero image is not enough to sell clothing |
| Price | `number` (float, e.g. `89.99`) | integer minor units + currency | **Float money is a correctness defect.** See domain-model §4 |
| Category | free-text `string` on the product | `categoryId` referencing a Category entity | Free text cannot be renamed, translated, nested, or listed reliably |
| **Size** | **absent** | **required** | A clothing store that cannot capture size cannot fulfil an order. This is the single largest functional gap in the product model. |
| Colour | absent | required where the garment offers it | Same reason; also drives which images to show |
| SKU | absent | required | Warehouse/fulfilment reference |
| Stock level | absent | required | PR-13 |
| Availability / status | absent | `draft \| active \| archived` | Needed to hide a product without deleting it |
| Store ownership | absent | `storeId` | PR-15 |
| Timestamps | absent | `createdAt`, `updatedAt` | Sorting ("new in"), cache invalidation, support |
| **Pickup eligibility** | **absent** | required | PR-17. Some products support store pickup and some do not. Modelling it per product prevents a checkout that offers pickup for something that cannot be picked up |
| Size chart | absent | optional, per product | PR-21. Garment sizing is not standardised; a size chart is often the difference between a sale and a return |
| Reviews | absent | related entity, purchase-verified | PR-20. Not a product field — reviews reference an order line so the purchase can be verified |

> **PROPOSED.** Size and colour become a **ProductVariant**, not fields on the product.
> Price, SKU and stock hang off the variant, not the product. Reasoning and alternatives:
> [../architecture/domain-model.md](../architecture/domain-model.md) §3.

### Taxonomy

`src/data/categories.ts` declares 8 categories; only `Tops`, `Bottoms` and `Outerwear`
have products (DATA-07). `Sale` is in the list and is **not a garment category** — it is a
merchandising flag and can never match a single-valued `category` field.

| Concept | PROPOSED handling |
|---|---|
| Tops / Bottoms / Outerwear / Shoes / Accessories / Activewear / Formal | `Category` entity, single-parent tree |
| Sale, New In, Bestseller | separate merchandising concept (tag / collection / promotion), never a category |
| Empty categories | either seed products or do not surface the category; every list gets an empty state regardless (APP-10) |

---

## 6. MVP scope (§18)

Placement rationale is given for every row, as required.

### Must Have — v1 does not ship without these

| Item | Why it is Must |
|---|---|
| Canonical single-language source tree (`.js` shadow layer retired) | Until this is done, no diagnosis and no test result is trustworthy. Everything else is built on sand. DATA-01/DATA-04. |
| A test suite that executes | 0 tests run today (QUAL-01). Without this, "done" cannot be distinguished from "compiles". |
| Release signed with a real, non-committed keystore | BUILD-01, the only P0. Irreversible once published. |
| Real distinct bundle identifiers, iOS + Android | BUILD-02. Cannot register the app, ship, or deep-link without it. |
| Product **variants** (size, and colour where offered) | You cannot fulfil a garment order without a size. |
| Real authentication — **mobile number + OTP** | An account gates order history and checkout. **Supersedes the earlier "email + password with reset" placement**: the decided credential type has no password, so password reset is not a v1 Must. OTP delivery reliability replaces it as the risk to manage. |
| Backend catalogue, cart validation, order creation | The product's entire purpose. APP-03: checkout currently creates nothing. |
| Server-side total and stock validation | Money and inventory correctness. Never trust the client. |
| Real payment | BR-2. |
| Order history from real orders | Today it reads 4 static fixtures unrelated to anything the user did. |
| Cart + session persistence | APP-04. Losing a cart on relaunch is a conversion defect, not a polish item. |
| Loading, error and empty states | APP-09/APP-10. Every network call can fail; today there is no place to say so. |
| Crash reporting | Shipping without it means production defects are discovered from store reviews. |
| Accessibility basics on interactive elements | APP-15: zero accessibility props exist. Labels and hit targets on touchables are the floor, not an enhancement. |
| Address capture at checkout | Cannot ship a parcel otherwise. |
| Delivery-or-pickup selection at checkout | PR-17. Decided as part of the customer experience. Pickup eligibility must exist in the product model before the checkout step can be built. |
| Size selection before add-to-cart | PR-4. A garment order without a size is unfulfillable. |

### Should Have — ship v1 without them only deliberately

| Item | Why not Must |
|---|---|
| ~~Catalogue search~~ | **Moved out of MVP scope.** Product direction 2026-09-03: search is intentionally not a priority for the first phase; categories are the discovery mechanism. Added later based on a real business requirement. See [product-vision.md](product-vision.md) §7 |
| Saved address book (multiple addresses) | One address captured per order is sufficient to fulfil. |
| Delivery method choice | A single flat shipping option is a valid launch position. |
| Order cancellation before dispatch | Can be handled by support email at launch volume. |
| Transactional emails (order confirmation) | Backend concern; in-app confirmation covers the first customers. |
| Push notifications for order status | **Elevated by the 2026-09-03 direction**: order updates are the decided initial notification focus, and pickup-ready notification should eventually be push. Whether push ships in v1 or immediately after is OPEN. Polling order history is the fallback, not the plan. |
| Deep links for products | **Except** the payment-return deep link, which is Must if the payment flow uses a redirect (3DS). |
| Wishlist | PR-19. **Desired for MVP, conditional on not delaying the core shopping flow.** `ProfileScreen.tsx:59` already shows an inert row for it, and §8 of the vision lists it as a required profile entry — so the entry point exists either way. |
| Product reviews and ratings | PR-20. **Desired for MVP, conditional on not delaying the core flow.** Moved up from Could Have by the 2026-09-03 direction. Only verified purchasers may review — that constraint is binding whenever it is built, and it requires order lines to exist first. |

### Could Have

| Item | Note |
|---|---|
| Dark mode | `SettingsScreen` shows an inert toggle today. Cheap once design tokens are adopted; zero revenue impact. |
| Internationalisation | PLAT-07. Single-locale launch is normal; retrofitting costs every screen, so decide the *intent* early even if unimplemented. |
| Tablet / landscape layouts | PLAT-02. Landscape is currently permitted with no landscape layout — the cheapest fix is to lock portrait, not to build the layout. |
| ~~Promo codes~~ | **Intentionally deferred** by the 2026-09-03 direction. Do not add promotional infrastructure now. |

### Later (post-v1, marketplace track)

Seller registration, store creation, seller verification, seller product management,
seller order management, payouts and commission, admin console, moderation, multi-store
catalogue and search, per-store shipping, multi-store cart splitting, analytics dashboards.
All of it: [marketplace-roadmap.md](marketplace-roadmap.md).

---

## 7. Decided vs open — summary

### DECIDED (product owner, 2026-09-03)

1. v1 is a customer-facing mobile app for **one clothing store**, initially **men's
   clothing**, launching in **one city**, as a real commercial product.
2. Long term is a **multi-vendor clothing-first marketplace**; possible expansion beyond
   clothing only if the business later requires it.
3. Seller and admin functionality are separate future products, not v1 features.
4. A backend will be built; none exists today.
5. The clothing catalogue is the intended product direction; the electronics data is not.
6. Technology stack stays React Native / TypeScript / React Navigation / Zustand unless a
   decision justifies otherwise.
7. **Browsing is allowed without an account.** (Previously open.)
8. **An account is required before checkout; no guest checkout in v1.** (Previously open.)
9. **Initial credential type is mobile number + OTP.** (Supersedes the email + password
   recommendation in [authentication-requirements.md](authentication-requirements.md) A-3.)
10. **Store pickup is a supported fulfilment option**, modelled per product.
11. **Order-related notifications** are the initial notification scope; marketing
    notifications are not.
12. **Search, filters and promotions are deferred**; categories are the discovery mechanism.
13. Profile contains exactly: Personal Information, My Orders, Wishlist, Help/Support,
    Logout. Settings stay minimal and functional only.
14. Wishlist and reviews are **desired for MVP, conditional** on not delaying the core flow.
    Reviews are restricted to verified purchasers.
15. Development strategy: **UI + static data first**, backend and payments later.
16. The engineering standards C1–C15 in
    [../development/engineering-standards.md](../development/engineering-standards.md) are
    approved and binding on new code.

Full statements: [product-vision.md](product-vision.md).

### OPEN — blocking

The canonical open-question register is [../decisions/README.md](../decisions/README.md) §2.
Summarised here:

| # | Question | Blocks |
|---|---|---|
| O-1 | Backend platform | everything from Phase 4 |
| O-2 | Team size, budget, timeline, in-house backend skill | O-1 — this is what actually decides it |
| O-3 | Launch scope: how many products, which store, when | Phase 7 planning |
| O-4 | Payment provider and the markets it must serve | Phase 6 |
| O-5 | Countries, currencies, tax and shipping model | money model, checkout, totals |
| O-6 | Drawer + tabs, or tabs only? | navigation rewrite in Phase 2 |
| O-7 | OTP delivery provider and OTP policy | authentication, Phase 5 |
| O-8 | Commerce policy: delivery pricing, free-delivery threshold, minimum order value, cancellation rules, return window, refund rules | checkout totals and the order lifecycle |
| O-9 | Store pickup rules: which stores, which products, hold period, identification at collection | PR-17 |
| O-10 | Final UI design system, branding, app name and identity | major UI implementation |
| O-11 | Exact product category taxonomy | catalogue seeding, PR-2 |
| O-12 | Customer-support implementation | the Help/Support profile entry |
| O-13 | Push notification provider, and whether push ships in v1 | PR-18 |

### OPEN — non-blocking

Storage engine, server-state library, testing tools, CI provider, observability vendor,
minimum OS versions, accessibility standard, i18n intent, dark mode. All carry a
recommendation in the architecture docs and all need an ADR before use.

---

## Related

- [product-vision.md](product-vision.md) — **the authoritative product-goal document**
- [authentication-requirements.md](authentication-requirements.md)
- [checkout-and-order-requirements.md](checkout-and-order-requirements.md)
- [marketplace-roadmap.md](marketplace-roadmap.md)
- [../architecture/domain-model.md](../architecture/domain-model.md)
- [../archive/pre-ui-baseline/current-state/project-overview.md](../archive/pre-ui-baseline/current-state/project-overview.md)
