import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cfop_bookmarks';
const UPDATE_EVENT = 'cube:bookmarks_updated';

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

  // Persist bookmarks to localStorage after each state commit (not inside the updater).
  // This avoids side effects during React StrictMode double-invocation of updaters.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedIds));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {
      // Storage full or unavailable — state is still correct in memory
    }
  }, [bookmarkedIds]);

  // Sync from other tabs or windows
  const syncBookmarks = useCallback(() => {
    setBookmarkedIds(loadBookmarks());
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        syncBookmarks();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
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
