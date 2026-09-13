# Open questions

Unresolved after merging `spec-pass1/` and `spec-pass2/` against git/`src/` at `850768c`. Do not treat items here as shipped facts.

---

## Conflicts resolved in this merge (source wins)

| Topic | Pass 1 | Pass 2 | Kept |
|-------|--------|--------|------|
| `f5d7d10` vs PR #1 | Grouped with Sep 1 triggers; not placed after squash | Timeline said cleanup landed **between** #1 squash and favicon | **Git parent of `d79636c` is `f5d7d10`.** Cleanup is direct-to-main **before** the trainer squash; `f0d8cdd` is after |
| Direct-to-main count | **20** before PR #1 (incl. trigger cleanup) | “plus `f5d7d10` and `f0d8cdd` around the squash” | **20** before #1 (genesis … `f5d7d10`); **21** including `f0d8cdd`. `f5d7d10` is not extra |
| PR #1 calendar date | 2026-09-06 | Timeline 09-06; process “Sep 7” | Author **2026-09-06 23:32 -0700** = **2026-09-07 02:32 EDT**. Both dates appear with TZ |
| Notion Dark colors | Product: `#191919` / `#2d2d2d` / `#eab308`. Architecture: `#191919` / `#202020` | `#191919` / `#202020` / `#eab308` | **All four:** page `#191919`, surfaces `#202020`, borders `#2d2d2d`, accent `#eab308` (`src/`) |
| Radix card/badge | Architecture listed card/badge as used Radix UI | Custom divs; only Dialog is Radix | **Pass 2.** `card.tsx`/`badge.tsx` are divs. `tabs.tsx` unused. Accordion/dropdown/select/tooltip unused |
| Invalid alg step | First method step (`cross`) | “else `'oll'`” | Code: first step, else `'oll'` → **`cross`** at HEAD |
| Timer WCA copy | Badge “WCA Official 3x3 Scramble” | aria-label “WCA scramble” | **Both** are in `TimerTab.tsx` |
| Full OLL group names | “15 shape names (Dot, Cross, Square, …)” | Abbreviated (“Awkward”, “C”, …) | **JSON strings** (e.g. `Awkward Shape`, `C Shape`) |
| 2-Look PLL display names | “Headlights (T)” | J Perm “Headlights” | **JSON:** `Headlights (T Permutation)` |
| Quality-sprint grouping | One blob `723526f` … `62faed8` | Split Sep 9 vs Sep 10 morning | **Pass 2 split** (dates verified on main) |

---

## Still unresolved (do not invent)

### Product intent (no commit/PR discussion)

- Homepage flipped four times in four minutes on 2026-08-30; timer-first won. No recorded rationale for Timer vs Alg Reference as home.
- Tutorial tab copy was **deleted** (`7f8b015` / `269d9aa`). Reference briefly showed `why` (`7bcacd9`–`b1977c5`) but dropped it at `bd0c5c2`; HEAD `why` is flashcard-back only. No documented content migration.
- Whether sample-only Cross/F2L is intentional beginner scope is unanswered by git. Default `cfop-4look` implies beginner CFOP; the library is last-layer.

### Deploy

- `vercel.json` exists (`f0d8cdd`). **No commit records a production URL or deploy event.**

### Algorithm correctness not re-simulated here

- **#8 / #2:** `pll-e.group` is `Diagonal Corners` at HEAD; description is a generic Full-PLL template. Tracker later asked whether the **alg** simulates adjacent corners. Not KPuzzle-checked in either spec pass.
- **#18:** Cross sample `D2 R F L B` vs `why` — tracker/audit claim; this merge did not re-run a cube sim.
- **#16 / #17:** 2-Look OLL hold/AUF copy vs algs — tracker truth; not browser/cube re-verified.
- **#28 vs #41:** two alts balanced on main; later WIP claims many other **alternatives** still rotated. #41 is not shipped; HEAD `verify:algs` does not check alt semantics.

### UI / runtime not browser-tested in these passes

- **#21** trainer round-2+ state — source-confirmed: bookmark mid-round reset, shuffle on round 2+ uses full deck, `markLearning`/`masteredIds` overlap; not browser-reproduced.
- **#24** — source-confirmed: dual window+card Space listeners (double-fire when card focused); `elapsedTime` never cleared (inspection shows last solve); scramble preview **inverse(scramble)** at step 0. Not browser-reproduced.
- Trainer card click vs keyboard after v2.
- VisualCube network failure UX beyond the `onError` placeholder.

### Tracker vs tree

- Open-issue titles/bodies are tracker truth as of 2026-09-13. This merge did not re-run `gh` or every repro.
- Pre-#40 issue bodies still name `cfopData.ts` for LL bugs. HEAD LL source is `transformers.mjs` / `rules.mjs` + generated JSON.
- `#4` / `#5` closed Sep 12 into open `#3` with zero commits — process, not a code fix.

### Verification

- Neither spec pass executed `npm run verify:algs`. Do not claim it is green in this worktree.
- PR #40 body “two review cycles” / 181 invariants is self-attested.

---

## Auditor bait (easy to get wrong)

1. **`git log --all` SHA counts** — Sep 9 `fix/*` tips duplicate squash commits. Count unique issues, not hashes. See `process.md`.
2. **`9dce376` as a release** — research notes only. Product HEAD is `850768c`.
3. **`cfop-2look` as beginner 2-Look OLL/PLL** — it is Full OLL+PLL. Beginner 2-Look lives in `cfop-4look`.
4. **README / footer as product truth** — last README edit `a1e74bf` (2026-08-30). Default method is 4-Look; mastery is session-only; scrambles are not WCA random-state.
5. **Squash message for #8** — still mentions Adjacent Corners; tree is Diagonal Corners.
6. **Squash message for #40** — omits `closes #12/#14/#22`. Those closed by regen + `getDeckForStep`.
7. **`verify:algs` log “All PLL algorithms preserve CENTERS”** — primaries only (#15).
8. **Sep 9–10 `cfopData.ts` LL diffs as HEAD content** — overwritten by #40 JSON. Edit transformers/rules and re-sync.
9. **Unmerged `fix/*` and post-HEAD GitHub issues/PRs as shipped** — later WIP after `850768c`. Do not snapshot live tracker numbers into HEAD facts.
10. **Orphaned PR-branch SHAs** (e.g. `4652d7f`, `a54e48c`) as main milestones — not on `main`.
11. **`cubing` as scramble generator** — used for Alg invert/parse and KPuzzle in scripts. Timer uses `generateScramble`.
12. **Radix as the component kit** — only Dialog is used. Card/badge are custom. Tabs wrapper unused.
13. **`git log --grep='closes #22'`** — empty; #12/#14/#22 closed without `closes` in the squash title.
14. **Calling Trainer v2 “progress tracking”** — React state per round; `cfop_trainer_mastered` unread.
15. **Parallel Sep 9 timestamps as one linear author session** — eight branches in minutes.
16. **“Issue #29” etc.** — #1 and #29–#40 are **PR numbers**, not issues. See `process.md`.
17. **Reference `why` as mechanics surface** — dropped `bd0c5c2`; only flashcard back + search match at HEAD.
18. **Triggers hub “78 algorithms”** — stale Full OLL+PLL count; not updated for 4-look default.

---

## How to talk about HEAD in later work

Shipped = `main` through `850768c` only.  
Closed without code = #4, #5.  
Later WIP = unmerged `fix/*` and post-HEAD GitHub issues/PRs (not part of the frozen timeline).  
Not a milestone = `9dce376`.
