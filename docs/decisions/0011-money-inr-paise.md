# 0011. Money as integer paise, currency INR

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
The mock stores integer cents with a `$` placeholder (src/utils/format.ts). The owner approved INR on 2026-10-31.

## Problem
Define currency and storage so floating-point and unit confusion cannot occur.

## Requirements
D-7 (one city, real commercial product); docs/backend/DATABASE_SCHEMA.md.

## Options considered
Integer paise; decimal columns; floats.

## Decision
All money is an `Int` number of paise with currency INR. Existing dollar/cents placeholder values are NOT mechanically converted; seed prices are clearly labelled demo seed data and are replaced by real prices later. Display formatting lives in `format.ts` and changes in the integration milestone.

## Why
Integers make arithmetic exact; paise matches the existing integer-minor-unit rule so only units and labels change.

## Trade-offs accepted
`Int` is 32-bit: the maximum is about ₹21.4 million per value, enough for any single order here.

## Rejected alternatives
Decimal/float columns invite rounding errors.

## Risks
Seed prices mistaken for real prices. Early warning: seed file header and demo labels.

## Consequences
Frontend formatting and demo copy change from `$` to ₹ at integration time.

## Marketplace impact
Safe.

## Migration considerations
Widen to `BigInt` only if a value could exceed the 32-bit range.

## Verification
Schema uses `Int` for every money column; domain functions have unit tests.
