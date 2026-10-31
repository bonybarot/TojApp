# Component: ProductCard

Status: **IMPLEMENTED — renders a blank title at runtime**
Last Verified: 2026-09-03
Source: `src/components/ProductCard.tsx` (64 lines)

---

## Purpose

A tile in a two-column product grid: image, title, price.

---

## Props

```ts
interface ProductCardProps {   // :5-11
  id: string;
  title: string;
  price: number;
  image: string;
  onPress?: () => void;
}
```

| Prop | Type | Required | Read in the body? |
|---|---|---|---|
| `id` | `string` | yes | **no** — declared, destructured at `:14`, never used (ESLint error, issue QUAL-05) |
| `title` | `string` | yes | `:29` |
| `price` | `number` | yes | `:31` |
| `image` | `string` | yes | `:26` |
| `onPress` | `() => void` | no | `:22` |

`onPress` being optional means a card with no handler is legal and silently does nothing.

---

## Structure

```tsx
<TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>   // :21-24
  <Image source={{ uri: image }} style={styles.image} />                            // :26
  <View style={styles.info}>                                                        // :27
    <Text style={styles.title} numberOfLines={2}>{title}</Text>                      // :28-30
    <Text style={styles.price}>${price.toFixed(2)}</Text>                            // :31
  </View>
</TouchableOpacity>
```

---

## Styling

| Style | Value | Line |
|---|---|---|
| `container.width` | `'48%'` | `:43` — designed for `numColumns={2}` with `columnWrapperStyle: { justifyContent: 'space-between' }` |
| `container.backgroundColor` | `colors.card` | `:39` |
| `container.borderRadius` | `8` (hardcoded) | `:40` |
| `image.height` | `200` (fixed) | `:47` |
| `image.resizeMode` | `'cover'` | `:48` |
| `title` | 16 / `'400'` / `colors.text` | `:53-57` |
| `price` | 20 / `'600'` / `colors.primary` | `:59-62` |

All spacing and sizing are hardcoded numbers; `theme.ts`'s `spacing`, `typography` and
`borderRadius` exports are not used (issue DATA-08).

The `'48%'` width is a layout contract with the parent — the component only lays out
correctly inside a 2-column `FlatList` with `space-between`. Both call sites honour it.

---

## Behaviour

Pure and stateless. No hooks, no store access, no side effects. `price.toFixed(2)` is the
only computation.

---

## Used by

| Caller | Line |
|---|---|
| `src/screens/Home/HomeScreen.tsx` | `:21-27` |
| `src/screens/Home/ProductListScreen.tsx` | `:30-36` |

Both call sites are identical apart from the surrounding screen.

---

## Runtime behaviour with the bundled data

Callers pass `title={item.title}`. Metro bundles `src/data/products.js`, whose items have
`name` and no `title`, so **`title` is `undefined` and the card renders an empty text
line**. `numberOfLines={2}` reserves no space for absent text, so the card collapses to
image + price.

`price` is present in both data files, so the price always renders.

Full explanation: [../current-state/data-flow.md](../current-state/data-flow.md).

---

## Edge Cases

| Case | Behaviour |
|---|---|
| `title` is `undefined` | Empty `<Text>` — the runtime case |
| Title longer than two lines | Truncated with an ellipsis (`numberOfLines={2}`) |
| `price` is `0` | `$0.00` |
| `price` is not a number | **Throws** — `.toFixed` on a non-number. Cannot happen with the current data |
| `image` URL fails | Blank 200px-tall box; no placeholder and no `onError` |
| `onPress` omitted | The card still shows touch feedback and does nothing |

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| DATA-02 | P1 | Blank title at runtime |
| DATA-04 | P1 | `colors.card` and `colors.text` exist in `theme.js`; the card is unaffected by the missing-token problem, unlike most screens |
| QUAL-05 | P3 | Unused `id` prop (ESLint error `14:3`) |
| DATA-08 | P3 | Hardcoded spacing and type instead of the theme tokens |
| APP-15 | P3 | No `accessibilityRole="button"`, no `accessibilityLabel` |
| — | P3 | Not memoised — every parent render re-renders every card |
| — | P3 | No `testID`; no test covers this component |
| — | P3 | The `'48%'` width couples the component to a 2-column parent |

---

## Related

- [../features/home.md](../features/home.md), [../features/product-browsing.md](../features/product-browsing.md) — the two call sites
- [CategoryCard.md](CategoryCard.md) — the near-twin
