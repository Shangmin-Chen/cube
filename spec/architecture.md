# Architecture

Product architecture at commit `5157ef2` on `main`. Vite Single Page Application (SPA); static client-only deployment; automated CI verifications.

---

## Tech Stack (`package.json`)

| Layer | Technology | Usage |
|-------|------------|-------|
| UI Runtime | React 19.2, TypeScript ~6.0 | Component rendering, state hooks |
| Build Tooling | Vite 8.2, `@vitejs/plugin-react` | Hot Module Replacement, production bundling |
| Styling | Tailwind CSS v4.3 (`@tailwindcss/vite`) | Utility classes, Notion Dark theme tokens |
| Routing | `react-router-dom` v7.18 | Client-side routing (`/timer`, `/train`, `/algs`) |
| 3D Simulation | Three.js 0.185 | `RubiksCube3D.tsx` interactive sticker cube simulator |
| 2D Diagrams | VisualCube HTTP API | `AlgDiagram.tsx` SVG/PNG plan views |
| Cubing Engine | `cubing` 0.63 (`alg`, `scramble`, `kpuzzle`) | Alg parsing, inversion, WCA random scrambles, pipeline normalization |
| Testing / Verification | Node.js test scripts + `oxlint` | Automated semantic & structural invariant checks |
| Continuous Integration | GitHub Actions (`.github/workflows/ci.yml`) | Automated build, lint, and verification pipeline |
| Hosting | Vercel SPA rewrite (`vercel.json`) | Static hosting with path fallback to `index.html` |

---

## Source Directory Layout

```text
src/
  main.tsx                 StrictMode application entry
  App.tsx                  BrowserRouter, top-level routes, footer
  index.css                Tailwind v4 tokens & Notion Dark theme
  components/
    Navbar.tsx             Top navigation bar
    TimerTab.tsx           Speedsolving timer & statistics
    TrainerTab.tsx         Flashcards active recall trainer
    AlgReferenceTab.tsx    Algorithm browser & master-detail inspector
    AlgDiagram.tsx         VisualCube 2D plan view component
    RubiksCube3D.tsx       Three.js 3D Rubik's cube simulator
    trainer/               FlashCard, TrainerDeckSelector, RoundSummary, TriggerChips
    ui/                    Card, Badge, Dialog components
  hooks/
    useBookmarks.ts        Bookmark persistence & cross-tab synchronization
    useTrainerSession.ts   Trainer session orchestration hook
    trainerSessionLogic.ts Pure session state logic (mastery/learning isolation)
    useTrainerKeyboard.ts  Keyboard shortcuts for flashcard training
  services/
    algService.ts          Method registry, step mappings, deck queries
  data/
    cfopData.ts            Hand cases (4 Cross + 4 F2L), method definitions, JSON imports
    methodsData.ts         Built-in CFOP method tiers
    generated/*.json       Committed pipeline artifacts (2-Look & Full OLL/PLL)
  types/cube.ts            TypeScript definitions (AlgCase, AlgMethod, CFOPStep)
  utils/
    cubeLogic.ts           Scramble generation, move inversion, formatters
    triggerPatterns.ts     Unified trigger pattern definitions and token matchers
scripts/
  sync-algorithms.mjs      Orchestrator for upstream algorithm ingestion
  verify-cfop.mjs          Alg parsing, orientation invariants, probability sums
  verify-cross-cases.mjs   Verification of Cross beginner insertion cases
  verify-triggers.ts       Trigger badge oracle and shadowing order checks
  verify-trainer-session.ts Verification of trainer round state and confetti
  verify-upstream-pin.mjs  SHA-256 lockfile integrity checker
  ingest/
    fetcher.mjs            Fetches upstream J Perm library
    upstream-lock.mjs      Lockfile hashing and verification
    upstream.lock.json     Committed SHA-256 digest lockfile
  pipeline/
    rules.mjs              AUF normalization, rotation balancer, move validation
    transformers.mjs       Case metadata, probability assignments, ID formatting
    exporter.mjs           JSON writer for src/data/generated/
```

---

## Data Flow & Ingestion Pipeline

```text
jperm.net/lib/{2lookoll, 2lookpll, oll, pll}.js
         │  npm run sync:algs (validates SHA-256 against upstream.lock.json)
         ▼
scripts/ingest/fetcher.mjs  →  transformers.mjs + rules.mjs (KPuzzle simulation)
         ▼
src/data/generated/*.json (committed JSON files)
         ▼
src/data/cfopData.ts (combines 4 Cross + 4 F2L + generated JSON)
         ▼
src/services/algService.ts (registers methods: cfop-4look, cfop-3look, cfop-2look)
         ▼
UI Surfaces (TimerTab, TrainerTab, AlgReferenceTab)
```

- **Upstream Pinning:** Ingestion requires `upstream.lock.json` to match upstream content digests, preventing drift.
- **Rotation Balancer:** Balances cube rotations to minimize whole-cube regrips during algorithm execution.
- **AUF Alignment:** Normalizes U-layer alignments before and after algorithm execution.

---

## Client Logic & State Systems

1. **WCA Random Scramble Generation (`cubeLogic.ts`):**
   - Implemented via `randomScrambleForEvent('333')` from `cubing/scramble`.
   - Generates authentic random-state scrambles compliant with WCA regulations.
2. **Timer State Machine (`TimerTab.tsx`):**
   - States: `idle` → `holding` (300ms) → `ready` → optional `inspection` (15s countdown with +2/DNF penalty evaluation) → `running` → `stopped`.
   - Clock resets to `0.00` on ready/start.
   - Spacebar handler includes double-fire guard preventing duplicate event triggers.
3. **Trainer Session Logic (`trainerSessionLogic.ts`):**
   - Strictly disjoint state sets: marking a card as mastered removes it from the learning set and vice-versa.
   - Accurate deck progress calculation based on active card index.
4. **Trigger Pattern Parsing (`triggerPatterns.ts`):**
   - Single unified pattern table for identifying common cubing triggers (Sexy Move, Sledgehammer, Hedgeslammer, Sune, etc.) using tokenized boundary matching.

---

## Automated Verification Suite

Run locally via npm or automatically in CI:

| Script | Command | Purpose |
|--------|---------|---------|
| `lint` | `npm run lint` | Fast static analysis via `oxlint` |
| `verify:algs` | `npm run verify:algs` | Verifies algorithm syntax, orientation invariants, and Cross cases |
| `verify:cross` | `npm run verify:cross` | Validates Cross case physical simulations against cubing.js |
| `verify:triggers` | `npm run verify:triggers` | Verifies trigger badge detection against regex oracle |
| `verify:trainer` | `npm run verify:trainer` | Verifies round state isolation and celebration invariants |
| `verify:upstream-pin` | `npm run verify:upstream-pin` | Verifies upstream lockfile SHA-256 digests |
| `build` | `npm run build` | Full TypeScript typecheck (`tsc -b`) and Vite production build |
