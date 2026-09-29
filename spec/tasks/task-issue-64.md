# Task: Issue #64 — Typed JSON + CI Ratchet

## Objective
Replace unchecked `as AlgCase[]` casts on generated JSON with runtime schema validation,
and ensure `npm run build` fails when `verify:algs` would fail on committed JSON.

## Scope
- **New:** `src/data/validateAlgCase.ts` — runtime validator for `AlgCase` shape
- **Edit:** `src/data/cfopData.ts` — replace `as AlgCase[]` with validated imports
- **Edit:** `package.json` — prepend `verify:algs` to `build` script
- **New:** `tests/unit/validateAlgCase.test.ts` — unit tests for validator

## Out of Scope
- Migrating pipeline scripts to TypeScript (separate effort)
- Zod or third-party schema library (keep zero new dependencies)

## Invariants
- All existing `AlgCase` fields preserved (id, name, category, subcategory, group, primaryAlg required; alternativeAlgs, probability, description, tips, why, is2Look optional)
- All verification suites pass unchanged
- CI workflow already runs verify steps; build script now gates on verify:algs

## Implementation Steps
1. Create `src/data/validateAlgCase.ts` with `validateAlgCases(data: unknown, label: string): AlgCase[]`
2. Update `cfopData.ts` to use validator instead of `as AlgCase[]`
3. Update `package.json` build to `npm run verify:algs && tsc -b && vite build`
4. Write unit tests for valid/invalid payloads
5. Verify all suites pass
