# Architecture habits

Portrait only from the five reviewers’ “top 3” observations plus the cross-cutting (X) habits section. HEAD `850768c`.

## Trainer (T)

1. **There is no session state machine.** Queue index, `isRoundFinished`, `masteredIds`, and `learningIds` are independent `useState`s. Navigation does not score; scoring is the only way to finish; later rounds keep sets unless `round === 1`. Confetti already has to guess with `masteredIds.size + 1` (#21). T-01 and T-05 are the same habit: transitions are not exclusive and not derived from one snapshot. → [#54](https://github.com/Shangmin-Chen/cube/issues/54), existing [#21](https://github.com/Shangmin-Chen/cube/issues/21).
2. **The deck model is two taxonomies glued with strings.** Reference steps are `method.steps` (cross, f2l, oll, pll). Trainer decks are slugified OLL/PLL *subcategory* labels plus a misnamed `'all'`. `methodsData.ts` does not participate. `getDeckForStep` is a hardcoded adapter, which is why F2L “train” opens last-layer “All.” Bookmarks obey a third rule (full `allCases`). → [#57](https://github.com/Shangmin-Chen/cube/issues/57).
3. **Effects live in the wrong layer, and nothing tests them.** Confetti and clipboard timers sit in `useTrainerSession`. Bookmark I/O sits inside a `setState` updater. Keyboard is a second control plane (`e.repeat` unhandled) over the same mutations. `TrainerSessionStats` shows persistence was imagined and abandoned. With no test runner, the reducer-shaped bugs have no cheap regression net. → [#54](https://github.com/Shangmin-Chen/cube/issues/54), [#55](https://github.com/Shangmin-Chen/cube/issues/55), [#56](https://github.com/Shangmin-Chen/cube/issues/56), [#64](https://github.com/Shangmin-Chen/cube/issues/64).

## UI / timer / shell (U)

1. **Tabs are routes that destroy sessions.** `App.tsx` mounts `TimerTab` only on `/timer`. That is the wrong model for a speedsolving timer: scramble, inspection flag, and a running clock must outlive chrome navigation. History belongs in storage; the live machine does not. → [#58](https://github.com/Shangmin-Chen/cube/issues/58).
2. **`RubiksCube3D` is the algorithm trainer, not a cube.** Defaults (`mode='algorithm'`, invert-then-play, practice toggle, playback bar) leak onto the timer “scramble preview.” `AlgDiagram` is an unrelated VisualCube `<img>`. There is no shared cube-state layer, so 2D/3D and scramble/alg will keep drifting. → [#60](https://github.com/Shangmin-Chen/cube/issues/60); inverse preview already [#24](https://github.com/Shangmin-Chen/cube/issues/24).
3. **URL is not the source of truth for the reference app.** Trainer got `?deck=`/`?method=`; Algorithms kept `selectedMethod` in `useState` and swallows bad `:step`/`:caseId`. Combined with `path="*" → /timer` and button-based nav, the shell looks like an SPA with deep links but does not actually round-trip them. → [#57](https://github.com/Shangmin-Chen/cube/issues/57).

## Data / math / types (D)

1. **There is no algorithm source of truth.** JPerm JS (fetched, `vm.runInContext`) supplies move lists; `transformers.mjs` META supplies names/why/probability; `cfopData.ts` supplies Cross/F2L samples; `as AlgCase[]` pretends they are one typed dataset. Generated JSON is a build artifact of that mix, not a schema-backed SoT. → [#64](https://github.com/Shangmin-Chen/cube/issues/64), [#63](https://github.com/Shangmin-Chen/cube/issues/63).
2. **`methodsData` / `algService` are a CFOP switcher.** Three method objects share steps and case references; 2-look vs full are duplicated alg worlds (`oll-27` ≠ `oll-2look-sune`); decks/steps are recovered by slugifying subcategory copy and hardcoding `cfop-2look` vs `2-look-oll`. That will not extend to another method without a rewrite. → [#57](https://github.com/Shangmin-Chen/cube/issues/57).
3. **Teaching copy is coupled into data at ingest, then ignored or contradicted at runtime.** `why`/`description`/`probability`/`alternativeAlgs`/`tips`/`is2Look`/`setupMoves` are mostly either group-template lies (why keyed off META, not `primaryAlg`) or unused. Setup is always `invert(primaryAlg)`. → extra evidence on [#11](https://github.com/Shangmin-Chen/cube/issues/11) and [#19](https://github.com/Shangmin-Chen/cube/issues/19); unused fields in [#61](https://github.com/Shangmin-Chen/cube/issues/61) / [#9](https://github.com/Shangmin-Chen/cube/issues/9).

## Pipeline (P)

1. **The pipeline is a formatter with folklore tables, not a source of truth.** Ingest → transform → export is three files, but transform is four duplicated loops plus static `why`/`description`/`probability` maps, and export is `writeFileSync`. Rules mutate algs (AUF/rotation) without updating recognition copy and without proving the result is the named case. Generated JSON is what `cfopData.ts` trusts; the pipeline does not earn that trust. → [#62](https://github.com/Shangmin-Chen/cube/issues/62), [#65](https://github.com/Shangmin-Chen/cube/issues/65).
2. **JS scripts and TS app do not share a contract.** `AlgCase` lives in the app; the pipeline is untyped `.mjs` outside `tsconfig`. Validation is `as AlgCase[]` plus “array length is 57.” That split makes every P-05/P-06 miss typecheck-green. → [#64](https://github.com/Shangmin-Chen/cube/issues/64).
3. **Error surfaces are inverted: network JS runs freely, alg invariants fail open, CI never runs verify.** Live `vm.runInContext` (P-09) plus fail-open AUF (P-01) plus `sync:algs` not chaining `verify:algs` plus no workflows means the happy-path log (“All cases validated successfully”) is the least reliable signal in the system. → [#63](https://github.com/Shangmin-Chen/cube/issues/63), [#62](https://github.com/Shangmin-Chen/cube/issues/62), [#64](https://github.com/Shangmin-Chen/cube/issues/64).

## Cross-cutting portrait (X)

The repo **looks** layered (`components/`, `hooks/`, `services/`, `data/`, `scripts/pipeline/`) but the domain still lives in two catch-all files: `cubeLogic.ts` and `algService.ts`. The pipeline side is the honest engineering: fetch → transform → KPuzzle validate → emit JSON, with a second script that re-simulates algs. The UI side is the opposite habit: giant tab components, hex classNames, and features implemented twice (triggers, method lists, empty `try/catch` storage).

**What it does well (X):** TypeScript `strict` + `noUnusedLocals` keeps unused *imports* out of `src/`. Trainer is the one area that actually extracted hooks and child components. Bookmarks have a custom event for same-tab sync. 3D teardown disposes geometries. Generated JSON is pretty-printed and counted.

**What it does poorly, repeatedly (X):**

- **String catalogs instead of data** — triggers, method ids, deck slugs, edges-only PLL ids (X-01, X-02, D-04, D-10).
- **`as` and `any` at every boundary** — JSON, kpuzzle, category (X-08, D-01, P-10).
- **Export-first APIs** with no callers — `registerMethod`, `TrainerSessionStats`, scramble mode, Radix kit (X-04, T-08, U-02, U-07).
- **Empty catch / silent fallback** — storage, clipboard, `Alg` parse (X-11, T-07, T-09, P-07).
- **Labels that outrun the code** — “WCA Official” (#27), orbit controls (X-11 / README), 15s inspection with no countdown (#24).
- **No tests and no CI** (X-06, P-11, T-08), so those habits are unconstrained.

X-07 names the three god modules that concentrate the collisions: `RubiksCube3D.tsx`, `TimerTab.tsx`, `AlgReferenceTab.tsx`, plus `cubeLogic.ts` and `useTrainerSession.ts`. The next issue fix that touches `primaryAlg` or `getDecks` will collide with at least two other open issues unless those shared tables are owned first — see [collision-map.md](./collision-map.md) (X-13).
