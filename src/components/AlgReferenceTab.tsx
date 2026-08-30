import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Search, Bookmark, Play, X, Sparkles, Lightbulb, Compass, ArrowLeft, Layers, ChevronRight, BookOpen } from 'lucide-react';

interface CategoryFolder {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  caseCount: number;
  badgeColor: string;
  filterFn: (c: AlgCase) => boolean;
}

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>('2-look-cfop'); // Default to 2-Look CFOP open
  const [selectedCase, setSelectedCase] = useState<AlgCase | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cfop_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const allCases: AlgCase[] = useMemo(() => {
    return [...OLL_2LOOK_CASES, ...PLL_2LOOK_CASES, ...FULL_PLL_CASES, ...F2L_HIGHLIGHTS];
  }, []);

  const folders: CategoryFolder[] = useMemo(() => {
    return [
      {
        id: '2-look-cfop',
        name: '2-Look CFOP',
        subtitle: 'Essential Speedcubing Foundation (16 Cases)',
        description: 'Complete 2-Look OLL (Edges & Corners) and 2-Look PLL (Corners & Edges) with intuitive formula breakdowns.',
        caseCount: allCases.filter(c => c.is2Look === true).length,
        badgeColor: 'from-amber-500/20 to-indigo-500/20 text-amber-300 border-amber-500/30',
        filterFn: c => c.is2Look === true,
      },
      {
        id: 'full-pll',
        name: 'Full PLL',
        subtitle: 'Permutation of Last Layer (21 Cases)',
        description: 'All 21 Last Layer Permutations categorized by corner & edge swap types.',
        caseCount: FULL_PLL_CASES.length,
        badgeColor: 'from-indigo-500/20 to-purple-500/20 text-indigo-300 border-indigo-500/30',
        filterFn: c => c.subcategory === 'Full PLL' || c.subcategory === '2-Look PLL',
      },
      {
        id: '2-look-oll',
        name: '2-Look OLL',
        subtitle: 'Orientation Stage (10 Cases)',
        description: '3 Edge orientation triggers + 7 Corner orientation algorithms.',
        caseCount: OLL_2LOOK_CASES.length,
        badgeColor: 'from-amber-500/20 to-yellow-500/20 text-amber-300 border-amber-500/30',
        filterFn: c => c.subcategory === '2-Look OLL',
      },
      {
        id: 'f2l',
        name: 'First 2 Layers (F2L)',
        subtitle: 'Intuitive Pair Building',
        description: 'Basic pairing and slot insertion mechanics for building the bottom 2 layers.',
        caseCount: F2L_HIGHLIGHTS.length,
        badgeColor: 'from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30',
        filterFn: c => c.category === 'f2l',
      },
      {
        id: 'bookmarked',
        name: 'Saved Bookmarks',
        subtitle: 'Your Personal Practice List',
        description: 'Algorithms you have saved for quick review.',
        caseCount: bookmarkedIds.length,
        badgeColor: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
        filterFn: c => bookmarkedIds.includes(c.id),
      },
    ];
  }, [allCases, bookmarkedIds]);

  const activeFolder = useMemo(() => {
    return folders.find(f => f.id === selectedFolderId) || null;
  }, [folders, selectedFolderId]);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('cfop_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const filteredCases = useMemo(() => {
    let cases = allCases;

    if (activeFolder) {
      cases = cases.filter(activeFolder.filterFn);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cases = cases.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.primaryAlg.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          (c.why && c.why.toLowerCase().includes(q))
      );
    }

    return cases;
  }, [allCases, activeFolder, searchQuery]);

  // Group cases by subcategory/group for clear tutorial reading
  const groupedCases = useMemo(() => {
    const groups: Record<string, AlgCase[]> = {};
    filteredCases.forEach(c => {
      const groupKey = `${c.subcategory} • ${c.group}`;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });
    return groups;
  }, [filteredCases]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Hero Banner for Algorithm Tutorial List */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Algorithm Library
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              CFOP Algorithms & Mechanics
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Select a section below to inspect the algorithm list. Every entry features concise mechanics explanations and 3D move playback.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 backdrop-blur-md text-xs font-mono">
            <div className="flex flex-col items-center px-3 border-r border-slate-800">
              <span className="text-amber-400 font-bold text-lg">16</span>
              <span className="text-slate-500 text-[10px]">2-Look CFOP</span>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-indigo-400 font-bold text-lg">21</span>
              <span className="text-slate-500 text-[10px]">Full PLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Breadcrumb / Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {selectedFolderId && (
            <button
              onClick={() => setSelectedFolderId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> All Categories
            </button>
          )}

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 truncate">
            <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Algorithms</span>
            {activeFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-amber-400 font-bold">{activeFolder.name}</span>
              </>
            )}
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search algorithm, trigger or formula..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* LEVEL 1: Category Folders View (Shown when no folder is selected and no search) */}
      {!selectedFolderId && !searchQuery.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {folders.map(folder => (
            <div
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className="group flex flex-col justify-between bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/40 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r border ${folder.badgeColor} mb-2`}>
                    {folder.caseCount} Algorithms
                  </span>
                  <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {folder.name}
                  </h2>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">{folder.subtitle}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span>{folder.description}</span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
              </p>
            </div>
          ))}
        </div>
      )}

      {/* LEVEL 2: List of Algorithms inside Selected Folder or Search */}
      {(selectedFolderId || searchQuery.trim()) && (
        <div className="flex flex-col gap-8">
          {Object.keys(groupedCases).length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
              No matching algorithms found for "{searchQuery}".
            </div>
          ) : (
            Object.entries(groupedCases).map(([groupTitle, cases]) => (
              <div key={groupTitle} className="flex flex-col gap-4">
                {/* Section Header */}
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">{groupTitle}</h3>
                  <span className="text-xs font-mono text-slate-500 font-semibold">({cases.length} cases)</span>
                </div>

                {/* List of Algorithms */}
                <div className="flex flex-col gap-3">
                  {cases.map(c => {
                    const isBookmarked = bookmarkedIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCase(c)}
                        className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-amber-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-amber-500/5"
                      >
                        {/* 2D Pattern Diagram */}
                        {c.topGrid && (
                          <div className="shrink-0 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 self-center md:self-auto">
                            <AlgDiagram topGrid={c.topGrid} borderColors={c.borderColors} size={80} />
                          </div>
                        )}

                        {/* Alg Details & Why Mechanics */}
                        <div className="flex-1 flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {c.name}
                            </h4>

                            <button
                              onClick={e => toggleBookmark(c.id, e)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBookmarked
                                  ? 'text-amber-400 bg-amber-400/10'
                                  : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                              }`}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                            </button>
                          </div>

                          {/* Concise Why Explanation (Tutorial) */}
                          {c.why && (
                            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2">
                              <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <p className="leading-relaxed">
                                <strong className="text-amber-400">Why it works:</strong> {c.why}
                              </p>
                            </div>
                          )}

                          {/* Description & Tips */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                            <span>{c.description}</span>
                            {c.tips && (
                              <span className="text-amber-300/90 flex items-center gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {c.tips}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* LEVEL 3: View Formula & 3D Playback Button */}
                        <div className="shrink-0 flex flex-col items-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                          <code className="text-xs font-mono font-bold text-amber-300 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                            {c.primaryAlg}
                          </code>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/30 text-xs font-bold transition-all">
                            View Formula & 3D <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LEVEL 3: 3D Algorithm Viewer & Detailed Inspector Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedCase(null)}
              className="absolute right-4 top-4 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300">
                {selectedCase.subcategory} • {selectedCase.group}
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">{selectedCase.name}</h2>
            </div>

            {/* 3D Cube Player */}
            <RubiksCube3D
              initialAlgorithm={selectedCase.primaryAlg}
              autoPlay={true}
              highlightMode={selectedCase.category}
              size="h-[300px]"
            />

            {/* Case Info & Concise Mechanics */}
            <div className="flex flex-col gap-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-1">Formula:</span>
                <code className="text-base font-mono font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                  {selectedCase.primaryAlg}
                </code>
              </div>

              {selectedCase.why && (
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs text-slate-200">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <Compass className="w-4 h-4 text-amber-400" /> Why this is the formula:
                  </span>
                  <p className="leading-relaxed">{selectedCase.why}</p>
                </div>
              )}

              {selectedCase.alternativeAlgs && selectedCase.alternativeAlgs.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Alternative Formulas:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.alternativeAlgs.map((alt, idx) => (
                      <code key={idx} className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {alt}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.tips && (
                <p className="text-xs text-amber-300 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <strong>Recognition Tip:</strong> {selectedCase.tips}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
