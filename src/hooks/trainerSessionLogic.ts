import type { AlgCase } from '../types/cube';

export type CardOutcome = 'mastered' | 'learning';

export interface TrainerRoundState {
  activeQueue: AlgCase[];
  currentIndex: number;
  roundNumber: number;
  isRoundFinished: boolean;
  masteredIds: Set<string>;
  learningIds: Set<string>;
}

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function initRoundState(
  cases: AlgCase[],
  shuffle: boolean,
  round: number,
  shuffleFn: <T>(arr: T[]) => T[] = shuffleArray,
): TrainerRoundState {
  const list = shuffle ? shuffleFn(cases) : [...cases];
  return {
    activeQueue: list,
    currentIndex: 0,
    roundNumber: round,
    isRoundFinished: false,
    masteredIds: new Set(),
    learningIds: new Set(),
  };
}

export function progressPercent(currentIndex: number, queueLength: number): number {
  if (queueLength <= 0) return 0;
  return Math.round(((currentIndex + 1) / queueLength) * 100);
}

export function applyCardOutcome(
  state: TrainerRoundState,
  outcome: CardOutcome,
  caseId: string,
): { nextState: TrainerRoundState; shouldFireConfetti: boolean } {
  const masteredIds = new Set(state.masteredIds);
  const learningIds = new Set(state.learningIds);

  if (outcome === 'mastered') {
    masteredIds.add(caseId);
    learningIds.delete(caseId);
  } else {
    learningIds.add(caseId);
    masteredIds.delete(caseId);
  }

  const isLastCard = state.currentIndex + 1 >= state.activeQueue.length;

  if (!isLastCard) {
    return {
      nextState: {
        ...state,
        masteredIds,
        learningIds,
        currentIndex: state.currentIndex + 1,
        isRoundFinished: false,
      },
      shouldFireConfetti: false,
    };
  }

  const allMastered = masteredIds.size === state.activeQueue.length;
  return {
    nextState: {
      ...state,
      masteredIds,
      learningIds,
      isRoundFinished: true,
    },
    shouldFireConfetti: allMastered,
  };
}

export function reviewMissedCases(
  state: TrainerRoundState,
  baseCases: AlgCase[],
  shuffle: boolean,
  shuffleFn: <T>(arr: T[]) => T[] = shuffleArray,
): TrainerRoundState | null {
  const missed = baseCases.filter(c => state.learningIds.has(c.id));
  if (missed.length === 0) return null;
  return initRoundState(missed, shuffle, state.roundNumber + 1, shuffleFn);
}

export function roundSummaryMetrics(state: TrainerRoundState) {
  const totalCards = state.activeQueue.length;
  const masteredCount = state.masteredIds.size;
  const learningCount = state.learningIds.size;
  const accuracyPercent = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;
  return { totalCards, masteredCount, learningCount, accuracyPercent };
}

export function setsAreDisjoint(masteredIds: Set<string>, learningIds: Set<string>): boolean {
  for (const id of masteredIds) {
    if (learningIds.has(id)) return false;
  }
  return true;
}

export function makeMockCase(id: string): AlgCase {
  return {
    id,
    name: id,
    category: 'test',
    subcategory: 'test',
    group: 'test',
    primaryAlg: "R U R' U'",
  };
}
