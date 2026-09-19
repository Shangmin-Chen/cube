# Current State (HEAD `5157ef2`)

**Shipped product** = git commit `5157ef2` on `main` (merge of PR #50).

---

## Architecture & Surface Summary

Cube is a dark-mode Single Page Application (SPA) designed for Rubik's cube speedsolving and CFOP algorithmic training. It has three core surfaces:

1. **Speedsolving Timer** (`/timer`, default home route)
2. **Flashcards Trainer** (`/train`)
3. **Algorithm Reference** (`/algs`)

The default solving method is **4-Look LL beginner CFOP** (`cfop-4look`): 4 verified beginner Cross cases, 4 F2L fundamentals, 9 2-Look OLL cases, and 7 2-Look PLL cases (24 cases total). Intermediate and advanced tiers provide 3-Look LL and Full CFOP (2-Look LL, 86 cases total).

All code passes automated verification scripts for algorithm simulation, cross correctness, trigger deduplication, trainer session state, and upstream lockfile integrity, integrated via GitHub Actions CI.

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `<Navigate to="/timer" replace>` | Redirects to timer |
| `/timer` | `TimerTab` | Default home; speedsolving timer and session stats |
| `/train` | `TrainerTab` | Flashcard trainer (query params: `method`, `deck`) |
| `/algs` | `AlgReferenceTab` | Algorithm reference browser (default step: `cross`) |
| `/algs/:step` | `AlgReferenceTab` | Step filter (`cross`, `f2l`, `oll`, `pll`, `bookmarked`) |
| `/algs/:step/:caseId` | `AlgReferenceTab` | Step and specific case selected |
| `*` | → `/timer` | Wildcard fallback |

---

## Method Tiers

Default method: **`cfop-4look`**.

| ID | Label | Cases | Structure |
|----|-------|------:|-----------|
| `cfop-4look` | 4-Look LL (Beginner CFOP) | 24 | 4 Cross + 4 F2L + 9 2-Look OLL + 7 2-Look PLL |
| `cfop-3look` | 3-Look LL (Intermediate CFOP) | 39 | 4 Cross + 4 F2L + 10 2-Look OLL + 21 Full PLL |
| `cfop-2look` | 2-Look LL (Full CFOP) | 86 | 4 Cross + 4 F2L + 57 Full OLL + 21 Full PLL |

- **Hand-authored cases (8):** 4 Cross insertions + 4 F2L fundamental slot insertions in `src/data/cfopData.ts`.
- **Pipeline-generated LL cases (94):** 10 2-Look OLL + 6 2-Look PLL + 57 Full OLL + 21 Full PLL in `src/data/generated/`.
- **Alternative algorithms (87 variations):** Maintained in generated datasets and verified by `verify:algs`.

---

## Persistence Keys

| Key | Surface | Storage | Invalidation / Lifetime |
|-----|---------|---------|-------------------------|
| `cfop_solves` | Timer solve history | `localStorage` | Persisted until cleared by user |
| `cfop_bookmarks` | Starred algorithms | `localStorage` | Synchronized across tabs via `cube:bookmarks_updated` |
| Trainer round / mastery | Flashcards session | React state (`trainerSessionLogic`) | In-memory session lifetime |

---

## Timer Surface

- **WCA Random-State Scramble:** Generated via `cubing/scramble` (`randomScrambleForEvent('333')`), producing authentic WCA competition-standard scrambles.
- **Hold-to-Ready:** 300ms hold threshold; spacebar, mouse, or touch triggers state transitions. Spacebar input has double-fire protection.
- **Inspection Countdown:** Optional 15-second inspection mode. Counts down from 15s to 0s with visual alerts. Automatically applies +2 penalty between 15s and 17s, and DNF after 17s.
- **Clock Display:** Resets to `0.00` on ready/start. Tracks hundredths of a second during solve.
- **Statistics & Averages:** Computes total solves, best time, Average of 5 (Ao5), and Average of 12 (Ao12). Trims highest and lowest solves per WCA rules.
- **3D Scramble Preview:** Interactive `RubiksCube3D` widget renders the cube in `mode="scramble"` matching the generated scramble sequence.

---

## Flashcards Trainer Surface

- **Active Recall HUD:** Uses 3D CSS flip cards (`FlashCard.tsx`) with VisualCube diagram on the front and algorithm mechanics on the back.
- **Keyboard Shortcuts:**
  - `Space` / `Enter`: Flip card
  - `←` / `→`: Navigate previous / next card
  - `1` / `X`: Mark Still Learning
  - `2` / `C`: Mark Mastered
  - `S`: Bookmark / unbookmark
  - `R`: Restart round
  - `H`: Reveal hint
- **Isolated Round State:** Mastered and learning sets are strictly disjoint (`trainerSessionLogic.ts`). Progress percentage accurately reflects current card index over total round deck.
- **Mastery Celebration:** Confetti fires exclusively upon completing a round with 100% mastery.

---

## Algorithm Reference Surface

- **Hierarchy & Search:** Browse by step (`cross`, `f2l`, `oll`, `pll`, `bookmarked`) or search across all algorithms in the selected method.
- **Trigger Badges & Syntax:** Algorithms display token-aligned badges for common triggers (e.g., Sexy Move, Inverse Sexy, Sledgehammer, Hedgeslammer, Sune, Anti-Sune).
- **Master-Detail 3D Inspector:** Interactive 3D Rubik's cube simulator allows step-by-step playback, 90° snap rotations, and move-by-move execution.

---

## Pipeline & Verification Architecture

- **Ingestion & Lockfile:** `scripts/ingest/upstream.lock.json` pins upstream J Perm content with a SHA-256 hash. `scripts/verify-upstream-pin.mjs` enforces lockfile integrity offline.
- **Trigger Pattern Table:** Unified table in `src/utils/triggerPatterns.ts` verified by regex boundary oracle (`scripts/verify-triggers.ts`).
- **Semantic Simulation:** `scripts/verify-cfop.mjs` verifies algorithm correctness, U-layer orientations, hold descriptions, and probability consistency.
- **Cross Case Verification:** `scripts/verify-cross-cases.mjs` validates all 4 cross cases against physical cube simulations and rejects invalid legacy patterns.
- **Trainer State Verification:** `scripts/verify-trainer-session.ts` verifies session isolation, disjoint mastery sets, and confetti triggering.
- **Automated CI:** GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push and pull request.
