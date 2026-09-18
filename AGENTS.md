# AI Agent Operating Guidelines

This repository (`Shangmin-Chen/cube`) follows a **spec-first** agent workflow. All AI coding assistants, orchestrators, planners, and subagents must adhere to the following directives:

## 1. Reference `spec/` First for Context
- **Do not start by running exploratory `git log` commands.**
- Whenever you need to gather historical context, understand architectural decisions, check method tier naming (e.g. `cfop-4look` beginner vs `cfop-2look` Full CFOP), or review open issues, **consult the `spec/` directory first**.
- Git history in this repository relies heavily on squash merges, parallel branch commits, and orphaned tips. `spec/` provides the curated, commit-grounded single source of truth.
  - Start with `spec/README.md` and `spec/glossary.md`.

## 2. Plan in `spec/` Before Working (Planner & Orchestrator Duty)
- Before implementing a task or delegating work to subagents, the **planner or orchestrator agent must record what it intends to do in `spec/`**.
- Specifically:
  - Document the proposed architectural changes, new invariants, or modified components in the appropriate `spec/` document (e.g. `current-state.md`, `architecture.md`, or `open-questions.md`).
  - This ensures that intent is durably captured before code edits begin, preventing context loss across token limits, subagents, or multi-turn sessions.

## 3. Subagent Coordination
- When orchestrators spawn subagents, subagents must use the recorded plan in `spec/` as their primary reference to guarantee alignment.
- When a task is complete, the orchestrator updates `spec/` to ensure the documentation reflects the new reality.

## 4. Invariant & Verification Integrity
- Never bypass repository verification scripts. Before submitting or marking work complete, all verifications must pass:
  - `npm run lint` (`oxlint`)
  - `npm run verify:algs`
  - `npm run verify:cross`
  - `npm run verify:triggers`
  - `npm run verify:trainer`
  - `npm run verify:upstream-pin`
  - `npm run build`
