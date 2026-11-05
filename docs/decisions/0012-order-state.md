# 0012. Order state and cancellation rules

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
The mock status set is PLACED, CONFIRMED, PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED, CANCELLED (src/utils/orderStatus.ts). The owner approved pickup-only checkout for the demo and cancellation rules on 2026-10-31.

## Problem
Define the order lifecycle, who can cancel and when, with CANCELLED terminal.

## Requirements
D-10, D-11; docs/backend/ARCHITECTURE.md §6.

## Options considered
Single status field; separate payment and fulfilment status.

## Decision
Status enum adds READY_FOR_PICKUP and COLLECTED. Demo pickup path: PLACED, CONFIRMED, PACKED, READY_FOR_PICKUP, COLLECTED. SHIPPED, OUT_FOR_DELIVERY, DELIVERED stay in the enum for the deferred delivery path but are unreachable while checkout is pickup-only. Customers (and admin) may cancel only from PLACED or CONFIRMED. After PACKED (preparation begun), or after completion, cancellation is refused with `ORDER_NOT_CANCELLABLE`. CANCELLED is terminal. Cancellation restocks inside one transaction. No refund integration: payments are simulated; a simulated card payment is marked REFUNDED on cancel. Payment status is a separate field.

## Why
Preserves the demo behaviour and the mock status names; status-guarded UPDATE prevents double restock.

## Trade-offs accepted
Delivery statuses exist but are unused until delivery is approved.

## Rejected alternatives
A separate fulfilment/payment status matrix is more than one method needs now.

## Risks
Cancelling after packing causes wasted work. Early warning: ORDER_NOT_CANCELLABLE rate.

## Consequences
UI timeline gains two pickup statuses; cancel button follows the server `canCancel`.

## Marketplace impact
Safe.

## Migration considerations
Add delivery by enabling the fulfilment type and its statuses.

## Verification
Unit tests for `canTransition` and cancel window; concurrency test for double cancel.
