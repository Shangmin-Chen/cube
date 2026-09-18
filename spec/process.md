# Process

Reconstructing history from `git log main` alone **under-counts work and mis-links issues**. Exclusive squash-merge; orphaned branch tips; incomplete `closes #N` linkage.

## Canonical refs

| Ref | Meaning |
|-----|---------|
| `main` @ `850768c` | Product HEAD (2026-09-10 16:46 EDT). No later main commits |
| `docs/llm-spec-timeline` @ `9dce376` | Research checkpoint (2026-09-13). Not product |
| `origin/fix/*` from Sep 9–10 | Often **byte-identical** to squash commits; historically 1 commit ahead of main |
| Local `fix/issue-*` (Sep 13) | After window. May mix unrelated issue titles on one branch — isolate before crediting |

## How to count history

| Count | Meaning |
|-------|---------|
| **34** | Linear `main` at `850768c` (`git rev-list --count 850768c`) |
| **35** | This branch including `9dce376` |
| **13** | Squash-merged PRs (#1, #29–#40) |
| **20** | Direct-to-main **before** PR #1 squash, including genesis `38e4a45` through trigger cleanup `f5d7d10` |
| **21** | All direct-to-main = those 20 + `f0d8cdd` (favicon/Vercel, after #1) |
| **Do not use** | `git log --all` SHA count — Sep 9 local `fix/*` tips are duplicates of squash commits |

Sep 9 pattern: branch commit (`closes #N`) → squash merge on main (`#29`–`#38`). Count **one unique change per issue**, not two SHAs.

`d79636c` (PR #1) author date is **2026-09-06 23:32 -0700** = **2026-09-07 02:32 EDT**. Git parent of that squash is `f5d7d10` (2026-09-07 00:53 EDT) — trigger cleanup landed **before** the trainer squash, not between squash and favicon.

## Four process phases

### Phase 0 — Direct-to-main prototype (2026-08-30 → 09-07)

20 commits on `main` before PR #1, no PRs, no CI. First **subagent audit** remediation: `26359fe` (safe localStorage, `crossCases` in aggregates, back-nav reset). Pattern: agent audit → fix commit → keep building. Verification = manual.

### Phase 1 — First PR (2026-09-06/07)

**PR #1** `feat/quizlet-flashcards-trainer`: **6** commits **squash-merged** to `d79636c` (`2e87223`, `3e1c58b`, `419df24`, `960d98d`, `4652d7f`, `cd9f171`). Remote feature branch retained; those **6 commits orphaned** from main ancestry. Still no CI. `f0d8cdd` (favicon/Vercel) landed as a direct commit **after** the squash. `f5d7d10` (triggers) is a direct commit **immediately before** the squash.

### Phase 2 — Audit issue queue (2026-09-08–10)

**Issue #2** (Sep 8) parent tracker. Children **#3–#28**. Sep 9: parallel `fix/issue-N` branches, each `closes #N`, squash-merged as PRs **#29–#38**. Merge strategy: **squash exclusively**.

Sep 9 morning: eight one-commit fixes; three merged same day (#29–31), five next morning (#32, #34, #36–38). Evening: #33 (Ao5, 2 commits incl. review) and #35 (pll-e, wrong-direction commit then correction).

### Phase 3 — Pipeline mega-PR (2026-09-10)

**PR #39** `aef759e` — remove coming-soon methods.  
**PR #40** `850768c` — 3 branch commits squashed (`a54e48c`, review `f81e04e`, refactor `ccb1df1`): pipeline, method tiers, `sync:algs`/`verify:algs`, #22 deck mapping; implicit regen for #12/#14.

The tree at `850768c` is the split pipeline (`ingest/fetcher.mjs`, `pipeline/{rules,transformers,exporter}.mjs`), not a monolith. Branch-only SHAs inside #40 are **not** on `main`.

### Phase 4 — After window (2026-09-12–13)

Post-HEAD work on unmerged `fix/*` branches and later GitHub issues/PRs (including **#41–#43** filed 2026-09-12). #4/#5 closed into #3 without code. **Not shipped** — do not snapshot live tracker numbers into the frozen timeline.

## Merge strategy facts

- **13/13** merged PRs are squashes.
- Issue linkage lives on **branch** commit messages; squash **titles** often drop `closes #N`.
- Review: informal; some PRs are fix + “address review”.
- **No CI** (no `.github/` at HEAD).
- **No** vitest/jest/playwright.
- Verification advertised: manual `verify:algs`, `lint`, `build`.

## Merged PR map

| PR | Branch | Squash on main | Author date | Branch commits | Issues |
|----|--------|----------------|-------------|----------------|--------|
| #1 | `feat/quizlet-flashcards-trainer` | `d79636c` | 2026-09-06 (-0700) / 09-07 EDT | 6→1 | feature |
| #29 | `fix/issue-25-shortcuts` | `723526f` | 2026-09-09 | 1 | #25 |
| #30 | `fix/issue-26-scramble-notation` | `0c4cf50` | 2026-09-09 | 1 | #26 |
| #31 | `fix/issue-10-dead-badge-guards` | `95484bc` | 2026-09-09 | 1 | #10 |
| #33 | `fix/issue-20-ao5-ao12-order` | `9a149a8` | 2026-09-09 | 2 | #20 |
| #35 | `fix/issue-8-pll-e-group-adjacent` | `01ca3a1` | 2026-09-09 | 2 | #8 |
| #32 | `fix/issue-23-remove-dead-fetch` | `5f5c11a` | 2026-09-10 | 1 | #23 |
| #34 | `fix/issue-28-unclosed-rotations` | `162dd4d` | 2026-09-10 | 1 | #28 |
| #38 | `fix/issue-7-remove-duplicate-pll-w` | `a1c877e` | 2026-09-10 | 1 | #7 |
| #37 | `fix/issue-13-zperm-net-u-deficit` | `dadd0c8` | 2026-09-10 | 1 | #13 |
| #36 | `fix/issue-6-trailing-auf-jb-ra-rb` | `62faed8` | 2026-09-10 | 1 | #6 |
| #39 | `fix/remove-unimplemented-methods` | `aef759e` | 2026-09-10 | 1 | cleanup |
| #40 | `feat/external-sync-cfop-methods` | `850768c` | 2026-09-10 | 3→1 | #22, implicit #12 #14 |

Work-instance counts: **34** main commits; ~**22** pre-squash PR branch commits (6+10 one-commit PRs + #33×2 + #35×2 + #40×3); orphaned tips still on remotes. `git rev-list --all ^main` includes post-HEAD WIP and this docs branch.

**GitHub number space:** issues **#2–#28** and later post-HEAD issues (e.g. **#41+**) are issues. **#1** and **#29–#40** are merged PRs — grepping “issue #29” will not find a bug ticket.

Local duplicate SHAs (not extra work): `3b3dca9`≡`723526f`, `0276cdc`≡`0c4cf50`, `dcbe32d`≡`95484bc`, `1f4107c`+`69b7ed4`→`9a149a8`, `cc92bb8` then `5bf36c3`→`01ca3a1`, `ad744cb`≡`5f5c11a`, `eb173ef`≡`a1c877e`, `0d8dd55`≡`162dd4d`, `1479902`≡`dadd0c8`, `d03bfcd`≡`62faed8`.

## Squash caveats (read before citing history)

1. **Discarded attempts survive as text.** PR #35 squash body includes `cc92bb8` “Adjacent Corners” **and** the merged Diagonal fix. Only the latter is in the tree (`pll-e.group = "Diagonal Corners"`).
2. **Review commits vanish from ancestry.** e.g. `69b7ed4` (Ao5 queue order) only on orphaned branch / squash body.
3. **Multi-issue PRs hide grep.** `git log --grep='closes #22'` is empty; #12/#14/#22 closed by #40 without `closes`.
4. **Parallel work looks sequential.** Sep 9 00:16–00:25 eight branches — timestamps ≠ one linear author.
5. **Duplicate SHAs.** Deduplicate Sep 9 local tip vs squash **by diff**, not by hash.
6. **Pre-#40 issue bodies name `cfopData.ts`.** After #40, LL fixes belong in `transformers.mjs` / `rules.mjs`. Tracker #2 has path corrections; individual issues may be stale.
7. **False confidence from verify.** Script prints “All PLL algorithms preserve CENTERS” while checking **primaries only**.
8. **Agent checkpoints pollute `--all`.** This docs branch and Sep 13 WIP are not product history.
9. **Sep 9–10 hand-authored LL fixes were overwritten hours later** by PR #40 JSON regen. Equivalent constraints live in `rules.mjs`; do not treat `cfopData.ts` diffs from #6/#13/#28 as the HEAD LL source.

To reconstruct a PR: leftover branch tip + squash body — never main log alone.

## Issue linkage gaps

- No commit message ever mentions **#21, #24, #27**.
- **#12, #14, #22** closed by #40 without `closes #N`.
- **#8** closed via squash body, not title.
- **#4, #5** closed Sep 12 with **zero** commits.
- **#28** closed for two alts; later #41 files the rest — after window.

## Testing / audit practices

| Mechanism | Automated? | Scope |
|-----------|------------|--------|
| `npm run verify:algs` | Manual CLI | Counts + parse all LL algs + PLL **primary** invariants |
| `npm run sync:algs` | Manual CLI | Live fetch → JSON |
| `npm run lint` / `build` | Manual CLI | oxlint, tsc+vite |
| Commit `26359fe` | One-shot agent | localStorage, crossCases, nav |
| Issue #2 writeups | Ad-hoc JS in issue bodies | Not in repo |
| PR #40 body | Self-attested | “two review cycles”; claimed invariants on 181 variations = **parse** count (94+87), not alt **semantics** |

Does not exist: CI, unit tests, E2E, pre-commit verify, regression tests tied to issue repros, browser-level timer tests.

**Neither spec pass ran `verify:algs`.** Do not quote a local pass/fail.

## How to label later work

| Label | Apply to |
|-------|----------|
| **Shipped** | `main` through `850768c` only |
| **Closed without code** | #4, #5 (Sep 12) |
| **Later WIP** | Unmerged `fix/*`, post-HEAD GitHub issues/PRs (#41+); not shipped; do not snapshot live tracker numbers |
| **Not a milestone** | `9dce376` |

## Suggested auditor workflow

1. Start from `850768c` tree, not `git log --all`.
2. For each closed issue, confirm a **main** SHA or mark “implicit regen / no commit”.
3. Re-run extended invariants on **alternatives** before trusting PLL rotation claims.
4. Treat issue-body harnesses as uncommitted tests.
5. Do not merge-credit parallel Sep 13 branches that mention multiple issue numbers in one history.

## Agent workflow: the spec-first loop

When AI agents work on this codebase:

1. **Context gathering:** Check `spec/` before running exploratory `git log` commands. `spec/` provides the curated architectural intent and historical milestones without squash noise.
2. **Pre-work planning:** Before starting implementation, the planner or orchestrator agent writes its intent and planned updates into `spec/` (e.g. updating architecture, current state, or open questions).
3. **Subagent alignment:** Subagents read the plan in `spec/` to ensure shared context and prevent drift.
4. **Post-implementation update:** When code merges or stabilizes, update `spec/` to reflect new invariants, verification scripts, or surfaced behaviors.
