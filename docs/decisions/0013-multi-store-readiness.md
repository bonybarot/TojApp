# 0013. Multi-store readiness: `storeId` on catalogue and order rows

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
D-3: long-term multi-vendor marketplace; v1 is a single store.

## Problem
Keep a later second store a data change, not a schema rewrite, without building a marketplace.

## Requirements
D-2, D-3, D-5.

## Options considered
`storeId` on Category, Product, PickupLocation, Order; no store column; full seller model.

## Decision
`storeId` foreign key on Category, Product, PickupLocation and Order, with one seeded Store. Inventory, variants and order items inherit it via their parent. No sellers, commissions, payouts or store-scoped admin roles.

## Why
One FK per table now versus a painful backfill later.

## Trade-offs accepted
An extra where-clause in services (from a store-context constant).

## Rejected alternatives
A full seller model is speculative (D-5).

## Risks
Leaking cross-store data once a second store exists. Early warning: authorization tests per store.

## Consequences
Services read the default store via StoresService.

## Marketplace impact
Compatible.

## Migration considerations
Second store: data insert plus authorization rules.

## Verification
Schema review; migration contains the columns.
