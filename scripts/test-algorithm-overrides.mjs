import { puzzles } from 'cubing/puzzles';
import { applyAlgorithmOverrides } from './pipeline/algorithm-overrides.mjs';
import { applyAlgRules, validateAlg } from './pipeline/rules.mjs';

const FIXTURE_CASE_ID = '__test-alg-override-fixture__';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const upstreamAlgs = ["R U R' U'", "F R F'", "L U L' U'"];

  const fixtureOverrides = {
    [FIXTURE_CASE_ID]: {
      primaryAlg: "U R U' R'",
      removeAlternatives: ["F R F'"],
    },
  };

  const resolved = applyAlgorithmOverrides(FIXTURE_CASE_ID, upstreamAlgs, fixtureOverrides);

  assert(resolved[0] === "U R U' R'", 'replace-primary: upstream primary was replaced');
  assert(resolved.length === 2, 'remove-alternative: one upstream alternative was dropped');
  assert(resolved[1] === "L U L' U'", 'remove-alternative: unrelated alternative was preserved');

  for (const alg of resolved) {
    const normalized = applyAlgRules(alg, kpuzzle);
    validateAlg(kpuzzle, normalized, FIXTURE_CASE_ID);
  }

  const passthrough = applyAlgorithmOverrides('oll-2look-dot', upstreamAlgs, fixtureOverrides);
  assert(
    passthrough[0] === upstreamAlgs[0] && passthrough.length === upstreamAlgs.length,
    'unmapped cases pass through unchanged',
  );

  console.log('✓ replace-primary override works');
  console.log('✓ remove-alternative override works');
  console.log('✓ overridden algorithms validate via KPuzzle simulation');
  console.log('All algorithm override tests passed.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
