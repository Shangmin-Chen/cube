import { Alg } from 'cubing/alg';
import type { AlgCase, AlgCategory, DeckOption, StepOption } from '../types/cube';
import { ALL_CFOP_CASES } from '../data/cfopData';

/**
 * Returns all registered algorithm cases
 */
export function getAllCases(): AlgCase[] {
  return ALL_CFOP_CASES;
}

/**
 * Fast lookup for a single algorithm case by ID
 */
export function getCaseById(id: string): AlgCase | undefined {
  return ALL_CFOP_CASES.find(c => c.id === id);
}

/**
 * Dynamically auto-populates flashcard training decks from registered algorithm data
 */
export function getDecks(allCases: AlgCase[], bookmarkedIds: string[] = []): DeckOption[] {
  const bookmarkedCases = allCases.filter(c => bookmarkedIds.includes(c.id));

  // Dynamically group cases by subcategory / category
  const groups = new Map<string, AlgCase[]>();
  allCases.forEach(c => {
    const key = c.subcategory || c.category.toUpperCase();
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(c);
  });

  const dynamicSubcategoryDecks: DeckOption[] = Array.from(groups.entries()).map(([label, cases]) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    label,
    cases,
  }));

  return [
    {
      id: 'bookmarks',
      label: 'Bookmarks',
      cases: bookmarkedCases,
    },
    ...dynamicSubcategoryDecks,
    {
      id: 'all',
      label: 'All Algorithms',
      cases: allCases,
    },
  ];
}

/**
 * Get a specific deck by ID, with fallback to bookmarks
 */
export function getDeckById(deckId: string, allCases: AlgCase[], bookmarkedIds: string[] = []): DeckOption {
  const decks = getDecks(allCases, bookmarkedIds);
  const found = decks.find(d => d.id === deckId);
  return found || decks[0] || { id: 'bookmarks', label: 'Bookmarks', cases: [] };
}

/**
 * Dynamically auto-populates reference step tabs from algorithm categories
 */
export function getSteps(allCases: AlgCase[], bookmarkedIds: string[] = []): StepOption[] {
  const categories: AlgCategory[] = ['cross', 'f2l', 'oll', 'pll'];

  const categorySteps: StepOption[] = categories.map((cat, idx) => {
    const matchingCases = allCases.filter(c => c.category === cat);
    const label = `Step ${idx + 1}: ${cat.toUpperCase()}`;
    return {
      id: cat,
      label,
      cases: matchingCases,
    };
  });

  return [
    ...categorySteps,
    {
      id: 'bookmarked',
      label: 'Saved Bookmarks',
      cases: allCases.filter(c => bookmarkedIds.includes(c.id)),
    },
  ];
}

/**
 * Checks if a step route is valid
 */
export function isValidStep(
  step: string | undefined,
  allCases = ALL_CFOP_CASES,
  bookmarkedIds: string[] = []
): step is string {
  if (!step) return false;
  const steps = getSteps(allCases, bookmarkedIds);
  return steps.some(s => s.id === step);
}

/**
 * Get cases for a reference step
 */
export function getCasesForStep(stepId: string, allCases: AlgCase[], bookmarkedIds: string[] = []): AlgCase[] {
  const steps = getSteps(allCases, bookmarkedIds);
  const step = steps.find(s => s.id === stepId);
  return step ? step.cases : [];
}

/**
 * Dynamically maps a reference step to its matching training deck
 */
export function getDeckForStep(stepId: string, allCases: AlgCase[], bookmarkedIds: string[] = []): string {
  const decks = getDecks(allCases, bookmarkedIds);
  if (stepId === 'bookmarked') return 'bookmarks';

  // Find a deck that matches the step ID or category
  const matchingDeck = decks.find(
    d => d.id === stepId || d.id.startsWith(stepId) || d.cases.some(c => c.category === stepId)
  );

  return matchingDeck ? matchingDeck.id : 'all';
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
