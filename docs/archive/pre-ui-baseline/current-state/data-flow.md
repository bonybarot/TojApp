# Data Flow

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `src/data/*`, `src/utils/*`, `src/store/*`, `metro.config.js`, `tsconfig.json`

> This is the most important document in this set. The project contains **two parallel,
> incompatible data layers**, and which one runs is decided by the module resolver, not by
> the code. Read this before changing anything under `src/data/` or `src/utils/`.

---

## 1. The headline problem

```text
                      import { products } from '../data/products'
                              src/store/productStore.ts:2
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
        TypeScript resolves                            Metro resolves
                 │                                             │
      src/data/products.ts                          src/data/products.js
                 │                                             │
   ┌─────────────┴─────────────┐               ┌───────────────┴──────────────┐
   │ 15 items                  │               │ 6 items                      │
   │ clothing                  │               │ consumer electronics         │
   │ id: string   ('1'…'15')   │               │ id: number   (1…6)           │
   │ title                     │               │ name        ◄── different key│
   │ category  (Tops/Bottoms/  │               │ (no category field at all)   │
   │            Outerwear)     │               │                              │
   │ images?: string[]         │               │ (no images field)            │
   └───────────────────────────┘               └──────────────────────────────┘
        what `tsc` type-checks                     what the device executes
```

**TypeScript sees a 15-item clothing catalogue. Metro sees a 6-item electronics catalogue.**
Both statements are true at the same time, about the same import line.

---

## 2. Why this happens

Two resolvers with opposite extension priorities are pointed at the same extensionless
import specifier.

### Metro

`metro.config.js` is the stock template — `mergeConfig(getDefaultConfig(__dirname), {})` —
so it uses React Native's default resolver order. Verified against the installed config:

```console
$ node -e "const c=require('@react-native/metro-config').getDefaultConfig(process.cwd()); \
           console.log(c.resolver.sourceExts.join(','))"
js,jsx,json,ts,tsx
```

`.js` is **first**. Given `'../data/products'`, Metro tries `products.js` before
`products.ts`, finds it, and stops. **`src/data/products.ts` is never bundled.**

### TypeScript

`tsconfig.json` extends `@react-native/typescript-config`, which sets
`moduleResolution: "bundler"`. TypeScript's own extension order always prefers TypeScript
sources: `.ts` → `.tsx` → `.d.ts` → (with `allowJs`) `.js`. Given the same specifier it
resolves `products.ts`. **`src/data/products.js` is never type-checked.**

### Corroboration

`npx tsc --noEmit` reports exactly one error, and it is unrelated (TS1117 in
`OrderHistoryScreen.tsx`). If `tsc` had resolved `products.js`, assigning
`{ id: number; name: string; … }[]` to `Product[]` — whose `id` is `string` and which
requires `title` and `category` — would be a hard error under `strict: true`. The absence
of that error is direct evidence that the two resolvers disagree.

---

## 3. Field-by-field divergence

| Field | `src/data/products.ts` | `src/data/products.js` | Consequence at runtime |
|---|---|---|---|
| item count | 15 (`:11` onward) | 6 (`:1-44`) | Home shows 6 cards, not 15 |
| domain | clothing | consumer electronics | A "clothing app" (`README.md`) displays headphones, a smartwatch, a laptop stand, a keyboard, a USB-C hub and a mouse |
| `id` | `string` — `'1'`…`'15'` | `number` — `1`…`6` (`:3`, `:10`, …) | Lookups still work (the id is passed through unconverted, so `number === number`), but every signature that declares `id: string` is lying, and `keyExtractor={item => item.id}` (`HomeScreen.tsx:35`, `ProductListScreen.tsx:49`) returns a number where `FlatList` expects a string |
| title key | `title` | **`name`** (`:4`) | `ProductCard` renders `{title}` → `undefined` → **blank product names** |
| `category` | present, required (`:6`) | **absent** | `p.category === category` never matches → **every category list is empty** |
| `images?` | present on every item | absent | no effect today — **`images` is read nowhere in `src/`** (0 matches for `.images`), so the field is dead in both files |
| `price` | present | present | the only field that works end to end |
| `image` | present | present | images do render |
| `description` | present | present | renders on the details screen |

### Symptom chain

| Screen | What the code does | What the user sees under Metro |
|---|---|---|
| `HomeScreen.tsx:14,36` | `FlatList` of `filteredProducts`, 2 columns | 6 electronics tiles with **images and prices but no titles** |
| `ProductCard.tsx:29` | `<Text>{title}</Text>` | empty — the `.js` items have `name`, not `title` |
| `ProductListScreen.tsx:18-23` | `state.products.filter(p => p.category === category)` | **always empty** — no item has a `category` |
| `ProductDetailsScreen.tsx:26,49,52` | `getProductById(productId)`, then renders `product.title` and `product.category` | The product **is** found, but the title and the category chip render blank (those keys do not exist on a `.js` item). Only image, price and description display. |
| `ProductDetailsScreen.tsx:36-44` | `addToCart({ id, title, price, image })` | Adds a line with `title: undefined` → the cart row is blank too, and the defect propagates into `CartScreen` and `CheckoutScreen` |

> **KNOWN ISSUE.** The single import at `src/store/productStore.ts:2` is the root cause of
> a chain of user-visible defects: the wrong catalogue, blank product names everywhere the
> name appears (grid, details, cart, checkout), and an empty result for every category.
> None of it is visible in the editor, because the editor is reading the other file.

---

## 4. The same defect in the theme layer

`src/utils/` contains the identical pattern.

| | `src/utils/theme.js` | `src/utils/theme.ts` |
|---|---|---|
| Lines | 8 | 57 |
| Exports | `colors` only | `colors`, `spacing`, `typography`, `borderRadius` |
| `colors` keys | 5 — `primary`, `secondary`, `background`, `card`, `text` | 11 — those 5 plus `textSecondary`, `border`, `error`, `success`, `warning`, `info` |
| Resolved by Metro | **yes** | no |
| Resolved by TypeScript | no | **yes** |

**20 files** import `{ colors } from '…/utils/theme'` (every screen, every component, three
navigators). Usage counts across `src/`:

| Token | Uses | In `theme.js`? | Runtime value |
|---|---|---|---|
| `colors.background` | 31 | yes | `#ffffff` |
| `colors.text` | 31 | yes | `#222222` |
| `colors.textSecondary` | 27 | **no** | **`undefined`** |
| `colors.primary` | 22 | yes | `#000000` |
| `colors.border` | 11 | **no** | **`undefined`** |
| `colors.card` | 10 | yes | `#f5f5f5` |
| `colors.error` | 7 | **no** | **`undefined`** |
| `colors.success` | 2 | **no** | **`undefined`** |
| `colors.warning` | 2 | **no** | **`undefined`** |
| `colors.info` | 2 | **no** | **`undefined`** |
| `colors.secondary` | 1 | yes | `#555555` |

**51 of 146 colour references resolve to `undefined` on device.** TypeScript reports none of
them, because `theme.ts` declares all 11 keys.

React Native does not throw on an `undefined` style colour — it falls back to the platform
default. Secondary text, borders and every error/success message therefore render in a
colour nobody chose, and the fault is invisible in the editor, in `tsc`, and in ESLint.

### Status badge mismatch — a concrete instance

`src/data/orders.ts:12` types order status as
`'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'`, and the four sample
orders use `delivered` (`:30`), `shipped` (`:61`), `processing` (`:85`), `pending` (`:116`).

`OrderHistoryScreen.tsx:21-36` maps each to a colour:

```tsx
case 'delivered':  return colors.success;        // undefined at runtime
case 'shipped':    return colors.info;           // undefined at runtime
case 'processing': return colors.warning;        // undefined at runtime
case 'pending':    return colors.textSecondary;  // undefined at runtime
case 'cancelled':  return colors.error;          // undefined at runtime
default:           return colors.textSecondary;  // undefined at runtime
```

**Every branch returns `undefined`.** The status badge is colour-coded in source and
uniform on screen. The same function is duplicated byte-for-byte at
`OrderDetailsScreen.tsx:25-40`, so both screens are wrong in the same way.

### The unadopted scales

`spacing` (`theme.ts:15-22`), `typography` (`:24-49`) and `borderRadius` (`:51-57`) have
**zero importers**. Every screen hardcodes its values instead — `borderRadius: 8` appears
in 12 places, `borderRadius: 4` in 4, `borderRadius: 9999` in 2. Even if the resolution bug
were fixed, these three exports would still be dead, because nothing imports them.

---

## 5. Full inventory of the two data layers

| Concern | `.ts` layer (TypeScript sees) | `.js` layer (Metro runs) | Shadowed? |
|---|---|---|---|
| Products | `src/data/products.ts` — 15 clothing, `id: string`, `title`, `category` | `src/data/products.js` — 6 electronics, `id: number`, `name` | **Yes** |
| Theme | `src/utils/theme.ts` — 11 colours + 3 scales | `src/utils/theme.js` — 5 colours | **Yes** |
| Auth store | `src/store/userStore.ts` | `src/store/authStore.js` | No — different specifier, so the `.js` file is simply dead |
| History screen | `src/screens/History/index.tsx` (placeholder) | `src/screens/History/HistoryScreen.js` (real list) | Not shadowed — different filenames, and **neither is registered in a navigator** |
| History data | — | `src/data/history.js` — 4 electronics purchases | No `.ts` twin |
| History item | — | `src/components/HistoryItem.js` | No `.ts` twin |
| Categories | `src/data/categories.ts` — 8 categories | — | No twin |
| Orders | `src/data/orders.ts` — 4 orders | — | No twin |

Only **two** import specifiers are genuinely ambiguous: `'../data/products'` and
`'…/utils/theme'`. The rest of the `.js` files are unreferenced rather than shadowing.

### Git provenance

Both twins of both pairs were added in the **same commit**, `c19596a`
("feat: initial ios ui setup of the app"), which introduced the entire `src/` tree. There
was never a migration step that deleted the old files. This is not documented anywhere in
the repository outside this file, so whether the `.js` files were intended to be removed is
**UNKNOWN**.

---

## 6. Category coverage — a second, independent data defect

Even after the resolution problem is resolved in favour of `products.ts`, the category
browse flow is still partly broken.

`src/data/categories.ts` declares **8** categories:

| Category | Products in `products.ts` |
|---|---|
| Tops | 5 (lines 17, 77, 113, 137, 161) |
| Bottoms | 5 (lines 29, 65, 101, 125, 173) |
| Outerwear | 5 (lines 41, 53, 89, 149, 185) |
| Accessories | **0** |
| Shoes | **0** |
| Activewear | **0** |
| Formal | **0** |
| Sale | **0** |

**5 of 8 category cards lead to an empty product list**, and `ProductListScreen` has no
empty state — the user gets a blank screen with no explanation. This is a *content* gap,
separate from the resolution bug, and it survives any fix to the latter.

Note also that `Sale` is not a garment category but a merchandising flag; matching it with
`p.category === 'Sale'` could never work against a single-valued `category` field.

---

## 7. Where data enters the application

There are exactly **five** module-level data imports. No other source of data exists.

| # | Import | Site | Consumer path |
|---|---|---|---|
| 1 | `products` | `src/store/productStore.ts:2` | store → `HomeScreen`, `ProductListScreen`, `ProductDetailsScreen` |
| 2 | `categories` | `src/screens/Categories/CategoriesScreen.tsx:6` | screen directly — no store |
| 3 | `orders` | `src/screens/Orders/OrderHistoryScreen.tsx:11` | screen directly — no store |
| 4 | `orders` | `src/screens/Orders/OrderDetailsScreen.tsx:4` | screen directly — no store |
| 5 | `history` | `src/screens/History/HistoryScreen.js:5` | screen directly — **screen unreachable** |

Only #1 passes through a store. See "Pattern A vs Pattern B" in
[architecture.md](architecture.md).

## 8. Where data leaves the application

**Nowhere.** There is no `fetch`, no `axios`, no WebSocket, no analytics SDK, no crash
reporter, no persistence. Verified: 0 matches for `fetch(` and `axios` across `src/`.
The `INTERNET` permission in `android/app/src/main/AndroidManifest.xml` is used only for
loading remote product images from `images.unsplash.com` and the avatar from
`i.pravatar.cc`.

---

## 9. Type duplication across the data layer

The same conceptual entity is declared more than once, with no shared source:

| Entity | Declarations |
|---|---|
| Product | `src/data/products.ts:1-9` and `src/store/productStore.ts:4-12` (structurally identical, independently maintained) |
| Cart line | `src/store/cartStore.ts:3-9` (`CartItem`) |
| Order line | `src/data/orders.ts:1-7` (`OrderItem`) — same five fields as `CartItem` |
| Address | `src/data/orders.ts:15-22` (inline in `Order`) and `src/screens/Cart/CheckoutScreen.tsx:25-31` (local `useState` shape) |
| User | `src/store/userStore.ts:3-8` |

`CartItem` and `OrderItem` are field-for-field identical (`id`, `title`, `price`, `image`,
`quantity`), which is what a cart-to-order conversion would need — but no such conversion
exists (`CheckoutScreen.tsx:33-54` creates no order).

---

## 10. How to see the truth for yourself

Read-only checks; none of these modify the repository.

```bash
# What Metro will resolve
node -e "const c=require('@react-native/metro-config').getDefaultConfig(process.cwd()); \
         console.log(c.resolver.sourceExts.join(','))"
# → js,jsx,json,ts,tsx   ('.js' before '.ts')

# The two catalogues, side by side
grep -c "^    title:" src/data/products.ts   # 15
grep -c "^    name:"  src/data/products.js   # 6

# The two colour palettes
grep -c ":" src/utils/theme.js               # theme.js colour keys
grep -n "^  [a-z]" src/utils/theme.ts        # theme.ts colour keys
```

At runtime, `console.log(products.length)` inside `loadProducts` would print `6`, not `15`.

---

## Summary

| Fact | Evidence |
|---|---|
| Metro prefers `.js`; TypeScript prefers `.ts` | `sourceExts` above; `moduleResolution: "bundler"` |
| Two shadowed specifiers: products and theme | §5 |
| The bundled catalogue is 6 electronics items, not 15 clothing items | §1, §3 |
| Product titles render blank (`name` vs `title`) | §3 |
| Every category list is empty (no `category` field) | §3 |
| Product titles are blank on the details screen and in the cart as well | §3 |
| 51 colour references resolve to `undefined` | §4 |
| All 6 status-badge colours resolve to `undefined` | §4 |
| `spacing`, `typography`, `borderRadius` have zero importers | §4 |
| 5 of 8 categories have no products even in the `.ts` catalogue | §6 |
| Neither the compiler, the linter, nor the test suite detects any of this | §2 |

---

## Related documents

- [architecture.md](architecture.md)
- [state-management.md](state-management.md)
- [known-issues.md](known-issues.md)
- [../features/product-browsing.md](../features/product-browsing.md)
