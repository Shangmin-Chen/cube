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

const FORBIDDEN_IDS = new Set(['cross-sample-1']);
const FORBIDDEN_ALGS = new Set(['D2 R F L B'].map(canonicalAlgKey));

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
    const description = body.match(/description:\s*'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/)?.[1]
      ?? body.match(/description:\s*"((?:\\"|[^"])*)"/)?.[1];
    const tips = body.match(/tips:\s*'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/)?.[1]
      ?? body.match(/tips:\s*"((?:\\"|[^"])*)"/)?.[1];
    const why = body.match(/why:\s*'((?:\\'|[^'])*)'|"((?:\\"|[^"])*)"/)?.[1]
      ?? body.match(/why:\s*"((?:\\"|[^"])*)"/)?.[1];
    if (id && primaryAlg) {
      cases.push({ id, primaryAlg, setupMoves, description, tips, why });
    }
  }
  return cases;
}

function canonicalAlgKey(algStr) {
  return new Alg(algStr).toString();
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

function brokenIncludes(pieces, orientation, slotName) {
  const slot = EDGE_NAMES.indexOf(slotName);
  return pieces[slot] !== slot || orientation[slot] !== 0;
}

function expectEdgeLocation(actual, expected, label) {
  if (actual.slot !== expected.slot || actual.ori !== expected.ori) {
    throw new Error(
      `${label}: expected ${expected.slot}(o${expected.ori}), got ${actual.slot}(o${actual.ori})`
    );
  }
}

/** Per-case setup invariants matched to description claims (trainer inverse-from-solved model). */
const SETUP_EXPECTATIONS = {
  'cross-u-white-up': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DF')) {
      throw new Error('Expected exactly one missing cross edge: DF');
    }
    expectEdgeLocation(locateEdge(pieces, orientation, 'DF'), { slot: 'UF', ori: 0 }, 'setup');
  },
  'cross-u-white-side': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DR')) {
      throw new Error('Expected exactly one missing cross edge: DR');
    }
    expectEdgeLocation(locateEdge(pieces, orientation, 'DR'), { slot: 'UR', ori: 1 }, 'setup');
  },
  'cross-middle-fr': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DF')) {
      throw new Error('Expected exactly one missing cross edge: DF');
    }
    expectEdgeLocation(locateEdge(pieces, orientation, 'DF'), { slot: 'FR', ori: 0 }, 'setup');
  },
  'cross-middle-br': ({ pieces, orientation, brokenCount }) => {
    if (brokenCount !== 1 || !brokenIncludes(pieces, orientation, 'DL')) {
      throw new Error('Expected exactly one missing cross edge: DL');
    }
    expectEdgeLocation(locateEdge(pieces, orientation, 'DL'), { slot: 'BR', ori: 0 }, 'setup');
  },
};

/**
 * Step-by-step edge tracking for the target cross edge. Catches false move narratives
 * (e.g. F' insertion, U' positioning above front when already at UF).
 */
const ALG_STEP_EXPECTATIONS = {
  'cross-u-white-up': {
    target: 'DF',
    steps: [
      { prefix: '', location: { slot: 'UF', ori: 0 } },
      { prefix: 'R', location: { slot: 'UF', ori: 0 } },
      { prefix: "R U'", location: { slot: 'UR', ori: 0 }, notAt: 'UF' },
      { prefix: "R U' R'", location: { slot: 'DF', ori: 0 }, crossSolved: true },
    ],
  },
  'cross-u-white-side': {
    target: 'DR',
    steps: [
      { prefix: '', location: { slot: 'UR', ori: 1 } },
      { prefix: 'F', location: { slot: 'UR', ori: 1 } },
      { prefix: 'F U', location: { slot: 'UF', ori: 1 } },
      { prefix: "F U F'", location: { slot: 'DR', ori: 0 }, crossSolved: true },
    ],
  },
  'cross-middle-fr': {
    target: 'DF',
    steps: [
      { prefix: '', location: { slot: 'FR', ori: 0 } },
      { prefix: "R'", location: { slot: 'FR', ori: 0 } },
      { prefix: "R' D", location: { slot: 'FL', ori: 0 }, notAt: 'FR' },
      { prefix: "R' D R", location: { slot: 'DF', ori: 0 }, crossSolved: true },
    ],
  },
  'cross-middle-br': {
    target: 'DL',
    steps: [
      { prefix: '', location: { slot: 'BR', ori: 0 } },
      { prefix: 'F', location: { slot: 'BR', ori: 0 } },
      { prefix: 'F L', location: { slot: 'DL', ori: 0 }, crossSolved: false },
      { prefix: "F L F'", location: { slot: 'DL', ori: 0 }, crossSolved: true },
    ],
  },
};

/** Prose must not contradict step simulation for known false narratives. */
const PROSE_CHECKS = {
  'cross-u-white-up': (prose, steps) => {
    if (/U'.*(?:above|position).*(?:front slot|front-bottom)/i.test(prose)) {
      throw new Error(
        "why/tips falsely claim U' positions the edge above the front slot; setup already has it at UF and U' moves it to UR"
      );
    }
    if (steps["R U'"].location.slot !== 'UR') {
      throw new Error("U' must move the DF edge from UF to UR before R' insertion");
    }
  },
  'cross-middle-br': (prose, steps) => {
    if (/F'.*insert/i.test(prose)) {
      throw new Error("why/tips falsely claim F' performs insertion; F L places the edge into the cross slot before F'");
    }
    if (steps['F L']?.location.slot !== 'DL') {
      throw new Error('F L must place the DL edge into the left cross slot before F\'');
    }
  },
  'cross-middle-fr': (prose) => {
    if (/open the front slot/i.test(prose)) {
      throw new Error("why/tips overstate D's effect; D shifts the edge FR→FL, it does not open the front slot");
    }
  },
};

function buildStepStates(kpuzzle, solved, setup, primaryAlg) {
  const states = {};
  const tokens = primaryAlg.split(/\s+/).filter(Boolean);
  for (let i = 0; i <= tokens.length; i++) {
    const prefix = tokens.slice(0, i).join(' ');
    const alg = prefix ? `${setup} ${prefix}` : setup;
    const pattern = solved.applyTransformation(kpuzzle.algToTransformation(new Alg(alg)));
    states[prefix] = analyzeCross(pattern);
  }
  return states;
}

function validateForbiddenCases(cases) {
  for (const c of cases) {
    if (FORBIDDEN_IDS.has(c.id)) {
      throw new Error(`Forbidden cross case id must not be present: ${c.id}`);
    }
    const algKey = canonicalAlgKey(c.primaryAlg);
    if (FORBIDDEN_ALGS.has(algKey)) {
      throw new Error(`Forbidden false algorithm must not be present: ${c.primaryAlg}`);
    }
  }
}

function validateAlgSteps(kpuzzle, solved, caseDef, setup) {
  const spec = ALG_STEP_EXPECTATIONS[caseDef.id];
  if (!spec) throw new Error(`Missing ALG_STEP_EXPECTATIONS for ${caseDef.id}`);

  const stepStates = buildStepStates(kpuzzle, solved, setup, caseDef.primaryAlg);
  const trackedSteps = {};

  for (const step of spec.steps) {
    const state = stepStates[step.prefix];
    if (!state) {
      throw new Error(`${caseDef.id}: missing simulation state for prefix "${step.prefix}"`);
    }

    const loc = locateEdge(state.pieces, state.orientation, spec.target);
    trackedSteps[step.prefix || 'setup'] = { location: loc, crossSolved: state.crossSolved };
    expectEdgeLocation(loc, step.location, `${caseDef.id} after "${step.prefix || 'setup'}"`);

    if (step.notAt && loc.slot === step.notAt) {
      throw new Error(
        `${caseDef.id} after "${step.prefix}": edge should not remain at ${step.notAt}`
      );
    }
    if (step.crossSolved && !state.crossSolved) {
      throw new Error(`${caseDef.id} after "${step.prefix}": cross should be solved`);
    }
    if (step.crossSolved === false && state.crossSolved) {
      throw new Error(`${caseDef.id} after "${step.prefix}": cross should not yet be solved`);
    }
  }

  return trackedSteps;
}

function validateProse(caseDef, trackedSteps) {
  const prose = [caseDef.description, caseDef.tips, caseDef.why].filter(Boolean).join(' ');
  if (!prose.trim()) {
    throw new Error(`${caseDef.id}: missing description/tips/why prose`);
  }

  const checker = PROSE_CHECKS[caseDef.id];
  if (checker) {
    checker(prose, trackedSteps);
  }
}

async function runVerification() {
  console.log('--- Cross Case Verification ---');

  const cfopContent = fs.readFileSync(CFOP_DATA_PATH, 'utf8');
  const cases = parseCrossCases(cfopContent);
  if (cases.length === 0) throw new Error('No CROSS_CASES found');

  validateForbiddenCases(cases);

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

    const trackedSteps = validateAlgSteps(kpuzzle, solved, c, setup);
    validateProse(c, trackedSteps);

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
