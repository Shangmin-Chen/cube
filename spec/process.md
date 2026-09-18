# Process & Git Lineage

Reconstructing repository history from `git log main` alone under-counts work and mis-links issues due to exclusive squash-merging and parallel feature branches.

---

## Canonical References

| Reference | Meaning |
|-----------|---------|
| `main` @ `5157ef2` | Product HEAD (2026-09-18) — PR #50 squash merge |
| `main` @ `850768c` | Historical milestone (2026-09-10) — PR #40 pipeline refactor |
| `docs/llm-spec-timeline` | Documentation and specification branch establishing the Spec-First workflow |

---

## Five Process Phases

### Phase 0 — Direct-to-Main Prototype (2026-08-30 → 09-07)
20 commits on `main` before PR #1, no PRs, no CI. Early rapid feature development (Timer, Flashcards, Reference). First recorded subagent audit remediation in `26359fe` (safe localStorage, crossCases in aggregates).

### Phase 1 — First PR & Squash Strategy (2026-09-06/07)
**PR #1** (`feat/quizlet-flashcards-trainer`): 6 commits squash-merged to `d79636c`. Established the exclusive squash-merge discipline used for all subsequent pull requests.

### Phase 2 — Issue Queue Resolution (2026-09-08–10)
Parent tracker **Issue #2** established. Parallel `fix/issue-*` branches squash-merged as PRs **#29–#38** covering UI shortcuts, timer Ao5 queueing, and early trigger pattern work.

### Phase 3 — Algorithm Ingestion Pipeline (2026-09-10)
**PR #39** (`aef759e`) removed unimplemented method stubs.  
**PR #40** (`850768c`) established the automated algorithm ingestion pipeline (`sync-algorithms.mjs`), method tiers (`cfop-4look`, `cfop-3look`, `cfop-2look`), and initial `verify:algs` KPuzzle verification.

### Phase 4 — Quality & Verification Convergence (2026-09-18)
Comprehensive stabilization and test suite consolidation:
- **PR #44** (`a83dff5`): Removed dead `topGrid` and `borderColors` fields (Issue #9).
- **PR #45** (`ca72ed5`): Pinned upstream J Perm sources with SHA-256 lockfile (`verify:upstream-pin`).
- **PR #46** (`740c42f`): Fixed 2-Look OLL L-shape hold orientation to 3 and 6 o'clock (Issue #16).
- **PR #47** (`d8b311f`): Aligned 2-Look PLL corner probabilities with edge convention (Issue #19).
- **PR #48** (`285c1f5`): Extended rotation balancer to search half-turns and rotation pairs.
- **PR #49** (`b3607d8`): Unified trigger pattern table and added boundary oracle test (`verify:triggers`).
- **PR #50** (`5157ef2`): Replaced false cross case `D2 R F L B` with 4 verified beginner insertions + `verify:cross` (Issue #18).
- **PR #51** (`53c1293`): Enforced disjoint round state and mastery confetti (`verify:trainer`, Issue #21).
- **PR #68** (`12d4a73`): Applied semantic invariants to algorithm alternatives (Issue #15).
- **PR #70** (`2c99e6a`): Resolved spacebar double-fire, added 15s inspection countdown, and 3D preview (Issue #24).
- **PR #71** (`e3f6fc1`): Integrated authentic WCA random-state scrambles via `cubing/scramble` (Issue #27).
- Added GitHub Actions CI (`.github/workflows/ci.yml`).

---

## Squash Merge Realities & Historical Guidance

1. **Squash Discards Ancestry:** When a PR squash-merges, individual review and iteration commits are collapsed. Historical branch tips may linger in remote tracking branches.
2. **Issue Linkages:** GitHub issues were primarily closed by branch commit messages rather than squash titles.
3. **Commit Count:** Linear history on `main` at `5157ef2` contains 53 commits. Raw `git log --all` inflates counts due to orphaned feature branches.
4. **Source of Truth:** For historical rationale and domain invariants, consult `spec/` before conducting git archaeology.
