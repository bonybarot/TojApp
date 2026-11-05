# Domain Model

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED — candidate model, no schema decision has been approved
Last Verified: 2026-09-03
Source: `src/data/*`, `src/store/*` + [../requirements/product-requirements.md](../requirements/product-requirements.md)

> This is a **domain analysis**, not a database schema. Column types, indexes and
> migrations are deliberately absent: they belong to the backend platform decision (O-1),
> which has not been made. What is decided here is what the concepts *are* and which of
> them the v1 code must be able to express.

---

## 1. Entities implied by the current code

Everything the prototype already models, and what it is missing.

| Concept | Where it lives today | Gaps |
|---|---|---|
| Product | `src/data/products.ts:1-9` **and** `src/store/productStore.ts:4-12` — declared twice, independently (APP-14) | no variants, no stock, no status, no store, no timestamps; price is a float; category is free text |
| Category | `src/data/categories.ts:1-5` — `{ id, title, image }` | flat; no relationship to products beyond a matched string; 5 of 8 have no products (DATA-07); includes `Sale`, which is not a category |
| Cart line | `src/store/cartStore.ts:3-9` — `{ id, title, price, image, quantity }` | keyed by product, not variant, so two sizes of one garment collapse into one line |
| Order | `src/data/orders.ts:9-24` | single conflated status; float money; total trusted from data; no store |
| Order line | `src/data/orders.ts:1-7` | field-for-field identical to `CartItem` with no stated relationship |
| Address | inline in `Order` (`orders.ts:15-22`) **and** as local `useState` in `CheckoutScreen.tsx:25-31` — different shapes | checkout omits name and phone; hardcodes `country: 'USA'` and excludes it from validation |
| User | `src/store/userStore.ts:3-8` — `{ id, name, email, avatar? }` | fabricated; no credentials, no roles, no timestamps |
| Store | — | does not exist |
| Payment | — | does not exist; `Order.paymentMethod` is a free string |
| Inventory | — | does not exist |

---

## 2. Canonical product contract — the shadowing question, resolved

The product owner has decided the catalogue is **clothing**. That settles which *file*
represents intent. The field-level questions still need an ADR.

| Question | `.ts` layer | `.js` layer (what runs) | Recommendation | Reason |
|---|---|---|---|---|
| Which catalogue? | 15 clothing | 6 electronics | **clothing (`.ts`)** | DECIDED by the product owner |
| `id` type | `string` | `number` | **`string`** | Backends issue UUIDs and prefixed ids (`ORD-001` already is one); a string id survives any backend choice, and `FlatList` `keyExtractor` wants a string anyway (DATA-06) |
| Name field | `title` | `name` | **`title`** | Every live component already reads `title`; the migration cost is zero, and `title` matches the fixtures the order model already uses (`OrderItem.title`). No domain argument favours `name`. |
| `category` | required string | absent | **`categoryId` referencing a Category entity** | Free text cannot be renamed, nested, translated or governed across sellers |
| `images` | declared, read nowhere | absent | **ordered image list, actually used** | Clothing needs multiple views; a single hero image is the reason the field was declared in the first place |
| `price` | float | float | **integer minor units + currency** | §4 |

**Consequence: `src/data/products.js` and `src/utils/theme.js` become obsolete** and are
retired in migration Phase 1 — not by deleting them in isolation, but as part of adopting
the canonical contract. Root cause, not symptom: the fix is "one language, one source per
module specifier", not "rename `name` to `title`". See
[../implementation/migration-plan.md](../implementation/migration-plan.md) Phase 1.

---

## 3. Product vs Variant — PROPOSED

**Problem.** A clothing store cannot fulfil an order without a size. The current model has
no size anywhere: not on the product, not on the cart line, not on the order line.

**Recommendation.**

```text
Product              the thing a customer browses
  └── Variant        the thing a customer buys and the warehouse picks
        └── Inventory
```

| Level | Holds |
|---|---|
| Product | title, description, category, images, store, status, timestamps |
| Variant | SKU, size, colour, price, compare-at price, currency, own images (optional) |
| Inventory | quantity available, quantity reserved — per variant |

**Why price lives on the variant, not the product.** Size runs are routinely priced
differently (extended sizes, different fabric weights per colourway). Putting price on the
product forces either "all sizes cost the same forever" or a later migration of every
order line's price reference.

**Alternatives considered.**

| Alternative | Verdict |
|---|---|
| Size as a free-text field on Product | Rejected — cannot express per-size stock, which is the whole point |
| Size as a string array on Product | Rejected — no place for per-size stock, SKU or price |
| Full option/value matrix (Shopify-style `option1..3`) | Deferred — more general than clothing needs today; the two-attribute form (size, colour) covers the catalogue and can be generalised later without changing the Product/Variant split |
| Variant (recommended) | Chosen |

**Trade-offs.** Every screen that currently thinks in products must learn to think in
variants: `ProductDetailsScreen` gains a size selector, `cartStore` keys lines by variant,
order lines reference variants. That is real work, and it is why variants are Phase 6, not
Phase 1 — but the *model* must anticipate it from the first backend schema.

**Marketplace impact: Safe.** **Status: PROPOSED — needs ADR-0001 and ADR-0022.**

---

## 4. Money — PROPOSED

**Recommendation: integer minor units (cents) plus an explicit ISO-4217 currency code.
Never a floating-point number, never a bare number without a currency.**

**Reason.** Current fixtures use floats (`89.99`, `24.99`). Cart and order totals are
computed with `reduce` over floats in three places (`cartStore.ts:66`, `CartScreen.tsx:21`,
`CheckoutScreen.tsx:19`). Binary floating point cannot represent most decimal money values
exactly, so totals drift by fractions of a cent and then disagree with the payment
provider's figure — which is computed in minor units, because every payment API in
existence takes minor units.

**Trade-offs.** Every price display goes through a formatter instead of `toFixed(2)`
(currently at `ProductCard.tsx:31` and eight other sites). One utility, one test.
This is a small, mechanical cost paid once.

**Marketplace impact: Blocking if omitted** — commission and payout arithmetic on floats
produces reconciliation failures that are extremely unpleasant to unpick after the fact.

**Status: PROPOSED — needs ADR-0011.**

---

## 5. Candidate entity model

Marked `v1` (needed for the single-store release) or `Later`.

| Entity | When | Key attributes | Notes |
|---|---|---|---|
| **User** | v1 | id, phone, phoneVerifiedAt, credentials, createdAt | Identity only. Not a profile. **Updated 2026-09-03**: the decided credential type is mobile + OTP, so the verified attribute is the phone, not the email. The stable key is `id` — never the phone number, which carriers reassign |
| **Customer** | v1 | userId, displayName, email (optional) | A profile *on* a User, so one human can later also be a Seller. Email moves here and becomes optional |
| **Seller** | Later | userId, storeId, role | The seat, not the store |
| **Store** | v1 (one seeded row) | id, name, slug, status, ownerUserId (nullable in v1) | Exists so `storeId` is a real foreign key from day one |
| **Category** | v1 | id, parentId, name, slug, image, position | Single-parent tree; `parentId` null in v1 |
| **Product** | v1 | id, storeId, categoryId, title, description, status, pickupEligible, sizeChartId (nullable), createdAt, updatedAt | `pickupEligible` and `sizeChartId` added 2026-09-03 — PR-17 and PR-21 |
| **SizeChart** | v1 | id, storeId, name, rows | Optional, per product. Garment sizing is not standardised (PR-21). A shared chart referenced by many products, not text duplicated on each |
| **ProductImage** | v1 | id, productId, url, alt, position | Replaces the dead `images?: string[]` |
| **ProductVariant** | v1 | id, productId, sku, size, colour, priceMinor, currency, compareAtMinor | §3 |
| **InventoryItem** | v1 | variantId, available, reserved | §3 |
| **Cart** | v1 | id, customerId (nullable), currency, status, updatedAt | Nullable customer supports anonymous browsing (auth A-1) |
| **CartLine** | v1 | cartId, variantId, quantity, unitPriceMinorSnapshot | Snapshot is advisory; the server re-prices at checkout (CO-1) |
| **Address** | v1 | id, customerId, name, phone, line1, line2, city, region, postalCode, countryCode, isDefault | Replaces the two disagreeing address shapes |
| **Order** | v1 | id, orderNumber, customerId, paymentStatus, fulfilmentStatus, fulfilmentMethod, pickupStoreId (nullable), currency, subtotalMinor, shippingMinor, taxMinor, totalMinor, placedAt | Two statuses, not one. `fulfilmentMethod` (`delivery` \| `pickup`) and `pickupStoreId` added 2026-09-03 — CO-12 |
| **OrderLine** | v1 | orderId, storeId, variantId, titleSnapshot, variantLabelSnapshot, unitPriceMinor, quantity, imageSnapshot | `storeId` here, not only on the order |
| **OrderAddress** | v1 | embedded copy of the shipping address | Copied, never referenced |
| **Payment** | v1 | id, orderId, provider, providerRef, status, amountMinor, currency, capturedAt | Its own record — not a string on the order |
| **Shipment** | Later | orderId, storeId, carrier, tracking, shippedAt | v1 uses `fulfilmentStatus` alone |
| **Refund** | Later | paymentId, amountMinor, reason, createdAt | Table may exist empty; see checkout-and-order §5 |
| **Wishlist** / **WishlistItem** | v1 if it does not delay the core flow | customerId, productId, addedAt | PR-19. `ProfileScreen.tsx:59` shows an inert Wishlist row today, and the profile spec requires the entry |
| **Review** | v1 if it does not delay the core flow | id, productId, customerId, **orderLineId**, rating, body, status, createdAt | PR-20. **`orderLineId` is the whole point**: it is what makes "only verified purchasers may review" enforceable in the schema rather than in application logic. A review without it can be faked by anyone with an account |
| **Payout**, **Commission** | Later | — | Marketplace-era |

### Relationships

```text
User 1──0..1 Customer
User 1──0..* Seller ──* Store          (Later; v1 has one Store with no Seller)

Store 1──* Product 1──* ProductVariant 1──1 InventoryItem
                   1──* ProductImage
Category 1──* Product          (Category 1──* Category, single parent)

Customer 1──* Address
Customer 1──0..1 Cart 1──* CartLine ──1 ProductVariant
Customer 1──* Order 1──* OrderLine ──1 ProductVariant
                   1──* Payment
                   1──1 OrderAddress (embedded copy)
                   1──* Shipment      (Later)

Customer 1──* WishlistItem ──1 Product
Customer 1──* Review ──1 Product
OrderLine 1──0..1 Review               (the verified-purchase link)
Product   *──0..1 SizeChart
```

### Invariants

| # | Invariant | Enforced where |
|---|---|---|
| 1 | An order's `totalMinor` equals subtotal + shipping + tax | Server, at creation. Never accepted from the client (PR-14) |
| 2 | An order line's price is a snapshot and is never recomputed from the live variant | Server |
| 3 | A shipping address on an order is a copy, immutable thereafter | Server |
| 4 | `available >= 0` for every inventory item | Database constraint |
| 5 | A cart line references a variant that is `active` and belongs to an `active` product | Server, at re-price (CO-1) |
| 6 | Two cart lines never reference the same variant — quantity merges instead | Already correct in `cartStore.ts:26-43`; preserve it, re-key to variant |
| 7 | Every product and every order line has a `storeId` | Schema, non-null |
| 8 | Money never crosses a boundary without its currency | Type-level: one `Money` type, not a bare number |
| 9 | An order may be `pickup` only if **every** line's product is `pickupEligible` | Server, at checkout (CO-10/CO-11) |
| 10 | A review exists only for an `orderLineId` belonging to the reviewing customer, on a `delivered` order | Server. PR-20 — enforced by the relationship, not by a check in the app |
| 11 | A wishlist holds each product at most once per customer | Unique constraint on (customerId, productId) |

---

## 6. Mapping from today to the target

| Today | Target | Migration note |
|---|---|---|
| `Product` declared in two files | one type, one place, generated from or validated against the API contract | Phase 2 |
| `CartItem` ≅ `OrderItem`, unrelated | `CartLine` and `OrderLine`, related by an explicit cart→order conversion | The conversion the codebase never had (`CheckoutScreen.tsx:33-54` creates nothing) |
| `category: string` | `categoryId` | Phase 4, with the catalogue API |
| `price: number` | `priceMinor: number` + `currency` | Phase 2 at the model boundary, before any real money exists |
| `status` single enum | `paymentStatus` + `fulfilmentStatus` | Phase 6 |
| `paymentMethod: string` | `Payment` record | Phase 6 |
| no variants | Product/Variant/Inventory | Phase 6; schema anticipates it from Phase 4 |
| no `storeId` | `storeId` on Product and OrderLine | Phase 4 (schema), one seeded store |
| no pickup concept | `pickupEligible` on Product, `fulfilmentMethod` on Order | Phase 2 at the model boundary; enforced server-side in Phase 6 |
| no wishlist, no reviews | `WishlistItem`, `Review` | Only once order lines exist — a review cannot be purchase-verified before then |

---

## Related

- [../requirements/product-vision.md](../requirements/product-vision.md) §5 — the decided catalog direction
- [../requirements/product-requirements.md](../requirements/product-requirements.md) §5
- [../requirements/checkout-and-order-requirements.md](../requirements/checkout-and-order-requirements.md)
- [../requirements/marketplace-roadmap.md](../requirements/marketplace-roadmap.md) §6
- [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md)
