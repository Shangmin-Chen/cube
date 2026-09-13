import { puzzles } from 'cubing/puzzles';
import {
  ALGORITHM_OVERRIDES,
  applyAlgorithmOverrides,
  assertNoUnusedOverrides,
  validateOverrideEntry,
} from './pipeline/algorithm-overrides.mjs';
import { applyAlgRules } from './pipeline/rules.mjs';
import {
  CFOP_DATASET_TRANSFORMERS,
  transformAllCfopDatasets,
} from './pipeline/transform-pipeline.mjs';
import {
  transform2LookOLL,
  transform2LookPLL,
  transformFullOLL,
  transformFullPLL,
} from './pipeline/transformers.mjs';

const OLL_2LOOK_FIXTURE = {
  name: 'I-Shape',
  group: 'Edges',
  alg: ["F R U R' U' F'", "R U R' U' M' U R U' r'", "L U L' U'"],
};

const PLL_2LOOK_FIXTURE = {
  name: 'Headlights',
  group: 'Corners',
  alg: ["R U R' U' R' F R2 U' R' U' R U R' F'", "F R F'", "L U L' U'"],
};

const OLL_FULL_FIXTURE = {
  name: 1,
  group: 'Dot',
  prob: 1,
  alg: ["F R U R' U' F'", "F R F'", "L U L' U'"],
};

const PLL_FULL_FIXTURE = {
  name: 't',
  group: 'Adjacent Corners',
  prob: 4,
  alg: ["R U R' U' R' F R2 U' R' U' R U R' F'", "F R F'", "L U L' U'"],
};

const TRANSFORM_FIXTURES = [
  {
    label: '2-Look OLL',
    fn: transform2LookOLL,
    raw: [OLL_2LOOK_FIXTURE],
    caseId: 'oll-2look-line',
  },
  {
    label: '2-Look PLL',
    fn: transform2LookPLL,
    raw: [PLL_2LOOK_FIXTURE],
    caseId: 'pll-2look-tperm',
  },
  {
    label: 'Full OLL',
    fn: transformFullOLL,
    raw: [OLL_FULL_FIXTURE],
    caseId: 'oll-1',
  },
  {
    label: 'Full PLL',
    fn: transformFullPLL,
    raw: [PLL_FULL_FIXTURE],
    caseId: 'pll-t',
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(fn, expectedMessagePart) {
  try {
    fn();
    throw new Error(`expected throw containing "${expectedMessagePart}"`);
  } catch (err) {
    if (err.message.includes('expected throw containing')) {
      throw err;
    }
    assert(
      err.message.includes(expectedMessagePart),
      `expected error containing "${expectedMessagePart}", got "${err.message}"`,
    );
  }
}

function testReplacePrimary(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const overrides = {
    'oll-2look-line': { primaryAlg: "U R U' R'" },
  };

  const resolved = applyAlgorithmOverrides('oll-2look-line', upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved[0] === "U R U' R'", 'primary was replaced');
  assert(resolved.length === 3, 'alternatives were preserved');
}

function testRemoveAlternative(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const overrides = {
    'oll-2look-line': { removeAlternatives: ["F R F'"] },
  };

  const resolved = applyAlgorithmOverrides('oll-2look-line', upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved.length === 2, 'one alternative was removed');
  assert(resolved[1] === "L U L' U'", 'unrelated alternative was preserved');
}

function testRemoveAlternativeMatchesNormalized(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const normalizedAlt = applyAlgRules("F R F'", kpuzzle);
  const overrides = {
    'oll-2look-line': { removeAlternatives: [normalizedAlt] },
  };

  const resolved = applyAlgorithmOverrides('oll-2look-line', upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved.length === 2, 'normalized removeAlternatives entry matched upstream alternative');
}

function testPromoteAlt(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const overrides = {
    'oll-2look-line': { primaryAlg: "F R F'" },
  };

  const resolved = applyAlgorithmOverrides('oll-2look-line', upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved[0] === "F R F'", 'promoted alternative became primary');
  assert(resolved.length === 2, 'promoted alternative was not duplicated');
  assert(resolved[1] === "L U L' U'", 'other alternatives remain');
}

function testUnknownCaseId(kpuzzle) {
  const overrides = {
    'oll-2look-typo-id': { primaryAlg: "R U R' U'" },
  };
  const appliedOverrideKeys = new Set();

  transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, { overrides, appliedOverrideKeys });

  assertThrows(
    () => assertNoUnusedOverrides(overrides, appliedOverrideKeys),
    'no transformer applied',
  );
}

function testUnmatchedRemove(kpuzzle) {
  const overrides = {
    'oll-2look-line': { removeAlternatives: ['NONEXISTENT_ALG'] },
  };

  assertThrows(
    () => applyAlgorithmOverrides('oll-2look-line', ["R U R' U'", "F R F'"], overrides, {
      kpuzzle,
      appliedOverrideKeys: new Set(),
    }),
    'did not match any upstream alternative',
  );
}

function testUnknownOverrideValueKey() {
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', { primaryalg: "R U R' U'" }),
    'unrecognized keys',
  );
}

function testUnknownOverrideValueKeyTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': { primaryalg: "R U R' U'" } },
    }),
    'unrecognized keys',
  );
}

function testIdentityPrimaryNoOp(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { primaryAlg: OLL_2LOOK_FIXTURE.alg[0] } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'made no change',
  );
}

function testIdentityPrimaryNoOpTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': { primaryAlg: OLL_2LOOK_FIXTURE.alg[0] } },
    }),
    'made no change',
  );
}

function testWhitespaceIdentityPrimaryNoOp(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { primaryAlg: ` ${OLL_2LOOK_FIXTURE.alg[0]} ` } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'made no change',
  );
}

function testWhitespaceIdentityPrimaryNoOpTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': { primaryAlg: ` ${OLL_2LOOK_FIXTURE.alg[0]} ` } },
    }),
    'made no change',
  );
}

function testEmptyOverrideEntry() {
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', {}),
    'is empty',
  );
}

function testEmptyOverrideEntryApply(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': {} },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'is empty',
  );
}

function testEmptyOverrideEntryTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': {} },
    }),
    'is empty',
  );
}

function testEmptyRemoveAlternatives() {
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', { removeAlternatives: [] }),
    'empty removeAlternatives',
  );
}

function testEmptyRemoveAlternativesApply(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { removeAlternatives: [] } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'empty removeAlternatives',
  );
}

function testEmptyRemoveAlternativesTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': { removeAlternatives: [] } },
    }),
    'empty removeAlternatives',
  );
}

function testEmptyPrimaryAlg() {
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', { primaryAlg: '' }),
    'empty or invalid primaryAlg',
  );
}

function testEmptyPrimaryAlgApply(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { primaryAlg: '' } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'empty or invalid primaryAlg',
  );
}

function testEmptyPrimaryAlgTransformPath(kpuzzle) {
  assertThrows(
    () => transform2LookOLL([OLL_2LOOK_FIXTURE], kpuzzle, {
      overrides: { 'oll-2look-line': { primaryAlg: '' } },
    }),
    'empty or invalid primaryAlg',
  );
}

function testInvalidRemoveAlternativesEntries() {
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', { removeAlternatives: [123] }),
    'invalid removeAlternatives entries',
  );
  assertThrows(
    () => validateOverrideEntry('oll-2look-line', { removeAlternatives: [''] }),
    'invalid removeAlternatives entries',
  );
}

function testInvalidRemoveAlternativesEntriesApply(kpuzzle) {
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { removeAlternatives: [123] } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'invalid removeAlternatives entries',
  );
  assertThrows(
    () => applyAlgorithmOverrides(
      'oll-2look-line',
      OLL_2LOOK_FIXTURE.alg,
      { 'oll-2look-line': { removeAlternatives: [''] } },
      { kpuzzle, appliedOverrideKeys: new Set() },
    ),
    'invalid removeAlternatives entries',
  );
}

function testProductionOverridesEmpty() {
  assert(Object.keys(ALGORITHM_OVERRIDES).length === 0, 'production ALGORITHM_OVERRIDES must stay empty');
}

function testTransformPath(label, transformFn, rawFixture, caseId, kpuzzle) {
  const overrides = {
    [caseId]: { primaryAlg: "R U R' U'" },
  };
  const appliedOverrideKeys = new Set();

  const cases = transformFn(rawFixture, kpuzzle, { overrides, appliedOverrideKeys });
  const outputCase = cases.find(entry => entry.id === caseId);

  assert(outputCase, `${label} fixture case was transformed`);
  assert(outputCase.primaryAlg === "R U R' U'", `${label} transform path applied primaryAlg override`);
  assert(appliedOverrideKeys.has(caseId), `${label} override key was tracked as applied`);
}

function testAllDatasetTransformersRegistered() {
  assert(CFOP_DATASET_TRANSFORMERS.length === 4, 'all four dataset transformers are registered');
  const names = CFOP_DATASET_TRANSFORMERS.map(([label]) => label);
  assert(names.includes('2-Look OLL'), '2-Look OLL transformer registered');
  assert(names.includes('2-Look PLL'), '2-Look PLL transformer registered');
  assert(names.includes('Full OLL'), 'Full OLL transformer registered');
  assert(names.includes('Full PLL'), 'Full PLL transformer registered');
}

function testSyncAssertAllUsed(kpuzzle) {
  const overrides = {
    'oll-2look-line': { primaryAlg: "R U R' U'" },
    'unused-override-key': { primaryAlg: "R U R' U'" },
  };

  assertThrows(
    () => transformAllCfopDatasets(
      {
        oll2Look: [OLL_2LOOK_FIXTURE],
        pll2Look: [PLL_2LOOK_FIXTURE],
        ollFull: [OLL_FULL_FIXTURE],
        pllFull: [PLL_FULL_FIXTURE],
      },
      kpuzzle,
      overrides,
    ),
    'no transformer applied',
  );
}

const SYNC_OVERRIDE_FIXTURES = [
  { caseId: 'oll-2look-line', resultKey: 'oll2LookCases', primaryAlg: "R U R' U'" },
  { caseId: 'pll-2look-tperm', resultKey: 'pll2LookCases', primaryAlg: "R U R' U'" },
  { caseId: 'oll-1', resultKey: 'ollFullCases', primaryAlg: "R U R' U'" },
  { caseId: 'pll-t', resultKey: 'pllFullCases', primaryAlg: "R U R' U'" },
];

function testSyncPipelineAppliesOverrides(kpuzzle) {
  const overrides = Object.fromEntries(
    SYNC_OVERRIDE_FIXTURES.map(({ caseId, primaryAlg }) => [caseId, { primaryAlg }]),
  );

  const results = transformAllCfopDatasets(
    {
      oll2Look: [OLL_2LOOK_FIXTURE],
      pll2Look: [PLL_2LOOK_FIXTURE],
      ollFull: [OLL_FULL_FIXTURE],
      pllFull: [PLL_FULL_FIXTURE],
    },
    kpuzzle,
    overrides,
  );

  for (const { caseId, resultKey, primaryAlg } of SYNC_OVERRIDE_FIXTURES) {
    const outputCase = results[resultKey].find(entry => entry.id === caseId);
    assert(
      outputCase?.primaryAlg === primaryAlg,
      `sync pipeline applied override for ${caseId} via transformAllCfopDatasets`,
    );
  }
}

async function main() {
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const tests = [
    ['replace-primary', () => testReplacePrimary(kpuzzle)],
    ['remove-alternative', () => testRemoveAlternative(kpuzzle)],
    ['remove-alternative-normalized', () => testRemoveAlternativeMatchesNormalized(kpuzzle)],
    ['promote-alt', () => testPromoteAlt(kpuzzle)],
    ['unknown-case-id', () => testUnknownCaseId(kpuzzle)],
    ['unmatched-remove', () => testUnmatchedRemove(kpuzzle)],
    ['unknown-override-value-key', () => testUnknownOverrideValueKey()],
    ['unknown-override-value-key-transform', () => testUnknownOverrideValueKeyTransformPath(kpuzzle)],
    ['identity-primary-no-op', () => testIdentityPrimaryNoOp(kpuzzle)],
    ['identity-primary-no-op-transform', () => testIdentityPrimaryNoOpTransformPath(kpuzzle)],
    ['whitespace-identity-primary-no-op', () => testWhitespaceIdentityPrimaryNoOp(kpuzzle)],
    ['whitespace-identity-primary-no-op-transform', () => testWhitespaceIdentityPrimaryNoOpTransformPath(kpuzzle)],
    ['empty-override-entry', () => testEmptyOverrideEntry()],
    ['empty-override-entry-apply', () => testEmptyOverrideEntryApply(kpuzzle)],
    ['empty-override-entry-transform', () => testEmptyOverrideEntryTransformPath(kpuzzle)],
    ['empty-remove-alternatives', () => testEmptyRemoveAlternatives()],
    ['empty-remove-alternatives-apply', () => testEmptyRemoveAlternativesApply(kpuzzle)],
    ['empty-remove-alternatives-transform', () => testEmptyRemoveAlternativesTransformPath(kpuzzle)],
    ['empty-primary-alg', () => testEmptyPrimaryAlg()],
    ['empty-primary-alg-apply', () => testEmptyPrimaryAlgApply(kpuzzle)],
    ['empty-primary-alg-transform', () => testEmptyPrimaryAlgTransformPath(kpuzzle)],
    ['invalid-remove-alternatives-entries', () => testInvalidRemoveAlternativesEntries()],
    ['invalid-remove-alternatives-entries-apply', () => testInvalidRemoveAlternativesEntriesApply(kpuzzle)],
    ['production-overrides-empty', () => testProductionOverridesEmpty()],
    ['all-dataset-transformers-registered', () => testAllDatasetTransformersRegistered()],
    ['sync-assert-all-used', () => testSyncAssertAllUsed(kpuzzle)],
    ['sync-pipeline-applies-overrides', () => testSyncPipelineAppliesOverrides(kpuzzle)],
    ...TRANSFORM_FIXTURES.map(({ label, fn, raw, caseId }) => [
      `transform-${label.toLowerCase().replace(/\s+/g, '-')}`,
      () => testTransformPath(label, fn, raw, caseId, kpuzzle),
    ]),
  ];

  let failed = false;
  for (const [name, run] of tests) {
    try {
      run();
      console.log(`✓ ${name}`);
    } catch (err) {
      failed = true;
      console.error(`✗ ${name}: ${err.message}`);
    }
  }

  if (failed) {
    process.exit(1);
  }

  console.log('All algorithm override tests passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
