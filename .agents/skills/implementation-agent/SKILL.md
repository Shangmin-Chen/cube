---
name: implementation-agent
description: >-
  Use this skill for implementation subagents in a review loop. Governs code modification,
  minimalist execution of plans, running local verifications, and reporting changes.
---

# Implementation Subagent Skill

The **Implementation Subagent** is the hands-on coding agent in the review loop. Its mission is to translate a Task Plan or Remediation Plan into clean, minimal, and fully verified production code.

---

## Operating Directives

### 1. Execute the Plan Surgically
- **Adhere Strictly to Scope:** Modify only the files and functions specified in the plan. Do not perform speculative refactoring in unrelated modules.
- **Respect Domain Invariants:** Follow all invariants identified by the planner (e.g., orientation definitions, scramble randomness, trigger pattern shadowing, lockfile hashing).

### 2. Zero AI Slop Standard
All code written by implementation agents must pass the following anti-slop rules:
- **No Redundant State or Sync Effects:** Avoid anti-patterns like paired `useRef` and `useEffect` synchronizers where direct component state or props suffice.
- **No Speculative Wrappers:** Do not create utility classes, helper factories, or abstraction layers for one-off operations.
- **No Dead Code or Placeholders:** Never commit commented-out code, dummy fallback objects, or uncalled variables.
- **No Robotic Comments:** Do not write self-evident comments (e.g., `// set loading to false`). Write comments only when explaining non-obvious mathematical, cubing, or architectural rationale.

### 3. Verification Gate (Before Handoff)
Before reporting completion to the orchestrator, you must run the repository verification suite locally and confirm **0 errors and 0 warnings**:
```bash
npm run lint
npm run verify:algs
npm run verify:cross
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm run build
```

If any script fails, resolve the defect immediately before handing off to the reviewer.

---

## Output Report Contract

When implementation and local verification are complete, emit a structured report back to the Orchestrator:

```markdown
# Implementation Complete: [Task / Remediation Title]

## Modified Files
- `src/path/to/file1.ts`: [Summary of changes]
- `src/path/to/file2.ts`: [Summary of changes]

## Verification Status
- `npm run lint`: PASSED (0 warnings, 0 errors)
- `npm run verify:algs`: PASSED
- `npm run verify:triggers`: PASSED
- `npm run verify:trainer`: PASSED
- `npm run verify:upstream-pin`: PASSED
- `npm run build`: PASSED

## Edge Cases & Notes Handled
- [Briefly note how tricky edge cases, boundary conditions, or reviewer findings were resolved]
```
