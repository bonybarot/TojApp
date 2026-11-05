# Autonomous work queue

Status: Working document for unattended agent runs
Started: 2026-11-05 01:40 IST
Owner instruction (2026-11-05, verbatim summary): push work to new branches, never to `main`; do not stop for human verification; make the app work end to end with a local DB and backend on dummy data; going live is a later decision; installing libraries and tools is allowed.

## Rules for every run

1. Lock: if `/Users/bonybarot/Desktop/projects/Test/.toj-agent.lock` was modified less than 45 minutes ago, another run is working: exit without changes. Otherwise `touch` it, and touch it again after every task.
2. Branches: TojApp `feature/api-integration`, toj-backend `feature/backend-core`. Never commit or push to `main`. Never force-push.
3. Take the first unchecked task below. Do it, then run the checks named in it. Commit with a conventional message, push the branch, tick the task, add a line to the log.
4. A task that needs an owner decision: record it under "Blocked: needs owner", tick it as skipped, move on. Never stop the run for a question.
5. Never: push to `main`, run `prisma migrate reset` or set `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`, commit `.env`, enter credentials, start payment gateway / real SMS / production hosting work.
6. Stack: backend at `../toj-backend` (`eval "$(fnm env)" && fnm use` for Node 24; `npm run db:up`). App at `TojApp` (Node via system, iOS simulator).

## Backend (`toj-backend`, branch `feature/backend-core`)

- [x] B1 Full Prisma schema, migration, constraint SQL, idempotent seed from `prisma/seed-data/` (copied fixtures, INR paise demo prices). Checks: `npm run db:deploy`, seed twice, lint, typecheck, test
- [x] B2 Common: error filter with `{error:{code,message,details,requestId}}`, request id, `@Public()`, pagination DTO, throttler
- [x] B3 Catalogue: `GET /categories`, `/products` (q, filters, sort, pagination), `/products/:id`, `/store`, `/pickup-locations`. Unit tests for query building, e2e for endpoints
- [x] B4 Auth: OTP request/verify (fixed/random), JWT access, refresh rotation with family revocation, logout, `GET/PATCH /me`, global deny-by-default guard. e2e
- [x] B5 Wishlist and addresses (+merge), ownership tests
- [x] B6 Cart (clamp, merge, warnings)
- [x] B7 Checkout validate, order create transaction + idempotency + stock guard, list, detail, cancel + restock. Concurrency e2e (no overselling)
- [x] B8 Admin login, admin orders transition, admin inventory list/adjust
- [x] B9 `openapi.json` export script + committed file; docs (`IMPLEMENTATION_PROGRESS.md`, `LOCAL_DEVELOPMENT.md`)

## App (`TojApp`, branch `feature/api-integration`)

- [x] A1 `src/config/env.ts` base URL (iOS `localhost`, Android `10.0.2.2`), `src/api/client.ts` (fetch, timeout, ApiError, bearer, single-flight refresh), API types
- [x] A2 Catalogue from API (categories, products, product detail), loading/error states; fixtures kept for tests
- [x] A3 Auth from API (OTP request/verify, needsProfile, logout), tokens in memory only
- [x] A4 Wishlist, addresses, cart against API when signed in; guest merge at login
- [x] A5 Checkout validate + place order + orders list/detail/cancel; pickup-only UI; ₹ formatting from paise; pickup statuses
- [x] A6 Run on iOS simulator against local backend, walk the demo journey, fix what breaks
- [x] A7 Docs: ADR for API integration choices, `current-state.md`, `AGENTS.md`, changelog

## Blocked: needs owner

(none yet)

## Log

- 2026-11-05 01:40 queue created; branches cut from `feature/toj-customer-ui` (TojApp) and `main` (toj-backend)
- 2026-11-05 B1-B6 schema, common, catalogue, auth, wishlist/addresses, cart (toj-backend `5d5348b`..`a9eb96f`)
- 2026-11-05 spec alignment of routes and shapes (`2e9b9ce`)
- 2026-11-05 B7 checkout + orders, no-oversell concurrency e2e (`987aa8f`)
- 2026-11-05 B8 admin auth, transitions, inventory (`b217837`)
- 2026-11-05 B9 openapi.json (32 paths), docs, decisions B-19..B-28 (`b3971b4`); lint/typecheck clean, unit 17, e2e 27
- 2026-11-05 A1-A5 API client, catalogue, auth, cart/wishlist/addresses, pickup-only checkout and orders against the local API; tsc/lint clean, jest 5
- 2026-11-05 A6 iOS build fixed for Xcode 26.4+/iOS 27 (fmt C++17, UIScene adoption, `bcd3b2f`); app launches and loads catalogue from the API. UI tap-through not done (simulator panel needs owner approval)
- 2026-11-05 A7 ADR-0031, current-state, AGENTS, changelog (`9a16b3c`); report in `overnight-report.md`
- 2026-11-05 05:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5; live API smoke pass (order 1006 placed and cancelled)
- 2026-11-05 06:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5
- 2026-11-05 06:58 UI journey walked on iOS simulator (TOJ-1007 placed and cancelled); copy fixes `577450f`; Android emulator build and launch OK
- 2026-11-05 08:13 re-verification run: no open tasks; backend lint/typecheck clean, unit 17, e2e 27; app tsc/lint clean, jest 5
- 2026-11-05 08:37 UI journey walked on Android emulator (TOJ-1008 placed and cancelled); no fixes needed
