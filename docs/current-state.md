# Current State

Status: Current State (branch `feature/api-integration`)
Last Verified: 2026-11-08
Source: working tree; code is the final authority

This is the single, accurate description of what TojApp is today. It replaces the former
`current-state/` page set, which described the pre-UI baseline (commit `66044c5`) and is kept
as history in [archive/pre-ui-baseline/](archive/pre-ui-baseline/README.md).

The customer UI described here is delivered in the commit that follows the documentation
baseline commit. Screen-by-screen detail and verification results live in
[UI_IMPLEMENTATION_PROGRESS.md](UI_IMPLEMENTATION_PROGRESS.md) (added with the UI commit).

## Summary

| Aspect | Reality |
|---|---|
| Product | Men's clothing customer app, single store, running against the local API with seeded dummy data (see [product-vision](requirements/product-vision.md)) |
| Platform | React Native 0.82.1, React 19.1.1, iOS + Android |
| Language | TypeScript 5.8 (`strict`); all source is `.ts`/`.tsx` |
| Navigation | React Navigation v7: root native-stack + bottom tabs (Home, Shop, Bag, Account). No drawer |
| State | Zustand 4.5: cart, user, wishlist, order, product. Session tokens in Keychain/Keystore (ADR-0006); server is source of truth when signed in |
| Styling | `StyleSheet.create` + tokens in `src/utils/theme.ts`; no inline styles (ESLint) |
| Data | Local `toj-backend` API (`src/api/client.ts`, base URL `src/config/env.ts`) per [ADR-0031](decisions/0031-app-api-integration.md). Fixtures in `src/data/` remain for tests and offline category fallback |
| Money | Integer paise, INR (`₹`, Indian grouping) via `utils/format.ts` |
| Backend | Separate repository `toj-backend` (`../toj-backend`, [ADR-0030](decisions/0030-separate-backend-repository.md)): Day-1 foundation (NestJS 12, Prisma 7, Postgres 17, Node 24). Catalogue, OTP auth, cart, wishlist, addresses, pickup checkout, orders, reviews, admin (branch `feature/backend-core`). The app calls it. Progress: `toj-backend/docs/IMPLEMENTATION_PROGRESS.md` |
| Real SMS OTP, payment, push | NOT IMPLEMENTED. OTP is a fixed demo code on the server; payment is simulated |
| Quality gates | `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors/warnings; `npm test` 10 suites, 40 tests pass |

## Source layout

```text
App.tsx                      providers + root navigator
src/navigation/              RootNavigator, MainTabs, typed param lists (types.ts)
src/screens/                 Home, Shop, Cart, Auth, Checkout, Orders, Profile, Account
src/components/              shared UI (Button, Screen, ProductCard, FilterSheet, ...)
src/api/, src/config/         fetch client, base URL
src/store/                   Zustand stores (call the API) + resetDemo
src/data/                    fixtures and demo constants (stores.ts)
src/utils/                   theme, format, cart, filter, catalogue, orderStatus, authFlow
src/types/                   domain types
__tests__/                   App render test, business-logic tests
```

## Behaviour that is easy to get wrong

- Guest browsing is allowed; checkout requires sign-in (D-8). `utils/authFlow.ts` redirects to
  Login and back.
- Demo OTP is `123456` (server `OTP_MODE=fixed`). Phone `9876543210` is the seeded account; any
  other number asks for a name and creates an account on the server.
- Stock is per `color|size`; cart line id is `productId|color|size`; quantity is clamped to stock.
- Pickup is per product (D-10). Checkout is pickup-only (Q-2) and blocks if any line does not
  support pickup. No delivery fee. Orders are stored by the server; nothing is charged.
- The backend must be running (`../toj-backend`, `npm run start:dev`); otherwise the catalogue
  shows an error state.
- Tokens are in the Keychain/Keystore: a cold start keeps the session; logout wipes it. Guest bag and wishlist are kept on the device and merge at sign-in.
- Launched while the API is down: the app stays guest and keeps the saved session; it resumes once the catalogue loads again (Try again or foreground).

## Known issues and gaps

- Android `release` uses the upload key when `TOJ_UPLOAD_*` gradle properties are set, else the debug keystore; the real key is not generated.
- Unused packages (nativewind, drawer, gesture-handler, reanimated, worklets) removed 2026-11-08 ([ADR-0032](decisions/0032-remove-unused-app-code.md)).
- Search, filters, sort and sale rails exist although D-12 deferred them; flagged for product review.
- VoiceOver/TalkBack not run. Large text checked (iOS AX5, Android 1.3) on main screens 2026-11-08.
- A revoked session stays usable until its access token expires (JWT guard does not check the session table).
- Planning documents (requirements, architecture, implementation) are plans, not descriptions
  of built code. Payment, real SMS OTP, seller/admin products and hosting are not approved.
