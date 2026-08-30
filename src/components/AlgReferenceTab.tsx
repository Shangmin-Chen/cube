import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Search, Bookmark, Play, X, Info } from 'lucide-react';

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [selectedCase, setSelectedCase] = useState<AlgCase | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('cfop_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const allCases: AlgCase[] = useMemo(() => {
    return [...OLL_2LOOK_CASES, ...PLL_2LOOK_CASES, ...FULL_PLL_CASES, ...F2L_HIGHLIGHTS];
  }, []);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('cfop_bookmarks', JSON.stringify(next));
      return next;
    });
  };

  const filteredCases = useMemo(() => {
    return allCases.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.primaryAlg.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.group.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedSubcategory === 'Bookmarked') return bookmarkedIds.includes(c.id);
      if (selectedSubcategory === '2-Look OLL') return c.subcategory === '2-Look OLL';
      if (selectedSubcategory === '2-Look PLL') return c.subcategory === '2-Look PLL';
      if (selectedSubcategory === 'Full PLL') return c.subcategory === 'Full PLL';
      if (selectedSubcategory === 'F2L') return c.category === 'f2l';

      return true;
    });
  }, [allCases, searchQuery, selectedSubcategory, bookmarkedIds]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search alg (e.g. T Perm, Sune, R U R')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['All', '2-Look OLL', '2-Look PLL', 'Full PLL', 'F2L', 'Bookmarked'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedSubcategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubcategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCases.map(c => {
          const isBookmarked = bookmarkedIds.includes(c.id);
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCase(c)}
              className="group relative flex flex-col justify-between bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-400 mb-1">
                    {c.subcategory}
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {c.name}
                  </h3>
                </div>

                <button
                  onClick={e => toggleBookmark(c.id, e)}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked
                      ? 'text-amber-400 bg-amber-400/10'
                      : 'text-slate-600 hover:text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* Middle Diagram + Primary Alg */}
              <div className="flex items-center gap-4 my-4">
                {c.topGrid && (
                  <div className="shrink-0 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <AlgDiagram topGrid={c.topGrid} borderColors={c.borderColors} size={80} />
                  </div>
                )}
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] text-slate-500 font-medium">Primary Alg:</span>
                  <code className="text-sm font-mono font-bold text-amber-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 break-words">
                    {c.primaryAlg}
                  </code>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="truncate">{c.group}</span>
                <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-1 transition-transform">
                  3D View <Play className="w-3 h-3 fill-indigo-400" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3D Algorithm Viewer Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6">
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
              size="h-[320px]"
            />

            {/* Case Info */}
            <div className="flex flex-col gap-3 bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-1">Algorithm:</span>
                <code className="text-base font-mono font-bold text-amber-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 inline-block">
                  {selectedCase.primaryAlg}
                </code>
              </div>

              {selectedCase.alternativeAlgs && selectedCase.alternativeAlgs.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 font-semibold block mb-1">Alternative Algs:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.alternativeAlgs.map((alt, idx) => (
                      <code key={idx} className="text-xs font-mono text-slate-300 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                        {alt}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.description && (
                <p className="text-xs text-slate-300 flex items-start gap-2 mt-1">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  {selectedCase.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
