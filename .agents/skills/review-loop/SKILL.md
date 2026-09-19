---
name: review-loop
description: >-
  Use this skill to orchestrate multi-agent development loops involving planning,
  implementation, and read-only code review. Coordinates handoffs between planner,
  implementation, and reviewer agents until zero findings remain.
---

# Review Loop Orchestration Skill

The **Review Loop** is an agentic coordination pattern for building features, refactoring code, and resolving defects with guaranteed quality and zero AI slop.

In this workflow, the **Orchestrator Agent (main session)** functions strictly as a **router and coordinator**. The Orchestrator does not write code or draft plans directly; instead, it delegates tasks to specialized subagents and iterates until the code is clean.

---

## Agent Roles & Responsibilities

```
                         ┌─────────────────────────┐
                         │   User Request / Goal   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Orchestrator Agent     │◄───────────────────┐
                        │   (Router & Coordinator)  │                    │
                        └───────┬───────────▲───────┘                    │
                                │           │                            │
             1. Initial /       │           │ 4. Audit Report            │
                Remediation     │           │    (Only if                │
                Plan            │           │     findings exist)        │
                                ▼           │                            │
┌───────────────────────────┐ ┌─────────────┴─────────────┐ ┌────────────┴──────────────┐
│       Planner Agent       │ │   Implementation Agent    │ │       Reviewer Agent       │
│      (planner-agent)      │ │  (implementation-agent)   │ │      (reviewer-agent)      │
│                           │ │                           │ │                            │
│  - Synthesizes user goal  │ │  - "Just writes" code     │ │  - Strictly READ-ONLY      │
│  - Consults spec/ first   │ │  - Executes plan directly │ │  - Checks stiff invariants │
│  - Turns reviewer audits  │ │  - Runs local tests       │ │  - Hunts bugs & bad patterns│
│    into remediation plans │ │  - Supports X parallel    │ │  - Returns NO report when  │
│                           │ │    implementers           │ │    clean (or 0 findings)   │
└───────────────────────────┘ └───────────────────────────┘ └────────────────────────────┘
```

1. **Orchestrator Agent (Main Session):**
   - Coordinates the loop, tracks iteration counts, and manages agent handoffs.
   - **Termination Condition:** The orchestration loop ends when the reviewer agent comes back with **no report** (or all reviewer agents report 0 findings).
   - Does not perform edits or write plans directly.
2. **Planner Agent (`planner-agent`):**
   - References `spec/` via `spec-workflow` and drafts actionable execution plans.
   - When an audit report with findings arrives, converts reviewer findings into concrete remediation plans.
3. **Implementation Agent (`implementation-agent`):**
   - **Pure execution:** "Just writes" the code directly based on the plan without secondary planning or over-engineering.
   - Edits code, runs local tests, and reports modified files.
   - Supports horizontal scaling ($X$ implementation agents partitioned across independent modules).
4. **Reviewer Agent (`reviewer-agent`):**
   - Strictly **read-only** (search, grep, inspect; no write tools).
   - Enforces all **stiff invariants**, hunts for actual bugs, edge cases, potential failure modes, and AI slop.
   - **Report Protocol:** Emits an Audit Report *only* when findings exist. If the code is pristine, it returns **no report** (or a 0-finding confirmation), signalling loop completion.
   - Supports horizontal scaling ($X$ specialized review agents).

---

## The Loop Protocol

### Phase 0: Initial Planning Handoff
1. Orchestrator receives user request or objective.
2. Orchestrator invokes the **Planner Agent** (`planner-agent`):
   - Directs planner to consult `spec/` (e.g. `current-state.md`, `architecture.md`, `algorithms-and-methods.md`).
3. Planner returns an initial **Task Plan**.

### Phase 1: Implementation Handoff ("Just Writes")
1. Orchestrator routes the plan to the **Implementation Agent** (`implementation-agent`):
   - For single-module tasks: Spawn 1 implementation agent.
   - For decoupled tasks: Spawn $X$ implementation agents with partitioned file boundaries.
2. Implementation agents execute the code modifications directly, run local verification scripts (`npm run lint`, `verify:*`, `build`), and report back the modified files and test status.

### Phase 2: Read-Only Review & Invariant Audit
1. Orchestrator invokes the **Reviewer Agent(s)** (`reviewer-agent`):
   - Pass git diff, touched files, original plan, and relevant specs.
   - For complex tasks, spawn $X$ review agents with specialized scopes (e.g., Domain & Stiff Invariants vs Code Quality & Slop).
2. Reviewer agents audit the code strictly:
   - Check all stiff invariants, search for functional bugs, edge-case regressions, and AI slop.
   - **If findings exist:** Reviewer returns a **Structured Audit Report** detailing the issues.
   - **If clean (no findings):** Reviewer returns **no report** (or confirms 0 findings).

### Phase 3: Convergence Evaluation
1. Orchestrator inspects the reviewer response(s):
   - **If Reviewer returns NO REPORT (or all reviewers report 0 findings):**
     - Loop terminates successfully! The code is verified and pristine.
     - Proceed to **Phase 5 (Finalization)**.
   - **If Reviewer returns an Audit Report with findings:**
     - Increment loop iteration counter (default safeguard: maximum 5 iterations).
     - Proceed to **Phase 4 (Remediation Planning)**.

### Phase 4: Remediation Planning Handoff
1. Orchestrator passes the Audit Report back to the **Planner Agent**.
2. Planner synthesizes the findings into a **Targeted Remediation Plan** with surgical fix instructions.
3. Orchestrator routes the remediation plan back to the **Implementation Agent** (loops to **Phase 1**).

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
3. Present final summary and verification proof to user.

---

## Safety Rails & Convergence Rules

1. **Strict Read-Only Reviewers:** Reviewer agents must never edit code. Their only output is an audit report if findings exist, or no report when clean.
2. **Termination via No Report / Zero Findings:** The loop ends as soon as no reviewer produces an audit report of findings.
3. **Implementation Simplicity:** Implementation agents do not debate architecture—they "just write" according to the plan and verify locally.
4. **Iteration Cap:** If the loop reaches 5 iterations without convergence, the Orchestrator pauses, reports the blocker, and prompts the user for direction rather than looping indefinitely.
