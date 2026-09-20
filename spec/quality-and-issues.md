# Quality and Issues

Quality assurance posture, test verification suites, and issue resolution status at commit `5157ef2` on `main`.

---

## Test & CI Posture

| Mechanism | Automated | Script / Implementation | Role |
|-----------|-----------|-------------------------|------|
| **Linting** | Yes (CI & pre-commit) | `npm run lint` (`oxlint`) | Fast static analysis |
| **Algorithm Invariants** | Yes (CI) | `npm run verify:algs` | Syntax, parsing, U-layer orientations, 2-look skips |
| **Cross Insertions** | Yes (CI) | `npm run verify:cross` | Physical simulation of 4 beginner cross insertions |
| **Trigger Patterns** | Yes (CI & pre-commit) | `npm run verify:triggers` | Regex boundary oracle, deduplication, shadowing order |
| **Trainer Session** | Yes (CI) | `npm run verify:trainer` | Mastery/learning isolation, round reset, confetti |
| **Upstream Integrity** | Yes (CI) | `npm run verify:upstream-pin` | Offline SHA-256 lockfile validation for J Perm source |
| **Build & Typecheck** | Yes (CI) | `npm run build` (`tsc -b && vite build`) | Full TypeScript compilation and production packaging |
| **Continuous Integration** | Yes | GitHub Actions (`.github/workflows/ci.yml`) | Runs all verification suites on push and PR |

---

## What the Verification Suite Validates

1. **Algorithm Parsing & Symmetry (`verify:algs`):**
   - Parses all 94 primary algorithms and 87 alternative variations (181 total) using KPuzzle.
   - Verifies 2-Look OLL hold descriptions match orientation simulations.
   - Verifies that every 2-look sub-step plus skip probability sums to 1.
   - Verifies group-scoped semantic invariants across primaries and alternatives.
2. **Cross Case Integrity (`verify:cross`):**
   - Validates all 4 beginner insertion cases against physical `cubing.js` cube state simulations.
   - Prohibits legacy fabricated cross sequences (e.g. `cross-sample-1` / `D2 R F L B`).
3. **Trigger Deduplication (`verify:triggers`):**
   - Rejects palindrome chips shorter than 5 moves.
   - Validates production badge outputs against regex boundary oracle across all primary algorithms.
   - Verifies shadowing order in the trigger pattern table.
4. **Trainer Session Invariants (`verify:trainer`):**
   - Enforces mutual exclusivity between `masteredIds` and `learningIds`.
   - Verifies that confetti triggers exclusively upon 100% round completion.
5. **Upstream Pinning (`verify:upstream-pin`):**
   - Ensures `scripts/ingest/upstream.lock.json` matches upstream content digests.

---

## Closed Issues & Merged Pull Requests

All functional issues from the initial audit queue have been resolved and merged into `main`:

| Issue | Topic | Resolution | Main Commit |
|-------|-------|------------|-------------|
| **#3, #4, #5** | Duplicate trigger patterns & badges | Unified `TRIGGER_PATTERNS` table with token-aligned badges | `b3607d8` (PR #49) |
| **#9** | Dead `topGrid` and `borderColors` fields | Excised from `AlgCase` and `cfopData.ts` | `a83dff5` (PR #44) |
| **#15** | Semantic invariants primaries-only | Group-scoped semantic invariants applied to alternatives | `12d4a73` (PR #68) |
| **#16** | OLL 2-Look L-shape hold orientation | Corrected to 3 and 6 o'clock (UR and UB slots) | `740c42f` (PR #46) |
| **#17** | OLL descriptions vs AUF | Aligned Anti-Sune and Headlights descriptions with algorithms | `f9a4ac8` (PR #53) |
| **#18** | False cross case `D2 R F L B` | Replaced with 4 verified beginner insertions + `verify:cross` | `5157ef2` (PR #50) |
| **#19** | 2-Look PLL corner probabilities | Aligned Headlights (2/3) and Diagonal (1/6) with edge convention | `d8b311f` (PR #47) |
| **#21** | Trainer round 2+ state isolation | Disjoint mastery/learning sets and round-scoped confetti | `53c1293` (PR #51) |
| **#24** | Timer spacebar, inspection, & 3D preview | Double-fire guard, 15s countdown with +2/DNF, `mode='scramble'` | `2c99e6a` (PR #70) |
| **#27** | WCA official scramble accuracy | Implemented WCA random-state 3x3 scrambles via `cubing/scramble` | `e3f6fc1` (PR #71) |
| **#43** | Upstream ingestion unpinned | Pinned jperm.net sources with SHA-256 `upstream.lock.json` | `ca72ed5` (PR #45) |
| **#48** | Rotation balancer coverage | Balancer searches half-turns and rotation pairs | `285c1f5` (PR #48) |
| **#55** | Trainer keyboard key-repeat | Added `e.repeat` guard in `useTrainerKeyboard` | `c899ee9` (PR #74) |
| **#61** | Dead code and unused kit cleanup | Removed dead Vite/Radix kit, dead types/exports, and aligned footer | Working tree |



---

## Architectural Boundaries

1. **Hand Cases Scope:** Hand-authored Cross (4 cases) and F2L (4 cases) are foundational pedagogical sets, not an exhaustive 41-case F2L library.
2. **Display of Alternative Algorithms:** Alternative algorithms exist in the pipeline and JSON datasets, verified by `verify:algs`. UI surfaces prioritize primary algorithms.
3. **Session Persistence:** Timer history and bookmarks persist to `localStorage`. Trainer round mastery is intentionally scoped to the active learning session.
