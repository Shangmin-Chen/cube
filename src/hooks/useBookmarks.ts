import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'cfop_bookmarks';
const UPDATE_EVENT = 'cube:bookmarks_updated';

export function useBookmarks() {
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const syncBookmarks = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      setBookmarkedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    window.addEventListener('storage', syncBookmarks);
    window.addEventListener(UPDATE_EVENT, syncBookmarks);
    return () => {
      window.removeEventListener('storage', syncBookmarks);
      window.removeEventListener(UPDATE_EVENT, syncBookmarks);
    };
  }, [syncBookmarks]);

  const toggleBookmark = useCallback((id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(UPDATE_EVENT));
      } catch {
        // Fallback
      }
      return next;
    });
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
