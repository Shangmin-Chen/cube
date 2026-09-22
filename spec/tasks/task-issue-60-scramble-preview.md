# Task: Fix Timer Scramble Preview (Issue #60)

**Issue:** [#60 — Timer scramble preview is the algorithm-practice 3D widget, not a scramble visualizer](https://github.com/Shangmin-Chen/cube/issues/60)
**Branch:** `fix/issue-60-scramble-preview`
**Source findings:** Code-quality review 2026-09-13, HEAD `850768c`, findings U-07, U-08, U-09, D-07, X-11, X-12.

---

## Problem Summary

### 1. Timer shows pedagogy chrome (U-07)

`TimerTab.tsx` renders `<RubiksCube3D initialAlgorithm={scramble} mode="scramble" autoPlay={false} showControls={false} />`.

`showControls={false}` hides the bottom control buttons (lines 819–896), but the **token bar** (lines 762–817) is not gated on `showControls` — it renders whenever `moves.length > 0`. In scramble mode, this shows the "Phase 2: Case Setup ➔ Solved" header label and individual move token buttons. That is pedagogy chrome that does not belong on the timer's scramble preview.

**Fix:** Gate the token bar render on `showControls` (or add a separate `showTokenBar` gate). Since `showControls={false}` is already what `TimerTab` passes, wrapping the token bar in `{showControls && moves.length > 0 && ...}` is the minimal targeted fix.

### 2. R3 move parses as +90° instead of 270° (D-07, X-12)

`pll-full.json` has `R3` in a Ub alternative. In `getMoveParameters` (`RubiksCube3D.tsx` lines 61–145), the suffix detection only checks `'` (isPrime) and `2` (isDouble). `R3` falls through as neither, so `angle = π/2` (90°), not `3π/2` (270°, same as `R'`).

Similarly, in `invertMoveString`'s fallback branch (`cubeLogic.ts` lines 40–53), the map function only handles `'` and `2`. For `R3` it strips the `3` and returns `R'` — but the forward direction (`R3` = 270°) is lost for the fallback.

**However:** `cubeLogic.ts`'s primary code path uses `cubing/alg`'s `Alg` class to invert, which correctly handles `R3` (cubing.js normalizes it to `R'`). The fallback only runs on parse errors. The `Alg` class also handles `parseMoveString` — so `R3` in a well-formed alg string is already expanded correctly by `cubing/alg`.

**Fix needed:**
- `getMoveParameters` in `RubiksCube3D.tsx`: add `isTriple` check (`cleanMove.includes('3')`), angle = `3π/2` (same as prime), sign determined by face orientation.
- `invertMoveString` fallback in `cubeLogic.ts`: handle `3` suffix → invert of 270° is 90° = plain move (`baseMove` without suffix).

---

## Changes Required

### A. `src/components/RubiksCube3D.tsx`

**Change 1 — Hide token bar in `showControls={false}` mode:**
- Line 763: Change `{moves.length > 0 && (` to `{showControls && moves.length > 0 && (`

**Change 2 — Fix `R3` (and any face `X3`) in `getMoveParameters`:**
- After line 70 (`const isDouble = cleanMove.includes('2');`), add:
  ```ts
  const isTriple = cleanMove.includes('3');
  ```
- Line 72: Change angle computation:
  ```ts
  let angle = isDouble ? Math.PI : isTriple ? (3 * Math.PI) / 2 : Math.PI / 2;
  ```
  (No prime modifier needed: `X3` = 270° CW = same direction as `X` but triple; prime of 270° = 90°.)
  - The existing `if (isPrime) angle = -angle;` line remains — `X3'` would be `-(3π/2)` = equivalent to `X'` in the other direction, which is correct.

### B. `src/utils/cubeLogic.ts`

**Fix fallback branch of `invertMoveString` for `3` suffix:**
- In the `reversed.map(...)` callback, after `if (isDouble) return ...`:
  ```ts
  const isTriple = move.includes('3');
  ...
  if (isTriple) return baseMove; // invert of 270° CW = 90° CW
  ```
- Update `baseMove` to strip `3` as well: `const baseMove = move.replace(/['23]/g, '');`

---

## Acceptance Criteria

- [ ] Timer preview shows the cube after applying the displayed scramble — no "Phase 1/2" token bar, no Setup/Solve toggle, no playback controls.
- [ ] `R3` in an algorithm token animates 270° (equivalent to `R'`), not 90°.
- [ ] `invertMoveString('R3')` in the fallback path returns `['R']` (invert of 270° CW = 90° CW).
- [ ] All verification scripts pass with 0 errors and 0 warnings.
- [ ] Build passes.

---

## Out of Scope (document as follow-up)

- Fullscreen second WebGL context (U-08) — complex, deferred.
- OrbitControls drag-to-rotate (X-11) — feature, not bug.
- 2D/3D color palette unification (U-09) — cosmetic, deferred.
- `handleScrambleNew` in `RubiksCube3D` that generates its own scramble ignoring the parent (the Scramble button in `showControls` area) — not shown in timer since `showControls={false}`.
