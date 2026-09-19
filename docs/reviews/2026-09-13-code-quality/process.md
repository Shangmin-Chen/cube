# Process

## What this pass is

A code-quality / architecture review of product HEAD `850768c` on 2026-09-13. Reviewers were instructed to invent nothing: every finding cites files and line numbers, a severity, a kind (logic / architecture / habit / slop), a digest group, and an `existingIssue` pointer when the defect was already tracked.

This is **not**:

- A commit-history or “what shipped in #40” spec.
- A re-audit of unmerged `fix/*` WIP. Those worktrees were left untouched so parallel agents would not collide.
- Consumption of spec-pass1 / spec-pass2 on local branch `docs/llm-spec-timeline` (uncommitted in another worktree; not evidence for this PR).

## Orchestrator workflow

1. Isolated git worktree `docs/code-quality-review` at `850768c`. Other agents own other worktrees (`fix/issue-3-unify-trigger-table`, `fix/issue-21-trainer-session`, `fix/issue-24-timer-tab`, `fix/issue-43-pin-upstream-fetch`, etc.). This aggregator stayed in this worktree.
2. Five Cursor 4.6 reviewers ran **in parallel**, one area each: trainer, UI/timer/shell, data/math/types, pipeline, cross-cutting.
3. Raw output was concatenated into [`raw-findings.md`](./raw-findings.md) (T/U/D/P/X IDs plus the existing-issue table).
4. Aggregator (this pass):
   - Confirmed live GitHub issues with `gh issue list --state all --limit 80`.
   - Deduplicated across T/U/D/P/X.
   - Sorted into 12 new issues (not 50 micro-issues); nits folded into larger issues.
   - Opened issues with `gh issue create`; commented on existing issues when a finding was extra evidence, not a twin.
   - Wrote this spec-history tree. **Did not** `git add`, commit, push, or `gh pr create`. The orchestrator commits and opens the PR.

## Worktree isolation

| Constraint | Why |
|---|---|
| Stay on `docs/code-quality-review` | Other agents were editing `src/` / `scripts/` in `fix/*` worktrees. |
| Do not modify `src/` or `scripts/` | This PR is docs + GitHub only. |
| Do not credit unmerged WIP as shipped | Product HEAD is `850768c`. |
| Do not file X-13 as a bug | Collision map is a coordination document (`collision-map.md`). |

## Evidence rules

- Claims in these docs trace to a finding ID (T-01 … X-15) or a GitHub issue number.
- Line citations are from HEAD `850768c` as read by the five reviewers (and spot-checked by the aggregator for the issue bodies).
- **NEW issues** only for defects not already tracked. Duplicates of #2, #3, #9, #11, #15, #16, #17, #18, #19, #21, #24, #27, #41, #42, #43 were not refiled.
- Extra-evidence findings became `gh issue comment` with finding IDs and `file:line` citations, not twin issues.
- Explicit twins from the handoff:
  - D-06 / X-11 (WCA scramble label) **is** #27.
  - D-08 / X-01 **are** #3.
  - D-11 **is** extra evidence for #11.
  - D-12 **is** extra evidence for #19.
  - T-01 / T-05 are **related to** #21 but new (skip-unscored / summary lies / shuffle re-init) → #54.
  - U-04 is a **sibling of** #24 (pointer/touch, not spacebar) → #59.
  - P-09 is a **sibling of** #43 (executing live JS vs unpinned fetch) → #63.
  - P-06 is a **sibling of** #15 (named-case identity / OLL unchecked vs primaries-only for existing invariants) → #65.
- Labels used only existing repo labels: `bug`, `enhancement`, `good first issue`, `accessibility`. No assignees, no closes, no title edits on existing issues.

## What “independently actionable” meant

Each new issue has a title, evidence (files + line numbers), why it matters, a suggested direction, related issues, finding IDs, and acceptance criteria a later agent can implement without reading the raw handoff.
