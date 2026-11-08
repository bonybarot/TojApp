# 0031. App integration with the toj-backend API

Date: 2026-11-05
Status: Accepted (agent, Level 2 under AGENTS.md §1b; reversible). Implements [0008](0008-api-style.md), [0011](0011-money-inr-paise.md), [0026](0026-store-pickup.md) on the client

## Context
Backend tasks B1-B9 (`toj-backend` branch `feature/backend-core`) deliver catalogue, OTP auth, cart, wishlist, addresses, checkout and orders. The app rendered everything from fixtures. The owner asked for the app to work end to end against a local backend with dummy data; going live is a later decision.

## Decisions
1. **HTTP client: `fetch` plus ~100 lines** (`src/api/client.ts`). Timeout via `AbortController`, `ApiError(status, code, message)` from the `{error:{...}}` envelope, bearer header, single-flight refresh on 401, retry once. No axios / React Query: nothing here needs them (AGENTS.md §7a).
2. **Base URL in `src/config/env.ts`**: iOS simulator `http://localhost:3000/api/v1`, Android emulator `http://10.0.2.2:3000/api/v1`. No env-file library; a device build pointing elsewhere edits one line until hosting is decided.
3. **Tokens in memory only.** *Superseded 2026-11-08 by [0006](0006-secure-token-storage.md): tokens are kept in the Keychain / Keystore.* Session loss (refresh fails) clears the user and account data.
4. **Server is the source of truth when signed in**; guests keep cart and wishlist locally. At sign-in the guest cart and wishlist are merged into the server (`/me/cart/merge`, `/me/wishlist/merge`). Cart edits are optimistic, then replaced by the server's response.
5. **Catalogue loaded once** (`/products?limit=50`, `/categories`, `/pickup-locations`) and filtered/sorted on the device by the existing `utils/filter.ts`. Ceiling: 50 products (API max page). Move search/sort to the server's query params when the catalogue grows.
6. **Checkout is pickup-only** (Q-2): delivery option, delivery fee and address step removed from checkout; payment is `PAY_AT_STORE` or `CARD_SIMULATED`. One `Idempotency-Key` per checkout visit, `expectedTotal` sent so a price change is rejected.
7. **Money**: prices are paise; `formatPrice` shows `₹` with Indian digit grouping.

## Trade-offs accepted
- App types are hand-written to match `toj-backend/openapi.json` (no codegen dependency).
- Fixtures in `src/data/` stay for tests and as the pre-load default for categories and pickup location.

## Risks
- **Contract drift**: compare `src/types` with `openapi.json` on every API PR.
- **Offline**: no offline cache; catalogue shows an error state with retry.
