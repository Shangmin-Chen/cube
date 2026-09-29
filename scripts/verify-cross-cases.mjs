import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PACKAGE_CROSS_PATH = path.join(ROOT_DIR, 'packages/cfop-data/src/data/cross.ts');
const CFOP_DATA_PATH = fs.existsSync(PACKAGE_CROSS_PATH)
  ? PACKAGE_CROSS_PATH
  : path.join(ROOT_DIR, 'src/data/cfopData.ts');

/**
 * cubing.js 3x3x3 EDGES slot order, derived from which face turn moves which index
 * (U -> 0,1,2,3   D -> 4,5,6,7   F -> 0,4,8,9   R -> 1,5,8,10   B -> 2,6,10,11   L -> 3,7,9,11).
 * Getting this table wrong makes every positional assertion below vacuous, so it is
 * re-derived at runtime by `assertEdgeSlotOrder` rather than trusted as a constant.
 */
const EDGE_NAMES = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
const CROSS_SLOTS = ['DF', 'DR', 'DB', 'DL'];
const CROSS_INDICES = CROSS_SLOTS.map(name => EDGE_NAMES.indexOf(name));
const U_SLOTS = ['UF', 'UR', 'UB', 'UL'];

const EXPECTED_CASE_COUNT = 4;

/** The fabricated case this script exists to keep out of the deck (issue #18). */
const FORBIDDEN_IDS = new Set(['cross-sample-1', 'cross-u-white-up', 'cross-u-white-side']);
const FORBIDDEN_ALGS = new Set(['D2 R F L B', "R U' R'", "F U F'", "R' D R", "F L F'"]);

function fail(message) {
  throw new Error(`verify-cross-cases: ${message}`);
}

/**
 * Re-derive the EDGES slot order from the puzzle definition so a transposed
 * constant cannot silently turn every positional check into a no-op.
 */
function assertEdgeSlotOrder(kpuzzle) {
  const facesOf = new Map(EDGE_NAMES.map(n => [n, new Set()]));
  for (const face of ['U', 'D', 'F', 'B', 'R', 'L']) {
    const pattern = kpuzzle
      .defaultPattern()
      .applyTransformation(kpuzzle.algToTransformation(new Alg(face)));
    for (let i = 0; i < 12; i++) {
      if (pattern.patternData.EDGES.pieces[i] !== i) {
        facesOf.get(EDGE_NAMES[i]).add(face);
      }
    }
  }

  for (const name of EDGE_NAMES) {
    const derived = [...facesOf.get(name)].sort().join('');
    const declared = name.split('').sort().join('');
    if (derived !== declared) {
      fail(
        `EDGE_NAMES is transposed: index ${EDGE_NAMES.indexOf(name)} is declared "${name}" ` +
          `but the puzzle definition places it on faces {${derived}}.`,
      );
    }
  }
  console.log('✓ EDGE_NAMES matches the cubing.js EDGES slot order (re-derived, not assumed)');
}

/** Parse the hand-written CROSS_CASES array out of cfopData.ts. */
function parseCrossCases(content) {
  const block = content.match(/export const CROSS_CASES: AlgCase\[\] = \[([\s\S]*?)\n\];/);
  if (!block) fail('could not locate the CROSS_CASES array in cfopData.ts');

  const field = (body, key) => {
    const single = body.match(new RegExp(`${key}:\\s*'((?:\\\\'|[^'])*)'`));
    if (single) return single[1].replace(/\\'/g, "'");
    const double = body.match(new RegExp(`${key}:\\s*"((?:\\\\"|[^"])*)"`));
    return double ? double[1].replace(/\\"/g, '"') : undefined;
  };

  const cases = [];
  for (const match of block[1].matchAll(/\{([^{}]*)\}/g)) {
    const body = match[1];
    const id = field(body, 'id');
    if (!id) continue;
    cases.push({
      id,
      primaryAlg: field(body, 'primaryAlg'),
      setupMoves: field(body, 'setupMoves'),
      description: field(body, 'description'),
      tips: field(body, 'tips'),
      why: field(body, 'why'),
    });
  }
  return cases;
}

/** The trainer builds the case state by inverting primaryAlg (useTrainerSession.ts). */
function caseStateFor(kpuzzle, caseDef) {
  const setup = caseDef.setupMoves
    ? new Alg(caseDef.setupMoves)
    : new Alg(caseDef.primaryAlg).invert();
  return kpuzzle.defaultPattern().applyTransformation(kpuzzle.algToTransformation(setup));
}

function locateEdge(pattern, pieceIndex) {
  for (let slot = 0; slot < 12; slot++) {
    if (pattern.patternData.EDGES.pieces[slot] === pieceIndex) {
      return { slot: EDGE_NAMES[slot], flipped: pattern.patternData.EDGES.orientation[slot] === 1 };
    }
  }
  fail(`could not locate edge piece ${pieceIndex}`);
}

function isFullySolved(pattern) {
  const { pieces, orientation } = pattern.patternData.EDGES;
  return pieces.every((piece, i) => piece === i) && orientation.every(o => o === 0);
}

/** Slot tokens named in prose, e.g. "sits at UF", "the FR middle-layer slot". */
function slotsMentioned(text) {
  return new Set((text.match(/\b(?:U|D|F|B|R|L)[FBRLUD]\b/g) || []).filter(t => EDGE_NAMES.includes(t)));
}

/**
 * Negative controls. Every check below is only worth having if it can fail, and the
 * defect this script was written for (issue #18) was a case that looked plausible and
 * passed anyway. Each control is a case that MUST be rejected.
 */
function assertNegativeControls(kpuzzle) {
  const controls = [
    {
      label: 'alg that never touches a cross edge',
      def: {
        id: 'control-vacuous',
        primaryAlg: "R U R' U'",
        description: 'The front cross edge sits at UF with white facing up.',
        tips: '',
        why: '',
      },
      expect: /already-solved cross/,
    },
    {
      label: 'alg that displaces three cross edges',
      def: {
        id: 'control-multi',
        primaryAlg: 'D',
        description: 'The front cross edge sits at DR with white facing up.',
        tips: '',
        why: '',
      },
      expect: /displaces \d+ cross edges/,
    },
    {
      label: 'correct alg with the wrong slot in its description',
      def: {
        id: 'control-wrong-slot',
        primaryAlg: 'F2',
        description: 'The front cross edge sits at UB with white facing up.',
        tips: '',
        why: '',
      },
      expect: /is actually at UF/,
    },
    {
      label: 'correct alg with the wrong orientation claim',
      def: {
        id: 'control-wrong-orientation',
        primaryAlg: "R' F R",
        description: 'The front cross edge sits at UR with white facing up.',
        tips: '',
        why: '',
      },
      expect: /white faces up, but the edge at UR is flipped/,
    },
  ];

  for (const { label, def, expect } of controls) {
    let threw = null;
    try {
      checkCase(kpuzzle, def);
    } catch (err) {
      threw = err;
    }
    if (!threw) fail(`negative control passed when it should have failed: ${label}`);
    if (!expect.test(threw.message)) {
      fail(`negative control "${label}" failed for the wrong reason: ${threw.message}`);
    }
  }
  console.log(`✓ ${controls.length} negative controls correctly rejected`);
}

async function runVerification() {
  console.log('--- Cross Case Verification ---');
  const kpuzzle = await puzzles['3x3x3'].kpuzzle();
  assertEdgeSlotOrder(kpuzzle);
  assertNegativeControls(kpuzzle);

  const cases = parseCrossCases(fs.readFileSync(CFOP_DATA_PATH, 'utf-8'));
  if (cases.length !== EXPECTED_CASE_COUNT) {
    fail(`expected ${EXPECTED_CASE_COUNT} cross cases, parsed ${cases.length}`);
  }
  console.log(`✓ Parsed ${cases.length} cross cases from cfopData.ts`);

  for (const c of cases) {
    for (const key of ['primaryAlg', 'description', 'tips', 'why']) {
      if (!c[key]) fail(`${c.id} is missing "${key}"`);
    }
    if (FORBIDDEN_IDS.has(c.id)) fail(`${c.id} is a retired fabricated case and must not return`);
    if (FORBIDDEN_ALGS.has(new Alg(c.primaryAlg).toString())) {
      fail(`${c.id} uses retired algorithm "${c.primaryAlg}" — it does not displace a cross edge`);
    }
  }
  console.log('✓ No retired fabricated case or algorithm has returned');

  for (const c of cases) {
    const { targetSlot, actualSlot, flipped, where } = checkCase(kpuzzle, c);
    console.log(
      `✓ ${c.id.padEnd(24)} ${targetSlot} edge at ${actualSlot.padEnd(2)}` +
        `${flipped ? ' flipped' : '       '} (${where}) — "${c.primaryAlg}" solves it`,
    );
  }

  console.log(`--- All ${cases.length} cross cases verified ---`);
}

/** All per-case assertions. Returns what it established, so callers can report it. */
function checkCase(kpuzzle, c) {
  const casePattern = caseStateFor(kpuzzle, c);

  // 1. The case must actually be a cross case: exactly one cross edge out of place.
  const wrong = CROSS_INDICES.filter(i => {
    const { slot, flipped } = locateEdge(casePattern, i);
    return slot !== EDGE_NAMES[i] || flipped;
  });
  if (wrong.length === 0) {
    fail(
      `${c.id} presents an already-solved cross — there is nothing for the learner to insert. ` +
        `Setup "${new Alg(c.primaryAlg).invert()}" leaves DF/DR/DB/DL untouched.`,
    );
  }
  if (wrong.length > 1) {
    fail(
      `${c.id} displaces ${wrong.length} cross edges (${wrong.map(i => EDGE_NAMES[i]).join(', ')}); ` +
        'a beginner insertion case must displace exactly one',
    );
  }

  const targetIndex = wrong[0];
  const targetSlot = EDGE_NAMES[targetIndex];
  const { slot: actualSlot, flipped } = locateEdge(casePattern, targetIndex);

  // 2. The algorithm must fully solve the state the trainer shows.
  const solved = casePattern.applyTransformation(
    kpuzzle.algToTransformation(new Alg(c.primaryAlg)),
  );
  if (!isFullySolved(solved)) {
    fail(`${c.id}: primaryAlg "${c.primaryAlg}" does not return the case state to solved`);
  }

  // 3. The description must name the slot the edge is really in.
  const named = slotsMentioned(c.description);
  if (named.size === 0) {
    fail(
      `${c.id}: description names no edge slot, so its positional claim cannot be checked. ` +
        `The edge is at ${actualSlot}.`,
    );
  }
  if (!named.has(actualSlot)) {
    fail(
      `${c.id}: description says ${[...named].join('/')} but the ${targetSlot} edge is actually ` +
        `at ${actualSlot}${flipped ? ' (flipped)' : ''}`,
    );
  }

  // 4. Orientation claims are only meaningful where the white sticker has a
  //    nameable direction: the top layer (up vs out) and the cross slots
  //    themselves (down vs front). A middle-layer edge has no such vocabulary,
  //    so it is only checked if the card volunteers a claim.
  const where = U_SLOTS.includes(actualSlot)
    ? 'top layer'
    : CROSS_SLOTS.includes(actualSlot)
      ? 'bottom layer'
      : 'middle layer';

  const text = `${c.description} ${c.tips}`.toLowerCase();
  const claimsFlipped =
    /\bflipped\b|fac(?:e|es|ing) (?:out|front|sideways|the side|the right|the left)/.test(text);
  const claimsUpright = /fac(?:e|es|ing) up\b|white (?:sticker )?(?:is )?up\b/.test(text);

  if (claimsFlipped && claimsUpright) {
    fail(`${c.id}: description claims both an upright and a flipped sticker`);
  }
  if (where !== 'middle layer' && !claimsFlipped && !claimsUpright) {
    fail(
      `${c.id}: the edge is in the ${where}, where orientation is visible — ` +
        'state whether the white sticker faces up or out',
    );
  }
  if (claimsUpright && flipped) {
    fail(`${c.id}: description says white faces up, but the edge at ${actualSlot} is flipped`);
  }
  if (claimsFlipped && !flipped) {
    fail(`${c.id}: description says the sticker is misoriented, but the edge at ${actualSlot} is not flipped`);
  }

  return { targetSlot, actualSlot, flipped, where };
}

runVerification().catch(err => {
  console.error(err.message);
  process.exit(1);
});
