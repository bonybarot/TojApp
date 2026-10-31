# Engineering Standards

Status: **DECIDED / PRESCRIPTIVE** — approved by the project owner 2026-09-03
Last Verified: 2026-09-03
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
| **C1** | Use **strict TypeScript** | `strict: true` is on; 6 untyped `.js` files exist and 1 `tsc` error stands |
| **C2** | Avoid `any`. Use it only when explicitly justified **and documented** | 6 occurrences, none justified in writing |
| **C3** | Split meaningful complex/reusable UI into components — but **do not over-componentize** | 4 components; largely reasonable |
| **C4** | Avoid unnecessary abstraction. Create one when reuse, complexity or maintainability genuinely justifies it | No abstraction layer exists at all today |
| **C5** | Business logic stays **out of UI components** wherever practical | Violated: cart total computed in 3 screens, category filter in 2, `getStatusColor` duplicated byte-for-byte |
| **C6** | Screens must **not** directly access fixture/API data. Use a data-access boundary | Violated: screens import `src/data/*` directly |
| **C7** | Keep **Zustand** for appropriate client/application state | Conforms |
| **C8** | Introduce **TanStack Query** when real server/API state arrives — **not before** | Not installed. Correct for the current phase |
| **C9** | React Native **`StyleSheet`** with **centralized design tokens** | Half-conformant: colours are centralized, spacing/typography/radius are hardcoded and the exported tokens are imported by nothing |
| **C10** | Strict, consistent naming conventions | Mostly conformant; exceptions listed in [coding-standards.md](coding-standards.md) |
| **C11** | **Feature-first** project organization | Not conformant: organized by technical type (`screens/`, `store/`, `data/`) |
| **C12** | Consistent **typed error handling** | Not conformant: 0 `try`/`catch` and 0 error boundaries in `src/` |
| **C13** | No uncontrolled `console.log`. Use a centralized logging/debugging approach | Conformant by accident (0 `console.*` in `src/`); no logging approach exists |
| **C14** | Write tests alongside important functionality; broader testing at **phase gates** | Not conformant: 0 tests execute |
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
npx tsc --noEmit     # currently 1 error
npx eslint .         # currently 6 errors, 2 warnings
npx jest             # currently 0 tests executed
```

Those three baselines are the reason Phase 0 exists — until they are green, "TYPECHECK →
LINT → TEST" cannot distinguish a working change from a broken one. See
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
