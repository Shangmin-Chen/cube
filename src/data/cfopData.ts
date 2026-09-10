import type { AlgCase, MethodStep, AlgMethod } from '../types/cube';
import oll2LookJson from './generated/oll-2look.json';
import pll2LookJson from './generated/pll-2look.json';
import ollFullJson from './generated/oll-full.json';
import pllFullJson from './generated/pll-full.json';

export const CROSS_CASES: AlgCase[] = [
  {
    id: 'cross-sample-1',
    name: 'Bottom Cross Edge Insertion',
    category: 'cross',
    subcategory: 'Cross (C)',
    group: 'Cross Step',
    primaryAlg: 'D2 R F L B',
    description: 'Align bottom cross edge with center and insert into bottom white face.',
    tips: 'Always solve the cross on bottom during inspection.',
    why: 'D2 aligns bottom centers while R F L B places all four edge stickers directly into white bottom face.',
    topGrid: ['G', 'G', 'G', 'G', 'W', 'G', 'G', 'G', 'G'],
    borderColors: {
      top: ['G', 'G_GREEN', 'G'],
      right: ['G', 'R', 'G'],
      bottom: ['G', 'B', 'G'],
      left: ['G', 'O', 'G'],
    },
  },
];

export const F2L_HIGHLIGHTS: AlgCase[] = [
  {
    id: 'f2l-basic-1',
    name: 'Basic Pair in Top Layer',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Connected Pair',
    primaryAlg: "U R U' R'",
    description: 'Corner and edge are connected in top layer.',
    tips: 'Align pair above slot, then insert.',
    why: "Direct slot insertion (U R U' R') taking advantage of pre-aligned corner and edge.",
    topGrid: ['G', 'G', 'G', 'G', 'Y', 'R', 'G', 'G', 'R'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'G_GREEN', 'W'],
      bottom: ['G', 'G', 'G_GREEN'],
      left: ['G', 'G', 'G'],
    },
  },
  {
    id: 'f2l-basic-2',
    name: 'Corner Up, Edge in Top Layer',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'White Up',
    primaryAlg: "R U2 R' U' R U R'",
    description: 'White sticker points UP on top layer.',
    tips: 'Align edge with side center, push corner away, pair & insert.',
    why: "R U2 R' separates corner and edge, matches side colors, then inserts pair.",
    topGrid: ['G', 'G', 'G', 'G', 'Y', 'G_GREEN', 'G', 'G', 'W'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'R', 'G_GREEN'],
      bottom: ['G', 'G', 'R'],
      left: ['G', 'G', 'G'],
    },
  },
  {
    id: 'f2l-basic-3',
    name: 'Separated Pair (Different Colors)',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Different Colors',
    primaryAlg: "R U R'",
    description: 'White sticker faces side, different top colors.',
    tips: 'Hide corner, match edge, bring back.',
    why: "R U R' hides corner in back slot to match edge orientation before inserting.",
    topGrid: ['G', 'G', 'G', 'R', 'Y', 'G', 'G', 'G', 'G_GREEN'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'G', 'R'],
      bottom: ['G', 'G', 'W'],
      left: ['G', 'G_GREEN', 'G'],
    },
  },
  {
    id: 'f2l-basic-4',
    name: 'Separated Pair (Same Top Color)',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Same Colors',
    primaryAlg: "U' R U2 R' U2 R U' R'",
    description: 'Both top stickers have SAME color.',
    tips: 'Form connected pair then insert.',
    why: "U' R U2 R' sets up connected pair in top layer, then inserts cleanly.",
    topGrid: ['G', 'R', 'G', 'G', 'Y', 'G', 'G', 'G', 'R'],
    borderColors: {
      top: ['G', 'G_GREEN', 'G'],
      right: ['G', 'G', 'W'],
      bottom: ['G', 'G', 'G_GREEN'],
      left: ['G', 'G', 'G'],
    },
  },
];

export const OLL_2LOOK_CASES: AlgCase[] = oll2LookJson as AlgCase[];
export const PLL_2LOOK_CASES: AlgCase[] = pll2LookJson as AlgCase[];
export const OLL_FULL_CASES: AlgCase[] = ollFullJson as AlgCase[];
export const FULL_PLL_CASES: AlgCase[] = pllFullJson as AlgCase[];

export const CFOP_STEPS: MethodStep[] = [
  { id: 'cross', label: 'Step 1: CROSS', description: 'Solve bottom 4 cross edges aligned with side centers' },
  { id: 'f2l', label: 'Step 2: F2L', description: 'Solve first two layers simultaneously (corner + edge pairs)' },
  { id: 'oll', label: 'Step 3: OLL', description: 'Orient last layer yellow pieces' },
  { id: 'pll', label: 'Step 4: PLL', description: 'Permute last layer yellow pieces into solved state' },
];

/**
 * 4-Look LL (Beginner CFOP): Cross (1), F2L (4), 2-Look OLL (10), 2-Look PLL (6) = 21 cases
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
 * 3-Look LL (Intermediate CFOP): Cross (1), F2L (4), 2-Look OLL (10), Full PLL (21) = 36 cases
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
 * 2-Look LL (Full CFOP): Cross (1), F2L (4), Full OLL (57), Full PLL (21) = 83 cases
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

// Aliases for backwards compatibility and default routing
export const CFOP_METHOD: AlgMethod = CFOP_4LOOK_METHOD;
export const ALL_CFOP_CASES: AlgCase[] = CFOP_4LOOK_METHOD.cases;
