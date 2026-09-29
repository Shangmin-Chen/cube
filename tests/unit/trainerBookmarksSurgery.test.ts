import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { useTrainerSession } from '../../src/hooks/useTrainerSession';

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

class EventTargetMock {
  private listeners = new Map<string, Set<(e: any) => void>>();

  addEventListener(type: string, fn: (e: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(fn);
  }

  removeEventListener(type: string, fn: (e: any) => void) {
    this.listeners.get(type)?.delete(fn);
  }

  dispatchEvent(e: { type: string }): boolean {
    const handlers = this.listeners.get(e.type);
    if (handlers) {
      for (const handler of Array.from(handlers)) {
        handler(e);
      }
    }
    return true;
  }
}

class HTMLIFrameElementMock {}
class HTMLElementMock extends EventTargetMock {}

function setupDomHarness() {
  const windowTarget = new EventTargetMock();

  const doc = Object.assign(new EventTargetMock(), {
    nodeType: 9,
    defaultView: null as any,
    activeElement: null,
    createElement(tag: string) {
      return Object.assign(new EventTargetMock(), {
        nodeType: 1,
        tagName: tag.toUpperCase(),
        nodeName: tag.toUpperCase(),
        style: {},
        ownerDocument: doc,
        setAttribute() {},
        removeAttribute() {},
        appendChild() {},
        removeChild() {},
        insertBefore() {},
      });
    },
    createTextNode(text: string) {
      return { nodeType: 3, nodeValue: text };
    },
    createComment(data: string) {
      return { nodeType: 8, nodeValue: data };
    },
  });

  const windowObj = Object.assign(windowTarget, {
    HTMLIFrameElement: HTMLIFrameElementMock,
    HTMLElement: HTMLElementMock,
    document: doc,
  });

  doc.defaultView = windowObj;

  const origWindow = globalThis.window;
  const origDocument = globalThis.document;
  const origHTMLIFrameElement = (globalThis as any).HTMLIFrameElement;
  const origHTMLElement = (globalThis as any).HTMLElement;

  globalThis.window = windowObj as any;
  globalThis.document = doc as any;
  (globalThis as any).HTMLIFrameElement = HTMLIFrameElementMock;
  (globalThis as any).HTMLElement = HTMLElementMock;

  return {
    cleanup() {
      globalThis.window = origWindow;
      globalThis.document = origDocument;
      (globalThis as any).HTMLIFrameElement = origHTMLIFrameElement;
      (globalThis as any).HTMLElement = origHTMLElement;
    },
  };
}

interface HookProps {
  deckId: string;
  bookmarks: string[];
  methodId?: string;
}

function renderTrainerHook(initialProps: HookProps) {
  const result = { current: undefined as unknown as ReturnType<typeof useTrainerSession> };
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container as any);

  function Wrapper({ props }: { props: HookProps }) {
    // oxlint-disable-next-line react/immutability
    result.current = useTrainerSession(props.deckId, props.bookmarks, props.methodId);
    return null;
  }

  act(() => {
    root.render(React.createElement(Wrapper, { props: initialProps }));
  });

  return {
    result,
    rerender(nextProps: HookProps) {
      act(() => {
        root.render(React.createElement(Wrapper, { props: nextProps }));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe('trainerBookmarksSurgery', () => {
  let harness: ReturnType<typeof setupDomHarness>;

  // Canonical case IDs present in CFOP 4-Look LL
  const CASE_SUNE = 'oll-2look-sune';
  const CASE_ANTISUNE = 'oll-2look-antisune';
  const CASE_H = 'oll-2look-h';
  const CASE_PI = 'oll-2look-pi';

  beforeEach(() => {
    harness = setupDomHarness();
  });

  afterEach(() => {
    harness.cleanup();
  });

  describe('Bookmarks deck queue surgery when bookmarkedIds changes mid-round', () => {
    it('preserves roundNumber (does NOT reset to 1) when bookmarks change mid-round', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      expect(result.current.activeQueue).toHaveLength(2);

      // Complete round 1 with learning outcomes to allow drilling missed cases
      act(() => {
        result.current.markLearning();
      });
      act(() => {
        result.current.markLearning();
      });
      expect(result.current.isRoundFinished).toBe(true);

      // Start round 2
      act(() => {
        result.current.reviewMissed();
      });
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.isRoundFinished).toBe(false);

      // Mid-round in round 2: Add a newly bookmarked card
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_H],
        methodId: 'cfop-4look',
      });

      // roundNumber MUST be preserved at 2, not reset to 1
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.some(c => c.id === CASE_H)).toBe(true);

      // Mid-round in round 2: Remove a bookmarked card
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_ANTISUNE, CASE_H],
        methodId: 'cfop-4look',
      });

      // roundNumber MUST still be preserved at 2
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.some(c => c.id === CASE_SUNE)).toBe(false);
    });

    it('preserves masteredIds and learningIds sets for remaining cards', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      // Turn shuffle off for deterministic queue ordering
      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // First card: mark as mastered
      const firstCardId = result.current.currentCase!.id;
      act(() => {
        result.current.markMastered();
      });

      // Second card: mark as learning
      const secondCardId = result.current.currentCase!.id;
      act(() => {
        result.current.markLearning();
      });

      expect(result.current.masteredIds.has(firstCardId)).toBe(true);
      expect(result.current.learningIds.has(secondCardId)).toBe(true);

      // Add a 4th bookmark mid-round
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_H, CASE_PI],
        methodId: 'cfop-4look',
      });

      // Existing mastery tracking must be strictly preserved
      expect(result.current.masteredIds.has(firstCardId)).toBe(true);
      expect(result.current.learningIds.has(secondCardId)).toBe(true);
    });

    it('removes unbookmarked card from active queue and prunes it from mastery sets', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // Mark first card as mastered, second as learning
      act(() => {
        result.current.markMastered(); // marks CASE_SUNE
      });
      act(() => {
        result.current.markLearning(); // marks CASE_ANTISUNE
      });

      expect(result.current.masteredIds.has(CASE_SUNE)).toBe(true);
      expect(result.current.learningIds.has(CASE_ANTISUNE)).toBe(true);
      expect(result.current.activeQueue.map(c => c.id)).toContain(CASE_SUNE);

      // Unbookmark CASE_SUNE (which was mastered)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_ANTISUNE, CASE_H],
        methodId: 'cfop-4look',
      });

      // CASE_SUNE must be removed from activeQueue and pruned from masteredIds
      expect(result.current.activeQueue.map(c => c.id)).not.toContain(CASE_SUNE);
      expect(result.current.masteredIds.has(CASE_SUNE)).toBe(false);
      // CASE_ANTISUNE must still be in learningIds
      expect(result.current.learningIds.has(CASE_ANTISUNE)).toBe(true);

      // Unbookmark CASE_ANTISUNE (which was in learningIds)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_H],
        methodId: 'cfop-4look',
      });

      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_H]);
      expect(result.current.learningIds.has(CASE_ANTISUNE)).toBe(false);
    });

    it('appends newly bookmarked card to the active queue', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_SUNE, CASE_ANTISUNE]);

      // Append CASE_H
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_H],
        methodId: 'cfop-4look',
      });

      const queueIdsAfterFirstAdd = result.current.activeQueue.map(c => c.id);
      expect(queueIdsAfterFirstAdd).toEqual([CASE_SUNE, CASE_ANTISUNE, CASE_H]);

      // Append CASE_PI
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_H, CASE_PI],
        methodId: 'cfop-4look',
      });

      const queueIdsAfterSecondAdd = result.current.activeQueue.map(c => c.id);
      expect(queueIdsAfterSecondAdd).toEqual([CASE_SUNE, CASE_ANTISUNE, CASE_H, CASE_PI]);
    });

    it('clamps currentIndex safely when queue shrinks below currentIndex', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // Navigate to index 2 (last card)
      act(() => {
        result.current.next();
      });
      act(() => {
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(2);

      // Remove 2 bookmarks, shrinking queue from 3 to 1
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE],
        methodId: 'cfop-4look',
      });

      // currentIndex should clamp from 2 to 0 (max valid index = 1 - 1 = 0)
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.activeQueue).toHaveLength(1);
      expect(result.current.currentCase?.id).toBe(CASE_SUNE);

      // Remove all bookmarks
      rerender({
        deckId: 'bookmarks',
        bookmarks: [],
        methodId: 'cfop-4look',
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.activeQueue).toHaveLength(0);
      expect(result.current.currentCase).toBeUndefined();
    });

    it('does NOT resurrect Round 1 mastered cards when a bookmark is added or removed in Round 2', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // Round 1: Master first card (CASE_SUNE), mark others as learning
      act(() => {
        result.current.markMastered(); // CASE_SUNE
      });
      act(() => {
        result.current.markLearning(); // CASE_ANTISUNE
      });
      act(() => {
        result.current.markLearning(); // CASE_H
      });
      expect(result.current.isRoundFinished).toBe(true);

      // Transition to Round 2 with missed cases only
      act(() => {
        result.current.reviewMissed();
      });
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_ANTISUNE, CASE_H]);

      // Mid-round in Round 2: Add a new bookmark (CASE_PI)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_H, CASE_PI],
        methodId: 'cfop-4look',
      });

      // CASE_SUNE must NOT be resurrected into activeQueue in Round 2
      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_ANTISUNE, CASE_H, CASE_PI]);
      expect(result.current.activeQueue.some(c => c.id === CASE_SUNE)).toBe(false);

      // Mid-round in Round 2: Remove a learning bookmark (CASE_H)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE, CASE_PI],
        methodId: 'cfop-4look',
      });

      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_ANTISUNE, CASE_PI]);
      expect(result.current.activeQueue.some(c => c.id === CASE_SUNE)).toBe(false);

      // Mid-round in Round 2: Remove the Round 1 mastered bookmark (CASE_SUNE)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_ANTISUNE, CASE_PI],
        methodId: 'cfop-4look',
      });

      expect(result.current.roundNumber).toBe(2);
      expect(result.current.activeQueue.map(c => c.id)).toEqual([CASE_ANTISUNE, CASE_PI]);
      expect(result.current.activeQueue.some(c => c.id === CASE_SUNE)).toBe(false);
    });

    it('preserves the currently viewed card when an earlier card is unbookmarked', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H, CASE_PI];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // Navigate to index 2 (CASE_H)
      act(() => {
        result.current.next();
      });
      act(() => {
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentCase?.id).toBe(CASE_H);

      // Unbookmark the first card (CASE_SUNE at index 0)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_ANTISUNE, CASE_H, CASE_PI],
        methodId: 'cfop-4look',
      });

      // User must still be viewing CASE_H, with index updated to 1
      expect(result.current.currentCase?.id).toBe(CASE_H);
      expect(result.current.currentIndex).toBe(1);

      // Unbookmark CASE_ANTISUNE (now at index 0)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_H, CASE_PI],
        methodId: 'cfop-4look',
      });

      // User must still be viewing CASE_H, with index updated to 0
      expect(result.current.currentCase?.id).toBe(CASE_H);
      expect(result.current.currentIndex).toBe(0);
    });

    it('resets isFlipped and showHint and clamps index when unbookmarking the active card', () => {
      const initialBookmarks = [CASE_SUNE, CASE_ANTISUNE, CASE_H];
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: initialBookmarks,
        methodId: 'cfop-4look',
      });

      if (result.current.isShuffled) {
        act(() => {
          result.current.toggleShuffle();
        });
      }

      // Navigate to the last card (CASE_H at index 2)
      act(() => {
        result.current.next();
      });
      act(() => {
        result.current.next();
      });
      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentCase?.id).toBe(CASE_H);

      // Flip the card and reveal hint
      act(() => {
        result.current.flip();
        result.current.toggleHint();
      });
      expect(result.current.isFlipped).toBe(true);
      expect(result.current.showHint).toBe(true);

      // Unbookmark the active card (CASE_H)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE],
        methodId: 'cfop-4look',
      });

      // Queue is now length 2. Index should clamp from 2 to 1 (CASE_ANTISUNE)
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.currentCase?.id).toBe(CASE_ANTISUNE);
      // isFlipped and showHint MUST be reset
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.showHint).toBe(false);

      // Now flip again on CASE_ANTISUNE
      act(() => {
        result.current.flip();
      });
      expect(result.current.isFlipped).toBe(true);

      // Unbookmark CASE_ANTISUNE (currently active at index 1)
      rerender({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE],
        methodId: 'cfop-4look',
      });

      // Index clamps to 0 (CASE_SUNE), isFlipped reset
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.currentCase?.id).toBe(CASE_SUNE);
      expect(result.current.isFlipped).toBe(false);
      expect(result.current.showHint).toBe(false);
    });
  });

  describe('Full re-init on deckId or methodId changes', () => {
    it('triggers full re-init when deckId changes', () => {
      const { result, rerender } = renderTrainerHook({
        deckId: 'bookmarks',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE],
        methodId: 'cfop-4look',
      });

      // Progress through cards, advance round to 2
      act(() => {
        result.current.markLearning();
      });
      act(() => {
        result.current.markLearning();
      });
      act(() => {
        result.current.reviewMissed();
      });
      act(() => {
        result.current.markMastered();
      });

      expect(result.current.roundNumber).toBe(2);
      expect(result.current.masteredIds.size).toBe(1);

      // Change deckId to '2-look-oll'
      rerender({
        deckId: '2-look-oll',
        bookmarks: [CASE_SUNE, CASE_ANTISUNE],
        methodId: 'cfop-4look',
      });

      // Full re-init: roundNumber resets to 1, mastery sets reset, currentIndex resets to 0
      expect(result.current.roundNumber).toBe(1);
      expect(result.current.masteredIds.size).toBe(0);
      expect(result.current.learningIds.size).toBe(0);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.activeQueue).toHaveLength(10); // 2-Look OLL has 10 cases
    });

    it('triggers full re-init when methodId changes', () => {
      const { result, rerender } = renderTrainerHook({
        deckId: '2-look-oll',
        bookmarks: [],
        methodId: 'cfop-4look',
      });

      // Mark first card mastered and navigate forward
      act(() => {
        result.current.markMastered();
      });
      expect(result.current.masteredIds.size).toBe(1);
      expect(result.current.currentIndex).toBe(1);

      // Change methodId to 'cfop-2look'
      rerender({
        deckId: '2-look-oll',
        bookmarks: [],
        methodId: 'cfop-2look',
      });

      // Full re-init
      expect(result.current.roundNumber).toBe(1);
      expect(result.current.masteredIds.size).toBe(0);
      expect(result.current.learningIds.size).toBe(0);
      expect(result.current.currentIndex).toBe(0);
    });
  });
});
