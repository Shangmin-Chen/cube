# Architecture

Product tree = `850768c`. This worktree tip `9dce376` does not change `src/` or `scripts/`. Vite SPA; no backend; no CI.

## Stack (`package.json` at HEAD)

| Layer | At HEAD |
|-------|---------|
| UI | React 19.2, react-dom 19.2, TypeScript ~6.0 |
| Build | Vite 8.2, `@vitejs/plugin-react` 6 |
| CSS | Tailwind CSS v4.3 + `@tailwindcss/vite` |
| Routing | `react-router-dom` v7.18 (`140872b`) |
| 3D | Three.js 0.185 (`RubiksCube3D.tsx`) |
| 2D diagrams | VisualCube HTTP API via `AlgDiagram.tsx` (`bd0c5c2`) |
| Cubing | `cubing` 0.63 — **Alg parse/invert** in app (`cubeLogic.ts`); **KPuzzle** in Node pipeline. Not used for scramble generation |
| UI kit | Radix packages: accordion, dialog, dropdown-menu, select, tabs, tooltip. **Used in UI:** Dialog only. `card.tsx` / `badge.tsx` are custom divs. `src/components/ui/tabs.tsx` wraps Radix Tabs and is **never imported**. Accordion/dropdown/select/tooltip unused in `src/` |
| Icons / FX | lucide-react, canvas-confetti |
| Lint | oxlint (`npm run lint`) — manual |
| Host | Vercel SPA rewrite (`vercel.json`, `f0d8cdd`) |

Scripts: `dev`, `build` (`tsc -b && vite build`), `preview`, `lint`, `sync:algs`, `verify:algs`.

**No** vitest/jest/playwright. **No** `.github/workflows`. `verify:algs` needs `npm install` (`cubing`).

## Source layout

```
src/
  main.tsx                 StrictMode mount
  App.tsx                  BrowserRouter + routes + footer
  index.css                Tailwind / Notion Dark tokens
  components/
    Navbar.tsx
    TimerTab.tsx
    TrainerTab.tsx
    AlgReferenceTab.tsx
    AlgDiagram.tsx         VisualCube <img>
    RubiksCube3D.tsx       Three.js cube + playback
    trainer/               FlashCard, TrainerDeckSelector, RoundSummary, TriggerChips
    ui/                    card, badge, dialog, unused tabs
  hooks/
    useBookmarks.ts        localStorage + custom event
    useTrainerSession.ts   round state (not persisted)
    useTrainerKeyboard.ts
  services/algService.ts   method registry, decks, steps
  data/
    cfopData.ts            Cross/F2L hand cases + method objects + JSON imports
    methodsData.ts         BUILTIN_METHODS = three CFOP methods
    generated/*.json       pipeline artifacts (committed)
  types/cube.ts
  utils/cubeLogic.ts       scramble, invert, triggers, badges, AoN, formatTime
  lib/utils.ts             cn() = clsx + tailwind-merge
scripts/
  sync-algorithms.mjs      orchestrator
  verify-cfop.mjs
  ingest/fetcher.mjs       fetch jperm.net JS → vm → algsetAlgs
  pipeline/{rules,transformers,exporter}.mjs
```

## Runtime composition

```
BrowserRouter
  Navbar (path-based active tab)
  Routes
    /                → Navigate /timer
    /timer           → TimerTab
    /train           → TrainerTab  (?method &deck)
    /algs            → AlgReferenceTab
    /algs/:step
    /algs/:step/:caseId
    *                → Navigate /timer
  footer
```

Trainer query params are the only **shareable method** encoding. Alg Reference `selectedMethod` is component state (default `cfop-4look`); changing method keeps the current step if `isValidStep`, else first step (`850768c`). Invalid URL step: `steps[0]?.id || 'oll'` → **`cross`** at HEAD.

## Method registry

`algService.ts` registers `[CFOP_4LOOK_METHOD, CFOP_3LOOK_METHOD, CFOP_2LOOK_METHOD, ...BUILTIN_METHODS]` into a `Map`. At HEAD `BUILTIN_METHODS` **is the same three objects** — duplicate `set` is harmless (leftover from coming-soon registry).

- `getMethod('cfop' | '' | missing)` → `cfop-4look`
- `getAvailableMethods()` requires `isAvailable` and `cases.length > 0` (why Roux/ZZ/2×2 never appeared as usable methods even when listed)
- `getSteps` builds tabs from `method.steps` + bookmarks
- `getDecks` groups **OLL/PLL only** by `subcategory` (slugify)
- `getDeckForStep` maps oll/pll → `2-look-*` vs `full-*` by method; **does not** send Train-from-step to Bookmarks (#22, fixed in #40); cross/f2l → `all`

## Data flow

```
jperm.net/lib/{2lookoll,2lookpll,oll,pll}.js
        │  npm run sync:algs (manual, unpinned fetch at HEAD)
        ▼
ingest/fetcher.mjs  →  transformers.mjs + rules.mjs (KPuzzle)
        ▼
src/data/generated/*.json   (committed)
        ▼
cfopData.ts  CROSS_CASES + F2L_HIGHLIGHTS + JSON → three AlgMethod objects
        ▼
algService METHOD_REGISTRY (Map)
        ▼
AlgReferenceTab / TrainerTab / getDecks / getSteps
```

Hand path: `CROSS_CASES`, `F2L_HIGHLIGHTS` stay in `cfopData.ts` (never in `verify:algs`).

`npm run sync:algs` is **unpinned live fetch**. Regenerating can rewrite JSON without a SHA pin (later #43). No `upstream.lock.json` or `ALGORITHM_OVERRIDES` at HEAD.

`cubing/puzzles` is imported only in scripts, not in the browser bundle.

## Pipeline (Node, not bundled)

| Module | Role |
|--------|------|
| `sync-algorithms.mjs` | Orchestrate fetch → transform → count asserts → export |
| `ingest/fetcher.mjs` | HTTP GET; `vm.runInContext`; read `algsetAlgs` |
| `pipeline/transformers.mjs` | ID maps, `why`/`description`/`probability` meta tables, sort |
| `pipeline/rules.mjs` | `formatWCARule` → `balanceRotationsRule` → AUF rules (`alignEdgesOnlyAUFRule`, `alignAdjacentCornerAUFRule`) → `validateAlg` |
| `pipeline/exporter.mjs` | pretty-print JSON under `src/data/generated/` |
| `verify-cfop.mjs` | Length checks 10/6/57/21; parse all primaries **and** alts; **semantic invariants on PLL primaries only** (centers identity; edges-only corners identity) |

`balanceRotationsRule` tries a **single** suffix in `{y', x', x, y, z', z}`.

## Client logic (`cubeLogic.ts`)

| Function | Role |
|----------|------|
| `generateScramble(n)` | Random face moves; default `n=20`; Timer uses `n=21`. Blocks consecutive same face and U-D-U-style opposite pairs; **allows** consecutive opposites (`U D`). Not WCA official |
| `invertMoveString` | `cubing/alg` invert; `U2'` → `U2` (#26). Fallback manual invert |
| `parseTriggers` | Chunk algs into named triggers + palindromes |
| `detectAlgBadges` | Substring badges on `primaryAlg` at render |
| `calculateAO` | WCA-style trim of **most recent** N (queue index 0 = newest) |

Badges are **not** data fields. `AlgCase.setupMoves` exists on the type; **never populated**. Setup = invert of `primaryAlg` at runtime.

## 3D and diagrams

- **`RubiksCube3D`:** Three.js sticker cube; Notion sticker palette; orbit; step playback; 1-tap setup/solve toggle; overlay 90° snap arrows; M/E/S slice engine (`b1977c5`). Used on **Timer** and **Alg Reference** inspector only — **not** Trainer. Timer passes `initialAlgorithm={scramble}`, `autoPlay={false}`, default `mode='algorithm'`, `practicePhase='solve'` — step 0 is **inverse(scramble)** (#24). `mode='scramble'` adds a Scramble button but **no caller** passes it.
- **`AlgDiagram`:** `visualcube.api.cubing.net` plan view, `stage` from category (`cross` → `fl`). Props `topGrid`/`borderColors` are accepted but **unused**. Network dependency; `onError` shows placeholder text. Trainer **front face** uses `AlgDiagram` inside a CSS 3D flip (`FlashCard.tsx`: `perspective-1000` / `rotate-x-180`), not `RubiksCube3D`.

## Persistence

| Key / event | Owner | Shape |
|-------------|-------|-------|
| `cfop_solves` | TimerTab | `SolveRecord[]` (id, time ms, scramble, date, penalty); try/catch parse |
| `cfop_bookmarks` | `useBookmarks` | `string[]` case IDs; `storage` + `cube:bookmarks_updated` |
| ~~`cfop_trainer_mastered`~~ | Trainer v1 | unread at HEAD; may linger in old browsers |

No user accounts. No server. No trainer persistence at HEAD.

## Spacebar

Timer and Trainer both attach window keydown when mounted. Safe while routes are exclusive; **no guard** if both ever mount.

**Timer clock:** `elapsedTime` is set only by the running interval and `stopTimer`. It is **never cleared** on idle / holding / ready / inspection — after a solve, the big digits still show the last result until the next run starts. Inspection checkbox does not start a countdown interval; there is no 15s display.

**Timer Space double-fire:** `TimerTab` registers **both** a window `keydown` Space handler (with `e.repeat` guard) **and** card `onKeyDown` Space/Enter. When the card is focused, one Space keydown can invoke `handleTriggerPress` twice because `setState` is async and the first `holdTimer` is not cleared — source-confirmed dual listener (#24).

## Hosting / entry

- `index.html` → `src/main.tsx` StrictMode `App`
- `vercel.json`: `"/(.*)"` → `/` so `/algs/pll/pll-t` does not 404 on refresh
- Vite config: React plugin + Tailwind v4 plugin only (no path aliases)
