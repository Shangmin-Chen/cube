# Issue map

All GitHub objects created in this pass, plus finding ID → issue. Product HEAD `850768c`. Parent tracker: [#2](https://github.com/Shangmin-Chen/cube/issues/2).

## NEW issues (12)

| # | Title | URL | Labels | Finding IDs absorbed |
|---|---|---|---|---|
| 54 | Trainer session skips scoring, then the round summary lies | https://github.com/Shangmin-Chen/cube/issues/54 | `bug` | T-01, T-05, T-08, T-09, T-13, X-15 |
| 55 | Trainer keyboard auto-repeats mastery, skip, bookmark, and restart | https://github.com/Shangmin-Chen/cube/issues/55 | `bug` | T-02, T-14 |
| 56 | Bookmark edits on the bookmarks deck reset the round; persistence lives in setState | https://github.com/Shangmin-Chen/cube/issues/56 | `bug` | T-03, T-07, X-05 (bookmarks), X-10 |
| 57 | Method, deck, and URL identity disagree — “All Algorithms” is last-layer-only | https://github.com/Shangmin-Chen/cube/issues/57 | `bug` | T-04, T-06, T-10, U-10, D-02, D-03, D-04, D-10, D-13, X-02, X-03 |
| 58 | Navigating away from the timer discards the in-progress solve | https://github.com/Shangmin-Chen/cube/issues/58 | `bug` | U-03, U-05, U-11, X-05 (timer) |
| 59 | Timer pointer/touch can double-fire and get stuck holding/ready | https://github.com/Shangmin-Chen/cube/issues/59 | `bug`, `accessibility` | U-04, U-06 |
| 60 | Timer scramble preview is the algorithm-practice 3D widget, not a scramble visualizer | https://github.com/Shangmin-Chen/cube/issues/60 | `bug` | U-07, U-08, U-09, D-07, X-11 (README orbit), X-12 |
| 61 | Dead Vite/shadcn leftovers, unused exports, and branding drift | https://github.com/Shangmin-Chen/cube/issues/61 | `enhancement`, `good first issue` | U-01, U-02, U-13, U-14, T-11, T-12, D-05, D-09, D-14, X-04, X-14 |
| 62 | Pipeline AUF/rotation rules fail open and invent ids for unknown upstream names | https://github.com/Shangmin-Chen/cube/issues/62 | `bug` | P-01, P-02, P-03, P-04, P-05, P-07, P-08, P-13, P-14 |
| 63 | Algorithm ingest executes live third-party JavaScript via vm.runInContext | https://github.com/Shangmin-Chen/cube/issues/63 | `bug` | P-09 |
| 64 | Generated JSON is untyped; build and CI never run verify:algs | https://github.com/Shangmin-Chen/cube/issues/64 | `enhancement` | P-10, P-11, D-01, X-06, X-08 |
| 65 | “Validated” means parseable, not “this alg is that named case”; OLL has no semantic checks | https://github.com/Shangmin-Chen/cube/issues/65 | `bug` | P-06 |

X-07 is documented in [architecture-habits.md](./architecture-habits.md) and split across #54 / #58 / #60 rather than filed separately. X-13 is [collision-map.md](./collision-map.md) only.

## Comments posted on existing issues

| Existing issue | Comment URL | Finding IDs | Why a comment, not a twin |
|---|---|---|---|
| [#3](https://github.com/Shangmin-Chen/cube/issues/3) | https://github.com/Shangmin-Chen/cube/issues/3#issuecomment-5651898306 | D-08, X-01, T-11, U-12 | Same duplicated trigger table; extra UI copies |
| [#9](https://github.com/Shangmin-Chen/cube/issues/9) | https://github.com/Shangmin-Chen/cube/issues/9#issuecomment-5651898843 | U-09, X-09, D-05 | Grids remain #9; other unused fields → #61; 2D/3D → #60 |
| [#11](https://github.com/Shangmin-Chen/cube/issues/11) | https://github.com/Shangmin-Chen/cube/issues/11#issuecomment-5651898418 | D-11 | Why generated from META, not `primaryAlg` |
| [#15](https://github.com/Shangmin-Chen/cube/issues/15) | https://github.com/Shangmin-Chen/cube/issues/15#issuecomment-5651898934 | P-06 | Pointer to sibling #65 |
| [#19](https://github.com/Shangmin-Chen/cube/issues/19) | https://github.com/Shangmin-Chen/cube/issues/19#issuecomment-5651898515 | D-12, P-12 | Convention issue unchanged; extra mapping/display facts |
| [#21](https://github.com/Shangmin-Chen/cube/issues/21) | https://github.com/Shangmin-Chen/cube/issues/21#issuecomment-5651898589 | T-01, T-05 (related) | Pointer to #54 / #56 / #57 |
| [#24](https://github.com/Shangmin-Chen/cube/issues/24) | https://github.com/Shangmin-Chen/cube/issues/24#issuecomment-5651898676 | U-04 (sibling) | Pointer to #59 / #58 / #60 |
| [#41](https://github.com/Shangmin-Chen/cube/issues/41) | https://github.com/Shangmin-Chen/cube/issues/41#issuecomment-5651899026 | P-01 | Fail-open error surface → #62 |
| [#43](https://github.com/Shangmin-Chen/cube/issues/43) | https://github.com/Shangmin-Chen/cube/issues/43#issuecomment-5651898762 | P-09 | Pointer to sibling #63 |

No comments on #2, #16, #17, #18, #27, #42 (findings were either exact duplicates, folded into #62 as related, or already tracked without extra file:line evidence beyond the original issue).

## Finding ID → issue

| ID | Disposition |
|---|---|
| T-01 | **#54** (related #21) |
| T-02 | **#55** |
| T-03 | **#56** |
| T-04 | **#57** |
| T-05 | **#54** (related #21) |
| T-06 | **#57** |
| T-07 | **#56** |
| T-08 | **#54** (kitchen sink / dead stats); repo-wide “no tests” also **#64** |
| T-09 | **#54** |
| T-10 | **#57** |
| T-11 | **#61** + comment on **#3** |
| T-12 | **#61** |
| T-13 | **#54** |
| T-14 | **#55** |
| U-01 | **#61** |
| U-02 | **#61** |
| U-03 | **#58** |
| U-04 | **#59** (sibling of #24) |
| U-05 | **#58** |
| U-06 | **#59** |
| U-07 | **#60** |
| U-08 | **#60** |
| U-09 | **#60** + comment on **#9** |
| U-10 | **#57** |
| U-11 | **#58** |
| U-12 | comment on **#3** |
| U-13 | **#61** |
| U-14 | **#61** |
| D-01 | **#64** |
| D-02 | **#57** |
| D-03 | **#57** |
| D-04 | **#57** |
| D-05 | **#61** + comment on **#9** |
| D-06 | existing **#27** (not refiled) |
| D-07 | **#60** |
| D-08 | existing **#3** (comment) |
| D-09 | **#61** |
| D-10 | **#57** |
| D-11 | existing **#11** (comment) |
| D-12 | existing **#19** (comment) |
| D-13 | **#57** |
| D-14 | **#61** |
| P-01 | **#62** + comment on **#41** |
| P-02 | **#62** |
| P-03 | **#62** |
| P-04 | **#62** (related #16 / #17) |
| P-05 | **#62** |
| P-06 | **#65** (sibling of #15; comment on #15) |
| P-07 | **#62** |
| P-08 | **#62** |
| P-09 | **#63** (sibling of #43; comment on #43) |
| P-10 | **#64** |
| P-11 | **#64** |
| P-12 | existing **#19** (comment) |
| P-13 | **#62** |
| P-14 | **#62** |
| X-01 | existing **#3** (comment) |
| X-02 | **#57** (coupling noted on #21) |
| X-03 | **#57** |
| X-04 | **#61** |
| X-05 | **#56** + **#58** |
| X-06 | **#64** |
| X-07 | habits doc + #54 / #58 / #60 |
| X-08 | **#64** |
| X-09 | comment on **#9** + **#61** |
| X-10 | **#56** |
| X-11 | WCA half = **#27**; README orbit = **#60**; swallows = #54 / #56 / #58 |
| X-12 | **#60** |
| X-13 | [collision-map.md](./collision-map.md) only |
| X-14 | **#61** |
| X-15 | **#54** (noted on #21) |
