import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import type { AlgCase } from '../types/cube';
import { getAllCases, getDeckById } from '../services/algService';
import { invertMoveString } from '../utils/cubeLogic';
import {
  applyCardOutcome,
  goToPreviousCard,
  initRoundState,
  progressPercent as computeProgressPercent,
  reviewMissedCases,
  shuffleArray,
  type CardOutcome,
  type TrainerRoundState,
} from './trainerSessionLogic';

export function useTrainerSession(deckId: string, bookmarkedIds: string[], methodId = 'cfop-4look') {
  const [isShuffled, setIsShuffled] = useState<boolean>(true);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  const [copiedType, setCopiedType] = useState<'setup' | 'solve' | null>(null);

  const allCases = useMemo(() => getAllCases(methodId), [methodId]);

  // Raw cases for the dynamically resolved deck
  const baseCases = useMemo(() => {
    return getDeckById(deckId, allCases, bookmarkedIds).cases;
  }, [deckId, allCases, bookmarkedIds]);

  // Active queue of cards in current round
  const [activeQueue, setActiveQueue] = useState<AlgCase[]>(() => {
    return isShuffled ? shuffleArray(baseCases) : [...baseCases];
  });

  const fireConfetti = useCallback(() => {
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
  }, []);

  const applyRoundState = useCallback((next: ReturnType<typeof initRoundState>) => {
    setActiveQueue(next.activeQueue);
    setCurrentIndex(next.currentIndex);
    setRoundNumber(next.roundNumber);
    setIsRoundFinished(next.isRoundFinished);
    setMasteredIds(next.masteredIds);
    setLearningIds(next.learningIds);
    setIsFlipped(false);
    setShowHint(false);
  }, []);

  // Reset or start a new round — mastery sets are scoped to the current round only
  const initRound = useCallback(
    (cases: AlgCase[], shuffle: boolean, round = 1) => {
      applyRoundState(initRoundState(cases, shuffle, round));
    },
    [applyRoundState],
  );

  const isBookmarksDeck = deckId === 'bookmarks';

  // Track previous deck/method to distinguish full re-init from bookmark membership changes
  const prevDeckMethodRef = useRef(`${deckId}::${methodId}`);

  // Full re-init when deck or method changes
  useEffect(() => {
    const key = `${deckId}::${methodId}`;
    if (prevDeckMethodRef.current !== key) {
      prevDeckMethodRef.current = key;
      // oxlint-disable-next-line react/set-state-in-effect
      initRound(baseCases, isShuffled, 1);
    }
  }, [deckId, methodId, baseCases, isShuffled, initRound]);

  // Queue surgery when bookmarks change on the bookmarks deck —
  // removes unstarred cards and adds newly starred ones without resetting
  // roundNumber, masteredIds, or learningIds for remaining cards.
  useEffect(() => {
    if (!isBookmarksDeck) return;

    // oxlint-disable-next-line react/set-state-in-effect
    setActiveQueue(prev => {
      const currentIds = new Set(prev.map(c => c.id));
      const targetIds = new Set(baseCases.map(c => c.id));

      // Removed cards: in queue but no longer bookmarked
      const removedIds = new Set([...currentIds].filter(id => !targetIds.has(id)));
      // Added cards: newly bookmarked but not in queue
      const addedCases = baseCases.filter(c => !currentIds.has(c.id));

      if (removedIds.size === 0 && addedCases.length === 0) return prev;

      const filtered = prev.filter(c => !removedIds.has(c.id));
      return [...filtered, ...addedCases];
    });

    // Clean up mastery sets to remove any unstarred IDs
    setMasteredIds(prev => {
      const targetIds = new Set(baseCases.map(c => c.id));
      const next = new Set([...prev].filter(id => targetIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
    setLearningIds(prev => {
      const targetIds = new Set(baseCases.map(c => c.id));
      const next = new Set([...prev].filter(id => targetIds.has(id)));
      return next.size === prev.size ? prev : next;
    });

    // Clamp currentIndex if it now exceeds the queue
    setCurrentIndex(prev => {
      const maxIndex = Math.max(0, baseCases.length - 1);
      return prev > maxIndex ? maxIndex : prev;
    });
  }, [isBookmarksDeck, baseCases]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentCase = activeQueue[currentIndex] as AlgCase | undefined;

  // Setup scramble (inverse of primary algorithm)
  const setupScramble = useMemo(() => {
    if (!currentCase?.primaryAlg) return '';
    return invertMoveString(currentCase.primaryAlg).join(' ');
  }, [currentCase]);

  // Navigation handlers
  const flip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const toggleHint = useCallback(() => {
    setShowHint(prev => !prev);
  }, []);

  const advanceWithOutcome = useCallback(
    (outcome: CardOutcome) => {
      if (!currentCase) return;

      const { nextState, shouldFireConfetti } = applyCardOutcome(
        {
          activeQueue,
          currentIndex,
          roundNumber,
          isRoundFinished,
          masteredIds,
          learningIds,
        },
        outcome,
        currentCase.id,
      );

      setMasteredIds(nextState.masteredIds);
      setLearningIds(nextState.learningIds);
      setCurrentIndex(nextState.currentIndex);
      setIsRoundFinished(nextState.isRoundFinished);

      if (!nextState.isRoundFinished) {
        setIsFlipped(false);
        setShowHint(false);
      } else if (shouldFireConfetti) {
        fireConfetti();
      }
    },
    [
      activeQueue,
      currentCase,
      currentIndex,
      fireConfetti,
      isRoundFinished,
      learningIds,
      masteredIds,
      roundNumber,
    ],
  );

  const next = useCallback(() => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, activeQueue.length]);

  const prev = useCallback(() => {
    const prior: TrainerRoundState = {
      activeQueue,
      currentIndex,
      roundNumber,
      isRoundFinished,
      masteredIds,
      learningIds,
    };
    const previous = goToPreviousCard(prior);
    if (!previous) return;
    setCurrentIndex(previous.currentIndex);
    setIsRoundFinished(previous.isRoundFinished);
    setIsFlipped(false);
    setShowHint(false);
  }, [activeQueue, currentIndex, isRoundFinished, learningIds, masteredIds, roundNumber]);

  // Mastery handlers
  const markMastered = useCallback(() => {
    advanceWithOutcome('mastered');
  }, [advanceWithOutcome]);

  const markLearning = useCallback(() => {
    advanceWithOutcome('learning');
  }, [advanceWithOutcome]);

  // Spaced repetition: Drill only the missed cases
  const reviewMissed = useCallback(() => {
    const nextRound = reviewMissedCases(
      {
        activeQueue,
        currentIndex,
        roundNumber,
        isRoundFinished,
        masteredIds,
        learningIds,
      },
      baseCases,
      isShuffled,
    );
    if (nextRound) {
      applyRoundState(nextRound);
    }
  }, [
    activeQueue,
    applyRoundState,
    baseCases,
    currentIndex,
    isRoundFinished,
    isShuffled,
    learningIds,
    masteredIds,
    roundNumber,
  ]);

  // Restart full deck
  const restart = useCallback(() => {
    initRound(baseCases, isShuffled, 1);
  }, [baseCases, isShuffled, initRound]);

  // Shuffle toggle
  const toggleShuffle = useCallback(() => {
    const nextShuffle = !isShuffled;
    setIsShuffled(nextShuffle);
    initRound(baseCases, nextShuffle, roundNumber);
  }, [isShuffled, baseCases, roundNumber, initRound]);

  // Clipboard copy
  const handleCopy = useCallback((text: string, type: 'setup' | 'solve', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 1800);
  }, []);

  const progressPercent = computeProgressPercent(currentIndex, activeQueue.length);

  return {
    allCases,
    activeQueue,
    baseCases,
    currentCase,
    currentIndex,
    progressPercent,
    isFlipped,
    showHint,
    isShuffled,
    roundNumber,
    isRoundFinished,
    masteredIds,
    learningIds,
    setupScramble,
    copiedType,
    flip,
    next,
    prev,
    markMastered,
    markLearning,
    toggleHint,
    toggleShuffle,
    restart,
    reviewMissed,
    handleCopy,
  };
}
