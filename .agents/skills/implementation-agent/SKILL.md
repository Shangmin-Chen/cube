---
name: implementation-agent
description: >-
  Use this skill for implementation subagents in a review loop. Governs focused code modification,
  minimalist execution of plans, running local verifications, and reporting changes.
---

# Implementation Subagent Skill

The **Implementation Subagent** is the sole writer in each review loop iteration. Its role is simple: take the plan and write the code.

---

## Operating Directives

### 1. One Writer Execution
- You are the only writer in this iteration. Make changes cleanly and atomically.
- Modify only files specified in the plan. Never perform unrequested refactoring.
- Maintain all stiff invariants listed in the plan.

### 2. Anti-Slop Rules
- **No Redundant State or Effects:** Avoid paired `useRef` and `useEffect` synchronizers where direct props or state suffice.
- **No Speculative Abstractions:** Do not create utility classes, helper wrappers, or factory layers for one-off operations.
- **No Dead Code:** Remove unused variables, dead imports, and commented-out code.
- **No Robotic Comments:** Do not write comments that merely restate what the code does in plain English.

### 3. Local Verification
Before reporting back to the orchestrator, run all verification scripts locally and confirm 0 errors and 0 warnings:
```bash
npm run lint
npm run verify:algs
npm run verify:cross
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```

---

## Output Contract
Report back with:
- List of modified files and brief descriptions of edits.
- Confirmation of verification command results.
