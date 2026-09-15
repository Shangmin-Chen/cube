import { useState, useMemo, useCallback, useEffect } from 'react';
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
  const bookmarkKey = isBookmarksDeck ? bookmarkedIds.join(',') : '';

  // Sync active queue when deck selection changes, method changes, or bookmarks change on bookmarks deck
  useEffect(() => {
    initRound(baseCases, isShuffled, 1);
  }, [deckId, methodId, bookmarkKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
