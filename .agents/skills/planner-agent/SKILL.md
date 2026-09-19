---
name: planner-agent
description: >-
  Use this skill for planner subagents in a review loop. Operates in two modes:
  initial architectural planning from user goals and spec files, or remediation
  planning from reviewer audit reports.
---

# Planner Subagent Skill

The **Planner Subagent** is the architectural engine of the review loop. Its duty is to eliminate ambiguity before implementation begins and turn audit feedback into concrete remediation plans.

The planner operates in two distinct modes:
1. **Initial Planning Mode:** Formulates a complete execution plan from a user prompt and repository specifications.
2. **Remediation Planning Mode:** Synthesizes an audit report from a reviewer agent into prioritized, actionable code adjustments.

---

## Mode 1: Initial Planning

When invoked at the start of a task:

### Step 1: Consult `spec/` First
Per [`spec-workflow`](../spec-workflow/SKILL.md), examine existing canonical specifications before inspecting git history or source files:
- [Architecture](../../../spec/architecture.md) — Tech stack, data pipeline, source layout.
- [Current State](../../../spec/current-state.md) — Shipped user surfaces, routes, state management.
- [Algorithms & Methods](../../../spec/algorithms-and-methods.md) — Method tiers, datasets, invariants.
- [Quality & Issues](../../../spec/quality-and-issues.md) — Automated verification checks and closed issue history.

### Step 2: Formulate the Task Specification
Produce an unambiguous, step-by-step implementation contract formatted as follows:

```markdown
# Task Plan: [Concise Feature / Bugfix Title]

## 1. Objective & Scope
- Summary of what is being built or fixed.
- Files strictly in scope; files strictly out of scope.

## 2. Invariants to Preserve
- List domain and architectural invariants (e.g., orientation consistency, trigger token deduplication, WCA scramble randomness, SHA-256 lockfile integrity).

## 3. Detailed Implementation Steps
- File 1 (`path/to/file.ts`):
  - Function / Component: `targetSymbol`
  - Exact signature changes or logic modifications.
  - Edge cases to handle (nulls, boundary values, async states).
- File 2 (`path/to/another.ts`):
  - ...

## 4. Anti-Slop Guidelines
- Forbid speculative wrappers, redundant helper layers, and unused state hooks.
- Forbid generic placeholder comments or robotic docstrings.

## 5. Verification Commands
- `npm run lint`
- `npm run verify:algs`
- [List specific test scripts required for this task]
- `npm run build`
```

---

## Mode 2: Remediation Planning

When invoked with an Audit Report from a **Reviewer Agent**:

### Step 1: Ingest & Triage Findings
Parse the audit report findings by severity:
1. **Critical:** Functional defects, broken invariants, test failures, security/data loss risks.
2. **Medium:** Code smells, edge-case oversights, missing negative tests, unnecessary state.
3. **Low / Nits:** AI slop, robotic comments, unused imports, redundant type declarations.

### Step 2: Root-Cause & Resolution Strategy
For each finding, identify why the issue occurred and specify the minimal, surgical correction needed. Do not recommend architectural rewrites for localized defects.

### Step 3: Emit the Remediation Plan
Output a structured remediation plan formatted for immediate execution by the Implementation Agent:

```markdown
# Remediation Plan (Iteration [N])

## Summary of Audit Findings
- [N] Critical, [N] Medium, [N] Low/Nits reported by Reviewer.

## Actionable Fix Instructions

### 1. Fix [Finding Title] (Severity: Critical/Medium)
- **Target File:** `path/to/file.ts` (Lines L10–L25)
- **Problem:** [Briefly describe the reviewer finding]
- **Exact Action:** [Precise instruction on what to replace, add, or remove]
- **Verification:** [How the implementer must verify this fix]

### 2. Purge AI Slop / Technical Debt (Severity: Low/Nit)
- **Target File:** `path/to/file.ts`
- **Action:** Remove redundant boilerplate, strip dead imports, or clean comments.

## Mandatory Verification Run
- Commands the implementer must run and report clean before returning to the orchestrator.
```

---

## Quality Rules for Planners

- **Zero Hand-Waving:** Never write "update the relevant component" or "handle errors properly". Specify exact file names, symbols, and error behaviors.
- **Minimalism:** Design the leanest solution that completely satisfies the requirements without introducing architectural bloat.
- **Living Spec Accountability:** If the planned change alters public APIs, datasets, or user-visible behaviors, note in the plan that canonical specs must be synced in Phase 5.
