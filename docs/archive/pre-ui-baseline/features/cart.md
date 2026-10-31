# Feature: Cart

Status: **IMPLEMENTED (in-memory)**
Last Verified: 2026-09-03
Source: `src/screens/Cart/CartScreen.tsx`, `src/store/cartStore.ts`, `src/navigation/CartStack.tsx`

---

## Status

The best-built feature in the application. The store is correct, the screen is a clean
projection of it, and the quantity semantics are right. Its only defects are inherited
(missing titles from the data layer) or structural (no persistence).

---

## Purpose

Hold the items a user intends to buy, let them adjust quantities, and hand off to checkout.

---

## User Flow

```text
ProductDetails → Add to Cart → cartStore.items grows

Tab bar → Cart
  ├─ items.length === 0 → "Your cart is empty" (centred, nothing else)
  └─ otherwise
       ├─ FlatList of rows: image | title / price / [− qty +] | Remove
       ├─ footer: "Total:" + computed sum
       └─ "Proceed to Checkout"
            ├─ items.length === 0 → nothing happens (guarded at :28)
            └─ otherwise → navigate('Checkout')
```

---

## Entry Points

| Entry | Location |
|---|---|
| Cart tab | `src/navigation/MainTabs.tsx:36-42` (label "Cart") |
| Default screen of `CartStack` | `src/navigation/CartStack.tsx:20` |

There is no cart badge showing the item count anywhere.

---

## Screens

| Screen | File | Route |
|---|---|---|
| Cart | `src/screens/Cart/CartScreen.tsx` (210 lines) | `CartStack` → `Cart` |

`headerShown: false` (`CartStack.tsx:17`) — no title bar.

---

## Components

None. Rows are inline JSX (`CartScreen.tsx:33-62`).

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useNavigation<CartScreenNavigationProp>()` | `:19` | **Correctly typed** against `CartStackParamList` |
| `useCartStore(state => state.items)` | `:20` | Stable reference |
| `useCartStore(state => state.items.reduce(…))` | `:21-23` | Derives the total inline — returns a `number`, so `Object.is` comparison is sound and it does **not** over-render |
| `useCartStore(state => state.removeFromCart)` | `:24` | |
| `useCartStore(state => state.updateQuantity)` | `:25` | |

The store exports a ready-made `useCartTotalPrice` hook (`cartStore.ts:66-69`) that does
exactly what `:21-23` does. Nothing imports it; both `CartScreen.tsx:21-23` and
`CheckoutScreen.tsx:19-21` duplicate the reduce instead (issue DEAD-03).

---

## State

| State | Owner |
|---|---|
| `items: CartItem[]` | `useCartStore` (`cartStore.ts`) |

No local state on the screen.

```ts
export interface CartItem {   // cartStore.ts:3-9
  id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
}
```

Full store documentation, including why the audit judged this store correct:
[../current-state/state-management.md](../current-state/state-management.md).

---

## Data

Cart contents come **only** from `ProductDetailsScreen.tsx:37-42`, which passes `id`,
`title`, `price`, `image`. Because the runtime product objects have no `title`, every cart
row is created with `title: undefined` and the row's title `<Text>` (`:37`) renders empty.

---

## Business Logic

| Rule | Where | Implementation |
|---|---|---|
| Adding an existing product increments its quantity | `cartStore.ts:26-43` | finds by `id`, maps to `quantity + 1` |
| Adding a new product starts at quantity 1 | `cartStore.ts:26-43` | |
| Decrementing to 0 removes the row | `cartStore.ts:49-59` | `updateQuantity` delegates to `removeFromCart` when `quantity <= 0` — this is why the `−` button never produces a zero-quantity row |
| Remove deletes the row outright | `cartStore.ts:44-48` | `filter` |
| Total = Σ price × quantity | `CartScreen.tsx:22` | |
| Checkout is blocked on an empty cart | `CartScreen.tsx:28` | `if (items.length > 0)` — belt and braces, since the empty branch at `:64-70` means the button is not rendered |

No stock limit, no maximum quantity, no minimum order value, no tax, no shipping cost, no
discount codes.

---

## API

**NOT IMPLEMENTED.** No server-side cart, no cart id, no sync between devices.

---

## Persistence

**NOT IMPLEMENTED.** The cart is a module-level zustand store. Closing the app empties it.
It is also **not cleared on logout** (`userStore.ts:34-39` touches only `user` and
`isLoggedIn`), so within one process the next user inherits the previous user's cart
(issue APP-11).

---

## Error Handling

None needed today — every operation is synchronous and local. There is no `try`/`catch`
and no error state.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Empty cart | Dedicated centred "Your cart is empty" screen (`:64-70`) — the only real empty state in the app |
| Quantity decremented to 0 | Row is removed (`cartStore.ts:52-54`) |
| Same product added twice | Merged into one row with quantity 2 |
| `price` of `0` | Renders `$0.00`; no special handling |
| Floating-point totals | Plain float arithmetic with `.toFixed(2)` at display time; no currency-safe integer cents |
| `keyExtractor` returns a number | Under the runtime data `item.id` is a number — React Native warns (issue DATA-06) |
| Logout with items in the cart | Items remain (issue APP-11) |
| Very long title | No `numberOfLines` on the row title |

---

## Dependencies

`react-native` (`FlatList`, `Image`), `@react-navigation/native`,
`@react-navigation/native-stack`, `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-02 | P1 | Row titles are blank — `title: undefined` arrives from the product layer |
| APP-04 | P1 | Cart is lost on every relaunch |
| APP-11 | P2 | Cart is not cleared on logout |
| DATA-06 | P2 | `keyExtractor` returns a number |
| DEAD-03 | P3 | `useCartTotalPrice` is exported and used by nobody; the reduce is duplicated in two screens |
| APP-13 | P3 | `{ item: any }` at `:33` |
| — | P3 | No cart badge on the tab bar |
| — | P3 | Quantity buttons have no accessibility labels (`−` and `+` are bare text) |

---

## Related Features

- [product-details.md](product-details.md) — the only writer
- [checkout.md](checkout.md) — the only consumer besides this screen
- [authentication.md](authentication.md) — logout does not clear the cart

---

## Source Files

`src/screens/Cart/CartScreen.tsx`, `src/store/cartStore.ts`, `src/navigation/CartStack.tsx`.

---

## Current Limitations

1. No persistence.
2. No stock validation.
3. No promo codes, tax, or shipping.
4. No "save for later" or wishlist.
5. No undo after Remove.
6. No cart badge.
7. Money is handled as floating-point numbers.

---

## Unknowns

- Whether the cart should live on a server and sync across devices — **NOT YET DECIDED**.
- Whether the cart should survive logout — **NOT YET DECIDED**.
