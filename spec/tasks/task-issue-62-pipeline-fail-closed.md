# Task: Pipeline Fail-Closed Fix (Issue #62)

**Branch:** `fix/issue-62-pipeline-fail-closed`
**Scope:** `scripts/pipeline/` only — no frontend source files modified.

---

## Problem Summary

The sync pipeline's rule engine silently fabricates output when it encounters:

1. **Unknown upstream case names** — `OLL_2LOOK_META` and `PLL_2LOOK_META` fallback
   branches in `transformers.mjs` invent slugged IDs, generic descriptions, and
   fabricated probabilities. `idOrder.indexOf` returns `-1` for unknown IDs so
   they sort first instead of failing. Full PLL uses `rawKey` directly as an id
   suffix so any upstream rename silently emits a new ID.

2. **AUF/rotation rules that fail open** — `balanceRotationsRule`,
   `alignEdgesOnlyAUFRule`, and `alignAdjacentCornerAUFRule` all fall back to
   returning the un-corrected `formatted` string when no candidate rotation/AUF
   matches. The pipeline keeps running and prints "All cases validated
   successfully."

3. **`formatWCARule` swallows parse errors** — logs a warning but returns the
   raw string instead of throwing, so later validation has no `caseId` in its
   error surface.

4. **Full OLL ID invention** — `Number(item.name)` is never validated with
   `Number.isFinite`, so a non-numeric upstream name yields `oll-NaN`.

---

## Fix Intent

### `scripts/pipeline/rules.mjs`

1. **`formatWCARule`** — remove `try/catch` swallow; let parse errors propagate
   naturally (or throw with a message including `algStr`).

2. **`balanceRotationsRule`** — after searching single and double rotations, if
   still not identity, `throw new Error(...)` with the algorithm string. Do NOT
   return `formatted` silently.

3. **`alignEdgesOnlyAUFRule`** — after exhausting AUF candidates, `throw` with
   the algorithm string and rule name. Do NOT return `formatted`.

4. **`alignAdjacentCornerAUFRule`** — same: throw when no AUF candidate yields
   `fixedCorners === 2`.

### `scripts/pipeline/transformers.mjs`

5. **`transform2LookOLL`** — replace the `|| { id: ..., ... }` fallback with an
   explicit `throw new Error(...)` that names the unknown upstream case.

6. **`transform2LookPLL`** — same: throw on unknown upstream name instead of
   fabricating a fallback meta object.

7. **`transformFullOLL`** — guard `Number(item.name)` with `Number.isFinite`;
   throw if the name is not a valid finite integer.

8. **`transformFullPLL`** — replace the `PLL_META[rawKey] || { ... }` fallback
   with an explicit throw for unknown keys.

---

## Files to Modify

- `scripts/pipeline/rules.mjs`
- `scripts/pipeline/transformers.mjs`

---

## Verification Checklist (all must pass 0 errors / 0 warnings)

```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```

---

## Acceptance Criteria

- Unknown upstream case names abort ingest with a clear error message (case name
  included), not silently produce an invented ID.
- AUF/rotation rules throw when no valid candidate is found, instead of
  returning the uncorrected algorithm.
- `formatWCARule` no longer swallows parse errors.
- Full OLL throws on non-finite case numbers.
- All verification suites pass at 0 errors and 0 warnings after the change.
