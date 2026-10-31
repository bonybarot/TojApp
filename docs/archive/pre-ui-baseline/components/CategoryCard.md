# Component: CategoryCard

Status: **IMPLEMENTED**
Last Verified: 2026-09-03
Source: `src/components/CategoryCard.tsx` (59 lines)

---

## Purpose

A tile in the two-column categories grid: a full-bleed image, a dark scrim, and a centred
title near the bottom.

---

## Props

```ts
interface CategoryCardProps {   // :5-10
  id: string;
  title: string;
  image: string;
  onPress?: () => void;
}
```

| Prop | Required | Read in the body? |
|---|---|---|
| `id` | yes | **no** — destructured at `:13`, never used (ESLint error `13:3`, issue QUAL-05) |
| `title` | yes | `:26` |
| `image` | yes | `:24` |
| `onPress` | no | `:21` |

---

## Structure

```tsx
<TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>  // :19-23
  <Image source={{ uri: image }} style={styles.image} />                           // :24
  <View style={styles.overlay} />                                                  // :25
  <Text style={styles.title}>{title}</Text>                                        // :26
</TouchableOpacity>
```

Three absolutely-layered children inside a `position: 'relative'` container (`:38`).

---

## Styling

| Style | Value | Line |
|---|---|---|
| `container` | `width: '48%'`, `height: 150`, `borderRadius: 8`, `overflow: 'hidden'` | `:32-39` |
| `image` | `100%` × `100%`, `resizeMode: 'cover'` | `:40-44` |
| `overlay` | `...StyleSheet.absoluteFillObject`, `backgroundColor: 'rgba(0, 0, 0, 0.3)'` | `:45-48` |
| `title` | 20 / `'600'` / `colors.background`, absolutely positioned 16 from bottom/left/right, centred | `:49-58` |

`rgba(0, 0, 0, 0.3)` at `:47` is the **only hardcoded colour literal in any live
component** — every other colour comes from the theme. It is also the reason the title
stays readable: `colors.background` is `#ffffff` in both theme files, and the scrim
guarantees contrast against an arbitrary photo.

The fixed `height: 150` means the tile does not adapt to long titles or to large system
font sizes.

---

## Behaviour

Pure and stateless. No hooks, no store, no side effects.

---

## Used by

| Caller | Line |
|---|---|
| `src/screens/Categories/CategoriesScreen.tsx` | `:28-33` |

One call site.

---

## Edge Cases

| Case | Behaviour |
|---|---|
| Title longer than the tile | No `numberOfLines`; the text wraps and can overflow the 150px tile, since `title` is absolutely positioned and the container clips with `overflow: 'hidden'` |
| Image URL fails | The scrim and title still render over a blank box — the tile degrades gracefully, unlike `ProductCard` |
| Large system font scale | Text can overflow the fixed height |
| `onPress` omitted | Touch feedback, no action |

---

## Known Issues

| ID | Severity | Issue |
|---|---|---|
| QUAL-05 | P3 | Unused `id` prop (ESLint error `13:3`) |
| DATA-08 | P3 | Hardcoded spacing, radius and type sizes |
| APP-15 | P3 | No accessibility role or label |
| — | P3 | Fixed `height: 150` with no `numberOfLines` on the title |
| — | P3 | Hardcoded `rgba(0, 0, 0, 0.3)` scrim, not a theme token |
| — | P3 | Not memoised; no `testID`; no test |

---

## Related

- [../features/categories.md](../features/categories.md) — the only call site
- [ProductCard.md](ProductCard.md) — same shape, same `id` defect, different composition
