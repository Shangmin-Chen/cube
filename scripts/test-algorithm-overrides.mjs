import { puzzles } from 'cubing/puzzles';
import {
  applyAlgorithmOverrides,
  assertNoUnusedOverrides,
} from './pipeline/algorithm-overrides.mjs';
import { applyAlgRules } from './pipeline/rules.mjs';
import { transform2LookOLL } from './pipeline/transformers.mjs';

const FIXTURE_CASE_ID = 'oll-2look-line';
const FIXTURE_RAW_ITEM = {
  name: 'I-Shape',
  group: 'Edges',
  alg: ["F R U R' U' F'", "R U R' U' M' U R U' r'", "L U L' U'"],
};

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
    [FIXTURE_CASE_ID]: { primaryAlg: "U R U' R'" },
  };

  const resolved = applyAlgorithmOverrides(FIXTURE_CASE_ID, upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved[0] === "U R U' R'", 'primary was replaced');
  assert(resolved.length === 3, 'alternatives were preserved');
}

function testRemoveAlternative(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const overrides = {
    [FIXTURE_CASE_ID]: { removeAlternatives: ["F R F'"] },
  };

  const resolved = applyAlgorithmOverrides(FIXTURE_CASE_ID, upstreamAlgs, overrides, {
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
    [FIXTURE_CASE_ID]: { removeAlternatives: [normalizedAlt] },
  };

  const resolved = applyAlgorithmOverrides(FIXTURE_CASE_ID, upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved.length === 2, 'normalized removeAlternatives entry matched upstream alternative');
}

function testPromoteAlt(kpuzzle) {
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];
  const overrides = {
    [FIXTURE_CASE_ID]: { primaryAlg: "F R F'" },
  };

  const resolved = applyAlgorithmOverrides(FIXTURE_CASE_ID, upstreamAlgs, overrides, {
    kpuzzle,
    appliedOverrideKeys: new Set(),
  });

  assert(resolved[0] === "F R F'", 'promoted alternative became primary');
  assert(resolved.length === 2, 'promoted alternative was not duplicated');
  assert(resolved[1] === "L U L' U'", 'other alternatives remain');
}

function testUnknownId(kpuzzle) {
  const overrides = {
    'oll-2look-typo-id': { primaryAlg: "R U R' U'" },
  };
  const appliedOverrideKeys = new Set();

  transform2LookOLL([FIXTURE_RAW_ITEM], kpuzzle, { overrides, appliedOverrideKeys });

  assertThrows(
    () => assertNoUnusedOverrides(overrides, appliedOverrideKeys),
    'no transformer applied',
  );
}

function testUnmatchedRemove(kpuzzle) {
  const overrides = {
    [FIXTURE_CASE_ID]: { removeAlternatives: ['NONEXISTENT_ALG'] },
  };

  assertThrows(
    () => applyAlgorithmOverrides(FIXTURE_CASE_ID, ["R U R' U'", "F R F'"], overrides, {
      kpuzzle,
      appliedOverrideKeys: new Set(),
    }),
    'did not match any upstream alternative',
  );
}

function testTransformReplacePrimary(kpuzzle) {
  const overrides = {
    [FIXTURE_CASE_ID]: { primaryAlg: "R U R' U'" },
  };
  const appliedOverrideKeys = new Set();

  const cases = transform2LookOLL([FIXTURE_RAW_ITEM], kpuzzle, { overrides, appliedOverrideKeys });
  const lineCase = cases.find(c => c.id === FIXTURE_CASE_ID);

  assert(lineCase, 'fixture case was transformed');
  assert(lineCase.primaryAlg === "R U R' U'", 'transform path applied primaryAlg override');
  assert(appliedOverrideKeys.has(FIXTURE_CASE_ID), 'override key was tracked as applied');
}

function testTransformRemoveAlternative(kpuzzle) {
  const overrides = {
    [FIXTURE_CASE_ID]: { removeAlternatives: ["L U L' U'"] },
  };
  const appliedOverrideKeys = new Set();

  const cases = transform2LookOLL([FIXTURE_RAW_ITEM], kpuzzle, { overrides, appliedOverrideKeys });
  const lineCase = cases.find(c => c.id === FIXTURE_CASE_ID);

  assert(lineCase, 'fixture case was transformed');
  assert(
    !lineCase.alternativeAlgs.includes("L U L' U'"),
    'transform path removed the targeted alternative',
  );
  assert(lineCase.alternativeAlgs.length === 1, 'remaining alternative was preserved');
}

async function main() {
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const tests = [
    ['replace-primary', () => testReplacePrimary(kpuzzle)],
    ['remove-alternative', () => testRemoveAlternative(kpuzzle)],
    ['remove-alternative-normalized', () => testRemoveAlternativeMatchesNormalized(kpuzzle)],
    ['promote-alt', () => testPromoteAlt(kpuzzle)],
    ['unknown-id', () => testUnknownId(kpuzzle)],
    ['unmatched-remove', () => testUnmatchedRemove(kpuzzle)],
    ['transform-replace-primary', () => testTransformReplacePrimary(kpuzzle)],
    ['transform-remove-alternative', () => testTransformRemoveAlternative(kpuzzle)],
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
