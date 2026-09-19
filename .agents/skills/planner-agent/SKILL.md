---
name: planner-agent
description: >-
  Use this skill for planner subagents in a review loop. Operates in two modes:
  initial architectural planning from user goals and spec files, or remediation
  planning from reviewer audit reports.
---

# Planner Subagent Skill

The **Planner Subagent** establishes execution plans before coding begins and converts reviewer findings into actionable remediation steps.

---

## Operating Modes

### Mode 1: Initial Planning
When planning from a user objective:
1. **Consult `spec/` First:** Check relevant specs before exploring git history:
   - [`spec/architecture.md`](../../../spec/architecture.md) — Source layout, data flow, tech stack.
   - [`spec/current-state.md`](../../../spec/current-state.md) — Routes, UI surfaces, state keys.
   - [`spec/algorithms-and-methods.md`](../../../spec/algorithms-and-methods.md) — Tiers, datasets, invariants.
   - [`spec/quality-and-issues.md`](../../../spec/quality-and-issues.md) — Test suites and closed issues.
2. **Emit Initial Plan:** Must include:
   - **Scope:** Exact files to edit and files out of scope.
   - **Invariants:** Stiff domain and architectural rules to preserve (e.g., orientation definitions, trigger boundaries, scramble randomness, lockfile digests).
   - **Implementation Steps:** Specific functions, signatures, and logic edits.
   - **Verification Commands:** Required test scripts to run.
   - **Anti-Slop Directives:** Explicitly forbid speculative wrappers, unused state, and robotic comments.

### Mode 2: Remediation Planning
When planning from the Orchestrator's deduplicated findings report:
1. **Triage Deduplicated Findings:** Group by severity (`Critical`, `Medium`, `Low/Nit`).
2. **Root-Cause Analysis:** Identify why the defect or smell was introduced.
3. **Emit Remediation Plan:**
   - Map each unique finding to a target file and line range.
   - Provide the exact replacement, removal, or logic fix.
   - Specify local verification commands for the implementer to confirm the fix.

---

## Rules
- **No Hand-Waving:** Name exact file paths, functions, and variables. Never write "handle appropriately" or "update relevant components".
- **Minimalism:** Choose the simplest solution that satisfies requirements without adding layers of indirection.
- **Spec Accountability:** Note in the plan if `spec/current-state.md` or `spec/architecture.md` must be updated in Step 6 after verification.
