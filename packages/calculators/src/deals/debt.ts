import { cell, integer, number, pct, result, rows, type Inputs } from './common';
export function debtCapacity(v: Inputs) {
  const r = result(),
    revenue = number(v, 'revenue', 0.000001),
    margin = pct(v, 'margin'),
    growth = pct(v, 'growth', -95, 300),
    years = integer(v, 'years', 1, 15),
    dep = pct(v, 'depreciation'),
    capex = pct(v, 'capex'),
    wc = pct(v, 'workingCapital'),
    reserve = pct(v, 'cashReserve'),
    openingCash = number(v, 'openingCash', 0),
    tax = pct(v, 'tax', 0, 99),
    senior = pct(v, 'seniorShare'),
    sr = pct(v, 'seniorRate'),
    jr = pct(v, 'juniorRate'),
    amort = pct(v, 'amortization'),
    sweep = pct(v, 'sweep'),
    coverageLimit = number(v, 'coverage', 0, 100),
    leverageLimit = number(v, 'leverage', 0, 100),
    existing = number(v, 'existingDebt', 0);
  const forecast = v.forecast.trim()
    ? rows(v, 'forecast', 2, years, years).map((a) => [
        cell(a[0], 'Growth', -95, 300) / 100,
        cell(a[1], 'Margin', 0, 100) / 100,
      ])
    : Array.from({ length: years }, () => [growth, margin]);
  function schedule(amount: number, growthShift = 0, rateShift = 0) {
    let sales = revenue,
      nwc = revenue * wc,
      cash = openingCash,
      s = amount * senior,
      j = amount - s,
      valid = true,
      minimumCoverage: number | null = null;
    const records: (string | number | null)[][] = [];
    for (let i = 0; i < years; i++) {
      const oldSales = sales;
      sales *= 1 + Math.max(-0.99, forecast[i][0] + growthShift);
      const ebitda = sales * forecast[i][1],
        interest = s * (sr + rateShift) + j * (jr + rateShift),
        taxes = Math.max(0, ebitda - sales * dep - interest) * tax,
        deltaWC = sales * wc - nwc;
      nwc += deltaWC;
      const cf = ebitda - interest - taxes - sales * capex - deltaWC,
        minCash = sales * reserve;
      cash += cf;
      const available = Math.max(0, cash - minCash),
        mandatory = Math.min(s, amount * senior * amort),
        required = i === years - 1 ? s + j : mandatory;
      if (available + 1e-7 < required || cash < minCash - 1e-7) valid = false;
      const payment =
          i === years - 1
            ? Math.min(available, s + j)
            : Math.min(available, mandatory + Math.max(0, available - mandatory) * sweep),
        sp = Math.min(s, payment),
        jp = Math.min(j, Math.max(0, payment - sp));
      s -= sp;
      j -= jp;
      cash -= sp + jp;
      const coverage = interest > 0 ? ebitda / interest : null;
      if (coverage !== null) {
        minimumCoverage = minimumCoverage === null ? coverage : Math.min(minimumCoverage, coverage);
        if (coverage < coverageLimit - 1e-8) valid = false;
      }
      records.push([
        i + 1,
        oldSales,
        sales,
        ebitda,
        interest,
        taxes,
        sales * capex,
        deltaWC,
        cf,
        sp,
        jp,
        cash,
        s,
        j,
        coverage,
      ]);
    }
    return { valid: valid && s + j < 1e-5, records, minimumCoverage };
  }
  function capacity(gs = 0, rs = 0) {
    let lo = 0,
      hi = revenue * margin * leverageLimit;
    if (!schedule(0, gs, rs).valid) return 0;
    for (let n = 0; n < 65; n++) {
      const mid = (lo + hi) / 2;
      if (schedule(mid, gs, rs).valid) lo = mid;
      else hi = mid;
    }
    return lo;
  }
  const amount = capacity(),
    s = schedule(amount),
    existingCase = schedule(existing);
  r.metrics = [
    {
      label: 'Supported total debt',
      value: amount,
      unit: 'M under the stated repayment/coverage/leverage constraints',
    },
    {
      label: 'Incremental headroom',
      value: Math.max(0, amount - existing),
      unit: 'M, assuming existing debt is refinanced on these terms',
    },
    { label: 'Existing debt above capacity', value: Math.max(0, existing - amount), unit: 'M' },
    {
      label: 'Minimum coverage at capacity',
      value: s.minimumCoverage,
      unit: 'x EBITDA / cash interest',
    },
    {
      label: 'Existing-debt scenario',
      value: existingCase.valid
        ? 'Meets the modeled constraints'
        : 'Does not meet the modeled constraints',
    },
  ];
  r.tables = [
    {
      title: 'Debt-capacity scenario — amounts M',
      columns: [
        'Year',
        'Opening revenue',
        'Revenue',
        'EBITDA',
        'Interest',
        'Tax',
        'Capex',
        'Change NWC',
        'Cash before principal',
        'Senior paid',
        'Junior paid',
        'Cash',
        'Senior balance',
        'Junior balance',
        'Coverage x',
      ],
      rows: s.records,
    },
    {
      title: 'Existing-debt refinancing scenario — amounts M',
      columns: [
        'Year',
        'Opening revenue',
        'Revenue',
        'EBITDA',
        'Interest',
        'Tax',
        'Capex',
        'Change NWC',
        'Cash before principal',
        'Senior paid',
        'Junior paid',
        'Cash',
        'Senior balance',
        'Junior balance',
        'Coverage x',
      ],
      rows: existingCase.records,
    },
    {
      title: 'Capacity sensitivity — growth shift / rate shift, M',
      columns: ['Growth shift (percentage points)', 'Rates unchanged', 'Rates +1pp', 'Rates +2pp'],
      rows: [-0.03, 0, 0.03].map((g) => [
        g * 100,
        capacity(g, 0),
        capacity(g, 0.01),
        capacity(g, 0.02),
      ]),
    },
  ];
  r.charts = [
    {
      title: 'Capacity debt paydown — M',
      labels: s.records.map((a) => `Year ${a[0]}`),
      series: [
        { label: 'Senior', values: s.records.map((a) => Number(a[12])) },
        { label: 'Subordinated', values: s.records.map((a) => Number(a[13])) },
      ],
    },
    {
      title: 'Cash after debt service — M',
      labels: s.records.map((a) => `Year ${a[0]}`),
      series: [{ label: 'Ending cash', values: s.records.map((a) => Number(a[11])) }],
    },
  ];
  r.notes = [
    'The solver finds the largest debt amount repaid by the end of the selected horizon while maintaining the cash reserve and user-defined coverage/leverage constraints. Residual senior and junior principal is due at maturity. No missing VBA output or hardcoded sensitivity result is reused.',
    'Interest uses opening debt. Senior amortization is a percentage of original senior principal; optional cash sweep pays senior before junior. Cash above reserve can fund the final maturity payment. Taxes have a zero floor; no loss carryforward is assumed.',
    'All amounts use one currency in millions. Capex, depreciation, NWC and cash reserve are percentages of revenue. Blank forecast rows use constant growth/margin; otherwise enter exactly one growth/margin pair per year.',
    'Existing debt is assumed refinanced into the same mix and maturity. This is scenario repayment capacity, not a lender decision or a universally safe leverage level. Null coverage means no cash interest, not a numeric infinity.',
  ];
  if (!schedule(0).valid)
    r.notes.unshift(
      'Operating cash generation does not maintain the specified reserve even with no debt. A zero capacity does not resolve that operating funding gap.',
    );
  return r;
}
