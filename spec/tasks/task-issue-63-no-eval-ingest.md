# Task: Issue #63 — Remove vm.runInContext from ingest pipeline

## Status: In Progress

## Problem Summary

`scripts/ingest/fetcher.mjs` fetches JavaScript source from `jperm.net` (e.g.,
`https://jperm.net/lib/oll.js`) and executes it via `vm.runInContext`, relying on
the Node.js `vm` module as if it were a sandbox. Node `vm` is **not** a security
boundary — any fetched code runs with full process privileges, making `npm run sync:algs`
equivalent to remote code execution.

Finding ID: P-09 from the 2026-09-13 code-quality audit at `850768c`.

## Related Issues

- Parent: #2
- Sibling: #43 (content-hash pinning — separate from this issue)

## Acceptance Criteria (from issue)

1. `sync:algs` does not call `vm.runInContext`, `eval`, or `Function` on live network bytes.
2. Ingest fails with an explicit error if `algsetAlgs` does not match the schema
   `{ name: string, alg: string[], group?: string, prob?: number }[]`.
3. Fetcher JSDoc does not describe Node `vm` as a sandbox.

## Data Schema (from transformers.mjs)

Each entry in `algsetAlgs` must satisfy:
- `name`: string (required) — case name e.g. `"Sune"`, `"1"`, `"aa"`
- `alg`: string[] (required) — array of algorithm notation strings
- `group`: string (optional) — grouping label e.g. `"Edges"`, `"Cross"`
- `prob`: number (optional) — probability multiplier (1, 2, or 4)

## Approach: Regex Text-Parse (No eval, No fixture files needed)

Instead of fetching JS and executing it, we:

1. Fetch the raw JS text from jperm.net (still needed for SHA-256 integrity check via #43 upstream-lock).
2. Extract the `algsetAlgs = [...]` array literal using a targeted regex.
3. Transform the extracted text to valid JSON (single→double quotes, trailing commas, etc.).
4. Parse with `JSON.parse`.
5. Validate the parsed array against the explicit schema.
6. Fail hard if regex extraction, JSON parse, or schema validation fails.

This eliminates all JavaScript execution of network bytes while preserving:
- The upstream lock / SHA-256 integrity check (`assertOrUpdatePin`)
- The existing `fetchAlgset` API signature (no changes to `sync-algorithms.mjs`)

## Files to Modify

- `scripts/ingest/fetcher.mjs` — replace `vm.runInContext` with regex parse + schema validation
  - Remove `import vm from 'node:vm'`
  - Rewrite `parseAlgset(code, url)` to extract and JSON-parse the array
  - Add `validateAlgsetSchema(algs, url)` schema validator
  - Update JSDoc: do not call `vm` a sandbox

## Files NOT Modified

- `scripts/sync-algorithms.mjs` — no changes (API unchanged)
- `scripts/ingest/upstream-lock.mjs` — no changes
- `scripts/ingest/upstream.lock.json` — no changes
- All `src/` frontend files — untouched per instructions
- All `scripts/pipeline/` files — untouched

## Verification Checklist

- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run verify:algs` — 0 errors, 0 warnings
- [ ] `npm run verify:triggers` — 0 errors, 0 warnings
- [ ] `npm run verify:trainer` — 0 errors, 0 warnings
- [ ] `npm run verify:upstream-pin` — 0 errors, 0 warnings
- [ ] `npm run build` — 0 errors, 0 warnings

## Completion Notes

_(filled in upon completion)_
