# Collision map

From **X-13** (medium architecture). Not filed as a GitHub issue: it is a coordination document for parallel `fix/*` work. Shared seams that will make independent agents rewrite the same strings and the same files.

HEAD `850768c`. Open issues named here already existed before this pass except where a 2026-09-13 sibling is noted.

## Shared files

The five reviewers plus X-13 keep landing in:

| File | Why it is a seam |
|---|---|
| `src/utils/cubeLogic.ts` | Scramble (#27), parse/invert (D-07 / #60), triggers (#3), badges (#3), `formatTime` / `calculateAO` (D-09 / #61) |
| `src/services/algService.ts` | Method/deck IDs (#57), trainer session consumption (#21 / #54 / #56) |
| `src/types/cube.ts` | `AlgCase` junk drawer (#9 / #61), `TriggerChunk` duplicate (#3), dead `TrainerSessionStats` (#54) |
| `src/components/RubiksCube3D.tsx` | Timer preview (#24 / #60), practice chrome (U-07), second WebGL (U-08) |
| `src/components/AlgDiagram.tsx` | Dead grids (#9), VisualCube fetch (#43), 2D vs 3D (U-09 / #60) |
| `src/hooks/useTrainerSession.ts` | #21, #54, #56, X-15 |
| `src/components/TimerTab.tsx` | #24, #27, #58, #59, #60 |
| `scripts/pipeline/{rules,transformers}.mjs` | #15, #16, #17, #41, #42, #62, #65 |

X-07’s three god modules (`RubiksCube3D`, `TimerTab`, `AlgReferenceTab`) plus `cubeLogic` and `useTrainerSession` are where those seams concentrate.

## Collision pairs (X-13 evidence)

### Triggers (#3) × why copy (#11)

Both touch alg display in reference + flashcards. Trigger chips and `why` sit on the same card back (`FlashCard.tsx`). Unifying the pattern table (#3) will restyle chips that sit next to why-text edits (#11). T-11 / U-12 extra UI copies were commented on #3 rather than given their own issue.

### Dead grids (#9) × pin fetch (#43) × 2D/3D (#60)

`AlgDiagram` owns VisualCube (`#43` is unpinned *algorithm* fetch in the pipeline; the diagram is a second unpinned third-party URL). Grids are on `AlgCase` (#9). A 2D/3D palette unification (#60) must not revive `topGrid` if #9 deletes it, and must not assume VisualCube `sch` exists.

### AUF (#17) × balancer (#41) × overrides (#42) × verify (#15) × fail-open (#62) × case identity (#65)

All mutate or assert `primaryAlg` in the pipeline. Trainer invert, 3D states, VisualCube URLs, and badges all consume that string. #41 must land before #15 can extend invariants to alternatives (stated on #15). #62 is the fail-open error surface that makes a #41 miss silent. #65 is “even primaries are not identified as the named case.” Do not have four agents each append a different `U'` or rotation.

### Trainer session (#21) × skip/summary (#54) × bookmarks (#56) × identity (#57) × triggers (#3) × cross why (#18)

`getDecks` / `getDeckById` / bookmark ids are shared. Cross cases exist in every method (#18). A session-reducer rewrite (#21 / #54) that also changes deck membership (#56) will fight a registry rewrite (#57) and any trigger-chip change on the card (#3). Freeze deck IDs before editing the session hook.

### Timer (#24) × hold copy (#16) × scramble (#27) × unmount (#58) × pointer (#59) × 3D widget (#60)

All live in `TimerTab` + `cubeLogic.generateScramble` + `RubiksCube3D` preview (`initialAlgorithm={scramble}` with default `mode='algorithm'`). #24’s “pass `mode=scramble`” is insufficient (#60). Pointer work (#59) shares `stopTimer` with the spacebar double-bind (#24). Lifting the timer session (#58) will move the same state #24/#59 edit.

### Probability (#19) × why (#11) × unused fields (#9 / #61)

`probability` is another unused `AlgCase` field next to `why`. #19’s convention fix lives in `transformers.mjs` META (overwritten JSON). Deleting unused fields (#61) must not drop `probability` until #19 decides whether the UI will show it.

## Freeze order (X-13 suggested direction)

1. **One trigger table** — own `#3` before restyling chips or why-adjacent UI.
2. **One method / deck id** — own `#57` before `#21` / `#54` / `#56` persist or route those strings.
3. **One alg-string pipeline** — own fail-open `#62` + pin `#43` / execute `#63` before `#41` / `#42` / `#15` / `#65` / `#16` / `#17` argue about emitted `primaryAlg`.
4. **One diagram backend** — own `#9` vs VisualCube vs 3D (`#60`) before pinning or restyling `AlgDiagram`.
5. **One storage helper** — own `cfop_*` keys (`#56` / `#58` / `#61`) before a third feature invents `cfop_something_else`.

Then split remaining issue work along those boundaries. Parallel `fix/*` agents that skip this order will collide in `cubeLogic.ts`, `algService.ts`, and `AlgCase`.
