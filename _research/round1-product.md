# Cube — Product Milestone Context (Commit-History Draft)

**Research scope:** `/Users/shangminchen/cube`, read-only. **HEAD:** `850768c` (2026-09-10). **Total commits:** 34 (2026-08-30 → 2026-09-10). **No `spec/` folder** at HEAD.

**Evidence base:** `git log --all --format='%h %ad %s' --date=short`, targeted `git show`/`git log -p`, file lifecycle (`git log -- path`), and skim of `src/` at HEAD.

---

## 1. Product Identity (What Cube Is)

**Cube** is a browser-based interactive Rubik's cube speedcubing app for CFOP learners and practice. At HEAD it combines:

| Pillar | User-facing purpose |
|--------|---------------------|
| **Speedsolving Timer** (`/timer`) | WCA-style 3×3 scrambles, optional 15s inspection, solve log with +2/DNF, Best/Ao5/Ao12 stats, 3D scramble preview |
| **Algorithm Reference** (`/algs`, deep links) | Searchable CFOP case library with 2D diagrams (VisualCube API), 3D step playback, bookmarks, trigger/pattern highlights, per-case “why” mechanics |
| **Flashcard Trainer** (`/train`) | Quizlet/Monkeytype-style drill for OLL/PLL decks with mastery rounds, keyboard shortcuts, method-aware deck selection |

**Tech (HEAD):** React 19 + TypeScript + Vite 8 + Tailwind v4 + Three.js + `cubing` WCA library + react-router-dom v7. Deployed via Vercel SPA rewrites (`f0d8cdd`).

**Branding arc:** Launched as **“CFOP PRO”** (`38e4a45`), renamed **“Cube”** (`a1e74bf`, 2026-08-30). Visual identity shifted from gradient/slate to **Notion Dark** flat palette (`c6b070a`, 2026-08-30).

**Naming note (important):** “4-Look / 3-Look / 2-Look LL” refer to **last-layer look counts within CFOP**, not separate cubing methods. The most advanced tier is labeled **“2-Look LL (Full CFOP)”** because it uses Full OLL + Full PLL (2 LL looks), while beginner tier **“4-Look LL”** counts Cross + F2L + 2-Look OLL + 2-Look PLL as four looks (`a54e48c` / `850768c`).

---

## 2. Timeline of Product Milestones (Dated)

Chronological. Each entry includes commit hash(es) and inferred product intent.

### Milestone A — **“CFOP Training Suite Genesis”** (2026-08-30)
**`38e4a45`** — Initial commit: “CFOP Interactive Speedcubing & Training Suite”

- **4 tabs:** CFOP Tutorial (default home), Alg Reference, Flashcard Trainer, Speedsolving Timer
- Tutorial tab: step picker (Cross/F2L/OLL/PLL), intuitive mechanics copy, 3D cube
- Initial trainer: decks `2oll` / `2pll` / `fullpll`, flip-to-reveal algs, localStorage mastery
- Alg reference + timer + Three.js cube engine + hand-authored `cfopData.ts`
- Brand: **CFOP PRO**, homepage = Tutorial

### Milestone B — **“Homepage & IA Oscillation”** (2026-08-30, same day)
Rapid nav/default-tab churn before settling:

| Date | Commit | Change |
|------|--------|--------|
| 2026-08-30 | `99026f8` | Default home → **Timer** |
| 2026-08-30 | `a1e74bf` | Rebrand to **Cube** (README, title, navbar) |
| 2026-08-30 | `7f8b015` | Remove **Tutorial** from nav; default home → **Alg Reference**; logo click → reference |
| 2026-08-30 | `4275314` | Default home → **Timer** again |
| 2026-08-30 | `269d9aa` | **Delete** Trainer + Tutorial components; nav = Timer + Alg Reference only |

**Why (inferred):** Commit messages explicitly cite focus: *“keep app clean and focused on Speedsolving Timer and Alg Reference.”* Tutorial content was partially absorbed into Alg Reference rather than kept as its own tab (`7f8b015` enhanced AlgReferenceTab; Tutorial file lingered until `269d9aa`).

### Milestone C — **“Alg Reference as Product Core”** (2026-08-30)
Dense same-day iteration on the reference experience:

| Commit | Date | Shipped |
|--------|------|---------|
| `7bcacd9` | 2026-08-30 | 2-Look CFOP default view; “why” mechanics on every algorithm |
| `cff7b82` | 2026-08-30 | Tutorial-style formatted algorithm list |
| `61fb0fe` | 2026-08-30 | 3-level drill-down: Category → Cases → Formula & 3D |
| `666788a` | 2026-08-30 | 2D pattern diagrams (`topGrid`, `borderColors`) for all PLL + F2L |
| `1124b6a` | 2026-08-30 | Restructure around 4 CFOP steps (Cross, F2L, OLL, PLL) |
| `26359fe` | 2026-08-30 | Hardening: safe localStorage parse, crossCases completeness, back-nav state reset |

### Milestone D — **“Notion Dark + 3D Polish”** (2026-08-30)
| Commit | Shipped |
|--------|---------|
| `c6b070a` | Notion Dark design system, zero gradients, Radix UI primitives |
| `b1977c5` | 1-tap practice mode, 90° animated cube snap, M/E/S slice engine, improved 2D diagrams, “accurate 2-Look CFOP branding” |

### Milestone E — **“WCA + VisualCube Integration”** (2026-08-30)
**`bd0c5c2`** — Integrate `cubing` library + VisualCube API; fix 3D setup previews and accessibility; introduce `algService.ts`.

### Milestone F — **“Deep Links & SPA Routing”** (2026-08-31)
**`140872b`** — react-router-dom routes:

- `/` → redirect `/timer`
- `/timer`, `/algs`, `/algs/:step`, `/algs/:step/:caseId`
- Navbar becomes route-driven (no tab state)

**`1b77024`** (2026-08-31) — Bookmark step tab preserved when selecting saved cases.

### Milestone G — **“Trigger Intelligence”** (2026-09-01)
| Commit | Shipped |
|--------|---------|
| `7258563` | Palindromic substring trigger chunking + refined pattern highlights |
| `f8b0abe` | Remove literal parentheses from rendered trigger chips |

### Milestone H — **“Trainer Revival (v2)”** (2026-09-06 → 2026-09-07)
**`2e87223`** (2026-09-07, local) → merged as **`d79636c`** (2026-09-06 author date, PR **#1**)

- Re-add `/train` route and navbar **“Flashcards”** (Sparkles icon)
- Quizlet-style flashcards + Monkeytype aesthetic
- Modular hooks/components; `algService` method registry; dynamic decks
- Bookmarks hook (`useBookmarks.ts`); trainer keyboard controls
- **`4652d7f`**: `methodsData.ts` adds Roux / ZZ / 2×2 **“Coming Soon”** placeholders (not user-functional)

Follow-up refactors same day (`3e1c58b`, `419df24`, `960d98d`, `cd9f171`, `3e1c58b`).

### Milestone I — **“Vercel Ship Ready”** (2026-09-07)
**`f0d8cdd`** — Custom Cube logo favicon; `vercel.json` SPA rewrite; `.vercel` / `.env*` gitignored.

### Milestone J — **“Quality Sprint (Issue-Driven Fixes)”** (2026-09-09)
Parallel local + PR-merge duplicate commits (same fixes landed twice). User-visible fixes:

| Issue | Commit(s) | Fix |
|-------|-----------|-----|
| **#20** | `1f4107c`, `9a149a8` | Ao5/Ao12 average **most recent** solves |
| **#25** | `3b3dca9`, `723526f` | Trainer ignores modifier keys in shortcuts |
| **#26** | `0276cdc`, `0c4cf50` | Normalize `U2'` → `U2` in setup scrambles |
| **#10** | `dcbe32d`, `95484bc` | Remove dead guards in `detectAlgBadges` |
| **#6** | `d03bfcd`, `62faed8` | Trailing AUF `U'` on pll-jb, pll-ra, pll-rb |
| **#7** | `eb173ef`, `a1c877e` | Remove duplicate non-canonical pll-w |
| **#13** | `1479902`, `dadd0c8` | Fix net U-turn deficit in pll-2look-zperm |
| **#28** | `0d8dd55`, `162dd4d` | Balance whole-cube rotations in pll-v, pll-aa alt |
| **#23** | `ad744cb`, `5f5c11a` | Remove dead/broken `fetchThirdPartyAlgData` scraper |
| **#8** | `cc92bb8`, `5bf36c3`, `01ca3a1` | pll-e taxonomy: group → Adjacent Corners; description → Diagonal Corners |

### Milestone K — **“Method Tier Cleanup”** (2026-09-10)
**`aef759e`** (PR **#39**) — Remove unimplemented Roux/ZZ/2×2 “Coming Soon” from registry/selector.

### Milestone L — **“Automated Alg Pipeline + 4/3/2-Look LL Methods”** (2026-09-10)
**`a54e48c`** → review fix **`f81e04e`** → pipeline refactor **`ccb1df1`** → merged **`850768c`** (PR **#40**)

- `scripts/sync-algorithms.mjs` ingests J Perm datasets → `src/data/generated/*.json`
- `scripts/verify-cfop.mjs` validates canonical alg invariants
- Three CFOP method tiers replace monolithic hand-maintained OLL/PLL blobs
- **`850768c`** restores CFOP methods in `methodsData.ts` after placeholder purge

---

## 3. Features That Shipped, Then Changed or Were Removed

### Removed and **not** restored

| Feature | Shipped | Removed | Notes |
|---------|---------|---------|-------|
| **CFOP Tutorial tab** | `38e4a45` | Nav removed `7f8b015`; file deleted `269d9aa` | Dedicated tutorial UI gone; “why mechanics” live in Alg Reference |
| **Trainer v1 (original Flashcard Trainer)** | `38e4a45` | `269d9aa` | Simple 3-deck trainer; replaced by v2 in `d79636c` |
| **“CFOP PRO” branding** | `38e4a45` | `a1e74bf` | Now “Cube” |
| **Gradient / slate UI** | `38e4a45` | `c6b070a`, trainer flat styling `419df24` | Notion Dark flat palette |
| **Roux / ZZ / 2×2 “Coming Soon” methods** | `4652d7f` | `aef759e` | Never had cases; briefly appeared in method selector |
| **Runtime third-party alg scraping** | `cd9f171` (`fetchThirdPartyAlgData`) | `ad744cb` / `5f5c11a` (#23) | Replaced by build-time sync pipeline (`850768c`) |

### Removed then **brought back** (different implementation)

| Feature | v1 | Gap | v2 |
|---------|----|----|-----|
| **Flashcard Trainer** | `38e4a45` — “Flashcard Trainer”, 3 static decks | Removed `269d9aa` (~7 days) | `d79636c` — navbar label **“Flashcards”**, `/train`, method-aware dynamic decks, round mastery |
| **Homepage default** | Tutorial → Timer → Reference → Timer | Same-day churn | Stable: `/` → `/timer` since `140872b` |

### Evolved in place (same feature, new shape)

| Feature | Evolution |
|---------|-----------|
| **Alg Reference** | Flat list → 3-level drill-down → 4-step CFOP structure → deep links → method selector (4/3/2-Look LL) → generated JSON datasets |
| **CFOP data model** | Hand-authored `cfopData.ts` → runtime fetch attempt → build pipeline + generated JSON (`850768c`) |
| **2-Look CFOP branding** | Single “2-Look CFOP default view” (`7bcacd9`) → explicit tiered methods (`a54e48c`) |
| **Trigger highlights** | Basic parsing → palindrome chunking (`7258563`) → chip formatting (`f8b0abe`) |
| **Timer Ao5/Ao12** | (buggy ordering) → fixed #20 (`1f4107c`) |

---

## 4. Current Product Surface at HEAD (`850768c`)

### Routes & navigation

| Route | Tab label | Component |
|-------|-----------|-----------|
| `/` | — | Redirect → `/timer` |
| `/timer` | Speedsolving Timer | `TimerTab` |
| `/train` | **Flashcards** | `TrainerTab` |
| `/algs` | Algorithms | `AlgReferenceTab` |
| `/algs/:step` | — | Alg Reference (step deep link) |
| `/algs/:step/:caseId` | — | Alg Reference (case deep link) |
| `*` | — | Redirect → `/timer` |

Trainer query params: `?method=cfop-4look|cfop-3look|cfop-2look&deck=<deckId>` (`TrainerTab.tsx`).

### CFOP method tiers (registry)

Default method: **`cfop-4look`** (`algService.getMethod`).

| Method ID | Display name | Case count (evidence) | LL content |
|-----------|--------------|----------------------|------------|
| `cfop-4look` | 4-Look LL (Beginner CFOP) | 1 cross + 4 F2L + 10 + 6 = **21** | 2-Look OLL + 2-Look PLL |
| `cfop-3look` | 3-Look LL (Intermediate CFOP) | 1 + 4 + 10 + 21 = **36** | 2-Look OLL + Full PLL |
| `cfop-2look` | 2-Look LL (Full CFOP) | 1 + 4 + 57 + 21 = **83** | Full OLL + Full PLL |

Generated JSON counts at HEAD: oll-2look **10**, pll-2look **6**, oll-full **57**, pll-full **21** (verified via Node require).

**Cross/F2L:** Sample/highlight cases only (not full F2L case library).

### Timer capabilities
- WCA 21-move scrambles via `cubing` (`TimerTab`, `cubeLogic.ts`)
- States: idle / holding / ready / inspection / running
- Optional 15s inspection
- Solve history in `localStorage` (`cfop_solves`)
- +2 / DNF penalties; Best, Ao5, Ao12
- 3D scramble preview (`RubiksCube3D`)

### Alg Reference capabilities
- Method selector across 3 tiers
- Steps: Cross, F2L, OLL, PLL (+ bookmarks pseudo-step)
- Search across name/alg/group/why
- 2D diagrams: custom grid + VisualCube API fallback (`AlgDiagram.tsx`)
- 3D playback modal
- Trigger/pattern badge detection (`cubeLogic.ts`)
- Bookmarks (`cfop_bookmarks` localStorage)

### Trainer capabilities
- Decks: Bookmarks, dynamic OLL/PLL subcategory decks, All Algorithms (LL only)
- Round-based **mastered** vs **learning** tracking (`useTrainerSession.ts`)
- Keyboard shortcuts (modifier-key fix #25)
- Shuffle, round summary with confetti on mastery
- Cross-link from Alg Reference to matching trainer deck (`getDeckForStep`)

### Build/deploy tooling
- `npm run sync:algs` — J Perm → generated JSON pipeline
- `npm run verify:algs` — invariant checks
- `vercel.json` — SPA fallback for client-side routes

### README vs reality (HEAD)

| README claim | Actual at HEAD |
|--------------|----------------|
| “CFOP Tutorials & Intuitive Mechanics” | **No Tutorial tab.** Mechanics live inside Alg Reference copy/diagrams |
| “Flashcard Trainer: 2-Look OLL, 2-Look PLL, Full PLL” | Trainer supports **all three method tiers**; Full OLL deck appears under `cfop-2look`; decks are dynamic |
| Implies unified “2-Look/Full OLL, 2-Look/Full PLL” tutorial path | Method tier UX is explicit 4/3/2-Look LL selector; naming may confuse (see §1) |
| Footer: “2-Look OLL • 2-Look PLL • Intuitive F2L” | Understates 4-Look default and Full OLL/PLL tiers |

---

## 5. Issue-Driven Product Work

### GitHub issues explicitly closed in commit messages

| Issue | Topic | Closed by | Date |
|-------|-------|-----------|------|
| **#1** | Trainer feature (PR, not strictly “closes”) | `d79636c` | 2026-09-06 |
| **#6** | Missing trailing AUF on pll-jb/ra/rb | `d03bfcd` / `62faed8` | 2026-09-09/10 |
| **#7** | Duplicate pll-w in FULL_PLL | `eb173ef` / `a1c877e` | 2026-09-09/10 |
| **#8** | pll-e taxonomy (group + description) | `cc92bb8`, `5bf36c3`, `01ca3a1` | 2026-09-09 |
| **#10** | Dead code in detectAlgBadges | `dcbe32d` / `95484bc` | 2026-09-09 |
| **#13** | pll-2look-zperm U-turn deficit | `1479902` / `dadd0c8` | 2026-09-09/10 |
| **#20** | Ao5/Ao12 should use most recent solves | `1f4107c` / `9a149a8` | 2026-09-09 |
| **#23** | Remove broken third-party alg fetch | `ad744cb` / `5f5c11a` | 2026-09-09/10 |
| **#25** | Trainer modifier key interference | `3b3dca9` / `723526f` | 2026-09-09 |
| **#26** | U2' scramble normalization | `0276cdc` / `0c4cf50` | 2026-09-09 |
| **#28** | Whole-cube rotation balance (pll-v, pll-aa) | `0d8dd55` / `162dd4d` | 2026-09-09/10 |

### PR numbers in merge commits (may or may not map 1:1 to issues)

#29–#40 on 2026-09-09/10 — mostly merge wrappers around the issue fixes above plus #39 (method cleanup) and #40 (pipeline).

### Product themes from issue cluster
1. **Algorithm correctness** (#6, #7, #8, #13, #28) — canonical alg quality became a focused sprint before/ alongside pipeline work
2. **Trainer UX reliability** (#25)
3. **Timer credibility** (#20) — competition-adjacent stats
4. **Data pipeline hygiene** (#23 → automated sync in #40)

---

## 6. Gaps / Questions for Later Auditors

### Evidence gaps / uncertainty

1. **Aug 30 homepage intent:** Four commits (`99026f8`, `7f8b015`, `4275314`, `269d9aa`) change default tab within hours. Final stable choice (Timer) only codified in routing (`140872b`). *Unclear if Reference-first was intentional experiment or mistake.*
2. **`269d9aa` commit message** says “Remove Flashcards **and Tutorial** tabs” but Tutorial was already removed from nav in `7f8b015`; only file deletion happened here. Message may be stale.
3. **Duplicate commits (Sep 9–10):** Each fix appears twice (local branch commit + PR merge). History is 34 commits but ~12 are near-duplicates — auditors counting “unique changes” should dedupe by patch content.
4. **Issue #8 resolution path:** Two commits adjust pll-e differently (`cc92bb8` group, `5bf36c3`/`01ca3a1` description). Final state needs case-level verification in generated JSON.
5. **Tutorial content fate:** No commit explicitly ports TutorialTab prose to Alg Reference; overlap is inferred from `7f8b015` + Alg Reference “Intuitive” headers, not a documented migration.
6. **Production deployment:** Vercel config exists (`f0d8cdd`); no commit in history confirms live URL or deployment events.
7. **Full F2L / Cross teaching scope:** Product markets CFOP broadly but Cross/F2L are highlight samples only (4 F2L basics + 1 cross sample). Not a full F2L case library — unclear if intentional scope boundary.
8. **README drift:** Still advertises “CFOP Tutorials” and narrower trainer scope; last README touch was `a1e74bf` (2026-08-30) — predates trainer v2 and method tiers.

### Suggested milestone names (for LLM project memory)

| Slug | Date | Anchor commit |
|------|------|---------------|
| `genesis-four-tab-suite` | 2026-08-30 | `38e4a45` |
| `focus-pivot-timer-plus-algs` | 2026-08-30 | `269d9aa` |
| `alg-reference-core` | 2026-08-30 | `1124b6a` |
| `notion-dark-polish` | 2026-08-30 | `c6b070a` |
| `wca-visualcube-integration` | 2026-08-30 | `bd0c5c2` |
| `spa-deep-links` | 2026-08-31 | `140872b` |
| `trainer-revival-v2` | 2026-09-06 | `d79636c` |
| `vercel-spa-ship` | 2026-09-07 | `f0d8cdd` |
| `quality-sprint-sep9` | 2026-09-09 | `1f4107c`…`5bf36c3` |
| `ll-method-tiers-and-pipeline` | 2026-09-10 | `850768c` |

### Open product questions (not answered by git history)

- Will Tutorial tab return, or is Alg Reference the permanent “tutorial” surface?
- Will Roux/ZZ/2×2 placeholders return now that registry abstraction exists?
- Is README update planned to reflect 4/3/2-Look LL naming and Flashcards tab?
- Who is the target user at default `cfop-4look` — absolute beginner or returning cuber?
- Should Cross/F2L expand to full case libraries, or stay intentionally minimal?

---

**Auditor note:** This draft is derived solely from git history + HEAD source skim. No files were written; workspace unchanged. Merge with parallel researchers should reconcile any conflicting claims about deployment status, issue #8 final taxonomy, and Tutorial content migration.
