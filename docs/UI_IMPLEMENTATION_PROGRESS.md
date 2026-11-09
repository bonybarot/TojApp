# UI Implementation Progress

Status: UI COMPLETE against the local API with seeded dummy data. Last updated 2026-11-08 (branch `feature/api-integration`). First delivered 2026-10-31 on `feature/toj-customer-ui` against fixtures.

## Scope
Customer-facing men's clothing app. It calls the local `toj-backend` API ([ADR-0031](decisions/0031-app-api-integration.md)). No real OTP, no real payment; simulated flows are labelled "Demo" in the UI. Currency is INR (integer paise). The single pickup store comes from `GET /pickup-locations` (placeholder details).

## Screen inventory (19)
Tabs (bottom): **Home**, **Shop**, **Bag**, **Account**.

| Area | Screens |
|---|---|
| Discovery | Home (hero, category rail, New & popular, On sale), Shop (All products, Sale, categories), ProductList (sort, size, in-stock, pickup filters), Search, Wishlist |
| Product | ProductDetails (image pager, colour/size, per-variant stock, per-product pickup note, star summary, reviews, wishlist heart, add to bag) |
| Bag | Bag (quantity stepper with stock cap, remove with confirmation, sold-out lines and removal notice, totals, empty state) |
| Auth (demo OTP) | Login (phone), Otp (resend countdown), CompleteProfile (new accounts) |
| Checkout | Checkout (pickup location, payment, summary), OrderConfirmation (pickup address and hours) |
| Orders | OrderHistory (pages in older orders 50 at a time as you scroll), OrderDetails (timeline with step times, cancelled time and reason, payment status, pickup address and hours, cancel with confirmation, items open the product, pull to refresh), WriteReview |
| Account | Profile, PersonalInfo, Settings (reset demo data), Support (FAQ; store name, address and hours from the server) |

Pull to refresh: Home, Bag, Wishlist, My Orders.

Addresses and AddressForm were removed 2026-11-08: checkout is pickup-only (Q-2) and Profile is fixed by D-13, so nothing linked to them. The backend address API stays; bring the screens back from git when delivery is approved.

## Navigation
Root native-stack (`src/navigation/RootNavigator.tsx`) containing the tab navigator (`MainTabs.tsx`). Param lists in `src/navigation/types.ts`. Guest-first (D-8): Checkout is gated; `utils/authFlow.ts` sends guests to Login with `redirect: 'Checkout'` and returns them after sign-in. No drawer.

## Demo behaviour
- Demo OTP `123456`. Phone `9876543210` = seeded demo account (orders). Any other number = new empty account that must give a name.
- Stock is keyed `color|size`; cart line id `productId|color|size`; quantity clamped to stock ("Max available quantity").
- Pickup is per product and checkout is pickup-only (Q-2): product details disables "Add to bag" for items without pickup; the bag flags such lines and disables Checkout. If the server rejects an order for stale stock, price or availability, Checkout reloads the catalogue and server cart and asks the customer to review.
- Placing an order creates it on the local server (`TOJ-1005`…), the server empties the cart, the app shows "Demo order placed". Cancel allowed while placed/confirmed.
- Session tokens, guest bag and guest wishlist are kept in the Keychain/Keystore (ADR-0006). Settings > "Reset demo data" clears the bag and wishlist (also on the server when signed in); orders are kept.

## Design decisions
- Premium minimal: monochrome tokens in `src/utils/theme.ts`, one muted accent, generous spacing, 44pt minimum touch targets, safe-area aware `Screen`/`StickyFooter`.
- No inline styles or nested components (ESLint clean). Wishlist heart is an overlay inside the details screen because header items render outside the screen's route context.
- Product images are remote Unsplash URLs (`SmartImage` shows a labelled placeholder on failure).
- Home hero and product-details image are 1:1 so key actions stay near the fold.
- Search, filters and sale rails are included although D-12 deferred them. Flagged for product review.
- Jest: `transformIgnorePatterns` allows React Navigation ESM.

## Verification (actual, 2026-11-08)
- `npx tsc --noEmit`: 0 errors. `npm run lint`: 0 errors, 0 warnings. `npx jest`: 10 suites, 44 tests pass.
- iOS (iPhone 17 simulator): full journey walked 2026-10-31; reviews, large text and offline resume walked 2026-11-08.
- Android (Pixel_9_Pro emulator), 2026-11-08: Home, category list with sort (price high to low) and size XL filter (matches API stock), search (results and no results), wishlist remove (server row gone), checkout and place order (TOJ-1021), order details, cancel (server status CANCELLED), Help & Support, Settings, pull to refresh on Home and Bag, offline launch and resume.

## Not verified / limitations
- VoiceOver and TalkBack were NOT run. Labels and roles were inspected via the iOS accessibility tree and Android uiautomator only.
- Typing in the simulator through idb occasionally drops characters; that is tooling, not app behaviour.
- Payment, real SMS OTP, push notifications: NOT IMPLEMENTED.

## Android dev note
`run-android --no-packager` once wrote `debug_http_host=10.0.2.2:8090` into the app's prefs when Metro was already on 8081, giving "Unable to load script". Fix by pointing the debug server host at `localhost:8081` (Dev menu > Settings) with `adb reverse tcp:8081 tcp:8081`.
