# Debugging

> **Baseline note (2026-10-31).** Written against the pre-UI baseline (commit `66044c5`). Statements about failing tests, `.js`/`.ts` shadowing, the drawer or electronics data are historical. Today: `npx tsc --noEmit` 0 errors, `npm run lint` clean, `npm test` 10 suites / 37 tests pass. Current facts: [../current-state.md](../current-state.md).

Status: Current state as of 2026-09-03
Last Verified: 2026-09-03
Source: repository inspection

---

## Available tooling

| Tool | Available? | Notes |
|---|---|---|
| Metro dev server | yes | `npm start` |
| Fast Refresh | yes | React Native default |
| React Native DevTools | yes | `j` in the Metro terminal, or Dev Menu → "Open DevTools". Hermes is enabled, so this is the supported debugger |
| Dev Menu | yes | `d` in the Metro terminal; shake on device |
| Element Inspector | yes | via the Dev Menu |
| Performance Monitor | yes | via the Dev Menu |
| Flipper | **no** | not installed; removed from the RN template by default |
| Redux DevTools | **no** | zustand is used without the `devtools` middleware |
| Reactotron | **no** | not installed |
| Crash reporting (Sentry, Crashlytics) | **no** | not installed |
| Analytics | **no** | not installed |
| Network inspector | **not useful** | the app makes no API calls |
| `console.*` statements | **0 in `src/`** | there is no logging to read |

---

## The one thing to know before debugging anything

**The file you are reading may not be the file that is running.**

Metro resolves `.js` before `.ts` (`sourceExts: js,jsx,json,ts,tsx`). TypeScript resolves
`.ts` first. Two import specifiers in this project resolve differently in the two systems:

| Import in the source | TypeScript sees | Metro executes |
|---|---|---|
| `'../data/products'` (`productStore.ts:2`) | `src/data/products.ts` — 15 clothing items | `src/data/products.js` — 6 electronics |
| `'../utils/theme'` (20 files) | `src/utils/theme.ts` — 11 colours + spacing/typography/radii | `src/utils/theme.js` — 5 colours |

If a value is `undefined` at runtime but clearly defined in the `.ts` file you are looking
at, **check for a `.js` twin first**. This explains most of the visual oddities in the app:
blank product titles, empty category chips, invisible status badges, invisible drawer email
text.

Full explanation: [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md).

### How to confirm what Metro resolved

```bash
# print the resolver's extension order
npx react-native config | grep -i sourceExts

# print exactly which files TypeScript is compiling
npx tsc --showConfig | grep -A40 '"files"'
```

The `tsc --showConfig` output lists `./src/data/products.ts` and `./src/utils/theme.ts` and
**no `.js` file at all** — that contrast is the proof of the divergence.

---

## Symptom → cause table

Every entry below has been traced to a specific cause in this repository.

| Symptom | Cause | Where |
|---|---|---|
| Product cards show an image and price but no name | `products.js` has `name`; the code reads `title` | [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md) |
| Product details heading is blank | same | `ProductDetailsScreen.tsx:50` |
| Category chip on product details is empty | `products.js` has no `category` | `ProductDetailsScreen.tsx:53` |
| Every category shows an empty product grid | same — the filter can never match | `ProductListScreen.tsx:20` |
| Order status badges are invisible | all six `getStatusColor` branches return tokens missing from `theme.js` | `OrderHistoryScreen.tsx:21-36` |
| The drawer's email text is unreadable | `colors.textSecondary` is `undefined` on a black band | `DrawerHeader.tsx:49` |
| Placeholder text in the auth inputs looks wrong | `placeholderTextColor={colors.textSecondary}` is `undefined` | `LoginScreen.tsx:39,49` |
| Borders are missing between rows | `colors.border` is `undefined`, so `borderBottomColor` falls back | many screens |
| A "key should be a string" warning in the console | `keyExtractor` returns `item.id`, a number under `products.js` | `HomeScreen.tsx:35`, `CartScreen.tsx:77` |
| The app logs you out every launch | nothing is persisted | `userStore.ts:20` |
| An order you just placed is not in Order History | checkout creates no record | `CheckoutScreen.tsx:44` |
| The previous user's cart is still there after logging in | `logout` does not clear `cartStore` | `userStore.ts:34-39` |
| Settings switches do nothing | their state is read by nothing | `SettingsScreen.tsx:13-14` |
| Profile menu rows do nothing | no `onPress` on any of the six | `ProfileScreen.tsx:36-62` |
| Gestures behave oddly | `GestureHandlerRootView` is missing entirely | issue PLAT-03 |
| No back button on a detail screen | `headerShown: false` on the three inner stacks | issue NAV-05 |
| `npm test` fails immediately | Reanimated ESM is not transpiled by Jest | [testing.md](testing.md) |
| `npm run lint` fails | 6 pre-existing errors, 2 warnings | [../archive/pre-ui-baseline/current-state/testing.md](../archive/pre-ui-baseline/current-state/testing.md) |
| `npx tsc --noEmit` reports one error | duplicate `fontWeight` key | `OrderHistoryScreen.tsx:113` |

---

## Inspecting state

There are no devtools wired into the stores. To read a store while debugging, use the
zustand vanilla API from a React Native DevTools console or a temporary breakpoint:

```js
// non-persistent inspection only
useCartStore.getState()
useUserStore.getState()
useProductStore.getState()
```

`useProductStore.getState().products.length` is the fastest single check for which data
file Metro bundled: **6** means `products.js`, **15** means `products.ts`.

---

## Platform-specific

### Android

```bash
adb logcat '*:S' ReactNative:V ReactNativeJS:V
```

`usesCleartextTraffic` is bound to a manifest placeholder (`AndroidManifest.xml:12`), so
plaintext HTTP is permitted in debug and blocked in release. Only `INTERNET` is requested.

### iOS

App Transport Security is on: `NSAllowsArbitraryLoads` is `false` with
`NSAllowsLocalNetworking` `true` (`Info.plist`). A plaintext HTTP endpoint added later
would be blocked on iOS while working on Android debug — a classic divergence to keep in
mind.

`NSLocationWhenInUseUsageDescription` is present but **empty**; if location were ever
requested, iOS would reject the app at review.

---

## What you cannot debug, because it does not exist

- Network requests — there are none.
- Server errors — there is no server.
- Persisted state — nothing is written to disk.
- Crash reports from real users — no crash reporter.
- Production logs — no logging.

---

## Related

- [../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md) — the shadowing defect in full
- [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md) — all 65 findings
- [testing.md](testing.md)
- [../../AGENTS.md](../../AGENTS.md)
