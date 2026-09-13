# Cube — canonical spec (LLM context)

Commit-grounded snapshot of **Cube** (`Shangmin-Chen/cube`) for later LLM sessions.

| Field | Value |
|-------|--------|
| Product HEAD (shipped) | `850768c` — 2026-09-10 16:46 EDT — PR **#40** squash |
| Mainline commits | **34** (`git rev-list --count 850768c`) |
| Window | 2026-08-30 → 2026-09-10 |
| Not shipped | Unmerged `fix/*` + later GitHub issues/PRs after `850768c` — **later WIP** (not part of the frozen timeline; do not snapshot live tracker numbers) |

This folder is a commit-grounded snapshot of what shipped at `850768c`. It is LLM context, not a product feature.

---

## How to use as context

Load in this order:

1. `glossary.md` — look-count naming, method IDs, storage keys (prevents the CFOP naming mix-up).
2. `current-state.md` — what ships at `850768c`.
3. `product.md` — identity, surfaces, removed/evolved features, README drift.
4. `architecture.md` — stack, folders, data flow, pipeline.
5. `algorithms-and-methods.md` — case libraries, IDs, ingest/verify.
6. `quality-and-issues.md` — tests, what is **not** validated, issue map.
7. `process.md` — squash/PR caveats; never reconstruct history from `git log main` alone.
8. `timeline.md` — dated milestones (hash + date).
9. `open-questions.md` — unresolved conflicts and auditor bait.

Rules:

- Invent nothing. A feature/milestone without a **commit hash + date** is uncertain.
- Count **unique product changes**, not SHAs. Sep 9–10 squash merges duplicate local `fix/*` commits; `git log --all` inflates counts.
- Prefer `src/` at `850768c` over `README.md` (README last edited `a1e74bf`, 2026-08-30).
- Alias `cfop` → `cfop-4look`. **`cfop-2look` is Full OLL+PLL**, not beginner 2-Look OLL/PLL.
- Do not credit unmerged `fix/*` or post-HEAD GitHub issues/PRs as shipped.
- When research notes conflict with `src/` at `850768c`, **source wins**.

---

## File map

| File | Purpose |
|------|---------|
| [glossary.md](./glossary.md) | Look-count naming, IDs, keys, cubing terms as this repo uses them |
| [current-state.md](./current-state.md) | HEAD user surface: routes, methods, persistence, UX facts |
| [product.md](./product.md) | Identity, three surfaces, removed/evolved features, README/footer drift |
| [architecture.md](./architecture.md) | Stack, source layout, runtime/data/pipeline |
| [algorithms-and-methods.md](./algorithms-and-methods.md) | Method tiers, datasets, pipeline rules |
| [quality-and-issues.md](./quality-and-issues.md) | No CI/tests, `verify:algs` limits, closed vs open issues |
| [process.md](./process.md) | Squash history, PR/issue map, testing reality |
| [timeline.md](./timeline.md) | Single dated milestone timeline through `850768c` |
| [open-questions.md](./open-questions.md) | Unresolved conflicts, unverified claims, auditor bait |

---

## Evidence

- `git log` of `850768c` (34 main commits, 2026-08-30 → 2026-09-10)
- `src/`, `scripts/`, `package.json`, `vercel.json`, `README.md` at that SHA
- Two independent history reviews, merged and audited against git/`src/`
- Tracker state as of 2026-09-13; later GitHub issues/PRs are **not** shipped at this HEAD

**Scramble fact:** timer scrambles are **not** `cubing` random-state. UI says “WCA Official”; implementation is custom random face turns (`generateScramble` in `cubeLogic.ts`). Open **#27**.
