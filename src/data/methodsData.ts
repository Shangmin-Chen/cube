import type { AlgMethod } from '../types/cube';

export const ROUX_METHOD: AlgMethod = {
  id: 'roux',
  name: 'Roux Method (Coming Soon)',
  description: 'Blockbuilding system (First Block, Second Block, CMLL, LSE)',
  steps: [
    { id: 'fb', label: 'Step 1: First Block (FB)', description: 'Build 1x2x3 block on Left' },
    { id: 'sb', label: 'Step 2: Second Block (SB)', description: 'Build 1x2x3 block on Right' },
    { id: 'cmll', label: 'Step 3: CMLL', description: 'Corners of Last Layer without regard to M-slice' },
    { id: 'lse', label: 'Step 4: LSE', description: 'Last Six Edges using M and U turns' },
  ],
  cases: [],
  isAvailable: false,
};

export const ZZ_METHOD: AlgMethod = {
  id: 'zz',
  name: 'ZZ Method (Coming Soon)',
  description: 'EO-first system (EO-Line, F2L / ZZF2L, COLL / ZBLL)',
  steps: [
    { id: 'eoline', label: 'Step 1: EO-Line', description: 'Orient all 12 edges and place DF and DB line' },
    { id: 'zzf2l', label: 'Step 2: ZZ-F2L', description: 'Solve Left and Right 1x2x3 blocks with R, U, L turns only' },
    { id: 'll', label: 'Step 3: Last Layer', description: 'COLL / EPLL or 1-look ZBLL' },
  ],
  cases: [],
  isAvailable: false,
};

export const TWO_BY_TWO_METHOD: AlgMethod = {
  id: '2x2',
  name: '2x2 Methods (Coming Soon)',
  description: 'Fast 2x2 solving methods (First Face, OLL, PBL / CLL)',
  steps: [
    { id: 'face', label: 'Step 1: First Face', description: 'Solve any solid face (orientation only)' },
    { id: 'oll2', label: 'Step 2: 2x2 OLL', description: 'Orient opposite face corners' },
    { id: 'pbl', label: 'Step 3: PBL', description: 'Permute both layers simultaneously' },
  ],
  cases: [],
  isAvailable: false,
};

export const BUILTIN_METHODS: AlgMethod[] = [
  ROUX_METHOD,
  ZZ_METHOD,
  TWO_BY_TWO_METHOD,
];
