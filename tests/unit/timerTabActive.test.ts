import { describe, it, expect, vi, beforeEach, afterEach, afterAll } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Mock RubiksCube3D to prevent Three.js WebGL initialization in Node
vi.mock('../../src/components/RubiksCube3D', () => ({
  RubiksCube3D: () => null,
}));

// Mock generateScramble for deterministic and fast tests
vi.mock('../../src/utils/cubeLogic', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/utils/cubeLogic')>();
  return {
    ...actual,
    generateScramble: vi.fn().mockResolvedValue("R U R' U'"),
  };
});

// Setup minimal DOM mock for Node environment with React 19
class MockNode {
  nodeType: number;
  nodeName: string;
  tagName: string;
  childNodes: MockNode[];
  style: Record<string, string>;
  ownerDocument: MockDocument | null;
  namespaceURI: string;
  nodeValue: string;
  _textContent = '';
  parentNode: MockNode | null = null;
  isContentEditable = false;

  constructor(nodeType = 1, nodeName = 'DIV') {
    this.nodeType = nodeType;
    this.nodeName = nodeName;
    this.tagName = nodeName;
    this.childNodes = [];
    this.style = {};
    this.ownerDocument = null;
    this.namespaceURI = 'http://www.w3.org/1999/xhtml';
    this.nodeValue = '';
  }

  get data(): string {
    return this.nodeValue;
  }

  set data(val: string) {
    this.nodeValue = val;
  }

  get textContent(): string {
    if (this.nodeType === 3) return this.nodeValue;
    if (this.childNodes.length > 0) {
      return this.childNodes.map(extractAllText).join('');
    }
    return this._textContent;
  }

  set textContent(val: string) {
    if (this.nodeType === 3) {
      this.nodeValue = val;
    } else {
      this._textContent = val;
      this.childNodes = [];
    }
  }

  appendChild(child: MockNode): MockNode {
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  insertBefore(child: MockNode, before: MockNode | null): MockNode {
    child.parentNode = this;
    const idx = before ? this.childNodes.indexOf(before) : -1;
    if (idx !== -1) {
      this.childNodes.splice(idx, 0, child);
    } else {
      this.childNodes.push(child);
    }
    return child;
  }

  removeChild(child: MockNode): MockNode {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) this.childNodes.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  setAttribute() {}
  removeAttribute() {}
  addEventListener() {}
  removeEventListener() {}
}

class MockDocument extends MockNode {
  documentElement: MockNode;
  defaultView: typeof globalThis;
  activeElement: MockNode | null = null;

  constructor() {
    super(9, '#document');
    this.documentElement = this.createElement('html');
    this.defaultView = globalThis;
  }

  createElement(tag: string): MockNode {
    const n = new MockNode(1, tag.toUpperCase());
    n.ownerDocument = this;
    return n;
  }

  createElementNS(_ns: string, tag: string): MockNode {
    const n = new MockNode(1, tag.toUpperCase());
    n.ownerDocument = this;
    return n;
  }

  createTextNode(text: string): MockNode {
    const node = new MockNode(3, '#text');
    node.nodeValue = text;
    node.ownerDocument = this;
    return node;
  }
}

function extractAllText(node: MockNode | null): string {
  if (!node) return '';
  if (node.nodeType === 3) return node.nodeValue || '';
  const childText = (node.childNodes || []).map(extractAllText).join('');
  return childText || (node as any)._textContent || '';
}

// Window event listeners storage
type Listener = (e: { code: string; type: string; repeat?: boolean; preventDefault: () => void; target: any }) => void;
let windowListeners: Record<string, Listener[]> = {};

function dispatchWindowEvent(type: 'keydown' | 'keyup', code: string) {
  const listeners = [...(windowListeners[type] || [])];
  const event = {
    type,
    code,
    repeat: false,
    preventDefault: vi.fn(),
    target: null,
  };
  listeners.forEach(fn => fn(event));
  return event;
}

// Save original globals before setting up test mock environment
const originalDocument = (globalThis as any).document;
const originalWindow = (globalThis as any).window;
const originalHTMLElement = (globalThis as any).HTMLElement;
const originalHTMLDivElement = (globalThis as any).HTMLDivElement;
const originalHTMLIFrameElement = (globalThis as any).HTMLIFrameElement;
const originalIS_REACT_ACT_ENVIRONMENT = (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
const originalLocalStorage = (globalThis as any).localStorage;
const originalAddEventListener = (globalThis as any).addEventListener;
const originalRemoveEventListener = (globalThis as any).removeEventListener;

// Global environment setup
const mockDoc = new MockDocument();
(globalThis as any).document = mockDoc;
(globalThis as any).window = globalThis;
(globalThis as any).HTMLElement = MockNode;
(globalThis as any).HTMLDivElement = MockNode;
(globalThis as any).HTMLIFrameElement = class HTMLIFrameElement {};
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).localStorage = {
  getItem: () => '[]',
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
};

(globalThis as any).addEventListener = (type: string, fn: Listener) => {
  if (!windowListeners[type]) windowListeners[type] = [];
  windowListeners[type].push(fn);
};
(globalThis as any).removeEventListener = (type: string, fn: Listener) => {
  if (!windowListeners[type]) return;
  windowListeners[type] = windowListeners[type].filter(l => l !== fn);
};

// Import component after environment setup
import { TimerTab } from '../../src/components/TimerTab';

describe('TimerTab active prop and Spacebar collision guard', () => {
  let container: MockNode;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    windowListeners = {};
    container = mockDoc.createElement('div');
    root = createRoot(container as any);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  afterAll(() => {
    const restoreGlobal = (key: string, original: unknown) => {
      if (original === undefined) {
        delete (globalThis as any)[key];
      } else {
        (globalThis as any)[key] = original;
      }
    };

    restoreGlobal('document', originalDocument);
    restoreGlobal('window', originalWindow);
    restoreGlobal('HTMLElement', originalHTMLElement);
    restoreGlobal('HTMLDivElement', originalHTMLDivElement);
    restoreGlobal('HTMLIFrameElement', originalHTMLIFrameElement);
    restoreGlobal('IS_REACT_ACT_ENVIRONMENT', originalIS_REACT_ACT_ENVIRONMENT);
    restoreGlobal('localStorage', originalLocalStorage);
    restoreGlobal('addEventListener', originalAddEventListener);
    restoreGlobal('removeEventListener', originalRemoveEventListener);
  });

  it('does NOT register window Spacebar listeners or trigger timer actions when active is false', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: false }));
    });
    // Flush initial scramble promise
    await act(async () => {
      await Promise.resolve();
    });

    // When active is false, keyboard listeners must NOT be registered on window
    const keydownListeners = windowListeners['keydown'] || [];
    expect(keydownListeners.length).toBe(0);

    const initialText = extractAllText(container);
    expect(initialText).toContain('Press and Hold Spacebar');

    // Dispatching Space keydown must NOT trigger holding or timer start
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });

    const afterText = extractAllText(container);
    expect(afterText).toContain('Press and Hold Spacebar');
    expect(afterText).not.toContain('Hold...');
    expect(afterText).not.toContain('Release Spacebar');

    // Advancing timers should not change anything
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(extractAllText(container)).not.toContain('Release Spacebar');
  });

  it('registers window Spacebar listeners and handles solve cycle when active is true', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true }));
    });
    // Flush initial scramble promise
    await act(async () => {
      await Promise.resolve();
    });

    const keydownListeners = windowListeners['keydown'] || [];
    expect(keydownListeners.length).toBeGreaterThan(0);

    // 1. Press and hold Spacebar -> transitions to 'holding'
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    expect(extractAllText(container)).toContain('Hold...');

    // 2. Hold for >= 300ms -> transitions to 'ready'
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    expect(extractAllText(container)).toContain('Release Spacebar');

    // 3. Release Spacebar -> transitions to 'running'
    await act(async () => {
      dispatchWindowEvent('keyup', 'Space');
    });
    expect(extractAllText(container)).toContain('Press Spacebar / Touch to Stop');

    // 4. Timer is running, advance time
    await act(async () => {
      vi.advanceTimersByTime(1200);
    });

    // 5. Press Spacebar to stop solve -> returns to idle and records solve
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
      dispatchWindowEvent('keyup', 'Space');
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(extractAllText(container)).toContain('Press and Hold Spacebar');
  });

  it('cancels holdTimerRef and resets to idle when active changes from true to false while arming', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Press Spacebar -> enters holding
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    expect(extractAllText(container)).toContain('Hold...');

    // Navigating away sets active to false
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: false }));
    });

    // Must reset to idle and clear holding state
    const textAfterNav = extractAllText(container);
    expect(textAfterNav).toContain('Press and Hold Spacebar');
    expect(textAfterNav).not.toContain('Hold...');
    expect(windowListeners['keydown'] || []).toHaveLength(0);

    // Advancing timers should NOT transition to ready
    await act(async () => {
      vi.advanceTimersByTime(500);
    });
    expect(extractAllText(container)).not.toContain('Release Spacebar');
  });

  it('lets running solve continue running when active transitions from true to false', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Start solve
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    await act(async () => {
      dispatchWindowEvent('keyup', 'Space');
    });
    expect(extractAllText(container)).toContain('Press Spacebar / Touch to Stop');

    // Navigate away while running
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: false }));
    });

    // Solve remains in running state
    expect(extractAllText(container)).toContain('Press Spacebar / Touch to Stop');
    expect(windowListeners['keydown'] || []).toHaveLength(0);

    // Spacebar on other tabs does nothing
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    expect(extractAllText(container)).toContain('Press Spacebar / Touch to Stop');

    // Navigating back restores listeners and allows stopping the solve
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true }));
    });
    expect(windowListeners['keydown'] || []).not.toHaveLength(0);

    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
      dispatchWindowEvent('keyup', 'Space');
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(extractAllText(container)).toContain('Press and Hold Spacebar');
  });

  it('cancels inspection and resets to idle without recording DNF or leaking timers when active changes to false', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true, initialUseInspection: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // 1. Arm timer and start inspection
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    await act(async () => {
      dispatchWindowEvent('keyup', 'Space');
    });

    // Verify timer entered inspection
    expect(extractAllText(container)).toContain('Inspecting...');

    // Advance 5 seconds into inspection (elapsed is 5000ms, well within 15s limit)
    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    // 2. Navigate away while inspecting -> active becomes false
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: false, initialUseInspection: true }));
    });

    // Verify inspection is cancelled: state reset to idle, instructions reset
    const textAfterNav = extractAllText(container);
    expect(textAfterNav).toContain('Press and Hold Spacebar');
    expect(textAfterNav).not.toContain('Inspecting...');
    expect(windowListeners['keydown'] || []).toHaveLength(0);

    // 3. Advance timers past the 17s DNF threshold (advance by 20,000ms)
    // to ensure no inspection timer interval was leaked in the background
    await act(async () => {
      vi.advanceTimersByTime(20000);
    });

    // Verify no DNF or solve was recorded in history
    const textAfterWait = extractAllText(container);
    expect(textAfterWait).toContain('No solve records yet');
    expect(textAfterWait).not.toContain('DNF');

    // 4. Navigating back keeps idle state and does not trigger DNF
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true, initialUseInspection: true }));
    });
    const textOnReturn = extractAllText(container);
    expect(textOnReturn).toContain('Press and Hold Spacebar');
    expect(textOnReturn).toContain('No solve records yet');
  });

  it('zeroes elapsedTime when transitioning from idle to holding', async () => {
    await act(async () => {
      root.render(React.createElement(TimerTab, { active: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Complete an initial solve
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    await act(async () => {
      vi.advanceTimersByTime(350);
    });
    await act(async () => {
      dispatchWindowEvent('keyup', 'Space');
    });
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
      dispatchWindowEvent('keyup', 'Space');
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Solve finished, time displayed is non-zero
    expect(extractAllText(container)).toContain('1.50');

    // Arm the timer for the next solve -> holding state immediately zeroes elapsedTime
    await act(async () => {
      dispatchWindowEvent('keydown', 'Space');
    });
    expect(extractAllText(container)).toContain('Hold...');
    expect(extractAllText(container)).toContain('0.00');
  });
});
