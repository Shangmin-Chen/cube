# AI Agent Operating Guidelines

This repository (`Shangmin-Chen/cube`) strictly follows a **Spec-First** and **Review-Loop** multi-agent development workflow. All AI coding assistants, planners, orchestrators, and subagents must adhere to the core directives below and leverage the workspace skills:

👉 **[Spec-First Workflow Skill](.agents/skills/spec-workflow/SKILL.md)** (`spec-workflow`)  
👉 **[Review Loop Orchestration Skill](.agents/skills/review-loop/SKILL.md)** (`review-loop`)

Subagent skill runbooks:
- [Planner Subagent](.agents/skills/planner-agent/SKILL.md) (`planner-agent`)
- [Implementation Subagent](.agents/skills/implementation-agent/SKILL.md) (`implementation-agent`)
- [Reviewer Subagent](.agents/skills/reviewer-agent/SKILL.md) (`reviewer-agent`)

---

## Core Directives

### 1. Reference `spec/` First (No Blind Git Archaeology)
- **Do not start by running exploratory `git log` commands.**
- Whenever gathering historical context, architectural rationale, method tier naming (e.g. `cfop-4look` beginner vs `cfop-2look` Full CFOP), or issue background, **consult the `spec/` directory first**.
- Because this repository relies heavily on squash merges, parallel branch commits, and orphaned tips, `spec/` provides the curated, commit-grounded source of truth.
  - Start with `spec/README.md` and `spec/glossary.md`.

### 2. Plan First, Then Execute (Planner & Orchestrator Duty)
- Before modifying code or delegating tasks to subagents, the **planner or orchestrator agent must record what it intends to do**.
- Record proposed architectural changes, domain invariants, and verification criteria in a plan artifact or task specification before coding begins.
- Keep canonical living specs (`current-state.md`, `architecture.md`) accurate to verified, shipped reality; update them upon completion during Phase 4/5 rather than pre-populating them with unverified intent.
- *(Scope: Applies to architectural work, feature additions, invariant changes, and schema updates. Read-only queries, micro-benchmarks, and trivial typo fixes do not require prior spec edits.)*

### 3. Review Loop & Subagent Coordination
- When orchestrating non-trivial coding tasks, use the **Review Loop** pattern:
  1. **Orchestrator Agent:** Coordinates handoffs, routes information, and deduplicates findings across concurrent reviewers.
  2. **Planner Agent (`planner-agent`):** Drafts initial task specifications and converts deduplicated reviewer findings into remediation plans.
  3. **Implementation Agent (`implementation-agent`):** One writer only per loop—pure execution that just writes the code directly based on the plan and runs local tests.
  4. **Reviewer Agents (`reviewer-agent`):** Concurrent read-only auditors (e.g. 3 reviewers). Enforce all stiff invariants, hunt for bugs, potential failure modes, and AI slop. Each emits an audit report only when findings exist, or returns no report when clean.
- **Deduplication & Termination:** The Orchestrator unifies and dedupes overlapping findings from all reviewers before passing to the Planner. The loop terminates when **all review agents return no report** (or all reviewers report 0 findings).

### 4. Mandatory Invariant & Verification Checks
- Never bypass repository verification scripts. Before completing any task, ensure all checks pass cleanly with 0 errors and 0 warnings:
  - `npm run lint` (`oxlint`)
  - `npm run verify:algs` (includes `verify:cross`)
  - `npm run verify:triggers`
  - `npm run verify:trainer`
  - `npm run verify:upstream-pin`
  - `npm run build`

For detailed procedures and runbooks, see [.agents/skills/review-loop/SKILL.md](.agents/skills/review-loop/SKILL.md) and [.agents/skills/spec-workflow/SKILL.md](.agents/skills/spec-workflow/SKILL.md).
