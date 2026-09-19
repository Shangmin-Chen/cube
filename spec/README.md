# Cube — Canonical Specification

Commit-grounded specification of **Cube** (`Shangmin-Chen/cube`) for developers and AI agents.

| Field | Value |
|-------|--------|
| Product HEAD (shipped) | `5157ef2` — 2026-09-18 — PR **#50** squash |
| Mainline commits | **53** (`git rev-list --count main`) |
| Development Window | 2026-08-30 → 2026-09-18 |
| Active Verifications | 5 verification suites passing with 0 warnings/errors + GitHub CI |

This folder is the commit-grounded single source of truth for the codebase architecture, CFOP datasets, user surfaces, and invariants.

---

## AI Agent Guidelines (Planner & Subagent Protocol)

This repository follows a **Spec-First** agent workflow codified in [`AGENTS.md`](../AGENTS.md) and the workspace skill [`.agents/skills/spec-workflow/SKILL.md`](../.agents/skills/spec-workflow/SKILL.md):

1. **Reference `spec/` First for Historical & Architectural Context:**
   - Whenever gathering historical context, architectural rationale, method tier naming, or issue background, **consult `spec/` first** before diving into raw `git log` or commit history.
   - Because the repository strictly uses squash merges and parallel issue branches, raw git history is noisy and prone to duplicate SHAs. `spec/` provides the curated, commit-grounded source of truth.

2. **Plan Before Code:**
   - Before modifying code or implementing a task, the **planner / orchestrator agent must record what it intends to do** in a task plan or specification.
   - Canonical living specs (`current-state.md`, `architecture.md`) must always represent verified shipped reality, updated during Phase 4 upon completion.
   - Subagents must read the recorded plan and referenced specs before executing code edits.

---

## How to use as context

Load in this order:

1. [`glossary.md`](./glossary.md) — look-count naming, method IDs, storage keys (prevents the CFOP naming mix-up).
2. [`current-state.md`](./current-state.md) — what ships at current HEAD: routes, methods, persistence, UX facts.
3. [`product.md`](./product.md) — identity, surfaces, removed/evolved features, README drift.
4. [`architecture.md`](./architecture.md) — stack, folders, data flow, pipeline.
5. [`algorithms-and-methods.md`](./algorithms-and-methods.md) — case libraries, IDs, ingest/verify.
6. [`quality-and-issues.md`](./quality-and-issues.md) — automated verification suite, closed vs open issues.
7. [`process.md`](./process.md) — squash/PR caveats; never reconstruct history from `git log main` alone.
8. [`timeline.md`](./timeline.md) — dated milestones (hash + date).
9. [`open-questions.md`](./open-questions.md) — architectural considerations and remaining technical debt.

### Core Domain Rules

- Invent nothing. Every architectural fact and milestone is grounded in source code and commit history.
- Prefer `src/` over root `README.md` (root README predates method pipeline refactors).
- Alias `cfop` → `cfop-4look`. **`cfop-2look` is Full OLL+PLL**, not beginner 2-Look OLL/PLL.
- When notes conflict with `src/`, **source wins**.

---

## File map

| File | Purpose |
|------|---------|
| [glossary.md](./glossary.md) | Look-count naming, IDs, keys, cubing terms as this repo uses them |
| [current-state.md](./current-state.md) | HEAD user surface: routes, methods, persistence, UX facts |
| [product.md](./product.md) | Identity, three surfaces, removed/evolved features, README/footer drift |
| [architecture.md](./architecture.md) | Stack, source layout, runtime/data/pipeline |
| [algorithms-and-methods.md](./algorithms-and-methods.md) | Method tiers, datasets, pipeline rules, invariants |
| [quality-and-issues.md](./quality-and-issues.md) | Verification scripts, CI integration, resolved vs open issues |
| [process.md](./process.md) | Squash history, PR/issue map, testing realities |
| [timeline.md](./timeline.md) | Single dated milestone timeline through HEAD |
| [open-questions.md](./open-questions.md) | Architectural considerations and open technical debt |

---

## Key Domain Facts

- **Scrambles:** Timer scrambles use `cubing/scramble` (`randomScrambleForEvent('333')`), producing authentic WCA random-state scrambles.
- **Cross:** Cross library contains 4 beginner insertions (`cross-top-white-up`, `cross-top-white-side`, `cross-middle-fr`, `cross-bottom-flipped`), verified by `verify:cross`.
- **Triggers:** Triggers are unified in `TRIGGER_PATTERNS` (`src/utils/triggerPatterns.ts`), verified by `verify:triggers`.
- **Upstream Pinning:** Ingestion pipeline is pinned to `scripts/ingest/upstream.lock.json` via SHA-256 and checked by `verify:upstream-pin`.
- **CI:** Automated CI workflow runs on `.github/workflows/ci.yml` verifying lint, build, triggers, cfop, trainer, and upstream lockfile.
