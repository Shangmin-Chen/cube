---
name: spec-workflow
description: >-
  Use this skill whenever gathering repository context, planning code changes, or
  orchestrating tasks across subagents. Enforces consulting spec/ before git
  archaeology and recording architectural decisions prior to implementation.
---

# Spec-First Agent Workflow

This skill outlines the mandatory operating procedure for AI coding assistants, orchestrators, planners, and subagents working in `Shangmin-Chen/cube`.

The repository adheres to a **Spec-First** discipline:
1. **Spec Before Git Archaeology**: `spec/` is the curated, commit-grounded source of truth. Consult it before diving into noisy git history.
2. **Plan Before Code**: Planners and orchestrators must record architectural intent, domain invariants, and execution plans in task specifications before code edits begin.
3. **Subagent Alignment**: Subagents execute against the recorded plan and referenced specs to prevent context drift.
4. **Living Synchronization**: Canonical living specs (`current-state.md`, `architecture.md`) must be updated to reflect shipped reality only after passing all verification suites.

---

## Phase 1: Context Gathering (Spec Before Git)

When tasked with fixing a bug, extending a feature, or exploring codebase behavior:

- **Do NOT begin by running raw `git log` or commit archaeology.**
  - Git history in this repo features squash merges, parallel branch commits, and orphaned tips. Raw git history is noisy and frequently misleading.
- **Consult `spec/` first** based on your area of inquiry:
  - [`spec/README.md`](../../../spec/README.md) — Reading order, product baseline, and repository facts.
  - [`spec/glossary.md`](../../../spec/glossary.md) — Critical naming conventions (e.g. `cfop-4look` for beginner 4-look vs `cfop-2look` for Full CFOP; method IDs; storage keys).
  - [`spec/current-state.md`](../../../spec/current-state.md) — Shipped user surfaces, routes, persistence keys, and UX facts.
  - [`spec/product.md`](../../../spec/product.md) — Product identity, user surfaces, and UI capabilities.
  - [`spec/architecture.md`](../../../spec/architecture.md) — Component layout, data flow, state management, and algorithm ingestion pipeline.
  - [`spec/algorithms-and-methods.md`](../../../spec/algorithms-and-methods.md) — Case definitions, method tiers, trigger patterns, and data contracts.
  - [`spec/quality-and-issues.md`](../../../spec/quality-and-issues.md) — Known caveats, verification bounds, and issue tracking.
  - [`spec/process.md`](../../../spec/process.md) — Squash merge history, PR mapping, and testing realities.
  - [`spec/timeline.md`](../../../spec/timeline.md) — Chronological milestone history.
  - [`spec/open-questions.md`](../../../spec/open-questions.md) — Architecture questions, debt, and future considerations.

Only if `spec/` does not answer the question should the agent inspect source code or query git history.

---

## Phase 2: Pre-Implementation Planning (Orchestrator / Planner Duty)

Before modifying any source code or delegating implementation tasks to subagents:

1. **Identify Architectural Impact**:
   - Determine which components, data structures, or invariants will be changed or introduced.
2. **Record Intent Before Code Edits**:
   - **If `spec/` exists**: Record the plan in a task specification (e.g. in `spec/tasks/` or a task plan document inside `spec/`).
   - **If `spec/` does not exist**: Recognize that the agent is being used for the first time in this codebase. Initialize the `spec/` directory with a baseline `spec/README.md` before recording the plan.
   - Document:
     - **Objective & Scope**: What is changing and why.
     - **Invariants**: Domain and architectural invariants that must be preserved (e.g., 2-look hold orientation, trigger deduplication, WCA scramble randomness, upstream pin hash).
     - **Proposed Contract / Interface**: Specific files, schemas, or function signatures to be altered.
     - **Verification Plan**: Exact commands to run to prove correctness.
   - *Important:* Do **not** pre-mutate canonical living specs (`current-state.md`, `architecture.md`) before implementation is verified. Canonical specs must always reflect shipped code.
3. **Scope Exception**:
   - Read-only queries, micro-benchmarks, and trivial typo fixes do not require prior spec entries.

---

## Phase 3: Subagent Delegation & Orchestration

When delegating tasks to subagents (`invoke_subagent`):

1. **Pass the Plan Reference**:
   - Explicitly provide the subagent with the path to the recorded plan and the relevant `spec/` documents.
2. **Bound the Subagent's Scope**:
   - Subagents must treat the recorded plan as their definition of done.
   - Subagents must not introduce architectural deviations or unverified abstractions.
3. **Review Subagent Work**:
   - Orchestrators must verify subagent outputs against the invariants recorded in the plan.

---

## Phase 4: Implementation, Verification & Living Spec Sync

Once implementation is underway:

1. **Implement and Verify**:
   - Follow the plan. Execute all verification scripts to guarantee 0 errors and 0 warnings:
     ```bash
     npm run lint
     npm run verify:algs
     npm run verify:triggers
     npm run verify:trainer
     npm run verify:upstream-pin
     npm run build
     ```
2. **Synchronize Canonical `spec/`**:
   - When the implementation is verified, update the relevant living spec files (e.g. `current-state.md`, `architecture.md`, `algorithms-and-methods.md`) so `spec/` remains an accurate reflection of the shipped codebase.
