# Task: Issue #58 — Timer Session Preserved on Navigation

## Objective
Navigating away from /timer and back should not discard a running or armed solve,
regenerate the scramble, or leak timer intervals.

## Root Cause
App.tsx renders TimerTab as a route element — navigating to /train or /algs unmounts it,
clearing all component state and refs.

## Scope
- **Edit:** `src/App.tsx` — render TimerTab persistently (always mounted, hidden via CSS when
  not on /timer route) instead of as a Route element, passing `active={isTimerRoute}`. Keep `<Routes>`
  always mounted with `/` redirecting to `/timer`, `/timer` rendering `null`, and `*` redirecting to `/timer`.
  Determine `isTimerRoute` matching `/timer` or `/timer/*`.
- **Edit:** `src/components/TimerTab.tsx` — zero elapsedTime on arm (`idle` -> `holding`), guard startTimer
  against duplicate intervals, accept `active?: boolean` prop (defaults to `true`), bypass
  window spacebar listeners when `!active`, cancel `holdTimerRef` and reset state to `'idle'`
  if navigating away while holding/ready. If navigating away during `'inspection'`, cancel inspection
  interval and reset to `'idle'` without recording DNF or leaking timers. If navigating away while
  `'running'`, pause interval in background and recreate/resync elapsed time on return.
- **New Test:** `tests/unit/timerTabActive.test.ts` — verify that window Spacebar events do NOT
  trigger timer actions or state changes when `active` is false, running solves pause/resume interval without
  losing elapsed time, arming from idle zeroes elapsedTime, inspection cancels cleanly on nav away without DNF,
  and all global mocks are restored in `afterAll`.

## Invariants
- WCA Scrambles remain via cubing/scramble
- Timer inspection: 15s with +2 at 15-17s, DNF >17s
- All verification suites pass

## Implementation Steps
1. In App.tsx: render TimerTab outside Routes, toggle visibility with CSS based on `isTimerRoute`, keep `<Routes>` always mounted with `/` redirecting to `/timer`, `/timer` rendering null, and `*` redirecting to `/timer`.
2. In TimerTab.tsx:
   - Accept optional prop `active?: boolean` (defaults to `true`) and `initialUseInspection?: boolean`.
   - In startTimer: clear existing interval before creating new one.
   - In stopTimer: clear interval and set ref to null.
   - In handleTriggerPress: call `setElapsedTime(0)` on transition from idle to holding.
   - In active/keyboard listener useEffect:
     - When `!active`: cancel hold timer, clear active pointer id, reset holding/ready to idle, cancel inspection without recording DNF, and pause running interval.
     - When `active`: if running, resync `elapsedTime` to `performance.now() - startTimeRef.current` and recreate interval; register spacebar key listeners.
3. In tests/unit/timerTabActive.test.ts:
   - Restore all globalThis window/document mocks in `afterAll`.
   - Verify inactive vs active Spacebar event handling.
   - Verify running solve continues across tab navigation.
   - Verify arming timer from idle zeroes elapsedTime.
   - Verify navigating away during inspection cancels inspection without recording DNF or leaking timers.
4. Verify all suites pass: `npm run lint`, `npm run verify:algs`, `npm run verify:triggers`, `npm run verify:trainer`, `npm test`, `npm run build`.
