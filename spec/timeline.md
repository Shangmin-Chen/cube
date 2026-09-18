# Timeline

Canonical product milestones from repository genesis (`38e4a45`, 2026-08-30) through current HEAD (`5157ef2`, 2026-09-18).

---

## Milestone Table

| Slug | Date | Commit | What Shipped |
|------|------|--------|--------------|
| `genesis-four-tab-suite` | 2026-08-30 | `38e4a45` | Initial “CFOP PRO” app: Tutorial (home), Alg Reference, Flashcard Trainer v1, Timer. Hand-authored 2-Look OLL/PLL, incomplete Full PLL, F2L highlights |
| `rebrand-cube` | 2026-08-30 | `a1e74bf` | Brand renamed to **Cube** |
| `focus-pivot-timer-plus-algs` | 2026-08-30 | `269d9aa` | Simplified into 2 core tabs (Timer + Alg Reference) with Timer as home |
| `notion-dark-polish` | 2026-08-30 | `c6b070a` | Notion Dark design system tokens and Radix primitives |
| `spa-deep-links` | 2026-08-31 | `140872b` | Client-side routing via `react-router-dom` v7; `/` → `/timer`; deep-linking to cases |
| `trainer-revival-v2` | 2026-09-06 | `d79636c` | PR **#1** squash: `/train` Flashcards trainer revival with method-aware decks |
| `vercel-spa-ship` | 2026-09-07 | `f0d8cdd` | Custom cube favicon and `vercel.json` SPA rewrites |
| `quality-sprint-sep9` | 2026-09-09 | `723526f` … `01ca3a1` | PRs #29–#31, #33, #35: keyboard shortcuts, scramble normalization, Ao5/Ao12 queue order |
| `coming-soon-removed` | 2026-09-10 | `aef759e` | PR **#39**: Removed placeholder method stubs (Roux, ZZ, 2x2) |
| `ll-method-tiers-and-pipeline` | 2026-09-10 | `850768c` | PR **#40**: Automated ingestion pipeline, CFOP tiers (`cfop-4look`, `cfop-3look`, `cfop-2look`), and `verify:algs` |
| `types-cleanup` | 2026-09-18 | `a83dff5` | PR **#44**: Removed dead `topGrid` and `borderColors` fields (Issue #9) |
| `upstream-lockfile` | 2026-09-18 | `ca72ed5` | PR **#45**: Pinned upstream J Perm sources with SHA-256 lockfile (`verify:upstream-pin`, Issue #43) |
| `oll-lshape-orientation` | 2026-09-18 | `740c42f` | PR **#46**: Fixed 2-Look OLL L-shape hold orientation to 3 and 6 o'clock (Issue #16) |
| `pll-corner-probabilities` | 2026-09-18 | `d8b311f` | PR **#47**: Aligned 2-Look PLL corner probabilities with edge convention (Headlights 2/3, Diagonal 1/6, Issue #19) |
| `rotation-balancer-pairs` | 2026-09-18 | `285c1f5` | PR **#48**: Extended balancer to search half-turns and rotation pairs |
| `trigger-unification` | 2026-09-18 | `b3607d8` | PR **#49**: Unified trigger pattern table and added boundary oracle check (`verify:triggers`, Issue #3) |
| `trainer-state-isolation` | 2026-09-18 | `53c1293` | PR **#51**: Enforced disjoint round state sets and mastery celebration confetti (`verify:trainer`, Issue #21) |
| `semantic-invariants-alternatives` | 2026-09-18 | `12d4a73` | PR **#68**: Extended semantic invariants to algorithm alternatives (Issue #15) |
| `timer-ux-inspection-countdown` | 2026-09-18 | `2c99e6a` | PR **#70**: Fixed spacebar double-fire, added 15s inspection countdown with +2/DNF, and fixed 3D preview (Issue #24) |
| `wca-random-state-scrambles` | 2026-09-18 | `e3f6fc1` | PR **#71**: Integrated authentic WCA 3x3 random-state scrambles via `cubing/scramble` (Issue #27) |
| `verified-cross-insertions` | 2026-09-18 | `5157ef2` | PR **#50**: Replaced false cross case `D2 R F L B` with 4 verified beginner insertions + `verify:cross` (Issue #18) |

All 53 commits on `main` are validated by automated continuous integration.
