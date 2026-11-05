# 0030. Backend in a separate repository

Date: 2026-11-05
Status: Accepted (product owner, 2026-11-05). Amends the repository location in [0007](0007-backend-platform.md) and supersedes backend Q-3

## Context
On 2026-10-31 the Day-1 backend foundation was built as `backend/` inside this repository, with five root-config exclusions (tsconfig, Jest, ESLint, Metro, .gitignore). That was engineering decision Q-3 in the backend `DECISIONS.md`, chosen for a solo developer. None of it was committed. The owner now wants the backend developed by a team that works independently of the app.

## Problem
Where the backend code, its docs and its history live, so that the app team and the backend team can each work, review, test and release without blocking the other.

## Requirements
D-4 (a backend will exist), D-6 (documentation-first), [0008](0008-api-style.md) (REST + OpenAPI), AGENTS.md §1b (Level 3: scope decisions are the owner's).

## Options considered
1. **Keep `backend/` in this repo (monorepo).** One clone, one PR can change API and client together. But shared access rights, PR queue and history; CI needs path filters; root configs carry backend exclusions.
2. **Long-lived `backend` branch in this repo.** Separates nothing that matters; the branch drifts from `main` and every merge is painful. Branches are for changes, not projects.
3. **Separate repository `toj-backend`, contract via OpenAPI.** Independent access, CI, versions and releases. Cross-cutting changes become two PRs.

## Decision
Option 3. The backend lives in its own repository, **`toj-backend`**, cloned locally as a sibling folder (`../toj-backend`). The API contract between the repos is the OpenAPI document the backend serves at `/api/docs`.

What moved: `backend/` (code), `docs/backend/*` (blueprint, now `toj-backend/docs/`), `docs/BACKEND_READINESS_AUDIT.md`.
What stays here: product vision, requirements, architecture, domain model, UI docs, and **the single ADR register** (`docs/decisions/`, including the backend ADRs 0007-0013, 0020, 0022, 0026). One register keeps numbering collision-free and keeps product-level decisions (money, order state, pickup) next to the product docs. New ADRs from either team are numbered here.

## Why
The owner's goal is team independence; option 3 is the only one that delivers it. The move cost nothing in history because `backend/` was never committed. Option 1 would have been right only if one team owned both sides.

## Trade-offs accepted
- No direct TypeScript type sharing. App types are hand-written to match the OpenAPI spec, or generated from it later (a new dev dependency needs its own approval per AGENTS.md §7a).
- A change spanning API and app needs two coordinated PRs.
- Backend docs link to this repo by GitHub URL (`github.com/bonybarot/TojApp/blob/main/...`); those links resolve once this branch is merged to `main`.

## Rejected alternatives
Monorepo (option 1): rejected for team independence, not on technical grounds; it worked. Backend branch (option 2): rejected as a source of merge pain with no isolation benefit.

## Risks
- **Contract drift** between app and API. Warning sign: app types disagree with Swagger. Mitigation: commit an exported `openapi.json` in `toj-backend` and review it in every API PR (roadmap item).
- **Seed data drift**: the backend seed can no longer import the app's `src/data/` fixtures. Mitigation: copy them once into `toj-backend/prisma/seed-data/`, owned by the backend from then on.
- ~~No remote yet~~ Resolved 2026-11-05: `toj-backend` is a private GitHub repository, `https://github.com/softyoi-bony/toj-backend` (`main` at `8af4b46`). It sits under a different GitHub account than this repo (`bonybarot/TojApp`); team access must be granted on both.

## Consequences
- This repo: the five backend exclusions in `tsconfig.json`, `jest.config.js`, `.eslintrc.js`, `metro.config.js`, `.gitignore` were reverted (they excluded only `backend/`). AGENTS.md §7b now points to the backend repo.
- `toj-backend`: own `AGENTS.md`, `.gitignore`, `README.md`; first commit `8af4b46` on `main`.
- Accepted ADRs that mention `docs/backend/...` or `backend/` in prose are not rewritten; read those paths as `toj-backend/docs/...` and `toj-backend/`.

## Marketplace impact
Compatible. A separate API repository is the expected shape for a future seller and admin surface (D-3, D-5).

## Migration considerations
Reversible: copy `toj-backend` back into `backend/`, re-apply the five exclusions (recorded in `toj-backend/docs/LOCAL_DEVELOPMENT.md` §3), and merge histories with `git subtree add` if history must be kept.

## Verification
- `test ! -d backend` in this repo; `git diff` shows no backend exclusions in the root configs.
- In `toj-backend`: `npm run lint && npm run typecheck && npm test && npm run test:e2e` pass (executed 2026-11-05: lint exit 0, typecheck clean, unit 5/5, e2e 3/3, `nest build` ok).
- In this repo: `npx tsc --noEmit`, `npm run lint`, `npm test` pass.
