# Task Specification: Issue #55 Trainer Keyboard Key-Repeat Guard

## Objective & Scope
Resolve issue [#55](https://github.com/Shangmin-Chen/cube/issues/55) by adding an `e.repeat` guard to `useTrainerKeyboard.ts`.

When keys are held down (such as `2`/`c` for Mastered, `1`/`x` for Still Learning, or `s` for Bookmark), OS key-repeat events repeatedly fire `keydown`. Because each state transition updates the active case and re-binds the keyboard event listener, held keys rapidly drained decks or toggled bookmark state arbitrarily.

Adding `if (e.repeat) return;` ensures that key events are processed as single-shot transitions per key press.

## Invariants Preserved
1. **Single-Shot Actions:** Holding grade keys grades exactly one card until the key is released.
2. **Deterministic Bookmark State:** Holding `s` stars/unstars once without rapid toggling.
3. **Repository Verification:** All verification suites pass with 0 errors and 0 warnings.

## Proposed Changes
- `src/hooks/useTrainerKeyboard.ts`: Add `if (e.repeat) return;` early-return check before modifier key handling.
- `spec/quality-and-issues.md`: Record resolution of issue #55.

## Verification Plan
```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```
