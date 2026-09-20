import type { AlgCase, MethodStep, AlgMethod } from '../types/cube';
import oll2LookJson from './generated/oll-2look.json';
import pll2LookJson from './generated/pll-2look.json';
import ollFullJson from './generated/oll-full.json';
import pllFullJson from './generated/pll-full.json';
import { validateAlgCases } from './validateAlgCase';

export const CROSS_CASES: AlgCase[] = [
  {
    id: 'cross-top-white-up',
    name: 'Top Layer, White Facing Up',
    category: 'cross',
    subcategory: 'Cross (C)',
    group: 'Top Layer Insertion',
    primaryAlg: 'F2',
    description: 'The front cross edge sits at UF with its white sticker facing up. The other three cross edges are already solved.',
    tips: 'Turn U until the edge sits directly above its empty slot, then drop it in with a half turn of that face.',
    why: 'A half turn swaps UF straight into DF, and because it is a 180 degree turn the white sticker stays on the up-down axis and arrives facing down.',
  },
  {
    id: 'cross-top-white-side',
    name: 'Top Layer, White Facing Out',
    category: 'cross',
    subcategory: 'Cross (C)',
    group: 'Top Layer Insertion',
    primaryAlg: "R' F R",
    description: 'The front cross edge sits at UR with its white sticker facing out to the right instead of up.',
    tips: 'A misoriented top edge needs three moves. Dropping it straight down would leave white facing sideways.',
    why: "R' lowers the edge from UR into the FR middle slot, F rotates it down into DF with white now facing the floor, and R restores the right layer.",
  },
  {
    id: 'cross-middle-fr',
    name: 'Trapped in the Front-Right Slot',
    category: 'cross',
    subcategory: 'Cross (C)',
    group: 'Middle Layer Extraction',
    primaryAlg: "D R' D'",
    description: 'The front cross edge is trapped in the FR middle-layer slot. The other three cross edges are already solved.',
    tips: 'Move the finished cross out of the way before extracting, then bring it straight back. Never drop an edge onto a solved cross slot.',
    why: "D turns the solved cross so its empty slot arrives at DR, R' drops the trapped edge straight down into that slot, and D' rotates the cross back to its original alignment carrying the edge into DF.",
  },
  {
    id: 'cross-bottom-flipped',
    name: 'In Its Slot but Flipped',
    category: 'cross',
    subcategory: 'Cross (C)',
    group: 'Reorientation',
    primaryAlg: "D R D' F",
    description: 'The front cross edge is already in the DF slot but flipped, so its white sticker faces front instead of down.',
    tips: 'A flipped edge cannot be fixed in place. It has to leave the bottom layer and come back the other way round.',
    why: "D and R lift the flipped edge out of the bottom layer into the FR middle slot, D' restores the cross alignment, and F rotates the edge into DF the opposite way so white finishes facing down.",
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
  },
];

export const OLL_2LOOK_CASES: AlgCase[] = validateAlgCases(oll2LookJson, 'oll-2look.json');
export const PLL_2LOOK_CASES: AlgCase[] = validateAlgCases(pll2LookJson, 'pll-2look.json');
export const OLL_FULL_CASES: AlgCase[] = validateAlgCases(ollFullJson, 'oll-full.json');
export const FULL_PLL_CASES: AlgCase[] = validateAlgCases(pllFullJson, 'pll-full.json');

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

