# Feature: Product Details

Status: **IMPLEMENTED (against mock data) — renders with missing fields at runtime**
Last Verified: 2026-09-03
Source: `src/screens/Home/ProductDetailsScreen.tsx`, `src/store/productStore.ts`, `src/store/cartStore.ts`

---

## Purpose

Show one product and let the user add it to the cart. This is the only place in the app
where anything enters the cart.

---

## User Flow

```text
Home or ProductList → tap a ProductCard
  └─ navigate('ProductDetails', { productId: item.id })
       └─ getProductById(productId)
            ├─ not found → "Product not found"
            └─ found → image, title, price, category chip, description, "Add to Cart"
                 └─ Add to Cart
                      ├─ cartStore.addToCart({ id, title, price, image })
                      └─ Alert 'Success' / 'Product added to cart!'
                          (the screen does NOT navigate away)
```

---

## Entry Points

| Entry | Location |
|---|---|
| From Home | `src/screens/Home/HomeScreen.tsx:16-18`, `:26` |
| From ProductList | `src/screens/Home/ProductListScreen.tsx:25-27`, `:35` |
| Route registration | `src/navigation/HomeStack.tsx:24` |

Both callers pass `item.id` **unconverted**. Under `products.ts` that is a `string`; under
`products.js` it is a `number`. `getProductById` uses `===` (`productStore.ts:47`), and
because the same unconverted value goes in and comes back out, the lookup **matches in both
cases** — the declared `productId: string` type is simply wrong at runtime.

---

## Screens

| Screen | File | Route |
|---|---|---|
| ProductDetails | `src/screens/Home/ProductDetailsScreen.tsx` (~110 lines) | `HomeStack` → `ProductDetails` |

Rendered inside a `ScrollView` (`:47`). `headerShown: false`, so **there is no back button
in a header** — the user must use the OS back gesture or the Android hardware back button
(issue NAV-05).

---

## Components

None. Built from primitives.

---

## Hooks

| Hook | Line | Notes |
|---|---|---|
| `useRoute<ProductDetailsRouteProp>()` | `:22` | Anonymous inline `RouteProp` (`:16-19`), not `HomeStackParamList` |
| `useProductStore(state => state.getProductById)` | `:24` | selects the function |
| `useCartStore(state => state.addToCart)` | `:25` | selects the action |

---

## State

None local. Product is looked up on each render; there is no memoisation.

---

## Data

| Field rendered | Line | Under `products.ts` | Under `products.js` (runtime) |
|---|---|---|---|
| `product.image` | `:48` | present | present |
| `product.title` | `:50` | present | **`undefined`** — the file has `name` |
| `product.price` | `:51` | present | present |
| `product.category` | `:53` | present | **`undefined`** — chip renders empty |
| `product.description` | `:55` | present | present |
| `product.images` | — | declared optional in the type | **never read anywhere in `src/`** (0 matches for `.images`) |

So the runtime screen shows an image, a blank heading, a price, an empty category chip and
a description.

---

## Business Logic

| Rule | Where |
|---|---|
| Look up by id | `:26` → `productStore.ts:46-48`, `products.find(p => p.id === id)` |
| Missing product shows a message | `:28-34` |
| Add to cart passes exactly 4 fields | `:37-42` — `id`, `title`, `price`, `image` |
| Quantity is always 1 | implicit; `addToCart` sets `quantity: 1` for a new item (`cartStore.ts`) |
| No quantity selector on this screen | — |

Because `title` is `undefined` at runtime, the item added to the cart carries
`title: undefined`, which then propagates to the cart row (`CartScreen.tsx:37`) and the
checkout summary (`CheckoutScreen.tsx:97`).

---

## API

**NOT IMPLEMENTED.** No fetch, no stock check, no price verification.

---

## Persistence

**NOT IMPLEMENTED.**

---

## Error Handling

One branch: `if (!product)` renders `"Product not found"` (`:28-34`). No error boundary, no
image `onError`.

---

## Edge Cases

| Case | Current behaviour |
|---|---|
| Unknown `productId` | "Product not found" — reachable only by a code path that does not exist today |
| Adding the same product twice | `addToCart` merges and increments `quantity` (`cartStore.ts:26-43`) — correct |
| Very long title | No `numberOfLines`; the heading wraps freely |
| Image URL fails | Blank image area |
| Rapid double-tap "Add to Cart" | Adds quantity 2 and shows two stacked alerts |
| No `route.params` | **Would throw** — `:23` destructures `route.params` with no guard, unlike `ProductListScreen.tsx:17`. Not reachable today because every caller passes params |

---

## Dependencies

`react-native` (`Alert`, `Image`, `ScrollView`), `@react-navigation/native`, `zustand`.

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-02 | P1 | Blank title — and `title: undefined` is written into the cart |
| DATA-03 | P1 | Empty category chip |
| NAV-07 | P3 | Anonymous inline `RouteProp` |
| NAV-05 | P2 | No header and therefore no back affordance |
| — | P3 | Success is confirmed by a modal `Alert` rather than in-context feedback |
| — | P3 | No quantity selector |
| — | P3 | `route.params` destructured without a guard (`:23`) |
| — | P3 | `product.images` is declared but read nowhere |

---

## Related Features

- [home.md](home.md), [product-browsing.md](product-browsing.md) — entry points
- [cart.md](cart.md) — the destination of "Add to Cart"

---

## Source Files

`src/screens/Home/ProductDetailsScreen.tsx`, `src/store/productStore.ts`,
`src/store/cartStore.ts`, `src/navigation/HomeStack.tsx`.

---

## Current Limitations

1. No image gallery, despite `images?: string[]` existing on the type.
2. No quantity selector.
3. No variants (size, colour).
4. No stock or availability.
5. No reviews or ratings.
6. No related or recommended products.
7. No share, no wishlist.
8. No back button.

---

## Unknowns

- Whether products will have variants — **NOT YET DECIDED**.
- Whether "add to cart" should navigate to the cart, show a toast, or stay put —
  **NOT YET DECIDED**.
