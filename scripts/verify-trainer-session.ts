import {
  applyCardOutcome,
  goToPreviousCard,
  initRoundState,
  makeMockCase,
  progressPercent,
  reviewMissedCases,
  roundSummaryMetrics,
  setsAreDisjoint,
} from '../src/hooks/trainerSessionLogic.ts';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function runRound(
  initial: ReturnType<typeof initRoundState>,
  outcomes: Array<'mastered' | 'learning'>,
): { state: ReturnType<typeof initRoundState>; confettiEvents: boolean[] } {
  let state = initial;
  const confettiEvents: boolean[] = [];

  for (const outcome of outcomes) {
    const currentCase = state.activeQueue[state.currentIndex];
    assert(Boolean(currentCase), 'runRound: no current case');
    const result = applyCardOutcome(state, outcome, currentCase!.id);
    state = result.nextState;
    confettiEvents.push(result.shouldFireConfetti);
  }

  return { state, confettiEvents };
}

function runVerification(): void {
  console.log('--- Trainer Session Verification ---');

  const fiveCards = ['a', 'b', 'c', 'd', 'e'].map(makeMockCase);
  const baseCases = fiveCards;

  // Repro 1: Round 2+ summary must not exceed 100% accuracy or total cards
  let round1 = initRoundState(baseCases, false, 1);
  ({ state: round1 } = runRound(round1, ['mastered', 'mastered', 'mastered', 'learning', 'learning']));
  assert(round1.roundNumber === 1, 'Repro 1: round 1 should finish');
  assert(round1.masteredIds.size === 3, 'Repro 1: expected 3 mastered in round 1');
  assert(round1.learningIds.size === 2, 'Repro 1: expected 2 learning in round 1');

  const round2Start = reviewMissedCases(round1, baseCases, false);
  assert(round2Start !== null, 'Repro 1: reviewMissed should start round 2');
  assert(round2Start!.activeQueue.length === 2, 'Repro 1: round 2 queue should have 2 cards');
  assert(round2Start!.masteredIds.size === 0, 'Repro 1: round 2 should reset masteredIds');
  assert(round2Start!.learningIds.size === 0, 'Repro 1: round 2 should reset learningIds');

  const { state: round2 } = runRound(round2Start!, ['mastered', 'mastered']);
  const summary = roundSummaryMetrics(round2);
  assert(summary.masteredCount === 2, `Repro 1: masteredCount=${summary.masteredCount}, expected 2`);
  assert(summary.learningCount === 0, `Repro 1: learningCount=${summary.learningCount}, expected 0`);
  assert(summary.totalCards === 2, `Repro 1: totalCards=${summary.totalCards}, expected 2`);
  assert(summary.accuracyPercent === 100, `Repro 1: accuracy=${summary.accuracyPercent}%, expected 100%`);

  for (const priorOnlyId of ['a', 'b', 'c']) {
    assert(
      !round2.masteredIds.has(priorOnlyId),
      `Repro 1: round-2 mastery must not carry over "${priorOnlyId}" from round 1`,
    );
  }
  assert(
    round2.masteredIds.has('d') && round2.masteredIds.has('e'),
    'Repro 1: round-2 should master only the two missed cards',
  );
  console.log('Repro 1: round 2 summary 2/2 mastered, 100% (round-1 cards excluded)');

  // Repro 2a: confetti must not fire when last card is Still Learning (4 mastered, 1 learning)
  const round2a = initRoundState(baseCases, false, 1);
  const { confettiEvents: confetti2a } = runRound(round2a, [
    'mastered',
    'mastered',
    'mastered',
    'mastered',
    'learning',
  ]);
  assert(confetti2a.every(flag => !flag), 'Repro 2a: confetti must not fire on failed round');
  console.log('Repro 2a: no confetti when last card is Still Learning');

  // Repro 2b: single-card deck marked Still Learning must not confetti
  const singleCard = initRoundState([makeMockCase('solo')], false, 1);
  const { confettiEvents: confetti2b } = runRound(singleCard, ['learning']);
  assert(confetti2b.every(flag => !flag), 'Repro 2b: confetti must not fire for single learning card');
  console.log('Repro 2b: no confetti for single-card Still Learning round');

  // Repro 2c: confetti fires when every card in the round is Mastered
  const flawless = initRoundState(baseCases, false, 1);
  const { confettiEvents: confetti2c } = runRound(flawless, [
    'mastered',
    'mastered',
    'mastered',
    'mastered',
    'mastered',
  ]);
  assert(confetti2c.at(-1) === true, 'Repro 2c: confetti should fire on flawless round');
  assert(confetti2c.slice(0, -1).every(flag => !flag), 'Repro 2c: confetti only on round completion');
  console.log('Repro 2c: confetti fires when all cards mastered');

  // Repro 3: back-then-relabel mid-round keeps mastery sets disjoint
  const threeCards = ['card-a', 'card-b', 'card-c'].map(makeMockCase);
  let relabelState = initRoundState(threeCards, false, 1);
  relabelState = applyCardOutcome(relabelState, 'mastered', 'card-a').nextState;
  assert(relabelState.currentIndex === 1, 'Repro 3: should advance to index 1 after mastering card-a');
  assert(relabelState.masteredIds.has('card-a'), 'Repro 3: card-a should be mastered before going back');

  const backState = goToPreviousCard(relabelState);
  assert(backState !== null, 'Repro 3: goToPreviousCard should succeed mid-round');
  assert(backState!.currentIndex === 0, 'Repro 3: should return to index 0');
  relabelState = backState!;

  relabelState = applyCardOutcome(relabelState, 'learning', 'card-a').nextState;
  assert(relabelState.currentIndex === 1, 'Repro 3: relabel should advance to index 1');
  assert(setsAreDisjoint(relabelState.masteredIds, relabelState.learningIds), 'Repro 3: sets must be disjoint');
  assert(!relabelState.masteredIds.has('card-a'), 'Repro 3: card-a must not remain mastered after relabel');
  assert(relabelState.learningIds.has('card-a'), 'Repro 3: card-a must be learning after relabel');
  assert(relabelState.masteredIds.size === 0, 'Repro 3: no other cards should remain mastered');
  console.log('Repro 3: mastered → prev → still learning keeps sets disjoint');

  // Repro 4: progress bar reads 100% on the last card
  const tenCards = Array.from({ length: 10 }, (_, i) => makeMockCase(`c${i + 1}`));
  const lastIndex = tenCards.length - 1;
  assert(progressPercent(lastIndex, tenCards.length) === 100, 'Repro 4: last card should read 100%');
  assert(progressPercent(0, tenCards.length) === 10, 'Repro 4: first card should read 10%');
  console.log('Repro 4: progressPercent is 100% on last card');

  console.log('\nAll trainer session verification checks passed.');
}

runVerification();
