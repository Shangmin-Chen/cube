import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'cfop_bookmarks';
const UPDATE_EVENT = 'cube:bookmarks_updated';

function areStringArraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Parse and validate stored bookmarks as a string array.
 * Rejects non-string elements that may have been persisted by older code.
 */
function loadBookmarks(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(loadBookmarks);
  const prevBookmarkedIdsRef = useRef<string[]>(bookmarkedIds);

  // Persist bookmarks to localStorage after each state commit (not inside the updater).
  // Avoid writing to localStorage on initial mount if state has not changed.
  useEffect(() => {
    if (areStringArraysEqual(prevBookmarkedIdsRef.current, bookmarkedIds)) {
      return;
    }
    prevBookmarkedIdsRef.current = bookmarkedIds;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedIds));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Storage full or unavailable — state is still correct in memory
    }
  }, [bookmarkedIds]);

  // Sync from other tabs, windows, or intra-window hook instances.
  // Guarded by array equality check to prevent infinite loop cycles between instances.
  const syncBookmarks = useCallback(() => {
    const loaded = loadBookmarks();
    prevBookmarkedIdsRef.current = loaded;
    setBookmarkedIds(prev => (areStringArraysEqual(prev, loaded) ? prev : loaded));
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        syncBookmarks();
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener(UPDATE_EVENT, syncBookmarks);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(UPDATE_EVENT, syncBookmarks);
    };
  }, [syncBookmarks]);

  const toggleBookmark = useCallback((id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.includes(id),
    [bookmarkedIds]
  );

  return {
    bookmarkedIds,
    toggleBookmark,
    isBookmarked,
  };
}
