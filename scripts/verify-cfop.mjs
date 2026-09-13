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

  // 3. 2-Look OLL edge-case hold descriptions must match inverse→forward simulation
  //    (cubing.js kpuzzle U-layer slot order: UF=0, UL=1, UB=2, UR=3)
  const U_EDGE_SLOTS = ['UF', 'UL', 'UB', 'UR'];
  const CLOCK = { UF: '6', UL: '9', UB: '12', UR: '3' };

  function orientedUEdgeSlots(pattern) {
    const edges = pattern.patternData.EDGES;
    return U_EDGE_SLOTS.filter((_, i) => edges.orientation[i] === 0);
  }

  function clocksFromSlots(slots) {
    return slots.map(s => CLOCK[s]).sort((a, b) => Number(a) - Number(b));
  }

  function parseClocksFromDescription(description) {
    const match = description.match(/(\d+)\s+and\s+(\d+)\s+o-clock/i);
    if (!match) return null;
    return [match[1], match[2]].sort((a, b) => Number(a) - Number(b));
  }

  for (const c of oll2Look) {
    if (!c.group?.includes('Edges')) continue;

    const inverse = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
    const casePattern = kpuzzle.defaultPattern().applyTransformation(inverse);
    const holdSlots = orientedUEdgeSlots(casePattern);
    const expectedClocks = clocksFromSlots(holdSlots);

    const forward = kpuzzle.algToTransformation(new Alg(c.primaryAlg));
    const afterForward = casePattern.applyTransformation(forward);
    const uEdgesSolved = [0, 1, 2, 3].every(
      i => afterForward.patternData.EDGES.orientation[i] === 0,
    );
    if (!uEdgesSolved) {
      throw new Error(
        `Hold AC failure: primaryAlg for ${c.id} does not orient U edges from inverse hold (${holdSlots.join('+')})`,
      );
    }

    const descClocks = parseClocksFromDescription(c.description);
    if (descClocks && descClocks.join('&') !== expectedClocks.join('&')) {
      throw new Error(
        `Hold description mismatch for ${c.id}: description says ${descClocks.join(' & ')} o-clock but simulation gives ${expectedClocks.join(' & ')} o-clock (${holdSlots.join('+')})`,
      );
    }
  }
  console.log('✓ Invariant 3: 2-Look OLL edge-case hold descriptions match inverse→forward simulation');

  console.log(`✓ Total algorithm variations successfully simulated: ${totalSimulated}`);
  console.log('--- All verifications and semantic invariant checks passed! ---');
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
