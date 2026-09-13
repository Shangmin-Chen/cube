import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CFOP_DATA_PATH = path.join(ROOT_DIR, 'src/data/cfopData.ts');

/** U-layer edge slots: UF=0 UR=1 UB=2 UL=3 */
const EDGE_NAMES = ['UF', 'UR', 'UB', 'UL', 'FR', 'FL', 'BL', 'BR', 'DF', 'DR', 'DB', 'DL'];
const CROSS_SLOTS = ['DF', 'DR', 'DB', 'DL'];

/**
 * Parse hand-written CROSS_CASES from cfopData.ts (trainer uses invert(primaryAlg) unless setupMoves is set).
 */
function parseCrossCases(content) {
  const blockMatch = content.match(/export const CROSS_CASES: AlgCase\[\] = \[([\s\S]*?)\];/);
  if (!blockMatch) throw new Error('Could not find CROSS_CASES in cfopData.ts');

  const cases = [];
  const objectPattern = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;
  while ((match = objectPattern.exec(blockMatch[1])) !== null) {
    const body = match[1];
    const id = body.match(/id:\s*'([^']+)'/)?.[1];
    const primaryAlg = body.match(/primaryAlg:\s*'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/)?.[1]
      ?? body.match(/primaryAlg:\s*"((?:\\"|[^"])*)"/)?.[1];
    const setupMoves = body.match(/setupMoves:\s*'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/)?.[1]
      ?? body.match(/setupMoves:\s*"((?:\\"|[^"])*)"/)?.[1];
    if (id && primaryAlg) {
      cases.push({ id, primaryAlg, setupMoves });
    }
  }
  return cases;
}

function invertAlg(algStr) {
  return new Alg(algStr).invert().toString().replace(/2'/g, '2');
}

function trainerSetup(caseDef) {
  return caseDef.setupMoves ?? invertAlg(caseDef.primaryAlg);
}

function locateEdge(pieces, orientation, edgeName) {
  const edgeIdx = EDGE_NAMES.indexOf(edgeName);
  for (let slot = 0; slot < 12; slot++) {
    if (pieces[slot] === edgeIdx) {
      return { slot: EDGE_NAMES[slot], ori: orientation[slot] };
    }
  }
  throw new Error(`Could not locate edge ${edgeName}`);
}

function analyzeCross(pattern) {
  const { pieces, orientation } = pattern.patternData.EDGES;
  const broken = CROSS_SLOTS.filter((slotName) => {
    const slot = EDGE_NAMES.indexOf(slotName);
    return pieces[slot] !== slot || orientation[slot] !== 0;
  });
  const crossSolved = broken.length === 0;
  return { pieces, orientation, broken, crossSolved, brokenCount: broken.length };
}

/** Per-case setup invariants matched to description/why claims (trainer inverse-from-solved model). */
const SETUP_EXPECTATIONS = {
  'cross-u-white-up': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DF')) {
      throw new Error('Expected exactly one missing cross edge: DF');
    }
    const loc = locateEdge(pieces, orientation, 'DF');
    if (loc.slot !== 'UF' || loc.ori !== 0) {
      throw new Error(`DF edge should be at UF with white up (ori 0); got ${loc.slot}(o${loc.ori})`);
    }
  },
  'cross-u-white-side': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DR')) {
      throw new Error('Expected exactly one missing cross edge: DR');
    }
    const loc = locateEdge(pieces, orientation, 'DR');
    if (loc.slot !== 'UR' || loc.ori !== 1) {
      throw new Error(`DR edge should be at UR with white facing side (ori 1); got ${loc.slot}(o${loc.ori})`);
    }
  },
  'cross-middle-fr': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DF')) {
      throw new Error('Expected exactly one missing cross edge: DF');
    }
    const loc = locateEdge(pieces, orientation, 'DF');
    if (loc.slot !== 'FR' || loc.ori !== 0) {
      throw new Error(`DF edge should be in FR middle slot; got ${loc.slot}(o${loc.ori})`);
    }
  },
  'cross-middle-br': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DL')) {
      throw new Error('Expected exactly one missing cross edge: DL');
    }
    const loc = locateEdge(pieces, orientation, 'DL');
    if (loc.slot !== 'BR' || loc.ori !== 0) {
      throw new Error(`DL edge should be in BR middle slot; got ${loc.slot}(o${loc.ori})`);
    }
  },
};

function brokenIncludes(pieces, orientation, slotName) {
  const slot = EDGE_NAMES.indexOf(slotName);
  return pieces[slot] !== slot || orientation[slot] !== 0;
}

async function runVerification() {
  console.log('--- Cross Case Verification ---');

  const cfopContent = fs.readFileSync(CFOP_DATA_PATH, 'utf8');
  if (cfopContent.includes('cross-sample-1') || cfopContent.includes('D2 R F L B')) {
    throw new Error('Removed false cross-sample-1 must not be present');
  }

  const cases = parseCrossCases(cfopContent);
  if (cases.length === 0) throw new Error('No CROSS_CASES found');

  for (const c of cases) {
    if (!SETUP_EXPECTATIONS[c.id]) {
      throw new Error(`Missing SETUP_EXPECTATIONS for ${c.id}`);
    }
  }

  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  const solved = kpuzzle.defaultPattern();

  for (const c of cases) {
    const setup = trainerSetup(c);
    const setupPattern = solved.applyTransformation(kpuzzle.algToTransformation(new Alg(setup)));
    const before = analyzeCross(setupPattern);

    if (before.crossSolved) {
      throw new Error(`${c.id}: setup "${setup}" must leave cross unsolved`);
    }

    SETUP_EXPECTATIONS[c.id](before);

    const afterPattern = setupPattern.applyTransformation(
      kpuzzle.algToTransformation(new Alg(c.primaryAlg))
    );
    const after = analyzeCross(afterPattern);

    if (!after.crossSolved) {
      throw new Error(`${c.id}: primaryAlg "${c.primaryAlg}" must complete the cross`);
    }

    console.log(`✓ ${c.id}`);
    console.log(`    setup: ${setup}`);
    console.log(`    alg:   ${c.primaryAlg}`);
    console.log(`    cross before: ${before.brokenCount}/4 broken (${before.broken.join(', ')})`);
    console.log(`    cross after:  solved`);
  }

  console.log(`--- All ${cases.length} cross cases verified ---`);
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
