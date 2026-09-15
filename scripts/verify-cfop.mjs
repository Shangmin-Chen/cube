import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const QUARTER_TURN_ROTATIONS = ["y'", "x'", "x", "y", "z'", "z"];
const HALF_TURN_ROTATIONS = ['y2', 'x2', 'z2'];
const SINGLE_ROTATIONS = [...QUARTER_TURN_ROTATIONS, ...HALF_TURN_ROTATIONS];
/** Look-1 keeps U on top — only y-axis whole-cube turns are valid frame changes. */
const LOOK1_Y_ROTATIONS = ["y'", 'y', 'y2'];
const TOP_EDGE_INDICES = [0, 1, 2, 3];
const AUF_CANDIDATES = ["U'", 'U', 'U2'];

/** @returns {string[]} */
function getAllAlgs(c) {
  return [c.primaryAlg, ...(c.alternativeAlgs || [])];
}

/** @param {any} kpuzzle @param {string} algStr */
function centersAreIdentity(kpuzzle, algStr) {
  const transf = kpuzzle.algToTransformation(new Alg(algStr));
  const centers = transf.transformationData.CENTERS.permutation;
  return centers.every((val, idx) => val === idx);
}

/** @param {import('cubing/puzzles').KTransformation} transf */
function topEdgesOriented(transf) {
  const ori = transf.transformationData.EDGES.orientationDelta;
  return TOP_EDGE_INDICES.every(i => ori[i] === 0);
}

/**
 * True when a solved Look-1 case state is reached up to y-axis whole-cube rotation.
 * x/z turns reassign which physical edges occupy U slots and must not be used here.
 *
 * @param {any} kpuzzle
 * @param {import('cubing/puzzles').KTransformation} resultTransf
 */
function look1CaseSolvedModuloRotation(kpuzzle, resultTransf) {
  if (topEdgesOriented(resultTransf)) {
    return true;
  }

  for (const rot of LOOK1_Y_ROTATIONS) {
    const rotTransf = kpuzzle.algToTransformation(new Alg(rot));
    if (topEdgesOriented(rotTransf.apply(resultTransf))) {
      return true;
    }
  }

  return false;
}

/**
 * Negative controls: cross-case / wrong-family algs must not pass Look-1 check.
 *
 * @param {any} kpuzzle
 * @param {object[]} look1OllCases
 */
function assertLook1NegativeControls(kpuzzle, look1OllCases, oll2Look) {
  const byId = Object.fromEntries(look1OllCases.map(c => [c.id, c]));
  const dotCase = byId['oll-2look-dot'];
  const lineCase = byId['oll-2look-line'];
  const lshapeCase = byId['oll-2look-lshape'];
  const suneAlg = oll2Look.find(c => c.id === 'oll-2look-sune')?.primaryAlg ?? "R U R' U R U2 R'";

  const controls = [
    { label: 'dot setup + line primary', caseAlg: dotCase.primaryAlg, alg: lineCase.primaryAlg },
    { label: 'dot setup + sune (wrong family)', caseAlg: dotCase.primaryAlg, alg: suneAlg },
    { label: 'line setup + lshape primary', caseAlg: lineCase.primaryAlg, alg: lshapeCase.primaryAlg },
  ];

  for (const { label, caseAlg, alg } of controls) {
    const caseTransf = kpuzzle.algToTransformation(new Alg(caseAlg)).invert();
    const resultTransf = caseTransf.apply(kpuzzle.algToTransformation(new Alg(alg)));
    if (look1CaseSolvedModuloRotation(kpuzzle, resultTransf)) {
      throw new Error(`Look-1 negative control failed: ${label} incorrectly passed`);
    }
  }
}

/**
 * Derive the U-layer edge slot order from the puzzle definition. Writing it down by
 * hand is how UR and UL came to be transposed, which silently relabelled 3 o'clock
 * as 9 and made the hold invariant agree with a wrong description.
 *
 * @param {any} kp
 * @returns {string[]}
 */
function deriveUEdgeSlots(kp) {
  const faceOf = {};
  for (const face of ['U', 'F', 'R', 'B', 'L']) {
    const pattern = kp.defaultPattern().applyTransformation(kp.algToTransformation(new Alg(face)));
    for (let i = 0; i < 4; i++) {
      if (pattern.patternData.EDGES.pieces[i] !== i) {
        (faceOf[i] ||= []).push(face);
      }
    }
  }
  return [0, 1, 2, 3].map(i => {
    const faces = (faceOf[i] || []).filter(f => f !== 'U');
    if (faces.length !== 1) {
      throw new Error(`Could not derive U-layer slot ${i}: touched by faces ${faces.join('+')}`);
    }
    return `U${faces[0]}`;
  });
}

async function runVerification() {
  console.log('--- CFOP Architecture Verification ---');

  // Load generated JSON files
  const oll2Look = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/oll-2look.json'), 'utf8'));
  const pll2Look = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/pll-2look.json'), 'utf8'));
  const ollFull = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/oll-full.json'), 'utf8'));
  const pllFull = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/pll-full.json'), 'utf8'));

  console.log(`Generated JSON counts:
  - 2-Look OLL: ${oll2Look.length} (expected 10)
  - 2-Look PLL: ${pll2Look.length} (expected 6)
  - Full OLL: ${ollFull.length} (expected 57)
  - Full PLL: ${pllFull.length} (expected 21)`);

  if (oll2Look.length !== 10) throw new Error('oll-2look.json count mismatch');
  if (pll2Look.length !== 6) throw new Error('pll-2look.json count mismatch');
  if (ollFull.length !== 57) throw new Error('oll-full.json count mismatch');
  if (pllFull.length !== 21) throw new Error('pll-full.json count mismatch');

  // KPuzzle simulation check
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const allDatasets = [
    { name: '2-Look OLL', data: oll2Look },
    { name: '2-Look PLL', data: pll2Look },
    { name: 'Full OLL', data: ollFull },
    { name: 'Full PLL', data: pllFull },
  ];

  let totalSimulated = 0;
  for (const set of allDatasets) {
    for (const c of set.data) {
      for (const alg of getAllAlgs(c)) {
        kpuzzle.algToTransformation(new Alg(alg));
        totalSimulated++;
      }
    }
    console.log(`✓ Validated all algorithms in ${set.name}`);
  }

  // --- Semantic Invariant Tests ---
  console.log('--- Running Semantic Invariant Tests ---');
  const allPllCases = [...pll2Look, ...pllFull];
  const look1OllCases = oll2Look.filter(c => c.group === 'Edges (Look 1)');

  // 1. Centers identity for every PLL primary and alternative.
  //    Asserted strictly: #41 balanced every emitted algorithm, so any net whole-cube
  //    rotation reaching this point is a regression. An earlier draft normalised the
  //    rotation away first, which made this invariant unfalsifiable.
  let invariant1Count = 0;
  for (const c of allPllCases) {
    for (const alg of getAllAlgs(c)) {
      if (!centersAreIdentity(kpuzzle, alg)) {
        const centers = kpuzzle.algToTransformation(new Alg(alg)).transformationData.CENTERS.permutation;
        throw new Error(
          `Semantic invariant failure: CENTERS not identity for ${c.id} (${alg}). Got: ${JSON.stringify(centers)}`,
        );
      }
      invariant1Count++;
    }
  }
  console.log(
    `✓ Invariant 1: ${invariant1Count} PLL algorithm variations (primaries + alternatives) preserve CENTERS permutation [0, 1, 2, 3, 4, 5]`,
  );

  // 2. Edges-Only PLLs: corners identity for every primary and alternative
  const edgesOnlyIds = [
    'pll-z',
    'pll-h',
    'pll-ua',
    'pll-ub',
    'pll-2look-zperm',
    'pll-2look-hperm',
    'pll-2look-ua',
    'pll-2look-ub',
  ];

  let invariant2Count = 0;
  for (const id of edgesOnlyIds) {
    const c = allPllCases.find(item => item.id === id);
    if (!c) throw new Error(`Missing expected edges-only PLL case: ${id}`);
    for (const alg of getAllAlgs(c)) {
      const transf = kpuzzle.algToTransformation(new Alg(alg));
      const cornersPerm = transf.transformationData.CORNERS.permutation;
      const cornersOri = transf.transformationData.CORNERS.orientationDelta;

      const isCornersIdentity = cornersPerm.every((val, idx) => val === idx);
      const isCornersOriZero = cornersOri.every(val => val === 0);

      if (!isCornersIdentity) {
        throw new Error(
          `Semantic invariant failure: CORNERS permutation not identity for ${id} (${alg}). Got: ${JSON.stringify(cornersPerm)}`,
        );
      }
      if (!isCornersOriZero) {
        throw new Error(
          `Semantic invariant failure: CORNERS orientation not all 0 for ${id} (${alg}). Got: ${JSON.stringify(cornersOri)}`,
        );
      }
      invariant2Count++;
    }
  }
  console.log(
    `✓ Invariant 2: ${invariant2Count} edges-only PLL algorithm variations leave CORNERS in identity permutation and 0 orientation delta`,
  );

  // 3. Look-1 OLL: every alternative must solve the same case as its primary.
  //    The case state is defined as inverse(primaryAlg), so the primary itself
  //    returns to solved by construction — it is counted as a smoke test, and the
  //    alternatives are the assertion that can actually fail. The negative controls
  //    below prove the check discriminates.
  assertLook1NegativeControls(kpuzzle, look1OllCases, oll2Look);
  console.log('✓ Look-1 negative controls: cross-case algs correctly rejected (y-axis rotation only)');

  let look1Primaries = 0;
  let look1Alternatives = 0;
  for (const c of look1OllCases) {
    const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
    for (const alg of getAllAlgs(c)) {
      const algTransf = kpuzzle.algToTransformation(new Alg(alg));
      const resultTransf = caseTransf.apply(algTransf);
      if (!look1CaseSolvedModuloRotation(kpuzzle, resultTransf)) {
        throw new Error(
          `Semantic invariant failure: Look-1 OLL algorithm did not orient all U edges for ${c.id} (${alg})`,
        );
      }
      if (alg === c.primaryAlg) look1Primaries++;
      else look1Alternatives++;
    }
  }
  console.log(
    `✓ Invariant 3: ${look1Alternatives} Look-1 OLL alternatives solve the same case as their primary ` +
      `(+${look1Primaries} primaries, identity by construction; y/y'/y2 frame only)`,
  );

  // 4. Look-1 OLL hold descriptions must match the simulated case state.
  //    The U-layer slot order is re-derived from the puzzle definition rather than
  //    written down: hard-coding it once transposed UR and UL, which relabelled
  //    3 o'clock as 9 and made this check agree with a wrong description.
  const U_EDGE_SLOTS = deriveUEdgeSlots(kpuzzle);
  const CLOCK = { UB: '12', UR: '3', UF: '6', UL: '9' };

  /** Clock positions of the already-oriented U edges in a case state. */
  function holdClocksFor(algStr, slots = U_EDGE_SLOTS) {
    const inverse = kpuzzle.algToTransformation(new Alg(algStr)).invert();
    const casePattern = kpuzzle.defaultPattern().applyTransformation(inverse);
    const orientation = casePattern.patternData.EDGES.orientation;
    return slots
      .filter((_, i) => orientation[i] === 0)
      .map(slot => CLOCK[slot])
      .sort((a, b) => Number(a) - Number(b));
  }

  function parseClocksFromDescription(description) {
    const match = description.match(/(\d+)\s+and\s+(\d+)\s+o-?'?clock/i);
    if (!match) return null;
    return [match[1], match[2]].sort((a, b) => Number(a) - Number(b));
  }

  // The slot order must be load-bearing. If transposing UR and UL changed no result,
  // this invariant could not have caught the bug it exists to prevent.
  const transposed = [U_EDGE_SLOTS[0], U_EDGE_SLOTS[3], U_EDGE_SLOTS[2], U_EDGE_SLOTS[1]];
  if (
    !look1OllCases.some(
      c => holdClocksFor(c.primaryAlg).join('&') !== holdClocksFor(c.primaryAlg, transposed).join('&'),
    )
  ) {
    throw new Error(
      'Hold invariant is not load-bearing: transposing the U-layer slot table changed no result',
    );
  }

  for (const c of look1OllCases) {
    const expectedClocks = holdClocksFor(c.primaryAlg);
    const descClocks = parseClocksFromDescription(c.description);

    // Fail closed: a case with a nameable two-edge hold must name it.
    if (expectedClocks.length === 2 && !descClocks) {
      throw new Error(
        `Hold description missing for ${c.id}: the case has a two-edge hold at ` +
          `${expectedClocks.join(' & ')} o-clock but the description states no clock positions`,
      );
    }
    if (descClocks && descClocks.join('&') !== expectedClocks.join('&')) {
      throw new Error(
        `Hold description mismatch for ${c.id}: description says ${descClocks.join(' & ')} o-clock ` +
          `but simulation gives ${expectedClocks.join(' & ')} o-clock`,
      );
    }
  }
  console.log(
    `✓ Invariant 4: ${look1OllCases.length} Look-1 OLL hold descriptions match simulation ` +
      `(U-layer slot order re-derived: ${U_EDGE_SLOTS.join(', ')})`,
  );

  // 5. Probability convention: each 2-look sub-step's case probabilities plus its
  //    implicit skip must sum to 1 (issue #19). The older "each deck sums to 1" rule
  //    did not discriminate — 2-look PLL sums to 23/12 for the unrelated structural
  //    reason that corners and edges are separate stages, and 4/5 + 1/5 = 1 passed
  //    while the corner values used a different convention from the edges.
  function parseFraction(value, id) {
    const match = /^(\d+)\/(\d+)$/.exec(String(value).trim());
    if (!match) {
      throw new Error(`Probability invariant failure: ${id} has unparseable probability "${value}"`);
    }
    return [Number(match[1]), Number(match[2])];
  }

  /** Exact rational sum, so 1/3 + 1/3 + 1/6 + 1/12 is not a floating-point near-miss. */
  function sumFractions(pairs) {
    let num = 0;
    let den = 1;
    for (const [n, d] of pairs) {
      num = num * d + n * den;
      den *= d;
    }
    return [num, den];
  }

  const SUB_STEPS = [
    { label: 'OLL edges (Look 1)', cases: oll2Look, group: 'Edges (Look 1)' },
    { label: 'OLL corners (Look 2)', cases: oll2Look, group: 'Corners (Look 2)' },
    { label: 'PLL corners (Look 1)', cases: pll2Look, group: 'Corners (Look 1)' },
    { label: 'PLL edges (Look 2)', cases: pll2Look, group: 'Edges (Look 2)' },
  ];

  for (const { label, cases, group } of SUB_STEPS) {
    const members = cases.filter(c => c.group === group);
    if (members.length === 0) {
      throw new Error(`Probability invariant failure: no cases found for sub-step "${label}"`);
    }

    const [num, den] = sumFractions(members.map(c => parseFraction(c.probability, c.id)));
    if (num > den) {
      throw new Error(
        `Probability invariant failure: ${label} case probabilities sum to ${num}/${den}, which exceeds 1`,
      );
    }

    // The remainder is the skip probability. It must be strictly positive: every
    // 2-look sub-step can be skipped, so a sub-step summing to exactly 1 means the
    // values are conditioned on no skip — the mismatch #19 was filed for.
    if (num === den) {
      throw new Error(
        `Probability invariant failure: ${label} case probabilities sum to exactly 1, ` +
          'leaving no skip probability. 2-look values must be unconditional, not conditioned on no skip.',
      );
    }
  }

  const SUB_STEP_SUMMARY = SUB_STEPS.map(({ label, cases, group }) => {
    const members = cases.filter(c => c.group === group);
    const [num, den] = sumFractions(members.map(c => parseFraction(c.probability, c.id)));
    const skipNum = den - num;
    const divisor = (a, b) => (b === 0 ? a : divisor(b, a % b));
    const g = divisor(skipNum, den) || 1;
    return `${label} + ${skipNum / g}/${den / g} skip`;
  }).join('; ');
  console.log(`✓ Invariant 5: every 2-look sub-step plus its skip sums to 1 — ${SUB_STEP_SUMMARY}`);

  // Guard retained from the original AC: no case may display a probability whose
  // denominator belongs to another deck, which is how full-PLL values leaked before.
  const TWO_LOOK_DENOMINATORS = new Set([4, 8, 12, 27, 3, 6, 2]);
  for (const c of [...oll2Look, ...pll2Look]) {
    const [, den] = parseFraction(c.probability, c.id);
    if (!TWO_LOOK_DENOMINATORS.has(den)) {
      throw new Error(
        `Probability invariant failure: ${c.id} shows "${c.probability}", whose denominator ${den} ` +
          'does not belong to a 2-look sub-step',
      );
    }
  }
  console.log('✓ Invariant 6: no 2-look case displays a probability from another deck\'s denominator');

  console.log(`✓ Total algorithm variations parse-simulated: ${totalSimulated}`);
  console.log(
    `✓ Semantic invariants checked on ${invariant1Count + invariant2Count + look1Primaries + look1Alternatives} algorithm variations plus ${look1OllCases.length} hold descriptions (primaries + alternatives, group-scoped)`,
  );
  console.log('--- All verifications and semantic invariant checks passed! ---');
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
