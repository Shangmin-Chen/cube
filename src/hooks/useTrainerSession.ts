import { useState, useMemo, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { AlgCase } from '../types/cube';
import { getAllCases, getDeckById } from '../services/algService';
import { invertMoveString } from '../utils/cubeLogic';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function useTrainerSession(deckId: string, bookmarkedIds: string[]) {
  const [isShuffled, setIsShuffled] = useState<boolean>(true);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);
  const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set());
  const [learningIds, setLearningIds] = useState<Set<string>>(new Set());
  const [copiedType, setCopiedType] = useState<'setup' | 'solve' | null>(null);

  const allCases = useMemo(() => getAllCases(), []);

  // Raw cases for the dynamically resolved deck
  const baseCases = useMemo(() => {
    return getDeckById(deckId, allCases, bookmarkedIds).cases;
  }, [deckId, allCases, bookmarkedIds]);

  // Active queue of cards in current round
  const [activeQueue, setActiveQueue] = useState<AlgCase[]>(() => {
    return isShuffled ? shuffleArray(baseCases) : [...baseCases];
  });

  // Reset or start a new round
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

  // Sync active queue when deck selection changes
  useEffect(() => {
    initRound(baseCases, isShuffled, 1);
  }, [deckId]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const advance = useCallback(() => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      setIsRoundFinished(true);
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
  }, [currentIndex, activeQueue.length, masteredIds.size]);

  const next = useCallback(() => {
    if (currentIndex + 1 < activeQueue.length) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex, activeQueue.length]);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [currentIndex]);

  // Mastery handlers
  const markMastered = useCallback(() => {
    if (!currentCase) return;
    setMasteredIds(prev => new Set(prev).add(currentCase.id));
    setLearningIds(prev => {
      const nextSet = new Set(prev);
      nextSet.delete(currentCase.id);
      return nextSet;
    });
    advance();
  }, [currentCase, advance]);

  const markLearning = useCallback(() => {
    if (!currentCase) return;
    setLearningIds(prev => new Set(prev).add(currentCase.id));
    advance();
  }, [currentCase, advance]);

  // Spaced repetition: Drill only the missed cases
  const reviewMissed = useCallback(() => {
    const missed = baseCases.filter(c => learningIds.has(c.id));
    if (missed.length > 0) {
      initRound(missed, isShuffled, roundNumber + 1);
    }
  }, [baseCases, learningIds, isShuffled, roundNumber, initRound]);

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

  const progressPercent = activeQueue.length > 0
    ? Math.round(((currentIndex + (isRoundFinished ? 1 : 0)) / activeQueue.length) * 100)
    : 0;

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
