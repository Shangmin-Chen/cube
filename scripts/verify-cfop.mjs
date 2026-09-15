import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

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
      const parsed = new Alg(c.primaryAlg);
      kpuzzle.algToTransformation(parsed);
      totalSimulated++;
      for (const alt of c.alternativeAlgs || []) {
        const altParsed = new Alg(alt);
        kpuzzle.algToTransformation(altParsed);
        totalSimulated++;
      }
    }
    console.log(`✓ Validated all algorithms in ${set.name}`);
  }

  // --- Semantic Invariant Tests (Finding 3) ---
  console.log('--- Running Semantic Invariant Tests ---');
  const allPllCases = [...pll2Look, ...pllFull];

  // 1. Centers identity invariant for all PLL primary algorithms
  for (const c of allPllCases) {
    const transf = kpuzzle.algToTransformation(new Alg(c.primaryAlg));
    const centers = transf.transformationData.CENTERS.permutation;
    const isCentersIdentity = centers.every((val, idx) => val === idx);
    if (!isCentersIdentity) {
      throw new Error(`Semantic invariant failure: CENTERS not identity for ${c.id} (${c.primaryAlg}). Got: ${JSON.stringify(centers)}`);
    }
  }
  console.log('✓ Invariant 1: All PLL algorithms preserve CENTERS permutation [0, 1, 2, 3, 4, 5]');

  // 2. Edges-Only PLLs: corners must be strictly identity permutation and zero orientation
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

  for (const id of edgesOnlyIds) {
    const c = allPllCases.find(item => item.id === id);
    if (!c) throw new Error(`Missing expected edges-only PLL case: ${id}`);
    const transf = kpuzzle.algToTransformation(new Alg(c.primaryAlg));
    const cornersPerm = transf.transformationData.CORNERS.permutation;
    const cornersOri = transf.transformationData.CORNERS.orientationDelta;

    const isCornersIdentity = cornersPerm.every((val, idx) => val === idx);
    const isCornersOriZero = cornersOri.every(val => val === 0);

    if (!isCornersIdentity) {
      throw new Error(`Semantic invariant failure: CORNERS permutation not identity for ${id} (${c.primaryAlg}). Got: ${JSON.stringify(cornersPerm)}`);
    }
    if (!isCornersOriZero) {
      throw new Error(`Semantic invariant failure: CORNERS orientation not all 0 for ${id} (${c.primaryAlg}). Got: ${JSON.stringify(cornersOri)}`);
    }
  }
  console.log('✓ Invariant 2: Edges-Only PLLs leave all CORNERS in identity permutation and 0 orientation delta');

  // 3. 2-Look OLL Look-1 hold descriptions must match inverse-case simulation.
  //
  //    The U-layer slot order is re-derived from the puzzle definition rather than
  //    written down: an earlier version of this check transposed UR and UL, which
  //    silently relabelled 3 o'clock as 9 and made the whole invariant agree with a
  //    wrong description.
  const U_EDGE_SLOTS = deriveUEdgeSlots(kpuzzle);
  const CLOCK = { UB: '12', UR: '3', UF: '6', UL: '9' };

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

  const look1Oll = oll2Look.filter(c => c.group?.includes('Edges'));

  // Negative control: the slot order must be load-bearing. If transposing UR and UL
  // did not change any answer, this invariant could not have caught the original bug.
  const transposed = [U_EDGE_SLOTS[0], U_EDGE_SLOTS[3], U_EDGE_SLOTS[2], U_EDGE_SLOTS[1]];
  const transposeChangesSomething = look1Oll.some(
    c => holdClocksFor(c.primaryAlg).join('&') !== holdClocksFor(c.primaryAlg, transposed).join('&'),
  );
  if (!transposeChangesSomething) {
    throw new Error(
      'Hold invariant is not load-bearing: transposing the U-layer slot table changed no result',
    );
  }

  for (const c of look1Oll) {
    const expectedClocks = holdClocksFor(c.primaryAlg);
    const descClocks = parseClocksFromDescription(c.description);

    // Fail closed: a case with a nameable two-edge hold must name it. Previously a
    // description that simply omitted the clock pair was skipped silently.
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
    `✓ Invariant 3: ${look1Oll.length} Look-1 OLL hold descriptions match simulation ` +
      `(U-layer slot order re-derived: ${U_EDGE_SLOTS.join(', ')})`,
  );

  console.log(`✓ Total algorithm variations successfully simulated: ${totalSimulated}`);
  console.log('--- All verifications and semantic invariant checks passed! ---');
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
