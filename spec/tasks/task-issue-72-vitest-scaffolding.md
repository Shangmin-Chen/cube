# Task Specification: Issue #72 Vitest Scaffolding & Test Migration

## Objective & Scope
Resolve issue [#72](https://github.com/Shangmin-Chen/cube/issues/72):
- Introduce Vitest (native to Vite) as a devDependency.
- Add `npm test` (`vitest run`) and `npm run test:watch` (`vitest`) scripts to `package.json`.
- Add `npm test` step to `.github/workflows/ci.yml`.
- Migrate verification logic into standard Vitest test suites under `tests/`:
  - `tests/unit/trainerSessionLogic.test.ts` (from `verify-trainer-session.ts`)
  - `tests/unit/upstreamLock.test.ts` (from `verify-upstream-pin.mjs`)
  - `tests/integration/cfopInvariants.test.ts` (from `verify-cfop.mjs`)
  - `tests/integration/crossCases.test.ts` (from `verify-cross-cases.mjs`)
- Preserve zero regression on all existing invariant checks and existing `npm run verify:*` commands.

## Invariants Preserved
- All existing verification scripts (`verify:algs`, `verify:triggers`, `verify:trainer`, `verify:upstream-pin`) remain fully operational.
- KPuzzle parsing simulations, CENTERS identity, Look-1 hold orientation, and 2-Look probability skip sums continue to be enforced.
- 0 errors, 0 warnings across all tests and linting.

## Verification Plan
```bash
npm run lint
npm run verify:algs
npm run verify:triggers
npm run verify:trainer
npm run verify:upstream-pin
npm test
npm run build
```
