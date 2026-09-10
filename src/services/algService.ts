import type { AlgCase, AlgMethod, DeckOption, StepOption } from '../types/cube';
import {
  CFOP_4LOOK_METHOD,
  CFOP_3LOOK_METHOD,
  CFOP_2LOOK_METHOD,
} from '../data/cfopData';
import { BUILTIN_METHODS } from '../data/methodsData';

/**
 * Universal Speedcubing Method Registry
 */
const METHOD_REGISTRY = new Map<string, AlgMethod>();

// Register default built-in methods (4-Look, 3-Look, and 2-Look CFOP)
[CFOP_4LOOK_METHOD, CFOP_3LOOK_METHOD, CFOP_2LOOK_METHOD, ...BUILTIN_METHODS].forEach(method => {
  METHOD_REGISTRY.set(method.id, method);
});

/**
 * Register a new method or algorithm collection
 */
export function registerMethod(method: AlgMethod): void {
  METHOD_REGISTRY.set(method.id, method);
}

/**
 * Returns all registered solving methods
 */
export function getAvailableMethods(): AlgMethod[] {
  const seen = new Set<string>();
  const methods: AlgMethod[] = [];
  for (const m of METHOD_REGISTRY.values()) {
    if (!seen.has(m.id) && m.isAvailable && m.cases.length > 0) {
      seen.add(m.id);
      methods.push(m);
    }
  }
  return methods;
}

/**
 * Get a specific solving method by ID (defaults to 'cfop-4look', routes 'cfop' to 'cfop-4look')
 */
export function getMethod(methodId = 'cfop-4look'): AlgMethod {
  if (methodId === 'cfop' || !methodId) {
    return METHOD_REGISTRY.get('cfop-4look') || CFOP_4LOOK_METHOD;
  }
  return METHOD_REGISTRY.get(methodId) || CFOP_4LOOK_METHOD;
}

/**
 * Returns all algorithm cases for a specific method or all registered methods
 */
export function getAllCases(methodId = 'cfop-4look'): AlgCase[] {
  if (methodId === 'all') {
    const combined: AlgCase[] = [];
    const seen = new Set<string>();
    METHOD_REGISTRY.forEach(m => {
      m.cases.forEach(c => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          combined.push(c);
        }
      });
    });
    return combined;
  }
  return getMethod(methodId).cases;
}

/**
 * Fast lookup for a single algorithm case by ID
 */
export function getCaseById(id: string, methodId?: string): AlgCase | undefined {
  if (methodId) {
    return getMethod(methodId).cases.find(c => c.id === id);
  }
  for (const method of METHOD_REGISTRY.values()) {
    const found = method.cases.find(c => c.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Dynamically auto-populates reference step tabs from the method's declared step pipeline
 */
export function getSteps(
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): StepOption[] {
  let method: AlgMethod;
  let cases: AlgCase[];

  if (typeof methodOrCases === 'string') {
    method = getMethod(methodOrCases);
    cases = method.cases;
  } else {
    method = CFOP_4LOOK_METHOD;
    cases = methodOrCases;
  }

  // Auto-populate steps dynamically from the method's declared step pipeline
  const dynamicSteps: StepOption[] = method.steps.map(stepDef => ({
    id: stepDef.id,
    label: stepDef.label,
    description: stepDef.description,
    cases: cases.filter(c => c.category === stepDef.id),
  }));

  return [
    ...dynamicSteps,
    {
      id: 'bookmarked',
      label: 'Saved Bookmarks',
      description: 'Your starred algorithms for quick reference',
      cases: cases.filter(c => bookmarkedIds.includes(c.id)),
    },
  ];
}

/**
 * Checks if a step route is valid for the specified method
 */
export function isValidStep(
  step: string | undefined,
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): step is string {
  if (!step) return false;
  const steps = getSteps(methodOrCases, bookmarkedIds);
  return steps.some(s => s.id === step);
}

/**
 * Get cases for a reference step
 */
export function getCasesForStep(
  stepId: string,
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): AlgCase[] {
  const steps = getSteps(methodOrCases, bookmarkedIds);
  const step = steps.find(s => s.id === stepId);
  return step ? step.cases : [];
}

/**
 * Dynamically auto-populates flashcard training decks from registered algorithm data
 * Generates:
 * - 4-Look LL: 2-look-oll (10), 2-look-pll (6)
 * - 3-Look LL: 2-look-oll (10), full-pll (21)
 * - 2-Look LL: full-oll (57), full-pll (21)
 */
export function getDecks(
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): DeckOption[] {
  const allCases = typeof methodOrCases === 'string' ? getAllCases(methodOrCases) : methodOrCases;
  const bookmarkedCases = allCases.filter(c => bookmarkedIds.includes(c.id));

  // Focus training decks on Last Layer algorithms (OLL and PLL)
  const llCases = allCases.filter(c => c.category === 'oll' || c.category === 'pll');

  // Dynamically group cases by subcategory
  const groups = new Map<string, AlgCase[]>();
  llCases.forEach(c => {
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

  // Ensure deterministic deck ordering: OLL first, then PLL
  dynamicSubcategoryDecks.sort((a, b) => {
    if (a.id.includes('oll') && b.id.includes('pll')) return -1;
    if (a.id.includes('pll') && b.id.includes('oll')) return 1;
    return 0;
  });

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
      cases: llCases,
    },
  ];
}

/**
 * Get a specific deck by ID, with fallback to first non-bookmark deck
 */
export function getDeckById(
  deckId: string,
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): DeckOption {
  const decks = getDecks(methodOrCases, bookmarkedIds);
  const found = decks.find(d => d.id === deckId);
  return found || decks.find(d => d.id !== 'bookmarks') || decks[0] || { id: 'bookmarks', label: 'Bookmarks', cases: [] };
}

/**
 * Dynamically maps a reference step to its matching training deck
 * - Step 'pll' on 4-Look LL -> '2-look-pll'
 * - Step 'pll' on 3-Look or 2-Look LL -> 'full-pll'
 * - Step 'oll' on 4-Look or 3-Look LL -> '2-look-oll'
 * - Step 'oll' on 2-Look (Full) LL -> 'full-oll'
 * - Does NOT allow bookmarked cases to hijack the step route to 'bookmarks'
 */
export function getDeckForStep(
  stepId: string,
  methodOrCases: string | AlgCase[] = 'cfop-4look',
  bookmarkedIds: string[] = []
): string {
  if (stepId === 'bookmarked') return 'bookmarks';

  let methodId = 'cfop-4look';
  let cases: AlgCase[];

  if (typeof methodOrCases === 'string') {
    const normalized = (methodOrCases === 'cfop' || !methodOrCases) ? 'cfop-4look' : methodOrCases;
    methodId = normalized;
    cases = getAllCases(normalized);
  } else {
    cases = methodOrCases;
    if (cases.some(c => c.subcategory === 'Full OLL')) {
      methodId = 'cfop-2look';
    } else if (cases.some(c => c.subcategory === 'Full PLL')) {
      methodId = 'cfop-3look';
    } else {
      methodId = 'cfop-4look';
    }
  }

  if (stepId === 'pll') {
    return methodId === 'cfop-4look' ? '2-look-pll' : 'full-pll';
  }

  if (stepId === 'oll') {
    return methodId === 'cfop-2look' ? 'full-oll' : '2-look-oll';
  }

  // For other steps (e.g. cross, f2l), find non-bookmark matching deck or fallback to 'all'
  const decks = getDecks(cases, bookmarkedIds);
  const matchingDeck = decks.find(
    d => d.id !== 'bookmarks' && (d.id === stepId || d.id.includes(stepId) || d.cases.some(c => c.category === stepId))
  );

  return matchingDeck ? matchingDeck.id : 'all';
}
