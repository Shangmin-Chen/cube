---
name: spec-workflow
description: >-
  Use this skill whenever gathering repository context, planning code changes, or
  orchestrating tasks across subagents. Enforces consulting spec/ before git
  archaeology and recording architectural decisions in spec/ prior to implementation.
---

# Spec-First Agent Workflow

This skill outlines the mandatory operating procedure for AI coding assistants, orchestrators, planners, and subagents working in `Shangmin-Chen/cube`.

The repository adheres to a **Spec-First** discipline:
1. **Spec Before Git Archaeology**: `spec/` is the curated, commit-grounded source of truth. Consult it before diving into noisy git history.
2. **Spec Before Code**: Planners and orchestrators must record architectural intent, domain invariants, and execution plans in `spec/` before code edits begin.
3. **Subagent Alignment**: Subagents execute against the recorded spec to prevent context drift.
4. **Living Synchronization**: Specs must be updated to reflect the final reality and validated by all repository verification suites.

---

## Phase 1: Context Gathering (Spec Before Git)

When tasked with fixing a bug, extending a feature, or exploring codebase behavior:

- **Do NOT begin by running raw `git log` or commit archaeology.**
  - Git history in this repo features squash merges, parallel branch commits, and orphaned tips. Raw git history is noisy and frequently misleading.
- **Consult `spec/` first** based on your area of inquiry:
  - [README.md](file:///Users/shangminchen/cube/spec/README.md) — Reading order, product baseline, and repository facts.
  - [glossary.md](file:///Users/shangminchen/cube/spec/glossary.md) — Critical naming conventions (e.g. `cfop-4look` for beginner 4-look vs `cfop-2look` for Full CFOP; method IDs; storage keys).
  - [current-state.md](file:///Users/shangminchen/cube/spec/current-state.md) — Shipped user surfaces, routes, persistence keys, and UX facts.
  - [architecture.md](file:///Users/shangminchen/cube/spec/architecture.md) — Component layout, data flow, state management, and algorithm ingestion pipeline.
  - [algorithms-and-methods.md](file:///Users/shangminchen/cube/spec/algorithms-and-methods.md) — Case definitions, method tiers, trigger patterns, and data contracts.
  - [quality-and-issues.md](file:///Users/shangminchen/cube/spec/quality-and-issues.md) — Known caveats, verification bounds, and issue tracking.
  - [process.md](file:///Users/shangminchen/cube/spec/process.md) — Squash merge history, PR mapping, and testing realities.

Only if `spec/` does not answer the question should the agent inspect source code or query git history.

---

## Phase 2: Pre-Implementation Planning (Orchestrator / Planner Duty)

Before modifying any source code or delegating implementation tasks to subagents:

1. **Identify Architectural Impact**:
   - Determine which components, data structures, or invariants will be changed or introduced.
2. **Record Intent into `spec/`**:
   - The planner or orchestrator must write out the plan into the appropriate `spec/` document (e.g., `current-state.md`, `architecture.md`, `quality-and-issues.md`, or a targeted task spec).
   - The entry must document:
     - **Objective & Scope**: What is changing and why.
     - **Invariants**: Domain and architectural invariants that must be preserved (e.g., 2-look hold orientation, trigger deduplication, scramble randomness, upstream pin hash).
     - **Proposed Contract / Interface**: Specific files, schemas, or function signatures to be altered.
     - **Verification Plan**: Exact commands to run to prove correctness.
3. **Rationale**:
   - Writing the plan into version-controlled specs guarantees that context is preserved across token window truncation, subagent boundaries, and multi-turn sessions.

---

## Phase 3: Subagent Delegation & Orchestration

When delegating tasks to subagents (`invoke_subagent`):

1. **Pass the Spec Reference**:
   - Explicitly provide the subagent with the path to the recorded spec document and line numbers.
2. **Bound the Subagent's Scope**:
   - Subagents must treat the recorded spec as their definition of done.
   - Subagents must not introduce architectural deviations or unverified abstractions without planner approval.
3. **Review Subagent Work**:
   - Orchestrators must inspect subagent outputs against the invariants recorded in the spec.

---

## Phase 4: Implementation, Verification & Living Spec Sync

Once implementation is underway:

1. **Implement and Clean**:
   - Follow the spec. Keep code lean, typed, and free of unnecessary state or boilerplate.
2. **Mandatory Verification**:
   - Execute all verification scripts to guarantee 0 errors and 0 warnings:
     ```bash
     npm run lint
     npm run verify:algs
     npm run verify:cross
     npm run verify:triggers
     npm run verify:trainer
     npm run verify:upstream-pin
     npm run build
     ```
3. **Synchronize `spec/`**:
   - If the implementation modified user-facing behavior, data schemas, or pipeline rules, update `spec/` so it remains a living, accurate reflection of the codebase.
