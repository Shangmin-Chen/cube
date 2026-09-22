# Task: Fix Issue #54 — Trainer Session Skips Scoring, Round Summary Lies

**Branch:** `fix/issue-54-trainer-session-scoring`  
**Issue:** [#54](https://github.com/Shangmin-Chen/cube/issues/54)  
**Parent issue:** #2  
**Source finding IDs:** T-01, T-05, T-08, T-09, T-13, X-15

---

## Problem Summary

Four bugs in the trainer session state machine produce incorrect round summaries:

### Bug 1 — Navigation skips scoring (T-01)
`next()` / `prev()` in `useTrainerSession.ts` (lines 139–162) move `currentIndex` **without** updating `masteredIds`/`learningIds`. A user can arrow through all cards and receive a "You answered every algorithm accurately" summary when `masteredCount === 0`.

Root cause: `isRoundFinished` is only set by `applyCardOutcome()` via `advanceWithOutcome()`, and only `markMastered`/`markLearning` call that path. Free navigation bypasses it entirely, so there is no way to reach the summary except via grading — **but** the keyboard binding `→` is wired to `next()` which does advance the index without grading, and at the last card, `next()` hits the disabled branch gracefully, so the round never finishes via `next()` alone. The actual problem is subtler: the issue description confirms `next()` never updates the mastery sets, so unscored cards left behind cannot enter the review queue.

**Fix:** Treat `next()` on an unscored card as an implicit `'learning'` mark. Specifically, in `next()`, if the card at `currentIndex` has neither been mastered nor marked learning, implicitly mark it as `'learning'` before advancing. Use the existing `applyCardOutcome` path.

**Alternative considered (rejected):** Removing free navigation would require removing `←`/`→` keyboard shortcuts and the prev/next buttons, which is a larger UX change and contradicts the existing keyboard shortcuts spec.

### Bug 2 — `RoundSummary.tsx` inconsistent sources of truth (T-01 continued)
`RoundSummary.tsx` uses three different sources:
1. `masteredCount === totalCards` for the title (line 45) — correct integer comparison.
2. `learningCount > 0` for the subtitle (line 50) — misses unscored (neither mastered nor learning) cards.
3. `!masteredIds.has(c.id)` for breakdown badges (line 100) — tertiary truth; `isLearning` tested separately. Cards neither mastered nor learning get badge "Unmarked".

After Bug 1 fix (nav → implicit learning), `learningIds` will contain all unscored cards, so the subtitle and "Drill missed" CTA will be correct. The badge logic already handles three states. No further change needed in `RoundSummary.tsx`.

### Bug 3 — `toggleShuffle` re-inits full deck, not active queue (T-05)
`toggleShuffle` in `useTrainerSession.ts` (lines 208–212):
```ts
initRound(baseCases, nextShuffle, roundNumber)
```
This always passes `baseCases` (full deck), not `activeQueue` (current round's queue). In round 2+ (review-missed), the active queue contains only missed cards. Toggling shuffle mid-round 2 replaces those missed cards with the full deck while retaining `roundNumber`.

**Fix:** Pass `activeQueue` to `initRound` inside `toggleShuffle` instead of `baseCases`. This reorders the current queue in place when shuffle is toggled mid-round. On round 1, `activeQueue === baseCases` (ordered copy), so behavior is identical to before.

### Bug 4 — Clipboard `writeText` not awaited; overlapping timeouts race (T-13, X-15)
`handleCopy` (lines 215–220):
```ts
navigator.clipboard.writeText(text);  // not awaited — silent failure
setCopiedType(type);                   // always fires, even on failure
setTimeout(() => setCopiedType(null), 1800);  // not cleared — overlapping timeouts
```

**Fix:**
- Make `handleCopy` async and `await` the clipboard promise.
- Only call `setCopiedType(type)` on success; on failure, silently suppress (no toast shown).
- Use `useRef` to track the active timeout ID and `clearTimeout` before scheduling a new one to prevent flickering.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useTrainerSession.ts` | Fix `next()` implicit-learning, fix `toggleShuffle` queue scope, fix `handleCopy` async+timeout |
| `src/hooks/trainerSessionLogic.ts` | No changes needed (logic is correct; `applyCardOutcome` already handles learning/mastered sets) |
| `src/components/trainer/RoundSummary.tsx` | No changes needed (bug is data-level, not render-level; badge "Unmarked" state remains valid) |
| `src/components/TrainerTab.tsx` | No changes needed |
| `scripts/verify-trainer-session.ts` | Add a new repro test for the skip-navigation bug acceptance criterion |

---

## Acceptance Criteria

1. **AC1:** Arrowing past a card cannot produce a "you answered every algorithm accurately" summary when `masteredCount < totalCards`.  
   → `next()` on an unscored card implicitly marks it as `'learning'`.

2. **AC2:** Unscored cards appear in the review-missed queue.  
   → All skipped cards are in `learningIds`, so `reviewMissedCases` includes them.

3. **AC3:** Toggling shuffle mid-round 2 does not replace the missed-only queue with the full deck while keeping `roundNumber`.  
   → `toggleShuffle` passes `activeQueue`, not `baseCases`.

4. **AC4:** Copy toast is not shown on clipboard failure; overlapping copies do not flicker.  
   → `handleCopy` is async, awaits clipboard, clears previous timeout before setting new one.

---

## Verification Plan

Run all mandatory verification scripts after implementation:
```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```

All must report 0 errors and 0 warnings.

---

## Out of Scope

- Do not modify pipeline scripts, timer code, or algorithm datasets.
- Do not implement full spaced-repetition (intervals, ease, history) — `reviewMissed` is fine as-is.
- Do not remove free navigation buttons/keyboard shortcuts.
- Do not delete `TrainerSessionStats` type (dead code cleanup is issue #61).
- Do not fix `react-hooks/exhaustive-deps` warning in the deck-sync effect (existing `oxlint-disable-next-line` suppresses it).
