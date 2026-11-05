# 0009. Authentication model: mobile number + OTP

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
D-9 fixed the credential type: mobile + OTP. The old email/password screens do not match.

## Problem
Define accounts, the OTP flow, customer vs admin separation, and a safe development OTP without a SMS provider.

## Requirements
D-8 (guest browsing, account before checkout), D-9; docs/backend/AUTHENTICATION.md.

## Options considered
Build OTP in-house with a simulated sender; buy an auth service; password login.

## Decision
Build in-house. Customers sign in by phone OTP; admins are a separate table with email + password (scrypt). Development uses a simulated OTP (`OTP_MODE=fixed` with `DEV_OTP_CODE`, or `random` printed to the API console); `fixed` with `NODE_ENV=production` refuses to boot. The development OTP is not secure and exists only for the local demo.

## Why
No external cost or dependency now; the `OtpSender` seam lets a real provider replace the console sender later.

## Trade-offs accepted
Real Indian SMS needs DLT registration and provider onboarding later (assumption A-9, to verify); until then anyone knowing the dev code can sign in as any number locally.

## Rejected alternatives
Auth service: recurring cost and lock-in before the product exists. Password login: contradicts D-9.

## Risks
Dev OTP leaking into a shared environment. Early warning: boot-time refusal in production mode.

## Consequences
Real OTP provider and OTP policy remain ADR-0025 (OPEN, blocked on O-7).

## Marketplace impact
Compatible.

## Migration considerations
Add provider sender and `OTP_MODE=provider`; delete `fixed` from production builds.

## Verification
Config validation unit test covers the production refusal; auth e2e tests land with the auth milestone.
