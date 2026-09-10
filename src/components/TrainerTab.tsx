import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Bookmark, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getDecks, getAvailableMethods } from '../services/algService';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTrainerSession } from '../hooks/useTrainerSession';
import { useTrainerKeyboard } from '../hooks/useTrainerKeyboard';
import { TrainerDeckSelector } from './trainer/TrainerDeckSelector';
import { FlashCard } from './trainer/FlashCard';
import { RoundSummary } from './trainer/RoundSummary';

export const TrainerTab: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const { bookmarkedIds, toggleBookmark, isBookmarked } = useBookmarks();

  // Read URL query params safely
  const methodParam = searchParams.get('method') || 'cfop-4look';
  const deckParam = searchParams.get('deck') || 'bookmarks';

  const availableMethods = useMemo(() => getAvailableMethods(), []);
  const session = useTrainerSession(deckParam, bookmarkedIds, methodParam);

  const availableDecks = useMemo(() => {
    return getDecks(methodParam, bookmarkedIds);
  }, [methodParam, bookmarkedIds]);

  const activeDeckId = availableDecks.some(d => d.id === deckParam)
    ? deckParam
    : (availableDecks.find(d => d.id !== 'bookmarks')?.id || 'bookmarks');

  const handleSelectDeck = (deckId: string) => {
    setSearchParams({ deck: deckId, method: methodParam });
  };

  const handleSelectMethod = (newMethodId: string) => {
    const newDecks = getDecks(newMethodId, bookmarkedIds);
    const matchingDeck = newDecks.find(d => d.id === deckParam) || newDecks.find(d => d.id !== 'bookmarks') || newDecks[0];
    setSearchParams({ deck: matchingDeck?.id || 'bookmarks', method: newMethodId });
  };

  // Keyboard controls
  useTrainerKeyboard({
    onFlip: session.flip,
    onNext: session.next,
    onPrev: session.prev,
    onMastered: session.markMastered,
    onLearning: session.markLearning,
    onToggleBookmark: () => {
      if (session.currentCase) {
        toggleBookmark(session.currentCase.id);
      }
    },
    onRestart: session.restart,
    onToggleHint: session.toggleHint,
    enabled: !session.isRoundFinished && Boolean(session.currentCase),
  });

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-2">
      {/* Top Monkeytype-Style Navigation & Config Bar */}
      <TrainerDeckSelector
        decks={availableDecks}
        selectedDeckId={activeDeckId}
        isShuffled={session.isShuffled}
        selectedMethodId={methodParam}
        availableMethods={availableMethods}
        onSelectDeck={handleSelectDeck}
        onSelectMethod={handleSelectMethod}
        onToggleShuffle={session.toggleShuffle}
        onRestart={session.restart}
      />

      {/* Empty Bookmarks Fallback State */}
      {activeDeckId === 'bookmarks' && session.baseCases.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center gap-4 bg-[#202020] border border-[#2d2d2d] rounded-3xl shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#2d2d2d] flex items-center justify-center text-[#eab308] shadow-inner">
            <Bookmark className="w-7 h-7 stroke-[2]" />
          </div>
          <div className="flex flex-col gap-1.5 max-w-md">
            <h2 className="text-xl font-bold text-white tracking-tight">No Bookmarked Algorithms Yet</h2>
            <p className="text-xs text-[#888888] leading-relaxed">
              Star algorithms from the <strong>Algorithms Reference</strong> library to create your custom training deck, or jump straight into any category!
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button
              type="button"
              onClick={() => handleSelectDeck(availableDecks[1]?.id || 'oll')}
              className="px-5 py-2.5 rounded-xl bg-[#eab308] hover:bg-[#facc15] text-black text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Train {availableDecks[1]?.label || 'Algorithms'}
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
      ) : session.isRoundFinished ? (
        /* Round Summary / Victory Screen */
        <RoundSummary
          roundNumber={session.roundNumber}
          totalCards={session.activeQueue.length}
          masteredCount={session.masteredIds.size}
          learningCount={session.learningIds.size}
          activeQueue={session.activeQueue}
          masteredIds={session.masteredIds}
          totalBaseCount={session.baseCases.length}
          onReviewMissed={session.reviewMissed}
          onRestart={session.restart}
        />
      ) : session.currentCase ? (
        /* Active Flashcard Drill Area */
        <div className="flex flex-col gap-4">
          {/* Progress Header & Mastery Counters */}
          <div className="flex items-center justify-between gap-4 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-white text-sm">
                {session.currentIndex + 1}{' '}
                <span className="text-[#737373] text-xs">/ {session.activeQueue.length}</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#818cf8]/15 border border-[#818cf8]/30 text-[#818cf8] text-[10px] font-bold">
                Round {session.roundNumber}
              </span>
            </div>

            {/* Live Session Counters */}
            <div className="flex items-center gap-3 font-mono font-semibold">
              <span className="text-[#4ade80] flex items-center gap-1 bg-[#22c55e]/10 px-2 py-0.5 rounded-md border border-[#22c55e]/25">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> {session.masteredIds.size}
              </span>
              <span className="text-[#ef4444] flex items-center gap-1 bg-[#ef4444]/10 px-2 py-0.5 rounded-md border border-[#ef4444]/25">
                <X className="w-3.5 h-3.5 stroke-[3]" /> {session.learningIds.size}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#1e1e1e] h-1.5 rounded-full overflow-hidden border border-[#2d2d2d]">
            <div
              className="bg-[#eab308] h-full transition-all duration-300 ease-out"
              style={{ width: `${session.progressPercent}%` }}
            />
          </div>

          {/* 3D Horizontal-Axis Flip Flashcard */}
          <FlashCard
            currentCase={session.currentCase}
            setupScramble={session.setupScramble}
            isFlipped={session.isFlipped}
            showHint={session.showHint}
            isBookmarked={isBookmarked(session.currentCase.id)}
            copiedType={session.copiedType}
            onFlip={session.flip}
            onToggleHint={session.toggleHint}
            onToggleBookmark={() => session.currentCase && toggleBookmark(session.currentCase.id)}
            onCopy={session.handleCopy}
          />

          {/* Quizlet Action Buttons (Mastery Engine) */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Still Learning (Key 1 / Left) */}
            <button
              type="button"
              onClick={session.markLearning}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#f87171] font-bold text-xs transition-all active:scale-98 shadow-md cursor-pointer"
              title="Mark as Still Learning (1 or X)"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>Still Learning</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-[#ef4444]/20 px-1.5 py-0.5 rounded">
                1
              </kbd>
            </button>

            {/* Navigation & Flip Center Pills */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={session.prev}
                disabled={session.currentIndex === 0}
                className="p-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#2d2d2d] text-[#888888] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                title="Previous Card (←)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={session.flip}
                className="px-4 py-3.5 rounded-2xl bg-[#282828] hover:bg-[#333333] border border-[#383838] text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Flip Card (Space)"
              >
                <span>{session.isFlipped ? 'Show Diagram' : 'Reveal Solve'}</span>
              </button>

              <button
                type="button"
                onClick={session.next}
                disabled={session.currentIndex + 1 >= session.activeQueue.length}
                className="p-3.5 rounded-2xl bg-[#1e1e1e] hover:bg-[#282828] border border-[#2d2d2d] text-[#888888] hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-sm"
                title="Next Card (→)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mastered / Got It (Key 2 / Right) */}
            <button
              type="button"
              onClick={session.markMastered}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#22c55e]/10 hover:bg-[#22c55e]/20 border border-[#22c55e]/30 text-[#4ade80] font-bold text-xs transition-all active:scale-98 shadow-md cursor-pointer"
              title="Mark as Mastered (2 or C)"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Mastered</span>
              <kbd className="hidden sm:inline text-[10px] font-mono bg-[#22c55e]/20 px-1.5 py-0.5 rounded">
                2
              </kbd>
            </button>
          </div>

          {/* Monkeytype Style Keyboard Shortcuts HUD */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-[11px] font-mono text-[#666666]">
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                space
              </kbd>{' '}
              flip
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                1
              </kbd>{' '}
              still learning
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                2
              </kbd>{' '}
              mastered
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                ← / →
              </kbd>{' '}
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                s
              </kbd>{' '}
              star
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-[#1e1e1e] px-1.5 py-0.5 rounded border border-[#2d2d2d] text-[#888888]">
                r
              </kbd>{' '}
              restart
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
