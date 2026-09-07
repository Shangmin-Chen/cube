import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Shuffle,
  RotateCcw,
  Bookmark,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Copy,
  CheckCheck,
  Eye,
  EyeOff,
  Layers,
  Flame,
  Award,
  Zap,
  Info,
} from 'lucide-react';
import { OLL_2LOOK_CASES, PLL_2LOOK_CASES, FULL_PLL_CASES, F2L_HIGHLIGHTS } from '../data/cfopData';
import type { AlgCase } from '../types/cube';
import { AlgDiagram } from './AlgDiagram';
import { parseTriggers, invertMoveString, detectAlgBadges } from '../utils/cubeLogic';
import { Badge } from './ui/badge';

// Deduplicated master list of all cases
const ALL_CASES_MAP = new Map<string, AlgCase>();
[...OLL_2LOOK_CASES, ...FULL_PLL_CASES, ...F2L_HIGHLIGHTS].forEach(c => {
  if (!ALL_CASES_MAP.has(c.id)) {
    ALL_CASES_MAP.set(c.id, c);
  }
});
const ALL_CASES = Array.from(ALL_CASES_MAP.values());

type DeckType = 'bookmarks' | 'oll-2look' | 'pll-2look' | 'pll-full' | 'f2l' | 'all';

interface DeckOption {
  id: DeckType;
  label: string;
  count: (bookmarkedCount: number) => number;
  description: string;
}

const DECKS: DeckOption[] = [
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    count: b => b,
    description: 'Your starred algorithms for focused drill',
  },
  {
    id: 'oll-2look',
    label: '2-Look OLL',
    count: () => OLL_2LOOK_CASES.length,
    description: '7 Essential Orientation cases (Cross & Corners)',
  },
  {
    id: 'pll-2look',
    label: '2-Look PLL',
    count: () => PLL_2LOOK_CASES.length,
    description: '6 Essential Permutation cases (T, Y, Ua, Ub, H, Z)',
  },
  {
    id: 'pll-full',
    label: 'Full PLL',
    count: () => FULL_PLL_CASES.length,
    description: 'All 21 Permutations of the Last Layer',
  },
  {
    id: 'f2l',
    label: 'Intuitive F2L',
    count: () => F2L_HIGHLIGHTS.length,
    description: 'Core First Two Layers insertion patterns',
  },
  {
    id: 'all',
    label: 'All Algorithms',
    count: () => ALL_CASES.length,
    description: 'Complete library of CFOP algorithms',
  },
];

// Shuffle helper (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const TrainerTab: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL query state or default
  const deckParam = (searchParams.get('deck') as DeckType) || 'bookmarks';
  const initialDeck = DECKS.some(d => d.id === deckParam) ? deckParam : 'bookmarks';

  const [selectedDeck, setSelectedDeck] = useState<DeckType>(initialDeck);
  const [isShuffled, setIsShuffled] = useState<boolean>(true);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);

  // Bookmark sync state
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cfop_bookmarks');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const getDeckCases = useCallback((deck: DeckType, bIds: string[]) => {
    switch (deck) {
      case 'bookmarks':
        return ALL_CASES.filter(c => bIds.includes(c.id));
      case 'oll-2look':
        return OLL_2LOOK_CASES;
      case 'pll-2look':
        return PLL_2LOOK_CASES;
      case 'pll-full':
        return FULL_PLL_CASES;
      case 'f2l':
        return F2L_HIGHLIGHTS;
      case 'all':
        return ALL_CASES;
    }
  }, []);

  // Compute raw deck cases
  const baseDeckCases = useMemo(() => {
    return getDeckCases(selectedDeck, bookmarkedIds);
  }, [selectedDeck, bookmarkedIds, getDeckCases]);

  // Spaced-repetition mastery state
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  const [activeQueue, setActiveQueue] = useState<AlgCase[]>(() => {
    try {
      const saved = localStorage.getItem('cfop_bookmarks');
      const parsed = saved ? JSON.parse(saved) : [];
      const bIds = Array.isArray(parsed) ? parsed : [];
      const raw =
        initialDeck === 'bookmarks'
          ? ALL_CASES.filter(c => bIds.includes(c.id))
          : initialDeck === 'oll-2look'
          ? OLL_2LOOK_CASES
          : initialDeck === 'pll-2look'
          ? PLL_2LOOK_CASES
          : initialDeck === 'pll-full'
          ? FULL_PLL_CASES
          : initialDeck === 'f2l'
          ? F2L_HIGHLIGHTS
          : ALL_CASES;
      return shuffleArray(raw);
    } catch {
      return shuffleArray(ALL_CASES);
    }
  });
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  // Copy feedback state
  const [copiedType, setCopiedType] = useState<'setup' | 'solve' | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // Sync bookmarks from localStorage
  const refreshBookmarks = useCallback(() => {
    try {
      const saved = localStorage.getItem('cfop_bookmarks');
      const parsed = saved ? JSON.parse(saved) : [];
      setBookmarkedIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    window.addEventListener('storage', refreshBookmarks);
    return () => window.removeEventListener('storage', refreshBookmarks);
  }, [refreshBookmarks]);

  // Initialize or reset active queue when deck or shuffle changes
  const initRound = useCallback(
    (cases: AlgCase[], shuffle: boolean, round = 1) => {
      const list = shuffle ? shuffleArray(cases) : [...cases];
      setActiveQueue(list);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
      setIsRoundFinished(false);
      setRoundNumber(round);
      if (round === 1) {
        setMasteredIds(new Set());
        setLearningIds(new Set());
      }
    },
    []
  );

  // Switch deck
  const handleSelectDeck = (deckId: DeckType) => {
    setSelectedDeck(deckId);
    setSearchParams({ deck: deckId });
    const cases = getDeckCases(deckId, bookmarkedIds);
    initRound(cases, isShuffled, 1);
  };

  const currentCase = activeQueue[currentIndex] as AlgCase | undefined;

  // Toggle bookmark for a specific case ID
  const toggleBookmark = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation();
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

  // Flip card (Horizontal Axis)
  const handleFlip = () => {
    setIsFlipped(prev => !prev);
  };

  // Advance to next card or finish round
  const advanceCard = () => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsRoundFinished(true);
      // Trigger celebratory confetti if mastery is high
      if (masteredIds.size + 1 >= activeQueue.length) {
        try {
          confetti({
            particleCount: 90,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#eab308', '#818cf8', '#22c55e', '#ec4899', '#38bdf8'],
          });
        } catch {
          // Ignore
        }
      }
    }
  };

  // Handle Mark as Mastered (Know)
  const handleMarkMastered = () => {
    if (!currentCase) return;
    setMasteredIds(prev => new Set(prev).add(currentCase.id));
    setLearningIds(prev => {
      const next = new Set(prev);
      next.delete(currentCase.id);
      return next;
    });
    advanceCard();
  };

  // Handle Mark as Still Learning (Again)
  const handleMarkLearning = () => {
    if (!currentCase) return;
    setLearningIds(prev => new Set(prev).add(currentCase.id));
    advanceCard();
  };

  // Previous card
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  // Next card without marking
  const handleNext = () => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  // Review Missed / Still Learning Cards in Next Round
  const handleReviewMissed = () => {
    const missedCases = baseDeckCases.filter(c => learningIds.has(c.id));
    if (missedCases.length > 0) {
      initRound(missedCases, isShuffled, roundNumber + 1);
    }
  };

  // Restart Entire Deck
  const handleRestartDeck = () => {
    initRound(baseDeckCases, isShuffled, 1);
  };

  // Toggle Shuffle
  const handleToggleShuffle = () => {
    const nextShuffle = !isShuffled;
    setIsShuffled(nextShuffle);
    initRound(baseDeckCases, nextShuffle, roundNumber);
  };

  // Copy helper
  const handleCopy = (text: string, type: 'setup' | 'solve', e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  };

  // Setup moves computation (Inverse of solve alg)
  const setupScramble = useMemo(() => {
    if (!currentCase?.primaryAlg) return '';
    const inverted = invertMoveString(currentCase.primaryAlg);
    return inverted.join(' ');
  }, [currentCase]);

  // Global Keyboard Navigation (Monkeytype + Quizlet style)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if user is in an input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === '1' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleMarkLearning();
      } else if (e.key === '2' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleMarkMastered();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentCase) {
          toggleBookmark(currentCase.id);
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestartDeck();
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setShowHint(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentCase, currentIndex, activeQueue.length, isRoundFinished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render LEGO Trigger Chunks with color coding
  const renderTriggerChunks = (algStr: string) => {
    const chunks = parseTriggers(algStr);
    return (
      <div className="flex flex-wrap items-center gap-1.5 my-1">
        {chunks.map((chunk, idx) => {
          if (
            chunk.type === 'sexy' ||
            chunk.type === 'wide-sexy' ||
            chunk.type === 'inverse-sexy' ||
            chunk.type === 'left-sexy'
          ) {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/40 text-[#a5b4fc] font-mono font-bold text-xs shadow-sm"
                title={chunk.description}
              >
                {chunk.text}
                <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'sledge' || chunk.type === 'wide-sledge') {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#fca5a5] font-mono font-bold text-xs shadow-sm"
                title={chunk.description}
              >
                {chunk.text}
                <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'hedge') {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#22c55e]/15 border border-[#22c55e]/40 text-[#86efac] font-mono font-bold text-xs shadow-sm"
                title={chunk.description}
              >
                {chunk.text}
                <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'sune') {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/40 text-[#fde047] font-mono font-bold text-xs shadow-sm"
                title={chunk.description}
              >
                {chunk.text}
                <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
              </span>
            );
          }
          if (chunk.type === 'palindrome') {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-[#ec4899]/15 border border-[#ec4899]/40 text-[#f9a8d4] font-mono font-bold text-xs shadow-sm"
                title={chunk.description}
              >
                {chunk.text}
                <span className="text-[9px] block font-sans font-normal opacity-75">{chunk.name}</span>
              </span>
            );
          }
          return (
            <span key={idx} className="font-mono text-xs text-[#e5e5e5] font-semibold px-1 py-1">
              {chunk.text}
            </span>
          );
        })}
      </div>
    );
  };

  const progressPercent =
    activeQueue.length > 0 ? Math.round(((currentIndex + (isRoundFinished ? 1 : 0)) / activeQueue.length) * 100) : 0;
  const isBookmarked = currentCase ? bookmarkedIds.includes(currentCase.id) : false;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
      {/* Top Monkeytype-Style Navigation & Config Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1e1e1e] p-2 rounded-2xl border border-[#2d2d2d] shadow-sm">
        {/* Deck Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          {DECKS.map(deck => {
            const count = deck.count(bookmarkedIds.length);
            const isSelected = selectedDeck === deck.id;
            return (
              <button
                key={deck.id}
                type="button"
                onClick={() => handleSelectDeck(deck.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2a2a2a] text-[#eab308] border border-[#eab308]/40 shadow-sm'
                    : 'text-[#888888] hover:text-white hover:bg-[#252525] border border-transparent'
                }`}
                title={deck.description}
              >
                <span>{deck.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isSelected ? 'bg-[#eab308] text-black font-black' : 'bg-[#141414] text-[#737373]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls: Shuffle & Restart */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-[#2a2a2a]">
          <button
            type="button"
            onClick={handleToggleShuffle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isShuffled
                ? 'bg-[#eab308]/15 border border-[#eab308]/40 text-[#eab308]'
                : 'text-[#888888] hover:text-white hover:bg-[#252525] border border-[#2d2d2d]'
            }`}
            title={isShuffled ? 'Shuffle is ON (Click to toggle)' : 'Shuffle is OFF'}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          <button
            type="button"
            onClick={handleRestartDeck}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#252525] border border-[#2d2d2d] transition-all cursor-pointer"
            title="Restart Deck (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Empty Bookmarks Fallback State */}
      {selectedDeck === 'bookmarks' && baseDeckCases.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center gap-4 bg-gradient-to-b from-[#202020] to-[#191919] border border-[#2d2d2d] rounded-3xl shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#2d2d2d] flex items-center justify-center text-[#eab308] shadow-inner">
            <Bookmark className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <h2 className="text-xl font-bold text-white tracking-tight">No Bookmarked Algorithms Yet</h2>
            <p className="text-xs text-[#888888] leading-relaxed">
              Star algorithms from the <strong>Algorithms Reference</strong> library to create your custom training deck, or jump straight into 2-Look OLL/PLL!
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleSelectDeck('oll-2look')}
              className="px-5 py-2.5 rounded-xl bg-[#eab308] hover:bg-[#facc15] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Train 2-Look OLL (7 Cases)
            </button>
            <button
              type="button"
              onClick={() => navigate('/algs')}
              className="px-5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Browse Library
            </button>
          </div>
        </div>
      ) : isRoundFinished ? (
        /* Round Summary / Completion Screen */
        <div className="p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-[#202020] to-[#181818] border border-[#2d2d2d] rounded-3xl shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-3xl bg-[#eab308]/15 border border-[#eab308]/40 flex items-center justify-center text-[#eab308] shadow-lg">
            <Award className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold mx-auto">
              <Zap className="w-3.5 h-3.5" /> Round {roundNumber} Complete
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
              {masteredIds.size === activeQueue.length
                ? '🎉 Flawless Mastery!'
                : `${masteredIds.size} of ${activeQueue.length} Mastered`}
            </h2>
            <p className="text-xs text-[#888888] max-w-md">
              {learningIds.size > 0
                ? `You have ${learningIds.size} case${learningIds.size > 1 ? 's' : ''} to reinforce in the next round.`
                : 'You answered every algorithm accurately in this round!'}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md">
            <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center">
              <span className="text-2xl font-mono font-extrabold text-[#4ade80]">{masteredIds.size}</span>
              <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Mastered</span>
            </div>
            <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center">
              <span className="text-2xl font-mono font-extrabold text-[#ef4444]">{learningIds.size}</span>
              <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Still Learning</span>
            </div>
            <div className="p-3.5 bg-[#141414] rounded-2xl border border-[#2a2a2a] flex flex-col items-center col-span-2 sm:col-span-1">
              <span className="text-2xl font-mono font-extrabold text-[#eab308]">
                {activeQueue.length > 0 ? Math.round((masteredIds.size / activeQueue.length) * 100) : 0}%
              </span>
              <span className="text-[11px] text-[#888888] font-semibold mt-0.5">Accuracy</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {learningIds.size > 0 && (
              <button
                type="button"
                onClick={handleReviewMissed}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#eab308] hover:bg-[#facc15] text-black font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Drill {learningIds.size} Missed Cases (Round {roundNumber + 1})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRestartDeck}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] border border-[#383838] text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart All {baseDeckCases.length} Cases</span>
            </button>
          </div>

          {/* Breakdown Review of Cases */}
          <div className="w-full mt-2 flex flex-col gap-2 text-left border-t border-[#2a2a2a] pt-5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Round Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {activeQueue.map(c => {
                const isMastered = masteredIds.has(c.id);
                return (
                  <div
                    key={c.id}
                    className="p-3 bg-[#141414] rounded-xl border border-[#272727] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 bg-[#1c1c1c] p-1 rounded-lg border border-[#2d2d2d]">
                        <AlgDiagram primaryAlg={c.primaryAlg} category={c.category} size={40} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{c.name}</span>
                        <code className="text-[11px] font-mono text-[#888888]">{c.primaryAlg}</code>
                      </div>
                    </div>

                    <Badge variant={isMastered ? 'emerald' : 'default'} className="shrink-0 text-[10px]">
                      {isMastered ? 'Mastered' : 'Learning'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Active Flashcard Drill Area */
        <div className="flex flex-col gap-4">
          {/* Progress Header & Mastery Counters */}
          <div className="flex items-center justify-between gap-4 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">
                {currentIndex + 1} <span className="text-[#737373] text-xs">/ {activeQueue.length}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] text-[10px] font-bold">
                Round {roundNumber}
              </span>
            </div>

            {/* Live Session Counters */}
            <div className="flex items-center gap-3 font-mono font-semibold">
              <span className="text-[#4ade80] flex items-center gap-1 bg-[#22c55e]/10 px-2 py-0.5 rounded-md border border-[#22c55e]/25">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> {masteredIds.size}
              </span>
              <span className="text-[#ef4444] flex items-center gap-1 bg-[#ef4444]/10 px-2 py-0.5 rounded-md border border-[#ef4444]/25">
                <X className="w-3.5 h-3.5 stroke-[3]" /> {learningIds.size}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden border border-[#2d2d2d]">
            <div
              className="bg-gradient-to-r from-[#eab308] via-[#818cf8] to-[#22c55e] h-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 3D Horizontal-Axis Flip Flashcard */}
          <div className="perspective-1000 w-full min-h-[460px] md:min-h-[480px] select-none">
            <div
              ref={cardRef}
              onClick={handleFlip}
              className={`relative w-full h-full min-h-[460px] md:min-h-[480px] transform-style-3d transition-transform duration-500 cursor-pointer rounded-3xl ${
                isFlipped ? 'rotate-x-180' : ''
              }`}
            >
              {/* FRONT FACE (Pattern Recognition & Setup Hint) */}
              <div className="absolute inset-0 w-full h-full backface-hidden bg-gradient-to-b from-[#222222] to-[#1a1a1a] border border-[#333333] hover:border-[#444444] p-6 flex flex-col justify-between rounded-3xl shadow-2xl transition-colors">
                {/* Front Card Header */}
                <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold">
                      {currentCase?.subcategory || 'Recognition'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#2d2d2d] text-[#888888] text-[11px] font-medium">
                      {currentCase?.group}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    {/* Optional Hint Toggle */}
                    <button
                      type="button"
                      onClick={() => setShowHint(prev => !prev)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        showHint
                          ? 'bg-[#eab308]/20 text-[#eab308] border border-[#eab308]/40'
                          : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
                      }`}
                      title="Toggle Name Hint (H)"
                    >
                      {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                    </button>

                    {/* Bookmark Star */}
                    <button
                      type="button"
                      onClick={e => currentCase && toggleBookmark(currentCase.id, e)}
                      className={`p-2 rounded-lg transition-colors cursor-pointer ${
                        isBookmarked
                          ? 'text-[#eab308] bg-[#eab308]/15 border border-[#eab308]/30'
                          : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
                      }`}
                      title={isBookmarked ? 'Remove Bookmark (S)' : 'Save Bookmark (S)'}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Front Center: 2D Pattern Recognition Diagram */}
                <div className="flex flex-col items-center justify-center my-auto py-6">
                  <div className="bg-[#141414] p-4 rounded-3xl border border-[#2e2e2e] shadow-inner flex items-center justify-center transition-transform hover:scale-102">
                    <AlgDiagram
                      primaryAlg={currentCase?.primaryAlg}
                      category={currentCase?.category}
                      size={160}
                    />
                  </div>

                  {/* Hint Reveal Banner */}
                  {showHint && currentCase && (
                    <div className="mt-4 px-4 py-1.5 rounded-full bg-[#181818] border border-[#eab308]/40 text-xs text-[#eab308] font-bold shadow-md animate-in fade-in slide-in-from-bottom-2">
                      💡 Case Name: {currentCase.name}
                    </div>
                  )}
                </div>

                {/* Front Footer: Call to action prompt */}
                <div className="border-t border-[#2d2d2d] pt-3 flex items-center justify-between text-xs text-[#737373]">
                  <span>Identify the pattern and execute the algorithm</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] bg-[#141414] px-3 py-1 rounded-lg border border-[#2d2d2d] text-[#d4d4d4]">
                    Press <strong className="text-[#eab308]">Space</strong> to flip
                  </span>
                </div>
              </div>

              {/* BACK FACE (Setup Scramble + Solve Formula + Mechanics) */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-x-180 bg-gradient-to-b from-[#222222] to-[#1a1a1a] border border-[#333333] p-6 flex flex-col justify-between rounded-3xl shadow-2xl overflow-y-auto">
                {/* Back Card Header */}
                <div className="flex items-center justify-between border-b border-[#2d2d2d] pb-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-lg bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308] text-xs font-bold">
                      {currentCase?.subcategory}
                    </span>
                    <h3 className="text-base font-bold text-white tracking-tight">{currentCase?.name}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={e => currentCase && toggleBookmark(currentCase.id, e)}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      isBookmarked
                        ? 'text-[#eab308] bg-[#eab308]/15 border border-[#eab308]/30'
                        : 'text-[#888888] hover:text-white bg-[#1a1a1a] border border-[#2d2d2d]'
                    }`}
                    title={isBookmarked ? 'Remove Bookmark (S)' : 'Save Bookmark (S)'}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#eab308]' : ''}`} />
                  </button>
                </div>

                {/* Back Body: Setup with Solve Formula */}
                <div className="flex flex-col gap-3 my-auto py-2" onClick={e => e.stopPropagation()}>
                  {/* 1. Setup / Scramble Section */}
                  <div className="p-3.5 bg-[#171622] rounded-2xl border border-[#818cf8]/30 flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#a5b4fc] uppercase tracking-wider">
                        <Layers className="w-3.5 h-3.5 text-[#818cf8]" />
                        <span>Setup Scramble (Inverse Algorithm)</span>
                      </div>

                      <button
                        type="button"
                        onClick={e => handleCopy(setupScramble, 'setup', e)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-[#a5b4fc] hover:text-white bg-[#818cf8]/15 border border-[#818cf8]/30 hover:bg-[#818cf8]/25 transition-colors cursor-pointer"
                        title="Copy Setup Scramble"
                      >
                        {copiedType === 'setup' ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-[#4ade80]" />
                            <span className="text-[#4ade80]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    <code className="text-xs font-mono font-bold text-[#c7d2fe] bg-[#12111c] px-3 py-2 rounded-xl border border-[#2f2b4a] break-all select-all">
                      {setupScramble || 'N/A'}
                    </code>
                    <p className="text-[10px] text-[#71717a]">
                      Apply to a solved cube to set up this exact practice state.
                    </p>
                  </div>

                  {/* 2. Solve Algorithm Section */}
                  <div className="p-3.5 bg-[#1f1b13] rounded-2xl border border-[#eab308]/30 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#eab308] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
                        <span>Solve Algorithm & Triggers</span>
                      </div>

                      <button
                        type="button"
                        onClick={e => currentCase && handleCopy(currentCase.primaryAlg, 'solve', e)}
                        className="flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono text-[#eab308] hover:text-white bg-[#eab308]/15 border border-[#eab308]/30 hover:bg-[#eab308]/25 transition-colors cursor-pointer"
                        title="Copy Primary Algorithm"
                      >
                        {copiedType === 'solve' ? (
                          <>
                            <CheckCheck className="w-3 h-3 text-[#4ade80]" />
                            <span className="text-[#4ade80]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Color-Coded Building Blocks */}
                    {currentCase && renderTriggerChunks(currentCase.primaryAlg)}

                    {/* Badges */}
                    {currentCase && (
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {detectAlgBadges(currentCase.primaryAlg).map(badge => (
                          <Badge key={badge} variant={badge === 'Palindrome' ? 'amber' : 'emerald'} className="text-[9px] py-0 px-1.5">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Mechanics / Why it works */}
                  {currentCase?.why && (
                    <div className="px-3.5 py-2.5 bg-[#141414] rounded-xl border border-[#2d2d2d] flex items-start gap-2 text-left">
                      <Info className="w-4 h-4 text-[#888888] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#a3a3a3] leading-relaxed">{currentCase.why}</p>
                    </div>
                  )}
                </div>

                {/* Back Footer */}
                <div className="border-t border-[#2d2d2d] pt-3 flex items-center justify-between text-xs text-[#737373]">
                  <span>Click card to return to diagram</span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] bg-[#141414] px-3 py-1 rounded-lg border border-[#2d2d2d] text-[#d4d4d4]">
                    Press <strong className="text-[#eab308]">Space</strong> to flip
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quizlet Action Buttons (Mastery Engine) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Still Learning (Key 1 / Left) */}
            <button
              type="button"
              onClick={handleMarkLearning}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#f87171] font-bold text-xs transition-all active:scale-98 shadow-md cursor-pointer"
              title="Mark as Still Learning (1 or X)"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>Still Learning</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-[#ef4444]/20 px-1.5 py-0.5 rounded">1</kbd>
            </button>

            {/* Navigation & Flip Center Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#2d2d2d] text-[#888888] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                title="Previous Card (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleFlip}
                className="px-4 py-3.5 rounded-2xl bg-[#282828] hover:bg-[#333333] border border-[#383838] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Flip Card (Space)"
              >
                <span>{isFlipped ? 'Show Diagram' : 'Reveal Solve'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex + 1 >= activeQueue.length}
                className="p-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#2d2d2d] text-[#888888] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                title="Next Card (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mastered / Got It (Key 2 / Right) */}
            <button
              type="button"
              onClick={handleMarkMastered}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#4ade80] font-bold text-xs transition-all active:scale-98 shadow-md cursor-pointer"
              title="Mark as Mastered (2 or C)"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mastered</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-[#22c55e]/20 px-1.5 py-0.5 rounded">2</kbd>
            </button>
          </div>

          {/* Monkeytype Style Keyboard Shortcuts HUD */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-[11px] font-mono text-[#666666]">
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">space</kbd>{' '}
              flip
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">1</kbd> still
              learning
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">2</kbd> mastered
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">← / →</kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">s</kbd> star
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">r</kbd> restart
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
