# Task Specification: Issue #61 Dead Code & Unused Kit Cleanup

## Objective & Scope
Resolve issue [#61](https://github.com/Shangmin-Chen/cube/issues/61):
- Remove dead Vite starter boilerplate (`src/App.css`, `public/icons.svg`).
- Remove unused CSS classes (`.rotate-y-180` in `src/index.css`).
- Remove unused Radix UI wrappers (`src/components/ui/tabs.tsx`) and uninstall 5 unused `@radix-ui` dependencies (`accordion`, `dropdown-menu`, `select`, `tabs`, `tooltip`).
- Prune uncalled UI component exports (`CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent` in `card.tsx`; `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogFooter` in `dialog.tsx`; unused variants `purple`/`outline` in `badge.tsx`).
- Prune dead domain exports & deduplicate types: remove `FaceColor`, `TrainerSessionStats`, `setupMoves` from `src/types/cube.ts`; deduplicate `TriggerChunk` between `src/types/cube.ts` and `src/utils/cubeLogic.ts`; remove `CFOP_METHOD` and `ALL_CFOP_CASES` aliases from `src/data/cfopData.ts`; remove `registerMethod` from `src/services/algService.ts`.
- Align footer branding in `src/App.tsx` with the three primary surfaces ("Cube • Speedcubing & Algorithm Suite" and "Speedsolving Timer • Flashcards • Algorithms").

## Invariants Preserved
- No breaking changes to active components (`Card`, `Badge`, `Dialog`, `FlashCard`, `TimerTab`, `TrainerTab`, `AlgReferenceTab`).
- Existing `cfop_solves` and `cfop_bookmarks` localStorage keys remain unchanged.
- All verification suites pass with 0 errors and 0 warnings.

## Verification Plan
```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```
