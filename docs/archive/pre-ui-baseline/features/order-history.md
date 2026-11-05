# Feature: Order History

Status: **MOCK / PROTOTYPE — a static list of 4 fabricated orders**
Last Verified: 2026-09-03
Source: `src/screens/Orders/OrderHistoryScreen.tsx`, `src/data/orders.ts`, `src/navigation/OrdersStack.tsx`

---

## Status

The list renders and navigates correctly, but its contents are a hardcoded array of four
orders that has no connection to anything the user does. Placing an order through
[checkout.md](checkout.md) does **not** add a row here.

---

## Purpose

Show the user's past orders and let them open one.

---

## User Flow

```text
Drawer → Orders
  └─ OrdersStack → OrderHistory
       └─ FlatList of 4 cards, each showing
            ├─ order id            e.g. ORD-001
            ├─ status badge        DELIVERED / SHIPPED / PROCESSING / PENDING
            ├─ date
            ├─ Total: $…
            └─ "N item(s)"
       └─ tap a card → navigate('OrderDetails', { orderId: item.id })
```

---

## Entry Points

| Entry | Location |
|---|---|
| Drawer item "Orders" | `src/navigation/DrawerNavigator.tsx:76-80` |
| Default screen of `OrdersStack` | `src/navigation/OrdersStack.tsx:20` |

The Profile screen has an "Order History" row (`ProfileScreen.tsx:56`) — it has **no
`onPress`** and does nothing (issue APP-07).

---

## Screens

| Screen | File | Route |
|---|---|---|
| OrderHistory | `src/screens/Orders/OrderHistoryScreen.tsx` (134 lines) | `OrdersStack` → `OrderHistory` |

`OrdersStack` sets `headerShown: false` (`:17`), but the drawer supplies a header titled
"Orders" (`DrawerNavigator.tsx:79`).

---

## Components

None. Cards are inline JSX (`:42-64`).

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useNavigation<OrderHistoryScreenNavigationProp>()` | `:19` | **Correctly typed** against `OrdersStackParamList` |

No store is used.

---

## State

None. The screen is stateless.

---

## Data

`import { orders } from '../../data/orders';` (`:11`) — a direct module import. There is no
`orderStore`; this is one of three places that bypass the store layer entirely
(issue APP-05).

`src/data/orders.ts` contains 4 orders:

| Order | Status | Where |
|---|---|---|
| ORD-001 | `delivered` | `orders.ts:28`, `:30` |
| ORD-002 | `shipped` | `orders.ts:61` |
| ORD-003 | `processing` | `orders.ts:85` |
| ORD-004 | `pending` | `orders.ts:116` |

Each order carries `id`, `date`, `status`, `total`, `items[]`, `shippingAddress` and
`paymentMethod` (`orders.ts:9-24`). Unlike products, **`orders.ts` has no `.js` twin**, so
what TypeScript sees is what Metro bundles.

Order items use `title` (`orders.ts:1-7`), consistent with the cart — the naming mismatch is
confined to the product catalogue.

---

## Business Logic

### `getStatusColor` (`:21-36`)

```ts
case 'delivered':  return colors.success;
case 'shipped':    return colors.info;
case 'processing': return colors.warning;
case 'pending':    return colors.textSecondary;
case 'cancelled':  return colors.error;
default:           return colors.textSecondary;
```

**Every one of the six branches returns a token that `theme.js` does not define.** At
runtime `theme.js` shadows `theme.ts` and provides only `primary`, `secondary`,
`background`, `card` and `text`. So every status badge gets
`backgroundColor: undefined` — the badge is transparent and the white badge text
(`colors.background`, `:112`) is invisible against the card. That is issue DATA-05.

This function is duplicated byte-for-byte in `OrderDetailsScreen.tsx:25-40`
(issue APP-06).

### Item count pluralisation (`:60-62`)

`{item.items.length} item{item.items.length !== 1 ? 's' : ''}` — correct singular/plural.

---

## API

**NOT IMPLEMENTED.** No fetch, no pagination, no refresh.

## Persistence

**NOT IMPLEMENTED.** The 4 orders are a compile-time constant; they are identical for every
user and cannot change.

---

## Error Handling

None. No empty state (the array is never empty today), no error state.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Empty order list | Blank screen, no message (issue APP-10) |
| Unknown status string | `default` branch — also `undefined` |
| An order the user just placed | Never appears (issue APP-03) |
| Very long order id | No truncation; the header row is `justifyContent: 'space-between'` and would compress the badge |

---

## Dependencies

`react-native`, `@react-navigation/native`, `@react-navigation/native-stack`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| APP-03 | P1 | Placed orders never appear here |
| DATA-04 | P1 | Colour tokens resolve to `undefined` |
| DATA-05 | P2 | Every status badge is invisible |
| APP-06 | P2 | `getStatusColor` duplicated across two screens |
| APP-05 | P2 | Data bypasses the store layer |
| QUAL-02 | P2 | **`fontWeight` declared twice** in `styles.statusText` (`:111` `'400'` and `:113` `'600'`) — the single TypeScript error in the whole project (TS1117) and one of the 6 ESLint errors (`no-dupe-keys`) |
| APP-10 | P3 | No empty state |
| APP-13 | P3 | `{ item: any }` at `:42` |

---

## Related Features

- [order-details.md](order-details.md) — the navigation target
- [checkout.md](checkout.md) — the flow that should, and does not, write here
- [purchase-history-abandoned.md](purchase-history-abandoned.md) — an earlier, unreachable
  version of this idea

---

## Source Files

`src/screens/Orders/OrderHistoryScreen.tsx`, `src/data/orders.ts`,
`src/navigation/OrdersStack.tsx`.

---

## Current Limitations

1. Orders are static and identical for every user.
2. No filtering by status or date.
3. No search.
4. No pagination.
5. No reorder, cancel, return or track action.
6. No empty state.

---

## Unknowns

- Whether order state should be modelled client-side at all, or fetched — **NOT YET DECIDED**.
- The real status lifecycle — **NOT YET DECIDED**; the union in `orders.ts:12` is a guess
  made by whoever wrote the mock.
