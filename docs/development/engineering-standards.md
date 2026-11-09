# Engineering Standards

Status: **DECIDED / PRESCRIPTIVE** — approved by the project owner 2026-09-03
Last Verified: 2026-11-09 (conformance column and §3 baseline refreshed; standards text unchanged)
Source: project owner direction, 2026-09-03

> Two pages describe how this code is written, and they are not the same thing:
>
> | Page | Nature |
> |---|---|
> | [coding-standards.md](coding-standards.md) | **Descriptive.** What the code does today, including its inconsistencies |
> | This page | **Prescriptive.** What new and changed code must do |
>
> The current codebase does not yet satisfy several of these standards. Where it does not,
> that is technical debt tracked in
> [../implementation/technical-debt-plan.md](../implementation/technical-debt-plan.md) — not
> a licence to ignore the standard in new code.

---

## 1. The standards

| ID | Standard | Current conformance |
|---|---|---|
| **C1** | Use **strict TypeScript** | Conforms: `strict: true`, no `.js` source in `src/`, `tsc` 0 errors (2026-11-09) |
| **C2** | Avoid `any`. Use it only when explicitly justified **and documented** | 1 occurrence (`src/api/client.ts`, parsed JSON body before shape checks), not yet justified in a comment |
| **C3** | Split meaningful complex/reusable UI into components — but **do not over-componentize** | 15 components in `src/components/`; largely reasonable |
| **C4** | Avoid unnecessary abstraction. Create one when reuse, complexity or maintainability genuinely justifies it | API client (`src/api/`) and business rules in `src/utils/`; no speculative layers |
| **C5** | Business logic stays **out of UI components** wherever practical | Mostly conforms: cart, filter, order-status and catalogue rules live once in `src/utils/` |
| **C6** | Screens must **not** directly access fixture/API data. Use a data-access boundary | Mostly conforms: screens read stores, stores call `src/api/`. Exceptions: Login/OTP import the `DEMO_OTP` constant, `productStore` seeds categories and pickup store from fixtures |
| **C7** | Keep **Zustand** for appropriate client/application state | Conforms |
| **C8** | Introduce **TanStack Query** when real server/API state arrives — **not before** | Not installed. Server state is held in Zustand stores with hand-written refresh/epoch guards (ADR-0031); revisit if that grows |
| **C9** | React Native **`StyleSheet`** with **centralized design tokens** | Conforms: `src/utils/theme.ts` tokens imported by 34 files; no inline styles (ESLint-enforced) |
| **C10** | Strict, consistent naming conventions | Mostly conformant; exceptions listed in [coding-standards.md](coding-standards.md) |
| **C11** | **Feature-first** project organization | Not conformant: organized by technical type (`screens/`, `store/`, `data/`) |
| **C12** | Consistent **typed error handling** | Partial: `ApiError` from `src/api/client.ts`, store-level try/catch, app error boundary in `App.tsx` (A64) |
| **C13** | No uncontrolled `console.log`. Use a centralized logging/debugging approach | Conforms (0 `console.*` in `src/`); no logging approach exists |
| **C14** | Write tests alongside important functionality; broader testing at **phase gates** | Partial: 10 Jest suites / 34 tests (logic, sync, session, order cancel); no screen tests |
| **C15** | Follow the AI development workflow in §3 | — |

### C6 in concrete terms

```text
Screen  →  Hook  →  Repository  →  Fixture | API
```

This is the seam that makes "static data now, backend later" real. Detail:
[../architecture/target-architecture.md](../architecture/target-architecture.md) §3.

### What "documented" means for C2

An `any` requires a comment naming the reason and, where one exists, the issue or ADR that
will remove it. An undocumented `any` is a review rejection.

---

## 2. Introducing anything new — the binding rule

> **Never introduce a library, architectural pattern, abstraction, or infrastructure
> component merely because it is popular, modern, convenient, or considered "best
> practice".**

Before introducing something new, state in writing:

1. What problem it solves.
2. Why the existing stack cannot solve that problem adequately.
3. What complexity and maintenance cost it introduces.
4. Whether a simpler solution exists.
5. Whether it is required **at the current project phase**.

**Significant architectural changes require explicit approval.** An ADR is the place this
is written down — see [../decisions/README.md](../decisions/README.md) §5 for when one is
required.

This rule is why `nativewind` is installed, unconfigured and unused: it entered the project
without answering any of the five questions, and it is now scheduled for removal.

---

## 3. C15 — the AI development workflow

```text
INSPECT → EXPLAIN → PLAN → IMPLEMENT → TYPECHECK → LINT → TEST → FIX → DOCUMENT → REPORT CHANGES
```

**Do not skip verification.** The three verification steps run against real commands:

```bash
npx tsc --noEmit     # 0 errors (2026-11-09)
npx eslint .         # 0 errors, 0 warnings
npx jest             # 10 suites, 34 tests pass
```

Those three baselines were the reason Phase 0 existed (on 2026-09-03: 1 tsc error, 6 lint
errors, 0 tests). All three are green now and must stay green. See
[../implementation/implementation-phases.md](../implementation/implementation-phases.md).

**REPORT CHANGES** means stating what was changed, what was verified, and what was *not*
verified. A change that was not verified is reported as unverified.

---

## 4. What this page does not cover

Formatting (Prettier config exists and is enforced by nothing), commit conventions,
branching strategy, and code-review process are all **OPEN**. They are not invented here.

---

## Related

- [coding-standards.md](coding-standards.md) — what the code does today
- [../requirements/product-vision.md](../requirements/product-vision.md) §11 — the product principles these serve
- [../architecture/target-architecture.md](../architecture/target-architecture.md) — the layering C6 and C11 describe
- [../implementation/technical-debt-plan.md](../implementation/technical-debt-plan.md) — every current non-conformance
