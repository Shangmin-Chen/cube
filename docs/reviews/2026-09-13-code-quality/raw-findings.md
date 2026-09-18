# Pass 3 raw findings (handoff)

Source: five Cursor 4.6 architecture reviews of HEAD `850768c` on 2026-09-13.
Worktree: `/Users/shangminchen/cube/.worktrees/code-quality-review`
Branch: `docs/code-quality-review`

Reviewers:
- Trainer: T-01..T-14
- UI/timer/shell: U-01..U-14
- Data/math/types: D-01..D-14
- Pipeline: P-01..P-14
- Cross-cutting: X-01..X-15

Do not treat this file as product source of truth. Invent nothing beyond these findings. Deduplicate aggressively.

## Already-open GitHub issues (do NOT file duplicates)

| # | Title | Status |
|---|--------|--------|
| 2 | [Audit] Algorithm logic & trainer correctness — findings tracker | OPEN |
| 3 | Unify the duplicated trigger pattern table | OPEN |
| 9 | topGrid / borderColors case-visual data is fully dead code | OPEN |
| 11 | Several "why" explanation fields are imprecise | OPEN |
| 15 | verify-cfop.mjs applies its semantic invariants to primaries only | OPEN |
| 16 | oll-2look-lshape algorithm contradicts its own stated holding position | OPEN |
| 17 | Anti-Sune and Headlights OLL descriptions are off by one AUF | OPEN |
| 18 | cross-sample-1 why claim is false | OPEN |
| 19 | 2-look PLL corner probabilities use a different convention than edges | OPEN |
| 21 | Trainer session: round 2+ mastery incoherent, confetti on failed rounds, card in both states | OPEN |
| 24 | TimerTab: spacebar double-fires, inspection is non-functional, scramble preview shows inverse | OPEN |
| 27 | Scrambles are random-move but labelled WCA Official | OPEN |
| 41 | Rotation balancer searches only a single rotation | OPEN |
| 42 | Pipeline has no algorithm-override mechanism | OPEN |
| 43 | Upstream algorithm fetch is unpinned | OPEN |

WIP PRs already exist for several of these (do not restate as new work): #16, #9, #43, #41, #42, #3, #21, #24, #11, #19, #17, #18.

If a finding is extra evidence for an open issue, COMMENT on that issue with the new evidence. Do not open a twin.

If D-06 / X-11 restates #27, do not file a new scramble issue.
If D-08 / X-01 restates #3, comment don't duplicate.
If D-11 restates #11, comment.
If D-12 restates #19, comment.
If P-06 extends #15, comment (case-identity gap may be a NEW sibling if it is clearly broader than "primaries only").
If P-09 extends #43, comment (executing live JS is new evidence; only file a new issue if it is a distinct security/architecture defect not covered by "unpinned fetch").

## Trainer findings

### T-01 high logic — Navigation skips scoring; round summary then lies and blocks review
Files: useTrainerSession.ts 83–111, 122–137; RoundSummary.tsx 30, 43–51, 72–80, 97–116; TrainerTab.tsx 183–210
next()/prev() never touch masteredIds/learningIds. Arrow through nine cards, grade the last, finish. Title "1 of 10 Mastered" but subtitle "You answered every algorithm accurately". Drill missed gated on learningCount>0 so skipped IDs vanish. Breakdown labels non-mastered as Learning.
digestGroup: trainer-state-machine
existingIssue: null

### T-02 high logic — Held keys auto-repeat through mastery, skip, bookmark, and restart
Files: useTrainerKeyboard.ts 29–82; useTrainerSession.ts 75–137
Listener never checks e.repeat. OS key-repeat fires handlers on next cards. Holding 2/c marks consecutive mastered; s toggles bookmark; r restarts. #25 only handled ctrl/meta/alt.
digestGroup: trainer-keyboard
existingIssue: null

### T-03 high logic — Changing bookmarks while on the bookmarks deck nukes the round
Files: useTrainerSession.ts 58–64, 41–54; TrainerTab.tsx 50–54, 161
bookmarkKey = bookmarkedIds.join(',') when deckId==='bookmarks'. Sync effect always initRound(..., 1). Unstarring current card reshuffles remaining from card 1 and wipes progress. Default /train is bookmarks.
digestGroup: bookmark-session-coupling
existingIssue: null

### T-04 high architecture — Trainer decks are last-layer-only while methods and bookmarks are not
Files: algService.ts 155–200, 224–263; cfopData.ts 108–164; methodsData.ts 10–14; AlgReferenceTab.tsx 328–334; TrainerTab.tsx 19–20, 75–76, 268
getDecks keeps only oll||pll. "All Algorithms" is LL-only. Bookmarks include F2L stars. getDeckForStep('cross'|'f2l') returns 'all' (LL). Train in Flashcards CTA lies.
digestGroup: deck-model
existingIssue: null

### T-05 medium logic — Shuffle restarts this round number on the full deck
Files: useTrainerSession.ts 41–54, 153–157; TrainerDeckSelector.tsx 76–90; TrainerTab.tsx 62–73
toggleShuffle always initRound(baseCases, ...). Mid-review shuffle replaces missed-only queue with whole deck while keeping roundNumber. Shuffle live on summary.
digestGroup: trainer-state-machine
existingIssue: null (new vs #21)

### T-06 medium architecture — URL method/deck unsanitized; UI remap and session fallback independent
Files: TrainerTab.tsx 18–41; useTrainerSession.ts 17, 28–33; algService.ts 44–68, 206–214
Unknown IDs silently map. ?method=all mixes 2-look and full. Highlighted pill, URL, cards can disagree.
digestGroup: url-session-sync
existingIssue: null

### T-07 medium habit — Bookmark persistence does side effects in setState updater
Files: useBookmarks.ts 3–4, 6–48
localStorage + dispatchEvent inside setBookmarkedIds updater. Strict Mode double-invokes. Array.isArray only. Key 'cfop_bookmarks'.
digestGroup: bookmark-persistence
existingIssue: null

### T-08 medium architecture — Session hook kitchen sink; TrainerSessionStats dead; no tests
Files: useTrainerSession.ts; types/cube.ts 69–73; package.json 6–13
Hook owns queue, round, mastery, hint/flip, scramble inversion, confetti, clipboard. TrainerSessionStats never referenced.
digestGroup: session-layering
existingIssue: null

### T-09 low habit — Copy handler ignores clipboard failure and races timeouts
Files: useTrainerSession.ts 160–165
digestGroup: session-layering

### T-10 low slop — Method registry registers the same three CFOP methods twice
Files: methodsData.ts 1–14; algService.ts 12–17, 22–24, 29–38
digestGroup: method-registry

### T-11 low slop — TriggerChips repeats the same chip JSX six times
digestGroup: trigger-ui
existingIssue: adjacent to #3

### T-12 low slop — FlashCard duplicates bookmark chrome and click-to-flip rules
digestGroup: flashcard-ui

### T-13 nit slop — "Spaced repetition" comment does not describe the code
digestGroup: trainer-state-machine

### T-14 nit slop — Shortcut HUD and titles disagree with the listener
digestGroup: trainer-keyboard

Trainer architecture portrait: no session SM; two taxonomies glued with strings; effects in wrong layer.

## UI / timer / shell findings

### U-01 medium slop — Vite starter CSS and icons unused
App.css never imported; public/icons.svg; unused .rotate-y-180
digestGroup: leftover-scaffold

### U-02 medium slop — shadcn leftovers unused Tabs, Radix packages, Card/Dialog/Badge extras
digestGroup: leftover-scaffold

### U-03 high architecture — Routing unmounts TimerTab, in-progress solve discarded
App.tsx routes unmount TimerTab. Only cfop_solves persist. Remount regenerates scramble, inspection false.
digestGroup: timer-session

### U-04 high logic — Timer pointer path can double-fire and get stuck in holding/ready
Mouse+touch both bound; browsers synthesize mouse after touch. stopTimer does not check running. No mouseleave/pointerup on window/touchcancel.
Distinct from #24 window+card spacebar double-bind.
digestGroup: timer-input
existingIssue: null (sibling of #24)

### U-05 medium logic — Displayed time not reset on arm/start; startTimer can leak intervals
digestGroup: timer-session

### U-06 medium habit — Timer pad invalid nested control; Space stolen from focused UI
role=button wrapping checkbox. Window Space always preventDefault.
digestGroup: a11y-habits

### U-07 high architecture — Timer scramble preview is the algorithm-practice 3D widget
RubiksCube3D default mode=algorithm, practice chrome, Setup/Solve. mode=scramble is incomplete stub; handleScrambleNew does not update parent scramble.
digestGroup: cube-visuals

### U-08 medium slop — 3D rebuilds whole scene, always renders, second WebGL in fullscreen
digestGroup: 3d-runtime

### U-09 medium logic — 2D AlgDiagram and 3D cube are different visual systems
VisualCube remote img vs Three.js Notion palette; topGrid unused (see #9); overlay arrows desync.
digestGroup: cube-visuals
existingIssue: related #9

### U-10 high logic — Alg deep-links can lie; method lives in React state not URL
selectedMethod default cfop-4look not in route. Invalid step/case silently remapped. path=* → /timer. Navbar buttons not Links.
digestGroup: routing

### U-11 medium architecture — TimerTab god component; persistence copy-pasted
digestGroup: god-components

### U-12 medium architecture — AlgReferenceTab inlines second trigger renderer
digestGroup: god-components
existingIssue: related #3

### U-13 low slop — Branding/copy drift (Cube vs Speedcubing Suite; cfop_* keys; Notion comments)
digestGroup: branding

### U-14 low habit — CSS tokens never existed; hex copy-pasted
digestGroup: leftover-scaffold

UI architecture portrait: tabs destroy sessions; RubiksCube3D is the alg trainer not a cube; URL not SoT for reference.

## Data / math / types findings

### D-01 high architecture — Generated JSON untyped fused artifact not SoT
as AlgCase[]; transformers mix JPerm algs + local META copy.
digestGroup: data-boundary

### D-02 high architecture — methodsData is re-export; algService CFOP grab bag
getMethod unknown → 4-look silently. getSteps(array) still uses CFOP_4LOOK.
digestGroup: registry

### D-03 high architecture — 2-look vs full duplicate case worlds; no canonicalId
oll-2look-sune vs oll-27; pll-2look-tperm vs pll-t. Cross/F2L hand-authored.
digestGroup: data-boundary

### D-04 high architecture — Dynamic decks/steps are CFOP string matching on display labels
digestGroup: routing

### D-05 medium slop — AlgCase dishonest optional bag; dead fields
setupMoves never written; is2Look unused; tips unused; probability unused in UI; alternativeAlgs unused; FaceColor unused; TriggerChunk duplicated.
digestGroup: types

### D-06 high logic — WCA official scramble is random-move length 21
THIS IS OPEN ISSUE #27. Do not refile.
digestGroup: cube-math
existingIssue: 27

### D-07 medium logic — Move parse/invert not canonical; R3 is +90° in 3D
pll-full.json has R3 in Ub alt. getMoveParameters only checks ' and 2.
digestGroup: cube-math

### D-08 medium logic — Trigger parsing and badges duplicated substring matchers
THIS IS OPEN ISSUE #3. Comment only.
digestGroup: triggers
existingIssue: 3

### D-09 medium habit — cubeLogic mixes notation with timer statistics
digestGroup: grab-bag

### D-10 medium slop — Method/case IDs stringly typed and collide (cfop-2look vs 2-look-oll)
digestGroup: ids

### D-11 high logic — Why-text from META/group tables not selected primaryAlg
Ua primary M2 slice but why is RUF 2-look sentence. Extends #11.
digestGroup: copy-pipeline
existingIssue: 11

### D-12 medium slop — Description tautologies; probability unlabeled string
Extends #19.
digestGroup: copy-pipeline
existingIssue: 19

### D-13 low habit — Methods alias same case objects; registry mutation global
digestGroup: grab-bag

### D-14 nit slop — Comments describe systems that do not exist
digestGroup: grab-bag

Data architecture portrait: no alg SoT; methodsData/algService are CFOP switcher; teaching copy coupled at ingest then ignored/contradicted.

## Pipeline findings

### P-01 high logic — AUF and rotation rules fail open; original alg emitted with no error
digestGroup: fail-open-normalization

### P-02 high logic — Adjacent-corner AUF heuristic fixedCorners===2 also matches Y-perm; never checks F2L
digestGroup: auf-semantics

### P-03 medium logic — AUF only for edges-only and subset of adjacent swaps; A/G/E/N/V/Y get none
digestGroup: auf-coverage

### P-04 medium logic — Hold/recognition copy static; not recomputed after alg mutation
Related #16/#17.
digestGroup: hold-copy

### P-05 high logic — Unknown upstream names get invented ids/copy; sync only asserts array lengths
digestGroup: identity-gating

### P-06 high logic — Validated means parseable not "this alg is that case"; OLL has no semantic checks
Extends #15 substantially (even primaries not identified as named case).
digestGroup: verification-gap
existingIssue: 15 (sibling possible)

### P-07 medium slop — formatWCARule swallows parse errors
digestGroup: silent-catch

### P-08 medium slop — Four copy-pasted transform loops; dead || []; comments mismatch
digestGroup: copy-paste

### P-09 high architecture — Ingest vm.runInContext live third-party JavaScript
Distinct from #43 (unpinned content hash): this is executing remote JS. Node vm is not a security boundary. No timeout, no schema.
digestGroup: ingest-trust
existingIssue: null (sibling of #43)

### P-10 high architecture — Untyped .mjs vs typed app; JSON SoT via as AlgCase[]
digestGroup: schema-split

### P-11 high habit — No tests, no CI; build/sync do not run verify:algs
digestGroup: reproducibility

### P-12 medium logic — Full OLL/PLL probability mapping silent default non-2/non-4 to rarest bucket
digestGroup: probability-mapping

### P-13 low slop — Unguarded item.alg[0] and string group/id matching
digestGroup: identity-gating

### P-14 nit habit — is2Look only on 2-look; leftover Finding 3 comment
digestGroup: copy-paste

Pipeline architecture portrait: formatter with folklore tables not SoT; JS/TS no shared contract; error surfaces inverted.

## Cross-cutting findings

### X-01 high architecture — Trigger vocabulary defined three times rendered twice
existingIssue: 3

### X-02 high architecture — algService stringly-typed façade
existingIssue: 21 (coupling)

### X-03 high architecture — Method selection not a shared app concern
digestGroup: method-registry

### X-04 high slop — Dead exports, dead UI kit, dead dependencies
digestGroup: dead-surface

### X-05 high architecture — Persistence copy-pasted, CFOP-prefixed, incomplete
digestGroup: persistence

### X-06 high architecture — No app tests and no CI
digestGroup: testing-vacuum

### X-07 high architecture — Layering collapsed: three god modules
digestGroup: god-modules

### X-08 medium habit — Types decorative at data boundary
digestGroup: type-honesty

### X-09 medium architecture — AlgCase junk drawer UI mostly ignores
existingIssue: 9

### X-10 medium slop — Empty states incomplete; first trainer visit dead deck (bookmarks default)
digestGroup: empty-states

### X-11 medium habit — Failures swallowed; marketing overclaim
existingIssue: 27 for WCA; README orbit controls lie

### X-12 medium architecture — Two algorithm runtimes that do not share rules
existingIssue: 41 coupling

### X-13 medium architecture — Open-issue collision map
digestGroup: coupling-map (document in spec; do not file as a bug)

### X-14 low slop — Theme/copy duplicated not tokenized
digestGroup: design-tokens

### X-15 nit habit — exhaustive-deps disabled
existingIssue: 21

## Code habits portrait (from X)

Looks layered but domain lives in cubeLogic.ts and algService.ts. Pipeline is the honest engineering; UI is giant tabs, hex classNames, features twice. Good: TS strict, trainer extracted hooks, bookmark custom event, 3D dispose, pretty JSON. Poor: string catalogs, as/any at boundaries, export-first unused APIs, empty catch, labels that outrun code, no tests/CI.

## Suggested digestible issue groups (aggregator may refine, target 8–12 NEW issues)

1. Trainer is not a session state machine (skip unscored, summary lies, shuffle re-inits, fake SRS) — NEW, mention #21 as related not duplicate
2. Trainer keyboard key-repeat grades/skips/bookmarks — NEW
3. Bookmarks deck membership change resets round + persistence in setState updater — NEW
4. Deck/method/URL identity (LL-only "All", Cross train lies, method not in /algs URL, silent fallbacks, duplicate registry) — NEW
5. Timer session destroyed on tab change; time not reset; interval leak — NEW, related #24
6. Timer pointer/touch double-fire and stuck holding/ready — NEW sibling of #24
7. RubiksCube3D is alg trainer used as scramble preview; 2D/3D visual systems diverge — NEW, related #9 #24 #27
8. Dead scaffold / unused Radix / unused exports / branding drift — NEW cleanup
9. Pipeline fail-open AUF/rotation + adjacent heuristic matches Y-perm + invented ids on unknown names — NEW, related #15 #41
10. Ingest executes live third-party JS via vm.runInContext — NEW sibling of #43
11. No shared schema, no CI, verify not in build, types are casts — NEW, related #15
12. Timer pad a11y nested button + Space stolen — NEW (or fold into timer issues)

Nits (T-11, T-12, T-13, T-14, P-14, X-15) fold into larger issues or a single "slop cleanup" issue, do not each get their own.

Do not file X-13 as an issue; put the collision map in the spec.
