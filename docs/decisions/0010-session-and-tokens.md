# 0010. Session and token lifecycle

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
Customers need to stay signed in without storing passwords; the app has no token storage.

## Problem
Choose token types, lifetimes, rotation and revocation.

## Requirements
D-9; docs/backend/AUTHENTICATION.md §4.

## Options considered
JWT access + opaque rotating refresh; server sessions; long-lived JWT only.

## Decision
15-minute HS256 JWT access token with `aud` (customer/admin); 30-day opaque refresh token stored hashed with a family id, rotated on every refresh, family revoked on reuse. Demo keeps tokens in memory only; Keychain/Keystore is deferred until persistence is approved.

## Why
Short-lived stateless access tokens are cheap to verify; hashed rotating refresh tokens limit theft impact.

## Trade-offs accepted
A cold start signs the user out in the demo.

## Rejected alternatives
Long-lived JWT cannot be revoked; server-only sessions need a DB hit per request.

## Risks
Refresh-token theft. Early warning: reuse detection revokes the family.

## Consequences
Secure storage dependency is added later with its own ADR (ADR-0006).

## Marketplace impact
Safe.

## Migration considerations
Move to asymmetric keys only if another service must verify tokens.

## Verification
Tests in the auth milestone: rotation, reuse, audience separation.
