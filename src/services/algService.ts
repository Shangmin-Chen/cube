import type { AlgCase, AlgMethod, DeckOption, StepOption } from '../types/cube';
import { CFOP_METHOD } from '../data/cfopData';
import { BUILTIN_METHODS } from '../data/methodsData';

/**
 * Universal Speedcubing Method Registry
 */
const METHOD_REGISTRY = new Map<string, AlgMethod>();

// Register default built-in methods
[CFOP_METHOD, ...BUILTIN_METHODS].forEach(method => {
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
  return Array.from(METHOD_REGISTRY.values());
}

/**
 * Get a specific solving method by ID (defaults to 'cfop')
 */
export function getMethod(methodId = 'cfop'): AlgMethod {
  return METHOD_REGISTRY.get(methodId) || CFOP_METHOD;
}

/**
 * Returns all algorithm cases for a specific method or all registered methods
 */
export function getAllCases(methodId = 'cfop'): AlgCase[] {
  if (methodId === 'all') {
    const combined: AlgCase[] = [];
    METHOD_REGISTRY.forEach(m => {
      combined.push(...m.cases);
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
  methodOrCases: string | AlgCase[] = 'cfop',
  bookmarkedIds: string[] = []
): StepOption[] {
  let method: AlgMethod;
  let cases: AlgCase[];

  if (typeof methodOrCases === 'string') {
    method = getMethod(methodOrCases);
    cases = method.cases;
  } else {
    method = CFOP_METHOD;
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
  methodOrCases: string | AlgCase[] = 'cfop',
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
  methodOrCases: string | AlgCase[] = 'cfop',
  bookmarkedIds: string[] = []
): AlgCase[] {
  const steps = getSteps(methodOrCases, bookmarkedIds);
  const step = steps.find(s => s.id === stepId);
  return step ? step.cases : [];
}

/**
 * Dynamically auto-populates flashcard training decks from registered algorithm data
 */
export function getDecks(
  methodOrCases: string | AlgCase[] = 'cfop',
  bookmarkedIds: string[] = []
): DeckOption[] {
  const allCases = typeof methodOrCases === 'string' ? getAllCases(methodOrCases) : methodOrCases;
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
export function getDeckById(
  deckId: string,
  methodOrCases: string | AlgCase[] = 'cfop',
  bookmarkedIds: string[] = []
): DeckOption {
  const decks = getDecks(methodOrCases, bookmarkedIds);
  const found = decks.find(d => d.id === deckId);
  return found || decks[0] || { id: 'bookmarks', label: 'Bookmarks', cases: [] };
}

/**
 * Dynamically maps a reference step to its matching training deck
 */
export function getDeckForStep(
  stepId: string,
  methodOrCases: string | AlgCase[] = 'cfop',
  bookmarkedIds: string[] = []
): string {
  const decks = getDecks(methodOrCases, bookmarkedIds);
  if (stepId === 'bookmarked') return 'bookmarks';

  const matchingDeck = decks.find(
    d => d.id === stepId || d.id.startsWith(stepId) || d.cases.some(c => c.category === stepId)
  );

  return matchingDeck ? matchingDeck.id : 'all';
}
