import React, { useState, useMemo } from 'react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import {
  Search,
  Bookmark,
  Play,
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
  colorVariant: 'amber' | 'indigo' | 'purple' | 'emerald' | 'default';
}

export const AlgReferenceTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>('cfop');
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
        colorVariant: 'amber',
      },
      {
        id: 'roux',
        name: 'Roux Method (3x3)',
        subtitle: 'First Block • Second Block • CMLL • LSE',
        description: 'Block-building method with intuitive M-slice edge orientation.',
        badge: 'Coming Soon',
        isAvailable: false,
        colorVariant: 'default',
      },
      {
        id: 'zz',
        name: 'ZZ Method (3x3)',
        subtitle: 'EOline • ZZF2L • ZBLL',
        description: 'Pre-orients all edges during inspection for rotationless F2L.',
        badge: 'Coming Soon',
        isAvailable: false,
        colorVariant: 'default',
      },
      {
        id: '2x2',
        name: '2x2 Methods',
        subtitle: 'Ortega • CLL • EG-1',
        description: 'First face, OLL, and PBL layer permutation algorithms for 2x2 cubes.',
        badge: 'Coming Soon',
        isAvailable: false,
        colorVariant: 'default',
      },
      {
        id: 'bookmarked',
        name: 'Saved Bookmarks',
        subtitle: 'Your Bookmarked Algorithms',
        description: 'Quick reference list of algorithms you have saved for practice.',
        badge: `${bookmarkedIds.length} Saved`,
        isAvailable: true,
        colorVariant: 'purple',
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
        // Fallback
      }
      return next;
    });
  };

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

  const groupedCases = useMemo(() => {
    const groups: Record<string, AlgCase[]> = {};
    filteredCases.forEach(c => {
      const groupKey = c.group;
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(c);
    });
    return groups;
  }, [filteredCases]);

  const handleSelectCollection = (id: string, isAvailable: boolean) => {
    if (isAvailable) {
      setSelectedCollectionId(id);
      setSelectedCfopStep(null);
      setSelectedCase(null);
      setSearchQuery('');
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Hero Banner */}
      <Card className="p-8 relative overflow-hidden bg-[#202020]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <Badge variant="amber" className="mb-3 flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Notion Dark Workspace Library
            </Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Algorithm Library & Mechanics
            </h1>
            <p className="text-[#888888] mt-2 max-w-xl text-sm md:text-base leading-relaxed">
              Explore algorithms by method and step. Open any step to view concise mechanics explanations and 3D move playback.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#191919] p-3 rounded-xl border border-[#2d2d2d] text-xs font-mono">
            <div className="flex flex-col items-center px-3 border-r border-[#2d2d2d]">
              <span className="text-[#eab308] font-bold text-lg">10</span>
              <span className="text-[#888888] text-[10px]">2-Look OLL</span>
            </div>
            <div className="flex flex-col items-center px-3">
              <span className="text-[#818cf8] font-bold text-lg">6</span>
              <span className="text-[#888888] text-[10px]">2-Look PLL</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Breadcrumb Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#202020] p-4 rounded-xl border border-[#2d2d2d]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#d4d4d4]">
          <Layers className="w-4 h-4 text-[#eab308] shrink-0" />
          <button
            type="button"
            onClick={() => {
              setSelectedCollectionId(null);
              setSelectedCfopStep(null);
              setSelectedCase(null);
              setSearchQuery('');
            }}
            className="hover:text-[#eab308] transition-colors"
          >
            Collections
          </button>

          {selectedCollectionId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
              <button
                type="button"
                onClick={() => {
                  setSelectedCfopStep(null);
                  setSelectedCase(null);
                  setSearchQuery('');
                }}
                className={`transition-colors ${!selectedCfopStep ? 'text-[#eab308] font-bold' : 'hover:text-[#eab308]'}`}
              >
                {selectedCollectionId === 'cfop' ? 'CFOP Method' : 'Saved Bookmarks'}
              </button>
            </>
          )}

          {selectedCfopStep && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#888888]" />
              <span className="text-[#eab308] font-bold uppercase">{selectedCfopStep}</span>
            </>
          )}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
          <input
            type="text"
            placeholder="Search all algorithms & formulas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#191919] border border-[#2d2d2d] rounded-lg pl-10 pr-4 py-2 text-sm text-[#d4d4d4] placeholder-[#888888] focus:outline-none focus:border-[#eab308] transition-colors"
          />
        </div>
      </div>

      {/* LEVEL 1: Collections View */}
      {!selectedCollectionId && !searchQuery.trim() && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collections.map(col => (
            <Card
              key={col.id}
              role={col.isAvailable ? 'button' : undefined}
              tabIndex={col.isAvailable ? 0 : undefined}
              onClick={() => handleSelectCollection(col.id, col.isAvailable)}
              onKeyDown={e => {
                if ((e.key === 'Enter' || e.key === ' ') && col.isAvailable) {
                  e.preventDefault();
                  handleSelectCollection(col.id, col.isAvailable);
                }
              }}
              className={`group flex flex-col justify-between p-6 transition-all outline-none ${
                col.isAvailable
                  ? 'hover:border-[#eab308]/50 focus:border-[#eab308] cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant={col.colorVariant} className="mb-2">
                    {col.badge}
                  </Badge>
                  <h2 className="text-xl font-bold text-white group-hover:text-[#eab308] transition-colors flex items-center gap-2">
                    {col.name} {!col.isAvailable && <Lock className="w-4 h-4 text-[#888888]" />}
                  </h2>
                  <p className="text-xs text-[#818cf8] font-medium mt-0.5">{col.subtitle}</p>
                </div>

                <div className="p-3 rounded-lg bg-[#191919] border border-[#2d2d2d] text-[#888888] group-hover:text-[#eab308] group-hover:border-[#eab308]/30 transition-colors">
                  <Folder className="w-5 h-5" />
                </div>
              </div>

              <p className="text-xs text-[#888888] leading-relaxed mt-4 pt-4 border-t border-[#2d2d2d] flex items-center justify-between">
                <span>{col.description}</span>
                {col.isAvailable && (
                  <ChevronRight className="w-4 h-4 text-[#888888] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
                )}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* LEVEL 2: Inside CFOP Collection -> Render 4 Cards for C - F - O - P */}
      {selectedCollectionId === 'cfop' && !selectedCfopStep && !searchQuery.trim() && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers2 className="w-5 h-5 text-[#eab308]" /> CFOP Method Steps (Select a step to view algorithms)
            </h2>
            <button
              type="button"
              onClick={() => {
                setSelectedCollectionId(null);
                setSelectedCase(null);
                setSearchQuery('');
              }}
              className="text-xs text-[#888888] hover:text-white flex items-center gap-1 font-semibold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Collections
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Cross (C) */}
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCfopStep('cross')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCfopStep('cross');
                }
              }}
              className="group hover:border-[#eab308]/50 focus:border-[#eab308] p-6 cursor-pointer flex flex-col justify-between outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-md bg-[#191919] text-[#eab308] font-bold flex items-center justify-center border border-[#eab308]/30 text-sm">
                  C
                </span>
                <Badge variant="outline">1 Case</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-[#eab308] transition-colors">
                  Step 1: Cross
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  Build the four bottom cross edge pieces matching bottom center and side colors.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d] flex items-center justify-between text-xs font-semibold text-[#eab308]">
                <span>View Cross Mechanics</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Box 2: F2L (F) */}
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCfopStep('f2l')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCfopStep('f2l');
                }
              }}
              className="group hover:border-[#eab308]/50 focus:border-[#eab308] p-6 cursor-pointer flex flex-col justify-between outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-md bg-[#191919] text-[#818cf8] font-bold flex items-center justify-center border border-[#818cf8]/30 text-sm">
                  F
                </span>
                <Badge variant="outline">4 Cases</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-[#eab308] transition-colors">
                  Step 2: F2L (First 2 Layers)
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  Solve corner and edge pieces simultaneously into the bottom two layers.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d] flex items-center justify-between text-xs font-semibold text-[#818cf8]">
                <span>View F2L Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Box 3: OLL (O) */}
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCfopStep('oll')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCfopStep('oll');
                }
              }}
              className="group hover:border-[#eab308]/50 focus:border-[#eab308] p-6 cursor-pointer flex flex-col justify-between outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-md bg-[#191919] text-[#eab308] font-bold flex items-center justify-center border border-[#eab308]/30 text-sm">
                  O
                </span>
                <Badge variant="amber">10 Cases (2-Look)</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-[#eab308] transition-colors">
                  Step 3: OLL (Orientation)
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  Orient the top face yellow stickers. 3 Edge orientation triggers + 7 Corner algorithms.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d] flex items-center justify-between text-xs font-semibold text-[#eab308]">
                <span>View OLL Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>

            {/* Box 4: PLL (P) */}
            <Card
              role="button"
              tabIndex={0}
              onClick={() => setSelectedCfopStep('pll')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedCfopStep('pll');
                }
              }}
              className="group hover:border-[#eab308]/50 focus:border-[#eab308] p-6 cursor-pointer flex flex-col justify-between outline-none"
            >
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-md bg-[#191919] text-[#c084fc] font-bold flex items-center justify-center border border-[#c084fc]/30 text-sm">
                  P
                </span>
                <Badge variant="purple">6-21 Cases (PLL)</Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-bold text-white group-hover:text-[#eab308] transition-colors">
                  Step 4: PLL (Permutation)
                </h3>
                <p className="text-xs text-[#888888] mt-1">
                  Permute top layer corners and edges to solve the cube. Toggle 2-Look or Full PLL.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#2d2d2d] flex items-center justify-between text-xs font-semibold text-[#c084fc]">
                <span>View PLL Algorithms</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* LEVEL 3: Inside a Specific Step -> List of Algorithms */}
      {(selectedCfopStep || selectedCollectionId === 'bookmarked' || searchQuery.trim()) && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
            <div className="flex items-center gap-3">
              {selectedCfopStep && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCfopStep(null);
                    setSearchQuery('');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-[#d4d4d4] text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to CFOP Steps
                </button>
              )}

              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                {selectedCfopStep ? `Step: ${selectedCfopStep}` : searchQuery ? 'Search Results' : 'Saved Bookmarks'}
              </h2>
            </div>

            {selectedCfopStep === 'pll' && !searchQuery && (
              <Tabs value={pllMode} onValueChange={v => setPllMode(v as '2look' | 'full')}>
                <TabsList>
                  <TabsTrigger value="2look">2-Look PLL (6)</TabsTrigger>
                  <TabsTrigger value="full">Full PLL (21)</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {Object.keys(groupedCases).length === 0 ? (
            <div className="bg-[#202020] border border-[#2d2d2d] rounded-xl p-12 text-center text-[#888888] text-sm">
              No matching algorithms found.
            </div>
          ) : (
            Object.entries(groupedCases).map(([groupTitle, cases]) => (
              <div key={groupTitle} className="flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-[#2d2d2d] pb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">{groupTitle}</h3>
                  <span className="text-xs font-mono text-[#888888] font-semibold">({cases.length} cases)</span>
                </div>

                <div className="flex flex-col gap-3">
                  {cases.map(c => {
                    const isBookmarked = bookmarkedIds.includes(c.id);
                    return (
                      <Card
                        key={c.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCase(c)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedCase(c);
                          }
                        }}
                        className="group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-[#eab308]/50 focus:border-[#eab308] p-5 cursor-pointer outline-none"
                      >
                        {c.topGrid && (
                          <div className="shrink-0 bg-[#191919] p-2.5 rounded-xl border border-[#2d2d2d] self-center md:self-auto">
                            <AlgDiagram topGrid={c.topGrid} borderColors={c.borderColors} size={80} />
                          </div>
                        )}

                        <div className="flex-1 flex flex-col gap-2 w-full">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="indigo">{c.subcategory}</Badge>
                              <h4 className="text-base font-bold text-white group-hover:text-[#eab308] transition-colors">
                                {c.name}
                              </h4>
                            </div>

                            <button
                              type="button"
                              onClick={e => toggleBookmark(c.id, e)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBookmarked
                                  ? 'text-[#eab308] bg-[#eab308]/10'
                                  : 'text-[#888888] hover:text-white hover:bg-[#2d2d2d]'
                              }`}
                            >
                              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
                            </button>
                          </div>

                          {c.why && (
                            <div className="bg-[#191919] p-2.5 rounded-lg border border-[#2d2d2d] text-xs text-[#d4d4d4] flex items-start gap-2">
                              <Compass className="w-3.5 h-3.5 text-[#eab308] shrink-0 mt-0.5" />
                              <p className="leading-relaxed">
                                <strong className="text-[#eab308]">Why it works:</strong> {c.why}
                              </p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-[#888888]">
                            <span>{c.description}</span>
                            {c.tips && (
                              <span className="text-[#eab308]/90 flex items-center gap-1">
                                <Lightbulb className="w-3.5 h-3.5 text-[#eab308]" /> {c.tips}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-[#2d2d2d]">
                          <code className="text-xs font-mono font-bold text-[#eab308] bg-[#191919] px-2.5 py-1 rounded-md border border-[#2d2d2d]">
                            {c.primaryAlg}
                          </code>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-white text-xs font-bold transition-all"
                          >
                            View Formula & 3D <Play className="w-3 h-3 fill-current" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* LEVEL 3: Radix UI Dialog Modal for 3D Move Inspection */}
      <Dialog open={selectedCase !== null} onOpenChange={open => !open && setSelectedCase(null)}>
        {selectedCase && (
          <DialogContent>
            <DialogHeader>
              <Badge variant="indigo" className="w-fit mb-1">
                {selectedCase.subcategory} • {selectedCase.group}
              </Badge>
              <DialogTitle>{selectedCase.name}</DialogTitle>
              <DialogDescription>{selectedCase.description}</DialogDescription>
            </DialogHeader>

            <RubiksCube3D
              initialAlgorithm={selectedCase.primaryAlg}
              autoPlay={true}
              highlightMode={selectedCase.category}
              size="h-[300px]"
            />

            <div className="flex flex-col gap-3 bg-[#191919] rounded-xl p-4 border border-[#2d2d2d]">
              <div>
                <span className="text-xs text-[#888888] font-semibold block mb-1">Formula:</span>
                <code className="text-base font-mono font-bold text-[#eab308] bg-[#202020] px-3 py-1.5 rounded-md border border-[#2d2d2d] inline-block">
                  {selectedCase.primaryAlg}
                </code>
              </div>

              {selectedCase.why && (
                <div className="bg-[#202020] border border-[#2d2d2d] rounded-lg p-3 text-xs text-[#d4d4d4]">
                  <span className="font-bold text-[#eab308] flex items-center gap-1.5 mb-1">
                    <Compass className="w-4 h-4 text-[#eab308]" /> Why this is the formula:
                  </span>
                  <p className="leading-relaxed">{selectedCase.why}</p>
                </div>
              )}

              {selectedCase.alternativeAlgs && selectedCase.alternativeAlgs.length > 0 && (
                <div>
                  <span className="text-xs text-[#888888] font-semibold block mb-1">Alternative Formulas:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedCase.alternativeAlgs.map((alt, idx) => (
                      <code key={idx} className="text-xs font-mono text-[#d4d4d4] bg-[#202020] px-2 py-1 rounded border border-[#2d2d2d]">
                        {alt}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {selectedCase.tips && (
                <p className="text-xs text-[#eab308] flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-[#eab308] shrink-0 mt-0.5" />
                  <strong>Recognition Tip:</strong> {selectedCase.tips}
                </p>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
