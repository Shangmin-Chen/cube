import type { AlgCase, MethodStep, AlgMethod } from './types.ts';
import { CROSS_CASES } from './data/cross.ts';
import { F2L_HIGHLIGHTS } from './data/f2l.ts';
import oll2LookJson from './data/oll-2look.json' with { type: 'json' };
import pll2LookJson from './data/pll-2look.json' with { type: 'json' };
import ollFullJson from './data/oll-full.json' with { type: 'json' };
import pllFullJson from './data/pll-full.json' with { type: 'json' };

export * from './types.ts';
export { CROSS_CASES } from './data/cross.ts';
export { F2L_HIGHLIGHTS } from './data/f2l.ts';

export const OLL_2LOOK_CASES: AlgCase[] = oll2LookJson as unknown as AlgCase[];
export const PLL_2LOOK_CASES: AlgCase[] = pll2LookJson as unknown as AlgCase[];
export const OLL_FULL_CASES: AlgCase[] = ollFullJson as unknown as AlgCase[];
export const FULL_PLL_CASES: AlgCase[] = pllFullJson as unknown as AlgCase[];

export { oll2LookJson, pll2LookJson, ollFullJson, pllFullJson };

export const CFOP_STEPS: MethodStep[] = [
  { id: 'cross', label: 'Step 1: CROSS', description: 'Solve bottom 4 cross edges aligned with side centers' },
  { id: 'f2l', label: 'Step 2: F2L', description: 'Solve first two layers simultaneously (corner + edge pairs)' },
  { id: 'oll', label: 'Step 3: OLL', description: 'Orient last layer yellow pieces' },
  { id: 'pll', label: 'Step 4: PLL', description: 'Permute last layer yellow pieces into solved state' },
];

/**
 * 4-Look LL (Beginner CFOP): Cross (4), F2L (4), 2-Look OLL (10), 2-Look PLL (6) = 24 cases
 */
export const CFOP_4LOOK_METHOD: AlgMethod = {
  id: 'cfop-4look',
  name: '4-Look LL (Beginner CFOP)',
  description: 'Beginner CFOP: Cross, F2L, 2-Look OLL (10 algs), 2-Look PLL (6 algs)',
  steps: CFOP_STEPS,
  cases: [
    ...CROSS_CASES,
    ...F2L_HIGHLIGHTS,
    ...OLL_2LOOK_CASES,
    ...PLL_2LOOK_CASES,
  ],
  isAvailable: true,
};

/**
 * 3-Look LL (Intermediate CFOP): Cross (4), F2L (4), 2-Look OLL (10), Full PLL (21) = 39 cases
 */
export const CFOP_3LOOK_METHOD: AlgMethod = {
  id: 'cfop-3look',
  name: '3-Look LL (Intermediate CFOP)',
  description: 'Intermediate CFOP: Cross, F2L, 2-Look OLL (10 algs), Full PLL (21 algs)',
  steps: CFOP_STEPS,
  cases: [
    ...CROSS_CASES,
    ...F2L_HIGHLIGHTS,
    ...OLL_2LOOK_CASES,
    ...FULL_PLL_CASES,
  ],
  isAvailable: true,
};

/**
 * 2-Look LL (Full CFOP): Cross (4), F2L (4), Full OLL (57), Full PLL (21) = 86 cases
 */
export const CFOP_2LOOK_METHOD: AlgMethod = {
  id: 'cfop-2look',
  name: '2-Look LL (Full CFOP)',
  description: 'Advanced CFOP: Cross, F2L, Full OLL (57 algs), Full PLL (21 algs)',
  steps: CFOP_STEPS,
  cases: [
    ...CROSS_CASES,
    ...F2L_HIGHLIGHTS,
    ...OLL_FULL_CASES,
    ...FULL_PLL_CASES,
  ],
  isAvailable: true,
};

export const BUILTIN_METHODS: AlgMethod[] = [
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
];
