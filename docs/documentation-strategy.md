# Documentation Strategy

Status: PROPOSED
Last Verified: 2026-09-03

Documentation on this project is an engineering deliverable, not a write-up done afterwards.
This page defines what exists, who owns it, when it must change, and how it stays true.

---

## 1. Why this is a first-class concern here

This repository is the demonstration of what undocumented decisions cost. Nobody wrote down
which product dataset was canonical, so both survived. Nobody wrote down that `nativewind`
was a plan or an accident, so it is still installed and still unused. Nobody recorded whether
the History screens were replaced or abandoned, so they sit in the tree unreachable.

None of those are coding mistakes. They are all *undocumented decisions* — and each one
now costs an investigation to resolve. The strategy below exists to stop the next twenty.

---

## 2. Structure

```text
AGENTS.md                      entry point for any agent or new developer
docs/
  README.md                    index
  current-state.md              what the app IS today (single page)
  archive/pre-ui-baseline/     HISTORICAL pre-UI pages (current-state, features, components, api)
  api/                         API contract — "NOT IMPLEMENTED" today
  requirements/                what the product must do — business and product level
  architecture/               target architecture, domain model, security
  implementation/              phases, migration, technical debt, testing
  decisions/                   ADRs, one per decision, numbered and immutable
  development/                 setup, workflow, standards, testing
  releases/                    changelog
  documentation-strategy.md    this page
```

**Deliberately not created:** a `docs/guides/` tutorial tree, per-file API reference,
diagrams of things a paragraph explains, a glossary of terms that are already standard
e-commerce vocabulary. Documentation nobody reads still has to be maintained; unmaintained
documentation is worse than none, because it is believed.

### Which category a new page belongs to

| The page describes… | Goes in |
|---|---|
| Behaviour that exists right now | `current-state.md` |
| What the product must do, independent of how | `requirements/` |
| How the system will be built | `architecture/` |
| A specific choice and why it was made | `decisions/` (an ADR) |
| Sequence, phases, risk, debt, tests | `implementation/` |
| How to work on the repository | `development/` |

If a page would fit two, it is probably two pages.

---

## 3. Every page carries its state

Every document begins with:

```text
Status: Current State | PROPOSED | DECIDED | TARGET | DEPRECATED | SUPERSEDED by <doc>
Last Verified: YYYY-MM-DD
Source: <the files or decisions this was derived from>
```

`Last Verified` is the date someone actually checked it against the code — **not** the date
the file was edited, and never today's date by default. A page whose `Last Verified` is old
is not automatically wrong; it is explicitly unverified, which is a different and more
useful thing to know.

Terminology is shared with `AGENTS.md` §6: `IMPLEMENTED`, `PARTIAL`, `MOCK`, `BROKEN`,
`NOT IMPLEMENTED`, `UNKNOWN`, `NOT YET DECIDED`. Anything that cannot be established from
the repository is marked **Unknown / Requires Verification** rather than guessed.

---

## 4. Decisions

Every architectural decision becomes an ADR before the code that implements it is written.
The required set is listed in [decisions/README.md](decisions/README.md).

Format: Decision · Context · Problem · Requirements · Options considered · Chosen approach ·
Why · Trade-offs accepted · Rejected alternatives and why · Risks · Consequences · Future
implications · Migration considerations · Verification strategy · Date and status.

Lifecycle: `Proposed → Accepted → (Superseded by ADR-NNNN | Deprecated)`, or
`Proposed → Rejected`.

**An accepted ADR is never edited to say something different.** When the decision changes, a
new ADR supersedes it and the old one gets a `Superseded by` line and nothing else. The
record of what was believed, and why, is the part with the value — a rewritten ADR is a lost
one. This is the rule that would have prevented the products.js/products.ts situation.

An ADR is required when the change: adds or removes a dependency; changes a data contract;
changes how state, persistence, navigation or auth work; affects money, security or
customer data; or would be expensive to reverse. Everything else is just a commit.

---

## 5. Documentation is part of the change, not after it

The definition of done for any change that alters behaviour, architecture, dependencies,
file layout or configuration:

1. Code changed
2. Tests updated
3. **The affected documentation updated in the same pull request**
4. `Last Verified` re-stamped on every page touched
5. Changelog entry
6. ADR written if §4 applies

A pull request that changes behaviour and no documentation is incomplete. Not "should
ideally"; incomplete. Each phase in
[implementation/implementation-phases.md](implementation/implementation-phases.md) names
its documentation obligations as **completion criteria**, so this is enforced at the phase
gate too.

### 5a. Scope rules for a feature branch — DECIDED 2026-09-03

| Rule | Meaning |
|---|---|
| **Stay in your lane** | A feature branch primarily modifies the documentation belonging to that feature |
| **Project-wide pages are not casual edits** | Requirements, architecture, domain model, security rules and recorded decisions change only when the implementation genuinely changes a project-wide rule |
| **Announce it when it happens** | Such a change is identified explicitly in the pull request, under its own heading. A reviewer must never discover a requirement change by reading a diff |
| **Never restructure unrelated documentation** | Reordering, renaming or "tidying" a page the branch does not otherwise touch is out of scope, however tempting |
| **Never silently resolve a documentation merge conflict** | Stop. Explain both changes and what each was trying to say. Request a decision. Two people editing the same requirement is a product disagreement wearing a git costume — picking a side in the merge hides it |
| **Same PR, not a follow-up** | Feature documentation ships with the feature. See the list above |
| **Decisions change by ADR** | A significant architectural change is recorded as a **new** ADR. Never by rewriting a historical one — §4 |

**Why the conflict rule is strict here.** This project is documentation-first: the docs lead
the code rather than describing it. A silently-resolved conflict in a requirement is not a
formatting loss, it is a requirement quietly deleted, and nothing downstream will catch it —
there is no test for a missing requirement.

### The current-state pages have a rewrite obligation

`current-state/data-flow.md` documents the `.js`/`.ts` shadowing in detail. When Phase 1
removes it, that page must be rewritten to describe the new reality, with a short
"previously" note pointing at the changelog and the ADR. The history is preserved — in git,
in the ADR, in the changelog — but the current-state page describes *only* the current
state. A current-state page that describes a past state is the single most dangerous kind of
stale documentation, because it reads as authoritative.

---

## 6. Ownership

| Documentation | Owned by |
|---|---|
| `current-state.md` | Whoever last changed the code it describes |
| `requirements/` | Product |
| `architecture/`, `decisions/` | The architect or tech lead |
| `implementation/` | The tech lead, updated at each phase gate |
| `development/` | Whoever hits the gap first |
| `AGENTS.md`, this page | The tech lead |

Ownership means responsibility for accuracy, not exclusive write access. Anyone may fix
anything they find wrong.

---

## 7. Keeping it true

Documentation rots silently. Three cheap mechanisms, in order of value:

1. **Same-PR updates** (§5). By far the most effective; everything else is a backstop.
2. **Phase-gate review.** At the end of each phase, every page the phase touched is re-read
   against the code and re-stamped. This is a checklist item in the phase, not a separate
   activity.
3. **Quarterly link and staleness check.** Internal links resolve; anything with a
   `Last Verified` older than two phases gets re-checked or marked unverified.

Automate only the first thing that is worth automating: a link checker in CI. Everything
else here is judgement and cannot be automated honestly.

---

## 8. Writing rules

- State what is true, with the file and line as evidence. `src/store/userStore.ts:21` beats
  "the login function".
- Distinguish fact from plan from proposal, on every page, every time.
- Do not document the obvious. A page explaining that a React component returns JSX is
  noise that dilutes the pages that matter.
- Prefer a table to a paragraph when the content is a set of parallel facts; prefer a
  paragraph when the content is an argument.
- Short. A document nobody finishes is a document nobody read.
- No invented information. If it is not in the repository and nobody decided it, it is
  **Unknown / Requires Verification**.

---

## 9. When documentation is deliberately skipped

Not everything earns a page. No documentation for: a bug fix that changes no contract, a
dependency patch bump, formatting, a rename with no semantic change, or an internal helper
whose name and signature already say what it does.

The test: *would someone joining in six months make a worse decision without this?* If no,
do not write it.

---

## Related

- [decisions/README.md](decisions/README.md) — the ADR register
- [implementation/implementation-phases.md](implementation/implementation-phases.md) — per-phase documentation obligations
- [../AGENTS.md](../AGENTS.md) — the documentation-first rule for agents
