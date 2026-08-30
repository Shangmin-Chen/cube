import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Search, Bookmark, Play, X, Sparkles, Lightbulb, Compass } from 'lucide-react';

type CFOPStep = 'cross' | 'f2l' | 'oll' | 'pll';

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cfopStep, setCfopStep] = useState<'cross' | 'f2l' | 'oll' | 'pll'>('oll');
  const [pllMode, setPllMode] = useState<'2look' | 'full'>('2look');
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

  // Cross Sample Case
  const crossCases: AlgCase[] = useMemo(() => [
    {
      id: 'cross-sample-1',
      name: 'Bottom Cross Edge Insert',
      category: 'cross',
      subcategory: 'Cross (C)',
      group: 'Cross Edge',
      primaryAlg: "D2 R F L B",
      description: 'Align bottom cross edge with center and insert into bottom white face.',
      tips: 'Always solve the cross on bottom during inspection.',
      why: "D2 aligns bottom centers while R F L B places all four edge stickers directly into white bottom face.",
      topGrid: ['G', 'G', 'G', 'G', 'W', 'G', 'G', 'G', 'G'],
      borderColors: {
        top: ['G', 'G_GREEN', 'G'],
        right: ['G', 'R', 'G'],
        bottom: ['G', 'B', 'G'],
        left: ['G', 'O', 'G'],
      }
    }
  ], []);

  // Filter cases based on CFOP step (C -> F -> O -> P)
  const currentStepCases = useMemo(() => {
    if (cfopStep === 'cross') return crossCases;
    if (cfopStep === 'f2l') return F2L_HIGHLIGHTS;
    if (cfopStep === 'oll') return OLL_2LOOK_CASES;
    if (cfopStep === 'pll') {
      return pllMode === '2look' ? PLL_2LOOK_CASES : FULL_PLL_CASES;
    }
    return OLL_2LOOK_CASES;
  }, [cfopStep, pllMode, crossCases]);

  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return currentStepCases;
    const q = searchQuery.toLowerCase();
    return allCases.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.primaryAlg.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        (c.why && c.why.toLowerCase().includes(q))
    );
  }, [allCases, currentStepCases, searchQuery]);

  // Group cases by stage (e.g. Stage 1: Edges vs Stage 2: Corners)
  const groupedCases = useMemo(() => {
    const groups: Record<string, AlgCase[]> = {};
    filteredCases.forEach(c => {
      const groupKey = c.group;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });
    return groups;
  }, [filteredCases]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> 2-Look CFOP Method Flow
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              CFOP Algorithms & Mechanics
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Organized by the 4 CFOP steps: <strong>Cross (C)</strong>, <strong>F2L (F)</strong>, <strong>OLL (O)</strong>, and <strong>PLL (P)</strong>. Click any algorithm to view its formula and 3D move playback!
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800 backdrop-blur-md text-xs font-mono">
            <div className="flex flex-col items-center px-3 border-r border-slate-800">
              <span className="text-amber-400 font-bold text-lg">10</span>
              <span className="text-slate-500 text-[10px]">2-Look OLL</span>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-indigo-400 font-bold text-lg">6</span>
              <span className="text-slate-500 text-[10px]">2-Look PLL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main C - F - O - P Step Navigation Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* CFOP Step Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'cross', label: 'C • Cross', badge: '1 Case' },
            { id: 'f2l', label: 'F • F2L', badge: '4 Cases' },
            { id: 'oll', label: 'O • OLL (2-Look)', badge: '10 Cases' },
            { id: 'pll', label: 'P • PLL', badge: pllMode === '2look' ? '6 Cases' : '21 Cases' },
          ].map(step => (
            <button
              key={step.id}
              onClick={() => {
                setCfopStep(step.id as CFOPStep);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                cfopStep === step.id && !searchQuery
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                  : 'bg-slate-950/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{step.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                cfopStep === step.id && !searchQuery ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
              }`}>
                {step.badge}
              </span>
            </button>
          ))}
        </div>

        {/* PLL Mode Toggle (2-Look vs Full PLL) */}
        {cfopStep === 'pll' && !searchQuery && (
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setPllMode('2look')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                pllMode === '2look' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              2-Look PLL (6)
            </button>
            <button
              onClick={() => setPllMode('full')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                pllMode === 'full' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Full PLL (21)
            </button>
          </div>
        )}

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search all algorithms & formulas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* List of Algorithms grouped by CFOP Stage */}
      <div className="flex flex-col gap-8">
        {Object.keys(groupedCases).length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
            No matching algorithms found for "{searchQuery}".
          </div>
        ) : (
          Object.entries(groupedCases).map(([groupTitle, cases]) => (
            <div key={groupTitle} className="flex flex-col gap-4">
              {/* Stage Group Header */}
              <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                <h2 className="text-base font-bold text-white uppercase tracking-wider">{groupTitle}</h2>
                <span className="text-xs font-mono text-slate-500 font-semibold">({cases.length} cases)</span>
              </div>

              {/* Algorithm List */}
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

                      {/* Details & Why Mechanics */}
                      <div className="flex-1 flex flex-col gap-2 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300">
                              {c.subcategory}
                            </span>
                            <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                              {c.name}
                            </h3>
                          </div>

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

                        {/* Concise Why Explanation */}
                        {c.why && (
                          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 text-xs text-slate-200 flex items-start gap-2">
                            <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong className="text-amber-400">Why it works:</strong> {c.why}
                            </p>
                          </div>
                        )}

                        {/* Recognition & Description */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                          <span>{c.description}</span>
                          {c.tips && (
                            <span className="text-amber-300/90 flex items-center gap-1">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {c.tips}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Formula & 3D Playback Button */}
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
