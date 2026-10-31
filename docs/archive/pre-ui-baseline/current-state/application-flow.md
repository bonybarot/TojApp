# Application Flow

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `index.js`, `App.tsx`, `src/navigation/`, `src/screens/`, `src/store/`

---

## 1. Cold start

| # | Step | File:line | What happens |
|---|---|---|---|
| 1 | Native launch | `android/app/src/main/java/.../MainActivity.kt`, `ios/TojApp/AppDelegate.swift` | Native host loads the `TojApp` JS bundle. New Architecture is on (`android/gradle.properties` `newArchEnabled=true`, `ios/TojApp/Info.plist` `RCTNewArchEnabled=true`), so Fabric renders and TurboModules are used. |
| 2 | JS entry | `index.js:5,10` | Side-effect import of `react-native-gesture-handler` (`:5`), then `AppRegistry.registerComponent(appName, () => App)` (`:10`) with `appName` from `app.json` (`"TojApp"`). |
| 3 | Root component | `App.tsx:12-19` | Side-effect imports `react-native-reanimated` (`:1`) and `react-native-gesture-handler` again (`:7`), then renders `SafeAreaProvider` → `StatusBar` → `NavigationContainer` → `RootNavigator`. `StatusBar` follows `useColorScheme()` (`:10,14`) — the **only** place the OS colour scheme is read; nothing else in the app is theme-aware. **There is no `GestureHandlerRootView`** — see [known-issues.md](known-issues.md). |
| 4 | Auth branch | `RootNavigator.tsx:8,15` | Reads `useUserStore(state => state.isLoggedIn)`. Initial value is `false` (`userStore.ts:19`), so **`AuthStack` mounts first, always**. |
| 5 | Product load | `RootNavigator.tsx:11-13` | `useEffect(() => { loadProducts(); }, [loadProducts])` runs once on mount — **before and regardless of login**. |
| 6 | First paint | — | `LoginScreen`. |

There is **no splash-screen module**, **no bootstrap gate**, and **no restored session** — see
step 4: `isLoggedIn` starts `false` on every launch because nothing is persisted.

---

## 2. `loadProducts` — the only "data fetch"

`src/store/productStore.ts:27-32`:

```ts
loadProducts: () => {
  set({
    products,
    filteredProducts: products,
  });
},
```

`products` comes from a **static module import** at `productStore.ts:2`
(`import { products } from '../data/products';`). There is no network call, no async
boundary, no loading state and no error state. The call is synchronous; by the time the
first screen renders, the store is populated.

> **KNOWN ISSUE** — which file that import resolves to differs between TypeScript and
> Metro. See [data-flow.md](data-flow.md).

---

## 3. Authentication flow

```text
LoginScreen                                   src/screens/auth/LoginScreen.tsx
  ├─ email / password local useState
  ├─ "Login" pressed → handleLogin()
  │     ├─ if (!email || !password) → Alert "Please fill in all fields"   :22
  │     └─ else login(email, password)                                    :16, :27
  │           └─ userStore.login()                                        src/store/userStore.ts:21
  │                 ├─ sets user = { id:'1', name:'John Doe', email, avatar:'…' }
  │                 └─ sets isLoggedIn = true
  │                       └─ RootNavigator re-renders → DrawerNavigator mounts
  └─ "Sign up" pressed → navigation.navigate('Signup' as never)           :61

SignupScreen                                  src/screens/auth/SignupScreen.tsx
  ├─ name / email / password / confirmPassword local useState
  ├─ "Sign up" pressed → handleSignup()
  │     ├─ any field empty → Alert "Please fill in all fields"            :24
  │     ├─ password !== confirmPassword → Alert                           :29
  │     └─ else login(email, password)   ← the SAME login action          :16, :34
  └─ "Log in" pressed → navigation.navigate('Login' as never)             :86
```

**MOCK / PROTOTYPE.** `userStore.ts:22` states it outright:
`// Mock login - in real app, this would call an API`. The `password` parameter is accepted
and **never read**. Any non-empty pair signs in. Sign-up does not create anything: the
`name` the user typed is discarded and the fabricated user is always `John Doe`.

**Logout:** drawer → "Logout" (`DrawerNavigator.tsx:33-36`) calls `logout()`, which sets
`user = null, isLoggedIn = false` (`userStore.ts:38-41`). `RootNavigator` swaps back to
`AuthStack`. The cart is **not** cleared on logout.

---

## 4. Post-login shell

Once `isLoggedIn` is `true` the drawer mounts and the user lands on `MainTabs` → `HomeStack`
→ `Home`.

Two chrome elements are always present:

| Element | File | Contents |
|---|---|---|
| Drawer (swipe / hamburger) | `DrawerNavigator.tsx` | `DrawerHeader` + Home, Categories, Orders, Profile, Settings, Logout |
| Bottom tab bar | `MainTabs.tsx` | Home, Cart, Profile |

`DrawerHeader` (`src/components/DrawerHeader.tsx:7`) reads `useUserStore(state => state.user)`
and returns `null` when there is none.

---

## 5. Browse and purchase flow

```text
Home                    HomeScreen.tsx
  │ FlatList of filteredProducts, numColumns 2               :14, :36
  │ ProductCard onPress → navigate('ProductDetails', { productId: item.id })
  ▼
ProductDetails          ProductDetailsScreen.tsx
  │ getProductById(productId)                                :24, :26
  │ if not found → "Product not found" view                  :28-34
  │ "Add to Cart" → handleAddToCart()                        :36-44
  │     ├─ cartStore.addToCart({ id, title, price, image })
  │     └─ Alert.alert('Success', 'Product added to cart!')   :43
  │        (stays on the screen — no navigation to the cart)
  ▼
Cart                    CartScreen.tsx        (bottom tab, or manual)
  │ items from cartStore                                     :20
  │ total computed inline with reduce                        :21-23
  │ +/- → updateQuantity, trash → removeFromCart             :24-25
  │ "Checkout" → navigate('Checkout')
  ▼
Checkout                CheckoutScreen.tsx
  │ local address form: name, street, city, state, zip, country='USA'  :25-31
  │ "Confirm Order" → handleConfirmOrder()                   :33-54
  │     ├─ truthiness check on every address field → Alert on failure
  │     ├─ // In a real app, this would create an order via API   :44
  │     ├─ Alert.alert('Success', 'Your order has been placed!')
  │     ├─ clearCart()
  │     └─ navigation.goBack()   → back to Cart, now empty
  ▼
(nothing)
```

> **MOCK / PROTOTYPE — the purchase does not exist.** `handleConfirmOrder` creates no order
> object, writes nothing to any store, and sends nothing anywhere. The cart empties and the
> user returns to the empty cart. The order history the app then shows is the unrelated
> static list in `src/data/orders.ts`.

---

## 6. Category flow

```text
Drawer → Categories             CategoriesScreen.tsx
  │ categories imported directly from ../../data/categories   :6
  │ 8 cards
  │ onPress → handleCategoryPress(category.title)             :18-24
  │     navigation.getParent()?.navigate('MainTabs', {
  │       screen: 'HomeStack',
  │       params: { screen: 'ProductList', params: { category } },
  │     } as never)
  ▼
ProductList                     ProductListScreen.tsx
    category read from route.params                           :9-12, :17
    products filtered inline: state.products.filter(p => p.category === category)  :18-23
    ProductCard onPress → navigate('ProductDetails', { productId })
```

> **KNOWN ISSUE.** `src/data/categories.ts` declares 8 categories; `src/data/products.ts`
> only uses 3 of them (`Tops`, `Bottoms`, `Outerwear`). Even with the correct data file
> loaded, **5 of the 8 category cards open an empty list**, and the list has no empty state.
> See [data-flow.md](data-flow.md).

---

## 7. Order history flow

```text
Drawer → Orders                 OrderHistoryScreen.tsx
  │ orders imported directly from ../../data/orders            :11
  │ 4 static orders, no store involved
  │ status badge colour via local getStatusColor(status)       :21-36
  │ onPress → navigate('OrderDetails', { orderId })
  ▼
OrderDetails                    OrderDetailsScreen.tsx
    orders imported directly again                             :4
    order = orders.find(o => o.id === orderId)                 :15
    getStatusColor duplicated byte-for-byte                    :25-40
```

This branch bypasses the store layer entirely — see the "Pattern B" discussion in
[architecture.md](architecture.md).

---

## 8. Profile and settings flow

`ProfileScreen.tsx` shows the mock user and **six menu rows with no `onPress` handler at
all**: Edit Profile (:36), Change Password (:40), Payment Methods (:44), Shipping Addresses
(:48), Order History (:55), Wishlist (:59). Every row is a `TouchableOpacity` that
acknowledges the touch visually and does nothing.

`SettingsScreen.tsx` has two `Switch` controls backed by local `useState` (:13-14) —
non-persisted, read by nothing — and four static rows: Language `English` (:43), Currency
`USD ($)` (:47), Theme `Light` (:51), Version `1.0.0` (:59).

---

## 9. Flows that do not exist

| Flow | Status |
|---|---|
| Session restore on relaunch | NOT IMPLEMENTED — nothing persisted |
| Password reset / forgot password | NOT IMPLEMENTED |
| Real account creation | NOT IMPLEMENTED — see §3 |
| Search | NOT IMPLEMENTED — no search input anywhere |
| Sort / filter UI | NOT IMPLEMENTED — `filterByCategory` exists in the store but is never called (`productStore.ts:33-45`) |
| Wishlist | NOT IMPLEMENTED — row present, no handler |
| Payment | NOT IMPLEMENTED — no payment step in checkout |
| Order creation | NOT IMPLEMENTED — see §5 |
| Order tracking / cancellation | NOT IMPLEMENTED |
| Push notifications | NOT IMPLEMENTED |
| Reviews / ratings | NOT IMPLEMENTED |
| Address book | NOT IMPLEMENTED — the checkout form is local state, discarded |

---

## 10. Error, loading and empty states

| State | Implemented where | Elsewhere |
|---|---|---|
| Loading | nowhere | all data is synchronous, so no spinner exists |
| Error | nowhere | no `try`/`catch`, no error boundary in the tree |
| Empty | `CartScreen` (empty-cart view), `ProductDetailsScreen:28-34` ("Product not found"), `ProfileScreen:16-22` ("No user data available"), `OrderDetailsScreen` (not-found branch) | `HomeScreen`, `ProductListScreen`, `CategoriesScreen`, `OrderHistoryScreen` render an empty `FlatList` with no message |

User feedback is `Alert.alert` in five places: `LoginScreen:22`, `SignupScreen:24`,
`SignupScreen:29`, `ProductDetailsScreen:43`, `CheckoutScreen` (validation + success).

---

## Related documents

- [navigation.md](navigation.md)
- [state-management.md](state-management.md)
- [data-flow.md](data-flow.md)
- [../features/](../features/)
