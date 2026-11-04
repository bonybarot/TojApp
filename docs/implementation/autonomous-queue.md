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

- [ ] B1 Full Prisma schema, migration, constraint SQL, idempotent seed from `prisma/seed-data/` (copied fixtures, INR paise demo prices). Checks: `npm run db:deploy`, seed twice, lint, typecheck, test
- [ ] B2 Common: error filter with `{error:{code,message,details,requestId}}`, request id, `@Public()`, pagination DTO, throttler
- [ ] B3 Catalogue: `GET /categories`, `/products` (q, filters, sort, pagination), `/products/:id`, `/store`, `/pickup-locations`. Unit tests for query building, e2e for endpoints
- [ ] B4 Auth: OTP request/verify (fixed/random), JWT access, refresh rotation with family revocation, logout, `GET/PATCH /me`, global deny-by-default guard. e2e
- [ ] B5 Wishlist and addresses (+merge), ownership tests
- [ ] B6 Cart (clamp, merge, warnings)
- [ ] B7 Checkout validate, order create transaction + idempotency + stock guard, list, detail, cancel + restock. Concurrency e2e (no overselling)
- [ ] B8 Admin login, admin orders transition, admin inventory list/adjust
- [ ] B9 `openapi.json` export script + committed file; docs (`IMPLEMENTATION_PROGRESS.md`, `LOCAL_DEVELOPMENT.md`)

## App (`TojApp`, branch `feature/api-integration`)

- [ ] A1 `src/config/env.ts` base URL (iOS `localhost`, Android `10.0.2.2`), `src/api/client.ts` (fetch, timeout, ApiError, bearer, single-flight refresh), API types
- [ ] A2 Catalogue from API (categories, products, product detail), loading/error states; fixtures kept for tests
- [ ] A3 Auth from API (OTP request/verify, needsProfile, logout), tokens in memory only
- [ ] A4 Wishlist, addresses, cart against API when signed in; guest merge at login
- [ ] A5 Checkout validate + place order + orders list/detail/cancel; pickup-only UI; ₹ formatting from paise; pickup statuses
- [ ] A6 Run on iOS simulator against local backend, walk the demo journey, fix what breaks
- [ ] A7 Docs: ADR for API integration choices, `current-state.md`, `AGENTS.md`, changelog

## Blocked: needs owner

(none yet)

## Log

- 2026-11-05 01:40 queue created; branches cut from `feature/toj-customer-ui` (TojApp) and `main` (toj-backend)
