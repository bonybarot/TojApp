# Current State

Status: Current State (target branch `feature/toj-customer-ui`)
Last Verified: 2026-11-05
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
| Product | Men's clothing customer app, single store, UI prototype (see [product-vision](requirements/product-vision.md)) |
| Platform | React Native 0.82.1, React 19.1.1, iOS + Android |
| Language | TypeScript 5.8 (`strict`); all source is `.ts`/`.tsx` |
| Navigation | React Navigation v7: root native-stack + bottom tabs (Home, Shop, Bag, Account). No drawer |
| State | Zustand 4.5: cart, user, wishlist, address, order, product. In-memory only |
| Styling | `StyleSheet.create` + tokens in `src/utils/theme.ts`; no inline styles (ESLint) |
| Data | Typed fixtures in `src/data/` (15 products, categories, orders, store). Remote Unsplash images |
| Money | Integer minor units; `$` placeholder; formatted by `utils/format.ts` |
| Backend | Separate repository `toj-backend` (`../toj-backend`, [ADR-0030](decisions/0030-separate-backend-repository.md)): Day-1 foundation (NestJS 12, Prisma 7, Postgres 17, Node 24). Health endpoints and a spike `Store` table only. The app does not call it. Progress: `toj-backend/docs/IMPLEMENTATION_PROGRESS.md` |
| Real OTP, payment, persistence, push, reviews | NOT IMPLEMENTED. Simulated and labelled "Demo" in the UI |
| Quality gates | `npx tsc --noEmit` 0 errors; `npm run lint` 0 errors/warnings; `npm test` 2 suites, 5 tests pass |

## Source layout

```text
App.tsx                      providers + root navigator
src/navigation/              RootNavigator, MainTabs, typed param lists (types.ts)
src/screens/                 Home, Shop, Cart, Auth, Checkout, Orders, Profile, Account
src/components/              shared UI (Button, Screen, ProductCard, FilterSheet, ...)
src/store/                   Zustand stores + resetDemo
src/data/                    fixtures and demo constants (stores.ts)
src/utils/                   theme, format, cart, filter, catalogue, orderStatus, authFlow
src/types/                   domain types
__tests__/                   App render test, business-logic tests
```

## Behaviour that is easy to get wrong

- Guest browsing is allowed; checkout requires sign-in (D-8). `utils/authFlow.ts` redirects to
  Login and back.
- Demo OTP is `123456`. Phone `9876543210` is the seeded account; any other number creates a new
  empty account.
- Stock is per `color|size`; cart line id is `productId|color|size`; quantity is clamped to stock.
- Pickup is per product (D-10); checkout blocks pickup if any line does not support it.
- Delivery fee 599, free at 10000 (minor units). Orders are local state only; nothing is charged.
- Nothing persists across cold starts.

## Known issues and gaps

- Android `release` build is signed with the committed debug keystore (`android/app/build.gradle`).
- `nativewind` and `@react-navigation/drawer` are installed but unused. Whether to remove them is
  UNKNOWN / undecided.
- Search, filters, sort and sale rails exist although D-12 deferred them; flagged for product review.
- VoiceOver/TalkBack not run; Dynamic Type not systematically reviewed; Android walkthrough partial.
- All planning documents (requirements, architecture, implementation) are plans, not descriptions
  of built code. Backend/auth/payment phases are gated on ADRs that do not exist yet.
