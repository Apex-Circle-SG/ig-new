import { describe, expect, it } from 'vitest';
import {
  calculateDeal,
  formatDealValue,
  csv,
  csvExport,
  defaults,
  DEAL_TOOLS,
  getDealTool,
  irr,
  npv,
  type Inputs,
} from './index';
const run = (id: string, changes: Inputs = {}) =>
  calculateDeal(id, { ...defaults(getDealTool(id)!), ...changes });
const metric = (r: ReturnType<typeof run>, label: string) =>
  r.metrics.find((m) => m.label === label)!.value;
const table = (r: ReturnType<typeof run>, title: string) =>
  r.tables.find((t) => t.title === title)!;
describe('independent financial model checks', () => {
  it('shows tiny numeric residuals without stretching metric cards', () => {
    expect(formatDealValue(2.84e-14)).toBe('2.84E-14');
    expect(formatDealValue(0)).toBe('0');
  });
  it('computes a cash acquisition by hand, reconciles funding and identifies breakeven synergy', () => {
    const r = run('acquisition-impact', {
      buyerShares: '100',
      buyerPrice: '10',
      targetShares: '10',
      targetOptions: '0',
      offerPrice: '10',
      fx: '1',
      cashConsideration: '100',
      cashAvailable: '0',
      fees: '0',
      debtRate: '10',
      tax: '0',
      synergies: '0',
      amortization: '0',
      earnings: '1,100,20,100',
      firstYearMonths: '12',
    });
    expect(metric(r, 'Pro forma EPS — first year')).toBeCloseTo(1.1, 10);
    expect(metric(r, 'EPS change')).toBeCloseTo(10, 10);
    expect(table(r, 'Sources and uses — base currency M').rows.at(-1)![1]).toBeCloseTo(0, 10);
    const losing = run('acquisition-impact', {
      buyerShares: '100',
      buyerPrice: '10',
      targetShares: '10',
      targetOptions: '0',
      offerPrice: '10',
      fx: '1',
      cashConsideration: '0',
      cashAvailable: '0',
      fees: '0',
      debtRate: '0',
      tax: '0',
      synergies: '0',
      amortization: '0',
      earnings: '1,100,5,100',
      firstYearMonths: '12',
    });
    expect(metric(losing, 'Break-even annual pre-tax synergies')).toBeCloseTo(5, 10);
    const rampInputs = {
      ...defaults(getDealTool('acquisition-impact')!),
      earnings: '1,100,5,50',
      tax: '0',
      amortization: '0',
      fees: '0',
      cashConsideration: '0',
      buyerPrice: '10',
      buyerShares: '100',
      targetShares: '10',
      offerPrice: '10',
      fx: '1',
    };
    expect(
      metric(
        calculateDeal('acquisition-impact', rampInputs),
        'Break-even annual pre-tax synergies',
      ),
    ).toBeCloseTo(10, 8);
    expect(metric(run('acquisition-impact', { earnings: '1,0,1,100' }), 'EPS change')).toBeNull();
  });
  it('solves cash repayment at zero interest and exposes operating funding deficits', () => {
    const r = run('debt-capacity', {
      revenue: '100',
      margin: '20',
      growth: '0',
      years: '2',
      depreciation: '0',
      capex: '0',
      workingCapital: '0',
      cashReserve: '0',
      openingCash: '0',
      tax: '0',
      seniorShare: '100',
      seniorRate: '0',
      juniorRate: '0',
      amortization: '0',
      sweep: '100',
      leverage: '100',
      forecast: '',
    });
    expect(metric(r, 'Supported total debt')).toBeCloseTo(40, 5);
    const rows = table(r, 'Debt-capacity scenario — amounts M').rows;
    expect(Number(rows.at(-1)![12]) + Number(rows.at(-1)![13])).toBeCloseTo(0, 5);
    expect(
      metric(
        run('debt-capacity', { margin: '0', capex: '20', openingCash: '0' }),
        'Supported total debt',
      ),
    ).toBe(0);
  });
  it('links all LBO statements for interest conventions, recapitalizations, debt and preference variants', () => {
    for (const interestBasis of ['beginning', 'average', 'ending'])
      for (const mode of ['lbo', 'recap'])
        for (const preferredMode of ['cash', 'pik']) {
          const r = run('lbo-recapitalization', {
            interestBasis,
            mode,
            preferredMode,
            recapDistribution: '200',
            preferred: '10',
            preferredRate: '6',
            halfYear: 'yes',
            intangibleLife: '3',
            assetLife: '2',
            capexLife: '2',
          });
          expect(Number(metric(r, 'Largest absolute balance-sheet check'))).toBeLessThan(1e-8);
          const debt = table(r, 'Debt repayment priority — M');
          for (const row of debt.rows)
            expect(Number(row[2]) - Number(row[3]) - Number(row[4])).toBeCloseTo(0, 8);
          const balance = table(r, 'Balance sheet — M');
          expect(balance.rows.every((row) => Number(row[4]) >= -1e-8)).toBe(true);
          const cfs = table(r, 'Cash-flow statement — M');
          for (const row of cfs.rows)
            expect(
              Number(row[1]) +
                Number(row[6]) +
                Number(row[7]) +
                Number(row[8]) +
                Number(row[9]) +
                Number(row[10]),
            ).toBeCloseTo(Number(row[11]), 8);
        }
  });
  it('withholds returns for unfunded LBO shortfalls and distinguishes no management cash', () => {
    const r = run('lbo-recapitalization', { forecast: '0,-50,100\n0,-50,100', revolverLimit: '0' });
    expect(Number(metric(r, 'Unfunded cash shortfalls'))).toBeGreaterThan(0);
    expect(metric(r, 'Sponsor IRR')).toBeNull();
    expect(metric(r, 'Sponsor MOIC')).toBeNull();
    expect(
      metric(run('lbo-recapitalization', { managementCash: '0' }), 'Management cash IRR'),
    ).toBeNull();
  });
  it('discounts a simple perpetuity, bridges equity and leaves nonconventional IRR undefined', () => {
    const r = run('valuation-workbench', {
      rateMode: 'direct',
      discountRate: '10',
      terminalMode: 'growth',
      terminalGrowth: '0',
      flowMode: 'direct',
      cashflows: '0,0,0,0,10,10,0',
      debt: '30',
      cash: '5',
      minority: '0',
      nonoperating: '0',
      shares: '10',
    });
    expect(metric(r, 'Enterprise value')).toBeCloseTo(100, 8);
    expect(metric(r, 'Equity value')).toBeCloseTo(75, 8);
    expect(metric(r, 'Equity value per diluted share')).toBeCloseTo(7.5, 8);
    expect(irr([-100, 0, 121])).toBeCloseTo(0.1, 10);
    expect(irr([-100, 230, -132])).toBeNull();
    expect(npv(0, [-100, 120], 0)).toBe(20);
    expect(() => run('valuation-workbench', { discountRate: '2', terminalGrowth: '2' })).toThrow();
  });
  it('separates retention, cumulative ARPA, equity dilution, revenue and cash proxies', () => {
    const r = run('saas-scale', {
      arr: '10',
      cash: '0',
      arpa: '10000',
      growthMode: 'retention',
      revenueBasis: 'ending',
      forecast: '0,2,10,5,5,20,10,5,1,10\n0,0,0,0,0,20,10,0,1,20',
    });
    const rows = r.tables[0].rows;
    expect(rows[0][2]).toBeCloseTo(12);
    expect(rows[0][4]).toBeCloseTo(100);
    expect(rows[1][8]).toBeCloseTo(13200);
    expect(rows[0][15]).toBeCloseTo((12 / 17) * 100);
    expect(rows[1][16]).toBeCloseTo(7.4);
  });
  it('weights all observations, normalizes volume, honors bucket boundaries and marks unknown turnover', () => {
    const r = run('vwap-volume', {
      observations:
        'Date,Price,Volume\n2024-01-01,10,100\n2024-01-02,12,200\n2024-01-03,11,100\n2024-01-04,100,0',
      sharesOutstanding: '',
      volumeMultiplier: '1000',
      buckets: '2',
      rangeStart: '10',
      bucketWidth: '1',
    });
    expect(metric(r, 'Selected-window volume-weighted price proxy')).toBeCloseTo(11.25);
    expect(metric(r, 'Total raw shares / volume units')).toBe(400000);
    expect(metric(r, 'Share-capital turnover')).toBeNull();
    const bins = table(r, 'Selected-window price-volume distribution').rows;
    expect(bins[0][2]).toBe(100000);
    expect(bins[1][2]).toBe(300000);
    expect(() => run('vwap-volume', { observations: '2024-02-30T12:00:00Z,10,1' })).toThrow();
    expect(() => run('vwap-volume', { observations: '2024-01-01,10,0' })).toThrow();
  });
  it('rejects malformed inputs and safely exports user-controlled spreadsheet cells', () => {
    expect(csv('"a,b",2\n"multi\nline",3')).toEqual([
      ['a,b', '2'],
      ['multi\nline', '3'],
    ]);
    expect(() => csv('"bad"tail,1')).toThrow();
    expect(() => csv('"unfinished')).toThrow();
    expect(
      csvExport({ title: 'x', columns: ['A'], rows: [['=1+2'], [-5], ['@SUM(A1)']] }),
    ).toContain('"\'=1+2"');
    expect(csvExport({ title: 'x', columns: ['A'], rows: [['  =1+2'], ['\n@SUM(A1)']] })).toContain(
      '"\'  =1+2"',
    );
    expect(() => run('acquisition-impact', { buyerShares: 'Infinity' })).toThrow();
    expect(() => calculateDeal('unknown', {})).toThrow();
    for (const tool of DEAL_TOOLS.filter((t) => t.kind === 'calculator'))
      expect(run(tool.id).metrics.length).toBeGreaterThan(0);
  });
});
