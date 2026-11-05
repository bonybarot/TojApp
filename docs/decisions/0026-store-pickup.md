# 0026. Store pickup: eligibility model and checkout branch

Date: 2026-10-31
Status: Accepted (product-owner approval of the backend blueprint, 2026-10-31)

## Context
D-10: pickup is modelled per product. The owner approved pickup-only checkout for the demo on 2026-10-31: no delivery charge or free-delivery threshold.

## Problem
Define pickup eligibility and what the demo checkout supports.

## Requirements
D-10, D-11; docs/backend/API_SPECIFICATION.md §9-10.

## Options considered
Per-product flag; per-location stock; per-category rule.

## Decision
`Product.pickupAvailable`; PickupLocation rows per store; the demo checkout accepts only fulfilment PICKUP and rejects DELIVERY with `FULFILMENT_NOT_SUPPORTED`. A pickup order is allowed only when every line is pickup-eligible and the location is active. No delivery fee, no threshold.

## Why
Matches the product decision and the owner's demo scope.

## Trade-offs accepted
Delivery code paths (address use, fee) exist in the design but are not built or reachable in the demo.

## Rejected alternatives
Per-location stock needs a larger inventory model than the demo needs.

## Risks
Pickup of unavailable products. Early warning: `PICKUP_NOT_AVAILABLE` e2e test.

## Consequences
The checkout screen must not offer delivery in the demo; the store settings drop the fee and threshold.

## Marketplace impact
Compatible.

## Migration considerations
Enable delivery later by allowing the fulfilment type, adding fee settings and the delivery statuses.

## Verification
Order create tests: pickup with an ineligible product is refused; DELIVERY is refused.
