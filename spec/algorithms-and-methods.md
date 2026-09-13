# Algorithms and methods

HEAD `850768c`. Cross/F2L are **samples**. OLL/PLL last-layer sets are **full** for the chosen tier. Counts verified against `src/data/generated/*.json` and `cfopData.ts` in this worktree.

## Look-count naming (read this first)

**N-Look LL** = number of **last-layer recognition steps inside CFOP**, not a different cubing method, and **not** “N looks for the whole solve”.

| Method ID | Display name | LL looks | OLL set | PLL set |
|-----------|--------------|----------|---------|---------|
| `cfop-4look` | 4-Look LL (Beginner CFOP) | 4 | 2-Look OLL (edges then corners) | 2-Look PLL (corners then edges) |
| `cfop-3look` | 3-Look LL (Intermediate CFOP) | 3 | 2-Look OLL | **Full PLL** (1 look) |
| `cfop-2look` | 2-Look LL (**Full CFOP**) | 2 | **Full OLL** | **Full PLL** |

**Trap:** `cfop-2look` is the **advanced** tier. Beginner 2-Look OLL+PLL lives under **`cfop-4look`**.

Pre-pipeline (`7bcacd9`): UI said “2-Look CFOP” for the beginner last-layer view. Post-`850768c` that phrase was replaced by the three IDs above.

Aliases: `cfop` → `cfop-4look`. `CFOP_METHOD` / `ALL_CFOP_CASES` = 4-look.

---

## Case counts at HEAD

| Method | Cross | F2L | OLL | PLL | **Total** |
|--------|------:|----:|----:|----:|----------:|
| `cfop-4look` | 1 | 4 | 10 | 6 | **21** |
| `cfop-3look` | 1 | 4 | 10 | 21 | **36** |
| `cfop-2look` | 1 | 4 | 57 | 21 | **83** |

Cross + F2L arrays are **shared** across all three methods. The selector only changes LL depth.

## Two-tier data model

| Tier | Path | Contents |
|------|------|----------|
| Hand-authored | `src/data/cfopData.ts` | `CROSS_CASES` (1), `F2L_HIGHLIGHTS` (4); tips + `topGrid`/`borderColors` |
| Generated | `src/data/generated/*.json` | All OLL/PLL; no `tips`, no `topGrid`, no `setupMoves` |
| Registry | `src/data/methodsData.ts` | Re-exports three methods; `BUILTIN_METHODS` same three |
| Types | `src/types/cube.ts` | `AlgCase`, `AlgMethod`, `MethodStep` |
| Badges | `detectAlgBadges(primaryAlg)` | Runtime; not stored |

Steps (`CFOP_STEPS`): `cross`, `f2l`, `oll`, `pll`.

## Generated JSON (committed)

| File | Cases | Alts | `is2Look` |
|------|------:|-----:|-----------|
| `oll-2look.json` | 10 | 7 | yes |
| `pll-2look.json` | 6 | 5 | yes |
| `oll-full.json` | 57 | 41 | absent |
| `pll-full.json` | 21 | 34 | absent |
| **LL total** | **94** | **87** | |

`verify-cfop.mjs` asserts those four lengths. Parse count 94+87 = **181** variations (PR #40 body); that is parseability, not alt semantics.

Fields present: `id`, `name`, `category`, `subcategory`, `group`, `primaryAlg`, `alternativeAlgs`, `probability`, `description`, `why` (+ `is2Look` on 2-Look files).

**HEAD UI:** trains/plays **primaryAlg only**. `alternativeAlgs`, `tips`, and `probability` are pipeline/verify data — never rendered. `why` appears on flashcard back only; Reference search can match `why` but does not display it. `description` appears in fullscreen Dialog only.

---

## Hand-authored Cross / F2L (samples, not libraries)

**Cross — 1 case**

| id | primaryAlg | Status |
|----|------------|--------|
| `cross-sample-1` | `D2 R F L B` | Open **#18**: `why` claims it builds a white cross; audit says the alg **destroys** cross state. Not in `verify:algs` scope. Has `topGrid`/`borderColors`/`tips` |

**F2L — 4 “basic” highlights** (not the standard 41 cases):

| id | group | primaryAlg |
|----|-------|------------|
| `f2l-basic-1` | Connected Pair | `U R U' R'` |
| `f2l-basic-2` | White Up | `R U2 R' U' R U R'` |
| `f2l-basic-3` | Different Colors | `R U R'` |
| `f2l-basic-4` | Same Colors | `U' R U2 R' U2 R U' R'` |

All have `tips`, `why`, `topGrid`, `borderColors`. No `probability`, `alternativeAlgs`, or `setupMoves`. Not in `verify:algs`.

---

## 2-Look OLL IDs (stable)

| J Perm name | id | Display name | group |
|-------------|-----|--------------|--------|
| Dot Shape | `oll-2look-dot` | Dot (No Edges) | Edges (Look 1) |
| I-Shape | `oll-2look-line` | Line (Bar) | Edges (Look 1) |
| L-Shape | `oll-2look-lshape` | L-Shape (Small L) | Edges (Look 1) |
| Sune | `oll-2look-sune` | Sune | Corners (Look 2) |
| Antisune | `oll-2look-antisune` | Anti-Sune | Corners (Look 2) |
| H | `oll-2look-h` | H Case (Double Sune) | Corners (Look 2) |
| Pi | `oll-2look-pi` | Pi (Bruno) | Corners (Look 2) |
| U | `oll-2look-headlights` | U Case (Headlights) | Corners (Look 2) |
| T | `oll-2look-chameleon` | T Case (Chameleon) | Corners (Look 2) |
| L | `oll-2look-bowtie` | L Case (Bowtie) | Corners (Look 2) |

Open content bugs (tracker, unfixed at HEAD): **#16** L-shape hold vs alg; **#17** Anti-Sune / Headlights AUF vs description.

## 2-Look PLL IDs

| J Perm name | id | Display name | group | probability at HEAD |
|-------------|-----|--------------|--------|---------------------|
| Headlights | `pll-2look-tperm` | Headlights (T Permutation) | Corners (Look 1) | **4/5** |
| Diagonal | `pll-2look-yperm` | Diagonal (Y Permutation) | Corners (Look 1) | **1/5** |
| PLL (Ua) | `pll-2look-ua` | Ua Permutation | Edges (Look 2) | 1/3 |
| PLL (Ub) | `pll-2look-ub` | Ub Permutation | Edges (Look 2) | 1/3 |
| PLL (H) | `pll-2look-hperm` | H Permutation | Edges (Look 2) | 1/12 |
| PLL (Z) | `pll-2look-zperm` | Z Permutation | Edges (Look 2) | 1/6 |

**#19** open: corner probs `4/5` and `1/5` are a **conditional** (headlights) convention; edges are unconditional. Later WIP proposes `2/3` and `1/6` — **not shipped**.

## Full OLL / PLL

- Full OLL: `oll-1` … `oll-57`. **15 groups** (JSON strings): Awkward Shape, Big Lightning Bolt, C Shape, Corners Oriented, Cross, Dot, Fish Shape, I Shape, Knight Move Shape, P Shape, Small L Shape, Small Lightning Bolt, Square Shape, T Shape, W Shape. `why` is **group-level template**, not per-case (**#11**). J Perm `prob` map: 4→1/54, 2→1/108, 1→1/216.
- Full PLL IDs: `pll-aa`, `pll-ab`, `pll-e`, `pll-f`, `pll-ga`–`pll-gd`, `pll-h`, `pll-ja`, `pll-jb`, `pll-na`, `pll-nb`, `pll-ra`, `pll-rb`, `pll-t`, `pll-ua`, `pll-ub`, `pll-v`, `pll-y`, `pll-z`.
- Full PLL groups: Adjacent Corners, Diagonal Corners, G Perms, Edges Only. Prob map: 4→1/18, 2→1/36, 1→1/72.
- `pll-e`: `group = "Diagonal Corners"` (`PLL_META` / `01ca3a1` regen). Description is generic: “E Permutation case. Permutes last layer pieces…” — same template as every Full PLL description. Tracker #2 later flags possible adjacent simulation — **not re-verified here**.

---

## Pipeline (HEAD)

Upstream (unpinned at HEAD):

- `https://jperm.net/lib/2lookoll.js`
- `https://jperm.net/lib/2lookpll.js`
- `https://jperm.net/lib/oll.js`
- `https://jperm.net/lib/pll.js`

```
jperm.net/lib/*.js
  → fetch + vm → algsetAlgs[]
  → transformers (meta tables + IDs)
  → applyAlgRules() in rules.mjs
  → validateAlg() KPuzzle (parseability)
  → exporter → generated JSON
```

### Rules (`applyAlgRules`)

1. `formatWCARule` — `cubing/alg` canonical string.
2. `balanceRotationsRule` — try a **single** y/x/z suffix so CENTERS = identity. Later #41: too narrow for many **alternatives**.
3. `alignEdgesOnlyAUFRule` — Z/H/Ua/Ub (+ 2-Look): AUF so corners identity + zero ori.
4. `alignAdjacentCornerAUFRule` — adjacent 2-swap perms: Full PLL `ja`, `jb`, `ra`, `rb`, `t`, `f`; 2-Look PLL `Headlights` / ids containing `tperm`. AUF until exactly 2 fixed top corners.

Replaces hand `CANONICAL_OVERRIDES` from the unsquashed #40 branch (`f81e04e`). Overrides map is **not** at HEAD (#42 later).

### Transform meta

- 2-Look: rich `OLL_2LOOK_META` / `PLL_2LOOK_META` (ids, copy, sort).
- Full OLL: `why` = 15 group templates (`OLL_GROUP_EXPLANATIONS`).
- Full PLL: `PLL_META` per letter; `description` generic.
- Unknown J Perm names: slug id + generic copy.

Post-#40, **LL copy fixes belong in `transformers.mjs`**, not in JSON by hand. Cross/F2L remain `cfopData.ts`.

---

## Trainer deck IDs (derived)

`getDecks` groups LL cases by `subcategory`, slugifies:

| Method | Typical non-bookmark decks |
|--------|----------------------------|
| `cfop-4look` | `2-look-oll`, `2-look-pll`, `all` |
| `cfop-3look` | `2-look-oll`, `full-pll`, `all` |
| `cfop-2look` | `full-oll`, `full-pll`, `all` |

`getDeckForStep`: `oll` → `2-look-oll` except `cfop-2look` → `full-oll`; `pll` → `2-look-pll` only on `cfop-4look`, else `full-pll`; `bookmarked` → `bookmarks`; cross/f2l → `all` (no dedicated decks).

---

## Removed method IDs (never had cases)

| id | UI stub | Registry entry | Removed |
|----|---------|----------------|---------|
| `roux` | `26359fe` (Aug 30, Coming Soon badge) | PR #1 / `4652d7f` (`cases: []`) | `aef759e` |
| `zz` | same | same | `aef759e` |
| `2x2` | same | same | `aef759e` |

---

## Coverage vs learner expectation

| Area | Ships | Typical expectation |
|------|-------|---------------------|
| Cross | 1 bad sample | Insertion set + inspection |
| F2L | 4 basics | 41 cases / split categories |
| Full OLL | 57 algs, group `why` | Per-case recognition + tips |
| Full PLL | 21 + perm `why` | G-perm recognition, AUF tables |
| Tips | Cross/F2L in JSON only (never rendered) | LL tips existed pre-pipeline |
| Alternative algs | verify/ingest only | Users cannot see #15/#41 alt-rotation issues in app |
| Setup field | unused | Inverse is runtime-only |
| Other methods | removed empty stubs | Never shipped content |

## npm scripts

```
"sync:algs": "node scripts/sync-algorithms.mjs"
"verify:algs": "node scripts/verify-cfop.mjs"
```

This spec merge did **not** execute `verify:algs`. Claims about pass/fail come from script source, not a fresh run.

## Historical data debt (already fixed on main before/at #40)

| Problem | When fixed on main |
|---------|--------------------|
| No Full OLL; Full PLL incomplete (**16 entries including spurious `pll-w`** — 15 canonical + duplicate W; missing h/t/ua/ub/y/z) | Pipeline `850768c`; `pll-w` removed `a1c877e` |
| Runtime J Perm scrape `fetchThirdPartyAlgData` | Removed `5f5c11a` |
| Hand AUF / Z-perm / rotation nits | `62faed8`, `dadd0c8`, `162dd4d` then regen |

## Later WIP (not inventory at HEAD)

Unmerged branches add: 4 verified cross cases (21→24 4-look), VisualCube-only types (drop `topGrid`), `upstream.lock.json`, empty `ALGORITHM_OVERRIDES`, broader rotation search, hold-position copy. Treat as **after window**.
