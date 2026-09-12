import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { incomeDistributionSchema, type IncomeDistribution } from '@insightginie/schema';
import { calculateIndividualIncomePercentile } from './index';

const calculatedAt = '2026-09-12T00:00:00.000Z';
const live = getIndividualIncomeDistribution()!;
// A deliberately tiny synthetic distribution is used ONLY for mathematical tests.
const fixture: IncomeDistribution = {
  ...live,
  total: 100,
  sourceReportedTotal: 100,
  brackets: [
    { lower: null, upper: 2500, count: 10, label: 'Under $2,500' },
    { lower: 2500, upper: 5000, count: 20, label: '$2,500 to $4,999' },
    { lower: 5000, upper: 10000, count: 40, label: '$5,000 to $9,999' },
    { lower: 10000, upper: null, count: 30, label: '$10,000 and over' },
  ],
};
const run = (annualIncome: number, distribution: IncomeDistribution | null = fixture) =>
  calculateIndividualIncomePercentile({ annualIncome }, { distribution, calculatedAt });

describe('individual income percentile mathematics', () => {
  it('matches an independently calculated closed-bin example', () => {
    const output = run(3750);
    expect(output.status).toBe('available');
    expect(output.result?.percentile).toBe(20); // 10 below + half of the 20-person bin.
    expect(output.result?.percentileRange).toEqual({ lower: 10, upper: 30 });
  });
  it('puts exact boundaries in the next lower-inclusive bracket', () => {
    expect(run(2500).result?.percentile).toBe(10);
    expect(run(5000).result?.percentile).toBe(30);
    expect(run(5000).result?.bracket.lower).toBe(5000);
    expect(run(9999.99).result?.percentile).toBeCloseTo(69.99992);
  });
  it('does not invent ranks in either open tail, including zero income and losses', () => {
    for (const value of [-1_000_000_000, -500, 0, 2499.99]) {
      expect(run(value).result).toMatchObject({
        percentile: null,
        precision: 'range',
        percentileRange: { lower: 0, upper: 10 },
      });
    }
    for (const value of [10000, 100000, 1_000_000_000]) {
      expect(run(value).result).toMatchObject({
        percentile: null,
        precision: 'range',
        percentileRange: { lower: 70, upper: 100 },
      });
    }
  });
  it('returns the same estimate for ties without pretending exact tie ranks are known', () => {
    expect(run(6000)).toEqual(run(6000));
    expect(run(6000).result?.percentile).toBe(38);
  });
  it('handles empty brackets without dividing by their counts', () => {
    const sparse = {
      ...fixture,
      brackets: fixture.brackets.map((bin, index) => ({ ...bin, count: [10, 0, 60, 30][index] })),
    };
    expect(run(3750, sparse).result?.percentile).toBe(10);
  });
  it.each([NaN, Infinity, -Infinity, 1_000_000_001, -1_000_000_001])(
    'rejects invalid income %s',
    (value) => {
      expect(() => run(value)).toThrow();
    },
  );
  it('rejects strings, missing fields, and extra fields instead of coercing blanks to zero', () => {
    for (const value of [
      { annualIncome: '' },
      {},
      { annualIncome: '50000' },
      { annualIncome: 50000, age: 30 },
    ]) {
      expect(() =>
        calculateIndividualIncomePercentile(value as never, {
          distribution: fixture,
          calculatedAt,
        }),
      ).toThrow();
    }
  });
  it('does not call a clock or mutate the supplied distribution', () => {
    const before = structuredClone(fixture);
    expect(run(3750).calculatedAt).toBe(calculatedAt);
    expect(fixture).toEqual(before);
    expect(() =>
      calculateIndividualIncomePercentile(
        { annualIncome: 3750 },
        { distribution: fixture, calculatedAt: 'bad-date' },
      ),
    ).toThrow();
  });
  it('satisfies monotonicity, bound containment, and chart totals for arbitrary incomes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 250000, max: 999999 }),
        fc.integer({ min: 250000, max: 999999 }),
        (a, b) => {
          const low = run(Math.min(a, b) / 100).result!;
          const high = run(Math.max(a, b) / 100).result!;
          expect(low.percentile!).toBeLessThanOrEqual(high.percentile!);
          expect(low.percentile!).toBeGreaterThanOrEqual(low.percentileRange.lower);
          expect(low.percentile!).toBeLessThanOrEqual(low.percentileRange.upper);
        },
      ),
      { numRuns: 500 },
    );
    expect(run(3750).chartData.reduce((sum, row) => sum + row.share, 0)).toBe(100);
    expect(run(3750).chartData.at(-1)?.cumulativeShare).toBe(100);
  });
});

describe('dataset correctness and honest unavailable states', () => {
  it('ships only a real validated Census snapshot, with full provenance', () => {
    expect(live).not.toBeNull();
    expect(live.datasetVersion.sourceName).toContain('Census');
    expect(live.datasetVersion.year).toBe(2024);
    expect(live.datasetVersion.surveyYear).toBe(2025);
    expect(live.brackets).toHaveLength(44);
    expect(live.sourceReportedTotal).toBe(278_300_000);
    expect(live.brackets[0].count).toBe(44_290_000);
    expect(live.brackets.at(-1)?.count).toBe(7_021_000);
  });
  it('returns an unavailable result for missing, corrupt, or unvalidated data', () => {
    expect(run(50000, null)).toMatchObject({
      status: 'data-unavailable',
      result: null,
      datasetVersion: null,
      chartData: [],
    });
    expect(run(50000, { ...fixture, total: 99 }).status).toBe('data-unavailable');
    expect(run(50000, { ...fixture, measure: 'household-total-money-income' }).status).toBe(
      'data-unavailable',
    );
    expect(
      run(50000, {
        ...fixture,
        datasetVersion: { ...fixture.datasetVersion, validationStatus: 'pending' },
      }).status,
    ).toBe('data-unavailable');
  });
  it('rejects duplicates, gaps, invalid counts, and provenance mismatches', () => {
    const duplicate = {
      ...fixture,
      brackets: [
        fixture.brackets[0],
        fixture.brackets[1],
        fixture.brackets[1],
        fixture.brackets[3],
      ],
    };
    expect(incomeDistributionSchema.safeParse(duplicate).success).toBe(false);
    expect(
      incomeDistributionSchema.safeParse({ ...fixture, universe: 'Wrong universe' }).success,
    ).toBe(false);
    expect(
      incomeDistributionSchema.safeParse({
        ...fixture,
        brackets: fixture.brackets.map((bin, index) => (index === 1 ? { ...bin, count: -1 } : bin)),
      }).success,
    ).toBe(false);
  });
  it('normalizes actual published rounded counts and yields plausible known thresholds', () => {
    const result = run(75000, live);
    // No interpolated mass is added at an exact lower bracket boundary.
    const below = live.brackets
      .filter((bin) => bin.upper !== null && bin.upper <= 75000)
      .reduce((sum, bin) => sum + bin.count, 0);
    expect(result.result?.percentile).toBeCloseTo((below / live.total) * 100, 12);
    expect(result.result?.percentile).toBeGreaterThan(70);
    expect(result.result?.percentile).toBeLessThan(85);
    expect(run(300000, live).result?.precision).toBe('range');
  });
  it('returns fresh dataset values so consumers cannot corrupt the shared snapshot', () => {
    const first = getIndividualIncomeDistribution()!;
    first.brackets[0].count = -1;
    expect(getIndividualIncomeDistribution()?.brackets[0].count).toBe(44_290_000);
  });
});
