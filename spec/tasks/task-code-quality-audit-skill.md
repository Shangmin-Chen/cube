# Task Specification: Code-Quality Audit Skill

## Objective & Scope
Introduce a standardized, agentic code-quality and architecture review skill (`code-quality-audit`) in `.agents/skills/code-quality-audit/SKILL.md`.

This skill enables Gemini / Antigravity agents to systematically audit the codebase at any milestone or HEAD commit, replicating and standardizing the multi-area audit workflow originally executed in PR #67 (`docs: 2026-09-13 code-quality review`).

The skill formalizes:
1. Multi-domain parallel review partitioning (Trainer `T-*`, UI/Timer/Shell `U-*`, Data/Math `D-*`, Pipeline `P-*`, Cross-Cutting `X-*`).
2. Evidence rules and file:line citation standards.
3. Automated GitHub issue triage: deduplication against existing issues, adding extra-evidence comments, and opening grouped, independently actionable issues.
4. Shared-seam collision mapping (`collision-map.md`) to safely coordinate parallel fix worktrees.
5. Standardized audit documentation trees in `docs/reviews/YYYY-MM-DD-code-quality/`.
6. Integration into `AGENTS.md`.

## Invariants Preserved
1. **Zero Product Code Regressions:** The audit skill produces documentation and GitHub issues; it does not modify `src/` or `scripts/` runtime behavior.
2. **Spec-First Alignment:** Living specifications in `spec/` remain canonical; the audit skill treats `spec/` as the baseline against which codebase drift is measured.
3. **Repository Verification:** All verification suites (`lint`, `verify:algs`, `verify:triggers`, `verify:trainer`, `verify:upstream-pin`, `build`) must remain passing with 0 errors and 0 warnings.

## Proposed Contracts & Files
- `.agents/skills/code-quality-audit/SKILL.md`: The complete instruction manual and execution protocol for running full-codebase audits.
- `AGENTS.md`: Updated Agent Skills reference section.

## Verification Plan
1. Check skill file syntax and frontmatter.
2. Run full repository verification suite:
   ```bash
   npm run lint
   npm run verify:algs
   npm run verify:triggers
   npm run verify:trainer
   npm run verify:upstream-pin
   npm run build
   ```
