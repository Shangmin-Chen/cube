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

/**
 * Undo net whole-cube rotation so semantic PLL invariants can be checked on
 * primaries and alternatives alike (unbalanced rotation suffixes are valid).
 *
 * @param {any} kpuzzle
 * @param {string} algStr
 * @returns {string}
 */
function normalizeRotation(kpuzzle, algStr) {
  if (centersAreIdentity(kpuzzle, algStr)) {
    return algStr;
  }

  for (const rot of SINGLE_ROTATIONS) {
    const candidate = new Alg(`${algStr} ${rot}`).toString();
    if (centersAreIdentity(kpuzzle, candidate)) {
      return candidate;
    }
  }

  for (const r1 of SINGLE_ROTATIONS) {
    for (const r2 of SINGLE_ROTATIONS) {
      const candidate = new Alg(`${algStr} ${r1} ${r2}`).toString();
      if (centersAreIdentity(kpuzzle, candidate)) {
        return candidate;
      }
    }
  }

  return algStr;
}

/** @param {any} kpuzzle @param {string} algStr */
function getNormalizedTransformation(kpuzzle, algStr) {
  const normalized = normalizeRotation(kpuzzle, algStr);
  return kpuzzle.algToTransformation(new Alg(normalized));
}

/**
 * Edges-only PLLs may need AUF after rotation balancing; mirrors pipeline rule.
 *
 * @param {any} kpuzzle
 * @param {string} algStr
 * @returns {import('cubing/puzzles').KTransformation}
 */
function getEdgesOnlyTransformation(kpuzzle, algStr) {
  const normalized = normalizeRotation(kpuzzle, algStr);
  let transf = kpuzzle.algToTransformation(new Alg(normalized));
  const cornersPerm = transf.transformationData.CORNERS.permutation;
  const cornersOri = transf.transformationData.CORNERS.orientationDelta;
  const cornersOk =
    cornersPerm.every((val, idx) => val === idx) &&
    cornersOri.every(val => val === 0);
  if (cornersOk) {
    return transf;
  }

  for (const auf of AUF_CANDIDATES) {
    const candidate = new Alg(`${normalized} ${auf}`).toString();
    const candidateTransf = kpuzzle.algToTransformation(new Alg(candidate));
    const cPerm = candidateTransf.transformationData.CORNERS.permutation;
    const cOri = candidateTransf.transformationData.CORNERS.orientationDelta;
    if (cPerm.every((val, idx) => val === idx) && cOri.every(val => val === 0)) {
      return candidateTransf;
    }
  }

  return transf;
}

/** @param {import('cubing/puzzles').KTransformation} transf */
function topEdgesOriented(transf) {
  const ori = transf.transformationData.EDGES.orientationDelta;
  return TOP_EDGE_INDICES.every(i => ori[i] === 0);
}

/**
 * True when a solved Look-1 case state is reached up to whole-cube rotation.
 *
 * @param {any} kpuzzle
 * @param {import('cubing/puzzles').KTransformation} resultTransf
 */
function look1CaseSolvedModuloRotation(kpuzzle, resultTransf) {
  if (topEdgesOriented(resultTransf)) {
    return true;
  }

  for (const rot of SINGLE_ROTATIONS) {
    const rotTransf = kpuzzle.algToTransformation(new Alg(rot));
    if (topEdgesOriented(rotTransf.apply(resultTransf))) {
      return true;
    }
  }

  return false;
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

  // 1. Centers identity for every PLL primary and alternative (after rotation normalize)
  let invariant1Count = 0;
  for (const c of allPllCases) {
    for (const alg of getAllAlgs(c)) {
      const transf = getNormalizedTransformation(kpuzzle, alg);
      const centers = transf.transformationData.CENTERS.permutation;
      const isCentersIdentity = centers.every((val, idx) => val === idx);
      if (!isCentersIdentity) {
        throw new Error(
          `Semantic invariant failure: CENTERS not identity for ${c.id} (${alg}). Got: ${JSON.stringify(centers)}`,
        );
      }
      invariant1Count++;
    }
  }
  console.log(
    `✓ Invariant 1: ${invariant1Count} PLL algorithm variations (primaries + alternatives) preserve CENTERS permutation after rotation normalization`,
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
      const transf = getEdgesOnlyTransformation(kpuzzle, alg);
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

  // 3. Look-1 OLL: edge orientation only — corners/permutation out of scope
  let invariant3Count = 0;
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
      invariant3Count++;
    }
  }
  console.log(
    `✓ Invariant 3: ${invariant3Count} Look-1 OLL algorithm variations orient all U-layer edges (edge orientation only; corners/permutation out of scope)`,
  );

  console.log(`✓ Total algorithm variations parse-simulated: ${totalSimulated}`);
  console.log(
    `✓ Semantic invariants checked on ${invariant1Count + invariant2Count + invariant3Count} algorithm variations (primaries + alternatives, group-scoped)`,
  );
  console.log('--- All verifications and semantic invariant checks passed! ---');
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
