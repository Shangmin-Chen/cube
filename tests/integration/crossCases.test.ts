import { describe, it, expect, beforeAll } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import { CROSS_CASES } from '../../src/data/cfopData';

const EDGE_NAMES = ['UF', 'UR', 'UB', 'UL', 'DF', 'DR', 'DB', 'DL', 'FR', 'FL', 'BR', 'BL'];
const CROSS_INDICES = [4, 5, 6, 7]; // DF, DR, DB, DL
const FORBIDDEN_IDS = new Set(['cross-sample-1', 'cross-sample-2']);
const FORBIDDEN_ALGS = new Set(["D2 R F L B", "F' D R' F2"]);

function caseStateFor(kpuzzle: any, caseDef: { primaryAlg: string }) {
  const setup = new Alg(caseDef.primaryAlg).invert();
  return kpuzzle.defaultPattern().applyTransformation(kpuzzle.algToTransformation(setup));
}

function locateEdge(pattern: any, pieceIndex: number) {
  for (let slot = 0; slot < 12; slot++) {
    if (pattern.patternData.EDGES.pieces[slot] === pieceIndex) {
      return { slot: EDGE_NAMES[slot], flipped: pattern.patternData.EDGES.orientation[slot] === 1 };
    }
  }
  throw new Error(`could not locate edge piece ${pieceIndex}`);
}

describe('Cross Cases Invariants', () => {
  let kpuzzle: any;

  beforeAll(async () => {
    kpuzzle = await puzzles['3x3x3'].kpuzzle();
  });

  it('contains exactly 4 beginner cross cases', () => {
    expect(CROSS_CASES.length).toBe(4);
  });

  it('contains required fields and does not include forbidden retired cases or algs', () => {
    for (const c of CROSS_CASES) {
      expect(c.primaryAlg).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.tips).toBeTruthy();
      expect(c.why).toBeTruthy();
      expect(FORBIDDEN_IDS.has(c.id)).toBe(false);
      expect(FORBIDDEN_ALGS.has(new Alg(c.primaryAlg).toString())).toBe(false);
    }
  });

  it('each cross case displaces exactly one cross edge and primaryAlg solves it', () => {
    for (const c of CROSS_CASES) {
      const casePattern = caseStateFor(kpuzzle, c);
      const wrong = CROSS_INDICES.filter(i => {
        const { slot, flipped } = locateEdge(casePattern, i);
        return slot !== EDGE_NAMES[i] || flipped;
      });

      expect(wrong.length).toBe(1);

      const solved = casePattern.applyTransformation(
        kpuzzle.algToTransformation(new Alg(c.primaryAlg)),
      );
      const { pieces, orientation } = solved.patternData.EDGES;
      const isSolved = pieces.every((p: number, i: number) => p === i) && orientation.every((o: number) => o === 0);
      expect(isSolved).toBe(true);
    }
  });
});
