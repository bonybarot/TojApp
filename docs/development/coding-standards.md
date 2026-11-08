# Coding Standards

> **Baseline note (2026-10-31).** Written against the pre-UI baseline (commit `66044c5`). Statements about failing tests, `.js`/`.ts` shadowing, the drawer or electronics data are historical. Today: `npx tsc --noEmit` 0 errors, `npm run lint` clean, `npm test` 6 suites / 12 tests pass. Current facts: [../current-state.md](../current-state.md).

Status: **DESCRIPTIVE, not prescriptive** — this records what the codebase does today
Last Verified: 2026-09-03
Source: `src/`, `.eslintrc.js`, `.prettierrc.js`, `tsconfig.json`

---

## How to read this page

No coding standard was ever written for this project. What follows is what the existing
code consistently does, derived by reading it. Where the codebase is inconsistent, that is
recorded as an inconsistency rather than resolved — resolving it is a decision, and no
decisions have been made yet ([../decisions/README.md](../decisions/README.md)).

---

## What is actually enforced

| Tool | Configured? | Enforced? |
|---|---|---|
| TypeScript `strict` | yes (`tsconfig.json` extends `@react-native/typescript-config`) | **not in any script** — there is no `typecheck` script and `tsc` is in no workflow |
| ESLint | yes (`.eslintrc.js` → `@react-native`) | `npm run lint` exists but **currently fails**; nothing runs it automatically |
| Prettier | yes (`.prettierrc.js`) | **never** — `@react-native/eslint-config` extends `eslint-config-prettier`, which *disables* formatting rules, and no `prettier/prettier` rule is enabled. Prettier is configured and run by nothing |
| Pre-commit hooks | no | — |
| CI | no | — |

So in practice **nothing is enforced**. The consistency described below is the result of
the code having been written in one sitting, not of tooling.

### Prettier settings (configured, unenforced)

`.prettierrc.js`:

```js
arrowParens: 'avoid',
bracketSameLine: true,
singleQuote: true,
trailingComma: 'all',
```

Visible drift that no tool reports: `src/screens/History/index.tsx` (no semicolons, no
trailing newline), `src/screens/auth/Login.tsx`, and double-quoted strings in
`src/utils/theme.js` and `src/data/products.js`.

---

## File and folder conventions

| Convention | Evidence |
|---|---|
| Screens live in `src/screens/<Feature>/<Name>Screen.tsx` | 13 of the 15 files under `src/screens/`; the exceptions are `History/index.tsx` and `auth/Login.tsx` |
| Reusable components live in `src/components/<Name>.tsx` | 4 files |
| Navigators live in `src/navigation/<Name>.tsx` | 7 files |
| Stores live in `src/store/<name>Store.ts` | 4 files |
| Mock data lives in `src/data/<name>.ts` | 6 files |
| Screen folders are **PascalCase** (`Home/`, `Cart/`, `Orders/`, `User/`, `Categories/`, `History/`) — except `auth/` | `src/screens/auth/` is the one lowercase folder |
| Components are named exports | `export const ProductCard` |
| Screens are default exports | `export default HomeScreen` |
| Stores are named exports | `export const useCartStore` |

### The `.ts` / `.js` split

Every file that is JavaScript rather than TypeScript is either dead code or a shadowing
twin:

| `.js` file | Role |
|---|---|
| `src/data/products.js` | shadows `products.ts` — **runs** |
| `src/utils/theme.js` | shadows `theme.ts` — **runs** |
| `src/store/authStore.js` | dead |
| `src/data/history.js` | dead |
| `src/components/HistoryItem.js` | dead |
| `src/screens/History/HistoryScreen.js` | dead |

**Rule that follows from this: do not add new `.js` files under `src/`.** Metro resolves
`.js` before `.ts`, so any new `.js` file risks silently shadowing a TypeScript module. See
[../archive/pre-ui-baseline/current-state/data-flow.md](../archive/pre-ui-baseline/current-state/data-flow.md).

---

## TypeScript conventions

| Convention | Evidence | Exceptions |
|---|---|---|
| `interface` for props and data shapes | `ProductCardProps`, `CartItem`, `Product`, `Order` | none |
| `type` for navigation types and unions | `HomeStackParamList`, `CartScreenNavigationProp`, the `status` union | none |
| Components typed `React.FC` / `React.FC<Props>` | all components and most screens | `HistoryScreen.js` (dead, untyped) |
| Explicit `any` avoided | — | **6 occurrences**: `DrawerNavigator.tsx:29`, `HomeScreen.tsx:20`, `ProductListScreen.tsx:16,29`, `CartScreen.tsx:33`, `OrderHistoryScreen.tsx:42` — five of them are `{ item: any }` on a `FlatList` `renderItem` |
| Types are shared | — | `Product` is declared **twice**, independently, in `products.ts:1-9` and `productStore.ts:4-12` (issue APP-14) |

`tsconfig.json` includes only `**/*.ts` and `**/*.tsx`. `allowJs` is `true`, but because no
`.js` file is in `include`, **no JavaScript file is ever type-checked**.

---

## Styling conventions

| Convention | Evidence |
|---|---|
| `StyleSheet.create` at the bottom of each file | 18 files |
| Zero inline style objects | 0 occurrences of `style={{` |
| Colours from `import { colors } from '…/utils/theme'` | 20 files, 146 references |
| Spacing, font size and radius are **hardcoded numbers** | `theme.ts` exports `spacing`, `typography` and `borderRadius`; **0 files import them** (issue DATA-08) |
| One hardcoded colour literal in live code | `CategoryCard.tsx:47` — `rgba(0, 0, 0, 0.3)` |
| Repeated base style | `container: { flex: 1, backgroundColor: colors.background }` appears in most screens |

The theme is half-adopted: colours yes, everything else no. And of the 146 colour
references, **51 resolve to `undefined` at runtime** because `theme.js` shadows `theme.ts`
and defines only 5 of the 11 tokens.

---

## State conventions

| Convention | Evidence | Exceptions |
|---|---|---|
| Selector-based subscriptions, never `useStore()` bare | every call site uses `useX(state => …)` | none |
| One store per domain | `cartStore`, `userStore`, `productStore` | `orders` and `categories` have **no store** and are imported directly by screens (issue APP-05) |
| No middleware | no `persist`, `devtools`, `immer` or `subscribeWithSelector` anywhere | — |
| Actions live in the store | `addToCart`, `login`, `loadProducts` | `ProductListScreen.tsx:18-23` filters inline instead of calling the store's `filterByCategory` |
| Selectors return stable references | most | `ProductListScreen.tsx:18-23` allocates a new array in the selector |

---

## Navigation conventions

| Convention | Evidence | Exceptions |
|---|---|---|
| One file per navigator, named export | 6 navigator files | — |
| A `ParamList` type per navigator | 5 declared | **`AuthStackParamList` and `DrawerParamList` are declared but not passed to `createXNavigator()`** (issue NAV-02) |
| `useNavigation<XScreenNavigationProp>()` | `HomeScreen`, `CartScreen`, `OrderHistoryScreen`, `CategoriesScreen` | `LoginScreen`, `SignupScreen`, `CheckoutScreen` and `DrawerNavigator` use bare `useNavigation()`; `ProductListScreen` uses `<NativeStackNavigationProp<any>>` |
| Route params typed from the ParamList | — | `ProductListScreen.tsx:9-12`, `ProductDetailsScreen.tsx:16-19` and `OrderDetailsScreen.tsx:7-10` declare **anonymous inline** `RouteProp`s instead |
| No `as never` | — | **3 occurrences**: `LoginScreen.tsx:61`, `SignupScreen.tsx:86`, `CategoriesScreen.tsx:24` |

---

## Patterns absent from the codebase

Recorded so nobody assumes they exist:

| Absent | Count verified |
|---|---|
| `React.memo`, `useMemo`, `useCallback` | 0 |
| `try` / `catch` | 0 in `src/` |
| Error boundaries | 0 |
| `console.*` | 0 in `src/` |
| `TODO` / `FIXME` / `HACK` / `XXX` | 0 |
| `accessibilityLabel` / `accessibilityRole` / `accessible` | 0 |
| `testID` | 0 |
| Custom hooks (`src/hooks/`) | the folder does not exist |
| `FlatList` tuning props (`initialNumToRender`, `windowSize`, `getItemLayout`) | 0 |
| `KeyboardAvoidingView` | 0 |
| `GestureHandlerRootView` | 0 — despite `react-native-gesture-handler` being imported twice (issue PLAT-03) |
| `className` (NativeWind) | 0 — the library is installed and entirely unconfigured |

---

## Commit conventions

Three commits exist:

```text
66044c5 fix: app not working on the android issue fixed
c19596a feat: initial ios ui setup of the app
c4a8e83 Initial commit
```

Two of the three use Conventional Commits prefixes (`fix:`, `feat:`). There is no commit
lint and no documented convention. Branching strategy: **UNKNOWN** — only `main` exists.

---

## Related

- [../archive/pre-ui-baseline/components/README.md](../archive/pre-ui-baseline/components/README.md) — component-level conventions
- [../archive/pre-ui-baseline/current-state/configuration.md](../archive/pre-ui-baseline/current-state/configuration.md) — the tooling configuration itself
- [../archive/pre-ui-baseline/current-state/known-issues.md](../archive/pre-ui-baseline/current-state/known-issues.md) — every deviation above, with a severity
