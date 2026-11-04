# 0007. Backend platform: NestJS, Prisma, PostgreSQL

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31). Repository location amended by [0030](0030-separate-backend-repository.md)

## Context
The app has no backend (AGENTS.md §1, D-4). O-1/O-2 were answered by the owner approving the backend blueprint on 2026-10-31 (docs/backend/).

## Problem
Pick a platform one developer can build in about a month, run locally, and later host, that fits transactional stock and order rules.

## Requirements
D-4, D-15, D-16; blueprint ARCHITECTURE.md §1.

## Options considered
NestJS + Prisma + PostgreSQL; Fastify + Kysely/Drizzle; Medusa; Supabase; NestJS 11 on Node 22 (documented fallback).

## Decision
Node.js 24 LTS, NestJS 12, Prisma 7 (pinned 7.10.1, not `latest`, which is the 8 RC) with `@prisma/adapter-pg`, PostgreSQL 17 in Docker Compose, modular monolith under `backend/`. Verified on 2026-10-31: Nest 12.3.2 builds and runs on Node 24.22.2, vitest e2e passes, Prisma 7.10.1 migrates and queries Postgres 17.11, Swagger 12.0.5 serves `/api/docs`.

## Why
Relational constraints and transactions protect stock and orders; Nest module/guard/pipe structure maps to the plan; the Day-1 spike found no compatibility problem, so the NestJS 11 fallback is not needed.

## Trade-offs accepted
More framework ceremony than Express/Fastify; Nest 12 is ESM-only and Prisma 7 needs an adapter and a generated client; Prisma `latest` must never be installed unpinned.

## Rejected alternatives
Fastify + Kysely: lighter but hand-built structure. Medusa: custom work for phone OTP and per-product pickup, constrains marketplace design. Supabase: order/stock rules would live in SQL functions.

## Risks
Toolchain churn (Nest 12, Prisma 7 are new majors). Early warning: a dependency bump breaks `npm run build` or e2e; versions are pinned.

## Consequences
A `backend/` project with its own package.json, lockfile, .nvmrc; root tsc/jest/eslint/metro/.gitignore exclusions; Docker is a local-dev prerequisite.

## Marketplace impact
Compatible: `storeId` is present from day one (ADR-0013).

## Migration considerations
Replacing the ORM or framework is a rewrite of services only; the schema, API and tests are portable.

## Verification
`backend/package.json` pins versions; `npm run build && npm test && npm run test:e2e` pass; `GET /api/v1/health/ready` returns db up.
