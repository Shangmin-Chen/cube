# Timeline

Canonical shipped HEAD: **`850768c` (2026-09-10 16:46 EDT)**.  
**34** commits on `main` from `38e4a45` (2026-08-30) to that SHA.

**Not shipped:** unmerged `fix/*` and later GitHub issues/PRs after `850768c` (not part of the frozen timeline).

Dates are git **author dates**. Most commits are America/New_York (`-0400`). Exception: `d79636c` is `-0700` (see that row). Squash warning: use **main hashes** below as shipped. Duplicate branch tips and PR/issue linkage live in `process.md`.

---

## Milestone table

| Slug | Date | Anchor | What shipped |
|------|------|--------|----------------|
| `genesis-four-tab-suite` | 2026-08-30 | `38e4a45` | Initial “CFOP PRO” app: Tutorial (home), Alg Reference, Flashcard Trainer v1, Timer. Hand-authored 2-Look OLL/PLL, incomplete Full PLL, F2L highlights. No Cross export |
| `rebrand-cube` | 2026-08-30 | `a1e74bf` | Brand → **Cube**; README retitled (**last README edit**) |
| `focus-pivot-timer-plus-algs` | 2026-08-30 | `269d9aa` | Tutorial + Trainer v1 **files** deleted; 2-tab app (Timer + Alg Reference); Timer as home. Footer: *Speedcubing Timer & Interactive Algorithm Reference* |
| `alg-reference-core` | 2026-08-30 | `1124b6a` | Reference restructured around Cross / F2L / OLL / PLL |
| `notion-dark-polish` | 2026-08-30 | `c6b070a` | Notion Dark, no gradients, Radix primitives added |
| `wca-visualcube-integration` | 2026-08-30 | `bd0c5c2` | `cubing` + VisualCube API; runtime J Perm fetch (`fetchThirdPartyAlgData`); Reference `why`/`tips` panel **removed**. Timer scrambles remain custom `generateScramble` (open #27) |
| `spa-deep-links` | 2026-08-31 | `140872b` | react-router-dom v7; `/` → `/timer`; `/algs/:step/:caseId`. Bookmark-step deep link `1b77024` same day |
| `trigger-intelligence` | 2026-09-01 … 09-07 | `7258563` | Palindromic trigger chunking; chip parens `f8b0abe`; dynamic palindrome cleanup `f5d7d10` (direct-to-main, **parent of** PR #1 squash) |
| `trainer-revival-v2` | 2026-09-06 | `d79636c` | PR **#1** squash: `/train` Flashcards; method registry; Roux/ZZ/2×2 placeholders. Author TZ **-0700** (EDT = 2026-09-07 02:32). Mastery is session-only |
| `vercel-spa-ship` | 2026-09-07 | `f0d8cdd` | Favicon + `vercel.json` SPA rewrite |
| `quality-sprint-sep9` | 2026-09-09 | `723526f` … `01ca3a1` | PRs #29–#31, #33, #35 — issues #25 #26 #10 #20 #8 |
| `quality-sprint-sep10-am` | 2026-09-10 | `a1c877e` … `62faed8` | PRs #38 #32 #34 #37 #36 — issues #7 #23 #28 #13 #6 on then-hand `cfopData.ts`; then overwritten by #40 regen |
| `coming-soon-removed` | 2026-09-10 | `aef759e` | PR **#39**: Roux/ZZ/2×2 removed from registry/selector |
| `ll-method-tiers-and-pipeline` | 2026-09-10 | `850768c` | PR **#40**: J Perm sync pipeline + `cfop-4look` / `cfop-3look` / `cfop-2look`. Implicitly closed **#12, #14, #22** |

Main has **no product commits after `850768c`**.

---

## Same-day IA churn (2026-08-30, 13:09–13:12 EDT)

Not separate product eras — four-minute homepage/nav oscillation before `269d9aa` settled the 2-tab shape.

| Time | Commit | Change |
|------|--------|--------|
| 13:09 | `38e4a45` | Home = Tutorial; 4 tabs; brand CFOP PRO |
| 13:11 | `99026f8` | Default home → Timer |
| 13:11 | `a1e74bf` | Rebrand Cube |
| 13:11 | `7f8b015` | Tutorial **removed from nav**; home → Alg Reference |
| 13:12 | `4275314` | Home → Timer again |
| 13:12 | `269d9aa` | Delete Trainer v1 + Tutorial files; nav = Timer + Alg Reference |

**Uncertainty:** no issue/PR discussion explains Timer-first vs Reference-first. Stable routing (`/` → `/timer`) is only locked in `140872b` the next calendar day.

`269d9aa` message says “Remove Flashcards and Tutorial tabs”; Tutorial was already off nav in `7f8b015`. The unique product event here is **Trainer v1 + Tutorial file deletion**.

---

## Alg Reference same-day cluster (still 2026-08-30)

Anchor for the *cluster* is `1124b6a`; supporting commits:

| Commit | Shipped |
|--------|---------|
| `7bcacd9` | “2-Look CFOP” default view; Reference `why` panel (removed `bd0c5c2`) |
| `cff7b82` | Tutorial-style formatted list (Tutorial tab already gone) |
| `61fb0fe` | 3-level drill-down (later superseded same day) |
| `666788a` | `topGrid` / `borderColors` on PLL + F2L (vanished from generated JSON; Cross/F2L types still carry unused grids — **#9**) |
| `1124b6a` | Four CFOP steps. Cross still sample-level |
| `26359fe` | Subagent audit + first **Coming Soon** method objects (Roux/ZZ/2×2). Nav label **Algorithms** |
| `b1977c5` | 1-tap practice mode, 90° cube snap, M/E/S slices, 2-Look branding; Coming Soon `<select>` options — **still HEAD UX on every `RubiksCube3D`** |

---

## Trainer v1 → gap → v2

| Event | Commit | Date |
|-------|--------|------|
| Trainer v1 ships | `38e4a45` | 2026-08-30 |
| Trainer v1 deleted | `269d9aa` | 2026-08-30 |
| Trainer v2 (PR #1 squash) | `d79636c` | 2026-09-06 author / 09-07 EDT |

PR #1 branch had **6** commits (`2e87223`, `3e1c58b`, `419df24`, `960d98d`, `4652d7f`, `cd9f171`) squash-merged to `d79636c`. Main records **one** squash. Coming Soon UI predates PR #1 (`26359fe`); registry stubs added `4652d7f`; never populated (`cases: []`, `isAvailable: false`); removed `aef759e`. v1 persistent mastery (`cfop_trainer_mastered`) was **not** restored.

---

## Quality sprint — unique main SHAs

These landed **on hand-authored `cfopData.ts`**. Hours later PR #40 regenerated OLL/PLL JSON; equivalent AUF/rotation intent lives in `rules.mjs`.

| Issue | Unique main commit | Date | PR |
|-------|-------------------|------|-----|
| #25 shortcuts | `723526f` | 2026-09-09 | #29 |
| #26 `U2'` normalize | `0c4cf50` | 2026-09-09 | #30 |
| #10 dead badge guards | `95484bc` | 2026-09-09 | #31 |
| #20 Ao5/Ao12 order | `9a149a8` | 2026-09-09 | #33 |
| #8 pll-e taxonomy | `01ca3a1` | 2026-09-09 | #35 |
| #7 duplicate pll-w | `a1c877e` | 2026-09-10 | #38 |
| #23 dead fetch | `5f5c11a` | 2026-09-10 | #32 |
| #28 rotation balance | `162dd4d` | 2026-09-10 | #34 |
| #13 zperm U deficit | `dadd0c8` | 2026-09-10 | #37 |
| #6 trailing AUF | `62faed8` | 2026-09-10 | #36 |

**#8 path:** squash body still mentions “Adjacent Corners”; **tree at HEAD** has `pll-e.group = "Diagonal Corners"` (pipeline `PLL_META`). Description at HEAD is a generic Full-PLL template, not the hand-authored #8 copy.

**#28** closed for pll-v / pll-aa alts specifically. Later **#41** (not shipped) claims other alts still unbalanced.

---

## PR #40 pipeline (one main commit)

Squash `850768c` folds three branch commits. Unique product event:

- `scripts/` ingest → rules → transformers → exporter
- `npm run sync:algs` / `verify:algs`
- Three CFOP LL method tiers; generated JSON (10/6/57/21)
- Implicitly closed tracker issues **#12, #14, #22** (no `closes #N` in squash title)
- Restores CFOP methods in `methodsData.ts` after `aef759e` emptied `BUILTIN_METHODS`
- Drops PLL/F2L local 2D grids from generated JSON (`666788a` had added them; pipeline JSON never carries `topGrid`/`borderColors`)
- Trainer bookmark-during-drill only partially addresses **#21**

Trigger unification (#3) remains open at HEAD.

---

## After the timeline window (not shipped)

Do not list these as product milestones.

| When | What |
|------|------|
| 2026-09-12+ | Post-HEAD filing begins: e.g. **#41** (rotation balancer), **#42** (override map), **#43** (unpinned upstream). #4/#5 closed as absorbed into #3 (no code). Additional issues/PRs accrue — **not snapshotted here** |
| 2026-09-13+ | Unmerged `fix/issue-*` WIP on branches. **Not on `main`** |
| 2026-09-13 | `9dce376` — research checkpoint only (not a product milestone) |
