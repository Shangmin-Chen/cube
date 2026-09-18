# Algorithms and Methods

Canonical algorithms and method specifications at commit `5157ef2` on `main`. Verified against `src/data/generated/*.json`, `src/data/cfopData.ts`, and repository test scripts.

---

## Look-Count Naming System

**N-Look LL** refers to the number of **Last Layer recognition steps within CFOP**, not the total number of steps to solve the entire cube.

| Method ID | Display Name | LL Recognition Steps | OLL Dataset | PLL Dataset |
|-----------|--------------|----------------------|-------------|-------------|
| `cfop-4look` | 4-Look LL (Beginner CFOP) | 4 looks | 2-Look OLL (edges then corners) | 2-Look PLL (corners then edges) |
| `cfop-3look` | 3-Look LL (Intermediate CFOP) | 3 looks | 2-Look OLL | Full PLL (1 look) |
| `cfop-2look` | 2-Look LL (**Full CFOP**) | 2 looks | Full OLL (1 look) | Full PLL (1 look) |

> [!IMPORTANT]
> `cfop-2look` is the **advanced** Full CFOP tier (57 OLL + 21 PLL). Beginner CFOP is named **`cfop-4look`**.

---

## Case Counts at HEAD

| Method | Cross | F2L | OLL | PLL | Total |
|--------|------:|----:|----:|----:|------:|
| `cfop-4look` | 4 | 4 | 9 | 7 | **24** |
| `cfop-3look` | 4 | 4 | 10 | 21 | **39** |
| `cfop-2look` | 4 | 4 | 57 | 21 | **86** |

- **Cross & F2L:** Authored in `src/data/cfopData.ts` and shared across all three CFOP tiers.
- **Generated Last Layer:** Committed in `src/data/generated/*.json`.

---

## Cross & F2L Datasets

### Cross — 4 Verified Beginner Insertions

Authored in `src/data/cfopData.ts` and verified against physical cube simulations in `scripts/verify-cross-cases.mjs`:

| Case ID | Name | Scenario | Primary Algorithm |
|---------|------|----------|-------------------|
| `cross-top-white-up` | Top Layer (White Facing Up) | DF edge at UF slot, white facing U | `F2` |
| `cross-top-white-side` | Top Layer (White Facing Side) | DF edge at UR slot, white facing R | `R' F R` |
| `cross-middle-fr` | Middle Layer Insertion | DF edge at FR middle slot | `D R' D'` |
| `cross-bottom-flipped` | Bottom Layer (Flipped Edge) | DF edge at DF slot, flipped orientation | `D R D' F` |

### F2L — 4 Fundamental Pair Insertions

Core intuitive insertions for beginner-intermediate learners:

| Case ID | Name | Group | Primary Algorithm |
|---------|------|-------|-------------------|
| `f2l-basic-1` | Connected Pair | Connected Pair | `U R U' R'` |
| `f2l-basic-2` | White Up | White Up | `R U2 R' U' R U R'` |
| `f2l-basic-3` | Different Colors | Different Colors | `R U R'` |
| `f2l-basic-4` | Same Colors | Same Colors | `U' R U2 R' U2 R U' R'` |

---

## Generated Last Layer Datasets (`src/data/generated/*.json`)

| Dataset File | Cases | Variations / Alts | `is2Look` |
|--------------|------:|------------------:|-----------|
| `oll-2look.json` | 10 | 7 | `true` |
| `pll-2look.json` | 6 | 5 | `true` |
| `oll-full.json` | 57 | 41 | absent |
| `pll-full.json` | 21 | 34 | absent |
| **Total** | **94** | **87** (181 total variations) | |

### 2-Look OLL Cases & Orientations

- **Edges (Look 1):** Dot (`oll-2look-dot`), Line (`oll-2look-line`), L-Shape (`oll-2look-lshape`).
  - *Invariant:* L-Shape hold is oriented at 3 and 6 o'clock (UR and UB slots).
- **Corners (Look 2):** Sune (`oll-2look-sune`), Anti-Sune (`oll-2look-antisune`), H (`oll-2look-h`), Pi (`oll-2look-pi`), Headlights (`oll-2look-headlights`), Chameleon (`oll-2look-chameleon`), Bowtie (`oll-2look-bowtie`).

### 2-Look PLL Cases & Probabilities

- **Corners (Look 1):**
  - Headlights / T-Perm (`pll-2look-tperm`): Probability **2/3** (4/6)
  - Diagonal / Y-Perm (`pll-2look-yperm`): Probability **1/6**
  - Skip: Probability **1/6** (Sum = 1)
- **Edges (Look 2):**
  - Ua Permutation (`pll-2look-ua`): Probability **1/3** (4/12)
  - Ub Permutation (`pll-2look-ub`): Probability **1/3** (4/12)
  - H Permutation (`pll-2look-hperm`): Probability **1/12**
  - Z Permutation (`pll-2look-zperm`): Probability **1/6** (2/12)
  - Skip: Probability **1/12** (Sum = 1)

---

## Ingestion Pipeline Architecture

Upstream algorithms originate from J Perm algorithm sets:
- Ingestion script: `scripts/sync-algorithms.mjs`
- Upstream SHA-256 lockfile: `scripts/ingest/upstream.lock.json`
- Verification: `scripts/verify-upstream-pin.mjs`

### Normalization & Balancer Rules

1. `formatWCARule`: Formats moves into canonical WCA notation via `cubing/alg`.
2. `balanceRotationsRule`: Searches half-turns and rotation pairs to eliminate whole-cube regrips.
3. `alignEdgesOnlyAUFRule`: Normalizes U-layer alignments for pure edge perms (Z, H, Ua, Ub).
4. `alignAdjacentCornerAUFRule`: Normalizes U-layer alignments for adjacent corner swaps.
5. Semantic Invariants: Enforced across both primaries and alternative variations.
