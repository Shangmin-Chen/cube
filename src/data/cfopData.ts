import type { AlgCase } from '../types/cube';

export const OLL_2LOOK_CASES: AlgCase[] = [
  // Edges (Orient Edges first if no yellow cross)
  {
    id: 'oll-2look-dot',
    name: 'Dot (No Edges)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "F (R U R' U') F' f (R U R' U') f'",
    alternativeAlgs: ["F (R U R' U') F' U2 F (R U R' U') F'"],
    description: 'Orient all 4 top edge pieces when no edges are oriented.',
    tips: 'Combine line OLL and L-shape OLL.',
    topGrid: ['G', 'G', 'G', 'G', 'Y', 'G', 'G', 'G', 'G'],
    borderColors: {
      top: ['G', 'Y', 'G'],
      right: ['G', 'Y', 'G'],
      bottom: ['G', 'Y', 'G'],
      left: ['G', 'Y', 'G'],
    }
  },
  {
    id: 'oll-2look-line',
    name: 'Line (Bar)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "F (R U R' U') F'",
    description: 'Hold the yellow line horizontally, then execute the alg.',
    tips: 'Shortest OLL alg to remember!',
    topGrid: ['G', 'Y', 'G', 'G', 'Y', 'G', 'G', 'Y', 'G'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'Y', 'G'],
      bottom: ['G', 'G', 'G'],
      left: ['G', 'Y', 'G'],
    }
  },
  {
    id: 'oll-2look-lshape',
    name: 'L-Shape (Small L)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "f (R U R' U') f'",
    alternativeAlgs: ["F (U R U' R') F'"],
    description: 'Hold the L at the top-left corner (9 o-clock and 12 o-clock).',
    tips: 'Same as Line alg, but with lowercase wide f turn.',
    topGrid: ['G', 'Y', 'G', 'Y', 'Y', 'G', 'G', 'G', 'G'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'Y', 'G'],
      bottom: ['G', 'Y', 'G'],
      left: ['G', 'G', 'G'],
    }
  },
  // Corners (Orient Corners once cross is completed)
  {
    id: 'oll-2look-sune',
    name: 'Sune',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R U R' U R U2 R'",
    description: '1 yellow corner pointing UP at front-left. Front corner sticker faces front.',
    tips: 'One of the most famous and fast algorithms in cubing.',
    topGrid: ['G', 'Y', 'G', 'Y', 'Y', 'Y', 'Y', 'Y', 'G'],
    borderColors: {
      top: ['G', 'G', 'Y'],
      right: ['G', 'G', 'G'],
      bottom: ['G', 'G', 'Y'],
      left: ['G', 'G', 'G'],
    }
  },
  {
    id: 'oll-2look-antisune',
    name: 'Anti-Sune',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R U2 R' U' R U' R'",
    alternativeAlgs: ["L' U' L U' L' U2 L"],
    description: '1 yellow corner pointing UP at back-left (or front-right facing right).',
    tips: 'Reverse Sune execution.',
    topGrid: ['G', 'Y', 'Y', 'Y', 'Y', 'Y', 'G', 'Y', 'G'],
    borderColors: {
      top: ['Y', 'G', 'G'],
      right: ['G', 'G', 'Y'],
      bottom: ['G', 'G', 'G'],
      left: ['Y', 'G', 'G'],
    }
  },
  {
    id: 'oll-2look-h',
    name: 'H Case (Double Sune)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R U2 R' U' R U R' U' R U' R'",
    alternativeAlgs: ["(R U R' U') x3", "F (R U R' U')3 F'"],
    description: '0 corners facing up. 2 pairs of headlights pointing front and back.',
    tips: 'Visualized as two opposing pairs of headlights.',
    topGrid: ['G', 'Y', 'G', 'Y', 'Y', 'Y', 'G', 'Y', 'G'],
    borderColors: {
      top: ['Y', 'G', 'Y'],
      right: ['G', 'G', 'G'],
      bottom: ['Y', 'G', 'Y'],
      left: ['G', 'G', 'G'],
    }
  },
  {
    id: 'oll-2look-pi',
    name: 'Pi (Bruno)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R U2 R2 U' R2 U' R2 U2 R",
    description: '0 corners facing up. Headlights on the left, opposing stickers on the right.',
    tips: 'Hold headlights on left side.',
    topGrid: ['G', 'Y', 'G', 'Y', 'Y', 'Y', 'G', 'Y', 'G'],
    borderColors: {
      top: ['G', 'G', 'Y'],
      right: ['Y', 'G', 'G'],
      bottom: ['G', 'G', 'Y'],
      left: ['Y', 'G', 'Y'],
    }
  },
  {
    id: 'oll-2look-headlights',
    name: 'Headlights (U Case)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R2 D R' U2 R D' R' U2 R'",
    alternativeAlgs: ["R2 D' R U2 R' D R U2 R"],
    description: '2 corners facing up on back side. Front 2 corners face front like headlights.',
    tips: 'Hold headlights facing you.',
    topGrid: ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'G', 'Y', 'G'],
    borderColors: {
      top: ['G', 'G', 'G'],
      right: ['G', 'G', 'G'],
      bottom: ['Y', 'G', 'Y'],
      left: ['G', 'G', 'G'],
    }
  },
  {
    id: 'oll-2look-chameleon',
    name: 'Chameleon (L Case)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "F R' F' r U R U' r'",
    alternativeAlgs: ["R U2 R2 F R F' U2 R' F R F'"],
    description: '2 corners facing up diagonally. Non-yellow sticker on front-left faces front.',
    tips: 'Diagonal yellow corners with front-left facing front.',
    topGrid: ['Y', 'Y', 'G', 'Y', 'Y', 'Y', 'G', 'Y', 'Y'],
    borderColors: {
      top: ['G', 'G', 'Y'],
      right: ['G', 'G', 'G'],
      bottom: ['Y', 'G', 'G'],
      left: ['G', 'G', 'G'],
    }
  },
  {
    id: 'oll-2look-bowtie',
    name: 'Bowtie (T Case)',
    category: 'oll',
    subcategory: '2-Look OLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "r U R' U' r' F R F'",
    alternativeAlgs: ["R U R' U' R' F R F'"],
    description: '2 corners facing up diagonally. Front-left corner faces left.',
    tips: 'Hold solved yellow corner on front-right.',
    topGrid: ['G', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'G'],
    borderColors: {
      top: ['Y', 'G', 'G'],
      right: ['G', 'G', 'G'],
      bottom: ['G', 'G', 'Y'],
      left: ['G', 'G', 'G'],
    }
  }
];

export const PLL_2LOOK_CASES: AlgCase[] = [
  // Corner Permutation (First look)
  {
    id: 'pll-2look-tperm',
    name: 'T Permutation (Headlights)',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "R U R' U' R' F R2 U' R' U' R U R' F'",
    description: 'Swaps two corners (front-right & back-right) and two edges. Creates headlights on the left.',
    tips: 'Hold headlights on the left side. Most useful PLL in speedcubing!',
    probability: '1/18'
  },
  {
    id: 'pll-2look-yperm',
    name: 'Y Permutation (No Headlights)',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Corners',
    is2Look: true,
    primaryAlg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    description: 'Swaps diagonal corners (front-left & back-right) when no headlights are present.',
    tips: 'Flows smoothly with standard triggers F (R U R\' U\') F\'.',
    probability: '1/18'
  },
  // Edge Permutation (Second look)
  {
    id: 'pll-2look-ua',
    name: 'Ua Permutation',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "R U' R U R U R U' R' U' R2",
    alternativeAlgs: ["M2 U M U2 M' U M2"],
    description: 'Cycles 3 edges counter-clockwise. Back side is solved.',
    tips: 'Hold solved side on back.',
    probability: '1/18'
  },
  {
    id: 'pll-2look-ub',
    name: 'Ub Permutation',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "R2 U R U R' U' R' U' R' U R'",
    alternativeAlgs: ["M2 U' M U2 M' U' M2"],
    description: 'Cycles 3 edges clockwise. Back side is solved.',
    tips: 'Hold solved side on back.',
    probability: '1/18'
  },
  {
    id: 'pll-2look-hperm',
    name: 'H Permutation',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "M2 U M2 U2 M2 U M2",
    alternativeAlgs: ["M2 U' M2 U2 M2 U' M2"],
    description: 'Swaps opposite edge pairs (Front/Back & Left/Right).',
    tips: 'Super fast slice moves (M2 U M2 U2 M2 U M2).',
    probability: '1/72'
  },
  {
    id: 'pll-2look-zperm',
    name: 'Z Permutation',
    category: 'pll',
    subcategory: '2-Look PLL',
    group: 'Edges',
    is2Look: true,
    primaryAlg: "M' U M2 U M2 U M' U2 M2",
    alternativeAlgs: ["M2 U M2 U M' U2 M2 U2 M'"],
    description: 'Swaps adjacent edge pairs (Front/Right & Back/Left).',
    tips: 'Hold two edges to swap on Front and Right.',
    probability: '1/36'
  }
];

export const FULL_PLL_CASES: AlgCase[] = [
  ...PLL_2LOOK_CASES,
  {
    id: 'pll-aa',
    name: 'Aa Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "x R' D R' U2 R D' R' U2 R2 x'",
    alternativeAlgs: ["l' U R' D2 R U' R' D2 R2"],
    description: 'Cycles 3 corners counter-clockwise.',
    probability: '1/18'
  },
  {
    id: 'pll-ab',
    name: 'Ab Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "x R2 U2 R' D' R U2 R' D R' x'",
    alternativeAlgs: ["x' R2 D2 R' U' R D2 R' U R' x"],
    description: 'Cycles 3 corners clockwise.',
    probability: '1/18'
  },
  {
    id: 'pll-e',
    name: 'E Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Diagonal Corners',
    primaryAlg: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    description: 'Swaps front-left with front-right and back-left with back-right.',
    probability: '1/36'
  },
  {
    id: 'pll-f',
    name: 'F Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    description: 'Swaps 2 corners and 2 edges on one side. Looks like T-perm setup.',
    probability: '1/18'
  },
  {
    id: 'pll-ga',
    name: 'Ga Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'G Perms',
    primaryAlg: "R2 u R' U R' U' R u' R2 F' U F",
    alternativeAlgs: ["R2 U R' U R' U' R U' R2 D U' R' U R D'"],
    description: 'Headlights on left, block on front-right.',
    probability: '1/18'
  },
  {
    id: 'pll-gb',
    name: 'Gb Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'G Perms',
    primaryAlg: "F' U' F R2 u R' U R U' R u' R2",
    alternativeAlgs: ["R' U' R U D' R2 U R' U R U' R U' R2 D"],
    description: 'Headlights on left, block on back-right.',
    probability: '1/18'
  },
  {
    id: 'pll-gc',
    name: 'Gc Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'G Perms',
    primaryAlg: "R2 u' R U' R U R' u R2 F U' F'",
    alternativeAlgs: ["R2 U' R U' R U R' U R2 D' U R U' R' D"],
    description: 'Headlights on left, block on front-left.',
    probability: '1/18'
  },
  {
    id: 'pll-gd',
    name: 'Gd Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'G Perms',
    primaryAlg: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    description: 'Headlights on left, block on back-left.',
    probability: '1/18'
  },
  {
    id: 'pll-ja',
    name: 'Ja Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "x R2 F R F' R U2 r' U r U2 x'",
    alternativeAlgs: ["R' U L' U2 R U' R' U2 R L"],
    description: '1x2 block on front-left.',
    probability: '1/18'
  },
  {
    id: 'pll-jb',
    name: 'Jb Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "R U R' F' R U R' U' R' F R2 U' R'",
    description: '1x2 block on front-right. Very fast and popular algorithm.',
    probability: '1/18'
  },
  {
    id: 'pll-na',
    name: 'Na Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Diagonal Corners',
    primaryAlg: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    alternativeAlgs: ["z U R' D R2 U' R D' U R' D R2 U' R D' z'"],
    description: 'Swaps opposite corners & edges. 2 solved blocks on opposite sides.',
    probability: '1/72'
  },
  {
    id: 'pll-nb',
    name: 'Nb Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Diagonal Corners',
    primaryAlg: "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    alternativeAlgs: ["R' U L' U2 R U' L R' U L' U2 R U' L"],
    description: 'Mirror of Na perm.',
    probability: '1/72'
  },
  {
    id: 'pll-ra',
    name: 'Ra Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "R U R' F' R U2 R' U2 R' F R U R U2 R'",
    alternativeAlgs: ["R U2 R' U2 R B' R' U' R U R B R2"],
    description: 'Headlights on left, bar on front.',
    probability: '1/18'
  },
  {
    id: 'pll-rb',
    name: 'Rb Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Adjacent Corners',
    primaryAlg: "R' U2 R U2 R' F R U R' U' R' F' R2",
    description: 'Headlights on left, bar on back.',
    probability: '1/18'
  },
  {
    id: 'pll-v',
    name: 'V Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Diagonal Corners',
    primaryAlg: "R' U R' U' y R' F' R2 U' R' U R' F R F",
    alternativeAlgs: ["R' U R' U' B' R' B2 U' R' U R' B R B"],
    description: 'Diagonal swap with a 2x2 block solved on back-left.',
    probability: '1/18'
  },
  {
    id: 'pll-w',
    name: 'W Permutation',
    category: 'pll',
    subcategory: 'Full PLL',
    group: 'Diagonal Corners',
    primaryAlg: "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2",
    alternativeAlgs: ["R U R' F' R U R' U' R' F R U' R' F R F'"],
    description: 'No headlights, staircase pattern of matching colors.',
    probability: '1/18'
  }
];

export const F2L_HIGHLIGHTS: AlgCase[] = [
  {
    id: 'f2l-basic-1',
    name: 'Basic Pair in Top Layer (Easy Insertion)',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Connected Pair',
    primaryAlg: "U R U' R'",
    description: 'Corner and edge are already paired up in the top layer.',
    tips: 'Rotate top face to align above target slot, then insert using U R U\' R\' or U\' L\' U L.'
  },
  {
    id: 'f2l-basic-2',
    name: 'Corner Up, Edge in Top Layer',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'White Up',
    primaryAlg: "R U2 R' U' R U R'",
    description: 'White sticker points UP on the top layer.',
    tips: 'Align edge color with center, push corner away, pair up, then insert.'
  },
  {
    id: 'f2l-basic-3',
    name: 'Separated Pair (Different Top Colors)',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Different Colors',
    primaryAlg: "R U R'",
    description: 'Corner white sticker faces side, edge top color differs from corner top color.',
    tips: 'Hide corner in back slot, match edge, bring corner back.'
  },
  {
    id: 'f2l-basic-4',
    name: 'Separated Pair (Same Top Color)',
    category: 'f2l',
    subcategory: 'Basic F2L',
    group: 'Same Colors',
    primaryAlg: "U' R U2 R' U2 R U' R'",
    description: 'Both top stickers have the SAME color.',
    tips: 'Set up into a connected pair, then insert.'
  }
];
