# Code-quality review — 2026-09-13

Architecture / code-quality pass over **current `main`**, not a commit-history spec and not a changelog of unmerged `fix/*` worktrees.

| | |
|---|---|
| Date | 2026-09-13 |
| Product HEAD | [`850768c`](https://github.com/Shangmin-Chen/cube/commit/850768c7c41ca92fc088cf3fbe2fcfb3101d84ca) (`feat(cfop): automated algorithm sync pipeline and clean 4-look, 3-look, and 2-look LL methods (#40)`) |
| Reviewer model | Cursor 4.6 (five parallel area reviews + one aggregator) |
| Worktree / branch | `/Users/shangminchen/cube/.worktrees/code-quality-review` · `docs/code-quality-review` |
| GitHub issues opened | [#54](https://github.com/Shangmin-Chen/cube/issues/54)–[#65](https://github.com/Shangmin-Chen/cube/issues/65) |

Do **not** treat unmerged `fix/issue-*` WIP as shipped. Those worktrees exist locally; this pass did not read them as evidence.

Prior LLM spec-memory work exists on local branch `docs/llm-spec-timeline` (spec-pass1 / pass2). **It is not in this PR and was not used as evidence** — those files were uncommitted in another worktree.

## How to read this pass

1. **[process.md](./process.md)** — how the five reviews ran, worktree isolation, evidence rules.
2. **[architecture-habits.md](./architecture-habits.md)** — portrait from each reviewer’s “top 3” plus the cross-cutting habits section (X).
3. **[findings-by-group.md](./findings-by-group.md)** — digestible groups (the 12 new issues + existing-issue comments), with finding IDs, severity, and files.
4. **[issue-map.md](./issue-map.md)** — every new issue URL, every comment on an existing issue, finding ID → issue.
5. **[collision-map.md](./collision-map.md)** — shared seams from X-13 (not filed as a bug).
6. **Raw appendix** — [`_handoff/pass3-raw-findings.md`](../../../_handoff/pass3-raw-findings.md). Invent nothing beyond that file plus live GitHub issue numbers.

## Five sub-reviews

| Area | Finding IDs | Scope |
|---|---|---|
| Trainer | T-01 … T-14 | Flashcard session, keyboard, bookmarks, decks, `algService` consumption |
| UI / timer / shell | U-01 … U-14 | Timer, 3D cube, routing, leftover Vite/shadcn kit, a11y |
| Data / math / types | D-01 … D-14 | Generated JSON, method registry, cube notation, `AlgCase` |
| Pipeline | P-01 … P-14 | `scripts/sync-algorithms.mjs`, ingest, transformers, rules, verify |
| Cross-cutting | X-01 … X-15 | Duplication, persistence, testing vacuum, god modules, open-issue collisions |

Parent tracker for the earlier algorithm audit remains [#2](https://github.com/Shangmin-Chen/cube/issues/2). New issues list `#2` as parent. Existing open issues that this pass **must not duplicate**: #2, #3, #9, #11, #15, #16, #17, #18, #19, #21, #24, #27, #41, #42, #43.
