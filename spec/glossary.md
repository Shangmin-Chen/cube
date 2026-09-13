# Glossary

Terms as this **repo** uses them at `850768c`. Community language in parentheses where they diverge.

## CFOP look-count (critical)

**N-Look LL** = number of **last-layer recognition steps inside CFOP**, not a different cubing method, and not “N looks for the whole solve.”

| Repo term | Meaning here | Easy mistake |
|-----------|--------------|--------------|
| **4-Look LL** / `cfop-4look` | Beginner CFOP last layer: 2-Look OLL **plus** 2-Look PLL (4 LL recognitions). **Default.** | Thinking “4-look” is a non-CFOP method |
| **3-Look LL** / `cfop-3look` | 2-Look OLL + Full PLL | |
| **2-Look LL** / `cfop-2look` | **Full OLL + Full PLL** (standard advanced CFOP LL) | Reading “2-look” as beginner 2-Look OLL/PLL |
| **2-Look OLL** | Edge orientation, then corner orientation (10 algs) | |
| **2-Look PLL** | Corner permutation, then edge permutation (6 algs) | |
| **Full OLL** | 57 algs, one look | |
| **Full PLL** | 21 algs, one look | |
| **LL** | Last layer | |
| **CFOP** | Cross, F2L, OLL, PLL — the only implemented method family at HEAD | |

**Trap:** `cfop-2look` is the **advanced** tier. Beginner 2-Look OLL+PLL lives under **`cfop-4look`**.

Legacy UI (`7bcacd9`): “2-Look CFOP” ≈ today’s **`cfop-4look`**, not `cfop-2look`.

Routing alias: **`cfop` → `cfop-4look`**. `CFOP_METHOD` / `ALL_CFOP_CASES` = 4-look.

## Product / IA

| Term | Meaning here |
|------|----------------|
| **Cube** | App brand (`a1e74bf`, 2026-08-30). Was **CFOP PRO** at `38e4a45`. |
| **Timer** | `/timer` — hold-to-start clock + scramble preview + history. Nav: **Speedsolving Timer**. |
| **Flashcards / Trainer** | `/train` — alg drill (Trainer v2 from `d79636c`). Nav: **Flashcards**. |
| **Algorithms / Alg Reference** | `/algs`, `/algs/:step`, `/algs/:step/:caseId`. Nav: **Algorithms**. |
| **Notion Dark** | Design system from `c6b070a`: page `#191919`, surfaces `#202020`, borders `#2d2d2d`, accent `#eab308`. |
| **Coming-soon methods** | `roux`, `zz`, `2x2` — UI stubs since **`26359fe` (2026-08-30)**; empty registry rows added PR #1 branch (`4652d7f`); never populated; **removed** `aef759e`. |

## Method and step IDs

| ID | Kind |
|----|------|
| `cfop-4look`, `cfop-3look`, `cfop-2look` | `AlgMethod.id` |
| `cross`, `f2l`, `oll`, `pll` | `MethodStep.id` / `AlgCase.category` / URL `:step` |
| `bookmarked` | Pseudo-step in Alg Reference (`/algs/bookmarked`) |

Trainer deck ids (slug of `subcategory`): `bookmarks`, `2-look-oll`, `2-look-pll`, `full-oll`, `full-pll`, `all`.

## Case ID prefixes

| Pattern | Set |
|---------|-----|
| `cross-sample-*` | Hand Cross (only `cross-sample-1` at HEAD) |
| `f2l-basic-*` | Hand F2L highlights (4) |
| `oll-2look-*` | 2-Look OLL |
| `pll-2look-*` | 2-Look PLL |
| `oll-{1–57}` | Full OLL |
| `pll-{letter}` | Full PLL (`pll-aa`, `pll-t`, …) |

Historical: `pll-w` was a duplicate of V-perm; removed **#7**.

## Algorithm fields (`AlgCase`)

| Field | Role at HEAD |
|-------|----------------|
| `primaryAlg` | Shown / trained / inverted for setup |
| `alternativeAlgs` | Generated LL only; parsed by verify, not semantically checked |
| `why` | Mechanics copy (quality uneven). Full OLL = **group template**, not per-case |
| `description` | Hold/recognition copy; Full PLL mostly templated |
| `tips` | Cross/F2L only. Pipeline dropped LL tips |
| `probability` | Generated LL; 2-Look PLL corners use **conditional** 4/5, 1/5 |
| `is2Look` | True on 2-Look JSON cases |
| `topGrid` / `borderColors` | Present on Cross/F2L; **unused** by `AlgDiagram` |
| `setupMoves` | Type only; unused. Trainer setup = inverse of `primaryAlg` at runtime |
| `group` | Pedagogical cluster (Look 1/2, Adjacent Corners, …) |
| `subcategory` | Deck grouping key (`2-Look OLL`, `Full PLL`, …) |

**Badges / trigger chips:** runtime, from `primaryAlg`, not stored.

## Storage and events

| Key / name | Meaning |
|------------|---------|
| `cfop_solves` | Timer `SolveRecord[]` |
| `cfop_bookmarks` | Bookmarked case id strings |
| `cube:bookmarks_updated` | Same-tab bookmark refresh event |
| `cfop_trainer_mastered` | **Dead** Trainer v1 key; unread at HEAD |

## Pipeline / verification

| Term | Meaning |
|------|---------|
| **J Perm ingest** | Fetch `jperm.net/lib/{2lookoll,2lookpll,oll,pll}.js`, run in Node `vm`, read `algsetAlgs`. Unpinned at HEAD |
| **Rules** | `formatWCARule` → `balanceRotationsRule` → optional AUF rules |
| **KPuzzle** | `cubing/puzzles` 3×3 simulator used to parse algs and check some PLL invariants |
| **verify:algs** | `scripts/verify-cfop.mjs` — JSON counts, parse all primaries+alts, PLL **primary** invariants |
| **sync:algs** | Live fetch + transform + write `src/data/generated/*.json` |
| **AUF** | Adjust U face; trailing `U`/`U'`/`U2` appended by pipeline rules |
| **WCA** | Used in UI/README for timer + `cubing/alg` notation. Scrambles are **not** WCA random-state |

## Cubing / UI jargon in this codebase

| Term | Repo usage |
|------|------------|
| **Ao5 / Ao12** | Average of N, drop best and worst; newest-first queue |
| **Inspection** | Optional pre-solve **state**; not a timed 15s WCA inspection at HEAD |
| **Sexy / Sune / Sledge / Hedge** | Trigger names in `parseTriggers` |
| **Palindrome** | Move sequence equal to its reverse; also dynamic substring chips |
| **VisualCube** | Remote 2D SVG diagram API (`visualcube.api.cubing.net`) |
| **Cross sample** | `cross-sample-1` — `D2 R F L B` is **known-bad** (#18) |
| **F2L highlights** | Four hand-authored “basic” cases. Not the 41-case set |

## Process

| Term | Meaning |
|------|---------|
| **Product HEAD** | `850768c` (2026-09-10) |
| **Research checkpoint** | `9dce376` — not a release |
| **Squash merge** | All 13 merged PRs. Branch SHAs ≠ main SHAs; diffs often identical |
| **Squash duplicate** | Local `fix/*` commit + main squash of the same patch |
| **Issue #2** | Parent audit tracker (Sep 8). Meta, not a feature |
| **Later WIP** | Unmerged `fix/*` and GitHub issues/PRs after `850768c` (e.g. #41+ filed 2026-09-12+); not shipped; do not snapshot live tracker numbers |
