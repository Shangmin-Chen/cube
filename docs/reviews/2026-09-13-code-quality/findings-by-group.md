# Findings by group

Digestible groups after T/U/D/P/X dedup. Severities are the highest finding in the group. Files are the evidence set from the raw handoff (HEAD `850768c`). Full write-ups are the GitHub issues in [issue-map.md](./issue-map.md).

## New issues

### 1. Trainer is not a session state machine — [#54](https://github.com/Shangmin-Chen/cube/issues/54)

| | |
|---|---|
| Severity | high |
| Findings | T-01 (high logic), T-05 (medium logic), T-08 (medium architecture), T-09 (low habit), T-13 (nit), X-15 (nit) |
| Related | #21 (counts/confetti/dual membership — **not** this skip/summary/shuffle hole) |
| Files | `src/hooks/useTrainerSession.ts` 41–64, 83–111, 122–165; `src/components/trainer/RoundSummary.tsx` 30, 43–51, 72–80, 97–116; `src/components/TrainerTab.tsx` 62–73, 183–210; `src/components/trainer/TrainerDeckSelector.tsx` 76–90; `src/types/cube.ts` 69–73 |

`next()`/`prev()` never score. Arrow through nine cards, grade the last, finish → title “1 of 10 Mastered” and subtitle “You answered every algorithm accurately.” Drill-missed gated on `learningCount > 0`. Shuffle `initRound`s full `baseCases` while keeping `roundNumber`. “Spaced repetition” is a comment. Hook also owns confetti/clipboard; `TrainerSessionStats` is dead; exhaustive-deps disabled.

### 2. Trainer keyboard key-repeat — [#55](https://github.com/Shangmin-Chen/cube/issues/55)

| | |
|---|---|
| Severity | high |
| Findings | T-02 (high logic), T-14 (nit) |
| Related | closed #25 (modifiers only) |
| Files | `src/hooks/useTrainerKeyboard.ts` 29–82; `src/hooks/useTrainerSession.ts` 75–137; `src/components/TrainerTab.tsx` 172–178, 218–266 |

Listener never checks `e.repeat`. Held `2`/`c` drains mastery; `s` coin-flips bookmarks. HUD/titles disagree with the listener (`x`/`c`/`h` vs displayed 1/2/space).

### 3. Bookmarks deck membership + persistence in setState — [#56](https://github.com/Shangmin-Chen/cube/issues/56)

| | |
|---|---|
| Severity | high |
| Findings | T-03 (high logic), T-07 (medium habit), X-05 (persistence, bookmarks half), X-10 (empty first visit) |
| Related | #21 |
| Files | `src/hooks/useTrainerSession.ts` 41–54, 58–64; `src/hooks/useBookmarks.ts` 3–48; `src/components/TrainerTab.tsx` 20, 50–54, 75–103, 161, 268; `src/services/algService.ts` 188–193, 213 |

Unstarring on `deckId === 'bookmarks'` always `initRound(..., 1)`. Default `/train` is bookmarks, so first visit is a dead deck. `localStorage` + `dispatchEvent` inside the `setState` updater; key `'cfop_bookmarks'`.

### 4. Method / deck / URL identity — [#57](https://github.com/Shangmin-Chen/cube/issues/57)

| | |
|---|---|
| Severity | high |
| Findings | T-04, T-06, T-10, U-10, D-02, D-03, D-04, D-10, D-13, X-02, X-03 |
| Related | #21 (consumes these IDs); closed #22 |
| Files | `src/services/algService.ts`; `src/data/methodsData.ts`; `src/data/cfopData.ts` 108–164; `src/components/TrainerTab.tsx` 18–41; `src/components/AlgReferenceTab.tsx` 28–82, 174–184, 328–334; `src/App.tsx` 17–21; `src/components/Navbar.tsx` 19–54 |

`getDecks` keeps only OLL and PLL; “All Algorithms” is LL-only; Cross/F2L train CTA lies. `oll-2look-sune` ≠ `oll-27`. Unknown method IDs silently become 4-look. Reference method is React state, not URL. Same three CFOP methods registered twice. Deck IDs slugify display labels (`2-look-oll` vs method `cfop-2look`).

### 5. Timer session destroyed on navigation — [#58](https://github.com/Shangmin-Chen/cube/issues/58)

| | |
|---|---|
| Severity | high |
| Findings | U-03 (high architecture), U-05 (medium logic), U-11 (medium architecture), X-05 (timer persistence) |
| Related | #24 (input/inspection/preview *inside* a mounted tab) |
| Files | `src/App.tsx` 14–21; `src/components/TimerTab.tsx` 9–41, 48–54, 71–77, 84–109, 134–167, 244–258; `src/components/Navbar.tsx` 9–13, 39–44 |

Unmount discards running solve, regenerates scramble, resets inspection. `startTimer` never zeros `elapsedTime` and can leak intervals. Persistence copy-pasted to `cfop_solves`.

### 6. Timer pointer/touch + nested-control a11y — [#59](https://github.com/Shangmin-Chen/cube/issues/59)

| | |
|---|---|
| Severity | high |
| Findings | U-04 (high logic), U-06 (medium habit) |
| Related | **sibling of #24** (spacebar, not pointer) |
| Files | `src/components/TimerTab.tsx` 48–54, 57–82, 84–109, 112–131, 186–193, 205–258 |

Mouse+touch both bound; browsers synthesize mouse after touch. `stopTimer` does not check `running`. No `mouseleave` / window `pointerup` / `touchcancel`. `role="button"` wrapping a checkbox; window Space stolen from focused UI.

### 7. RubiksCube3D used as scramble preview; 2D/3D diverge — [#60](https://github.com/Shangmin-Chen/cube/issues/60)

| | |
|---|---|
| Severity | high |
| Findings | U-07 (high architecture), U-08 (medium slop), U-09 (medium logic), D-07 (medium logic), X-11 (README orbit), X-12 |
| Related | #24 (inverse preview), #9 (dead grids), #27 (WCA label), #41 (pipeline mutates the alg string) |
| Files | `src/components/TimerTab.tsx` 198–201; `src/components/RubiksCube3D.tsx` 6–16, 23–38, 60–72, 169–220, 319–515, 605–737; `src/components/AlgDiagram.tsx` 4–50; `src/components/AlgReferenceTab.tsx` 385–520; `src/utils/cubeLogic.ts` 49–83; `README.md` 9–11; `pll-full.json` Ub alt `R3` |

Default `mode='algorithm'` mounts Setup/Solve chrome on a scramble. `mode='scramble'` is an incomplete stub. Scene rebuilds on highlight; second WebGL in fullscreen. VisualCube vs Notion palette. `R3` is +90° in 3D. Two alg runtimes (pipeline vs app invert).

### 8. Dead scaffold / unused kit / branding — [#61](https://github.com/Shangmin-Chen/cube/issues/61)

| | |
|---|---|
| Severity | medium (several lows folded) |
| Findings | U-01, U-02, U-13, U-14, T-11, T-12, D-05, D-09, D-14, X-04, X-14 |
| Related | #9 (grids only); #3 (TriggerChips JSX fold-in) |
| Files | `src/App.css`; `public/icons.svg`; `src/components/ui/tabs.tsx`; `package.json` 15–20; `src/index.css`; `src/hooks/useBookmarks.ts` 3; `src/types/cube.ts`; `src/utils/cubeLogic.ts`; `src/components/trainer/FlashCard.tsx`; `src/components/trainer/TriggerChips.tsx` |

Unused Vite CSS/icons, unused Radix packages, unused Card/Dialog/Badge exports, `FaceColor` / `TrainerSessionStats` / `CFOP_METHOD`. Product name / footer / `cfop_*` keys / Notion comments disagree. Hex copy-pasted. FlashCard duplicates bookmark chrome.

### 9. Pipeline fail-open AUF/rotation + invented ids — [#62](https://github.com/Shangmin-Chen/cube/issues/62)

| | |
|---|---|
| Severity | high |
| Findings | P-01, P-02, P-03, P-04, P-05, P-07, P-08, P-13, P-14 |
| Related | #15, #16, #17, #41, #42 |
| Files | `scripts/pipeline/rules.mjs` 9–16, 42–157; `scripts/pipeline/transformers.mjs` 99–148, 217–264, 301–417; `scripts/sync-algorithms.mjs` 45–48; `scripts/verify-cfop.mjs` 26–29, 55, 71–84 |

Rules `return formatted` on miss. Adjacent-corner heuristic `fixedCorners === 2` also matches Y-perm. A/G/E/N/V/Y get no AUF. Hold copy is static META. Unknown JPerm names slug to new ids; sync only asserts 10/6/57/21. `formatWCARule` swallows parse errors. Four copy-pasted transform loops.

### 10. Ingest executes live third-party JS — [#63](https://github.com/Shangmin-Chen/cube/issues/63)

| | |
|---|---|
| Severity | high |
| Findings | P-09 |
| Related | **sibling of #43** (unpinned fetch vs executing the payload) |
| Files | `scripts/ingest/fetcher.mjs` 10–25; `scripts/sync-algorithms.mjs` 18–37 |

`fetch` → `vm.runInContext(code, context)`. Node `vm` is not a security boundary. No timeout, no `algsetAlgs` schema. JSDoc calls it a sandbox.

### 11. Untyped JSON SoT; no CI; verify not in build — [#64](https://github.com/Shangmin-Chen/cube/issues/64)

| | |
|---|---|
| Severity | high |
| Findings | P-10, P-11, D-01, X-06, X-08 |
| Related | #15, #43 |
| Files | `src/data/cfopData.ts` 103–106; `src/types/cube.ts` 33–57; `scripts/pipeline/transformers.mjs`; `scripts/pipeline/exporter.mjs`; `package.json` 6–13; `tsconfig.node.json`; no `.github/` workflows; no `*.test.*` |

`as AlgCase[]`. Pipeline `.mjs` outside TS project. `build` is `tsc -b && vite build`; `verify:algs` is optional and unhooked.

### 12. Validated ≠ named-case identity; OLL unchecked — [#65](https://github.com/Shangmin-Chen/cube/issues/65)

| | |
|---|---|
| Severity | high |
| Findings | P-06 |
| Related | **sibling of #15** (primaries-only for *existing* invariants) |
| Files | `scripts/pipeline/rules.mjs` 25–31; `scripts/sync-algorithms.mjs` 57; `scripts/verify-cfop.mjs` 40–52, 59–68, 101–102 |

`validateAlg` is parse + simulate. Verify checks PLL primary centers and edges-only primary corners. No OLL orientation invariant, no “this perm is that named PLL.” Logs overclaim.

## Existing issues (commented, not refiled)

| Existing | Extra-evidence findings | Comment |
|---|---|---|
| [#3](https://github.com/Shangmin-Chen/cube/issues/3) | D-08, X-01, T-11, U-12 | Third UI copy of trigger vocab; `TriggerChunk` duplicated; chip JSX ×6 |
| [#9](https://github.com/Shangmin-Chen/cube/issues/9) | U-09, X-09, D-05 (grids/junk-drawer) | Other unused `AlgCase` fields pointed at #61; 2D/3D at #60 |
| [#11](https://github.com/Shangmin-Chen/cube/issues/11) | D-11 | Why from META/group tables, not selected `primaryAlg` (Ua M2 vs RUF why) |
| [#15](https://github.com/Shangmin-Chen/cube/issues/15) | P-06 (as sibling pointer) | Points at #65 |
| [#19](https://github.com/Shangmin-Chen/cube/issues/19) | D-12, P-12 | Tautological descriptions; silent rarest-bucket default; UI never shows `probability` |
| [#21](https://github.com/Shangmin-Chen/cube/issues/21) | T-01/T-05 as related | Points at #54 / #56 / #57 |
| [#24](https://github.com/Shangmin-Chen/cube/issues/24) | U-04 as sibling | Points at #59 / #58 / #60 |
| [#41](https://github.com/Shangmin-Chen/cube/issues/41) | P-01 | Fail-open `return formatted` makes balancer misses silent → #62 |
| [#43](https://github.com/Shangmin-Chen/cube/issues/43) | P-09 as sibling | Points at #63 |

## Not filed (by rule)

| Finding | Why |
|---|---|
| D-06, X-11 (WCA scramble label) | **Is** [#27](https://github.com/Shangmin-Chen/cube/issues/27) |
| D-08, X-01 | **Are** #3 |
| X-13 | Collision map only — [collision-map.md](./collision-map.md) |
| T-11, T-12, T-13, T-14, P-14, X-15 | Nits folded into #61 / #54 / #55 / #62 |

X-07 (god modules) is the layering observation behind #54, #58, #60, and `architecture-habits.md`, not a thirteenth issue.

X-11 README “orbit controls” is absorbed in #60; swallowed storage/clipboard failures sit in #54 / #56 / #58. The WCA-badge half of X-11 remains #27.
