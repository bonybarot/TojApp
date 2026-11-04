# 0020. Environment and configuration strategy

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
No environment strategy existed. The app must not hardcode an API URL.

## Problem
Define how the backend and app read configuration and which machine prerequisites are pinned.

## Requirements
docs/backend/LOCAL_DEVELOPMENT.md.

## Options considered
`@nestjs/config` with hand-written validation; dotenv + joi; per-platform URL constants in the app.

## Decision
Backend: `.env` (git-ignored) plus committed `.env.example` with placeholders; a single `validateEnv` function fails the boot with every problem listed; Node pinned by `backend/.nvmrc` (24) and `engines`; fnm is the version manager so the global Node is untouched. App: one `src/config/env.ts` exposing `API_BASE_URL` (no hardcoded URL), selected per platform; no config library.

## Why
Fail-fast validation catches unsafe settings (short JWT secret, fixed OTP in production) before the server accepts traffic.

## Trade-offs accepted
Hand-written validation must be kept in step with the env table.

## Rejected alternatives
joi/zod add a dependency for ~10 variables.

## Risks
A secret committed by mistake. Early warning: `.env` is ignored; `.env.example` holds only placeholders.

## Consequences
Docker publishes Postgres on 127.0.0.1 only; API binds 0.0.0.0 for emulator/device access.

## Marketplace impact
Safe.

## Migration considerations
Move to a secrets manager at production hosting.

## Verification
Unit tests in `src/config/env.spec.ts`; `git check-ignore backend/.env`.
