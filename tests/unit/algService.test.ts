import { describe, it, expect } from 'vitest';
import {
  getAvailableMethods,
  getDecks,
  getSteps,
  getAllCases,
} from '../../src/services/algService';

describe('algService methods, decks, and steps identity', () => {
  it('registers each built-in method exactly once', () => {
    const methods = getAvailableMethods();
    const ids = methods.map(m => m.id);
    expect(ids).toEqual(['cfop-4look', 'cfop-3look', 'cfop-2look']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('labels the all last-layer deck as "Last Layer Algorithms", not "All Algorithms"', () => {
    const decks = getDecks('cfop-4look');
    const allDeck = decks.find(d => d.id === 'all');
    expect(allDeck).toBeDefined();
    expect(allDeck!.label).toBe('Last Layer Algorithms');
    expect(decks.some(d => d.label === 'All Algorithms')).toBe(false);
  });

  it('infers method correctly in getSteps when passed an AlgCase array', () => {
    const fullOllCases = getAllCases('cfop-2look');
    const steps2Look = getSteps(fullOllCases);
    expect(steps2Look.some(s => s.id === 'oll')).toBe(true);

    const fullPllCases = getAllCases('cfop-3look');
    const steps3Look = getSteps(fullPllCases);
    expect(steps3Look.some(s => s.id === 'pll')).toBe(true);
  });
});
