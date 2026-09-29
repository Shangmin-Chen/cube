import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/** Look-1 keeps U on top — only y-axis whole-cube turns are valid frame changes. */
const LOOK1_Y_ROTATIONS = ["y'", 'y', 'y2'];
const TOP_EDGE_INDICES = [0, 1, 2, 3];

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
 * Asserts that an algorithm transformation leaves the bottom two layers (F2L) completely intact:
 * Corners 4..7 and Edges 4..11 must have identity permutation and 0 orientation delta.
 *
 * @param {import('cubing/puzzles').KTransformation} transf
 * @returns {boolean}
 */
function f2lIsIntact(transf) {
  const cp = transf.transformationData.CORNERS.permutation.slice(4);
  const co = transf.transformationData.CORNERS.orientationDelta.slice(4);
  const ep = transf.transformationData.EDGES.permutation.slice(4);
  const eo = transf.transformationData.EDGES.orientationDelta.slice(4);

  return (
    cp.every((val, idx) => val === idx + 4) &&
    co.every(val => val === 0) &&
    ep.every((val, idx) => val === idx + 4) &&
    eo.every(val => val === 0)
  );
}

/**
 * Asserts that a cube pattern has the bottom two layers (F2L) completely intact:
 * Corners 4..7 and Edges 4..11 must be in solved piece positions with orientation 0.
 *
 * @param {import('cubing/puzzles').KPattern} pattern
 * @returns {boolean}
 */
function patternF2LIsIntact(pattern) {
  const cp = pattern.patternData.CORNERS.pieces.slice(4);
  const co = pattern.patternData.CORNERS.orientation.slice(4);
  const ep = pattern.patternData.EDGES.pieces.slice(4);
  const eo = pattern.patternData.EDGES.orientation.slice(4);

  return (
    cp.every((val, idx) => val === idx + 4) &&
    co.every(val => val === 0) &&
    ep.every((val, idx) => val === idx + 4) &&
    eo.every(val => val === 0)
  );
}

/**
 * Asserts whether an algorithm executes a diagonal corner swap (modulo AUF).
 *
 * @param {any} kpuzzle
 * @param {string} algStr
 * @returns {boolean}
 */
function isDiagonalCornerSwap(kpuzzle, algStr) {
  for (const auf of ['', 'U', 'U2', "U'"]) {
    const transf = kpuzzle.algToTransformation(new Alg(algStr + (auf ? ' ' + auf : '')));
    const cp = transf.transformationData.CORNERS.permutation.slice(0, 4);
    const movedCorners = [0, 1, 2, 3].filter(i => cp[i] !== i);
    if (movedCorners.length === 2 && Math.abs(movedCorners[0] - cp[movedCorners[0]]) === 2) {
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
 * @param {object[]} oll2Look
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
 * Negative controls for OLL & PLL invariants:
 * 1. Look-1 alg (flips edges) on Look-2 corner case (fails edge preservation & corner solve).
 * 2. PLL alg (T-perm) on Look-2 corner case (fails corner orientation delta & corner solve).
 * 3. PLL alg (T-perm) inverted setup (fails Full OLL misorientation check).
 * 4. PLL alg (T-perm) on Full OLL 1 case (fails Full OLL orientation solve).
 * 5. T-perm on PLL diagonal swap (fails diagonal corner swap check).
 *
 * @param {any} kpuzzle
 * @param {object[]} oll2Look
 * @param {object[]} allPllCases
 * @param {object[]} ollFull
 */
function assertOllAndPllNegativeControls(kpuzzle, oll2Look, allPllCases, ollFull) {
  const defPattern = kpuzzle.defaultPattern();
  const suneCase = oll2Look.find(c => c.id === 'oll-2look-sune');
  const suneCaseTransf = kpuzzle.algToTransformation(new Alg(suneCase.primaryAlg)).invert();
  const suneCasePattern = defPattern.applyTransformation(suneCaseTransf);

  const lineCase = oll2Look.find(c => c.id === 'oll-2look-line');
  const lineTransf = kpuzzle.algToTransformation(new Alg(lineCase.primaryAlg));

  const tCase = allPllCases.find(c => c.id === 'pll-2look-tperm' || c.id === 'pll-t');
  const tTransf = kpuzzle.algToTransformation(new Alg(tCase.primaryAlg));

  // Control 1: Look-1 line alg on Look-2 Sune case
  const linePreservesEdges = lineTransf.transformationData.EDGES.orientationDelta.slice(0, 4).every(v => v === 0);
  if (linePreservesEdges) {
    throw new Error('Look-2 negative control failed: Look-1 line alg unexpectedly preserved top edge orientations');
  }
  const lineRes = suneCasePattern.applyTransformation(lineTransf);
  let lineOrientsCorners = false;
  for (const y of ['', "y'", 'y', 'y2']) {
    const p = y ? lineRes.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : lineRes;
    if (p.patternData.CORNERS.orientation.slice(0, 4).every(v => v === 0)) {
      lineOrientsCorners = true;
      break;
    }
  }
  if (lineOrientsCorners) {
    throw new Error('Look-2 negative control failed: Look-1 line alg unexpectedly oriented Sune corners');
  }

  // Control 2: PLL T-perm on Look-2 Sune case
  const tChangesCorners = tTransf.transformationData.CORNERS.orientationDelta.slice(0, 4).some(v => v !== 0);
  if (tChangesCorners) {
    throw new Error('Look-2 negative control failed: T-perm unexpectedly changed corner orientation');
  }
  const tRes = suneCasePattern.applyTransformation(tTransf);
  let tOrientsCorners = false;
  for (const y of ['', "y'", 'y', 'y2']) {
    const p = y ? tRes.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : tRes;
    if (p.patternData.CORNERS.orientation.slice(0, 4).every(v => v === 0)) {
      tOrientsCorners = true;
      break;
    }
  }
  if (tOrientsCorners) {
    throw new Error('Look-2 negative control failed: T-perm unexpectedly oriented Sune corners');
  }

  // Control 3: T-perm setup has no misoriented pieces (cannot be a Full OLL case)
  const tCasePattern = defPattern.applyTransformation(tTransf.invert());
  const tMisoriented =
    tCasePattern.patternData.EDGES.orientation.slice(0, 4).some(v => v !== 0) ||
    tCasePattern.patternData.CORNERS.orientation.slice(0, 4).some(v => v !== 0);
  if (tMisoriented) {
    throw new Error('Full OLL negative control failed: T-perm setup unexpectedly had misoriented top pieces');
  }

  // Control 4: T-perm on Full OLL 1 casePattern must fail full orientation solve
  const oll1Case = ollFull.find(c => c.id === 'oll-1');
  if (!oll1Case) {
    throw new Error('Missing expected OLL case: oll-1');
  }
  const oll1Transf = kpuzzle.algToTransformation(new Alg(oll1Case.primaryAlg)).invert();
  const oll1CasePattern = defPattern.applyTransformation(oll1Transf);
  const oll1Res = oll1CasePattern.applyTransformation(tTransf);
  let oll1Oriented = false;
  for (const y of ['', "y'", 'y', 'y2']) {
    const pattern = y ? oll1Res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : oll1Res;
    const cOri = pattern.patternData.CORNERS.orientation.slice(0, 4);
    const eOri = pattern.patternData.EDGES.orientation.slice(0, 4);
    if (cOri.every(v => v === 0) && eOri.every(v => v === 0)) {
      oll1Oriented = true;
      break;
    }
  }
  if (oll1Oriented) {
    throw new Error('Full OLL negative control failed: T-perm unexpectedly oriented all top pieces for OLL 1');
  }

  // Control 5: T-perm on diagonal corner swap
  if (isDiagonalCornerSwap(kpuzzle, tCase.primaryAlg)) {
    throw new Error('PLL diagonal negative control failed: T-perm unexpectedly passed diagonal corner swap check');
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

  // OLL & PLL negative controls
  assertOllAndPllNegativeControls(kpuzzle, oll2Look, allPllCases, ollFull);
  console.log('✓ OLL & PLL negative controls: cross-case and wrong-family algorithms correctly rejected');

  // OLL F2L Invariant: every OLL algorithm (all 10 2-Look and 57 Full OLL cases) leaves F2L intact
  const allOllCases = [...oll2Look, ...ollFull];
  let ollF2lCount = 0;
  for (const c of allOllCases) {
    for (const alg of getAllAlgs(c)) {
      const transf = kpuzzle.algToTransformation(new Alg(alg));
      if (!f2lIsIntact(transf)) {
        throw new Error(`Semantic invariant failure: F2L not intact for OLL case ${c.id} (${alg})`);
      }
      ollF2lCount++;
    }
  }
  console.log(`✓ OLL F2L Invariant: ${ollF2lCount} OLL algorithm variations leave bottom two layers (F2L) intact`);

  // 7. Look-2 OLL (Corners): algorithms must orient all top-layer corners while preserving top edges and F2L.
  //    Note on test discrimination: Because casePattern is constructed by inverting primaryAlg,
  //    the primary algorithm returns to solved by construction (X^-1 * X = I).
  //    Therefore, the case-state setup checks (exact corner orientation counts) together with
  //    testing alternative algorithms against casePattern and running negative controls are
  //    what provide load-bearing semantic discrimination for case identity.
  const look2OllCases = oll2Look.filter(c => c.group === 'Corners (Look 2)');
  let invariant7Count = 0;
  for (const c of look2OllCases) {
    const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
    const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);

    // 1. Verify inverted case state: top edges oriented, top corners misoriented
    const caseTopEdgesOriented = casePattern.patternData.EDGES.orientation.slice(0, 4).every(v => v === 0);
    const caseTopCornersMisoriented = casePattern.patternData.CORNERS.orientation.slice(0, 4).some(v => v !== 0);

    if (!caseTopEdgesOriented) {
      throw new Error(`Semantic invariant failure: Look-2 OLL case ${c.id} setup does not have top edges oriented`);
    }
    if (!caseTopCornersMisoriented) {
      throw new Error(`Semantic invariant failure: Look-2 OLL case ${c.id} setup does not have misoriented corners`);
    }

    const orientedCornerCount = casePattern.patternData.CORNERS.orientation.slice(0, 4).filter(v => v === 0).length;
    if (c.id === 'oll-2look-sune' || c.id === 'oll-2look-antisune') {
      if (orientedCornerCount !== 1) {
        throw new Error(
          `Semantic invariant failure: Look-2 OLL case ${c.id} setup expected exactly 1 oriented corner, found ${orientedCornerCount}`,
        );
      }
    } else if (c.id === 'oll-2look-h' || c.id === 'oll-2look-pi') {
      if (orientedCornerCount !== 0) {
        throw new Error(
          `Semantic invariant failure: Look-2 OLL case ${c.id} setup expected exactly 0 oriented corners, found ${orientedCornerCount}`,
        );
      }
    } else if (
      c.id === 'oll-2look-headlights' ||
      c.id === 'oll-2look-chameleon' ||
      c.id === 'oll-2look-bowtie'
    ) {
      if (orientedCornerCount !== 2) {
        throw new Error(
          `Semantic invariant failure: Look-2 OLL case ${c.id} setup expected exactly 2 oriented corners, found ${orientedCornerCount}`,
        );
      }
    } else {
      throw new Error(`Semantic invariant failure: unrecognized Look-2 OLL case ${c.id}`);
    }

    for (const alg of getAllAlgs(c)) {
      const algTransf = kpuzzle.algToTransformation(new Alg(alg));

      // 2. Verify algorithm properties: preserves top edges, changes top corners, preserves F2L
      const topEdgesPreserved = algTransf.transformationData.EDGES.orientationDelta.slice(0, 4).every(v => v === 0);
      const topCornersChanged = algTransf.transformationData.CORNERS.orientationDelta.slice(0, 4).some(v => v !== 0);

      if (!topEdgesPreserved) {
        throw new Error(`Semantic invariant failure: Look-2 OLL algorithm did not preserve top edge orientations for ${c.id} (${alg})`);
      }
      if (!topCornersChanged) {
        throw new Error(`Semantic invariant failure: Look-2 OLL algorithm did not change corner orientations for ${c.id} (${alg})`);
      }
      if (!f2lIsIntact(algTransf)) {
        throw new Error(`Semantic invariant failure: Look-2 OLL algorithm disturbed F2L for ${c.id} (${alg})`);
      }

      // 3. Verify solving: applying alg to casePattern leaves all top corners oriented (modulo y-rotations) and F2L intact
      const res = casePattern.applyTransformation(algTransf);
      if (!patternF2LIsIntact(res)) {
        throw new Error(`Semantic invariant failure: Look-2 OLL result disturbed F2L for ${c.id} (${alg})`);
      }

      let cornersOriented = false;
      for (const y of ['', "y'", 'y', 'y2']) {
        const pattern = y ? res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : res;
        const cOri = pattern.patternData.CORNERS.orientation.slice(0, 4);
        if (cOri.every(v => v === 0)) {
          cornersOriented = true;
          break;
        }
      }

      if (!cornersOriented) {
        throw new Error(`Semantic invariant failure: Look-2 OLL algorithm did not orient top corners for ${c.id} (${alg})`);
      }
      invariant7Count++;
    }
  }
  console.log(`✓ Invariant 7: ${invariant7Count} Look-2 OLL corner algorithm variations orient all top corners (edges preserved, F2L intact)`);

  // 8. Full OLL: algorithms must orient both top corners and top edges while preserving F2L.
  //    Note on test discrimination: Since casePattern is defined as invert(primaryAlg),
  //    the primary algorithm solves casePattern by construction (tautology on identity).
  //    Load-bearing discrimination is provided by case-state setup checks (e.g. Dot vs Cross
  //    edge orientation counts), alternative algorithm verification, and negative controls.
  const dotCaseIds = new Set(['oll-1', 'oll-2', 'oll-3', 'oll-4']);
  const crossCaseIds = new Set([
    'oll-21',
    'oll-22',
    'oll-23',
    'oll-24',
    'oll-25',
    'oll-26',
    'oll-27',
  ]);
  let invariant8Count = 0;
  for (const c of ollFull) {
    const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
    const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);

    // 1. Verify inverted case state: at least one top piece is misoriented
    const topMisoriented =
      casePattern.patternData.EDGES.orientation.slice(0, 4).some(v => v !== 0) ||
      casePattern.patternData.CORNERS.orientation.slice(0, 4).some(v => v !== 0);

    if (!topMisoriented) {
      throw new Error(`Semantic invariant failure: Full OLL case ${c.id} setup has no misoriented top pieces`);
    }

    const orientedEdgeCount = casePattern.patternData.EDGES.orientation.slice(0, 4).filter(v => v === 0).length;
    if (dotCaseIds.has(c.id) && orientedEdgeCount !== 0) {
      throw new Error(
        `Semantic invariant failure: Full OLL Dot case ${c.id} setup expected 0 oriented top edges, found ${orientedEdgeCount}`,
      );
    }
    if (crossCaseIds.has(c.id) && orientedEdgeCount !== 4) {
      throw new Error(
        `Semantic invariant failure: Full OLL Cross case ${c.id} setup expected 4 oriented top edges, found ${orientedEdgeCount}`,
      );
    }

    for (const alg of getAllAlgs(c)) {
      const algTransf = kpuzzle.algToTransformation(new Alg(alg));

      if (!f2lIsIntact(algTransf)) {
        throw new Error(`Semantic invariant failure: Full OLL algorithm disturbed F2L for ${c.id} (${alg})`);
      }

      const res = casePattern.applyTransformation(algTransf);
      if (!patternF2LIsIntact(res)) {
        throw new Error(`Semantic invariant failure: Full OLL result disturbed F2L for ${c.id} (${alg})`);
      }

      let fullyOriented = false;
      for (const y of ['', "y'", 'y', 'y2']) {
        const pattern = y ? res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : res;
        const cOri = pattern.patternData.CORNERS.orientation.slice(0, 4);
        const eOri = pattern.patternData.EDGES.orientation.slice(0, 4);
        if (cOri.every(v => v === 0) && eOri.every(v => v === 0)) {
          fullyOriented = true;
          break;
        }
      }

      if (!fullyOriented) {
        throw new Error(`Semantic invariant failure: Full OLL algorithm did not orient all top corners/edges for ${c.id} (${alg})`);
      }
      invariant8Count++;
    }
  }
  console.log(`✓ Invariant 8: ${invariant8Count} Full OLL algorithm variations orient all top corners and edges (F2L intact)`);

  // 9. PLL Case Identity: Diagonal Corner Swap algorithms must swap diagonal corners
  const diagonalPllIds = ['pll-y', 'pll-v', 'pll-na', 'pll-nb', 'pll-2look-yperm'];
  let invariant9Count = 0;
  for (const id of diagonalPllIds) {
    const c = allPllCases.find(item => item.id === id);
    if (!c) throw new Error(`Missing expected diagonal corner swap PLL case: ${id}`);
    for (const alg of getAllAlgs(c)) {
      if (!isDiagonalCornerSwap(kpuzzle, alg)) {
        throw new Error(
          `Semantic invariant failure: PLL ${id} algorithm (${alg}) does not perform a diagonal corner swap`,
        );
      }
      invariant9Count++;
    }
  }
  console.log(`✓ Invariant 9: ${invariant9Count} diagonal PLL algorithms verify diagonal corner swap permutation`);

  console.log(`✓ Total algorithm variations parse-simulated: ${totalSimulated}`);
  console.log(
    `✓ Semantic invariants checked on ${invariant1Count + invariant2Count + look1Primaries + look1Alternatives + ollF2lCount + invariant7Count + invariant8Count + invariant9Count} algorithm variations plus ${look1OllCases.length} hold descriptions (primaries + alternatives, group-scoped)`,
  );
  console.log(
    '--- All verifications passed (parse-sim + semantic invariants: PLL centers/corners/diagonal, OLL F2L/edges/corners, probability sums) ---',
  );
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
