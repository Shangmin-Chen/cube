import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import ReactDOM from 'react-dom/client';
import { useBookmarks } from '../../src/hooks/useBookmarks';

// Polyfill minimal browser environment for React in node test environment
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

  clearListeners() {
    this.listeners.clear();
  }
}

class MockStorageEvent extends Event {
  key: string | null;

  constructor(type: string, init?: { key?: string | null }) {
    super(type);
    this.key = init?.key ?? null;
  }
}

class HTMLIFrameElementMock {}
class HTMLElementMock extends EventTargetMock {}

function setupDomHarness() {
  const windowTarget = new EventTargetMock();
  const storageMap = new Map<string, string>();

  const localStorageMock = {
    getItem: vi.fn((key: string): string | null => storageMap.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storageMap.set(key, String(value));
    }),
    removeItem: vi.fn((key: string) => {
      storageMap.delete(key);
    }),
    clear: vi.fn(() => {
      storageMap.clear();
    }),
    get length() {
      return storageMap.size;
    },
    key: vi.fn((idx: number) => Array.from(storageMap.keys())[idx] ?? null),
  };

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
    localStorage: localStorageMock,
    StorageEvent: MockStorageEvent,
  });

  doc.defaultView = windowObj;

  // Assign to globalThis
  const origWindow = globalThis.window;
  const origDocument = globalThis.document;
  const origLocalStorage = (globalThis as any).localStorage;
  const origStorageEvent = (globalThis as any).StorageEvent;
  const origHTMLIFrameElement = (globalThis as any).HTMLIFrameElement;
  const origHTMLElement = (globalThis as any).HTMLElement;

  globalThis.window = windowObj as any;
  globalThis.document = doc as any;
  (globalThis as any).localStorage = localStorageMock;
  (globalThis as any).StorageEvent = MockStorageEvent;
  (globalThis as any).HTMLIFrameElement = HTMLIFrameElementMock;
  (globalThis as any).HTMLElement = HTMLElementMock;

  return {
    windowObj,
    doc,
    storageMap,
    localStorageMock,
    cleanup() {
      globalThis.window = origWindow;
      globalThis.document = origDocument;
      (globalThis as any).localStorage = origLocalStorage;
      (globalThis as any).StorageEvent = origStorageEvent;
      (globalThis as any).HTMLIFrameElement = origHTMLIFrameElement;
      (globalThis as any).HTMLElement = origHTMLElement;
    },
  };
}

function renderHook<TResult>(hookFn: () => TResult) {
  const result = { current: undefined as unknown as TResult };
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container as any);

  function Wrapper() {
    result.current = hookFn();
    return null;
  }

  act(() => {
    root.render(React.createElement(Wrapper));
  });

  return {
    result,
    rerender() {
      act(() => {
        root.render(React.createElement(Wrapper));
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    },
  };
}

describe('useBookmarks', () => {
  let harness: ReturnType<typeof setupDomHarness>;

  beforeEach(() => {
    harness = setupDomHarness();
  });

  afterEach(() => {
    harness.cleanup();
  });

  describe('Loading from localStorage and filtering non-strings', () => {
    it('initializes with empty array when localStorage is empty', () => {
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);
    });

    it('loads valid string IDs from localStorage', () => {
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['sune', 't-perm', 'f2l-1']));
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual(['sune', 't-perm', 'f2l-1']);
    });

    it('filters out non-string entries from legacy or corrupt data', () => {
      const mixedData = [
        'sune',
        12345,
        null,
        undefined,
        { id: 'oll-21' },
        true,
        false,
        ['nested'],
        't-perm',
      ];
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(mixedData));

      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual(['sune', 't-perm']);
    });

    it('handles non-array JSON by falling back to empty array', () => {
      harness.storageMap.set('cfop_bookmarks', JSON.stringify({ id: 'sune' }));
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);
    });

    it('handles syntax errors in localStorage gracefully', () => {
      harness.storageMap.set('cfop_bookmarks', 'invalid-json{{{{');
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);
    });
  });

  describe('Toggling bookmarks', () => {
    it('adds a bookmark when not present, and removes it when present', () => {
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);
      expect(result.current.isBookmarked('oll-21')).toBe(false);

      // Add
      act(() => {
        result.current.toggleBookmark('oll-21');
      });
      expect(result.current.bookmarkedIds).toEqual(['oll-21']);
      expect(result.current.isBookmarked('oll-21')).toBe(true);

      // Add another
      act(() => {
        result.current.toggleBookmark('pll-t');
      });
      expect(result.current.bookmarkedIds).toEqual(['oll-21', 'pll-t']);
      expect(result.current.isBookmarked('pll-t')).toBe(true);

      // Remove the first
      act(() => {
        result.current.toggleBookmark('oll-21');
      });
      expect(result.current.bookmarkedIds).toEqual(['pll-t']);
      expect(result.current.isBookmarked('oll-21')).toBe(false);
      expect(result.current.isBookmarked('pll-t')).toBe(true);
    });

    it('stops event propagation if an event object is provided', () => {
      const { result } = renderHook(() => useBookmarks());
      const stopPropagation = vi.fn();
      const mockEvent = { stopPropagation } as unknown as React.MouseEvent;

      act(() => {
        result.current.toggleBookmark('oll-21', mockEvent);
      });

      expect(stopPropagation).toHaveBeenCalledOnce();
      expect(result.current.bookmarkedIds).toEqual(['oll-21']);
    });
  });

  describe('LocalStorage persistence and cube:bookmarks_updated event', () => {
    it('updates localStorage and dispatches cube:bookmarks_updated on toggle', () => {
      const eventListener = vi.fn();
      window.addEventListener('cube:bookmarks_updated', eventListener);

      const { result } = renderHook(() => useBookmarks());
      // On initial mount, state has not changed, so it does NOT write to localStorage or dispatch event
      expect(eventListener).not.toHaveBeenCalled();
      expect(harness.storageMap.get('cfop_bookmarks')).toBeUndefined();

      act(() => {
        result.current.toggleBookmark('oll-25');
      });

      expect(harness.storageMap.get('cfop_bookmarks')).toBe(JSON.stringify(['oll-25']));
      expect(eventListener).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.toggleBookmark('oll-25');
      });

      expect(harness.storageMap.get('cfop_bookmarks')).toBe(JSON.stringify([]));
      expect(eventListener).toHaveBeenCalledTimes(2);

      window.removeEventListener('cube:bookmarks_updated', eventListener);
    });

    it('handles localStorage throwing QuotaExceededError without crashing', () => {
      const { result } = renderHook(() => useBookmarks());

      // Mock setItem to throw
      harness.localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        act(() => {
          result.current.toggleBookmark('oll-27');
        });
      }).not.toThrow();

      // State in memory is still updated
      expect(result.current.bookmarkedIds).toEqual(['oll-27']);
    });
  });

  describe('Syncing on storage event', () => {
    it('syncs bookmarks when storage event matches STORAGE_KEY', () => {
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);

      // Simulate an update from another tab
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['cross-1', 'pll-u-a']));

      act(() => {
        window.dispatchEvent(
          new MockStorageEvent('storage', { key: 'cfop_bookmarks' })
        );
      });

      expect(result.current.bookmarkedIds).toEqual(['cross-1', 'pll-u-a']);
      expect(result.current.isBookmarked('cross-1')).toBe(true);
    });

    it('syncs bookmarks when storage event has key === null (storage.clear())', () => {
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['cross-1']));
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual(['cross-1']);

      // External storage.clear() fires StorageEvent with key = null
      harness.storageMap.clear();
      act(() => {
        window.dispatchEvent(new MockStorageEvent('storage', { key: null }));
      });

      expect(result.current.bookmarkedIds).toEqual([]);
    });

    it('ignores storage events for other localStorage keys', () => {
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['cross-1']));
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual(['cross-1']);

      // Change an unrelated key in storage
      harness.storageMap.set('unrelated_key', 'some_value');
      act(() => {
        window.dispatchEvent(
          new MockStorageEvent('storage', { key: 'unrelated_key' })
        );
      });

      // Should remain unchanged
      expect(result.current.bookmarkedIds).toEqual(['cross-1']);
    });

    it('cleans up storage event listener on unmount', () => {
      const { result, unmount } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);

      unmount();

      // Update storage and fire storage event after unmount
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['after-unmount']));
      expect(() => {
        act(() => {
          window.dispatchEvent(
            new MockStorageEvent('storage', { key: 'cfop_bookmarks' })
          );
        });
      }).not.toThrow();

      // Hook state cannot change after unmount
      expect(result.current.bookmarkedIds).toEqual([]);
    });
  });

  describe('Intra-window syncing on cube:bookmarks_updated event', () => {
    it('syncs bookmarks across multiple hook instances within the same window', () => {
      const hook1 = renderHook(() => useBookmarks());
      const hook2 = renderHook(() => useBookmarks());

      expect(hook1.result.current.bookmarkedIds).toEqual([]);
      expect(hook2.result.current.bookmarkedIds).toEqual([]);

      act(() => {
        hook1.result.current.toggleBookmark('oll-21');
      });

      expect(hook1.result.current.bookmarkedIds).toEqual(['oll-21']);
      expect(hook2.result.current.bookmarkedIds).toEqual(['oll-21']);

      act(() => {
        hook2.result.current.toggleBookmark('pll-t');
      });

      expect(hook1.result.current.bookmarkedIds).toEqual(['oll-21', 'pll-t']);
      expect(hook2.result.current.bookmarkedIds).toEqual(['oll-21', 'pll-t']);

      hook1.unmount();
      hook2.unmount();
    });

    it('guards syncBookmarks with array equality check to prevent infinite loop or redundant updates', () => {
      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['oll-21']));
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual(['oll-21']);

      const initialArrayRef = result.current.bookmarkedIds;

      // Dispatch UPDATE_EVENT when storage content is identical
      act(() => {
        window.dispatchEvent(new Event('cube:bookmarks_updated'));
      });

      // State reference is strictly preserved because array equality guard prevented update
      expect(result.current.bookmarkedIds).toBe(initialArrayRef);
    });

    it('cleans up cube:bookmarks_updated event listener on unmount', () => {
      const { result, unmount } = renderHook(() => useBookmarks());
      expect(result.current.bookmarkedIds).toEqual([]);

      unmount();

      harness.storageMap.set('cfop_bookmarks', JSON.stringify(['after-unmount']));
      expect(() => {
        act(() => {
          window.dispatchEvent(new Event('cube:bookmarks_updated'));
        });
      }).not.toThrow();

      expect(result.current.bookmarkedIds).toEqual([]);
    });
  });
});
