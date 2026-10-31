# Navigation

> **Partially superseded (2026-10-31).** Written for the pre-UI-rewrite code (drawer, `.js` twins, hardcoded electronics data). The app now has bottom tabs + guest-first stack, typed clothing fixtures, 6 Zustand stores, and clean tsc/ESLint/Jest. Current truth: [`AGENTS.md`](../../AGENTS.md) §1, §3 and [`UI_IMPLEMENTATION_PROGRESS.md`](../UI_IMPLEMENTATION_PROGRESS.md). Screen, navigation, state, data-flow and testing sections below are out of date.

Status: Current State
Last Verified: 2026-09-03
Source: `src/navigation/*`, `App.tsx`

---

## Library

React Navigation **v7**, four packages:

| Package | Version | Used in |
|---|---|---|
| `@react-navigation/native` | ^7.1.19 | `App.tsx:2`, all navigators, 9 screens |
| `@react-navigation/native-stack` | ^7.6.2 | `AuthStack`, `HomeStack`, `CartStack`, `OrdersStack` |
| `@react-navigation/bottom-tabs` | ^7.8.4 | `MainTabs.tsx:14` |
| `@react-navigation/drawer` | ^7.1.3 | `DrawerNavigator.tsx:27` |

Container: `App.tsx:15` — `<NavigationContainer ref={navigationRef}>`.

---

## Navigation map

```text
NavigationContainer                        App.tsx:15  (ref = navigationRef, never used)
└── RootNavigator                          src/navigation/RootNavigator.tsx
    │   conditional on useUserStore(state => state.isLoggedIn)
    │
    ├── isLoggedIn === false
    │   └── AuthStack                      native-stack · headerShown: true
    │       ├── Login                      screens/auth/LoginScreen.tsx
    │       └── Signup                     screens/auth/SignupScreen.tsx
    │
    └── isLoggedIn === true
        └── DrawerNavigator                drawer · headerShown: true · custom content
            │
            ├── MainTabs                   bottom-tabs · headerShown: false
            │   │                          drawer label "Home", title ''
            │   ├── HomeStack              native-stack · headerShown: false
            │   │   ├── Home               screens/Home/HomeScreen.tsx
            │   │   ├── ProductList        screens/Home/ProductListScreen.tsx
            │   │   └── ProductDetails     screens/Home/ProductDetailsScreen.tsx
            │   ├── CartStack              native-stack · headerShown: false
            │   │   ├── Cart               screens/Cart/CartScreen.tsx
            │   │   └── Checkout           screens/Cart/CheckoutScreen.tsx
            │   └── Profile                screens/User/ProfileScreen.tsx   ◄ duplicate
            │
            ├── Categories                 screens/Categories/CategoriesScreen.tsx
            │
            ├── OrdersStack                native-stack · headerShown: false
            │   │                          drawer title "Orders"
            │   ├── OrderHistory           screens/Orders/OrderHistoryScreen.tsx
            │   └── OrderDetails           screens/Orders/OrderDetailsScreen.tsx
            │
            ├── Profile                    screens/User/ProfileScreen.tsx   ◄ duplicate
            └── Settings                   screens/User/SettingsScreen.tsx

NOT REGISTERED IN ANY NAVIGATOR:
    screens/History/HistoryScreen.js
    screens/History/index.tsx
    screens/auth/Login.tsx
```

---

## Route table

| Route name | Navigator | File | Params | Typed? |
|---|---|---|---|---|
| `Login` | AuthStack | `AuthStack.tsx:29` | `undefined` | ParamList declared, **not attached** |
| `Signup` | AuthStack | `AuthStack.tsx:30` | `undefined` | ParamList declared, **not attached** |
| `MainTabs` | Drawer | `DrawerNavigator.tsx:66` | `undefined` | **Not attached** |
| `Categories` | Drawer | `DrawerNavigator.tsx:71` | `undefined` | **Not attached** |
| `OrdersStack` | Drawer | `DrawerNavigator.tsx:76` | `undefined` | **Not attached** |
| `Profile` | Drawer | `DrawerNavigator.tsx:81` | `undefined` | **Not attached** |
| `Settings` | Drawer | `DrawerNavigator.tsx:86` | `undefined` | **Not attached** |
| `HomeStack` | MainTabs | `MainTabs.tsx:29` | `undefined` | Typed ✓ |
| `CartStack` | MainTabs | `MainTabs.tsx:36` | `undefined` | Typed ✓ |
| `Profile` | MainTabs | `MainTabs.tsx:43` | `undefined` | Typed ✓ |
| `Home` | HomeStack | `HomeStack.tsx:22` | `undefined` | Typed ✓ |
| `ProductList` | HomeStack | `HomeStack.tsx:23` | `{ category?: string }` | Typed ✓ |
| `ProductDetails` | HomeStack | `HomeStack.tsx:24` | `{ productId: string }` | Typed ✓ |
| `Cart` | CartStack | `CartStack.tsx:20` | `undefined` | Typed ✓ |
| `Checkout` | CartStack | `CartStack.tsx:21` | `undefined` | Typed ✓ |
| `OrderHistory` | OrdersStack | `OrdersStack.tsx:20` | `undefined` | Typed ✓ |
| `OrderDetails` | OrdersStack | `OrdersStack.tsx:21` | `{ orderId: string }` | Typed ✓ |

**17 registrations, 16 distinct route names, 12 distinct destination screens**
(`Profile` is registered twice; the four `*Stack` entries are containers).

---

## Declared ParamList types

| Type | File | Attached to its navigator? |
|---|---|---|
| `AuthStackParamList` | `AuthStack.tsx:7` | **No** — `createNativeStackNavigator()` at line 12 |
| `DrawerParamList` | `DrawerNavigator.tsx:19` | **No** — `createDrawerNavigator()` at line 27 |
| `MainTabsParamList` | `MainTabs.tsx:8` | Yes — `createBottomTabNavigator<MainTabsParamList>()` at line 14 |
| `HomeStackParamList` | `HomeStack.tsx:7` | Yes — line 13 |
| `CartStackParamList` | `CartStack.tsx:6` | Yes — line 11 |
| `OrdersStackParamList` | `OrdersStack.tsx:6` | Yes — line 11 |

There is **no** `RootParamList` and **no** global type registration
(`declare global { namespace ReactNavigation { ... } }`), so a bare `useNavigation()`
returns an untyped navigator.

---

## Authentication gate

`src/navigation/RootNavigator.tsx:15`:

```tsx
return isLoggedIn ? <DrawerNavigator /> : <AuthStack />;
```

- The unauthenticated user **cannot reach** the drawer tree, because it is not mounted.
  This is the React Navigation-recommended pattern and it is correctly applied.
- There is no per-route guard, and none is required at this shape.
- **Logout** (`DrawerNavigator.tsx:33-36`) calls `logout()` and relies on the root
  re-render to swap trees. The comment at line 35 documents this:
  `// Navigation will be handled by RootNavigator`.

Status: **IMPLEMENTED** (against mock authentication — see
[../features/authentication.md](../features/authentication.md)).

---

## Header configuration

| Navigator | `headerShown` | Evidence |
|---|---|---|
| AuthStack | `true` | `AuthStack.tsx:18` |
| DrawerNavigator | `true` | `DrawerNavigator.tsx:58` |
| MainTabs | `false` | `MainTabs.tsx:20` |
| HomeStack | `false` | `HomeStack.tsx:19` |
| CartStack | `false` | `CartStack.tsx:17` |
| OrdersStack | `false` | `OrdersStack.tsx:17` |

**Consequence:** deep screens such as `ProductDetails`, `Checkout` and `OrderDetails`
have no header of their own. They inherit the drawer's header, whose title for `MainTabs`
is set to the empty string (`DrawerNavigator.tsx:69` — `options={{ title: '' }}`). Detail
screens are therefore **unlabelled and have no back affordance in the header**; the
in-screen back handling is whatever each screen provides.

---

## Cross-navigator navigation

Only one screen navigates across navigator boundaries.

`src/screens/Categories/CategoriesScreen.tsx:18-24`:

```tsx
navigation.getParent()?.navigate('MainTabs', {
  screen: 'HomeStack',
  params: {
    screen: 'ProductList',
    params: { category },
  },
} as never);
```

The comment at line 17 explains the intent: navigate to `MainTabs` first, then to
`HomeStack`'s `ProductList`.

**KNOWN ISSUE:** this hardcodes the exact three-level nesting of the navigator tree and
casts the payload to `never`, so the compiler verifies none of it. Renaming or reordering
`MainTabs`, `HomeStack` or `ProductList` breaks category navigation silently at runtime.

---

## `as never` casts

| Location | Call |
|---|---|
| `src/screens/auth/LoginScreen.tsx:61` | `navigation.navigate('Signup' as never)` |
| `src/screens/auth/SignupScreen.tsx:86` | `navigation.navigate('Login' as never)` |
| `src/screens/Categories/CategoriesScreen.tsx:24` | the nested payload above |

The first two exist **because** `AuthStackParamList` was never attached to the navigator
(see the table above) — the routes they name are already declared in that type.

---

## Navigation typing at screen level

| Screen | Typing |
|---|---|
| `HomeScreen.tsx:13` | `useNavigation<HomeScreenNavigationProp>()` — correct |
| `CartScreen.tsx:19` | `useNavigation<CartScreenNavigationProp>()` — correct |
| `OrderHistoryScreen.tsx:19` | `useNavigation<OrderHistoryScreenNavigationProp>()` — correct |
| `CategoriesScreen.tsx:14` | `useNavigation<CategoriesScreenNavigationProp>()` — correct, but the call itself is cast at line 24 |
| `ProductListScreen.tsx:16` | `useNavigation<NativeStackNavigationProp<any>>()` — **`any`** |

Route props are declared **anonymously** rather than referencing the ParamList that
already describes them:

| Screen | Declaration |
|---|---|
| `ProductListScreen.tsx:9` | `RouteProp<{ params: { category?: string } }, 'params'>` |
| `ProductDetailsScreen.tsx:16` | `RouteProp<{ params: { productId: string } }, 'params'>` |
| `OrderDetailsScreen.tsx:7` | `RouteProp<{ params: { orderId: string } }, 'params'>` |

Three parallel definitions that can drift from the routes that feed them.

---

## `navigationRef`

`src/navigation/StackKeys.tsx:13`:

```ts
export const navigationRef = createNavigationContainerRef();
```

Wired into the container at `App.tsx:15`. **Never called** — no `navigationRef.navigate`,
`.goBack`, `.isReady` or `.getCurrentRoute` anywhere in `src/`.

The same file declares two enums, `RouteNavigator` (lines 3-7) and `Route` (lines 8-10),
which **nothing imports**.

---

## Deep linking

**NOT IMPLEMENTED.**

- No `linking` prop on `NavigationContainer` (`App.tsx:15`).
- No URL scheme in `ios/TojApp/Info.plist` (no `CFBundleURLTypes` key).
- No intent filter for `VIEW`/`BROWSABLE` in `android/app/src/main/AndroidManifest.xml` —
  only the `MAIN`/`LAUNCHER` filter.
- No universal links / app links configuration.

## Navigation state persistence

**NOT IMPLEMENTED.** No `onStateChange` / `initialState` handling on the container.

---

## Known issues

| # | Issue | Location |
|---|---|---|
| 1 | `Profile` registered in two navigators — two instances, two histories, ambiguous `navigate('Profile')` | `MainTabs.tsx:43`, `DrawerNavigator.tsx:81` |
| 2 | `AuthStackParamList` and `DrawerParamList` declared but not attached | `AuthStack.tsx:12`, `DrawerNavigator.tsx:27` |
| 3 | No `RootParamList` / global type registration | `src/navigation/` |
| 4 | Three `as never` casts hide unverified route names and params | see table above |
| 5 | Nested navigator structure hardcoded in a screen | `CategoriesScreen.tsx:18` |
| 6 | Detail screens have no header title or back affordance | header table above |
| 7 | `drawerContent={props => <CustomDrawerContent {...props} />}` remounts the drawer subtree every render | `DrawerNavigator.tsx:56` |
| 8 | `navigationRef` wired but unused; two dead enums | `StackKeys.tsx` |
| 9 | Three screens exist but are registered in no navigator | `History/HistoryScreen.js`, `History/index.tsx`, `auth/Login.tsx` |

Full register: [known-issues.md](known-issues.md)

---

## Related documents

- [application-flow.md](application-flow.md)
- [architecture.md](architecture.md)
- [../features/authentication.md](../features/authentication.md)
