# 0008. API style: REST, `/api/v1`, OpenAPI

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
The app needs a client API; ADR-0008 was contingent on the backend platform.

## Problem
Choose an API style with consistent errors and a self-documenting contract.

## Requirements
Every screen action is resource-shaped; docs/backend/API_SPECIFICATION.md.

## Options considered
REST + OpenAPI; GraphQL; tRPC.

## Decision
REST under `/api/v1`, OpenAPI via `@nestjs/swagger` at `/api/docs` (non-production), one error shape `{ error: { code, message, details?, requestId } }`, page/limit pagination, `Idempotency-Key` on order creation.

## Why
REST is the simplest fit for a solo developer and a React Native client; no schema tooling is needed.

## Trade-offs accepted
No generated client types in v1; DTO types are mirrored by hand.

## Rejected alternatives
GraphQL and tRPC add tooling and a runtime for no present need.

## Risks
Hand-mirrored types drift. Early warning: a client/server shape mismatch in integration tests.

## Consequences
Additive changes only inside v1.

## Marketplace impact
Safe.

## Migration considerations
Introduce `/api/v2` for breaking changes.

## Verification
Swagger JSON lists the routes; the global prefix is set in `src/setup.ts`.
