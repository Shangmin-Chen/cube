# Task: Issue #59 — Timer Pointer Double-Fire & Nested A11y Controls

## Objective
1. Remove `role="button"` from the Card wrapping the inspection checkbox (WAI-ARIA nesting violation)
2. Ensure `pointercancel` properly resets holding/ready to idle
3. Space key must not fire when focus is on a button, checkbox, or input
4. Add `role="timer"` and polite `aria-live` for phase change announcements

## Scope
- **Edit:** `src/components/TimerTab.tsx` — remove role="button", add role="timer" and aria-live region,
  ensure pointercancel releases to idle, space gating already handled by shouldLetNativeSpaceThrough

## Analysis of Existing Code
- `shouldLetNativeSpaceThrough` already checks `e.target` AND `document.activeElement` for INPUT/TEXTAREA/SELECT/BUTTON — acceptance criterion already met
- `handlePointerUp` already handles pointerCancel via `onPointerCancel={handlePointerUp}` on the Card — but it checks pointerId match which may fail for pointercancel events
- `role="button"` with nested checkbox/label is the WAI-ARIA violation
- No `aria-live` or `role="timer"` exists

## Implementation Steps
1. Remove `role="button"` and `tabIndex={0}` from the timer Card
2. Add `role="timer"` to the timer display div
3. Add polite `aria-live` region for phase changes (not every 10ms tick)
4. Fix handlePointerUp to also handle pointercancel (reset activePointerIdRef regardless of pointerId match on cancel)
