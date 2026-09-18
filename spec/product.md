# Product

**Cube** is a browser SPA for CFOP speedcubing practice: an official-grade timer, a searchable algorithm reference with 3D playback, and an active recall flashcard trainer.

It focuses on CFOP algorithmic practice: Cross features 4 verified beginner insertions, F2L provides 4 core pair insertions, and the Last Layer provides comprehensive coverage (both 2-Look and Full OLL/PLL datasets).

| Attribute | Value |
|---|---|
| Product Truth | **Commit `5157ef2` on `main`** |
| Brand | **Cube** (`a1e74bf`) |
| Visual System | **Notion Dark** (`c6b070a`): page `#191919`, surfaces `#202020`, borders `#2d2d2d`, accent `#eab308` |
| Title | `Cube - Speedcubing & Algorithm Suite` (`index.html`) |

Default method everywhere: **`cfop-4look`** (Beginner 4-Look LL: 4 Cross + 4 F2L + 9 2-Look OLL + 7 2-Look PLL = 24 cases).

---

## Surfaces

Nav order: **Timer → Flashcards → Algorithms**. Logo click → `/timer`. `/` redirects to `/timer`. Mobile nav is icon-only (`Navbar.tsx`).

| Nav label | Route | Role & Capabilities |
|-----------|-------|---------------------|
| Speedsolving Timer | `/timer` (also `/`) | WCA random-state scrambles, 15s inspection with +2/DNF, 3D preview, session history, Best/Ao5/Ao12 |
| Flashcards | `/train` | Method-aware LL decks, isolated round mastery, keyboard HUD, celebratory confetti |
| Algorithms | `/algs`, `/algs/:step`, `/algs/:step/:caseId` | Method selector, CFOP steps, search, bookmarks, 3D playback inspector, VisualCube diagrams |

### Timer (`TimerTab.tsx`)

- **Scramble Engine:** Uses `cubing/scramble` (`randomScrambleForEvent('333')`) for genuine WCA competition random-state scrambles.
- **Hold-to-Start:** 300ms hold threshold; spacebar, mouse, or touch triggers state transitions. Spacebar input has double-fire protection.
- **Inspection Countdown:** Optional 15-second inspection mode. Counts down from 15s to 0s with visual alerts. Automatically applies +2 penalty between 15s and 17s, and DNF after 17s.
- **Clock Display:** Resets to `0.00` on ready/start. Tracks hundredths of a second during solve.
- **Statistics & Averages:** Computes total solves, best time, Average of 5 (Ao5), and Average of 12 (Ao12). Trims highest and lowest solves per WCA rules.
- **3D Scramble Preview:** Interactive `RubiksCube3D` widget renders the cube in `mode="scramble"` matching the generated scramble sequence.

### Algorithm Reference (`AlgReferenceTab.tsx`)

- **Method Selector:** Switch between 4-Look LL, 3-Look LL, and Full CFOP (2-Look LL).
- **CFOP Steps:** Step-based navigation (`cross`, `f2l`, `oll`, `pll`, `bookmarked`).
- **Trigger Badges & Syntax:** Algorithms display token-aligned badges for common triggers (Sexy Move, Inverse Sexy, Sledgehammer, Hedgeslammer, Sune, Anti-Sune).
- **Interactive 3D Inspector:** Primary algorithm playback with 90° rotation snapping, step-by-step token navigation, and fullscreen Dialog.

### Flashcards (`TrainerTab.tsx` + hooks)

- **Decks:** Bookmarks, dynamic LL subcategories (2-Look or Full depending on method), All Algorithms.
- **3D Flip Card:** CSS 3D flip card (`FlashCard.tsx`) with VisualCube front and algorithm back.
- **Session State:** Strictly isolated round mastery states (`trainerSessionLogic.ts`).
- **Keyboard Shortcuts:** Space/Enter flip, arrows navigate, 1/X learning, 2/C mastered, S bookmark, R restart, H hint.
- **Celebration:** Confetti triggers on full round mastery.

---

## Method Tiers (User-Facing)

Selector controls LL depth while keeping Cross (4 beginner cases) and F2L (4 fundamental cases) constant:

1. **4-Look LL (Beginner CFOP):** 24 cases (4 Cross + 4 F2L + 9 2-Look OLL + 7 2-Look PLL).
2. **3-Look LL (Intermediate CFOP):** 39 cases (4 Cross + 4 F2L + 10 2-Look OLL + 21 Full PLL).
3. **2-Look LL (Full CFOP):** 86 cases (4 Cross + 4 F2L + 57 Full OLL + 21 Full PLL).

---

## Branding & Visual Identity

| Date | Milestone | Event |
|------|-----------|-------|
| 2026-08-30 | Prototype | Initial CFOP PRO 4-tab suite |
| 2026-08-30 | Brand | Renamed to **Cube** |
| 2026-08-30 | Visuals | Notion Dark aesthetic + Radix UI packages |
| 2026-09-07 | Polish | Custom cube favicon |
| 2026-09-18 | Verification | Automated CI, WCA random scrambles, verified cross library |
