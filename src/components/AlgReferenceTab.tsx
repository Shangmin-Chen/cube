import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { RubiksCube3D } from './RubiksCube3D';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { parseTriggers, detectAlgBadges } from '../utils/cubeLogic';
import {
  Search,
  Bookmark,
  Sparkles,
  Maximize2,
  FolderGit2,
  Layers,
} from 'lucide-react';

export const AlgReferenceTab: React.FC = () => {
  const { step: routeStep, caseId: routeCaseId } = useParams<{ step?: string; caseId?: string }>();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'cfop' | 'roux' | 'zz' | '2x2'>('cfop');
  
  const validSteps = ['cross', 'f2l', 'oll', 'pll', 'bookmarked'] as const;
  const activeStep = useMemo(() => {
    if (routeStep && (validSteps as readonly string[]).includes(routeStep)) {
      return routeStep as typeof validSteps[number];
    }
    return 'oll';
  }, [routeStep]);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(routeCaseId || null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTriggersHub, setShowTriggersHub] = useState(false);

  useEffect(() => {
    setSelectedCaseId(routeCaseId || null);
  }, [routeCaseId]);

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
    return [...crossCases, ...OLL_2LOOK_CASES, ...PLL_2LOOK_CASES, ...F2L_HIGHLIGHTS];
  }, [crossCases]);

  const toggleBookmark = (id: string, e: React.MouseEvent | React.KeyboardEvent) => {
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

  // Get active cases list based on selected step & filters
  const currentStepCases = useMemo(() => {
    if (activeStep === 'bookmarked') {
      return allCases.filter(c => bookmarkedIds.includes(c.id));
    }
    if (activeStep === 'cross') return crossCases;
    if (activeStep === 'f2l') return F2L_HIGHLIGHTS;
    if (activeStep === 'oll') return OLL_2LOOK_CASES;
    if (activeStep === 'pll') return PLL_2LOOK_CASES;
    return [];
  }, [activeStep, crossCases, allCases, bookmarkedIds]);

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

  // Active highlighted case (defaults to first case in filtered list)
  const activeCase = useMemo(() => {
    if (selectedCaseId) {
      const found = filteredCases.find(c => c.id === selectedCaseId);
      if (found) return found;
    }
    return filteredCases.length > 0 ? filteredCases[0] : null;
  }, [selectedCaseId, filteredCases]);

  const stepsList = [
    { id: 'cross', label: 'Step 1: Cross', badge: `${crossCases.length}` },
    { id: 'f2l', label: 'Step 2: F2L', badge: `${F2L_HIGHLIGHTS.length}` },
    { id: 'oll', label: 'Step 3: OLL (2-Look)', badge: `${OLL_2LOOK_CASES.length}` },
    { id: 'pll', label: 'Step 4: PLL (2-Look)', badge: `${PLL_2LOOK_CASES.length}` },
    { id: 'bookmarked', label: 'Saved Bookmarks', badge: `${bookmarkedIds.length}` },
  ] as const;

  // Render trigger chunks with color badges
  const renderTriggerChunks = (algStr: string) => {
    const chunks = parseTriggers(algStr);
    return (
      <div className="flex flex-wrap items-center gap-1.5 my-1">
        {chunks.map((chunk, idx) => {
          if (chunk.type === 'sexy' || chunk.type === 'wide-sexy' || chunk.type === 'inverse-sexy' || chunk.type === 'left-sexy') {
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#818cf8]/15 border border-[#818cf8]/40 text-[#818cf8] font-mono font-bold text-xs"
                title={chunk.description}
              >
                ({chunk.text})
                <span className="text-[9px] block font-sans font-normal opacity-80">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'sledge' || chunk.type === 'wide-sledge') {
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] font-mono font-bold text-xs"
                title={chunk.description}
              >
                ({chunk.text})
                <span className="text-[9px] block font-sans font-normal opacity-80">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'hedge') {
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#22c55e] font-mono font-bold text-xs"
                title={chunk.description}
              >
                ({chunk.text})
                <span className="text-[9px] block font-sans font-normal opacity-80">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'sune') {
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#eab308]/15 border border-[#eab308]/40 text-[#eab308] font-mono font-bold text-xs"
                title={chunk.description}
              >
                ({chunk.text})
                <span className="text-[9px] block font-sans font-normal opacity-80">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'palindrome') {
            return (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-[#ec4899]/15 border border-[#ec4899]/40 text-[#ec4899] font-mono font-bold text-xs"
                title={chunk.description}
              >
                ({chunk.text})
                <span className="text-[9px] block font-sans font-normal opacity-80">{chunk.name}</span>
              </span>
            );
          }
          return (
            <span key={idx} className="font-mono text-xs text-[#d4d4d4] font-semibold px-1">
              {chunk.text}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-4">
      {/* Hero Header & Collection Switcher */}
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#202020]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="amber" className="flex items-center gap-1.5 w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Intuitive Speedcubing Library
            </Badge>

            {/* Method / Collection Switcher Selector */}
            <div className="flex items-center gap-1 bg-[#191919] px-2 py-1 rounded-md border border-[#2d2d2d] text-xs font-mono">
              <FolderGit2 className="w-3.5 h-3.5 text-[#eab308]" />
              <span className="text-[#888888]">Method:</span>
              <select
                aria-label="Select Cubing Algorithm Collection"
                value={selectedMethod}
                onChange={e => setSelectedMethod(e.target.value as 'cfop' | 'roux' | 'zz' | '2x2')}
                className="bg-transparent text-[#eab308] font-bold focus:outline-none cursor-pointer"
              >
                <option value="cfop" className="bg-[#202020] text-white">2-Look CFOP Method</option>
                <option value="roux" disabled className="bg-[#202020] text-[#888888]">Roux Method (Coming Soon)</option>
                <option value="zz" disabled className="bg-[#202020] text-[#888888]">ZZ Method (Coming Soon)</option>
                <option value="2x2" disabled className="bg-[#202020] text-[#888888]">2x2 Methods (Coming Soon)</option>
              </select>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Algorithm Reference & Mechanics
          </h1>
          <p className="text-xs text-[#888888] mt-1 max-w-xl">
            Learn formulas through <strong>visual trigger building blocks</strong> and <strong>3D piece tracking</strong>—no rote memorization needed!
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="flex flex-col gap-2 w-full md:w-auto items-end">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              aria-label="Search algorithms or formulas"
              placeholder="Search algorithms or formulas..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSelectedCaseId(null);
              }}
              className="w-full bg-[#191919] border border-[#2d2d2d] rounded-lg pl-10 pr-4 py-2 text-xs text-[#d4d4d4] placeholder-[#888888] focus:outline-none focus:border-[#eab308] transition-colors"
            />
          </div>

          {/* Toggle Fundamental Triggers Cheat-Sheet Hub */}
          <button
            type="button"
            aria-expanded={showTriggersHub}
            onClick={() => setShowTriggersHub(!showTriggersHub)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d2d2d] hover:bg-[#383838] border border-[#383838] text-xs font-semibold text-[#eab308] transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            {showTriggersHub ? 'Hide 4 Core Triggers Hub' : '🧩 Show 4 Core Building Block Triggers'}
          </button>
        </div>
      </Card>

      {/* Fundamental Triggers Hub Banner (Collapsible) */}
      {showTriggersHub && (
        <Card className="p-5 bg-[#191919] border border-[#eab308]/30 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#eab308]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                The 4 LEGO Building Blocks of Speedcubing
              </h2>
            </div>
            <span className="text-[11px] text-[#888888]">
              All 78 algorithms are constructed from these 4 triggers!
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#202020] rounded-lg border border-[#818cf8]/40 flex flex-col gap-1">
              <span className="text-xs font-bold text-[#818cf8]">1. Sexy Move</span>
              <code className="text-xs font-mono font-bold text-[#818cf8] bg-[#191919] px-2 py-0.5 rounded border border-[#2d2d2d] w-fit">
                (R U R' U')
              </code>
              <p className="text-[11px] text-[#888888] mt-1">
                Lifts Front-Right F2L pair to top layer and shifts U face left.
              </p>
            </div>

            <div className="p-3 bg-[#202020] rounded-lg border border-[#ef4444]/40 flex flex-col gap-1">
              <span className="text-xs font-bold text-[#ef4444]">2. Sledgehammer</span>
              <code className="text-xs font-mono font-bold text-[#ef4444] bg-[#191919] px-2 py-0.5 rounded border border-[#2d2d2d] w-fit">
                (R' F R F')
              </code>
              <p className="text-[11px] text-[#888888] mt-1">
                Rotates FR slot and flips top-front edge sticker orientation.
              </p>
            </div>

            <div className="p-3 bg-[#202020] rounded-lg border border-[#22c55e]/40 flex flex-col gap-1">
              <span className="text-xs font-bold text-[#22c55e]">3. Hedgeslammer</span>
              <code className="text-xs font-mono font-bold text-[#22c55e] bg-[#191919] px-2 py-0.5 rounded border border-[#2d2d2d] w-fit">
                (F R' F' R)
              </code>
              <p className="text-[11px] text-[#888888] mt-1">
                Front-face inverse trigger used for smooth front insertions.
              </p>
            </div>

            <div className="p-3 bg-[#202020] rounded-lg border border-[#eab308]/40 flex flex-col gap-1">
              <span className="text-xs font-bold text-[#eab308]">4. Sune Trigger</span>
              <code className="text-xs font-mono font-bold text-[#eab308] bg-[#191919] px-2 py-0.5 rounded border border-[#2d2d2d] w-fit">
                (R U R' U R U2 R')
              </code>
              <p className="text-[11px] text-[#888888] mt-1">
                Pushes pair across top layer and 360° spins back into slot.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Persistent 1-Click CFOP Step Pipeline Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#202020] p-2 rounded-xl border border-[#2d2d2d]">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {stepsList.map(step => {
            const isActive = activeStep === step.id && !searchQuery.trim();
            return (
              <button
                key={step.id}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCaseId(null);
                  navigate(`/algs/${step.id}`);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#2d2d2d] text-[#eab308] border border-[#eab308]/40 shadow-none'
                    : 'text-[#888888] hover:text-white hover:bg-[#282828]'
                }`}
              >
                <span>{step.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isActive ? 'bg-[#eab308] text-black font-black' : 'bg-[#191919] text-[#888888]'}`}>
                  {step.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Master-Detail Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Case Card List */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {filteredCases.length === 0 ? (
            <Card className="p-12 text-center text-[#888888] text-sm">
              {activeStep === 'bookmarked'
                ? 'No saved bookmarks yet. Click the bookmark icon on any algorithm card to save it here!'
                : 'No matching algorithms found. Try clearing your search query!'}
            </Card>
          ) : (
            filteredCases.map(c => {
              const isSelected = activeCase?.id === c.id;
              const isBookmarked = bookmarkedIds.includes(c.id);

              return (
                <Card
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${c.name} algorithm`}
                  aria-pressed={isSelected}
                  onClick={() => {
                    setSelectedCaseId(c.id);
                    const targetStep = activeStep === 'bookmarked' ? 'bookmarked' : c.category;
                    navigate(`/algs/${targetStep}/${c.id}`);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedCaseId(c.id);
                      const targetStep = activeStep === 'bookmarked' ? 'bookmarked' : c.category;
                      navigate(`/algs/${targetStep}/${c.id}`);
                    }
                  }}
                  className={`group flex items-center justify-between p-4 cursor-pointer transition-all outline-none ${
                    isSelected
                      ? 'border-[#eab308] bg-[#24221b]'
                      : 'hover:border-[#383838]'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0 bg-[#191919] p-1.5 rounded-lg border border-[#2d2d2d]">
                      <AlgDiagram
                        primaryAlg={c.primaryAlg}
                        category={c.category}
                        size={64}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="indigo">{c.subcategory}</Badge>
                        {detectAlgBadges(c.primaryAlg).map(badge => (
                          <Badge key={badge} variant={badge === 'Palindrome' ? 'amber' : 'emerald'}>
                            {badge}
                          </Badge>
                        ))}
                        <h3 className={`text-sm font-bold transition-colors ${isSelected ? 'text-[#eab308]' : 'text-white group-hover:text-[#eab308]'}`}>
                          {c.name}
                        </h3>
                      </div>

                      {/* Color-coded trigger breakdown */}
                      {renderTriggerChunks(c.primaryAlg)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
                      onClick={e => toggleBookmark(c.id, e)}
                      className={`p-2 rounded-lg transition-colors ${
                        isBookmarked
                          ? 'text-[#eab308] bg-[#eab308]/10'
                          : 'text-[#888888] hover:text-white hover:bg-[#2d2d2d]'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark' : 'Save Bookmark'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
                    </button>

                    <button
                      type="button"
                      aria-label="Fullscreen 3D Zoom"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedCaseId(c.id);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-lg text-[#888888] hover:text-white hover:bg-[#2d2d2d] transition-colors"
                      title="Fullscreen 3D Zoom"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Right Column (5 Cols): Sticky Detail & Live 3D Inspector */}
        <div className="lg:col-span-5 sticky top-20 flex flex-col gap-4">
          {activeCase ? (
            <Card className="p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 bg-[#191919] p-1.5 rounded-lg border border-[#2d2d2d]">
                    <AlgDiagram
                      primaryAlg={activeCase.primaryAlg}
                      category={activeCase.category}
                      size={56}
                    />
                  </div>
                  <div>
                    <Badge variant="amber" className="mb-1">
                      {activeCase.subcategory} • {activeCase.group}
                    </Badge>
                    <h3 className="text-lg font-bold text-white tracking-tight">{activeCase.name}</h3>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Open Fullscreen 3D View"
                  title="Open Fullscreen 3D View"
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 rounded-lg bg-[#191919] border border-[#2d2d2d] text-[#888888] hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
                </button>
              </div>

              {/* Live 3D Move Inspector */}
              <RubiksCube3D
                initialAlgorithm={activeCase.primaryAlg}
                autoPlay={false}
                highlightMode={activeCase.category}
                size="h-[280px]"
              />

              {/* Formula & Trigger Breakdown */}
              <div className="flex flex-col gap-3 bg-[#191919] p-4 rounded-xl border border-[#2d2d2d]">
                <div>
                  <span className="text-[11px] text-[#888888] font-bold block mb-1 uppercase tracking-wider">
                    Formula Building-Block Triggers:
                  </span>
                  {renderTriggerChunks(activeCase.primaryAlg)}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-10 text-center text-[#888888] text-xs">
              Select an algorithm from the list to view its 3D move playback.
            </Card>
          )}
        </div>
      </div>

      {/* Fullscreen Radix UI Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        {activeCase && (
          <DialogContent>
            <DialogHeader>
              <Badge variant="indigo" className="w-fit mb-1">
                {activeCase.subcategory} • {activeCase.group}
              </Badge>
              <DialogTitle>{activeCase.name}</DialogTitle>
              <DialogDescription>{activeCase.description}</DialogDescription>
            </DialogHeader>

            <RubiksCube3D
              initialAlgorithm={activeCase.primaryAlg}
              autoPlay={true}
              highlightMode={activeCase.category}
              size="h-[320px]"
            />

            <div className="flex flex-col gap-3 bg-[#191919] rounded-xl p-4 border border-[#2d2d2d]">
              <div>
                <span className="text-xs text-[#888888] font-semibold block mb-1">Trigger Breakdown:</span>
                {renderTriggerChunks(activeCase.primaryAlg)}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};
