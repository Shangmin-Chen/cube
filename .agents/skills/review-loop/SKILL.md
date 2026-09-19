---
name: review-loop
description: >-
  Use this skill to orchestrate multi-agent development loops involving planning,
  single-writer implementation, concurrent multi-reviewer auditing, and deduplication.
  Coordinates handoffs between planner, implementation, and reviewer agents until zero findings remain.
---

# Review Loop Orchestration Skill

The **Review Loop** is an agentic coordination pattern for building features, refactoring code, and resolving defects with guaranteed quality and zero AI slop.

In this workflow, the **Orchestrator Agent (main session)** functions strictly as a **router, coordinator, and findings deduplicator**. The Orchestrator does not write code or draft plans directly; instead, it enforces the **Single Writer Invariant**, coordinates concurrent read-only reviewers, deduplicates their findings, and loops until all reviewers report clean.

---

## Architecture & Agent Roles

```
                               ┌─────────────────────────┐
                               │   User Request / Goal   │
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │      Planner Agent      │ (Initial Plan)
                               └────────────┬────────────┘
                                            │
                                            ▼
                               ┌─────────────────────────┐
                               │   Orchestrator Agent    │◄────────────────────────┐
                               └────────────┬────────────┘                         │
                                            │ Passes plan                          │
                                            ▼                                      │
                               ┌─────────────────────────┐                         │
                               │  Implementation Agent   │ (ONE WRITER ONLY)       │
                               │  - "Just writes" code   │                         │
                               │  - Runs local tests     │                         │
                               └────────────┬────────────┘                         │
                                            │ Code modified & verified             │
                                            ▼                                      │
                               ┌─────────────────────────┐                         │
                               │ Reviewer Agents (1..N)  │ (CONCURRENT READ-ONLY)  │
                               │ - Reviewer 1 (Audits)   │                         │
                               │ - Reviewer 2 (Audits)   │                         │
                               │ - Reviewer 3 (Audits)   │                         │
                               └────────────┬────────────┘                         │
                                            │ Audit reports (or NO REPORT)         │
                                            ▼                                      │
                               ┌─────────────────────────┐                         │
                               │   Orchestrator Agent    │                         │
                               │   - Collects & DEDUPES  │                         │
                               └───────┬─────────────▲───┘                         │
                                       │             │                             │
                   All 0 findings? ───►│             │                             │
                        │ YES          │ NO          │                             │
                        ▼              ▼             │                             │
                 [Terminates /  [Deduplicated        │                             │
                  Clean Pass]    Findings]           │                             │
                                       │             │                             │
                                       ▼             │                             │
                               ┌─────────────────┐   │                             │
                               │  Planner Agent  │   │                             │
                               │ (Remediation)   │───┴─────────────────────────────┘
                               └─────────────────┘ (Loops back to Implementation)
```

1. **Orchestrator Agent (Main Session):**
   - Coordinates the loop, tracks iteration counts, and manages handoffs.
   - **Deduplication Duty:** Collects audit reports from all concurrent reviewers, merges overlapping findings across matching files and line numbers, and filters duplicates.
   - **Termination Condition:** The orchestration loop terminates when **all review agents return no report** (or when deduplication yields 0 findings).
2. **Planner Agent (`planner-agent`):**
   - Initial Phase: References `spec/` via `spec-workflow` and drafts actionable execution plans.
   - Remediation Phase: Ingests the Orchestrator's **deduplicated findings** and creates a focused remediation plan.
3. **Implementation Agent (`implementation-agent`):**
   - **One Writer Only:** Exactly one implementation agent writes to the codebase per loop iteration. This eliminates merge conflicts, clobbered edits, and write race conditions.
   - **Pure Execution:** "Just writes" the code directly based on the plan without secondary planning or speculative abstraction.
4. **Reviewer Agents (`reviewer-agent`):**
   - **Concurrent Read-Only Auditors:** Multiple review agents (e.g. 2 or 3 reviewers) run simultaneously against the implementation diff.
   - Enforce all **stiff invariants**, hunt for actual bugs, edge cases, potential failure modes, and AI slop.
   - **Report Protocol:** Emits an Audit Report *only* when findings exist. If clean, returns **no report** (or confirms 0 findings).

---

## The Loop Protocol

### Phase 0: Initial Planning Handoff
1. Orchestrator receives user goal.
2. Orchestrator invokes the **Planner Agent** (`planner-agent`):
   - Directs planner to consult `spec/` (e.g. `current-state.md`, `architecture.md`, `algorithms-and-methods.md`).
3. Planner returns an initial **Task Plan**.

### Phase 1: Implementation Handoff (One Writer Only)
1. Orchestrator routes the plan to the single **Implementation Agent** (`implementation-agent`).
2. The implementation agent executes the modifications directly ("just writes"), runs local verification scripts (`npm run lint`, `verify:*`, `build`), and reports back the modified files and test status.

### Phase 2: Concurrent Multi-Reviewer Audit
1. Orchestrator spawns $N$ **Reviewer Agents** (`reviewer-agent`) simultaneously (e.g. 3 reviewers):
   - Pass git diff, touched files, original plan, and relevant specs to all reviewers.
   - Reviewers audit concurrently and independently, checking stiff invariants, searching for functional bugs, edge-case regressions, and AI slop.
2. Reviewers return their results:
   - **If findings exist:** Emit an Audit Report with exact files, line numbers, and severities.
   - **If clean (no findings):** Return **no report** (or a 0-finding confirmation).

### Phase 3: Orchestrator Deduplication & Convergence Gate
1. Orchestrator collects all responses from the $N$ reviewers:
   - **If ALL reviewers return NO REPORT (or 0 findings):**
     - Loop terminates successfully! The code is verified and pristine.
     - Proceed to **Phase 5 (Finalization)**.
   - **If findings exist from one or more reviewers:**
     - **Deduplication:** The Orchestrator compares findings across reports. Overlapping findings on the same files/lines or addressing the same underlying bug are unified into a single clean issue.
     - If deduplication leaves 0 actionable findings, proceed to Phase 5.
     - If actionable findings remain, increment loop counter (safeguard cap: 5 iterations) and proceed to **Phase 4**.

### Phase 4: Remediation Planning Handoff
1. Orchestrator hands the **deduplicated findings list** to the **Planner Agent**.
2. Planner synthesizes the deduplicated findings into a **Targeted Remediation Plan** with surgical fix instructions.
3. Orchestrator routes the remediation plan back to the single **Implementation Agent** (loops to **Phase 1**).

### Phase 5: Finalization & Living Spec Synchronization
1. Orchestrator executes repository-wide verification suites:
   ```bash
   npm run lint
   npm run verify:algs
   npm run verify:triggers
   npm run verify:trainer
   npm run verify:upstream-pin
   npm run build
   ```
2. If the completed task altered user-facing behavior, data schemas, or pipeline rules, update canonical specs (`spec/current-state.md`, `spec/architecture.md`) per [`spec-workflow`](../spec-workflow/SKILL.md).
3. Present final summary, iteration count, and verification proof to user.

---

## Safety Rails & Invariants

1. **One Writer Only:** Never spawn concurrent implementation agents on the same codebase. All code modifications within an iteration belong to one writer.
2. **Concurrent Multi-Review:** Spawning multiple concurrent reviewers catches issues from diverse perspectives.
3. **Orchestrator Deduplication:** Reviewers report raw findings independently; the Orchestrator unifies and dedupes them before passing to the Planner.
4. **Clean Termination:** The loop ends only when all reviewers return no report / zero findings.
5. **Iteration Cap:** Maximum 5 iterations to prevent infinite loops on intractable requirements.
