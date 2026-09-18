# AI Agent Operating Guidelines

This repository (`Shangmin-Chen/cube`) strictly follows a **Spec-First** agent workflow. All AI coding assistants, planners, orchestrators, and subagents must adhere to the core directives below and follow the workspace skill:

👉 **[Spec-First Workflow Skill](.agents/skills/spec-workflow/SKILL.md)** (`spec-workflow`)

---

## Core Directives

### 1. Reference `spec/` First (No Blind Git Archaeology)
- **Do not start by running exploratory `git log` commands.**
- Whenever gathering historical context, architectural rationale, method tier naming (e.g. `cfop-4look` beginner vs `cfop-2look` Full CFOP), or issue background, **consult the `spec/` directory first**.
- Because this repository relies heavily on squash merges, parallel branch commits, and orphaned tips, `spec/` provides the curated, commit-grounded source of truth.
  - Start with `spec/README.md` and `spec/glossary.md`.

### 2. Plan in `spec/` Before Working (Planner & Orchestrator Duty)
- Before modifying code or delegating tasks to subagents, the **planner or orchestrator agent must record what it intends to do in `spec/`**.
- Document proposed architectural changes, domain invariants, and verification criteria in the relevant `spec/` file (e.g. `current-state.md`, `architecture.md`, `quality-and-issues.md`, or a targeted task spec).
- Intent must be captured durably on disk before code edits begin to prevent context loss across token limits, subagents, or multi-turn sessions.
- *(Scope: Applies to architectural work, feature additions, invariant changes, and schema updates. Read-only queries, micro-benchmarks, and trivial typo fixes do not require prior spec edits.)*

### 3. Subagent Coordination
- Orchestrators must direct subagents to the recorded spec before implementation begins.
- Subagents must treat the recorded spec as their authoritative contract and definition of done.

### 4. Mandatory Invariant & Verification Checks
- Never bypass repository verification scripts. Before completing any task, ensure all checks pass cleanly with 0 errors and 0 warnings:
  - `npm run lint` (`oxlint`)
  - `npm run verify:algs`
  - `npm run verify:cross`
  - `npm run verify:triggers`
  - `npm run verify:trainer`
  - `npm run verify:upstream-pin`
  - `npm run build`

For the step-by-step workflow and best practices, see [.agents/skills/spec-workflow/SKILL.md](.agents/skills/spec-workflow/SKILL.md).
