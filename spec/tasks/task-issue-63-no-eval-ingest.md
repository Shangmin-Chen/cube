# Task: Issue #63 — Decouple Ingest to Monorepo Workspace Package (@cube/cfop-data)

## Status: In Progress

## Problem Summary

Historically, `scripts/ingest/fetcher.mjs` fetched JavaScript bundles from `jperm.net` and executed them via `vm.runInContext`, creating a remote code execution vulnerability (Finding P-09 from the 2026-09-13 code-quality audit at `850768c`).

Rather than wrapping this fragile HTTP scraper in complex defensive machinery (lockfile verification, AST traversals, and custom package-manager recreations), we adopt a formal **monorepo workspace package architecture** (`@cube/cfop-data`).

This moves the algorithm dataset into an isolated, typed, publication-ready workspace package (`packages/cfop-data/`), establishing a strict architectural boundary, eliminating network-based code execution, and making builds 100% offline and deterministic.

## Related Issues

- Parent: #2
- Sibling: #43 (unpinned upstream fetch — obsoleted by vendored workspace package)
- Sibling: #62 (pipeline fail-closed rules)

## Acceptance Criteria

1. **Zero Remote Code Execution:** Neither `vm.runInContext`, `eval`, nor `Function` is executed on network bytes.
2. **Workspace Package Boundary:** Algorithm datasets are packaged into an internal workspace package `@cube/cfop-data` under `packages/cfop-data/`.
3. **Type Safety & Strict Schema:** Datasets are strictly typed against `AlgCase` and verified against runtime schemas.
4. **100% Offline & Deterministic:** Dataset loading and compilation require 0 network calls.
5. **Preserve Invariants:** All existing CFOP semantic invariants (center preservation, probability sums, Cross simulation, trigger patterns) continue to pass.
6. **Zero JSDoc Misrepresentations:** Remove references to Node `vm` as a sandbox.

## Target Architecture

```text
cube/
├── package.json                   # Root package with "workspaces": ["packages/*"]
├── packages/
│   └── cfop-data/                 # Decoupled dataset package (@cube/cfop-data v1.0.0)
│       ├── package.json           # Self-contained package manifest
│       ├── tsconfig.json          # Package TypeScript configuration
│       ├── README.md              # Documentation, attribution, and schema guide
│       └── src/
│           ├── index.ts           # Public API entry point
│           ├── types.ts           # Typed domain schemas (AlgCase, CFOPStep, etc.)
│           └── data/              # Clean algorithm datasets (OLL, PLL, Cross, F2L)
└── src/
    └── data/
        └── cfopData.ts            # Consumes @cube/cfop-data for the main web application
```

## Migration & Implementation Plan

1. **Initialize Workspace Package:**
   - Configure `"workspaces": ["packages/*"]` in root `package.json`.
   - Create `packages/cfop-data/package.json` with name `@cube/cfop-data`, version `1.0.0`, type `module`.
   - Create `packages/cfop-data/tsconfig.json` extending composite project settings.
   - Reference `packages/cfop-data` in root `tsconfig.json`.

2. **Populate Dataset & Types:**
   - Define canonical types in `packages/cfop-data/src/types.ts`.
   - Export OLL (2-Look and Full), PLL (2-Look and Full), Cross, and F2L data from `packages/cfop-data/src/index.ts`.
   - Validate datasets against runtime schema.

3. **Integrate with Application:**
   - Update `src/data/cfopData.ts` to consume `@cube/cfop-data`.
   - Re-export data to maintain backward compatibility for existing UI components and hooks.

4. **Retire Legacy Ingestion Scraping Machinery:**
   - Clean up `scripts/ingest/fetcher.mjs` and remove `vm.runInContext`.
   - Update `scripts/sync-algorithms.mjs` to work offline with `@cube/cfop-data`.

5. **Verification & Invariant Checks:**
   - Run `npm test` across all unit and integration tests.
   - Run all mandatory invariant scripts (`verify:algs`, `verify:triggers`, `verify:trainer`, `verify:upstream-pin`).
   - Run `npm run lint` and `npm run build`.

## Verification Checklist

- [ ] `npm test` — all tests pass
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run verify:algs` — 0 errors, 0 warnings
- [ ] `npm run verify:triggers` — 0 errors, 0 warnings
- [ ] `npm run verify:trainer` — 0 errors, 0 warnings
- [ ] `npm run verify:upstream-pin` — 0 errors, 0 warnings
- [ ] `npm run build` — 0 errors, 0 warnings
