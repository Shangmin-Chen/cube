# AI Agent Workspace Guidelines

This document provides orientation and core operating guidelines for AI agents working in `Shangmin-Chen/cube`.

---

## Workspace Overview

- **Project:** Speedcubing Trainer and Reference application.
- **Stack:** React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, `cubing.js` (`cubing/scramble`, `cubing/twisty`).
- **Key Directories:**
  - `src/`: Application source code (components, data models, hooks, utilities).
  - `spec/`: Commit-grounded specifications and source of truth for features, architecture, and invariants.
  - `scripts/`: Verification suites (`verify-triggers.ts`, `verify-cross-cases.mjs`, `verify-trainer-session.ts`, `verify-upstream-pin.mjs`) and ingestion tooling.
  - `.agents/skills/`: Specialized agent workflow skills and runbooks.

---

## Operating Principles

### 1. Consult `spec/` Before Git Archaeology
- **Do not start with exploratory `git log` commands.**
- The repository relies heavily on squash merges, parallel branch commits, and orphaned tips, making raw git history noisy.
- Consult `spec/` first for historical context, architecture rationale, method naming (`cfop-4look` beginner vs `cfop-2look` Full CFOP), and domain contracts. Start with [`spec/README.md`](spec/README.md) and [`spec/glossary.md`](spec/glossary.md).

### 2. Plan Intent in `spec/` Before Modifying Code
- Before modifying code or delegating implementation tasks, record what you intend to do in a task specification inside `spec/`.
- If `spec/` does not exist, recognize that the agent is being used for the first time in this codebase and initialize the `spec/` directory.
- Keep canonical living specs (`current-state.md`, `architecture.md`) accurate to verified, shipped reality; update them upon completion rather than pre-populating them with unverified intent.
- *(Scope: Applies to architectural changes, features, invariant modifications, and schema updates. Read-only queries, micro-benchmarks, and trivial typo fixes do not require prior spec edits.)*

### 3. Mandatory Verification & Invariant Checks
Never bypass repository verification scripts. Before completing any task, ensure all checks pass cleanly with 0 errors and 0 warnings:
```bash
npm run lint                # oxlint
npm run verify:algs         # algorithm dataset simulation & cross-case checks
npm run verify:triggers     # trigger pattern oracle & boundary validation
npm run verify:trainer      # trainer session state machine invariants
npm run verify:upstream-pin # upstream dataset lockfile SHA-256 integrity
npm run build               # tsc -b && vite build
```

### 4. Preserve Stiff Invariants
- **WCA Scrambles:** Uses `cubing/scramble` (`randomScrambleForEvent('333')`), authentic random-state.
- **Timer Inspection:** 15s countdown with +2 penalty (15s–17s) and DNF after 17s.
- **OLL/PLL Integrity:** 2-Look L-Shape hold orientation at 3 and 6 o'clock (UR and UB slots); corner probability sum equals 1.
- **Upstream Pin:** Ingestion pipeline locked to `scripts/ingest/upstream.lock.json` via SHA-256.

---

## Agent Skills

For multi-agent workflows and specialized tasks, consult the skills in `.agents/skills/`:
- **[`spec-workflow`](.agents/skills/spec-workflow/SKILL.md):** Spec-first context gathering and planning protocol.
- **[`review-loop`](.agents/skills/review-loop/SKILL.md):** Orchestrator loop governing planning, single-writer implementation, and concurrent read-only reviews.
- **Individual Agent Runbooks:** [`planner-agent`](.agents/skills/planner-agent/SKILL.md), [`implementation-agent`](.agents/skills/implementation-agent/SKILL.md), and [`reviewer-agent`](.agents/skills/reviewer-agent/SKILL.md).
