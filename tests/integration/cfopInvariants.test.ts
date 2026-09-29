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

function f2lIsIntact(transf: any): boolean {
  const cp = transf.transformationData.CORNERS.permutation.slice(4);
  const co = transf.transformationData.CORNERS.orientationDelta.slice(4);
  const ep = transf.transformationData.EDGES.permutation.slice(4);
  const eo = transf.transformationData.EDGES.orientationDelta.slice(4);

  return (
    cp.every((val: number, idx: number) => val === idx + 4) &&
    co.every((val: number) => val === 0) &&
    ep.every((val: number, idx: number) => val === idx + 4) &&
    eo.every((val: number) => val === 0)
  );
}

function patternF2LIsIntact(pattern: any): boolean {
  const cp = pattern.patternData.CORNERS.pieces.slice(4);
  const co = pattern.patternData.CORNERS.orientation.slice(4);
  const ep = pattern.patternData.EDGES.pieces.slice(4);
  const eo = pattern.patternData.EDGES.orientation.slice(4);

  return (
    cp.every((val: number, idx: number) => val === idx + 4) &&
    co.every((val: number) => val === 0) &&
    ep.every((val: number, idx: number) => val === idx + 4) &&
    eo.every((val: number) => val === 0)
  );
}

function isDiagonalCornerSwap(kpuzzle: any, algStr: string): boolean {
  for (const auf of ['', 'U', 'U2', "U'"]) {
    const transf = kpuzzle.algToTransformation(new Alg(algStr + (auf ? ' ' + auf : '')));
    const cp = transf.transformationData.CORNERS.permutation.slice(0, 4);
    const movedCorners = [0, 1, 2, 3].filter((i: number) => cp[i] !== i);
    if (movedCorners.length === 2 && Math.abs(movedCorners[0] - cp[movedCorners[0]]) === 2) {
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
    const lshapeCase = byId['oll-2look-lshape'];
    const suneAlg = oll2Look.find(c => c.id === 'oll-2look-sune')?.primaryAlg ?? "R U R' U R U2 R'";

    const controls = [
      { caseAlg: dotCase.primaryAlg, alg: lineCase.primaryAlg },
      { caseAlg: dotCase.primaryAlg, alg: suneAlg },
      { caseAlg: lineCase.primaryAlg, alg: lshapeCase.primaryAlg },
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

  it('OLL F2L invariant: all 67 OLL algorithms leave bottom two layers intact', () => {
    const allOllCases = [...oll2Look, ...ollFull];
    let count = 0;
    for (const c of allOllCases) {
      for (const alg of getAllAlgs(c)) {
        const transf = kpuzzle.algToTransformation(new Alg(alg));
        expect(f2lIsIntact(transf)).toBe(true);
        count++;
      }
    }
    expect(count).toBe(115);
  });

  it('Invariant 7: Look-2 OLL corner algorithms orient all top corners', () => {
    const look2OllCases = oll2Look.filter(c => c.group === 'Corners (Look 2)');
    expect(look2OllCases.length).toBe(7);

    // Negative controls:
    // 1. Look-1 alg (flips edges) on Look-2 corner case (e.g. Sune)
    const suneCase = look2OllCases.find(c => c.id === 'oll-2look-sune')!;
    const suneCaseTransf = kpuzzle.algToTransformation(new Alg(suneCase.primaryAlg)).invert();
    const suneCasePattern = kpuzzle.defaultPattern().applyTransformation(suneCaseTransf);

    const lineCase = oll2Look.find(c => c.id === 'oll-2look-line')!;
    const lineTransf = kpuzzle.algToTransformation(new Alg(lineCase.primaryAlg));
    expect(lineTransf.transformationData.EDGES.orientationDelta.slice(0, 4).every((v: number) => v === 0)).toBe(false);

    const lineRes = suneCasePattern.applyTransformation(lineTransf);
    let lineOrientsCorners = false;
    for (const y of ['', "y'", 'y', 'y2']) {
      const p = y ? lineRes.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : lineRes;
      if (p.patternData.CORNERS.orientation.slice(0, 4).every((v: number) => v === 0)) {
        lineOrientsCorners = true;
        break;
      }
    }
    expect(lineOrientsCorners).toBe(false);

    // 2. PLL alg (T-perm) on Look-2 corner case
    const tCase = pll2Look.find(c => c.id === 'pll-2look-tperm')!;
    const tTransf = kpuzzle.algToTransformation(new Alg(tCase.primaryAlg));
    expect(tTransf.transformationData.CORNERS.orientationDelta.slice(0, 4).some((v: number) => v !== 0)).toBe(false);

    const tRes = suneCasePattern.applyTransformation(tTransf);
    let tOrientsCorners = false;
    for (const y of ['', "y'", 'y', 'y2']) {
      const p = y ? tRes.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : tRes;
      if (p.patternData.CORNERS.orientation.slice(0, 4).every((v: number) => v === 0)) {
        tOrientsCorners = true;
        break;
      }
    }
    expect(tOrientsCorners).toBe(false);

    // Invariant check on all 7 cases and 11 variations
    let invariant7Count = 0;
    for (const c of look2OllCases) {
      const caseTransf = kpuzzle.algToTransformation(new Alg(c.primaryAlg)).invert();
      const casePattern = kpuzzle.defaultPattern().applyTransformation(caseTransf);

      // Case state invariant: top edges already oriented, top corners misoriented.
      // Note: primaryAlg solves casePattern by construction (X^-1 * X = I);
      // setup state discrimination (exact corner counts) and alternative checks are load-bearing.
      expect(casePattern.patternData.EDGES.orientation.slice(0, 4).every((v: number) => v === 0)).toBe(true);
      expect(casePattern.patternData.CORNERS.orientation.slice(0, 4).some((v: number) => v !== 0)).toBe(true);

      const orientedCornerCount = casePattern.patternData.CORNERS.orientation
        .slice(0, 4)
        .filter((v: number) => v === 0).length;
      if (c.id === 'oll-2look-sune' || c.id === 'oll-2look-antisune') {
        expect(orientedCornerCount).toBe(1);
      } else if (c.id === 'oll-2look-h' || c.id === 'oll-2look-pi') {
        expect(orientedCornerCount).toBe(0);
      } else if (
        c.id === 'oll-2look-headlights' ||
        c.id === 'oll-2look-chameleon' ||
        c.id === 'oll-2look-bowtie'
      ) {
        expect(orientedCornerCount).toBe(2);
      } else {
        throw new Error(`Unexpected Look-2 OLL case: ${c.id}`);
      }

      for (const alg of getAllAlgs(c)) {
        const algTransf = kpuzzle.algToTransformation(new Alg(alg));

        // Intrinsic variation properties: preserves top edges, changes corners, preserves F2L
        expect(algTransf.transformationData.EDGES.orientationDelta.slice(0, 4).every((v: number) => v === 0)).toBe(true);
        expect(algTransf.transformationData.CORNERS.orientationDelta.slice(0, 4).some((v: number) => v !== 0)).toBe(true);
        expect(f2lIsIntact(algTransf)).toBe(true);

        const res = casePattern.applyTransformation(algTransf);
        expect(patternF2LIsIntact(res)).toBe(true);

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
        invariant7Count++;
      }
    }
    expect(invariant7Count).toBe(11);
  });

  it('Invariant 8: Full OLL algorithms orient both top corners and top edges', () => {
    expect(ollFull.length).toBe(57);

    // Negative controls:
    // 1. PLL alg (T-perm) setup has no misoriented pieces
    const tCase = pll2Look.find(c => c.id === 'pll-2look-tperm')!;
    const tTransf = kpuzzle.algToTransformation(new Alg(tCase.primaryAlg));
    const tCasePattern = kpuzzle.defaultPattern().applyTransformation(tTransf.invert());
    const tMisoriented =
      tCasePattern.patternData.EDGES.orientation.slice(0, 4).some((v: number) => v !== 0) ||
      tCasePattern.patternData.CORNERS.orientation.slice(0, 4).some((v: number) => v !== 0);
    expect(tMisoriented).toBe(false);

    // 2. Applying T-perm to OLL 1 casePattern must fail the full orientation check
    const oll1Case = ollFull.find(c => c.id === 'oll-1')!;
    const oll1CaseTransf = kpuzzle.algToTransformation(new Alg(oll1Case.primaryAlg)).invert();
    const oll1CasePattern = kpuzzle.defaultPattern().applyTransformation(oll1CaseTransf);
    const oll1Res = oll1CasePattern.applyTransformation(tTransf);
    let oll1Oriented = false;
    for (const y of ['', "y'", 'y', 'y2']) {
      const p = y ? oll1Res.applyTransformation(kpuzzle.algToTransformation(new Alg(y))) : oll1Res;
      const cOri = p.patternData.CORNERS.orientation.slice(0, 4);
      const eOri = p.patternData.EDGES.orientation.slice(0, 4);
      if (cOri.every((v: number) => v === 0) && eOri.every((v: number) => v === 0)) {
        oll1Oriented = true;
        break;
      }
    }
    expect(oll1Oriented).toBe(false);

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

      // Case state invariant: at least one top piece is misoriented.
      // Note: primaryAlg solves casePattern by construction (X^-1 * X = I);
      // setup state discrimination (Dot/Cross edge counts) and alternative checks are load-bearing.
      const topMisoriented =
        casePattern.patternData.EDGES.orientation.slice(0, 4).some((v: number) => v !== 0) ||
        casePattern.patternData.CORNERS.orientation.slice(0, 4).some((v: number) => v !== 0);
      expect(topMisoriented).toBe(true);

      const orientedEdgeCount = casePattern.patternData.EDGES.orientation
        .slice(0, 4)
        .filter((v: number) => v === 0).length;
      if (dotCaseIds.has(c.id)) {
        expect(orientedEdgeCount).toBe(0);
      }
      if (crossCaseIds.has(c.id)) {
        expect(orientedEdgeCount).toBe(4);
      }

      for (const alg of getAllAlgs(c)) {
        const algTransf = kpuzzle.algToTransformation(new Alg(alg));
        expect(f2lIsIntact(algTransf)).toBe(true);

        const res = casePattern.applyTransformation(algTransf);
        expect(patternF2LIsIntact(res)).toBe(true);

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
        invariant8Count++;
      }
    }
    expect(invariant8Count).toBe(98);
  });

  it('Invariant 9: Diagonal corner swap PLLs perform diagonal corner swap; T-perm on Y-perm fails', () => {
    const allPllCases = [...pll2Look, ...pllFull];
    const diagonalPllIds = ['pll-y', 'pll-v', 'pll-na', 'pll-nb', 'pll-2look-yperm'];
    let invariant9Count = 0;

    for (const id of diagonalPllIds) {
      const c = allPllCases.find(item => item.id === id);
      expect(c).toBeDefined();
      for (const alg of getAllAlgs(c!)) {
        expect(isDiagonalCornerSwap(kpuzzle, alg)).toBe(true);
        invariant9Count++;
      }
    }
    expect(invariant9Count).toBe(12);

    // Negative control: T-perm on pll-y must fail the diagonal swap assertion
    const tCase = allPllCases.find(item => item.id === 'pll-t');
    expect(isDiagonalCornerSwap(kpuzzle, tCase!.primaryAlg)).toBe(false);
  });
});
