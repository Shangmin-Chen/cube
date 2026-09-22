import { describe, it, expect, beforeAll } from 'vitest';
import { puzzles } from 'cubing/puzzles';
import { Alg } from 'cubing/alg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const LOOK1_Y_ROTATIONS = ["y'", 'y', 'y2'];
const TOP_EDGE_INDICES = [0, 1, 2, 3];

function getAllAlgs(c: { primaryAlg: string; alternativeAlgs?: string[] }): string[] {
  return [c.primaryAlg, ...(c.alternativeAlgs || [])];
}

function centersAreIdentity(kpuzzle: any, algStr: string): boolean {
  const transf = kpuzzle.algToTransformation(new Alg(algStr));
  const centers = transf.transformationData.CENTERS.permutation;
  return centers.every((val: number, idx: number) => val === idx);
}

function topEdgesOriented(transf: any): boolean {
  const ori = transf.transformationData.EDGES.orientationDelta;
  return TOP_EDGE_INDICES.every(i => ori[i] === 0);
}

function look1CaseSolvedModuloRotation(kpuzzle: any, resultTransf: any): boolean {
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

function deriveUEdgeSlots(kp: any): string[] {
  const faceOf: Record<number, string[]> = {};
  for (const face of ['U', 'F', 'R', 'B', 'L']) {
    const pattern = kp.defaultPattern().applyTransformation(kp.algToTransformation(new Alg(face)));
    for (let i = 0; i < 4; i++) {
      if (pattern.patternData.EDGES.pieces[i] !== i) {
        (faceOf[i] ||= []).push(face);
      }
    }
  }
  const ordered: string[] = [];
  for (let i = 0; i < 4; i++) {
    const faces = faceOf[i] || [];
    const nonU = faces.find(f => f !== 'U');
    ordered.push(`U${nonU}`);
  }
  return ordered;
}

function parseFraction(value: string | undefined, id: string): [number, number] {
  const match = /^(\d+)\/(\d+)$/.exec(String(value).trim());
  if (!match) {
    throw new Error(`Probability invariant failure: ${id} has unparseable probability "${value}"`);
  }
  return [Number(match[1]), Number(match[2])];
}

function sumFractions(pairs: Array<[number, number]>): [number, number] {
  let num = 0;
  let den = 1;
  for (const [n, d] of pairs) {
    num = num * d + n * den;
    den *= d;
  }
  return [num, den];
}

describe('CFOP Invariants', () => {
  let kpuzzle: any;
  let oll2Look: any[];
  let pll2Look: any[];
  let ollFull: any[];
  let pllFull: any[];

  beforeAll(async () => {
    kpuzzle = await puzzles['3x3x3'].kpuzzle();
    oll2Look = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/oll-2look.json'), 'utf-8'),
    );
    pll2Look = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/pll-2look.json'), 'utf-8'),
    );
    ollFull = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/oll-full.json'), 'utf-8'),
    );
    pllFull = JSON.parse(
      fs.readFileSync(path.join(ROOT_DIR, 'src/data/generated/pll-full.json'), 'utf-8'),
    );
  });

  it('matches expected generated JSON case counts', () => {
    expect(oll2Look.length).toBe(10);
    expect(pll2Look.length).toBe(6);
    expect(ollFull.length).toBe(57);
    expect(pllFull.length).toBe(21);
  });

  it('parses and simulates all primary and alternative algorithms without error', () => {
    const datasets = [oll2Look, pll2Look, ollFull, pllFull];
    let totalCount = 0;
    for (const data of datasets) {
      for (const c of data) {
        for (const alg of getAllAlgs(c)) {
          expect(() => kpuzzle.algToTransformation(new Alg(alg))).not.toThrow();
          totalCount++;
        }
      }
    }
    expect(totalCount).toBe(181);
  });

  it('Invariant 1: all PLL algorithms preserve CENTERS identity permutation', () => {
    const allPllCases = [...pll2Look, ...pllFull];
    for (const c of allPllCases) {
      for (const alg of getAllAlgs(c)) {
        expect(centersAreIdentity(kpuzzle, alg)).toBe(true);
      }
    }
  });

  it('Invariant 2: edges-only PLL algorithms preserve CORNERS permutation and orientation', () => {
    const allPllCases = [...pll2Look, ...pllFull];
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
      expect(c).toBeDefined();
      for (const alg of getAllAlgs(c!)) {
        const transf = kpuzzle.algToTransformation(new Alg(alg));
        const cornersPerm = transf.transformationData.CORNERS.permutation;
        const cornersOri = transf.transformationData.CORNERS.orientationDelta;

        expect(cornersPerm.every((val: number, idx: number) => val === idx)).toBe(true);
        expect(cornersOri.every((val: number) => val === 0)).toBe(true);
      }
    }
  });

  it('Invariant 3: Look-1 OLL alternatives solve the same case as their primary', () => {
    const look1OllCases = oll2Look.filter(c => c.group === 'Edges (Look 1)');

    // Negative controls
    const byId = Object.fromEntries(look1OllCases.map(c => [c.id, c]));
    const dotCase = byId['oll-2look-dot'];
    const lineCase = byId['oll-2look-line'];
    const suneAlg = oll2Look.find(c => c.id === 'oll-2look-sune')?.primaryAlg ?? "R U R' U R U2 R'";

    const controls = [
      { caseAlg: dotCase.primaryAlg, alg: lineCase.primaryAlg },
      { caseAlg: dotCase.primaryAlg, alg: suneAlg },
    ];

    for (const { caseAlg, alg } of controls) {
      const caseTransf = kpuzzle.algToTransformation(new Alg(caseAlg)).invert();
      const resultTransf = caseTransf.apply(kpuzzle.algToTransformation(new Alg(alg)));
      expect(look1CaseSolvedModuloRotation(kpuzzle, resultTransf)).toBe(false);
    }

    // Invariant check
    for (const c of look1OllCases) {
      const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
      for (const alg of getAllAlgs(c)) {
        const algTransf = kpuzzle.algToTransformation(new Alg(alg));
        const resultTransf = caseTransf.apply(algTransf);
        expect(look1CaseSolvedModuloRotation(kpuzzle, resultTransf)).toBe(true);
      }
    }
  });

  it('Invariant 4: Look-1 OLL hold descriptions match physical simulation', () => {
    const look1OllCases = oll2Look.filter(c => c.group === 'Edges (Look 1)');
    const U_EDGE_SLOTS = deriveUEdgeSlots(kpuzzle);
    const CLOCK: Record<string, string> = { UB: '12', UR: '3', UF: '6', UL: '9' };

    function holdClocksFor(algStr: string, slots = U_EDGE_SLOTS) {
      const inverse = kpuzzle.algToTransformation(new Alg(algStr)).invert();
      const casePattern = kpuzzle.defaultPattern().applyTransformation(inverse);
      const orientation = casePattern.patternData.EDGES.orientation;
      return slots
        .filter((_, i) => orientation[i] === 0)
        .map(slot => CLOCK[slot])
        .sort((a, b) => Number(a) - Number(b));
    }

    function parseClocksFromDescription(description: string) {
      const match = description.match(/(\d+)\s+and\s+(\d+)\s+o-?'?clock/i);
      if (!match) return null;
      return [match[1], match[2]].sort((a, b) => Number(a) - Number(b));
    }

    for (const c of look1OllCases) {
      const expectedClocks = holdClocksFor(c.primaryAlg);
      const descClocks = parseClocksFromDescription(c.description);

      if (expectedClocks.length === 2) {
        expect(descClocks).not.toBeNull();
        expect(descClocks!.join('&')).toBe(expectedClocks.join('&'));
      }
    }
  });

  it('Invariant 5: every 2-look sub-step plus its skip sums to 1', () => {
    const SUB_STEPS = [
      { label: 'OLL edges (Look 1)', cases: oll2Look, group: 'Edges (Look 1)' },
      { label: 'OLL corners (Look 2)', cases: oll2Look, group: 'Corners (Look 2)' },
      { label: 'PLL corners (Look 1)', cases: pll2Look, group: 'Corners (Look 1)' },
      { label: 'PLL edges (Look 2)', cases: pll2Look, group: 'Edges (Look 2)' },
    ];

    for (const { cases, group } of SUB_STEPS) {
      const members = cases.filter(c => c.group === group);
      expect(members.length).toBeGreaterThan(0);

      const [num, den] = sumFractions(members.map(c => parseFraction(c.probability, c.id)));
      expect(num).toBeLessThan(den); // Must not exceed 1, and remainder must be strictly positive for skip
    }
  });

  it('Invariant 6: no 2-look case displays a probability from another deck denominator', () => {
    const TWO_LOOK_DENOMINATORS = new Set([4, 8, 12, 27, 3, 6, 2]);
    for (const c of [...oll2Look, ...pll2Look]) {
      const [, den] = parseFraction(c.probability, c.id);
      expect(TWO_LOOK_DENOMINATORS.has(den)).toBe(true);
    }
  });

  it('Invariant 7: Look-2 OLL corner algorithms orient all top corners', () => {
    const look2OllCases = oll2Look.filter(c => c.group === 'Corners (Look 2)');
    expect(look2OllCases.length).toBe(7);

    for (const c of look2OllCases) {
      const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
      const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);

      for (const alg of getAllAlgs(c)) {
        const algTransf = kpuzzle.algToTransformation(new Alg(alg));
        const res = casePattern.applyTransformation(algTransf);

        let cornersOriented = false;
        for (const y of ['', "y'", 'y', 'y2']) {
          const pattern = y ? res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : res;
          const cOri = pattern.patternData.CORNERS.orientation.slice(0, 4);
          if (cOri.every((v: number) => v === 0)) {
            cornersOriented = true;
            break;
          }
        }
        expect(cornersOriented).toBe(true);
      }
    }
  });

  it('Invariant 8: Full OLL algorithms orient both top corners and top edges', () => {
    expect(ollFull.length).toBe(57);
    for (const c of ollFull) {
      const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
      const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);

      for (const alg of getAllAlgs(c)) {
        const algTransf = kpuzzle.algToTransformation(new Alg(alg));
        const res = casePattern.applyTransformation(algTransf);

        let fullyOriented = false;
        for (const y of ['', "y'", 'y', 'y2']) {
          const pattern = y ? res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : res;
          const cOri = pattern.patternData.CORNERS.orientation.slice(0, 4);
          const eOri = pattern.patternData.EDGES.orientation.slice(0, 4);
          if (cOri.every((v: number) => v === 0) && eOri.every((v: number) => v === 0)) {
            fullyOriented = true;
            break;
          }
        }
        expect(fullyOriented).toBe(true);
      }
    }
  });

  it('Invariant 9: Diagonal corner swap PLLs perform diagonal corner swap; T-perm on Y-perm fails', () => {
    const allPllCases = [...pll2Look, ...pllFull];
    const diagonalPllIds = ['pll-y', 'pll-v', 'pll-na', 'pll-nb', 'pll-2look-yperm'];

    for (const id of diagonalPllIds) {
      const c = allPllCases.find(item => item.id === id);
      expect(c).toBeDefined();
      const transf = kpuzzle.algToTransformation(new Alg(c!.primaryAlg));
      const cp = transf.transformationData.CORNERS.permutation.slice(0, 4);
      const movedCorners = [0, 1, 2, 3].filter(i => cp[i] !== i);
      const hasDiagonalSwap = movedCorners.some(i => Math.abs(i - cp[i]) === 2);
      expect(hasDiagonalSwap).toBe(true);
    }

    // Negative control: T-perm on pll-y must fail the diagonal swap assertion
    const tCase = allPllCases.find(item => item.id === 'pll-t');
    const tTransf = kpuzzle.algToTransformation(new Alg(tCase!.primaryAlg));
    const tCp = tTransf.transformationData.CORNERS.permutation.slice(0, 4);
    const tMoved = [0, 1, 2, 3].filter(i => tCp[i] !== i);
    const tHasDiagonalSwap = tMoved.some(i => Math.abs(i - tCp[i]) === 2);
    expect(tHasDiagonalSwap).toBe(false);
  });
});
