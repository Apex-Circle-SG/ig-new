import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  calculateFinancialTool,
  compareBusinessLoanScenarios,
  FINANCE_TOOLS,
  getFinanceDefaultInputs,
  type FinanceToolId,
} from './business';
const run = (id: FinanceToolId, overrides: Record<string, unknown> = {}) =>
  calculateFinancialTool(id, { ...getFinanceDefaultInputs(id), ...overrides });
describe('financial tool contracts', () => {
  for (const tool of FINANCE_TOOLS) {
    it(`${tool.id} has a deterministic, finite worked example`, () => {
      const before = structuredClone(tool.defaultInputs);
      const result = calculateFinancialTool(tool.id, before);
      expect(result).toEqual(calculateFinancialTool(tool.id, before));
      expect(before).toEqual(tool.defaultInputs);
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.rows.length).toBeGreaterThan(2);
      for (const value of Object.values(result.values))
        expect(value === null || Number.isFinite(value)).toBe(true);
    });
    it(`${tool.id} rejects missing and unexpected inputs`, () => {
      expect(() => calculateFinancialTool(tool.id, {})).toThrow();
      expect(() => run(tool.id, { accountSecret: 'not accepted' })).toThrow();
      const field = tool.fields.find((field) => field.type === 'number')!;
      for (const value of [NaN, Infinity, -Infinity, '100', null])
        expect(() => run(tool.id, { [field.key]: value })).toThrow();
    });
  }
  it('rejects unknown tools', () =>
    expect(() => calculateFinancialTool('unknown', {})).toThrow('Unknown'));
});
describe('AI workflow ROI', () => {
  it('includes human review, recurring costs and setup', () => {
    const { values } = run('ai-workflow-roi');
    expect(values.hoursSaved).toBe(25);
    expect(values.monthlyNetValue).toBe(850);
    expect(values.firstYearNetValue).toBe(9700);
    expect(values.firstYearRoi).toBeCloseTo(421.7391304);
    expect(values.paybackMonths).toBeCloseTo(500 / 850);
  });
  it('does not invent payback for negative savings or ROI for zero costs', () => {
    expect(run('ai-workflow-roi', { minutesAfter: 40 }).values.paybackMonths).toBeNull();
    expect(
      run('ai-workflow-roi', { monthlySoftwareCost: 0, setupCost: 0 }).values.firstYearRoi,
    ).toBeNull();
    expect(run('ai-workflow-roi', { tasksPerMonth: 0 }).values.hoursSaved).toBe(0);
  });
  it('more review never increases capacity value', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (reviewMinutes) => {
        expect(
          run('ai-workflow-roi', { reviewMinutes: reviewMinutes + 1 }).values.monthlyNetValue!,
        ).toBeLessThanOrEqual(run('ai-workflow-roi', { reviewMinutes }).values.monthlyNetValue!);
      }),
    ));
});
describe('cash runway', () => {
  it('deducts reserve and immediate costs before calculating runway', () => {
    expect(run('cash-runway').values).toEqual({
      startingCash: 95000,
      spendableCash: 85000,
      monthlyBurn: 10000,
      runwayMonths: 8.5,
    });
  });
  it('handles zero burn, positive cash flow and an already depleted reserve', () => {
    expect(run('cash-runway', { monthlyExpenses: 20000 }).values.runwayMonths).toBeNull();
    expect(run('cash-runway', { monthlyExpenses: 10000 }).values.runwayMonths).toBeNull();
    expect(run('cash-runway', { cashBalance: 0 }).values.runwayMonths).toBe(0);
  });
  it('additional cash increases runway by cash divided by burn', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000000 }), (added) => {
        expect(run('cash-runway', { cashBalance: 100000 + added }).values.runwayMonths).toBeCloseTo(
          8.5 + added / 10000,
          8,
        );
      }),
    ));
});
describe('break-even', () => {
  it('rounds sales targets upward and includes target profit', () => {
    const result = run('break-even', { targetProfit: 2000 });
    expect(result.values.breakEvenUnits).toBeCloseTo(166.6666667);
    expect(result.values.wholeUnits).toBe(167);
    expect(result.values.targetUnits).toBe(200);
  });
  it('does not add a whole unit due only to decimal floating-point noise', () => {
    expect(
      run('break-even', { fixedCosts: 100, unitPrice: 0.3, variableCost: 0.1 }).values.wholeUnits,
    ).toBe(500);
  });
  it('handles no contribution and no fixed costs explicitly', () => {
    expect(run('break-even', { variableCost: 100 }).values.wholeUnits).toBeNull();
    expect(run('break-even', { variableCost: 110 }).values.targetUnits).toBeNull();
    expect(run('break-even', { fixedCosts: 0 }).values.wholeUnits).toBe(0);
    expect(() => run('break-even', { unitPrice: 0 })).toThrow();
  });
  it('whole units cover fixed costs while one fewer falls short', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        fc.integer({ min: 1, max: 1000 }),
        (fixedCosts, contribution) => {
          const units = run('break-even', {
            fixedCosts,
            unitPrice: contribution + 10,
            variableCost: 10,
          }).values.wholeUnits!;
          expect(units * contribution).toBeGreaterThanOrEqual(fixedCosts);
          expect((units - 1) * contribution).toBeLessThan(fixedCosts);
        },
      ),
    ));
});
describe('business loan', () => {
  it('matches a known fixed-payment example', () => {
    const result = run('business-loan');
    expect(result.values.monthlyPayment).toBeCloseTo(2027.63942884, 6);
    expect(result.values.totalInterest).toBeCloseTo(21658.36573048, 5);
    expect(result.schedule!.rows.at(-1)!.balance).toBe(0);
  });
  it('handles zero and near-zero rates and a one-month loan', () => {
    expect(
      run('business-loan', { principal: 12000, annualRate: 0, termMonths: 12 }).values
        .monthlyPayment,
    ).toBe(1000);
    expect(
      run('business-loan', { principal: 12000, annualRate: 1e-12, termMonths: 12 }).values
        .monthlyPayment,
    ).toBeCloseTo(1000, 7);
    expect(
      run('business-loan', { principal: 1200, annualRate: 12, termMonths: 1 }).values
        .monthlyPayment,
    ).toBeCloseTo(1212, 8);
    expect(() => run('business-loan', { termMonths: 0 })).toThrow();
    expect(() => run('business-loan', { termMonths: 12.5 })).toThrow();
  });
  it('keeps amortization stable at the supported high-rate and long-term bounds', () => {
    const result = run('business-loan', { principal: 100000, annualRate: 1000, termMonths: 600 });
    expect(result.values.totalInterest).toBeCloseTo(
      result.values.monthlyPayment! * 600 - 100000,
      4,
    );
    expect(result.schedule!.rows.at(-1)!.balance).toBe(0);
    expect(result.schedule!.rows.at(-1)!.payment).toBeCloseTo(result.values.monthlyPayment!, 4);
  });
  it('fees add cost but do not alter scheduled payment', () => {
    const base = run('business-loan');
    const fees = run('business-loan', { upfrontFee: 3000 });
    expect(fees.values.monthlyPayment).toBe(base.values.monthlyPayment);
    expect(fees.values.totalBorrowingCost! - base.values.totalBorrowingCost!).toBeCloseTo(3000);
  });
  it('extra payments reduce term and never increase total interest', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (extraMonthlyPayment) => {
        const result = run('business-loan', { extraMonthlyPayment });
        expect(result.values.payoffMonths!).toBeLessThanOrEqual(60);
        expect(result.values.totalInterest!).toBeLessThanOrEqual(
          run('business-loan').values.totalInterest!,
        );
        expect(result.schedule!.rows.reduce((total, row) => total + row.principal!, 0)).toBeCloseTo(
          100000,
          5,
        );
      }),
    ));
  it('balances close and principal is conserved over varied terms', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000000 }),
        fc.integer({ min: 0, max: 40 }),
        fc.integer({ min: 1, max: 360 }),
        (principal, annualRate, termMonths) => {
          const result = run('business-loan', { principal, annualRate, termMonths });
          expect(result.schedule!.rows.at(-1)!.balance).toBe(0);
          expect(
            result.schedule!.rows.reduce((total, row) => total + row.principal!, 0),
          ).toBeCloseTo(principal, 4);
          expect(result.values.totalInterest!).toBeGreaterThanOrEqual(0);
        },
      ),
    ));
});
describe('business loan comparisons', () => {
  const kept = {
    principal: 12000,
    annualRate: 0,
    termMonths: 12,
    upfrontFee: 100,
    extraMonthlyPayment: 0,
  };
  it('shows a lower monthly payment alongside higher fee-inclusive cost and longer payoff', () => {
    const comparison = compareBusinessLoanScenarios(kept, {
      ...kept,
      termMonths: 24,
      upfrontFee: 250,
    });
    const metric = (key: string) => comparison.rows.find((row) => row.key === key)!;
    expect(metric('monthlyPayment')).toMatchObject({ baseline: 1000, current: 500, delta: -500 });
    expect(metric('totalBorrowingCost')).toMatchObject({ baseline: 100, current: 250, delta: 150 });
    expect(metric('payoffMonths')).toMatchObject({ baseline: 12, current: 24, delta: 12 });
    expect(comparison.schedule.rows).toHaveLength(24);
    expect(comparison.schedule.rows[12]).toMatchObject({
      month: 13,
      baselinePayment: 0,
      baselineBalance: 0,
    });
    expect(comparison.schedule.rows[12].currentPayment).toBeCloseTo(500);
    expect(comparison.schedule.rows[12].currentBalance).toBeCloseTo(5500);
    expect(comparison.schedule.rows.at(-1)).toMatchObject({
      baselineBalance: 0,
      currentBalance: 0,
    });
  });
  it('validates both scenarios and owns independent copies of their inputs', () => {
    expect(() => compareBusinessLoanScenarios({ ...kept, principal: 0 }, kept)).toThrow();
    expect(() => compareBusinessLoanScenarios(kept, { ...kept, termMonths: 0 })).toThrow();
    const initial = { ...kept };
    const comparison = compareBusinessLoanScenarios(initial, initial);
    expect(initial).toEqual(kept);
    expect(comparison.rows.every((row) => row.delta === 0)).toBe(true);
    comparison.baselineInputs.principal = 1;
    expect(initial).toEqual(kept);
    expect(comparison.currentInputs.principal).toBe(12000);
  });
  it('aligns early payoff and reverses delta signs when scenarios swap', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10000 }), (extraMonthlyPayment) => {
        const current = { ...kept, annualRate: 8, extraMonthlyPayment };
        const forward = compareBusinessLoanScenarios(kept, current);
        const reverse = compareBusinessLoanScenarios(current, kept);
        forward.rows.forEach((row, index) => {
          expect(row.delta).toBeCloseTo(-reverse.rows[index].delta, 8);
        });
        for (
          let month = forward.current.values.payoffMonths!;
          month < forward.schedule.rows.length;
          month++
        ) {
          expect(forward.schedule.rows[month].currentPayment).toBe(0);
          expect(forward.schedule.rows[month].currentBalance).toBe(0);
        }
      }),
    ));
});
describe('drawdown recovery', () => {
  it('a 50% loss needs a 100% gain', () => {
    const result = run('drawdown-recovery', { lossPercent: 50, annualReturn: 10 });
    expect(result.values.remainingValue).toBe(5000);
    expect(result.values.requiredGain).toBe(100);
    expect(result.values.recoveryYears).toBeCloseTo(Math.log(2) / Math.log(1.1));
  });
  it('handles zero loss, total loss and nonpositive growth', () => {
    expect(run('drawdown-recovery', { lossPercent: 0, annualReturn: 0 }).values.recoveryYears).toBe(
      0,
    );
    expect(run('drawdown-recovery', { lossPercent: 100 }).values.requiredGain).toBeNull();
    expect(run('drawdown-recovery', { annualReturn: -5 }).values.recoveryYears).toBeNull();
    expect(run('drawdown-recovery', { annualReturn: 0 }).values.recoveryYears).toBeNull();
    expect(() => run('drawdown-recovery', { lossPercent: 101 })).toThrow();
  });
  it('applying the recovery gain restores the starting value', () =>
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9999 }), (basisPoints) => {
        const result = run('drawdown-recovery', { lossPercent: basisPoints / 100 });
        expect(result.values.remainingValue! * (1 + result.values.requiredGain! / 100)).toBeCloseTo(
          10000,
          6,
        );
      }),
    ));
});
describe('portfolio concentration', () => {
  it('calculates weights, index and isolated shock from values', () => {
    const { values } = run('portfolio-concentration');
    expect(values.largestWeight).toBe(50);
    expect(values.concentrationIndex).toBe(3800);
    expect(values.effectivePositions).toBeCloseTo(1 / 0.38);
    expect(values.illustratedLossPercent).toBe(10);
    expect(values.illustratedLossValue).toBe(1000);
  });
  it('handles one holding and rejects zero/negative or unbounded portfolios', () => {
    expect(run('portfolio-concentration', { holdings: [10] }).values.effectivePositions).toBe(1);
    for (const holdings of [[], [0, 0], [-1, 10], new Array(101).fill(1)])
      expect(() => run('portfolio-concentration', { holdings })).toThrow();
  });
  it('equal holdings have an effective position count equal to funded positions', () =>
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), (count) => {
        const result = run('portfolio-concentration', { holdings: new Array(count).fill(100) });
        expect(result.values.effectivePositions).toBeCloseTo(count, 8);
        expect(result.schedule!.rows.reduce((total, row) => total + row.weight!, 0)).toBeCloseTo(
          100,
          8,
        );
      }),
    ));
  it('scaling all values leaves concentration unchanged', () =>
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: 1, maxLength: 30 }),
        (holdings) => {
          expect(
            run('portfolio-concentration', { holdings }).values.concentrationIndex,
          ).toBeCloseTo(
            run('portfolio-concentration', { holdings: holdings.map((value) => value * 10) }).values
              .concentrationIndex!,
            8,
          );
        },
      ),
    ));
});
