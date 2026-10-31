# Checkout and Order Requirements

> **Baseline note (2026-10-31).** Planning document written 2026-09-03 against the pre-UI baseline (commit `66044c5`). Since then the v1 customer UI was implemented against static mock data on explicit request (D-15). Phrases such as "nothing is implemented" and references to `.js` twins, electronics data, the drawer or 0 running tests describe that baseline. Backend, real auth, payment and persistence remain unapproved and gated on ADRs. Current facts: [../current-state.md](../current-state.md). Cited evidence: [../archive/pre-ui-baseline/](../archive/pre-ui-baseline/README.md).

Status: PROPOSED, with the customer-facing scope DECIDED 2026-09-03 — see §1a
Last Verified: 2026-09-03
Source: `src/screens/Cart/CheckoutScreen.tsx`, `src/data/orders.ts`, `src/store/cartStore.ts`

---

## 0. CURRENT behaviour

### Cart — the healthiest code in the repository

`src/store/cartStore.ts` is correct and should be **preserved**, not rewritten:
immutable updates, `get()` for reads, duplicate lines merged by incrementing quantity,
removal at quantity zero centralised in the store, no side effects, narrow selectors at
every consumer. Detail: [../archive/pre-ui-baseline/current-state/state-management.md](../archive/pre-ui-baseline/current-state/state-management.md).

Its real gaps are external: not persisted (APP-04), not cleared on logout (APP-11),
`useCartTotalPrice` is dead while two screens duplicate the same `reduce` (DEAD-03), and a
cart line has no variant — only `{ id, title, price, image, quantity }`.

### Checkout — MOCK

| Fact | Evidence |
|---|---|
| Collects street, city, state, zipCode; `country` is hardcoded `'USA'` | `CheckoutScreen.tsx:25-31` |
| `country` is **excluded** from validation | `:34-40` |
| No name, phone, or email is collected at all | `:25-31` |
| No delivery option, no tax, no shipping cost | whole screen |
| No payment step of any kind | whole screen |
| On confirm: `Alert` → `clearCart()` → `goBack()`. **No order is created.** | `:44-53` |
| Order history shows 4 unrelated static fixtures | `src/data/orders.ts` |

### Order fixtures

`src/data/orders.ts` models `{ id, date, status, items[], total, shippingAddress, paymentMethod }`
with `status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`.
`OrderDetailsScreen` renders `order.total` as given rather than deriving it, and both order
screens colour-code status through tokens that are `undefined` at runtime (DATA-05).

Two things in these fixtures are **accidentally right and must be kept**:
`OrderItem` copies `title`, `price` and `image` onto the order line rather than referencing
a product (a price snapshot — see §4), and `shippingAddress` is embedded in the order rather
than pointing at a mutable address record.

---

## 1. Checkout — TARGET flow

```text
Cart
 ↓  [server re-prices the cart: current prices, current stock]
Contact + shipping address
 ↓  [address validated; country selectable]
Fulfilment method:  delivery  |  store pickup (only if every line is pickup-eligible)
 ↓  [shipping cost known, or pickup store and hold period known]
Order summary          subtotal + shipping + tax = total   ← computed server-side
 ↓
Payment                provider sheet / redirect
 ↓  ├── success  → order confirmed
    ├── failure  → stay on checkout, retry allowed, cart intact
    ├── cancel   → return to summary, cart intact
    └── timeout / app killed mid-payment → reconciled by provider webhook
Confirmation           order number shown, cart cleared
```

### Requirements

| ID | Requirement | Traces to | Status |
|---|---|---|---|
| CO-1 | The cart is re-priced and stock-checked server-side before payment is offered | PR-6 | PROPOSED |
| CO-2 | Any price or availability change is shown to the customer before they pay | BR-2 | PROPOSED |
| CO-3 | Totals are computed by the server; the client displays, never calculates | PR-14 | PROPOSED |
| CO-4 | Collect: recipient name, phone (carrier requirement), full address incl. country | BR-1 | PROPOSED |
| CO-5 | `country` participates in validation | — | PROPOSED — fixes a current gap |
| CO-6 | The cart survives a failed, cancelled or abandoned payment | BR-1 | PROPOSED |
| CO-7 | The cart is cleared only after the order is confirmed by the server | BR-2 | PROPOSED — today it clears on a local alert |
| CO-8 | Placing the same order twice (double tap, retry, webhook replay) creates one order | BR-2 | PROPOSED — idempotency key per checkout attempt |
| CO-9 | The app never touches raw card data | — | PROPOSED — see [../architecture/security-architecture.md](../architecture/security-architecture.md) §6 |
| CO-10 | The customer chooses **delivery or store pickup**, and pickup is offered only when the products in the cart are pickup-eligible | PR-17 | DECIDED (capability), PROPOSED (rule) |
| CO-11 | Pickup eligibility is read from the product/variant, never assumed for the whole catalogue | PR-17 | PROPOSED |
| CO-12 | An order records which fulfilment method was chosen, and for pickup, which store | PR-17 | PROPOSED |
| CO-13 | The customer is notified on each order status change, including **pickup ready** | PR-18 | DECIDED (capability), OPEN (channel) |

> **CO-8 is the requirement most often discovered in production.** A retry button, a flaky
> network, and a payment webhook are three independent ways to create a duplicate order.
> The client generates one idempotency key per checkout attempt and reuses it across
> retries; the server enforces it.

---

## 1a. DECIDED scope — 2026-09-03

| Item | Decision |
|---|---|
| Account required before checkout | DECIDED — no guest checkout in v1 |
| Delivery **or** store pickup | DECIDED as a capability |
| Online payment | DECIDED as required; **provider OPEN** |
| Customer-facing order lifecycle vocabulary | DECIDED — see §2 |
| Order-status notifications | DECIDED as the initial notification scope |
| Coupons and promotions | **Deferred.** Do not build pricing-rule infrastructure |

**OPEN and not to be invented** (tracked as O-8 and O-9 in
[product-requirements.md](product-requirements.md) §7): delivery charges, free-delivery
threshold, minimum order value, cancellation rules, return window, refund rules, which
stores support pickup, which products, the pickup hold period, and how a customer is
identified at collection.

Every one of these changes what the checkout screen must display. **The checkout UI cannot
be finished until O-8 is answered**, even though the flow above can be built.

---

## 2. Order state model — PROPOSED

### The problem with the current enum

`pending | processing | shipped | delivered | cancelled` conflates two independent
lifecycles. It cannot express "paid but not yet packed", "packed but payment later
refunded", or "cancelled before payment" versus "cancelled after refund".

### Recommendation: two orthogonal statuses, one derived display status

**Payment status**

```text
pending ──→ authorized ──→ paid ──→ refunded
   │                         └────→ partially_refunded
   └──→ failed
```

**Fulfilment status**

```text
unfulfilled ──→ processing ──→ shipped ──→ delivered
      │              │                        └──→ returned
      └──────────────┴──→ cancelled
```

**Display status** is a pure function of the pair, computed in one shared place —
explicitly replacing the `getStatusColor` function that is currently duplicated
byte-for-byte across `OrderHistoryScreen.tsx:21-36` and `OrderDetailsScreen.tsx:25-40`
(APP-06).

**Reason.** Payment and fulfilment are driven by different systems (a payment provider and
a warehouse) and change independently. One enum forces every future transition to invent a
combined name, and the names run out.

**Trade-offs.** Two fields instead of one, plus a mapping function and its test. Accepted:
the mapping function is ~15 lines and it is the thing the UI wanted anyway.

**Marketplace implications.** **Compatible.** In a marketplace, fulfilment is per-store
while payment is per-order, so an order that spans two stores has one payment status and
several fulfilment statuses. The split is what makes that expressible; a single enum is
**Blocking**.

**Status: PROPOSED — needs ADR-0012.**

### The decided customer-facing vocabulary, and how it maps

The product owner has decided the vocabulary the **customer** sees:

```text
PLACED → CONFIRMED → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
```

This is not a competing state machine. It is the **display status** referred to above — the
derived value. The proposed mapping:

| Customer-facing status | Payment status | Fulfilment status |
|---|---|---|
| `PLACED` | `pending` or `authorized` | `unfulfilled` |
| `CONFIRMED` | `paid` | `unfulfilled` |
| `PACKED` | `paid` | `processing` |
| `SHIPPED` | `paid` | `shipped` |
| `OUT_FOR_DELIVERY` | `paid` | `shipped` + a carrier signal |
| `DELIVERED` | `paid` | `delivered` |
| `CANCELLED` | any | `cancelled` |
| `RETURNED` | `refunded` or `partially_refunded` | `returned` |

Two gaps this exposes, both **OPEN**:

1. `OUT_FOR_DELIVERY` is not distinguishable from `SHIPPED` without carrier tracking data.
   Either a courier integration provides it, or the status is set manually, or it is not
   shown. **Requires a decision before the status is promised to customers.**
2. The **pickup** path has no vocabulary in the decided list. A pickup order is never
   `SHIPPED` or `OUT_FOR_DELIVERY`; it becomes `READY_FOR_PICKUP` and then `COLLECTED`.
   PROPOSED: add those two values for pickup orders. Needs approval.

**Status: PROPOSED mapping — the vocabulary is DECIDED, the mapping is not.**

### Transition rules

| Transition | Trigger | Guard |
|---|---|---|
| payment `pending → authorized/paid` | provider webhook | signature verified; idempotent |
| payment `pending → failed` | provider webhook or timeout | cart is retained |
| fulfilment `unfulfilled → processing` | seller/ops action | payment is `paid` |
| fulfilment `* → cancelled` | customer (before `processing`) or ops | releases reserved stock; triggers refund if `paid` |
| payment `paid → refunded` | ops action | requires a fulfilment state of `cancelled` or `returned` |

Customer-initiated cancellation before dispatch is **Should Have**; support-initiated
cancellation is Must.

---

## 3. Inventory effects — PROPOSED

| Moment | Effect |
|---|---|
| Add to cart | none — a cart is not a claim on stock |
| Checkout begins | soft check only |
| Order placed / payment authorised | stock **reserved** against the variant |
| Order shipped | reservation converted to a decrement |
| Order cancelled or payment failed | reservation released |
| Reservation age-out | released after a fixed window if payment never completes |

**Reason.** Reserving at "add to cart" lets one abandoned cart hold the last size M
indefinitely. Reserving only at dispatch oversells. Reserving at payment is the standard
middle position.

**Status: PROPOSED — needs ADR-0022. Requires the variant model (domain-model §3).**

---

## 4. Order data requirements

| Rule | Reason |
|---|---|
| Order lines snapshot title, variant label, unit price and image at purchase time | A price change or a renamed product must not rewrite history. The current fixtures already do this — preserve it. |
| Shipping address is copied into the order, not referenced | The customer editing their address book must not alter a past order's ship-to. Current fixtures already do this. |
| `orderNumber` is a human-facing identifier separate from the primary key | Support conversations and emails need something readable; the key should not be guessable or enumerable |
| Money is stored as integer minor units with an explicit currency | See [../architecture/domain-model.md](../architecture/domain-model.md) §4 |
| Every order line carries `storeId` | PR-15; makes a multi-store order expressible without a schema change |
| `Order.total` is never accepted from the client | PR-14; `OrderDetailsScreen.tsx` currently renders whatever `total` says |

---

## 5. Returns and refunds

**Status: OPEN — Later.** Not v1 scope. Two constraints must nevertheless be respected in
the v1 schema so the feature is addable without migrating live order data:

1. Money fields are signed and refunds are recorded as their own rows, not by mutating the
   order total.
2. Fulfilment status includes `returned` from the outset even if nothing sets it.

Cost of respecting them now: one enum value and one table that stays empty.
Cost of not: a data migration over real financial records.

---

## 5a. Order notifications — DECIDED scope

Initial notification scope is **order-related updates only**: confirmed, packed, shipped,
out for delivery, delivered, **pickup ready**. Marketing and promotional notifications are
not an initial priority.

| Constraint | Reason |
|---|---|
| A notification is triggered by a **server-side** status change, never by the client | The client is not present when the warehouse packs a parcel |
| A notification is idempotent per (order, status) | Webhook replay must not send the same message twice — the same class of defect as CO-8 |
| Notification content carries no payment detail | See [../architecture/security-architecture.md](../architecture/security-architecture.md) |
| A status the customer cannot be told about should not be in the customer-facing vocabulary | The `OUT_FOR_DELIVERY` gap in §2 |

**OPEN:** push provider, whether push ships in v1 or immediately after, and whether
email/SMS accompany it. Tracked as O-13.

---

## 6. Verification

| Requirement | Verified by |
|---|---|
| CO-1/CO-2 re-pricing | Integration: change a price between cart load and checkout; the customer is shown the change and is not charged the stale price |
| CO-3 server totals | Integration: a tampered client total is rejected |
| CO-7 cart clearing | E2E: kill the app immediately after payment authorisation; on relaunch the order exists and the cart is empty |
| CO-8 idempotency | Integration: the same idempotency key submitted twice yields one order |
| §2 status model | Unit: the display-status mapping, one case per reachable pair |
| §3 reservations | Integration: two concurrent checkouts for the last unit — exactly one succeeds |
| CO-10/CO-11 pickup | Integration: a cart containing one non-pickup-eligible line is not offered pickup |
| CO-13 notifications | Integration: a repeated status webhook produces one notification, not two |

---

## Related

- [../archive/pre-ui-baseline/features/checkout.md](../archive/pre-ui-baseline/features/checkout.md) · [../archive/pre-ui-baseline/features/cart.md](../archive/pre-ui-baseline/features/cart.md) · [../archive/pre-ui-baseline/features/order-history.md](../archive/pre-ui-baseline/features/order-history.md)
- [../architecture/domain-model.md](../architecture/domain-model.md)
- [../architecture/security-architecture.md](../architecture/security-architecture.md)
