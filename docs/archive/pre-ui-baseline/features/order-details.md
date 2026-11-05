# Feature: Order Details

Status: **MOCK / PROTOTYPE — reads the same static array**
Last Verified: 2026-09-03
Source: `src/screens/Orders/OrderDetailsScreen.tsx`, `src/data/orders.ts`

---

## Purpose

Show one order in full: information, items, shipping address, payment and total.

---

## User Flow

```text
OrderHistory → tap a card → navigate('OrderDetails', { orderId })
  └─ orders.find(o => o.id === orderId)
       ├─ not found → "Order not found"
       └─ found → five sections in a ScrollView:
            1. Order Information — id, date, status badge
            2. Items            — image, title, unit price, quantity, line total
            3. Shipping Address — name, street, city/state/zip, country
            4. Payment          — order.paymentMethod
            5. Total
```

There are no actions on this screen — no track, no cancel, no reorder, no invoice.

---

## Entry Points

| Entry | Location |
|---|---|
| Order card tap | `src/screens/Orders/OrderHistoryScreen.tsx:38-40`, `:45` |
| Route registration | `src/navigation/OrdersStack.tsx:21` |

---

## Screens

| Screen | File | Route |
|---|---|---|
| OrderDetails | `src/screens/Orders/OrderDetailsScreen.tsx` (221 lines) | `OrdersStack` → `OrderDetails` |

`headerShown: false` on `OrdersStack`; the drawer's header still reads "Orders" here, so
there is no title change and no back button (issue NAV-05).

---

## Components

None.

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useRoute<OrderDetailsRouteProp>()` | `:13` | Anonymous inline `RouteProp` (`:7-10`) rather than `OrdersStackParamList`, which already declares `OrderDetails: { orderId: string }` (issue NAV-07) |

No navigation hook, no store.

---

## State

None.

---

## Data

Direct import of `orders` (`:4`). Lookup by strict equality on `id` (`:15`). `orderId` is a
real string here (`ORD-001` etc.), so the lookup is sound — unlike the product lookup.

Fields rendered: `order.id`, `order.date`, `order.status`, `order.items[]` (`id`, `image`,
`title`, `price`, `quantity`), `order.shippingAddress.{name,street,city,state,zipCode,country}`,
`order.paymentMethod`, `order.total`.

**`order.total` is a stored number, not a computed one.** Nothing checks it against
Σ (price × quantity) for the items listed.

---

## Business Logic

| Rule | Where |
|---|---|
| Look up by id | `:15` |
| Missing order shows a message | `:17-23` |
| Status badge colour | `:25-40` — the same six-branch `switch` as OrderHistory, all six returning tokens absent from `theme.js` |
| Status label | `:62` — `order.status.toUpperCase()` |
| Line total | `:78` — `price × quantity`, computed |
| Order total | `:103` — `order.total`, **read from the data, not computed** |

---

## API

**NOT IMPLEMENTED.**

## Persistence

**NOT IMPLEMENTED.**

---

## Error Handling

One branch: `"Order not found"` (`:20`). Not reachable today, since the only caller passes
an id straight from the same array.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Unknown `orderId` | "Order not found" |
| `order.total` disagreeing with the item lines | Both are displayed; the discrepancy is silent |
| Missing `shippingAddress` | **Would throw** — `:86-92` dereference it with no guard. All 4 mock orders have one |
| Item image fails to load | Blank thumbnail |
| Status not in the union | `default` branch |
| No `route.params` | **Would throw** — `:14` destructures without a guard |

---

## Dependencies

`react-native` (`Image`, `ScrollView`), `@react-navigation/native`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-04 | P1 | Colour tokens resolve to `undefined` |
| DATA-05 | P2 | Status badge invisible |
| APP-06 | P2 | `getStatusColor` duplicated byte-for-byte from `OrderHistoryScreen.tsx:21-36` |
| APP-05 | P2 | Reads `src/data/orders.ts` directly, bypassing the store layer |
| NAV-05 | P2 | No back affordance and no title change |
| NAV-07 | P3 | Anonymous inline `RouteProp` |
| — | P3 | `route.params` and `shippingAddress` dereferenced without guards |
| — | P3 | `order.total` is trusted rather than derived |

---

## Related Features

- [order-history.md](order-history.md) — the only entry point

---

## Source Files

`src/screens/Orders/OrderDetailsScreen.tsx`, `src/data/orders.ts`,
`src/navigation/OrdersStack.tsx`.

---

## Current Limitations

1. Read-only — no actions of any kind.
2. No tracking, no carrier, no delivery estimate.
3. No invoice or receipt download.
4. No support or contact route.
5. No status timeline.

---

## Unknowns

- What actions an order should support — **NOT YET DECIDED**.
