---
name: review-loop
description: >-
  Use this skill to orchestrate multi-agent development loops involving planning,
  implementation, and read-only code review. Coordinates handoffs between planner,
  implementation, and reviewer agents until zero findings remain.
---

# Review Loop Orchestration Skill

The **Review Loop** is an agentic coordination pattern for building features, refactoring code, and resolving defects with guaranteed quality and zero AI slop.

In this workflow, the **Orchestrator Agent (main session)** functions strictly as a **router and coordinator**. The Orchestrator does not write code or draft plans directly; instead, it delegates tasks to specialized subagents and iterates until all reviewers confirm a **Clean Pass (0 findings)**.

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
             1. Initial /       │           │ 4. Audit                   │
                Remediation     │           │    Report                  │
                Plan            │           │                            │
                                ▼           │                            │
┌───────────────────────────┐ ┌─────────────┴─────────────┐ ┌────────────┴──────────────┐
│       Planner Agent       │ │   Implementation Agent    │ │       Reviewer Agent       │
│      (planner-agent)      │ │  (implementation-agent)   │ │      (reviewer-agent)      │
│                           │ │                           │ │                            │
│  - Synthesizes user goal  │ │  - Executes code edits    │ │  - Strictly READ-ONLY      │
│  - Consults spec/ first   │ │  - Runs local tests       │ │  - Audits diff & invariants│
│  - Turns reviewer audits  │ │  - Supports X parallel    │ │  - Smells for AI slop      │
│    into remediation plans │ │    implementers           │ │  - Returns 0-finding report│
└───────────────────────────┘ └───────────────────────────┘ └────────────────────────────┘
```

1. **Orchestrator Agent (Main Session):**
   - Coordinates the loop, tracks iteration counts, and manages agent handoffs.
   - Enforces the termination condition: **0 findings from all reviewers**.
   - Does not perform edits or write plans directly.
2. **Planner Agent (`planner-agent`):**
   - References `spec/` via `spec-workflow` and drafts actionable execution plans.
   - In subsequent iterations, converts the reviewer's audit findings into concrete remediation plans.
3. **Implementation Agent (`implementation-agent`):**
   - Has write tools (`replace_file_content`, `write_to_file`, `run_command`).
   - Executes the plan, verifies invariants, runs local tests, and reports touched files.
   - Supports horizontal scaling ($X$ implementation agents partitioned across independent modules).
4. **Reviewer Agent (`reviewer-agent`):**
   - Strictly **read-only** (uses search, grep, and file inspection tools; no write tools).
   - Audits code against specifications, tests edge cases, detects technical debt, and rigorously smells for AI slop (boilerplate, dead code, defensive hallucinations, robotic comments).
   - Supports horizontal scaling ($X$ review agents specialized by concern: e.g., correctness reviewer and code cleanliness reviewer).

---

## The Loop Protocol

### Phase 0: Initial Planning Handoff
1. Orchestrator receives the user request or objective.
2. Orchestrator invokes the **Planner Agent** (`invoke_subagent` with `planner-agent` instructions):
   - Provide the user request and direct the planner to consult `spec/` (e.g. `current-state.md`, `architecture.md`, `algorithms-and-methods.md`).
3. Planner returns an initial **Task Specification & Implementation Plan**.

### Phase 1: Implementation Handoff
1. Orchestrator routes the plan to the **Implementation Agent** (`implementation-agent`):
   - For single-module tasks: Spawn 1 implementation agent.
   - For decoupled tasks: Spawn $X$ implementation agents with explicit file and responsibility boundaries.
2. Implementation agents edit files, run verification scripts (`npm run lint`, `verify:*`, `build`), and return:
   - Summary of code changes.
   - Verification command results.
   - List of modified files.

### Phase 2: Read-Only Review & Slop Audit
1. Orchestrator invokes the **Reviewer Agent** (`reviewer-agent`):
   - Provide git diff (`git diff main...HEAD` or list of modified files), original plan, and relevant specs.
   - For high-complexity tasks, spawn $X$ review agents with distinct lenses (e.g., Domain Correctness vs Code Quality / Slop Audit).
2. Reviewer agents thoroughly inspect the changes and return a **Structured Audit Report**:
   - **Verdict:** `PASS` (0 findings) or `REVISE` (>0 findings).
   - Findings categorized by severity: `Critical`, `Medium`, `Low`, `Nit`.
   - Explicit file paths and line numbers.

### Phase 3: Convergence Evaluation
1. Orchestrator evaluates the reviewer audit report(s):
   - **If Verdict is PASS (0 findings across all reviewers):**
     - Loop terminates successfully.
     - Proceed to **Phase 5 (Finalization)**.
   - **If Verdict is REVISE (>0 findings):**
     - Increment loop iteration counter (default safeguard: maximum 5 iterations).
     - Proceed to **Phase 4 (Remediation Planning)**.

### Phase 4: Remediation Planning Handoff
1. Orchestrator sends the Reviewer Audit Report back to the **Planner Agent**.
2. Planner synthesizes the audit findings into a **Targeted Remediation Plan**:
   - Prioritizes critical and medium issues.
   - Defines concrete code edits and edge-case tests to resolve every finding.
3. Orchestrator receives the remediation plan and loops back to **Phase 1**.

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
3. Present the final result, iteration count, and verification proof to the user.

---

## Safety Rails & Convergence Rules

1. **Strict Read-Only Reviewers:** Reviewer agents must never have write access. This prevents a reviewer from silently patching bugs without documenting findings or introducing untested fixes.
2. **Zero-Finding Requirement:** The loop cannot exit on "acceptable" or "minor" findings. Every nit, unused import, or AI slop artifact must be resolved or explicitly dismissed by the user.
3. **Iteration Cap:** If the loop reaches 5 iterations without convergence, the Orchestrator pauses, reports the blocker, and prompts the user for direction rather than looping indefinitely.
4. **Handoff Minimalism:** The orchestrator message between agents must be concise, passing only the plan, diff references, and audit reports without redundant commentary.
