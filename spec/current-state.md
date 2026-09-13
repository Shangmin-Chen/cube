# Current state (HEAD `850768c`)

**Shipped product** = git object `850768c` (2026-09-10 16:46 EDT), merge of PR #40.  
This branch may show `9dce376`; that commit is research-only and does **not** change the app. Product files in this worktree match `850768c`.

## One-screen snapshot

Cube is a Notion-dark SPA with three routes: Timer (default home), Flashcards, Algorithms. Default solving method is **4-Look LL beginner CFOP** (`cfop-4look`): 1 sample Cross + 4 F2L highlights + 10 2-Look OLL + 6 2-Look PLL. Intermediate/full tiers swap in Full PLL and Full OLL from committed J Perm JSON. There is no CI and no automated UI tests. Last-layer algs are pipeline-generated; Cross/F2L are hand-written. The Cross sample algorithm is known-incorrect. README and footer still describe a 2-Look-centric tutorial+mastery product that is not what ships.

Prefer: “At main `850768c` the app ships three CFOP LL tiers over a J Perm pipeline, with sample Cross/F2L, session-only trainer, and an untested timer.”  
Avoid: crediting Sep 13 fix branches or calling `9dce376` a release.

---

## Routes

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `<Navigate to="/timer" replace>` | |
| `/timer` | `TimerTab` | Default home; logo target |
| `/train` | `TrainerTab` | Query: `method`, `deck` |
| `/algs` | `AlgReferenceTab` | Default step = method’s first step (`cross`) if URL step invalid; code fallback `'oll'` if steps empty |
| `/algs/:step` | same | `cross` \| `f2l` \| `oll` \| `pll` \| `bookmarked` |
| `/algs/:step/:caseId` | same | Bookmark step preserved (`1b77024`) |
| `*` | → `/timer` | |

Nav labels: **Speedsolving Timer** · **Flashcards** · **Algorithms**.

### Shareable vs not

| In URL | Not in URL |
|--------|------------|
| `/timer` | Alg Reference `selectedMethod` (always starts `cfop-4look`) |
| `/train?method=&deck=` | Alg search query |
| `/algs/:step/:caseId` | Trainer shuffle, round, mastery; Alg Reference method |
| | Alg Reference search; 3D playback position / practice phase |

Changing Alg Reference method navigates `/algs/:step` and drops `:caseId`.

SPA refresh: `vercel.json` rewrite → `index.html`.

---

## Methods

Default: **`cfop-4look`**. Selector lists only available methods with cases.

| ID | Label | Cases |
|----|-------|------:|
| `cfop-4look` | 4-Look LL (Beginner CFOP) | 21 |
| `cfop-3look` | 3-Look LL (Intermediate CFOP) | 36 |
| `cfop-2look` | 2-Look LL (Full CFOP) | 83 |

Generated LL cases: **94** (10+6+57+21). Alternative algs: **87** (JSON + `verify:algs` only — **not listed in UI**). Hand Cross+F2L: **5**. Other methods: none (UI stubs removed `aef759e`, CFOP restored in `methodsData` by `850768c`).

**HEAD UI trains/plays primary alg only.** `tips` and `probability` exist in JSON/types but are never rendered. `why` appears on flashcard back only.

Trainer default query: `?method=cfop-4look&deck=bookmarks`. Empty bookmarks → CTA to first category deck or `/algs`.

---

## Persistence

| Key | Surface | Lifetime |
|-----|---------|----------|
| `cfop_solves` | Timer history | Until user clears |
| `cfop_bookmarks` | Shared Alg Reference + Trainer | Until toggled off |
| Trainer mastery / round | React state | Session only |

Event `cube:bookmarks_updated` plus `storage` keeps bookmarks in sync across tabs.

Orphan: `cfop_trainer_mastered` from Trainer v1 — unused.

---

## Timer surface

- Badge: “WCA Official 3x3 Scramble” — generator is `generateScramble(21)` (blocks consecutive same face and U-D-U-style pairs; **allows** consecutive opposites like `U D`). Open **#27**.
- Hold 300ms to ready; space / mouse / touch / Enter when timer card focused.
- **Display:** `elapsedTime` is never reset between solves — idle / holding / ready / inspection still show the **previous solve time** (hundredths), not `0.00` and not a 15s countdown.
- Inspection: checkbox “15s Inspection”; state `inspection`; **no countdown UI or +2-on-timeout**. Open **#24**.
- Space input: window listener **and** card `onKeyDown` both call `handleTriggerPress` — focused card can double-fire Space (#24).
- Stats: total, best, Ao5, Ao12 (`calculateAO` newest-first, drop best+worst, 2× DNF → DNF). Fixed **#20**.
- Penalties: none / +2 / DNF. +2 adds 2000 ms.
- 3D scramble preview via `RubiksCube3D` (`initialAlgorithm={scramble}`, default `mode='algorithm'`). Solve-phase playback starts at **inverse(scramble)** — open **#24**. Shows setup/solve toggle, 90° snap arrows, play/pause, step tokens (same widget as Reference inspector). `mode='scramble'` is dead API (no caller).

---

## Alg Reference surface

- Hero: method select, title “Algorithm Reference & Mechanics”, search, collapsible 4-core-triggers hub (copy: “All **78** algorithms…” — stale Full OLL+PLL count, not 4-look default).
- Step bar from `getSteps` + Saved Bookmarks.
- Search: when non-empty, filters **all method cases** (global within method), not current step only.
- Master-detail: case list + sticky 3D inspector (primary alg playback + trigger chips + badges; **no** `why`/`tips`/`description`/`probability`/`alternativeAlgs` in UI).
- Case card: VisualCube mini, trigger-colored chunks, badges, bookmark, fullscreen Dialog (`description` in Dialog only).
- Cross-link: Train in Flashcards → `/train?deck={getDeckForStep}&method={selectedMethod}`.

Deep link caveat: `/algs/oll/oll-1` on a cold load uses **4-look** method, so **Full OLL ids are not in that method’s case list** until the user switches to `cfop-2look`.

---

## Trainer surface

- Monkeytype-like HUD; **CSS 3D flip card** (`FlashCard.tsx`: `perspective-1000` / `rotate-x-180`) with **VisualCube** front (`AlgDiagram`) — **not** `RubiksCube3D`. Hint = case name. Copy Setup / Copy Solve on card back are **mouse-only** (no keyboard shortcut).
- Setup scramble = inverse of primary (normalized doubles).
- Keyboard (enabled when a card is active and round not finished):

| Key | Action |
|-----|--------|
| Space / Enter | Flip |
| ← / → | Prev / next (no auto-advance on next-at-end; end via mastered/learning) |
| 1 / X | Learning |
| 2 / C | Mastered |
| S | Bookmark |
| R | Restart round 1 |
| H | Hint |

Ctrl/Meta/Alt ignored (**#25**); Shift is **not** ignored (Shift+S/R/H still fire). Inputs/selects ignored. **No `e.repeat` guard** — holding `2`/`1`/`S`/`R` auto-repeats mastery/learning/bookmark/restart (Timer Space has a repeat guard; Trainer does not).

Round summary: accuracy, review missed (round N+1 on learning ids), confetti if all mastered. Open **#21** for round-2+ state bugs:

- `next` at end of queue does **not** finish the round (only mastered/learning via `advance`).
- `markLearning` adds to `learningIds` but does **not** remove from `masteredIds` (arrows + relabel can leave both sets).
- **Bookmarks deck:** `bookmarkKey = bookmarkedIds.join(',')` retriggers `initRound(..., 1)` — starring/unstarring **during** a bookmarks drill wipes the round.
- **Shuffle on round 2+:** `toggleShuffle` calls `initRound(baseCases, …, roundNumber)` — full deck, not `learningIds`, while keeping `roundNumber`.

Shuffle default **on**. Toggle re-inits current round (same dual-state as #21 on round 2+).

---

## Pipeline

`npm run sync:algs` fetches live J Perm JS, applies rotation/AUF rules, writes JSON. **No lockfile.** `npm run verify:algs` checks counts, parseability, PLL-primary invariants. Cross/F2L and OLL semantics out of scope.

## Build commands a maintainer actually runs

```
npm install
npm run dev
npm run build
npm run lint
npm run sync:algs    # network; overwrites generated JSON
npm run verify:algs  # local JSON + cubing
```

`verify:algs` / `sync:algs` fail without `node_modules` (`cubing`).

---

## Known HEAD mismatches (user-visible)

1. README / footer / default method disagree on CFOP depth.
2. “WCA Official” scramble is random-move.
3. Inspection labelled 15s but not timed; clock shows **last solve time**, not 0 or a countdown.
4. Cross sample `why` vs alg (**#18**).
5. Trainer default deck Bookmarks is often empty (by design).
6. VisualCube requires network; no local `topGrid` fallback despite data on Cross/F2L.

## Open product debt (in-window)

Triggers (#3), diagrams leftover (#9), why/hold copy (#11/#16/#17), Cross sample (#18), PLL corner probs (#19), trainer rounds (#21), timer inspection/input (#24), “WCA” scramble label (#27), verify gaps (#15). Tracker: #2.

## Explicitly later (not in this snapshot)

Unmerged `fix/*` branches and post-HEAD GitHub issues/PRs (not snapshotted). Any claim that Cross has 4 verified cases, or that `topGrid` was removed from types, or that upstream is pinned, is **WIP after HEAD**.
