import { Alg } from 'cubing/alg';
import type { AlgCase, AlgCategory } from '../types/cube';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';

export type DeckId = 'bookmarks' | 'oll-2look' | 'pll-2look' | 'pll-full' | 'f2l' | 'all';
export type ReferenceStepId = 'cross' | 'f2l' | 'oll' | 'pll' | 'bookmarked';

export interface DeckDefinition {
  id: DeckId;
  label: string;
  description: string;
  getCount: (bookmarkedCount: number) => number;
}

export interface StepDefinition {
  id: ReferenceStepId;
  label: string;
  getBadgeCount: (allCases: AlgCase[], bookmarkedCount: number) => number;
}

// Single source of truth for cross sample
export const CROSS_SAMPLE_CASES: AlgCase[] = [
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

// Deduplicated master list of all unique algorithm cases
const CASE_REGISTRY: AlgCase[] = (() => {
  const map = new Map<string, AlgCase>();
  [...CROSS_SAMPLE_CASES, ...OLL_2LOOK_CASES, ...FULL_PLL_CASES, ...F2L_HIGHLIGHTS].forEach(c => {
    if (!map.has(c.id)) {
      map.set(c.id, c);
    }
  });
  return Array.from(map.values());
})();

const CASE_MAP = new Map<string, AlgCase>(CASE_REGISTRY.map(c => [c.id, c]));

/**
 * Returns all registered algorithm cases
 */
export function getAllCases(): AlgCase[] {
  return CASE_REGISTRY;
}

/**
 * Fast lookup for a single algorithm case by ID
 */
export function getCaseById(id: string): AlgCase | undefined {
  return CASE_MAP.get(id);
}

/**
 * Available Flashcard Decks metadata
 */
export const DECK_DEFINITIONS: DeckDefinition[] = [
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    description: 'Your starred algorithms for focused drill',
    getCount: b => b,
  },
  {
    id: 'oll-2look',
    label: '2-Look OLL',
    description: '7 Essential Orientation cases (Cross & Corners)',
    getCount: () => OLL_2LOOK_CASES.length,
  },
  {
    id: 'pll-2look',
    label: '2-Look PLL',
    description: '6 Essential Permutation cases (T, Y, Ua, Ub, H, Z)',
    getCount: () => PLL_2LOOK_CASES.length,
  },
  {
    id: 'pll-full',
    label: 'Full PLL',
    description: 'All 21 Permutations of the Last Layer',
    getCount: () => FULL_PLL_CASES.length,
  },
  {
    id: 'f2l',
    label: 'Intuitive F2L',
    description: 'Core First Two Layers insertion patterns',
    getCount: () => F2L_HIGHLIGHTS.length,
  },
  {
    id: 'all',
    label: 'All Algorithms',
    description: 'Complete library of CFOP algorithms',
    getCount: () => CASE_REGISTRY.length,
  },
];

/**
 * Get cases belonging to a specific flashcard deck
 */
export function getCasesForDeck(deckId: DeckId, bookmarkedIds: string[] = []): AlgCase[] {
  switch (deckId) {
    case 'bookmarks':
      return CASE_REGISTRY.filter(c => bookmarkedIds.includes(c.id));
    case 'oll-2look':
      return OLL_2LOOK_CASES;
    case 'pll-2look':
      return PLL_2LOOK_CASES;
    case 'pll-full':
      return FULL_PLL_CASES;
    case 'f2l':
      return F2L_HIGHLIGHTS;
    case 'all':
      return CASE_REGISTRY;
  }
}

/**
 * Maps a reference step or category to its corresponding default flashcard training deck
 */
const STEP_TO_DECK_MAP: Record<ReferenceStepId, DeckId> = {
  bookmarked: 'bookmarks',
  oll: 'oll-2look',
  pll: 'pll-2look',
  f2l: 'f2l',
  cross: 'all',
};

export function getDeckForStep(step: string): DeckId {
  if (step in STEP_TO_DECK_MAP) {
    return STEP_TO_DECK_MAP[step as ReferenceStepId];
  }
  return 'bookmarks';
}

/**
 * Step definitions for the Algorithm Reference pipeline
 */
export const STEP_DEFINITIONS: StepDefinition[] = [
  {
    id: 'cross',
    label: 'Step 1: Cross',
    getBadgeCount: () => CROSS_SAMPLE_CASES.length,
  },
  {
    id: 'f2l',
    label: 'Step 2: F2L',
    getBadgeCount: () => F2L_HIGHLIGHTS.length,
  },
  {
    id: 'oll',
    label: 'Step 3: OLL (2-Look)',
    getBadgeCount: () => OLL_2LOOK_CASES.length,
  },
  {
    id: 'pll',
    label: 'Step 4: PLL (2-Look)',
    getBadgeCount: () => PLL_2LOOK_CASES.length,
  },
  {
    id: 'bookmarked',
    label: 'Saved Bookmarks',
    getBadgeCount: (_, count) => count,
  },
];

const VALID_STEP_SET = new Set<string>(STEP_DEFINITIONS.map(s => s.id));

export function isValidStep(step?: string): step is ReferenceStepId {
  return typeof step === 'string' && VALID_STEP_SET.has(step);
}

/**
 * Filter cases for Algorithm Reference tab by active step
 */
export function getCasesForStep(step: ReferenceStepId, bookmarkedIds: string[]): AlgCase[] {
  switch (step) {
    case 'bookmarked':
      return CASE_REGISTRY.filter(c => bookmarkedIds.includes(c.id));
    case 'cross':
      return CROSS_SAMPLE_CASES;
    case 'f2l':
      return F2L_HIGHLIGHTS;
    case 'oll':
      return OLL_2LOOK_CASES;
    case 'pll':
      return PLL_2LOOK_CASES;
  }
}

// Third-party remote data fetching
const THIRD_PARTY_ENDPOINTS = {
  OLL_2LOOK: 'https://jperm.net/lib/2lookoll.js',
  PLL_2LOOK: 'https://jperm.net/lib/2lookpll.js',
};

const cache: Record<string, AlgCase[]> = {};

function safeParseJsObjectArray<T>(jsArrayStr: string): T[] {
  try {
    const jsonString = jsArrayStr
      .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
      .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner: string) => `"${inner.replace(/\\'/g, "'").replace(/"/g, '\\"')}"`)
      .replace(/,\s*([\}\]])/g, '$1');
    return JSON.parse(jsonString) as T[];
  } catch {
    return [];
  }
}

export async function fetchThirdPartyAlgData(type: 'oll' | 'pll'): Promise<AlgCase[]> {
  if (cache[type]) {
    return cache[type];
  }

  const endpoint = type === 'oll' ? THIRD_PARTY_ENDPOINTS.OLL_2LOOK : THIRD_PARTY_ENDPOINTS.PLL_2LOOK;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const scriptText = await res.text();

    const match = scriptText.match(/algsetAlgs\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
    if (!match || !match[1]) {
      throw new Error('Failed to parse algsetAlgs from script');
    }

    const rawData = safeParseJsObjectArray<{
      name?: string;
      alg?: string[];
      group?: string;
      prob?: number;
    }>(match[1]);

    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Parsed rawData is empty or not an array');
    }

    const parsedCases: AlgCase[] = rawData.map((item, index) => {
      const algsList = Array.isArray(item.alg) ? item.alg : [];
      const primaryAlgStr = algsList[0] || '';
      let wcaAlgStr = primaryAlgStr;

      try {
        if (primaryAlgStr) {
          wcaAlgStr = new Alg(primaryAlgStr).toString();
        }
      } catch {
        wcaAlgStr = primaryAlgStr;
      }

      const caseName = item.name || `${type.toUpperCase()} Case ${index + 1}`;

      return {
        id: `${type}-2look-${index + 1}`,
        name: caseName,
        category: type as AlgCategory,
        subcategory: `2-Look ${type.toUpperCase()}`,
        group: item.group || (type === 'oll' ? 'Corners (Look 2)' : 'Edges (Look 2)'),
        is2Look: true,
        primaryAlg: wcaAlgStr,
        alternativeAlgs: algsList.slice(1),
        description: `3x3 ${type.toUpperCase()} Case: ${caseName}`,
        tips: `Third-Party Source Alg: ${wcaAlgStr}`,
        why: `Calculated with WCA cubing/alg standard library`,
        probability: item.prob ? `1/${item.prob}` : undefined,
      };
    });

    cache[type] = parsedCases;
    return parsedCases;
  } catch (err) {
    console.warn(`Dynamic fetch from ${endpoint} failed, using local fallback.`, err);
    return [];
  }
}
