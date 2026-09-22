# Task: Issue #57 — Method, Deck, and URL Identity Fix

**Branch:** `fix/issue-57-method-deck-identity`
**Issue:** https://github.com/Shangmin-Chen/cube/issues/57
**Spec Date:** 2026-09-22

---

## Problem Summary

Three bugs where the method/deck/step identity disagrees:

1. **`getDecks()` "All Algorithms" label lies** — `label: 'All Algorithms'` maps to `id: 'all'` but the deck only contains OLL+PLL cases (last-layer), not Cross/F2L. This is a lie for every CFOP method.
2. **"Train in Flashcards" CTA from Cross/F2L navigates to LL-only** — `getDeckForStep('cross' | 'f2l')` finds no matching subcategory deck and falls back to `'all'` (the LL-only deck).
3. **Each method registered twice** — `methodsData.ts` re-exports `CFOP_4LOOK_METHOD`, `CFOP_3LOOK_METHOD`, `CFOP_2LOOK_METHOD` into `BUILTIN_METHODS`. `algService.ts` then registers the three methods directly from `cfopData` AND also spreads `BUILTIN_METHODS` into the same `Map`. Every method is set twice.
4. **(P1) URL method not in route** — `AlgReferenceTab` stores `selectedMethod` as React state, not URL params. If `routeStep` is invalid, it falls back to `steps[0]` without calling `navigate`.
5. **(P1) `getSteps(AlgCase[])` ignores its array argument** — When passed an `AlgCase[]`, it falls back to `CFOP_4LOOK_METHOD` for the step pipeline instead of inferring from the array.

---

## Acceptance Criteria (for this PR)

### ✅ P0 — In Scope

| # | Criterion | Status |
|---|-----------|--------|
| P0-1 | "All Algorithms" label does NOT appear when the deck only contains OLL+PLL. Label corrected to `'Last Layer Algorithms'` | TODO |
| P0-2 | "Train in Flashcards" CTA from a Cross/F2L step is either correctly routed to a non-LL deck OR hidden/disabled | TODO |
| P0-3 | Each method is registered exactly once in `METHOD_REGISTRY` | TODO |

### ✅ P1 — In Scope

| # | Criterion | Status |
|---|-----------|--------|
| P1-4 | Invalid `routeStep` in `AlgReferenceTab` causes `navigate` to the canonical step URL | TODO |
| P1-5 | `getSteps(AlgCase[])` infers the method from the array (via subcategory probing) instead of always falling back to `CFOP_4LOOK_METHOD` | TODO |

### ❌ Deferred — Out of Scope

- Full unified catalog / canonical ID merging for overlapping 2-look and full OLL/PLL cases
- Roux/ZZ registry support  
- `<Link>` vs `<button onClick>` in Navbar
- Adding `method` to the `/algs/:step` URL as a route param

---

## Implementation Plan

### Fix 1: Rename "All Algorithms" → "Last Layer Algorithms" in `getDecks()` (algService.ts)

**File:** `src/services/algService.ts`, line 191

Change:
```ts
{ id: 'all', label: 'All Algorithms', cases: llCases }
```
To:
```ts
{ id: 'all', label: 'Last Layer Algorithms', cases: llCases }
```

Also update the JSDoc above `getDecks()` to document the LL-only scope.

### Fix 2: Disable/hide CTA for Cross/F2L in `AlgReferenceTab` (AlgReferenceTab.tsx)

**File:** `src/components/AlgReferenceTab.tsx`, lines 331–342

The "Train in Flashcards" CTA should be disabled (or hidden) when `activeStep` is `'cross'` or `'f2l'`. Since there are no trainer decks for those steps, we should:
- Add a computed `canTrainStep` boolean that is `false` for `'cross'` and `'f2l'` and `'bookmarked'` when there are no bookmarks.
- Render the button as `disabled` with a tooltip when `canTrainStep` is false.

### Fix 3: Remove duplicate method registration (algService.ts)

**File:** `src/services/algService.ts`, line 15

Change:
```ts
[CFOP_4LOOK_METHOD, CFOP_3LOOK_METHOD, CFOP_2LOOK_METHOD, ...BUILTIN_METHODS].forEach(...)
```
To (use only BUILTIN_METHODS, which already exports the same three methods):
```ts
BUILTIN_METHODS.forEach(...)
```

Remove direct imports of the three CFOP methods from `cfopData` in `algService.ts` (they come in via `BUILTIN_METHODS` from `methodsData`).

### Fix 4: Canonicalize invalid routeStep URL in AlgReferenceTab

**File:** `src/components/AlgReferenceTab.tsx`, lines 43–48

When `routeStep` is invalid, after computing `activeStep` as the fallback, call `navigate` to correct the URL:
```tsx
useEffect(() => {
  if (routeStep && !isValidStep(routeStep, selectedMethod, bookmarkedIds)) {
    navigate(`/algs/${steps[0]?.id || 'cross'}`, { replace: true });
  }
}, [routeStep, selectedMethod, bookmarkedIds, steps]);
```

### Fix 5: Fix `getSteps(AlgCase[])` to infer method from array

**File:** `src/services/algService.ts`, lines 89–95

When `methodOrCases` is an `AlgCase[]`, instead of always falling back to `CFOP_4LOOK_METHOD`, infer the method by looking at subcategories:
```ts
} else {
  // Infer method from cases: Full OLL → 2-look, Full PLL → 3-look, else 4-look
  if (methodOrCases.some(c => c.subcategory === 'Full OLL')) {
    method = getMethod('cfop-2look');
  } else if (methodOrCases.some(c => c.subcategory === 'Full PLL')) {
    method = getMethod('cfop-3look');
  } else {
    method = getMethod('cfop-4look');
  }
  cases = methodOrCases;
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/services/algService.ts` | Fixes 1, 3, 5: rename "All Algorithms", remove duplicate registration, fix getSteps array branch |
| `src/components/AlgReferenceTab.tsx` | Fixes 2, 4: disable CTA for Cross/F2L, canonicalize URL |

---

## Verification

Post-implementation, run:
```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```

All must pass with 0 errors and 0 warnings.
