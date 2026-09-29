# Task: Issue #65 — OLL Semantic Checks Remediation & Non-Tautological Invariants

**Branch:** `fix/issue-65-oll-semantic-checks`  
**Issue:** [#65](https://github.com/Shangmin-Chen/cube/issues/65) — "Validated" means parseable, not "this alg is that named case"; OLL has no semantic checks  
**Scope:** `scripts/verify-cfop.mjs`, `tests/integration/cfopInvariants.test.ts`, and `spec/tasks/task-issue-65-oll-semantic-checks.md`.

---

## Problem Summary & Root Cause Analysis

PR #83 introduced Invariants 7, 8, and 9 to address Issue #65, but audit revealed critical defects:

1. **Mathematical Tautology for Primaries in Invariants 7 & 8:**
   The verification logic defined:
   ```javascript
   const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
   const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);
   const res = casePattern.applyTransformation(algTransf);
   ```
   For `alg === c.primaryAlg`, this computes $X^{-1} \cdot X = I$ (the solved cube). By construction, all piece orientations on the identity pattern are $0$.
   Therefore, `res` trivially has top orientation $0$ for **any** move sequence (e.g. single move `R`, T-perm, or scrambled moves). The primary algorithm was never tested against its mathematical role of orienting pieces.
2. **Missing Negative Controls:**
   Negative controls promised in earlier task planning (rejecting Look-1 edge-flip algorithms on Look-2 corner cases, rejecting PLL algorithms on OLL cases) were omitted.
3. **Missing OLL F2L Preservation Invariant:**
   OLL algorithms must orient U-layer pieces while leaving the first two layers intact. F2L preservation (Corners 4..7 and Edges 4..11 having identity permutation and $0$ orientation delta) was never verified.
4. **Missing Negative Control in `scripts/verify-cfop.mjs` for Invariant 9:**
   The integration test verified that T-perm fails diagonal swap, but `scripts/verify-cfop.mjs` omitted the negative control.
5. **Misleading Success Log Unfixed:**
   `scripts/verify-cfop.mjs` line 464 still logged `--- All verifications and semantic invariant checks passed! ---` rather than the enumerated breakdown.

---

## Remediation Design

### 1. Preserve F2L Invariant (All 67 OLL Cases, 115 Variations)

Every OLL algorithm (all 10 2-Look OLL cases and all 57 Full OLL cases, including primaries and alternatives) must leave the bottom two layers completely intact:
- `CORNERS.permutation.slice(4)` equals `[4, 5, 6, 7]`.
- `CORNERS.orientationDelta.slice(4)` equals `[0, 0, 0, 0]`.
- `EDGES.permutation.slice(4)` equals `[4, 5, 6, 7, 8, 9, 10, 11]`.
- `EDGES.orientationDelta.slice(4)` equals `[0, 0, 0, 0, 0, 0, 0, 0]`.

In addition, applying the algorithm to the case pattern must leave the bottom two layers intact:
`patternF2LIsIntact(res)` asserts that `CORNERS.pieces.slice(4)` and `EDGES.pieces.slice(4)` remain in solved positions with $0$ orientation.

### 2. Invariant 7: Look-2 OLL Corners (7 Cases, 11 Variations)

**Scope:** `oll-2look.json` cases where `group === 'Corners (Look 2)'`.

To eliminate the tautology, the check enforces three independent tiers:
1. **Case State Invariant (Setup):**
   In `casePattern = defaultPattern.applyTransformation(invert(primaryAlg))`:
   - Top edges are already oriented: `casePattern.patternData.EDGES.orientation.slice(0, 4).every(v => v === 0)`.
   - Top corners are NOT all oriented: `casePattern.patternData.CORNERS.orientation.slice(0, 4).some(v => v !== 0)`.
   - **Case Identity Discrimination:** The exact number of oriented top corners in `casePattern` must match the specific case geometry:
     - `'oll-2look-sune'`, `'oll-2look-antisune'`: exactly 1 corner oriented (3 misoriented).
     - `'oll-2look-h'`, `'oll-2look-pi'`: exactly 0 corners oriented (4 misoriented).
     - `'oll-2look-headlights'`, `'oll-2look-chameleon'`, `'oll-2look-bowtie'`: exactly 2 corners oriented (2 misoriented).
   > *Note on Mathematical Discrimination:* Because `casePattern` is defined as `invert(primaryAlg)`, `primaryAlg` solves its own setup by construction ($X^{-1} \cdot X = I$). Therefore, these case-state setup checks and alternative algorithm assertions are what provide load-bearing semantic discrimination for case identity.
2. **Algorithm Variation Intrinsic Properties:**
   For every variation (primary and alternatives):
   - Preserves top edge orientations: `algTransf.transformationData.EDGES.orientationDelta.slice(0, 4).every(v => v === 0)`.
   - Changes top corner orientations: `algTransf.transformationData.CORNERS.orientationDelta.slice(0, 4).some(v => v !== 0)`.
   - Preserves F2L: `f2lIsIntact(algTransf)`.
3. **Case Solution Invariant:**
   Applying `algTransf` to `casePattern`:
   - Result preserves F2L: `patternF2LIsIntact(res)`.
   - Result leaves all top corners oriented modulo y-rotations:
     There exists $y \in ['', y', y, y2]$ such that `pattern.patternData.CORNERS.orientation.slice(0, 4).every(v => v === 0)`.

### 3. Invariant 8: Full OLL (57 Cases, 98 Variations)

**Scope:** `oll-full.json` — all 57 cases.

1. **Case State Invariant (Setup):**
   In `casePattern = defaultPattern.applyTransformation(invert(primaryAlg))`:
   - At least one top piece is misoriented:
     `casePattern.patternData.EDGES.orientation.slice(0, 4).some(v => v !== 0) || casePattern.patternData.CORNERS.orientation.slice(0, 4).some(v => v !== 0)`.
   - **Case Identity Discrimination:** Case-group specific edge orientations are checked:
     - Dot cases (`'oll-1'`, `'oll-2'`, `'oll-3'`, `'oll-4'`): exactly 0 top edges oriented in `casePattern` (all 4 misoriented).
     - Cross cases (`'oll-21'` through `'oll-27'`): all 4 top edges oriented in `casePattern`.
   > *Note on Mathematical Discrimination:* As with Invariant 7, `primaryAlg` solves `casePattern` by construction on its own inverse setup. Load-bearing discrimination is provided by setup-state piece orientation counts, alternative algorithm verification, and negative controls.
2. **Algorithm Variation Intrinsic Properties:**
   - Preserves F2L: `f2lIsIntact(algTransf)`.
3. **Case Solution Invariant:**
   Applying `algTransf` to `casePattern`:
   - Result preserves F2L: `patternF2LIsIntact(res)`.
   - Result leaves both top corners and top edges oriented modulo y-rotations:
     There exists $y \in ['', y', y, y2]$ such that both `CORNERS.orientation.slice(0, 4).every(v => v === 0)` and `EDGES.orientation.slice(0, 4).every(v => v === 0)`.

### 4. Negative Controls Suite

Automated verification must execute the following negative controls:
1. **Look-1 Algorithm on Look-2 Corner Case:**
   Applying a Look-1 alg (e.g. Line case `F R U R' U' F'`, which flips edges) to a Look-2 case (e.g. Sune `oll-2look-sune`):
   - Must fail edge preservation (`EDGES.orientationDelta.slice(0, 4).every(v => v === 0)` is `false`).
   - Must fail corner orientation on `casePattern` (corners not all oriented modulo y-rotations).
2. **PLL Algorithm on Look-2 Corner Case:**
   Applying a PLL alg (e.g. T-perm) to a Look-2 case (Sune):
   - Must fail corner orientation delta (`CORNERS.orientationDelta.slice(0, 4).some(v => v !== 0)` is `false`).
   - Must fail corner orientation on `casePattern` (corners not all oriented modulo y-rotations).
3. **PLL Algorithm Setup Check:**
   Inverting a PLL alg (T-perm) produces a state with no misoriented top pieces, failing the Full OLL case state invariant.
4. **PLL Algorithm on Full OLL Case Check:**
   Applying a PLL alg (T-perm) to the `oll-1` case pattern fails the full orientation solve (corners and edges are not fully oriented modulo y-rotations).
5. **PLL Diagonal Corner Swap Negative Control:**
   T-perm applied to diagonal corner swap check has no diagonal corner transpositions, failing the diagonal check.
6. **Look-1 Parity Negative Controls:**
   Both `verify-cfop.mjs` and `cfopInvariants.test.ts` test:
   - Dot setup + Line primary (fails)
   - Dot setup + Sune primary (fails)
   - Line setup + L-shape primary (fails)

### 5. Invariant 9: PLL Diagonal Corner Swap (5 Cases, 12 Variations)

Retain check for diagonal corner swap across `pll-y`, `pll-v`, `pll-na`, `pll-nb`, and `pll-2look-yperm`:
- Iterates over `getAllAlgs(c)` across all 5 cases (12 variations total, including primaries and alternatives).
- Asserts that every algorithm variation executes a diagonal corner swap (modulo AUF $U \in ['', 'U', 'U2', "U'"]$): exactly two corners moved and $|i - cp[i]| = 2$.
- Execute negative control in `scripts/verify-cfop.mjs` as well as `tests/integration/cfopInvariants.test.ts` (T-perm fails diagonal swap).

### 6. Success Log Alignment

Update final log in `scripts/verify-cfop.mjs` to reflect genuine invariants:
```text
--- All verifications passed (parse-sim + semantic invariants: PLL centers/corners/diagonal, OLL F2L/edges/corners, probability sums) ---
```

---

## File Changes & Function Signatures

### 1. `scripts/verify-cfop.mjs`

- **Helper Functions Added:**
  ```javascript
  /**
   * Asserts that an algorithm transformation leaves the bottom two layers (F2L) completely intact:
   * Corners 4..7 and Edges 4..11 must have identity permutation and 0 orientation delta.
   *
   * @param {import('cubing/puzzles').KTransformation} transf
   * @returns {boolean}
   */
  function f2lIsIntact(transf) { ... }

  /**
   * Asserts that a cube pattern has the bottom two layers (F2L) completely intact:
   * Corners 4..7 and Edges 4..11 must be in solved piece positions with orientation 0.
   *
   * @param {import('cubing/puzzles').KPattern} pattern
   * @returns {boolean}
   */
  function patternF2LIsIntact(pattern) { ... }

  /**
   * Asserts whether an algorithm executes a diagonal corner swap (modulo AUF).
   *
   * @param {any} kpuzzle
   * @param {string} algStr
   * @returns {boolean}
   */
  function isDiagonalCornerSwap(kpuzzle, algStr) { ... }

  /**
   * Asserts negative controls across Look-2 OLL, Full OLL, and PLL diagonal swap.
   *
   * @param {any} kpuzzle
   * @param {object[]} oll2Look
   * @param {object[]} allPllCases
   * @param {object[]} ollFull
   */
  function assertOllAndPllNegativeControls(kpuzzle, oll2Look, allPllCases, ollFull) { ... }
  ```
- **F2L Invariant Loop:**
  Iterate all 67 cases in `[...oll2Look, ...ollFull]` (115 variations), asserting `f2lIsIntact(transf)`.
- **Invariant 7 Block:**
  Assert Look-2 negative controls. Check setup state top edges oriented and corners misoriented. Check exact oriented corner counts (1 for Sune/Anti-Sune, 0 for H/Pi, 2 for Headlights/Chameleon/Bowtie). Check each variation preserves edges, changes corners, preserves F2L, and orients corners on `casePattern` modulo y-rotations.
- **Invariant 8 Block:**
  Check setup state has misoriented top pieces. Check Dot cases (0 edges oriented) and Cross cases (4 edges oriented). Check each variation preserves F2L and orients all top corners and edges on `casePattern` modulo y-rotations.
- **Invariant 9 Block:**
  Iterate over `getAllAlgs(c)` for all 5 diagonal PLL cases (12 variations) using `isDiagonalCornerSwap`. Assert T-perm fails diagonal swap check as a negative control.
- **Summary & Log:**
  Include F2L count and output non-misleading success string.

### 2. `tests/integration/cfopInvariants.test.ts`

- Add `f2lIsIntact`, `patternF2LIsIntact`, and `isDiagonalCornerSwap` helpers.
- Add test: `it('OLL F2L invariant: all 67 OLL algorithms leave bottom two layers intact', ...)` covering all 115 variations.
- Update `it('Invariant 3: Look-1 OLL alternatives solve the same case as their primary', ...)`:
  - Add parity negative control: Line setup + L-shape primary.
- Update `it('Invariant 7: Look-2 OLL corner algorithms orient all top corners', ...)`:
  - Add negative controls (Look-1 alg on Look-2 case fails edge preservation & corner solve; T-perm fails corner orientation delta & corner solve).
  - Add case setup checks (`EDGES` oriented, `CORNERS` misoriented, exact corner orientation counts).
  - Add variation checks (`EDGES` delta 0, `CORNERS` delta != 0, `f2lIsIntact`, `patternF2LIsIntact`, `cornersOriented`).
- Update `it('Invariant 8: Full OLL algorithms orient both top corners and top edges', ...)`:
  - Add negative controls (T-perm setup fails misoriented pieces check; T-perm fails OLL 1 orientation solve).
  - Add case setup check (misoriented top pieces, Dot cases 0 edges, Cross cases 4 edges).
  - Add variation checks (`f2lIsIntact`, `patternF2LIsIntact`, `fullyOriented`).
- Update `it('Invariant 9: Diagonal corner swap PLLs perform diagonal corner swap; T-perm on Y-perm fails', ...)`:
  - Iterate over `getAllAlgs(c!)` for all 5 cases (12 variations total).
  - Verify negative control: T-perm fails diagonal swap.

---

## Acceptance Criteria

- [x] Invariant 7 is non-tautological: asserts case setup orientation, exact oriented corner counts (1 for Sune/Anti-Sune, 0 for H/Pi, 2 for Headlights/Chameleon/Bowtie), algorithm orientation deltas, F2L preservation, and top corner orientation modulo y-rotations.
- [x] Invariant 8 is non-tautological: asserts case setup misorientation, group-specific edge orientation counts (Dot = 0, Cross = 4), F2L preservation, and top corner + edge orientation modulo y-rotations.
- [x] Invariant 9 verifies all 12 algorithm variations across all 5 diagonal PLL cases (`pll-y`, `pll-v`, `pll-na`, `pll-nb`, `pll-2look-yperm`), with T-perm negative control.
- [x] OLL F2L Invariant verifies all 67 OLL cases (115 variations) preserve corners 4..7 and edges 4..11.
- [x] Complete negative controls suite implemented in both `scripts/verify-cfop.mjs` and `tests/integration/cfopInvariants.test.ts`:
  - Look-1 line alg on Sune fails edge preservation and corner solve.
  - T-perm on Sune fails corner orientation delta and corner solve.
  - T-perm inverted setup fails Full OLL misorientation check.
  - T-perm on OLL 1 casePattern fails full orientation solve.
  - T-perm fails diagonal corner swap check.
  - Look-1 parity negative controls (Dot+Line, Dot+Sune, Line+L-shape).
- [x] `scripts/verify-cfop.mjs` success log explicitly enumerates all verified invariants.
- [x] `node scripts/verify-cfop.mjs` exits 0 with complete invariant reporting.
- [x] `npm test` passes 100% of unit and integration tests.
- [x] `npm run build` passes with zero TypeScript or Vite errors.
