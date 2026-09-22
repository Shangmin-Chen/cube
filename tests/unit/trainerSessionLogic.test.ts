import { describe, it, expect } from 'vitest';
import type { AlgCase } from '../../src/types/cube';
import {
  applyCardOutcome,
  goToPreviousCard,
  initRoundState,
  progressPercent,
  reviewMissedCases,
} from '../../src/hooks/trainerSessionLogic';

function makeMockCase(id: string): AlgCase {
  return {
    id,
    name: id,
    category: 'test',
    subcategory: 'test',
    group: 'test',
    primaryAlg: "R U R' U'",
  };
}

function runRound(
  initial: ReturnType<typeof initRoundState>,
  outcomes: Array<'mastered' | 'learning'>,
): { state: ReturnType<typeof initRoundState>; confettiEvents: boolean[] } {
  let state = initial;
  const confettiEvents: boolean[] = [];

  for (const outcome of outcomes) {
    const currentCase = state.activeQueue[state.currentIndex];
    expect(currentCase).toBeDefined();
    const result = applyCardOutcome(state, outcome, currentCase!.id);
    state = result.nextState;
    confettiEvents.push(result.shouldFireConfetti);
  }

  return { state, confettiEvents };
}

describe('trainerSessionLogic', () => {
  const fiveCards = ['a', 'b', 'c', 'd', 'e'].map(makeMockCase);

  it('Round 2+ summary resets mastery and does not carry over round-1 cards', () => {
    let round1 = initRoundState(fiveCards, false, 1);
    ({ state: round1 } = runRound(round1, ['mastered', 'mastered', 'mastered', 'learning', 'learning']));
    expect(round1.isRoundFinished).toBe(true);
    expect(round1.masteredIds.size).toBe(3);
    expect(round1.learningIds.size).toBe(2);

    const round2Start = reviewMissedCases(round1, fiveCards, false);
    expect(round2Start).not.toBeNull();
    expect(round2Start!.roundNumber).toBe(2);
    expect(round2Start!.activeQueue.length).toBe(2);
    expect(round2Start!.masteredIds.size).toBe(0);
    expect(round2Start!.learningIds.size).toBe(0);

    const { state: round2 } = runRound(round2Start!, ['mastered', 'mastered']);
    expect(round2.isRoundFinished).toBe(true);
    expect(round2.activeQueue.length).toBe(2);
    expect(round2.masteredIds.size).toBe(2);
    expect(round2.learningIds.size).toBe(0);

    for (const priorOnlyId of ['a', 'b', 'c']) {
      expect(round2.masteredIds.has(priorOnlyId)).toBe(false);
    }
    expect(round2.masteredIds.has('d')).toBe(true);
    expect(round2.masteredIds.has('e')).toBe(true);
  });

  it('confetti does not fire when last card is Still Learning', () => {
    const round2a = initRoundState(fiveCards, false, 1);
    const { confettiEvents: confetti2a } = runRound(round2a, [
      'mastered',
      'mastered',
      'mastered',
      'mastered',
      'learning',
    ]);
    expect(confetti2a.every(flag => !flag)).toBe(true);
  });

  it('confetti does not fire for single-card Still Learning round', () => {
    const singleCard = initRoundState([makeMockCase('solo')], false, 1);
    const { confettiEvents: confetti2b } = runRound(singleCard, ['learning']);
    expect(confetti2b.every(flag => !flag)).toBe(true);
  });

  it('confetti fires exclusively upon 100% round completion', () => {
    const flawless = initRoundState(fiveCards, false, 1);
    const { confettiEvents: confetti2c } = runRound(flawless, [
      'mastered',
      'mastered',
      'mastered',
      'mastered',
      'mastered',
    ]);
    expect(confetti2c.at(-1)).toBe(true);
    expect(confetti2c.slice(0, -1).every(flag => !flag)).toBe(true);
  });

  it('back-then-relabel mid-round keeps mastery sets disjoint', () => {
    const threeCards = ['card-a', 'card-b', 'card-c'].map(makeMockCase);
    let relabelState = initRoundState(threeCards, false, 1);
    relabelState = applyCardOutcome(relabelState, 'mastered', 'card-a').nextState;
    expect(relabelState.currentIndex).toBe(1);
    expect(relabelState.masteredIds.has('card-a')).toBe(true);

    const backState = goToPreviousCard(relabelState);
    expect(backState).not.toBeNull();
    expect(backState!.currentIndex).toBe(0);
    relabelState = backState!;

    relabelState = applyCardOutcome(relabelState, 'learning', 'card-a').nextState;
    expect(relabelState.currentIndex).toBe(1);
    expect(relabelState.masteredIds.has('card-a')).toBe(false);
    expect(relabelState.learningIds.has('card-a')).toBe(true);
    expect(relabelState.masteredIds.size).toBe(0);
  });

  it('calculates progress percentage correctly including 100% on the last card', () => {
    const total = 10;
    expect(progressPercent(0, total)).toBe(10);
    expect(progressPercent(9, total)).toBe(100);
  });

  it('empty round does not fire confetti', () => {
    const emptyState = initRoundState([], false, 1);
    expect(emptyState.activeQueue.length).toBe(0);
    const emptyOutcome = applyCardOutcome(emptyState, 'mastered', 'ghost-card');
    expect(emptyOutcome.shouldFireConfetti).toBe(false);
  });

  it('skipping all cards marks all as learning and never fires confetti', () => {
    const sixCards = ['x1', 'x2', 'x3', 'x4', 'x5'].map(makeMockCase);
    let skipState = initRoundState(sixCards, false, 1);
    const confettiEvents: boolean[] = [];

    for (const c of sixCards) {
      const { nextState, shouldFireConfetti } = applyCardOutcome(skipState, 'learning', c.id);
      skipState = nextState;
      confettiEvents.push(shouldFireConfetti);
    }

    expect(skipState.isRoundFinished).toBe(true);
    expect(skipState.learningIds.size).toBe(sixCards.length);
    expect(skipState.masteredIds.size).toBe(0);
    expect(confettiEvents.every(f => !f)).toBe(true);
  });
});
