# Quality and issues

HEAD `850768c`. Tracker read 2026-09-13 (spec passes / `gh`). Post-HEAD GitHub issues/PRs and unmerged `fix/*` are **later WIP** (not snapshotted). Closures of **#4/#5** on Sep 12 are process-only (no code).

## Test / CI posture

| Mechanism | Automated? | Notes |
|-----------|------------|-------|
| `npm run verify:algs` | Manual CLI | `scripts/verify-cfop.mjs` — needs `cubing` installed |
| `npm run sync:algs` | Manual CLI | Live fetch; unpinned |
| `npm run lint` | Manual CLI | oxlint |
| `npm run build` | Manual CLI | `tsc -b && vite build` |
| CI | **None** | no `.github/` |
| Unit / E2E | **None** | no test runner in `package.json` |
| Pre-commit | **None** | |

First recorded “subagent audit” commit: `26359fe` (2026-08-30) — localStorage parse, cross cases, back-nav. Later quality work lives in GitHub issues, not a test suite.

This merge did **not** run `verify:algs`. Do not quote a local pass/fail.

---

## What `verify:algs` actually checks

Does (if run):

1. JSON lengths 10 / 6 / 57 / 21.
2. `cubing/alg` + KPuzzle **parse/simulate** every `primaryAlg` and every alternative (181 variations = 94 primaries + 87 alts).
3. PLL **primary** centers permutation = identity.
4. Edges-only PLL **primaries** (`pll-z/h/ua/ub` + 2-look equivalents): corners identity + 0 orientation delta.

Does **not**:

- Semantic invariants on **alternatives** (open **#15**; log line “All PLL algorithms preserve CENTERS” is primaries-only).
- Cross / F2L hand algs.
- OLL orientation correctness.
- `why` / `description` / `probability` vs cube state.
- Alternative ≡ same case as primary.
- Trigger/badge coverage (**#3**).
- Dedup sweep (historical **#14** was manual).
- UI / timer / trainer state machines.

PR #40 body claimed invariants on 181 variations; that matches **parse** count, not alt **semantics**. That writeup is **self-attested**.

---

## What is NOT validated

| Gap | Consequence |
|-----|-------------|
| No CI, no unit/E2E, no hooks | Every UI claim is unaudited in-repo |
| Cross / F2L algs | `cross-sample-1` known-bad; F2L `why` pedagogical only |
| OLL semantic correctness | No “this alg actually orients this case” check |
| Alternative **equivalence** | Alts must parse; need not match primary case |
| Alternative PLL invariants | #15; #41 reports many unbalanced alts (post-HEAD audit). **Users cannot see alt algs in UI** — rotation bugs are invisible in-app |
| `why` / `description` vs cube state | Open #11, #16, #17. `why` not shown in Reference at HEAD (flashcard back + search only); `description` in Dialog only |
| Probability convention | 2-Look PLL corners 4/5 & 1/5 (#19) |
| Trigger/badge correctness | Open #3 (absorbs #4, #5) |
| Timer/trainer state machines | Open #21, #24; #24 notes static reading, not browser |
| VisualCube / `topGrid` accuracy | Grids unused by `AlgDiagram`; #9 |
| `sync:algs` reproducibility | Unpinned live J Perm (#43 later) |
| Accessibility | Labels exist; no audit |
| This worktree did not run `verify:algs` | Spec does not claim a green local run |

---

## Known bad / questionable content at HEAD

1. **`cross-sample-1` / `D2 R F L B`** — does not match stated insertion (`#18`).
2. **2-Look PLL corner probs 4/5, 1/5** — conditional convention (`#19`).
3. **Full OLL `why`** — 15 group templates across 57 cases (`#11`).
4. **Hold / AUF copy** on some 2-Look OLL descriptions (`#16`, `#17`).
5. **`pll-e` taxonomy** — shipped as Diagonal Corners (`01ca3a1`); tracker #2 flags possible adjacent simulation. Treat as **unresolved suspicion**, not a verified bug in this spec.
6. **#28 closed partially** — pll-v/aa alts balanced; later #41 says other alts still rotated.
7. README / footer / default method disagree (see `product.md`).
8. Trainer v1 mastery localStorage orphaned.
9. Inspection checkbox without countdown.
10. Alg Reference method not shareable.

---

## Closed at or before HEAD (code on `main`)

**Alg-string caveat:** Rows below cite the **fix commit on main**, not necessarily the **HEAD algorithm text**. PR #40 (`850768c`) regenerated JSON from the pipeline. For #6, #13, and #28 the listed SHAs are **pre-regen** `cfopData.ts` fixes — **HEAD strings live in `src/data/generated/*.json`**. Do not teach those SHAs’ literal algs as current (e.g. #6 `pll-rb`, #13 zperm alt, #28 pll-v/aa alts all differ post-regen). `rules.mjs` still encodes the rotation/AUF **intent**.

| Issue | Topic | Closed by | Main commit |
|-------|-------|-----------|-------------|
| #6 | Trailing AUF `U'` on pll-jb/ra/rb | PR #36 | `62faed8` (pre-regen; HEAD JSON differs) |
| #7 | Duplicate non-canonical pll-w | PR #38 | `a1c877e` |
| #8 | pll-e adjacent vs diagonal taxonomy | PR #35 | `01ca3a1` (revisit flag) |
| #10 | Dead guards in `detectAlgBadges` | PR #31 | `95484bc` |
| #12 | pll-aa/gc invalid primaries | PR #40 regen | `850768c` (no `closes #12`) |
| #13 | pll-2look-zperm net U deficit | PR #37 | `dadd0c8` (pre-regen; HEAD JSON differs) |
| #14 | pll-ab mislabeled | PR #40 regen | `850768c` (no `closes #14`) |
| #20 | Ao5/Ao12 oldest-first / freeze | PR #33 | `9a149a8` |
| #22 | `getDeckForStep` → Bookmarks | PR #40 | `850768c` (no `closes #22`) |
| #23 | Dead `fetchThirdPartyAlgData` | PR #32 | `5f5c11a` |
| #25 | Trainer modifier-key shortcuts | PR #29 | `723526f` |
| #26 | `U2'` in setup scrambles | PR #30 | `0c4cf50` |
| #28 | Unclosed rotations pll-v / pll-aa alt | PR #34 | `162dd4d` (pre-regen; HEAD JSON differs; partial vs later rotation audit) |

PR **#1** (`d79636c`) shipped Trainer v2 (feature, not a bug close).  
PR **#39** (`aef759e`) removed coming-soon methods.

### Closed without HEAD code

| Issue | Closed | Reality |
|-------|--------|---------|
| **#4** false trigger badges | 2026-09-12 | Absorbed into open **#3**; no main commit |
| **#5** zero-chip coverage | 2026-09-12 | Same |

### Suspected incomplete closures

- **#8:** group at HEAD is Diagonal Corners; description is generic pipeline template. Tracker later questioned whether the **algorithm** is adjacent vs diagonal. Not re-simulated this merge.
- **#28:** closed for pll-v / pll-aa specifically; **#41** (post-HEAD) claims 27 other alts still unbalanced.

---

## Open at HEAD (in-window; no main fix)

Parent tracker **#2** remains OPEN.

| Issue | Topic | Notes |
|-------|-------|--------|
| **#3** | Unify duplicated trigger pattern table | Palindrome noise, false badges, coverage. Absorbs #4, #5 |
| **#9** | `topGrid` / `borderColors` dead | 5 hand cases; `AlgDiagram` ignores them; generated JSON never has them |
| **#11** | Imprecise `why` fields | Fix in transformers, not JSON |
| **#15** | `verify-cfop` invariants primaries-only | Blocked conceptually on later #41 |
| **#16** | `oll-2look-lshape` hold vs alg | transformers |
| **#17** | Anti-Sune / Headlights description vs AUF | transformers |
| **#18** | `cross-sample-1` `why` / alg false | `cfopData.ts` |
| **#19** | 2-Look PLL corner probability convention | transformers meta |
| **#21** | Trainer round-2+ mastery / confetti / dual state | **Partial**: #40 fixed bookmark-deck hijack (#22). HEAD: `next` at end does not finish round; `markLearning` does not remove from `masteredIds`; bookmarks-deck star/unstar mid-round wipes round; shuffle on round 2+ re-inits full `baseCases` not `learningIds` |
| **#24** | Timer spacebar double-fire, inspection UX, scramble preview inverse | Scramble inverse at step 0 **source-confirmed**. **Also source-confirmed:** dual window+card Space listeners (double-fire when card focused); `elapsedTime` never cleared — inspection/idle show **last solve time**, not 0 or 15s countdown. Not browser-reproduced |
| **#27** | Random-move scrambles labelled “WCA Official” | `generateScramble` is custom |

No main commit message mentions #21, #24, or #27.

Source-checked this merge (not browser-reproduced): **#9, #15, #18, #19, #21 (round state), #24 (dual listener + last-solve display + scramble inverse), #27**. Browser-level timer/trainer input not re-tested.

---

## Later WIP (not product truth)

Work after **`850768c`** lives on unmerged `fix/*` branches and later GitHub issues/PRs. It is **not shipped** — do not merge live tracker numbers into HEAD facts or the frozen timeline.

Examples filed at the window edge (2026-09-12): **#41** (rotation balancer too narrow), **#42** (no override map), **#43** (unpinned upstream). Additional issues and open PRs continue to accrue; this spec does **not** snapshot them.

Those trackers often describe problems **already true at HEAD** that were not filed or fixed inside the timeline window. **Ignore for shipped spec.**

---

## README / docs quality

- README last updated `a1e74bf` (2026-08-30): claims tutorials, WCA scramble, persistent trainer progress.
- Footer/tagline vs default `cfop-4look`.
- No `spec/` folder at product HEAD (this `spec/` is docs-branch work).

## Audit caveats for later LLMs

1. Do not trust squash commit **messages** for #8 (mentions Adjacent) or #40 (omits #12/#14/#22).
2. Do not treat `verify:algs` green as “algs are correct.”
3. Cross/F2L bugs will never fail `verify:algs`.
4. Repro scripts live in **issue bodies**, not the repo.
5. Sep 9 parallel timestamps are many agents, not one linear coding session.
6. After #40, LL content lives in `transformers.mjs` / `rules.mjs` + generated JSON, not hand `cfopData.ts`.
