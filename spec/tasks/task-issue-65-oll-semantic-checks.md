# Task: Issue #65 — OLL Orientation Invariant & Misleading Success Log Fix

**Branch:** `fix/issue-65-oll-semantic-checks`  
**Issue:** [#65](https://github.com/Shangmin-Chen/cube/issues/65) — "Validated" means parseable, not "this alg is that named case"; OLL has no semantic checks  
**Scope:** `scripts/verify-cfop.mjs` only. No frontend source files modified.

---

## Problem Summary

`scripts/verify-cfop.mjs` performs two tasks:
1. **Parse/simulate** — every alg in every dataset is passed through `kpuzzle.algToTransformation()`. This only proves the string is a legal move sequence.
2. **Semantic invariants (partial)** — PLL centers identity, edges-only PLL corners identity, Look-1 OLL edge orientation, Look-1 hold description match.

**What is missing:**

| Gap | Impact |
|-----|--------|
| No OLL orientation invariant for Look-2 corners (2-Look OLL) | A T-perm stored on `oll-2look-sune` would pass |
| No OLL orientation invariant for Full OLL (57 cases) | Any legal sequence labeled an OLL case passes |
| No PLL permutation identity ("named case") check | A T-perm stored on `pll-y` passes |
| Success log says "all semantic invariant checks passed" even when OLL was not checked | Misleading CI signal |

---

## Solution Design

### Invariant 7: OLL Orientation — Look-2 Corners (2-Look OLL)

**Scope:** `oll-2look.json` cases with `group === 'Corners (Look 2)'` (7 cases).

**Mechanism:** After the cross (Look-1) the top edges are all oriented; a Look-2 alg must orient all top corners. To verify a named alg is the correct OLL solve:

1. Compute `casePattern = defaultPattern().applyAlg(inverse(primaryAlg))` — this is the scrambled state the algorithm is meant to solve.
2. Apply `alg` to `casePattern`: `resultPattern = casePattern.applyAlg(alg)`.
3. Assert all top-corner orientations equal 0 (`CORNERS.orientation[0..3]` all zero).

**Why modulo y-rotation?** The Look-1 step guarantees edges are oriented. The Look-2 step starts with an arbitrary AUF. We allow `y`, `y'`, `y2` rotation of the result (same as Look-1 treatment) so that an AUF-shifted alternative still passes.

**Negative control:** A Look-1 alg (edge-orienting) applied to a Look-2 case must fail (corners not all oriented after the cross's edges are in the right spots — the cases are structurally different).

### Invariant 8: OLL Orientation — Full OLL (57 cases)

**Scope:** `oll-full.json` — all 57 full OLL cases.

**Mechanism:** For a full OLL alg, `inverse(primaryAlg)` captures the case state. Applying any valid alg for that case to that state must leave:
- All U-face corner orientations = 0 (`CORNERS.orientation[0..3]` all zero)
- All U-face edge orientations = 0 (`EDGES.orientation[0..3]` all zero)

Both conditions must hold simultaneously — full OLL must orient *both* edges and corners.

**Y-rotation tolerance:** Same as Look-1 — allow y/y'/y2 on the result.

**Negative control:** Applying a Look-1 edge-only alg to a Full OLL case (which has mixed edge+corner misorientation) must fail the combined corner+edge check.

### Invariant 9: PLL Permutation — Named Case Identity

**Scope:** All PLL primaries (`pll-full.json` + `pll-2look.json`).

**Mechanism:** Each PLL alg, when applied to a solved cube, must produce the same corner+edge permutation as the named case's primary. Specifically:
- Compute reference transformation `refTransf = kpuzzle.algToTransformation(primaryAlg)` for each case.
- For every alternative `alt`, compute `altTransf = kpuzzle.algToTransformation(alt)`.
- `altTransf` must be a y-rotation composition of `refTransf` (i.e. `refTransf composed with y^k` for k in {0,1,2,3}).

This ensures a T-perm string on `pll-y` fails: the permutations differ.

**Note:** The existing centers-identity check (Invariant 1) already ensures no net whole-cube rotation. The permutation comparison is then an exact match check (or modulo y since some alts use a different AUF).

### Fix Misleading Success Log

Change the final line from:
```
--- All verifications and semantic invariant checks passed! ---
```
to a summary that enumerates what was actually checked:
```
--- All verifications passed (parse-sim + 9 semantic invariants: PLL centers/corners, Look-1 edges, Look-2 corners, Full OLL orientation, PLL permutation) ---
```

The intermediate "All PLL algorithms preserve CENTERS…" message is acceptable as-is; only the global claim is misleading.

---

## File Changes

| File | Change |
|------|--------|
| `scripts/verify-cfop.mjs` | Add Invariant 7 (Look-2 OLL corners), Invariant 8 (Full OLL), Invariant 9 (PLL permutation identity); fix success log |

No other files modified.

---

## Acceptance Criteria (from issue)

- [ ] A legal-but-wrong primary (e.g. a T-perm string on `pll-y`) fails `verify:algs`.
- [ ] At least one OLL orientation invariant runs — Look-2 corners scoped to `Corners (Look 2)` group; Full OLL scoped to `oll-full.json`.
- [ ] The script output does not say "all semantic invariant checks passed" unless OLL was actually checked.
- [ ] All 5 verification suites pass with 0 errors and 0 warnings after the change.
- [ ] `npm run build` passes.
