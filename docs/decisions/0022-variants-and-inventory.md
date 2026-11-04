# 0022. Product variants and the inventory model

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
Stock in the mock is a client-side `color|size` map. A clothing order is unfulfillable without per-variant stock.

## Problem
Model colour/size variants with a SKU and stock each, and prevent overselling under concurrency.

## Requirements
docs/backend/DATABASE_SCHEMA.md; ARCHITECTURE.md §5.

## Options considered
Conditional atomic UPDATE; SELECT FOR UPDATE; optimistic version column; stock reservation.

## Decision
ProductVariant per colour+size with a unique SKU; Inventory row per variant (`quantity >= 0` CHECK); InventoryMovement as the audit trail. Orders decrement with `UPDATE ... SET quantity = quantity - n WHERE quantity >= n` inside one transaction, lines sorted by variant id; cancel restocks with a status-guarded UPDATE. The cart does not reserve stock.

## Why
The conditional UPDATE is atomic under Postgres READ COMMITTED and needs no explicit locks.

## Trade-offs accepted
No reservation: a customer can lose the last unit between bag and checkout (handled by `INSUFFICIENT_STOCK`).

## Rejected alternatives
SELECT FOR UPDATE and version columns add retries or round trips for no benefit here.

## Risks
Regression in the guard. Early warning: the CHECK constraint and the concurrency test.

## Consequences
Single stock pool per variant; no per-location stock in v1 (assumption A-6).

## Marketplace impact
Safe.

## Migration considerations
Per-location stock later adds a location column to Inventory.

## Verification
Concurrency test: N buyers for stock S yields exactly S orders.
