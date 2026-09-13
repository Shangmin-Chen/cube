# Product

**Cube** is a browser SPA for CFOP speedcubing practice: a timer, a searchable algorithm reference with 3D playback, and a flashcard trainer.

It is **not** a full CFOP course. Cross is one sample case. F2L is four highlights. Last-layer coverage is the real library (2-Look and Full OLL/PLL via generated JSON).

| | |
|--|--|
| Product truth | **`850768c` (2026-09-10)** |
| Brand | **Cube** (`a1e74bf`), not CFOP PRO |
| Visual system | **Notion Dark** (`c6b070a`): page `#191919`, surfaces `#202020`, borders `#2d2d2d`, accent `#eab308`. No gradients |
| `<title>` | `Cube - Speedcubing & Algorithm Suite` (`index.html`) |

Default method everywhere it is selected: **`cfop-4look`** (beginner 4-Look LL). Footer still says “2-Look OLL • 2-Look PLL • Intuitive F2L”.

---

## Surfaces at HEAD

Nav order: **Timer → Flashcards → Algorithms**. Logo click → `/timer`. `/` redirects to `/timer`. Mobile nav is icon-only (`Navbar.tsx`).

| Nav label | Route | Job |
|-----------|-------|-----|
| Speedsolving Timer | `/timer` (also `/`) | Hold-to-start clock, scramble banner, 3D preview, history, Best/Ao5/Ao12 |
| Flashcards | `/train` | Method-aware LL decks, round mastery (session-only), keyboard HUD |
| Algorithms | `/algs`, `/algs/:step`, `/algs/:step/:caseId` | Method selector, CFOP steps, search, bookmarks, 3D playback, VisualCube diagrams |

### Timer (`TimerTab.tsx`)

- Custom **21-move** face-turn scramble (`generateScramble(21)` in `cubeLogic.ts`): random faces; blocks consecutive same face and U-D-U-style opposite pairs; **allows** consecutive opposite faces (e.g. `U D`). Badge: “WCA Official 3x3 Scramble”. Button `aria-label`: “Generate new WCA scramble”. **Not** `cubing` random-state. Tracker **#27** open.
- States: `idle` → `holding` (300ms) → `ready` → optional `inspection` → `running`.
- Input: window spacebar, pointer on timer card, Enter when focused. Window Space **and** card `onKeyDown` both fire on focused card — possible double-trigger (#24).
- **Clock display:** `elapsedTime` is only written while running or at stop; it is **never cleared** on idle/holding/ready/inspection — digits show the **last solve time** until the next run.
- “15s Inspection” is a checkbox that switches into `inspection` with copy “Inspecting…”. **No 15s countdown or +2-on-timeout** at HEAD. Tracker **#24** open.
- History: newest-first, `+2` / DNF / delete / clear-all `confirm()`. `+2` adds 2000 ms. Ao5/Ao12 use **most recent** N after `#20` (`9a149a8`).
- Persistence: `cfop_solves`.
- 3D preview: `RubiksCube3D` with `initialAlgorithm={scramble}`, default `mode='algorithm'`, `practicePhase='solve'`. Step 0 shows **inverse(scramble)**, not the scramble position — issue **#24**. Still exposes setup/solve toggle, 90° snap arrows, and step bar (same chrome as Reference inspector). `mode='scramble'` exists in the component but **no caller** uses it.

### Algorithm Reference (`AlgReferenceTab.tsx`)

- Hero: method `<select>`, title “Algorithm Reference & Mechanics”, search, collapsible 4 Core Triggers hub.
- **Method is React state, not a URL param.** Sharing `/algs/oll/:id` always opens viewer’s default `cfop-4look` unless they switch. Case IDs differ across tiers (2-Look vs Full). Cold load of `/algs/oll/oll-1` will not find Full OLL until the user switches to `cfop-2look`.
- Steps from method pipeline: Cross, F2L, OLL, PLL + bookmarks pseudo-step. Invalid URL step → first method step (`cross` at HEAD), else `'oll'`.
- Search: name / alg / group / `why` (local state, not shareable). When non-empty, searches **all cases in the current method** (not step-scoped) — e.g. Cross search can return Full-PLL rows. Clears selection; de-emphasizes step `aria-current`.
- 2D diagrams: **VisualCube** (`visualcube.api.cubing.net`). `topGrid`/`borderColors` still on Cross/F2L types; `AlgDiagram` does not render them (dead at HEAD; **#9** open).
- 3D inspector + Radix Dialog fullscreen playback. Inspector shows primary alg only — no `why`, `tips`, or `description` mechanics paragraph. `why` = flashcard back + search match; `description` = fullscreen Dialog only; `tips` never rendered.
- Trigger chips + runtime badges (`parseTriggers`, `detectAlgBadges`).
- “Train in Flashcards” → `/train?deck=…&method=…` via `getDeckForStep` (bookmark hijack fixed in `#40` / **#22**).

### Flashcards (`TrainerTab.tsx` + hooks)

Trainer v1 (`38e4a45`) was deleted `269d9aa` (2026-08-30). Trainer v2 restored `d79636c` (PR #1).

- Query: `?method=cfop-4look|cfop-3look|cfop-2look&deck=<id>`. Defaults: method `cfop-4look`, deck `bookmarks`.
- Decks: Bookmarks, dynamic LL subcategories (2-Look or Full depending on method), All Algorithms (OLL+PLL only — **no Cross/F2L decks**).
- Card: CSS 3D flip (`FlashCard.tsx`) with VisualCube front (`AlgDiagram`) / alg back — **not** `RubiksCube3D`. Hint = case name; setup = inverse of `primaryAlg`; trigger chips; badges; copy buttons mouse-only.
- Round shuffle (default on); mastered vs learning; confetti on round complete; session state only (v1 persistent mastery **not** restored).
- Keyboard: Space/Enter flip, arrows, 1/X learning, 2/C mastered, S bookmark, R restart, H hint; modifiers ignored (`723526f`, **#25**).
- Round 2+ session bugs still open (#21); #40 only fixed bookmark-deck hijack (#22).

---

## Method model (user-facing)

Selector only changes LL depth. Cross (1) and F2L (4) are **identical** on all three tiers. Counts: see `algorithms-and-methods.md`.

Removed placeholders (`aef759e`): Roux, ZZ, 2×2 — UI stubs since **`26359fe` (2026-08-30)**; empty registry entries added PR #1 (`4652d7f`); never populated with cases.

---

## Branding arc

| Date | Commit | Event |
|------|--------|-------|
| 2026-08-30 | `38e4a45` | Launch brand **CFOP PRO**; 4-tab suite |
| 2026-08-30 | `a1e74bf` | Rename **Cube** (title, navbar, README) |
| 2026-08-30 | `c6b070a` | Notion Dark + Radix packages |
| 2026-09-07 | `f0d8cdd` | Custom favicon |

---

## Shipped then removed (not restored)

| Feature | In | Out | Notes |
|---------|----|-----|-------|
| Tutorial tab | `38e4a45` | Nav `7f8b015`; files `269d9aa` | `why` briefly in Reference `7bcacd9`–`b1977c5`; dropped `bd0c5c2`; HEAD `why` = flashcard back only |
| Reference `why`/`tips` panel | `7bcacd9` | `bd0c5c2` (VisualCube refactor) | Mechanics paragraph never restored in Reference |
| PLL/F2L local 2D grids | `666788a` | Before pipeline / `AlgDiagram` | `topGrid`/`borderColors` on PLL+F2L; generated JSON never had them; Cross/F2L types still carry unused grids (**#9**) |
| Trainer v1 | `38e4a45` | `269d9aa` | Static decks `2oll`/`2pll`/`fullpll`; `cfop_trainer_mastered` |
| CFOP PRO name | `38e4a45` | `a1e74bf` | |
| Gradient/slate chrome | `38e4a45` | `c6b070a` | |
| Roux / ZZ / 2×2 Coming Soon UI | `26359fe` (Aug 30) | `aef759e` | Disabled `<select>` options; empty registry in PR #1 |
| Runtime J Perm scrape | `bd0c5c2` (`fetchThirdPartyAlgData`) | `5f5c11a` (#23) | Moved to `cfopData` on PR #1 branch; replaced by build-time pipeline in `850768c` |

## Removed then restored (new implementation)

| Feature | v1 | Gap | v2 |
|---------|----|-----|----|
| Flashcard trainer | `38e4a45` | `269d9aa` (~7 days) | `d79636c` — label **Flashcards**, `/train`, dynamic decks |

Homepage default: Tutorial → Timer → Reference → Timer on Aug 30; **stable `/` → `/timer` since `140872b`**.

## Evolved in place

| Feature | Shape at HEAD |
|---------|----------------|
| Alg Reference | CFOP 4-step pipeline + deep links + 4/3/2-Look method selector + generated LL JSON |
| CFOP data | Hand `cfopData.ts` → failed runtime fetch → `scripts/` pipeline + `src/data/generated/*.json` |
| “2-Look CFOP” branding | Single default view (`7bcacd9`) → **three named LL tiers** (`850768c`) |
| Triggers | Literal parse → palindrome chunking (`7258563`) → chip formatting (`f8b0abe`) → dynamic palindrome (`f5d7d10`) |

---

## README vs product (drift)

`README.md` last commit: **`a1e74bf` (2026-08-30)** — before Trainer v2, routing, method tiers, pipeline.

Three different “default CFOP depth” signals ship together:

| Surface | Signal |
|---------|--------|
| Method selector / `getMethod()` | **`cfop-4look`** |
| Footer (`App.tsx`) | *2-Look OLL • 2-Look PLL • Intuitive F2L* |
| `README.md` | Tutorials + 2-Look/Full PLL trainer + “mastery tracking” |

| README claim | HEAD |
|--------------|------|
| “CFOP method tutorials” | No Tutorial tab. Reference shows primary alg + triggers; `why` on flashcard back only. Triggers hub copy still says “All **78** algorithms…” (57+21 Full OLL+PLL, not default 4-look) |
| Flashcards: “2-Look OLL, 2-Look PLL, and Full PLL” + “progress tracking” | Three method tiers; Full OLL under `cfop-2look`; mastery is **session-only** |
| “WCA-compliant” scramble generation | Label only; random-move generator (**#27**). Inspection incomplete; Ao is WCA-style trim on most-recent N |
| Tech: React, Vite, Tailwind, Three.js, Lucide, Confetti | Also: react-router-dom v7, Radix Dialog, `cubing`, Tailwind v4 plugin, oxlint, alg pipeline |

---

## Shareability

| In URL | Not in URL |
|--------|------------|
| `/timer` | Alg Reference method |
| `/train?deck=&method=` | Alg Reference search |
| `/algs/:step/:caseId` | Trainer shuffle, round, mastery |
| | 3D playback / practice phase |

Method change in Reference navigates `/algs/:step` and **drops `:caseId`** (`AlgReferenceTab.tsx`).

SPA hosting: `vercel.json` rewrite all paths to `/` (`f0d8cdd`). **No commit records a production URL or deploy event.**

---

## Accessibility (as coded, not audited)

Labeled nav, timer card, scramble actions, bookmarks, Dialog title. `RubiksCube3D` has control labels (`bd0c5c2`). Trainer flip is hook-driven; card click vs keyboard not independently re-audited after Trainer v2. Native `<select>` for methods. Radix Tabs unused — custom button groups without roving tabindex.

---

## Target user (inferred, not documented)

Default `cfop-4look` implies **beginner CFOP** (2-Look OLL + 2-Look PLL). Cross/F2L are **highlight samples**, not teaching libraries. Whether that is intentional scope is **unanswered by git**.

Unresolved intent: homepage flipped four times in four minutes on Aug 30; timer-first won without a recorded product discussion. Footer/README still market 2-Look; product default is 4-Look beginner CFOP. Tutorial content was deleted, not ported as a surface (`269d9aa` has no “moved to Reference” note).
