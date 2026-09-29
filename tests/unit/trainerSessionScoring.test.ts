import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTrainerSession } from '../../src/hooks/useTrainerSession';
import { reviewMissedCases } from '../../src/hooks/trainerSessionLogic';
import { RoundSummary } from '../../src/components/trainer/RoundSummary';
import type { AlgCase } from '../../src/types/cube';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// --- Lightweight React 19 Client Render Harness for Node/Vitest ---

interface MockDomElement {
  nodeType: number;
  tagName: string;
  nodeName: string;
  ownerDocument: unknown;
  childNodes: MockDomElement[];
  parentNode?: MockDomElement;
  style: Record<string, string>;
  setAttribute: (k: string, v: string) => void;
  removeAttribute: (k: string) => void;
  addEventListener: (event: string, fn: (...args: unknown[]) => void) => void;
  removeEventListener: (event: string, fn: (...args: unknown[]) => void) => void;
  appendChild: (child: MockDomElement) => MockDomElement;
  removeChild: (child: MockDomElement) => MockDomElement;
  insertBefore: (child: MockDomElement, before: MockDomElement) => MockDomElement;
}

function createMockElement(tag = 'div'): MockDomElement {
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const element: MockDomElement = {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    nodeName: tag.toUpperCase(),
    ownerDocument: null,
    childNodes: [],
    style: {},
    setAttribute() {},
    removeAttribute() {},
    addEventListener(event, fn) {
      listeners[event] = listeners[event] || [];
      listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (listeners[event]) {
        const idx = listeners[event].indexOf(fn);
        if (idx !== -1) listeners[event].splice(idx, 1);
      }
    },
    appendChild(child) {
      element.childNodes.push(child);
      child.parentNode = element;
      return child;
    },
    removeChild(child) {
      const idx = element.childNodes.indexOf(child);
      if (idx !== -1) element.childNodes.splice(idx, 1);
      return child;
    },
    insertBefore(child, before) {
      const idx = element.childNodes.indexOf(before);
      if (idx !== -1) element.childNodes.splice(idx, 0, child);
      else element.childNodes.push(child);
      child.parentNode = element;
      return child;
    },
  };
  return element;
}

const mockDoc = {
  nodeType: 9,
  createElement: createMockElement,
  createElementNS: (_ns: string, tag: string) => createMockElement(tag),
  createTextNode: (text: string) => ({ nodeType: 3, nodeValue: text, textContent: text }),
  createComment: () => ({ nodeType: 8 }),
  addEventListener() {},
  removeEventListener() {},
};

function renderHook<TResult>(hookFn: () => TResult) {
  const result = { current: undefined as unknown as TResult };

  function TestHarness() {
    result.current = hookFn();
    return null;
  }

  const container = createMockElement('div');
  container.ownerDocument = mockDoc;
  const root = createRoot(container as unknown as HTMLElement);

  act(() => {
    root.render(React.createElement(TestHarness));
  });

  return {
    result,
    unmount: () => {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe('Trainer Session Scoring', () => {
  const originalDocument = global.document;
  const originalWindow = global.window;
  const originalHTMLIFrameElement = (global as Record<string, unknown>).HTMLIFrameElement;
  const originalActEnv = (global as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => {
    (global as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    (global as Record<string, unknown>).window = global;
    (global as Record<string, unknown>).document = mockDoc;
    (global as Record<string, unknown>).HTMLIFrameElement = class {};
  });

  afterAll(() => {
    (global as Record<string, unknown>).document = originalDocument;
    (global as Record<string, unknown>).window = originalWindow;
    (global as Record<string, unknown>).HTMLIFrameElement = originalHTMLIFrameElement;
    (global as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = originalActEnv;
  });

  describe('next() auto-scoring in useTrainerSession', () => {
    it('calling next() on unscored cards auto-grades as learning and increments index', () => {
      // 2-look-pll has exactly 6 cases in cfop-4look
      const { result, unmount } = renderHook(() => useTrainerSession('2-look-pll', []));

      expect(result.current.baseCases.length).toBe(6);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.masteredIds.size).toBe(0);
      expect(result.current.learningIds.size).toBe(0);

      const firstCard = result.current.currentCase;
      expect(firstCard).toBeDefined();
      const firstCardId = firstCard!.id;

      // Advancing past an unscored card marks it as learning
      act(() => {
        result.current.next();
      });

      expect(result.current.learningIds.has(firstCardId)).toBe(true);
      expect(result.current.masteredIds.has(firstCardId)).toBe(false);
      expect(result.current.currentIndex).toBe(1);

      unmount();
    });

    it('advancing past all cards leaves learningIds containing all cards, masteredIds empty, and isRoundFinished true', () => {
      const { result, unmount } = renderHook(() => useTrainerSession('2-look-pll', []));
      const totalCards = result.current.baseCases.length;
      expect(totalCards).toBe(6);

      // Step through all cards solely using next() without manual scoring
      while (!result.current.isRoundFinished) {
        const card = result.current.currentCase;
        expect(card).toBeDefined();
        act(() => {
          result.current.next();
        });
      }

      expect(result.current.isRoundFinished).toBe(true);
      expect(result.current.learningIds.size).toBe(totalCards);
      expect(result.current.masteredIds.size).toBe(0);

      // Verify learningIds contains every single card from the deck
      for (const card of result.current.baseCases) {
        expect(result.current.learningIds.has(card.id)).toBe(true);
      }

      // Verify reviewMissedCases includes all skipped cards
      const nextRoundState = reviewMissedCases(
        {
          activeQueue: result.current.activeQueue,
          currentIndex: result.current.currentIndex,
          roundNumber: result.current.roundNumber,
          isRoundFinished: result.current.isRoundFinished,
          masteredIds: result.current.masteredIds,
          learningIds: result.current.learningIds,
        },
        result.current.baseCases,
        false,
      );

      expect(nextRoundState).not.toBeNull();
      expect(nextRoundState!.roundNumber).toBe(2);
      expect(nextRoundState!.activeQueue.length).toBe(totalCards);
      for (const card of result.current.baseCases) {
        expect(nextRoundState!.activeQueue.some(c => c.id === card.id)).toBe(true);
      }

      // Also verify hook's reviewMissed() enters round 2 with all skipped cards
      act(() => {
        result.current.reviewMissed();
      });

      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.length).toBe(totalCards);
      for (const card of result.current.baseCases) {
        expect(result.current.activeQueue.some(c => c.id === card.id)).toBe(true);
      }

      unmount();
    });

    it('calling next() on an already-graded card at queue boundary transitions to finished round', () => {
      const { result, unmount } = renderHook(() => useTrainerSession('2-look-pll', []));
      const totalCards = result.current.baseCases.length;

      // Grade all cards to reach the end of the round
      for (let i = 0; i < totalCards; i++) {
        act(() => {
          result.current.markMastered();
        });
      }

      expect(result.current.isRoundFinished).toBe(true);
      expect(result.current.masteredIds.size).toBe(totalCards);

      // Navigate back to previous card, then next() back to the last card
      act(() => {
        result.current.prev();
      });
      expect(result.current.isRoundFinished).toBe(false);
      expect(result.current.currentIndex).toBe(totalCards - 2);

      act(() => {
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(totalCards - 1);
      expect(result.current.isRoundFinished).toBe(false);

      const lastCard = result.current.currentCase;
      expect(lastCard).toBeDefined();
      expect(result.current.masteredIds.has(lastCard!.id)).toBe(true);

      // Calling next() on the already-graded boundary card should transition back to round finished
      act(() => {
        result.current.next();
      });

      expect(result.current.isRoundFinished).toBe(true);

      unmount();
    });
  });

  describe('RoundSummary rendering behavior', () => {
    const mockCases: AlgCase[] = [
      { id: 'c1', name: 'Case 1', category: 'pll', subcategory: '2-Look PLL', group: 'corners', primaryAlg: "x R' U R'" },
      { id: 'c2', name: 'Case 2', category: 'pll', subcategory: '2-Look PLL', group: 'corners', primaryAlg: "R U R' U'" },
      { id: 'c3', name: 'Case 3', category: 'pll', subcategory: '2-Look PLL', group: 'edges', primaryAlg: "R U R' U R U2 R'" },
      { id: 'c4', name: 'Case 4', category: 'pll', subcategory: '2-Look PLL', group: 'edges', primaryAlg: "R' U' R U' R' U2 R" },
      { id: 'c5', name: 'Case 5', category: 'pll', subcategory: '2-Look PLL', group: 'edges', primaryAlg: "M2 U M2 U2 M2 U M2" },
      { id: 'c6', name: 'Case 6', category: 'pll', subcategory: '2-Look PLL', group: 'edges', primaryAlg: "M2 U M U2 M' U M2" },
    ];

    it('when masteredCount === 0 and totalCards === 6, displays reinforcement message, NOT accurate congratulations', () => {
      const html = renderToStaticMarkup(
        React.createElement(RoundSummary, {
          roundNumber: 1,
          totalCards: 6,
          masteredCount: 0,
          learningCount: 6,
          activeQueue: mockCases,
          masteredIds: new Set<string>(),
          learningIds: new Set<string>(mockCases.map(c => c.id)),
          totalBaseCount: 6,
          onReviewMissed: vi.fn(),
          onRestart: vi.fn(),
        }),
      );

      // Must display reinforcement text for 6 missed cards
      expect(html).toContain('0 of 6 Mastered');
      expect(html).toContain('You have 6 cases to reinforce in the next round.');
      // Must NOT claim flawless mastery or 100% accuracy
      expect(html).not.toContain('You answered every algorithm accurately in this round!');
      expect(html).not.toContain('🎉 Flawless Mastery!');
      expect(html).toContain('Drill 6 Missed Cases (Round 2)');
    });

    it('when masteredCount === 0 and learningCount === 0 (unmarked skip edge case), falls back to remaining count reinforcement', () => {
      const html = renderToStaticMarkup(
        React.createElement(RoundSummary, {
          roundNumber: 1,
          totalCards: 6,
          masteredCount: 0,
          learningCount: 0,
          activeQueue: mockCases,
          masteredIds: new Set<string>(),
          learningIds: new Set<string>(),
          totalBaseCount: 6,
          onReviewMissed: vi.fn(),
          onRestart: vi.fn(),
        }),
      );

      // Guard in RoundSummary: learningCount || (totalCards - masteredCount) -> 6
      expect(html).toContain('You have 6 cases to reinforce in the next round.');
      expect(html).not.toContain('You answered every algorithm accurately');
      expect(html).not.toContain('🎉 Flawless Mastery!');
    });

    it('when masteredCount === 6 and totalCards === 6, displays accurate congratulations', () => {
      const html = renderToStaticMarkup(
        React.createElement(RoundSummary, {
          roundNumber: 1,
          totalCards: 6,
          masteredCount: 6,
          learningCount: 0,
          activeQueue: mockCases,
          masteredIds: new Set<string>(mockCases.map(c => c.id)),
          learningIds: new Set<string>(),
          totalBaseCount: 6,
          onReviewMissed: vi.fn(),
          onRestart: vi.fn(),
        }),
      );

      // Must display flawless celebration
      expect(html).toContain('🎉 Flawless Mastery!');
      expect(html).toContain('You answered every algorithm accurately in this round!');
      // Must NOT display reinforcement text
      expect(html).not.toContain('to reinforce in the next round');
      // No missed cases CTA
      expect(html).not.toContain('Drill');
    });

    it('when totalCards === 0 (empty deck), does not declare flawless mastery and displays empty deck message', () => {
      const html = renderToStaticMarkup(
        React.createElement(RoundSummary, {
          roundNumber: 1,
          totalCards: 0,
          masteredCount: 0,
          learningCount: 0,
          activeQueue: [],
          masteredIds: new Set<string>(),
          learningIds: new Set<string>(),
          totalBaseCount: 0,
          onReviewMissed: vi.fn(),
          onRestart: vi.fn(),
        }),
      );

      // Must NOT claim flawless mastery or 100% accuracy
      expect(html).not.toContain('🎉 Flawless Mastery!');
      expect(html).not.toContain('You answered every algorithm accurately in this round!');
      // Must display empty deck message
      expect(html).toContain('No cards in this round.');
      // Must NOT display drill missed cases CTA
      expect(html).not.toContain('Drill');
    });
  });

  describe('toggleShuffle mid-round 2', () => {
    it('retains missed cases count and does not reset to full baseCases', () => {
      const { result, unmount } = renderHook(() => useTrainerSession('2-look-pll', []));
      const totalBaseCards = result.current.baseCases.length;
      expect(totalBaseCards).toBe(6);

      // Master 4 cards, leave 2 cards as learning via next() auto-scoring
      for (let i = 0; i < 4; i++) {
        act(() => {
          result.current.markMastered();
        });
      }

      while (!result.current.isRoundFinished) {
        act(() => {
          result.current.next();
        });
      }

      expect(result.current.isRoundFinished).toBe(true);
      expect(result.current.masteredIds.size).toBe(4);
      expect(result.current.learningIds.size).toBe(2);

      const missedIds = Array.from(result.current.learningIds);
      expect(missedIds.length).toBe(2);

      // Start round 2 with missed cases only
      act(() => {
        result.current.reviewMissed();
      });

      expect(result.current.roundNumber).toBe(2);
      expect(result.current.isRoundFinished).toBe(false);
      expect(result.current.activeQueue.length).toBe(2);

      const round2IdsBeforeShuffle = result.current.activeQueue.map(c => c.id).sort();
      expect(round2IdsBeforeShuffle).toEqual([...missedIds].sort());

      // Toggle shuffle mid-round 2
      const shuffleStateBefore = result.current.isShuffled;
      act(() => {
        result.current.toggleShuffle();
      });

      // Verify activeQueue still has 2 cards and NOT the full 6 baseCases
      expect(result.current.isShuffled).toBe(!shuffleStateBefore);
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.length).toBe(2);
      expect(result.current.activeQueue.length).not.toBe(totalBaseCards);

      const round2IdsAfterShuffle = result.current.activeQueue.map(c => c.id).sort();
      expect(round2IdsAfterShuffle).toEqual([...missedIds].sort());

      unmount();
    });
  });
});
