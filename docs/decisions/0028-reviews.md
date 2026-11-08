# 0028. Product reviews bound to a verified purchase

Date: 2026-11-08
Status: Accepted (agent, under the owner's 2026-11-08 delegation "take the good decisions"; reversible). Implements D-14 / PR-20 for reviews. Wishlist half of this ADR shipped earlier in [0031](0031-app-api-integration.md)

## Context
D-14: reviews are desired for MVP, conditional on not delaying the core flow, and restricted to verified purchasers. The core flow (browse, bag, pickup checkout, orders) works end to end, so the condition holds.

## Decisions
1. **Verified purchase = a `COLLECTED` order of the customer containing the product.** Placed, confirmed or cancelled orders do not count: the customer has not had the item yet.
2. **One review per customer per product** (`Review @@unique([customerId, productId])`), not per order line. Buying again edits the same review. Rating 1..5 (DB CHECK), optional body up to 1000 characters.
3. **API** (`toj-backend` `src/modules/reviews`): `GET /products/:id/reviews` (public: count, average to one decimal, newest 20), `GET /me/reviews`, `PUT /me/reviews/:productId` (create or edit; 403 `FORBIDDEN` without a collected order), `DELETE /me/reviews/:productId`.
4. **Privacy**: the public list shows the reviewer's first name only, never phone or surname.
5. **App**: product details shows a read-only REVIEWS section; a collected order shows "Write a review" / "Edit your review" per product, opening the `WriteReview` screen (stars as a radio group, optional text, delete).
6. **No moderation queue, no photos, no helpful votes, no rating on product cards.** Reviews publish immediately.

## Alternatives rejected
- Review per order line: duplicates for repeat purchases, no benefit at this size.
- Rating aggregate stored on `Product`: an `aggregate` over an indexed column is cheap at this catalogue size; add a stored aggregate when cards show ratings.

## Risks and follow-ups (owner review)
- Abuse or offensive text: no moderation. Admin delete endpoint is the first thing to add if needed.
- Only the newest 20 reviews are shown (no paging).
- Customer-facing behaviour (Level 3 per AGENTS.md §1b), taken under delegation; owner may reverse.
