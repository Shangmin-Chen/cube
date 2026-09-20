# Task: Issue #56 — Bookmark Edits Reset Round; Persistence in setState

## Objective
1. Bookmark changes on the bookmarks deck should perform queue surgery (remove/add card), not reset the entire round.
2. Default /train route should go to a non-empty deck, not bookmarks.
3. Bookmark persistence (localStorage + dispatchEvent) must happen outside setState updater.

## Scope
- **Edit:** `src/hooks/useBookmarks.ts` — move side effects out of setState updater, validate string[]
- **Edit:** `src/hooks/useTrainerSession.ts` — queue surgery on bookmark changes, re-init only on deck/method change
- **Edit:** `src/components/TrainerTab.tsx` — default deck to first non-bookmarks deck

## Invariants
- Trainer session state machine (mastered/learning sets, round number) preserved
- All verification suites pass unchanged

## Implementation Steps
1. Fix `useBookmarks.ts`: compute next state in updater, persist in a useEffect on bookmarkedIds
2. Fix `useTrainerSession.ts`: split sync effect — full re-init only on deckId/methodId change, queue surgery on bookmark membership changes
3. Fix `TrainerTab.tsx`: default deckParam to first non-bookmarks deck
4. Write tests
