# Feature: Checkout

Status: **MOCK / PROTOTYPE — no order is ever created**
Last Verified: 2026-09-03
Source: `src/screens/Cart/CheckoutScreen.tsx`

---

## Status

**MOCK / PROTOTYPE.** The screen collects a shipping address, shows a summary, and then
shows a success alert and empties the cart. Nothing is recorded. The code says so at
`CheckoutScreen.tsx:44`: `// In a real app, this would create an order via API`.

The order the user just "placed" **never appears in Order History**, which reads a separate
hardcoded array.

---

## Purpose

Collect a shipping address, confirm the order contents, and complete the purchase flow.

---

## User Flow

```text
Cart → "Proceed to Checkout" → Checkout
  ├─ Section 1: Shipping Address — 5 TextInputs (country pre-filled 'USA')
  ├─ Section 2: Order Summary — one row per cart item + total
  ├─ Section 3: Payment Method — the static text "Credit Card ending in 1234"
  └─ "Confirm Order"
       ├─ street / city / state / zipCode any of them empty
       │    → Alert 'Error' / 'Please fill in all address fields'
       └─ all four filled
            → Alert 'Success' / 'Your order has been placed!'
                 └─ OK → clearCart(); navigation.goBack()   → back on the Cart screen,
                                                              now showing "Your cart is empty"
```

---

## Entry Points

| Entry | Location |
|---|---|
| Cart's checkout button | `src/screens/Cart/CartScreen.tsx:27-31`, `:85-90` |
| Route registration | `src/navigation/CartStack.tsx:21` |

---

## Screens

| Screen | File | Route |
|---|---|---|
| Checkout | `src/screens/Cart/CheckoutScreen.tsx` (202 lines) | `CartStack` → `Checkout` |

A plain `ScrollView` (`:57`). `headerShown: false` — **no back button** (issue NAV-05); the
only ways out are the OS back gesture and confirming the order.

---

## Components

None.

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useNavigation()` | `:17` | **Untyped** |
| `useCartStore(state => state.items)` | `:18` | |
| `useCartStore(state => state.items.reduce(…))` | `:19-21` | Duplicate of `CartScreen.tsx:21-23` |
| `useCartStore(state => state.clearCart)` | `:22` | |
| `useUserStore(state => state.user)` | `:23` | **Selected and never used** — ESLint error `23:9` (issue QUAL-07) |
| `useState` (address object) | `:25-31` | One object holding all 5 fields |

---

## State

```ts
const [address, setAddress] = useState({   // :25-31
  street: '', city: '', state: '', zipCode: '', country: 'USA',
});
```

Local only. Discarded on unmount. There is no saved-address book, and the address is never
associated with the "order".

Note `country` defaults to `'USA'` and is **not** part of the validation check.

---

## Data

| Source | Use |
|---|---|
| `useCartStore().items` | the summary rows (`:94-103`) and the total |
| `user` | selected at `:23`, unused |
| Payment method | the hardcoded string `'Credit Card ending in 1234'` (`:112`) |

Summary rows render `{item.title} x {item.quantity}` (`:97`). Because cart items carry
`title: undefined` at runtime, each row reads as ` x 1`.

---

## Business Logic

| Rule | Where |
|---|---|
| street, city, state and zipCode are required | `:34-42` |
| `country` is **not** validated | — it is pre-filled and can be blanked without complaint |
| No format validation on zip code | — any characters accepted |
| Order total = Σ price × quantity | `:20` — no tax, no shipping, no discount |
| Success clears the cart | `:49` |
| Success returns to the previous screen | `:50` — `navigation.goBack()` |
| An order record is created | **nowhere** |

---

## API

**NOT IMPLEMENTED.** No order submission, no payment authorisation, no address validation,
no tax calculation. See [../api/current-state.md](../api/current-state.md).

---

## Persistence

**NOT IMPLEMENTED.** The address is not saved; the order is not saved.

---

## Error Handling

One validation `Alert` (`:40`). There is no failure path, because there is no operation
that can fail.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Empty cart | The screen still renders — an empty summary, a `$0.00` total, and Confirm Order still succeeds. Reaching it requires the OS back gesture after emptying the cart, since `CartScreen` hides the button when empty |
| Whitespace-only address fields | **Pass** — truthiness only |
| Country blanked | Passes validation |
| Confirm pressed twice before dismissing the alert | Two alerts stack; `clearCart` runs twice, harmlessly |
| Cart changes while on this screen | The summary is live — it re-renders from the store |
| Very long item title | Row text wraps |
| Keyboard covering the inputs | No `KeyboardAvoidingView`; on a small screen the lower inputs can sit under the keyboard |

---

## Dependencies

`react-native` (`Alert`, `ScrollView`, `TextInput`), `@react-navigation/native`, `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| APP-03 | P1 | Checkout creates no order — the success alert is the whole feature |
| DATA-02 | P1 | Summary rows show a blank product name |
| QUAL-07 | P3 | `user` is selected and never used (ESLint error `23:9`) |
| NAV-05 | P2 | No header and no back affordance |
| DEAD-03 | P3 | Total is a third copy of the same reduce |
| DATA-04 | P1 | `colors.border` and `colors.textSecondary` used in this screen's styles resolve to `undefined` — `theme.js` defines only `primary`, `secondary`, `background`, `card`, `text` |
| — | P2 | No `KeyboardAvoidingView` |
| — | P2 | Payment method is a hardcoded string; there is no payment step |
| — | P3 | `country` is excluded from validation |
| — | P3 | Address fields have no `textContentType` / `autoComplete`, so no address autofill |

---

## Related Features

- [cart.md](cart.md) — the source of the items
- [order-history.md](order-history.md) — where the placed order does **not** appear
- [authentication.md](authentication.md) — `user` is selected here but unused

---

## Source Files

`src/screens/Cart/CheckoutScreen.tsx`, `src/store/cartStore.ts`, `src/store/userStore.ts`,
`src/navigation/CartStack.tsx`.

---

## Current Limitations

1. No order is created, stored, or returned.
2. No payment integration of any kind.
3. No address book and no address validation.
4. No shipping options or delivery estimates.
5. No tax or shipping cost.
6. No order confirmation screen — just an `Alert`.
7. No email or push confirmation.

---

## Unknowns

- Payment provider — **NOT YET DECIDED**.
- Whether guest checkout is allowed — **NOT YET DECIDED**.
- Order-number format and lifecycle — **NOT YET DECIDED**.
