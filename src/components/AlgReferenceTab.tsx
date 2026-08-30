import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Search, Bookmark, Play, X, Sparkles, Lightbulb, Compass } from 'lucide-react';

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('2-Look CFOP');
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
        c.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.why && c.why.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedSubcategory === '2-Look CFOP') return c.is2Look === true;
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
      {/* Hero Banner for Algorithm Reference */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 2-Look CFOP & Full Algorithm Library
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Algorithm Reference & Intuitive Mechanics
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Understand <i>why</i> each formula works with concise 1-2 sentence mechanics explanations and 3D move playback.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 backdrop-blur-md text-xs font-mono">
            <div className="flex flex-col items-center px-3 border-r border-slate-800">
              <span className="text-amber-400 font-bold text-lg">10</span>
              <span className="text-slate-500 text-[10px]">2-Look OLL</span>
            </div>
            <div className="flex flex-col items-center px-3 border-r border-slate-800">
              <span className="text-indigo-400 font-bold text-lg">6</span>
              <span className="text-slate-500 text-[10px]">2-Look PLL</span>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-emerald-400 font-bold text-lg">21</span>
              <span className="text-slate-500 text-[10px]">Full PLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search alg, trigger or explanation..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {['2-Look CFOP', 'All', '2-Look OLL', '2-Look PLL', 'Full PLL', 'F2L', 'Bookmarked'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedSubcategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubcategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
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
                    {c.subcategory} • {c.group}
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
                    <AlgDiagram topGrid={c.topGrid} borderColors={c.borderColors} size={75} />
                  </div>
                )}
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className="text-[11px] text-slate-500 font-medium">Formula:</span>
                  <code className="text-sm font-mono font-bold text-amber-300 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 break-words">
                    {c.primaryAlg}
                  </code>
                </div>
              </div>

              {/* Concise Why Explanation */}
              {c.why && (
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 mb-3 flex items-start gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    <strong className="text-amber-400">Why:</strong> {c.why}
                  </span>
                </div>
              )}

              {/* Bottom Details */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                <span className="truncate">{c.description}</span>
                <span className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-1 transition-transform font-medium">
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
