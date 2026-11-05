/** Independent trials, with no pushes or partial wins. Payout is net profit per stake. */
export function expectedValue(winChance: number, payout: number, stake: number, rounds: number) {
  const perUnit = winChance * payout - (1 - winChance);
  return {
    perUnit,
    perRound: stake * perUnit,
    total: stake * rounds * perUnit,
    breakEven: 1 / (payout + 1),
  };
}

/** Absorbing-state recurrence: probability of at least one run of k losses in n trials. */
export function losingStreak(lossChance: number, rounds: number, length: number): number {
  let states: number[] = Array.from({ length }, (_, i) => (i === 0 ? 1 : 0));
  let reached = 0;
  for (let trial = 0; trial < rounds; trial++) {
    reached += states[length - 1] * lossChance;
    const next = Array.from({ length }, () => 0);
    next[0] = states.reduce((sum, p) => sum + p, 0) * (1 - lossChance);
    for (let i = 1; i < length; i++) next[i] = states[i - 1] * lossChance;
    states = next;
  }
  return Math.min(1, Math.max(0, reached));
}

export function diceSums(sides: number): { sum: number; ways: number; probability: number }[] {
  return Array.from({ length: 2 * sides - 1 }, (_, i) => {
    const sum = i + 2,
      ways = sides - Math.abs(sides + 1 - sum);
    return { sum, ways, probability: ways / (sides * sides) };
  });
}

export const casinoTools = [
  {
    id: 'expected-value',
    title: 'Expected value & house edge',
    description: 'Compare win probability, net payouts and the average cost of repeated bets.',
  },
  {
    id: 'losing-streak',
    title: 'Losing-streak probability',
    description: 'Find the chance of a run of consecutive losses during a session.',
  },
  {
    id: 'dice',
    title: 'Two-dice probability',
    description: 'Explore sums, combinations and fair payouts for two independent dice.',
  },
] as const;
