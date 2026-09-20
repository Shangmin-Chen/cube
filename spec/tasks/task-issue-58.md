# Task: Issue #58 — Timer Session Preserved on Navigation

## Objective
Navigating away from /timer and back should not discard a running or armed solve,
regenerate the scramble, or leak timer intervals.

## Root Cause
App.tsx renders TimerTab as a route element — navigating to /train or /algs unmounts it,
clearing all component state and refs.

## Scope
- **Edit:** `src/App.tsx` — render TimerTab persistently (always mounted, hidden via CSS when
  not on /timer route) instead of as a Route element
- **Edit:** `src/components/TimerTab.tsx` — zero elapsedTime on arm/start, guard startTimer
  against duplicate intervals

## Invariants
- WCA Scrambles remain via cubing/scramble
- Timer inspection: 15s with +2 at 15-17s, DNF >17s
- All verification suites pass

## Implementation Steps
1. In App.tsx: render TimerTab outside Routes, toggle visibility with CSS based on current route
2. In TimerTab.tsx: clear existing interval in startTimer before creating new one
3. Verify all suites pass
