# UI Implementation Progress

Status: UI COMPLETE against mock data. Last updated 2026-10-31. Delivered on branch `feature/toj-customer-ui`. Pre-existing uncommitted changes to `ios/Podfile.lock` and `package-lock.json` were deliberately left out of the commits.

## Scope
Customer-facing men's clothing app, mock data only. No backend, no real OTP, no real payment. All simulated flows are labelled "Demo" in the UI. Currency `$` and the single pickup store ("TOJ Flagship Store", `src/data/stores.ts`) are placeholders, not real business details.

## Screen inventory (20)
Tabs (bottom): **Home**, **Shop**, **Bag**, **Account**.

| Area | Screens |
|---|---|
| Discovery | Home (hero, category rail, New & popular, On sale), Shop (All products, Sale, categories), ProductList (sort, size, in-stock, pickup filters), Search, Wishlist |
| Product | ProductDetails (image pager, colour/size, per-variant stock, per-product pickup note, wishlist heart, add to bag) |
| Bag | Bag (quantity stepper with stock cap, remove with confirmation, totals, free-delivery hint, empty state) |
| Auth (simulated) | Login (phone), Otp, CompleteProfile (new accounts) |
| Checkout | Checkout (delivery or pickup, address, payment, summary), OrderConfirmation |
| Orders | OrderHistory, OrderDetails (timeline, cancel with confirmation) |
| Account | Profile, PersonalInfo, Addresses (list, select, delete), AddressForm (add, edit), Settings (reset demo data), Support (static FAQ) |

## Navigation
Root native-stack (`src/navigation/RootNavigator.tsx`) containing the tab navigator (`MainTabs.tsx`). Param lists in `src/navigation/types.ts`. Guest-first (D-8): Checkout is gated; `utils/authFlow.ts` sends guests to Login with `redirect: 'Checkout'` and returns them after sign-in. No drawer.

## Mock data behaviour
- Demo OTP `123456`. Phone `9876543210` = existing demo account (seeded address and orders). Any other number = new empty account that must give a name.
- Stock is keyed `color|size`; cart line id `productId|color|size`; quantity clamped to stock ("Max available quantity").
- Pickup is per product and checkout is pickup-only (Q-2): product details disables "Add to bag" for items without pickup; the bag flags such lines and disables Checkout. If the server rejects an order for stale stock, price or availability, Checkout reloads the catalogue and server cart and asks the customer to review.
- Delivery fee 599, free at or over 10000 (minor units). Pickup is free.
- Placing an order creates a local order (numbering from `TOJ-1005`), clears the bag, shows "Demo order placed". Cancel allowed while placed/confirmed.
- No persistence. Settings > "Reset demo data" restores the seeded state in-session; logout also resets.

## Design decisions
- Premium minimal: monochrome tokens in `src/utils/theme.ts`, one muted accent, generous spacing, 44pt minimum touch targets, safe-area aware `Screen`/`StickyFooter`.
- No inline styles or nested components (ESLint clean). Wishlist heart is an overlay inside the details screen because header items render outside the screen's route context.
- Product images are remote Unsplash URLs (`SmartImage` shows a labelled placeholder on failure). Three broken URLs were replaced; all 15 products now return HTTP 200.
- Home hero and product-details image are 1:1 so key actions stay near the fold.
- Search, filters and sale rails are included although D-12 deferred them. Flagged for product review.
- Jest: `transformIgnorePatterns` allows React Navigation ESM. Reanimated import removed from `App.tsx` (unused); no runtime dependency on it remains in `src/`.

## Verification (actual)
- `npx tsc --noEmit`: 0 errors. `npx eslint .`: 0 errors, 0 warnings. `npx jest`: 2 suites, 5 tests pass.
- iOS (iPhone 17 Pro simulator, driven with idb taps): walked guest browse, categories, sort and filters, search (results and no-results), product details (size validation, unavailable size, stock cap), bag (quantity, remove, empty), login gate, phone validation, invalid OTP, new account (name validation) and existing account, checkout (delivery, address required error, add address, place order), confirmation, order history and details, cancel (Keep and Confirm), wishlist add and remove, Profile, Support, Settings.
- Defects found and fixed during testing: broken images, odd-item grid stretch, hidden switch tracks and labels, idle availability colour, Bag count not visible, new accounts seeing demo address and orders, small tap targets (checkout address link, wishlist heart), header wishlist crash (route context), Home hero too tall.

## Not verified / limitations
- VoiceOver and TalkBack were NOT run. Labels, roles, disabled/selected states were inspected via the iOS accessibility tree only.
- Dynamic Type at large sizes was not systematically reviewed.
- Android: partial flow only (see Android section).
- Typing in the simulator through idb occasionally drops characters; that is tooling, not app behaviour.
- Real backend, auth, payment, push notifications, persistence, reviews: NOT IMPLEMENTED.

## Android
Pixel_9_Pro emulator (API per AVD). `react-native run-android` built and installed the debug APK (BUILD SUCCESSFUL, 3m). No native config was changed.
Flow verified by adb taps and screenshots: Home, product details (size validation, size select, add to bag), Bag tab label with count, login gate, phone, OTP `123456`, new account name, redirect to Checkout, no seeded address for new accounts, store pickup selection (fee removed), place demo order, confirmation ("Order TOJ-1005 · Store pickup").
Not walked on Android: filters, search, wishlist, addresses CRUD, order cancel, Settings/Support. TalkBack not run.
Dev note: `run-android --no-packager` wrote `debug_http_host=10.0.2.2:8090` into the app's prefs when Metro was already on 8081, giving "Unable to load script". Fix by pointing the debug server host at `localhost:8081` (Dev menu > Settings) with `adb reverse tcp:8081 tcp:8081`.
