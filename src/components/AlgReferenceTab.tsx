import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import {
  Search,
  Bookmark,
  Play,
  X,
  Sparkles,
  Lightbulb,
  Compass,
  ArrowLeft,
  Layers,
  ChevronRight,
  Folder,
  Layers2,
  Lock,
} from 'lucide-react';

interface AlgCollection {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  badge: string;
  isAvailable: boolean;
  color: string;
}

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>('cfop'); // Default inside CFOP
  const [selectedCfopStep, setSelectedCfopStep] = useState<'cross' | 'f2l' | 'oll' | 'pll' | null>(null);
  const [pllMode, setPllMode] = useState<'2look' | 'full'>('2look');
  const [selectedCase, setSelectedCase] = useState<AlgCase | null>(null);
  
  // Safe localStorage deserialization
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cfop_bookmarks');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Cross Sample Case defined before allCases
  const crossCases: AlgCase[] = useMemo(
    () => [
      {
        id: 'cross-sample-1',
        name: 'Bottom Cross Edge Insertion',
        category: 'cross',
        subcategory: 'Cross (C)',
        group: 'Cross Step',
        primaryAlg: 'D2 R F L B',
        description: 'Align bottom cross edge with center and insert into bottom white face.',
        tips: 'Always solve the cross on bottom during inspection.',
        why: 'D2 aligns bottom centers while R F L B places all four edge stickers directly into white bottom face.',
        topGrid: ['G', 'G', 'G', 'G', 'W', 'G', 'G', 'G', 'G'],
        borderColors: {
          top: ['G', 'G_GREEN', 'G'],
          right: ['G', 'R', 'G'],
          bottom: ['G', 'B', 'G'],
          left: ['G', 'O', 'G'],
        },
      },
    ],
    []
  );

  const allCases: AlgCase[] = useMemo(() => {
    return [...crossCases, ...OLL_2LOOK_CASES, ...PLL_2LOOK_CASES, ...FULL_PLL_CASES, ...F2L_HIGHLIGHTS];
  }, [crossCases]);

  const collections: AlgCollection[] = useMemo(
    () => [
      {
        id: 'cfop',
        name: 'CFOP Method (3x3)',
        subtitle: 'Cross • F2L • OLL • PLL',
        description: 'The standard speedsolving method used by world record holders. Divided into 4 steps.',
        badge: '16-21 Algorithms',
        isAvailable: true,
        color: 'from-amber-500/20 to-indigo-500/20 text-amber-300 border-amber-500/30',
      },
      {
        id: 'roux',
        name: 'Roux Method (3x3)',
        subtitle: 'First Block • Second Block • CMLL • LSE',
        description: 'Block-building method with intuitive M-slice edge orientation.',
        badge: 'Coming Soon',
        isAvailable: false,
        color: 'from-slate-800/40 to-slate-900/40 text-slate-500 border-slate-800',
      },
      {
        id: 'zz',
        name: 'ZZ Method (3x3)',
        subtitle: 'EOline • ZZF2L • ZBLL',
        description: 'Pre-orients all edges during inspection for rotationless F2L.',
        badge: 'Coming Soon',
        isAvailable: false,
        color: 'from-slate-800/40 to-slate-900/40 text-slate-500 border-slate-800',
      },
      {
        id: '2x2',
        name: '2x2 Methods',
        subtitle: 'Ortega • CLL • EG-1',
        description: 'First face, OLL, and PBL layer permutation algorithms for 2x2 cubes.',
        badge: 'Coming Soon',
        isAvailable: false,
        color: 'from-slate-800/40 to-slate-900/40 text-slate-500 border-slate-800',
      },
      {
        id: 'bookmarked',
        name: 'Saved Bookmarks',
        subtitle: 'Your Bookmarked Algorithms',
        description: 'Quick reference list of algorithms you have saved for practice.',
        badge: `${bookmarkedIds.length} Saved`,
        isAvailable: true,
        color: 'from-rose-500/20 to-pink-500/20 text-rose-300 border-rose-500/30',
      },
    ],
    [bookmarkedIds]
  );

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('cfop_bookmarks', JSON.stringify(next));
      } catch {
        // Fallback if storage blocked
      }
      return next;
    });
  };

  // Determine cases to show for Level 3 (Inside a specific CFOP step)
  const currentStepCases = useMemo(() => {
    if (selectedCollectionId === 'bookmarked') {
      return allCases.filter(c => bookmarkedIds.includes(c.id));
    }

    if (!selectedCfopStep) return [];

    if (selectedCfopStep === 'cross') return crossCases;
    if (selectedCfopStep === 'f2l') return F2L_HIGHLIGHTS;
    if (selectedCfopStep === 'oll') return OLL_2LOOK_CASES;
    if (selectedCfopStep === 'pll') {
      return pllMode === '2look' ? PLL_2LOOK_CASES : FULL_PLL_CASES;
    }
    return [];
  }, [selectedCollectionId, selectedCfopStep, pllMode, crossCases, allCases, bookmarkedIds]);

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

  // Group cases by subcategory/stage
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
              <Sparkles className="w-3.5 h-3.5" /> Speedcubing Algorithm Collections
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Algorithm Library & Mechanics
            </h1>
            <p className="text-slate-300 mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Explore algorithms by method and step. Open any step to view concise mechanics explanations and 3D move playback.
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

      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-300">
          <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
          <button
            onClick={() => {
              setSelectedCollectionId(null);
              setSelectedCfopStep(null);
              setSelectedCase(null);
              setSearchQuery('');
            }}
            className="hover:text-amber-400 transition-colors"
          >
            Collections
          </button>

          {selectedCollectionId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <button
                onClick={() => {
                  setSelectedCfopStep(null);
                  setSelectedCase(null);
                  setSearchQuery('');
                }}
                className={`transition-colors ${!selectedCfopStep ? 'text-amber-400 font-bold' : 'hover:text-amber-400'}`}
              >
                {selectedCollectionId === 'cfop' ? 'CFOP Method' : 'Saved Bookmarks'}
              </button>
            </>
          )}

          {selectedCfopStep && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-amber-400 font-bold uppercase">{selectedCfopStep}</span>
            </>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
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

      {/* LEVEL 1: Collections View (Shown when no collection selected and no search) */}
      {!selectedCollectionId && !searchQuery.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map(col => (
            <div
              key={col.id}
              onClick={() => {
                if (col.isAvailable) {
                  setSelectedCollectionId(col.id);
                  setSelectedCfopStep(null);
                  setSelectedCase(null);
                  setSearchQuery('');
                }
              }}
              className={`group flex flex-col justify-between bg-slate-900/40 rounded-3xl p-6 border transition-all duration-200 ${
                col.isAvailable
                  ? 'hover:bg-slate-900/80 border-slate-800/80 hover:border-amber-500/40 cursor-pointer hover:shadow-xl hover:shadow-amber-500/5'
                  : 'border-slate-800/40 opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r border ${col.color} mb-2`}>
                    {col.badge}
                  </span>
                  <h2 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                    {col.name} {!col.isAvailable && <Lock className="w-4 h-4 text-slate-500" />}
                  </h2>
                  <p className="text-xs text-indigo-300 font-medium mt-0.5">{col.subtitle}</p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
                  <Folder className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span>{col.description}</span>
                {col.isAvailable && (
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* LEVEL 2: Inside CFOP Collection -> Render 4 Boxes for the 4 CFOP Steps (C, F, O, P) */}
      {selectedCollectionId === 'cfop' && !selectedCfopStep && !searchQuery.trim() && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers2 className="w-5 h-5 text-amber-400" /> CFOP Method Steps (Select a step to view algorithms)
            </h2>
            <button
              onClick={() => {
                setSelectedCollectionId(null);
                setSelectedCase(null);
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Collections
            </button>
          </div>

          {/* 4 Clean Boxes for C - F - O - P */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Cross (C) */}
            <div
              onClick={() => setSelectedCfopStep('cross')}
              className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center border border-amber-500/30 text-base">
                  C
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                  1 Case
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Step 1: Cross
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Build the four bottom cross edge pieces matching bottom center and side colors.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-amber-400">
                <span>View Cross Mechanics</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Box 2: F2L (F) */}
            <div
              onClick={() => setSelectedCfopStep('f2l')}
              className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center border border-indigo-500/30 text-base">
                  F
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-xs font-mono">
                  4 Cases
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Step 2: F2L (First 2 Layers)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Solve corner and edge pieces simultaneously into the bottom two layers.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-indigo-400">
                <span>View F2L Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Box 3: OLL (O) */}
            <div
              onClick={() => setSelectedCfopStep('oll')}
              className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 font-extrabold flex items-center justify-center border border-amber-500/30 text-base">
                  O
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 font-bold text-xs font-mono">
                  10 Cases (2-Look)
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Step 3: OLL (Orientation)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Orient the top face yellow stickers. 3 Edge orientation triggers + 7 Corner algorithms.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-amber-400">
                <span>View OLL Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Box 4: PLL (P) */}
            <div
              onClick={() => setSelectedCfopStep('pll')}
              className="group bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 font-extrabold flex items-center justify-center border border-purple-500/30 text-base">
                  P
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-indigo-400 font-bold text-xs font-mono">
                  6-21 Cases (PLL)
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Step 4: PLL (Permutation)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Permute top layer corners and edges to solve the cube. Toggle 2-Look or Full PLL.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs font-semibold text-purple-400">
                <span>View PLL Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 3: Inside a Specific Step (or Search) -> List of Algorithms */}
      {(selectedCfopStep || selectedCollectionId === 'bookmarked' || searchQuery.trim()) && (
        <div className="flex flex-col gap-6">
          {/* Controls Bar for Step View */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              {selectedCfopStep && (
                <button
                  onClick={() => {
                    setSelectedCfopStep(null);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to CFOP Steps
                </button>
              )}

              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                {selectedCfopStep ? `Step: ${selectedCfopStep}` : searchQuery ? 'Search Results' : 'Saved Bookmarks'}
              </h2>
            </div>

            {/* PLL Mode Toggle inside PLL step */}
            {selectedCfopStep === 'pll' && !searchQuery && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
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
          </div>

          {/* Grouped List of Cases */}
          {Object.keys(groupedCases).length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-sm">
              No matching algorithms found.
            </div>
          ) : (
            Object.entries(groupedCases).map(([groupTitle, cases]) => (
              <div key={groupTitle} className="flex flex-col gap-4">
                {/* Group Header */}
                <div className="flex items-center gap-3 border-b border-slate-800/80 pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">{groupTitle}</h3>
                  <span className="text-xs font-mono text-slate-500 font-semibold">({cases.length} cases)</span>
                </div>

                {/* Algorithms List */}
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
                              <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                                {c.name}
                              </h4>
                            </div>

                            <button
                              type="button"
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
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                          >
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

      {/* 3D Algorithm Viewer Modal with Backdrop Click Handler */}
      {selectedCase && (
        <div
          onClick={() => setSelectedCase(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-6 max-h-[90vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              type="button"
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

            {/* Case Info & Mechanics */}
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
