import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { Alg } from 'cubing/alg';
import { puzzles } from 'cubing/puzzles';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.resolve(ROOT_DIR, 'src/data/generated');

const ENDPOINTS = {
  oll2Look: 'https://jperm.net/lib/2lookoll.js',
  pll2Look: 'https://jperm.net/lib/2lookpll.js',
  ollFull: 'https://jperm.net/lib/oll.js',
  pllFull: 'https://jperm.net/lib/pll.js',
};

/**
 * Fetch and extract algsetAlgs array from a J Perm remote endpoint
 */
async function fetchAlgset(url) {
  console.log(`Fetching from ${url}...`);
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const code = await res.text();
  const context = { window: {}, document: {}, Math, Array, Object, String, Number };
  vm.createContext(context);
  vm.runInContext(code, context);

  if (!Array.isArray(context.algsetAlgs)) {
    throw new Error(`No algsetAlgs array found in ${url}`);
  }

  return {
    algset: context.algset,
    algs: context.algsetAlgs,
  };
}

/**
 * Normalizes an algorithm with WCA spacing using cubing/alg
 */
function normalizeAlg(algStr) {
  try {
    return new Alg(algStr).toString();
  } catch (err) {
    console.warn(`Warning: Could not normalize algorithm "${algStr}": ${err.message}`);
    return algStr.trim();
  }
}

/**
 * Validates algorithm string via cubing/puzzles KPuzzle simulation
 */
function validateAlg(kpuzzle, algStr, caseId) {
  try {
    const parsed = new Alg(algStr);
    kpuzzle.algToTransformation(parsed);
  } catch (err) {
    throw new Error(`Simulation failed for case ${caseId} with alg "${algStr}": ${err.message}`);
  }
}

/**
 * Transform 2-Look OLL dataset (10 cases)
 */
function transform2LookOLL(rawAlgs, kpuzzle) {
  // Mapping table from J Perm names/indices to our standard 2-Look OLL definitions
  const metaMap = {
    'Dot Shape': {
      id: 'oll-2look-dot',
      name: 'Dot (No Edges)',
      group: 'Edges (Look 1)',
      probability: '1/8',
      description: 'Orient all 4 top edge pieces when no edges are oriented.',
      why: "Line trigger F (R U R' U') F' flips 2 edges into an L-shape, then wide f (R U R' U') f' flips the remaining 2 edges into a cross.",
    },
    'I-Shape': {
      id: 'oll-2look-line',
      name: 'Line (Bar)',
      group: 'Edges (Look 1)',
      probability: '2/8',
      description: 'Hold yellow line horizontally (9 and 3 o-clock), then execute.',
      why: "F turns front slot lifting edge stickers up, R U R' U' swaps top layer, and F' closes slot leaving 2 edges flipped.",
    },
    'L-Shape': {
      id: 'oll-2look-lshape',
      name: 'L-Shape (Small L)',
      group: 'Edges (Look 1)',
      probability: '4/8',
      description: 'Hold L at top-left corner (9 and 12 o-clock).',
      why: "Wide f turns two layers simultaneously, flipping adjacent edges instead of opposite edges before f' restores layers.",
    },
    'Sune': {
      id: 'oll-2look-sune',
      name: 'Sune',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '1 yellow corner facing UP at front-left (index 6).',
      why: "R U lifts the FR F2L pair and orbits it 360° around top layer before reinserting with R U2 R', twisting 3 corners by 120°.",
    },
    'Antisune': {
      id: 'oll-2look-antisune',
      name: 'Anti-Sune',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '1 yellow corner facing UP at back-left (index 0).',
      why: "Orbits the F2L pair in reverse direction (360° clockwise), twisting 3 corners opposite to Sune.",
    },
    'H': {
      id: 'oll-2look-h',
      name: 'H Case (Double Sune)',
      group: 'Corners (Look 2)',
      probability: '2/27',
      description: '0 corners facing up. Headlights on left AND right side.',
      why: 'Chaining two Sunes cancels the middle moves and twists all four corners.',
    },
    'Pi': {
      id: 'oll-2look-pi',
      name: 'Pi (Bruno)',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '0 corners facing up. Headlights on left side, back & front right stickers point away.',
      why: 'R U2 R2 slot displacement cycles and twists all four unoriented corners in one fluid motion.',
    },
    'U': {
      id: 'oll-2look-headlights',
      name: 'U Case (Headlights)',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '2 corners facing UP on right. Headlights on left side.',
      why: 'D slice moves isolate bottom layers while pivoting left headlights into top orientation.',
    },
    'T': {
      id: 'oll-2look-chameleon',
      name: 'T Case (Chameleon)',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '2 corners facing UP on right. Front-left & back-left stickers point out.',
      why: "Wide r lift paired with F R F' slot insert rotates corner stickers into top face.",
    },
    'L': {
      id: 'oll-2look-bowtie',
      name: 'L Case (Bowtie)',
      group: 'Corners (Look 2)',
      probability: '4/27',
      description: '2 corners facing UP diagonally. Front-left sticker faces FRONT.',
      why: "F R' F' sets up corner stickers, then wide r slice turn rotates diagonal stickers into top face.",
    },
  };

  const cases = [];

  for (const item of rawAlgs) {
    const rawName = String(item.name).trim();
    const meta = metaMap[rawName] || {
      id: `oll-2look-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: rawName,
      group: item.group?.includes('Edges') ? 'Edges (Look 1)' : 'Corners (Look 2)',
      probability: '1/4',
      description: `2-Look OLL ${rawName}`,
      why: `Orient ${item.group?.includes('Edges') ? 'edges' : 'corners'} into solved orientation.`,
    };

    const primaryAlg = normalizeAlg(item.alg[0]);
    validateAlg(kpuzzle, primaryAlg, meta.id);

    const alternativeAlgs = (item.alg.slice(1) || []).map(algStr => {
      const norm = normalizeAlg(algStr);
      validateAlg(kpuzzle, norm, meta.id);
      return norm;
    });

    cases.push({
      id: meta.id,
      name: meta.name,
      category: 'oll',
      subcategory: '2-Look OLL',
      group: meta.group,
      primaryAlg,
      alternativeAlgs,
      probability: meta.probability,
      description: meta.description,
      why: meta.why,
      is2Look: true,
    });
  }

  // Sort logically: Edges (Look 1) first (Dot, Line, L-Shape), then Corners (Look 2)
  const idOrder = [
    'oll-2look-dot',
    'oll-2look-line',
    'oll-2look-lshape',
    'oll-2look-sune',
    'oll-2look-antisune',
    'oll-2look-h',
    'oll-2look-pi',
    'oll-2look-headlights',
    'oll-2look-chameleon',
    'oll-2look-bowtie',
  ];

  cases.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));

  return cases;
}

/**
 * Transform 2-Look PLL dataset (6 cases)
 */
function transform2LookPLL(rawAlgs, kpuzzle) {
  const metaMap = {
    'Headlights': {
      id: 'pll-2look-tperm',
      name: 'Headlights (T Permutation)',
      group: 'Corners (Look 1)',
      probability: '4/5',
      description: 'Swaps 2 right corners & 2 edges. Headlights on left.',
      why: "Pops out two F2L pairs (R U R' U'), swaps right 2 corners and 2 edges, then restores both F2L pairs.",
    },
    'Diagonal': {
      id: 'pll-2look-yperm',
      name: 'Diagonal (Y Permutation)',
      group: 'Corners (Look 1)',
      probability: '1/5',
      description: 'Swaps diagonal corners when no headlights exist.',
      why: "Combines an edge setup trigger F (R U R' U') F' with a corner swap insert to resolve diagonal corner misalignment.",
    },
    'PLL (H)': {
      id: 'pll-2look-hperm',
      name: 'H Permutation',
      group: 'Edges (Look 2)',
      probability: '1/12',
      description: 'Swaps opposite edge pairs (Front/Back & Left/Right).',
      why: 'M2 swaps opposite edge pairs across middle slice, U aligns top layer, and M2 U M2 restores F2L.',
    },
    'PLL (Z)': {
      id: 'pll-2look-zperm',
      name: 'Z Permutation',
      group: 'Edges (Look 2)',
      probability: '1/6',
      description: 'Swaps adjacent edge pairs (Front/Right & Back/Left).',
      why: "M' slice moves isolate adjacent edge pairs, cycling them in an X-pattern without disturbing corners.",
    },
    'PLL (Ua)': {
      id: 'pll-2look-ua',
      name: 'Ua Permutation',
      group: 'Edges (Look 2)',
      probability: '1/3',
      description: 'Cycles 3 edges counter-clockwise. Back side solved.',
      why: "R U' lifts right F2L pair, cycles 3 top edges through right slot, and R' U' R2 re-locks F2L.",
    },
    'PLL (Ub)': {
      id: 'pll-2look-ub',
      name: 'Ub Permutation',
      group: 'Edges (Look 2)',
      probability: '1/3',
      description: 'Cycles 3 edges clockwise. Back side solved.',
      why: 'Clockwise mirror of Ua perm, cycling 3 edges through right slot in reverse.',
    },
  };

  const cases = [];

  for (const item of rawAlgs) {
    const rawName = String(item.name).trim();
    const meta = metaMap[rawName] || {
      id: `pll-2look-${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: rawName,
      group: item.group?.includes('Corners') ? 'Corners (Look 1)' : 'Edges (Look 2)',
      probability: '1/4',
      description: `2-Look PLL ${rawName}`,
      why: `Permute ${item.group?.includes('Corners') ? 'corners' : 'edges'} into solved position.`,
    };

    const primaryAlg = normalizeAlg(item.alg[0]);
    validateAlg(kpuzzle, primaryAlg, meta.id);

    const alternativeAlgs = (item.alg.slice(1) || []).map(algStr => {
      const norm = normalizeAlg(algStr);
      validateAlg(kpuzzle, norm, meta.id);
      return norm;
    });

    cases.push({
      id: meta.id,
      name: meta.name,
      category: 'pll',
      subcategory: '2-Look PLL',
      group: meta.group,
      primaryAlg,
      alternativeAlgs,
      probability: meta.probability,
      description: meta.description,
      why: meta.why,
      is2Look: true,
    });
  }

  // Logical order: Corners (Look 1) first, then Edges (Look 2)
  const idOrder = [
    'pll-2look-tperm',
    'pll-2look-yperm',
    'pll-2look-ua',
    'pll-2look-ub',
    'pll-2look-hperm',
    'pll-2look-zperm',
  ];
  cases.sort((a, b) => idOrder.indexOf(a.id) - idOrder.indexOf(b.id));

  return cases;
}

/**
 * Group descriptions for Full OLL
 */
const OLL_GROUP_EXPLANATIONS = {
  'Dot': 'Zero edges oriented. Uses wide turns or chained F-triggers to create an edge cross.',
  'Cross': 'Yellow cross already completed. Solves corner orientations in a single look.',
  'Square Shape': '2x2 yellow block. Uses wide l/r turns to pair and orient adjacent edge stickers.',
  'Small Lightning Bolt': 'Lightning silhouette. Uses Sune-derived triggers to pivot misoriented corners.',
  'Big Lightning Bolt': 'Extended lightning pattern. Uses wide insertions to rotate the last layer stickers.',
  'Fish Shape': 'Fish-like pattern. Uses corner-edge pairing triggers to complete the yellow face.',
  'Knight Move Shape': 'Knight move geometry. Uses paired front and right triggers to orient corners.',
  'Awkward Shape': 'Asymmetric yellow pattern. Uses multi-trigger sequences to cancel opposing twists.',
  'P Shape': 'P-block pattern. Uses F-trigger setups into sexy or inverse sexy moves.',
  'T Shape': 'T-shaped yellow pattern. Uses standard sexy moves combined with sledgehammer inserts.',
  'C Shape': 'C-shaped perimeter. Uses paired slot inserts to complete top orientation.',
  'W Shape': 'W-shaped yellow pattern. Uses mirrored trigger pairs to twist outer corners.',
  'Small L Shape': 'Small L edge cluster. Uses commutator-based edge flips and corner twists.',
  'I Shape': 'Line/bar pattern. Uses chained F-triggers to flip remaining edges into place.',
  'Corners Oriented': 'All four corners already yellow. Flips edges using M-slice and F-trigger commutators.',
};

/**
 * Transform Full OLL dataset (57 cases)
 */
function transformFullOLL(rawAlgs, kpuzzle) {
  const cases = [];

  for (const item of rawAlgs) {
    const caseNum = Number(item.name);
    const id = `oll-${caseNum}`;
    const name = `OLL ${caseNum}`;
    const group = item.group || 'Full OLL';

    // Probability: prob 4 -> 4/216 = 1/54, prob 2 -> 2/216 = 1/108, prob 1 -> 1/216
    const probStr = item.prob === 4 ? '1/54' : item.prob === 2 ? '1/108' : '1/216';

    const primaryAlg = normalizeAlg(item.alg[0]);
    validateAlg(kpuzzle, primaryAlg, id);

    const alternativeAlgs = (item.alg.slice(1) || []).map(algStr => {
      const norm = normalizeAlg(algStr);
      validateAlg(kpuzzle, norm, id);
      return norm;
    });

    const description = `OLL Case ${caseNum} (${group} group).`;
    const why = OLL_GROUP_EXPLANATIONS[group] || `Full OLL ${group} case. Orients all top layer yellow stickers.`;

    cases.push({
      id,
      name,
      category: 'oll',
      subcategory: 'Full OLL',
      group,
      primaryAlg,
      alternativeAlgs,
      probability: probStr,
      description,
      why,
    });
  }

  // Sort by case number 1..57
  cases.sort((a, b) => {
    const numA = parseInt(a.id.replace('oll-', ''), 10);
    const numB = parseInt(b.id.replace('oll-', ''), 10);
    return numA - numB;
  });

  return cases;
}

/**
 * Meta explanations for Full PLL
 */
const PLL_META = {
  'aa': { name: 'Aa Permutation', group: 'Adjacent Corners', why: "Uses D slice turns to cycle 3 corners counter-clockwise." },
  'ab': { name: 'Ab Permutation', group: 'Adjacent Corners', why: "Mirror of Aa perm using D slice turns to cycle 3 corners clockwise." },
  'e': { name: 'E Permutation', group: 'Diagonal Corners', why: "Uses D slice commutators to solve diagonal corner displacement without disturbing edges." },
  'f': { name: 'F Permutation', group: 'Adjacent Corners', why: "Executes a T-Perm corner swap wrapped inside a 1x3 bar setup move." },
  'ga': { name: 'Ga Permutation', group: 'G Perms', why: "Uses wide u slice moves to rotate 3 corners and 3 edges around an anchored 1x2 F2L block." },
  'gb': { name: 'Gb Permutation', group: 'G Perms', why: "F' U' F sets up block, wide u rotates 3 corners and 3 edges clockwise." },
  'gc': { name: 'Gc Permutation', group: 'G Perms', why: "Wide u' counter-clockwise slice rotates 3 corners & edges around front-left block." },
  'gd': { name: 'Gd Permutation', group: 'G Perms', why: "D slice step isolates back-left block while cycling remaining top pieces." },
  'h': { name: 'H Permutation', group: 'Edges Only', why: "M2 swaps opposite edge pairs across middle slice, U aligns top layer, and M2 restores F2L." },
  'ja': { name: 'Ja Permutation', group: 'Adjacent Corners', why: "x tilt with wide r' slice swaps front-left adjacent corners and edges." },
  'jb': { name: 'Jb Permutation', group: 'Adjacent Corners', why: "Pops out right F2L pair and reinserts in offset slot, swapping front-right corners and edges." },
  'na': { name: 'Na Permutation', group: 'Diagonal Corners', why: "Executes a double corner-and-edge diagonal swap along opposing faces." },
  'nb': { name: 'Nb Permutation', group: 'Diagonal Corners', why: "Mirror diagonal corner and edge swap using F' U' F triggers." },
  'ra': { name: 'Ra Permutation', group: 'Adjacent Corners', why: "Sets up front 1x2 bar with F', swaps left corners, and restores F2L." },
  'rb': { name: 'Rb Permutation', group: 'Adjacent Corners', why: "Sets up back 1x2 bar with F, swaps left corners, and restores F2L." },
  't': { name: 'T Permutation', group: 'Adjacent Corners', why: "Pops out two F2L pairs (R U R' U'), swaps right 2 corners and 2 edges, then restores both F2L pairs." },
  'ua': { name: 'Ua Permutation', group: 'Edges Only', why: "R U' lifts right F2L pair, cycles 3 top edges through right slot, and R' U' R2 re-locks F2L." },
  'ub': { name: 'Ub Permutation', group: 'Edges Only', why: "Clockwise mirror of Ua perm, cycling 3 edges through right slot in reverse." },
  'v': { name: 'V Permutation', group: 'Diagonal Corners', why: "Combines y rotation with F-trigger corner swap to solve diagonal displacement." },
  'y': { name: 'Y Permutation', group: 'Diagonal Corners', why: "Combines an edge setup trigger F (R U R' U') F' with a corner swap insert to resolve diagonal corner misalignment." },
  'z': { name: 'Z Permutation', group: 'Edges Only', why: "M' slice moves isolate adjacent edge pairs, cycling them in an X-pattern without disturbing corners." },
};

/**
 * Transform Full PLL dataset (21 cases)
 */
function transformFullPLL(rawAlgs, kpuzzle) {
  const cases = [];

  for (const item of rawAlgs) {
    const rawKey = String(item.name).trim().toLowerCase();
    const id = `pll-${rawKey}`;
    const meta = PLL_META[rawKey] || {
      name: `${item.name} Permutation`,
      group: item.group || 'Full PLL',
      why: 'Permutes the final layer pieces into their solved positions.',
    };

    // Probability: prob 4 -> 4/72 = 1/18, prob 2 -> 2/72 = 1/36, prob 1 -> 1/72
    const probStr = item.prob === 4 ? '1/18' : item.prob === 2 ? '1/36' : '1/72';

    const primaryAlg = normalizeAlg(item.alg[0]);
    validateAlg(kpuzzle, primaryAlg, id);

    const alternativeAlgs = (item.alg.slice(1) || []).map(algStr => {
      const norm = normalizeAlg(algStr);
      validateAlg(kpuzzle, norm, id);
      return norm;
    });

    cases.push({
      id,
      name: meta.name,
      category: 'pll',
      subcategory: 'Full PLL',
      group: meta.group,
      primaryAlg,
      alternativeAlgs,
      probability: probStr,
      description: `${meta.name} case. Permutes last layer pieces without disturbing orientation.`,
      why: meta.why,
    });
  }

  // Sort alphabetically by ID for clean deterministic output
  cases.sort((a, b) => a.id.localeCompare(b.id));

  return cases;
}

/**
 * Main Sync Pipeline
 */
async function main() {
  console.log('--- Starting CFOP Algorithm Ingestion Pipeline ---');

  // 1. Initialize KPuzzle simulation engine
  console.log('Initializing cubing/puzzles 3x3x3 simulation...');
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();

  // 2. Fetch all canonical datasets
  const [oll2LookData, pll2LookData, ollFullData, pllFullData] = await Promise.all([
    fetchAlgset(ENDPOINTS.oll2Look),
    fetchAlgset(ENDPOINTS.pll2Look),
    fetchAlgset(ENDPOINTS.ollFull),
    fetchAlgset(ENDPOINTS.pllFull),
  ]);

  // 3. Transform & validate
  console.log('Transforming and validating algorithms...');
  const oll2LookCases = transform2LookOLL(oll2LookData.algs, kpuzzle);
  const pll2LookCases = transform2LookPLL(pll2LookData.algs, kpuzzle);
  const ollFullCases = transformFullOLL(ollFullData.algs, kpuzzle);
  const pllFullCases = transformFullPLL(pllFullData.algs, kpuzzle);

  // Assert expected counts
  if (oll2LookCases.length !== 10) {
    throw new Error(`Expected 10 cases for 2-Look OLL, got ${oll2LookCases.length}`);
  }
  if (pll2LookCases.length !== 6) {
    throw new Error(`Expected 6 cases for 2-Look PLL, got ${pll2LookCases.length}`);
  }
  if (ollFullCases.length !== 57) {
    throw new Error(`Expected 57 cases for Full OLL, got ${ollFullCases.length}`);
  }
  if (pllFullCases.length !== 21) {
    throw new Error(`Expected 21 cases for Full PLL, got ${pllFullCases.length}`);
  }

  // 4. Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 5. Emit formatted JSON files
  const outputs = [
    { file: 'oll-2look.json', count: oll2LookCases.length, data: oll2LookCases },
    { file: 'pll-2look.json', count: pll2LookCases.length, data: pll2LookCases },
    { file: 'oll-full.json', count: ollFullCases.length, data: ollFullCases },
    { file: 'pll-full.json', count: pllFullCases.length, data: pllFullCases },
  ];

  for (const { file, count, data } of outputs) {
    const dest = path.join(OUTPUT_DIR, file);
    fs.writeFileSync(dest, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`✓ Emitted ${file} (${count} cases) -> ${dest}`);
  }

  console.log('--- Algorithm sync complete! All cases validated successfully. ---');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
