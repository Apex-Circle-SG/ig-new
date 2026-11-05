import { describe, expect, it, vi } from 'vitest';
import { diceSums, expectedValue, losingStreak } from '../../apps/web/src/lib/casino/probability';
import { anchors, bets, hits, payoutFor, play } from '../../apps/web/src/lib/casino/roulette';
import { isCalculatorPage, isPublicAdvertisingPath } from '@insightginie/seo';

describe('casino mathematics', () => {
  it('computes roulette edge and distinguishes net from returned stake', () => {
    expect(expectedValue(18 / 37, 1, 10, 100).total).toBeCloseTo(-1000 / 37);
    expect(expectedValue(0.25, 3, 1, 1).perUnit).toBe(0);
    expect(expectedValue(1, 2, 5, 10).total).toBe(100);
  });
  it('counts overlapping streaks with an exact small exhaustive oracle', () => {
    for (let n = 1; n <= 8; n++)
      for (let k = 1; k <= n + 1; k++) {
        let count = 0;
        for (let mask = 0; mask < 2 ** n; mask++)
          if (mask.toString(2).padStart(n, '0').includes('0'.repeat(k))) count++;
        expect(losingStreak(0.5, n, k)).toBeCloseTo(count / 2 ** n);
      }
    expect(losingStreak(1, 20, 6)).toBe(1);
    expect(losingStreak(0, 20, 6)).toBe(0);
  });
  it('counts all dice combinations and central symmetry', () => {
    for (const sides of [2, 6, 20]) {
      const sums = diceSums(sides);
      expect(sums.reduce((n, x) => n + x.ways, 0)).toBe(sides * sides);
      expect(sums.reduce((n, x) => n + x.probability, 0)).toBeCloseTo(1);
      expect(sums.map((x) => x.ways)).toEqual(sums.map((x) => x.ways).reverse());
    }
    expect(diceSums(6).find((x) => x.sum === 7)?.ways).toBe(6);
  });
  it('gives every offered standard roulette bet the correct expected return', () => {
    for (const wheel of [37, 38])
      for (const bet of bets) {
        const numbers = anchors(bet.value, wheel);
        for (const anchor of numbers) {
          const net = Array.from({ length: wheel }, (_, n) =>
            hits(n, bet.value, anchor) ? payoutFor(bet.value) : -1,
          );
          if (bet.value === 'two-columns') {
            expect(net.filter((x) => x > 0)).toHaveLength(24);
          } else
            expect(net.reduce((sum, x) => sum + x, 0) / wheel).toBeCloseTo((36 - wheel) / wheel);
        }
      }
    expect(hits(37, 'black', 0)).toBe(false);
    expect(hits(0, 'even', 0)).toBe(false);
  });
  it('enforces progression limits and accounts for combined column stakes', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const run = play(37, 'red', 0, 100, 1000, 200, 0, 0, 20, true);
      expect(run.spins).toBe(2);
      expect(run.final).toBe(700);
      expect(run.turnover).toBe(300);
      expect(run.reason).toContain('table limit');
      expect(run.frequencies[0]).toBe(2);
      const columns = play(38, 'two-columns', 0, 100, 1000, 200, 0, 0, 1, false);
      expect(columns.final).toBe(800);
      expect(columns.turnover).toBe(200);
    } finally {
      random.mockRestore();
    }
  });
  it('keeps new calculator routes under consent-aware ads and excludes analytics', () => {
    for (const path of [
      '/calculators/casino/',
      '/calculators/casino/dice/',
      '/calculators/casino/expected-value/',
      '/calculators/casino/losing-streak/',
    ]) {
      expect(isCalculatorPage(path)).toBe(true);
      expect(isPublicAdvertisingPath(path)).toBe(true);
    }
  });
});
