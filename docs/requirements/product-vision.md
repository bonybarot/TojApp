# Product Vision

Status: **AUTHORITATIVE product-goal document** — DECIDED by the product owner 2026-09-03
Last Verified: 2026-09-03
Source: product direction stated by the product owner, 2026-09-03

> This is the authoritative statement of **what TojApp is, what is being built now, what is
> deliberately not being built yet, and where the product is intended to go**. Where any
> other document disagrees with this page on product intent, this page wins and the other
> document is to be corrected.
>
> Nothing on this page is implemented. For what exists today see
> [../archive/pre-ui-baseline/current-state/project-overview.md](../archive/pre-ui-baseline/current-state/project-overview.md).

Label key, used consistently on every row:

| Label | Meaning |
|---|---|
| **DECIDED** | Approved by the product owner. Binding |
| **OPEN** | Genuinely undecided. Must not be assumed or invented |
| **FUTURE** | Deliberately deferred to a later phase |
| **PROPOSED** | A recommendation exists, not yet approved |

---

## 1. Vision — DECIDED

TojApp is intended to become a **real commercial customer-facing mobile shopping
application**, not a demo and not a prototype.

**Initial product:**

> A modern, easy-to-use React Native mobile shopping application for a **single clothing
> store**, initially focused on **men's clothing**.

**Long-term product:**

> A **multi-vendor clothing marketplace**, where independent shop owners register their
> shops, list products, manage inventory and orders, and sell through the platform.

The customer-facing mobile application is the first priority. A separate seller/admin
platform will be considered later ([marketplace-roadmap.md](marketplace-roadmap.md)).

**The governing constraint:** build so this evolution stays possible, **without building
marketplace complexity into the MVP**. What that costs in v1 is enumerated in
[marketplace-roadmap.md](marketplace-roadmap.md) §4 — one column on three tables, one enum
value, one empty table, one token claim. Anything beyond that is premature.

---

## 2. Business model — DECIDED

### Initial stage

| Dimension | Decision |
|---|---|
| Sellers | One store |
| Merchandise | Men's clothing |
| Surface | Customer mobile application (iOS + Android) |
| Data | Static product data initially |
| Intent | Real commercial product, not a demo |
| Geography | Start in **one city**; expand as practical |

The first version focuses on proving and delivering the **core shopping experience**.

### Future stage — FUTURE

Multiple independent sellers · seller self-registration · seller product management ·
seller inventory management · seller order management · multiple stores · store discovery ·
marketplace functionality · seller/admin platform · possible expansion beyond clothing if
the business eventually requires it.

**None of this is to be built now unless explicitly approved.**

---

## 3. Customer experience goal — DECIDED

The customer should be able to:

| # | Capability | v1 intent |
|---|---|---|
| 1 | Open the application | DECIDED |
| 2 | Browse products **as a guest** | DECIDED — resolves the previously open question of whether browsing requires an account |
| 3 | Browse categories | DECIDED |
| 4 | Open a product | DECIDED |
| 5 | View product images and details | DECIDED |
| 6 | Select a **size** where applicable | DECIDED |
| 7 | Add to cart | DECIDED |
| 8 | Create / log in to an account **before checkout** | DECIDED — resolves the previously open guest-checkout question |
| 9 | Provide or select delivery information | DECIDED |
| 10 | Choose **delivery or eligible store pickup** | DECIDED (capability), OPEN (rules) |
| 11 | Pay online | DECIDED (capability), OPEN (provider) |
| 12 | Place an order | DECIDED |
| 13 | Receive order updates | DECIDED (capability), OPEN (channel timing) |
| 14 | View order history | DECIDED |
| 15 | View order detail and status | DECIDED |
| 16 | Manage their profile | DECIDED |
| 17 | Manage a wishlist | DECIDED as desired for MVP, **conditional** — see §5 |
| 18 | Review products they have purchased | DECIDED as desired for MVP, **conditional** — see §5 |

### Experience qualities — DECIDED

Fast · clean · modern · reliable · simple · premium · fashion/e-commerce oriented · easy
for a first-time user · consistent across screens. The application should avoid
unnecessary complexity.

These are goals, not acceptance criteria. Measurable criteria do not exist yet — **OPEN**.

---

## 4. Core MVP functionality — DECIDED direction

Detailed requirements live in the linked documents; this section states the product intent
only.

### Authentication

| Item | State |
|---|---|
| Guest browsing allowed | **DECIDED** |
| Account required before checkout | **DECIDED** |
| Initial credential type: **mobile number + OTP** | **DECIDED** |
| Secure session handling | DECIDED as required, implemented later |
| Authentication/backend architecture | **OPEN** |

> **This supersedes the earlier email + password recommendation** in
> [authentication-requirements.md](authentication-requirements.md) A-3, which was written
> before this direction existed. The two current auth screens collect email and password;
> they do not match the decided credential type.

### Product browsing

Men's clothing · categories · all products · product listing · product details · product
images · product information · **sizes/variants where applicable** · **optional
product-specific size chart**.

### Cart

Add · remove · change quantity · correct totals · **persisted locally** · eventually
associated correctly with the customer/account where appropriate.

### Wishlist — DECIDED, conditional

Desired for the MVP **if it can be implemented without significantly delaying the core
shopping flow**. It is not permitted to displace the core flow.

### Reviews — DECIDED, conditional

Desired for the MVP **if they do not significantly delay the core flow**. Constraint:
**only customers who have actually purchased the product may review it.** That constraint
is binding whenever reviews are built, MVP or later.

### Checkout

Customer/account information · address · **delivery or pickup selection** · order summary ·
online payment · order placement.

**Payment provider has NOT been selected. Do not choose or implement a payment gateway
without explicit approval.**

### Orders

Conceptual customer-facing lifecycle — **DECIDED as the customer-facing vocabulary**:

```text
PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```

Side flows exist for **cancellation**, **return** and **refund**.

> How this maps onto the proposed internal payment-status × fulfilment-status model is in
> [checkout-and-order-requirements.md](checkout-and-order-requirements.md) §2. The internal
> model is still **PROPOSED**; the customer-facing vocabulary above is decided.

**OPEN:** cancellation rules, return window, refund rules, delivery charges, free-delivery
threshold, minimum order value.

### Store pickup — DECIDED capability

Some products may support store pickup. Therefore:

> **Pickup availability is modelled at the product / fulfilment level. It must not be
> assumed that every product supports pickup.**

Pickup readiness notification should eventually use **push notifications**.

---

## 5. Catalog direction — DECIDED

Initial catalog is **men's clothing**.

**The existing electronics data in the repository is NOT the product direction.** It is not
to be resurrected or preserved as a product domain. Its disposition is `Delete / Obsolete`
in [../implementation/technical-debt-plan.md](../implementation/technical-debt-plan.md).

A product may have: product identity · title · description · category · images · price ·
variants · size · inventory/stock · optional size chart · pickup eligibility · delivery
information · reviews.

**The binding architectural requirement:**

> Clothing size / variant / inventory must be modelled properly, **not** as an arbitrary UI
> field. A product may have multiple variants, and inventory must ultimately be tracked at
> the appropriate variant level.

Inventory should eventually be **deducted automatically when an order is successfully
placed**, and be manageable by the seller. Detail:
[../architecture/domain-model.md](../architecture/domain-model.md) §3 and
[checkout-and-order-requirements.md](checkout-and-order-requirements.md) §3.

---

## 6. Store / marketplace direction

v1 has one store. The vision includes eventually supporting multiple stores/sellers:
store categories and discovery · store page · store → products · an **All Products**
category · multiple independent sellers.

**OPEN and not to be invented:** seller identity, first store identity, marketplace rules,
seller onboarding, commission model, payout model.

---

## 7. Search, filters, promotions — DECIDED (deferred)

| Item | Decision |
|---|---|
| Search | **Not a priority** for the first UI / static-data phase. Categories are the initial discovery mechanism. Added later based on real business requirement |
| Filters | A small number of useful filters **may** be introduced eventually. Which ones: OPEN |
| Coupons / promotions | **Intentionally deferred.** Do not add promotional infrastructure now |

> This supersedes the earlier "Should Have — catalogue search" placement in
> [product-requirements.md](product-requirements.md) §6.

> **Amended 2026-10-31 (owner decision Q-7, `toj-backend/docs/DECISIONS.md`).** Search,
> filters, sort and sale rails were already built in the UI; the owner chose to **keep them,
> server-backed**, still flagged for product review. Coupons / promotions stay deferred. The
> table above is the original 2026-09-03 decision, kept as the record.

---

## 8. Customer profile — DECIDED

The initial profile area contains exactly:

1. Personal Information
2. My Orders
3. Wishlist
4. Help / Support
5. Logout

Settings stay **minimal** and contain **only genuinely functional settings**.

> **Do not create settings merely to make the screen look complete.** The current
> `SettingsScreen` contains inert toggles; they are placeholders, not requirements.
> Customer support implementation is **OPEN**.

---

## 9. Notifications — DECIDED direction

Initial focus is **order-related updates**: order confirmed · packed · shipped · out for
delivery · delivered · pickup ready.

Marketing / promotional notifications are **not** an initial priority.

**OPEN:** notification provider, whether push ships in v1 or after it.

---

## 10. UI / UX direction — NOT FINALISED

**The UI has not been finalised. Do not invent the final design system.**

Direction to aim for: modern fashion-commerce · minimal · clean · premium · strong product
photography · good whitespace · clear hierarchy · smooth interactions · fast perceived
performance · simple navigation · clear CTAs · excellent loading / empty / error states ·
consistent components, spacing, typography and design language.

Myntra and other established fashion/e-commerce applications may be used as **UX
references**. TojApp must **not** become a clone of another application.

**The final UI is decided separately, before major UI implementation. OPEN.**

---

## 11. Product principles — DECIDED

| Principle | Meaning |
|---|---|
| **Simplicity over unnecessary complexity** | Build only what current requirements justify |
| **User experience first** | The customer always knows where they are, what they can do, what happened, and what happens next |
| **Production quality** | Static data now, but this is a real commercial product. Avoid disposable prototype code where avoidable |
| **Migration, not rewrite** | Improve the existing project incrementally. Technical debt alone is not a reason to rewrite |
| **Future-ready, not future-heavy** | Allow future marketplace functionality; do not implement marketplace infrastructure before it is needed |
| **AI-assisted development** | AI performs most implementation under human direction, and **must not silently make product or architectural decisions** |

---

## 12. Development strategy — DECIDED

### Now: UI + static data

Focus: correct product model · correct navigation · design system · UI components ·
screens · user flows · static fixtures · local state · smooth UX · loading / empty / error
states · component quality.

Explicitly **not** now: backend · payment gateway · seller platform · marketplace
infrastructure.

### Later

Once the UI and product flow are stable, static fixture/repository implementations are
replaced or supplemented by real backend/API implementations.

> **The UI should not need to be rewritten because the data source changed.** This is the
> reason the repository seam (C6 in
> [../development/engineering-standards.md](../development/engineering-standards.md)) is
> mandatory rather than optional.

### Relationship to the phase plan

[../implementation/implementation-phases.md](../implementation/implementation-phases.md)
already sequences Phases 0–3 with no backend dependency, which matches this strategy.
What it does **not** yet contain is a phase for the design-system and UI-quality work this
strategy elevates. That gap is recorded in that document's alignment section and is
**OPEN**.

---

## 13. Explicitly OPEN — do not assume, do not invent

Backend platform · backend architecture · database · payment gateway · countries/markets
beyond the initial launch · currency and tax model · shipping provider and fulfilment
detail · delivery pricing · free-delivery threshold · minimum order value · cancellation
rules · return window · refund rules · first seller/store identity · store onboarding model
· seller platform implementation · final branding · final app name and identity · final
navigation choice · final UI design system · final customer-support implementation · exact
product category taxonomy · marketplace commission and payout model.

Tracked with owners and blockers in [../decisions/README.md](../decisions/README.md) §2.

---

## Related

- [product-requirements.md](product-requirements.md) — requirement IDs and MVP scope
- [authentication-requirements.md](authentication-requirements.md)
- [checkout-and-order-requirements.md](checkout-and-order-requirements.md)
- [marketplace-roadmap.md](marketplace-roadmap.md)
- [../development/engineering-standards.md](../development/engineering-standards.md) — the approved technical standards
- [../decisions/README.md](../decisions/README.md) — the decision log
