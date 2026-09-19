# Open Questions & Architectural Roadmap

Architectural considerations, technical debt, and future roadmap items for `Shangmin-Chen/cube`.

---

## Technical Debt & Optimization Opportunities

### 1. Offline Diagram Rendering
- **Current State:** Algorithm diagrams use the external VisualCube API (`visualcube.api.cubing.net`) via `AlgDiagram.tsx`.
- **Consideration:** VisualCube introduces an external HTTP dependency for 2D diagrams. If offline or if the API experiences latency, fallback placeholders are displayed.
- **Future Direction:** Introduce local SVG generation or pre-render diagrams during the pipeline build phase to achieve 100% offline self-containment.

### 2. Full F2L Library (41 Cases)
- **Current State:** F2L contains 4 foundational intuitive insertions (`f2l-basic-1` through `f2l-basic-4`).
- **Consideration:** Advanced speedcubers benefit from the full 41-case standard F2L algorithmic library.
- **Future Direction:** Expand `src/data/cfopData.ts` or add an ingestion pipeline for standard F2L algorithms, categorizing by slot status and corner/edge orientations.

### 3. Cross-Session Trainer Analytics (Spaced Repetition)
- **Current State:** Flashcard trainer mastery is scoped to the active session (`trainerSessionLogic.ts`).
- **Consideration:** Long-term algorithm retention improves with spaced repetition systems (e.g. SM-2 or Leitner box scheduling) persisted to `localStorage` or indexed storage.
- **Future Direction:** Add an optional persistent mastery mode tracking review intervals and algorithm hesitation times.

### 4. Component Dependencies Pruning
- **Current State:** `package.json` includes several Radix UI primitives (`accordion`, `dropdown-menu`, `select`, `tooltip`) where only `dialog` is actively imported in `src/`.
- **Consideration:** Pruning unreferenced Radix dependencies will decrease `node_modules` footprint and dependency maintenance surface.

### 5. Touch & Mobile Haptics
- **Current State:** Timer uses a 300ms hold threshold across mouse, keyboard, and touch events.
- **Consideration:** Mobile cubers often rely on tactile haptic feedback when the timer transitions into the `ready` state.
- **Future Direction:** Integrate the Web Vibration API (`navigator.vibrate`) for mobile ready and stop states.
