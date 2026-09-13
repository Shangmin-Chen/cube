export type TriggerType =
  | 'sexy'
  | 'wide-sexy'
  | 'inverse-sexy'
  | 'left-sexy'
  | 'sledge'
  | 'wide-sledge'
  | 'hedge'
  | 'sune'
  | 'palindrome'
  | 'normal';

export interface TriggerPattern {
  pattern: string;
  tokens: readonly string[];
  badgeLabel: string;
  chunkName: string;
  description: string;
  type: Exclude<TriggerType, 'palindrome' | 'normal'>;
}

/** Longest patterns first so shorter prefixes are shadowed during matching. */
export const TRIGGER_PATTERNS: readonly TriggerPattern[] = [
  {
    pattern: "R U R' U R U' R' U R U2 R'",
    tokens: ['R', 'U', "R'", 'U', 'R', "U'", "R'", 'U', 'R', 'U2', "R'"],
    badgeLabel: 'Double Sune',
    chunkName: 'Double Sune',
    description:
      "Chained Sune trigger where U2 R' + R U cancels R' R and combines U2 U into U'.",
    type: 'sune',
  },
  {
    pattern: "R U R' U R U2 R'",
    tokens: ['R', 'U', "R'", 'U', 'R', 'U2', "R'"],
    badgeLabel: 'Sune',
    chunkName: 'Sune Trigger',
    description:
      'Lifts F2L pair, spins top layer 360°, and re-slots pair. Cycles 3 corners.',
    type: 'sune',
  },
  {
    pattern: "R U2 R' U' R U' R'",
    tokens: ['R', 'U2', "R'", "U'", 'R', "U'", "R'"],
    badgeLabel: 'Anti-Sune',
    chunkName: 'Anti-Sune Trigger',
    description: 'Inverse Sune trigger. Pushes pair 2 steps left then returns home.',
    type: 'sune',
  },
  {
    pattern: "R U R' U'",
    tokens: ['R', 'U', "R'", "U'"],
    badgeLabel: 'Sexy Move',
    chunkName: 'Sexy Move',
    description: 'Pops Front-Right F2L pair out to top layer and shifts U face left.',
    type: 'sexy',
  },
  {
    pattern: "r U R' U'",
    tokens: ['r', 'U', "R'", "U'"],
    badgeLabel: 'Wide Sexy',
    chunkName: 'Wide Sexy Move',
    description: 'Double-layer Wide Sexy move used in OLL to orient slice edges.',
    type: 'wide-sexy',
  },
  {
    pattern: "U R U' R'",
    tokens: ['U', 'R', "U'", "R'"],
    badgeLabel: 'Inverse Sexy',
    chunkName: 'Inverse Sexy Move',
    description: 'Inverse order Sexy Move trigger.',
    type: 'inverse-sexy',
  },
  {
    pattern: "L' U' L U",
    tokens: ["L'", "U'", 'L', 'U'],
    badgeLabel: 'Left Sexy',
    chunkName: 'Left-Handed Sexy',
    description: 'Left-handed mirrored Sexy Move trigger.',
    type: 'left-sexy',
  },
  {
    pattern: "r' F R F'",
    tokens: ["r'", 'F', 'R', "F'"],
    badgeLabel: 'Wide Sledge',
    chunkName: 'Wide Sledgehammer',
    description: 'Wide double-layer Sledgehammer trigger.',
    type: 'wide-sledge',
  },
  {
    pattern: "R' F R F'",
    tokens: ["R'", 'F', 'R', "F'"],
    badgeLabel: 'Sledgehammer',
    chunkName: 'Sledgehammer',
    description: 'Rotates FR slot and flips top-front edge sticker orientation.',
    type: 'sledge',
  },
  {
    pattern: "F R' F' R",
    tokens: ['F', "R'", "F'", 'R'],
    badgeLabel: 'Hedgeslammer',
    chunkName: 'Hedgeslammer',
    description: 'Front-face inverse sledgehammer trigger.',
    type: 'hedge',
  },
];

export const MIN_PALINDROME_MOVES = 5;

export function tokenizeAlgMoves(movesStr: string): string[] {
  const clean = movesStr.replace(/[(){}]/g, ' ').trim();
  if (!clean) return [];
  return clean.split(/\s+/).filter(Boolean);
}

export function normalizeTriggerLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CHUNK_NAME_TO_BADGE: Record<string, string> = {
  'double sune': 'Double Sune',
  'sune trigger': 'Sune',
  'anti sune trigger': 'Anti-Sune',
  'sexy move': 'Sexy Move',
  'wide sexy move': 'Wide Sexy',
  'inverse sexy move': 'Inverse Sexy',
  'left handed sexy': 'Left Sexy',
  'wide sledgehammer': 'Wide Sledge',
  sledgehammer: 'Sledgehammer',
  hedgeslammer: 'Hedgeslammer',
};

export function chunkNameToBadgeLabel(chunkName: string): string {
  return CHUNK_NAME_TO_BADGE[normalizeTriggerLabel(chunkName)] ?? chunkName;
}

export interface TokenMatch {
  start: number;
  end: number;
  pattern: TriggerPattern;
}

function matchesAt(
  moves: readonly string[],
  start: number,
  patternTokens: readonly string[],
): boolean {
  if (start + patternTokens.length > moves.length) return false;
  for (let j = 0; j < patternTokens.length; j++) {
    if (moves[start + j] !== patternTokens[j]) return false;
  }
  return true;
}

export function findTokenAlignedMatches(moves: readonly string[]): TokenMatch[] {
  const matches: TokenMatch[] = [];
  for (let i = 0; i < moves.length; i++) {
    for (const pattern of TRIGGER_PATTERNS) {
      if (matchesAt(moves, i, pattern.tokens)) {
        matches.push({ start: i, end: i + pattern.tokens.length, pattern });
        break;
      }
    }
  }
  return matches;
}

export function isMatchContainedWithin(inner: TokenMatch, outer: TokenMatch): boolean {
  return (
    outer.pattern.tokens.length > inner.pattern.tokens.length &&
    outer.start <= inner.start &&
    outer.end >= inner.end
  );
}

export function filterShadowedMatches(matches: readonly TokenMatch[]): TokenMatch[] {
  return matches.filter(
    m => !matches.some(other => other !== m && isMatchContainedWithin(m, other)),
  );
}

export function findLongestPatternAt(
  moves: readonly string[],
  start: number,
): TriggerPattern | null {
  for (const pattern of TRIGGER_PATTERNS) {
    if (matchesAt(moves, start, pattern.tokens)) {
      return pattern;
    }
  }
  return null;
}

export function isMovePalindrome(moves: readonly string[]): boolean {
  if (moves.length < MIN_PALINDROME_MOVES) return false;
  for (let k = 0; k < Math.floor(moves.length / 2); k++) {
    if (moves[k] !== moves[moves.length - 1 - k]) {
      return false;
    }
  }
  return true;
}

export function findLongestPalindromeFrom(moves: readonly string[], start: number): number {
  for (let len = moves.length - start; len >= MIN_PALINDROME_MOVES; len--) {
    const sub = moves.slice(start, start + len);
    if (isMovePalindrome(sub)) {
      return len;
    }
  }
  return 0;
}

export function detectTokenAlignedBadges(movesStr: string): string[] {
  const moves = tokenizeAlgMoves(movesStr);
  if (moves.length === 0) return [];

  const badges: string[] = [];
  if (isMovePalindrome(moves)) {
    badges.push('Palindrome');
  }

  for (const match of filterShadowedMatches(findTokenAlignedMatches(moves))) {
    badges.push(match.pattern.badgeLabel);
  }

  return Array.from(new Set(badges));
}
