import { cell, number, pct, result, rows, type Inputs } from './common';
export function acquisition(v: Inputs) {
  const r = result(),
    buyerShares = number(v, 'buyerShares', 0.000001),
    targetBasic = number(v, 'targetShares', 0.000001),
    options = number(v, 'targetOptions', 0),
    exercise = number(v, 'exercisePrice', 0),
    fx = number(v, 'fx', 0.000001),
    offer = number(v, 'offerPrice', 0.000001),
    buyerPrice = number(v, 'buyerPrice', 0.000001),
    unaffected = number(v, 'unaffectedPrice', 0.000001),
    cashShare = pct(v, 'cashConsideration'),
    cashAvailable = number(v, 'cashAvailable', 0),
    fees = number(v, 'fees', 0),
    debtRate = pct(v, 'debtRate'),
    cashRate = pct(v, 'cashRate'),
    tax = pct(v, 'tax', 0, 99),
    synergy = number(v, 'synergies', 0),
    amort = number(v, 'amortization', 0),
    months = number(v, 'firstYearMonths', 0, 12),
    buyerDebt = number(v, 'buyerNetDebt'),
    targetDebt = number(v, 'targetNetDebt'),
    ebitda = number(v, 'combinedEbitda', 0);
  const forecasts = rows(v, 'earnings', 4, 1, 10).map((row) => ({
    year: row[0],
    buyer: cell(row[1], 'Buyer earnings'),
    target: cell(row[2], 'Target earnings'),
    ramp: cell(row[3], 'Synergy ramp', 0, 100) / 100,
  }));
  function scenario(price: number, cashPct: number, year = 0) {
    const diluted = targetBasic + options * Math.max(0, 1 - exercise / price),
      equityPrice = diluted * price * fx,
      stock = equityPrice * (1 - cashPct),
      cashNeed = equityPrice * cashPct + fees,
      cashUsed = Math.min(cashAvailable, cashNeed),
      newDebt = cashNeed - cashUsed,
      issued = stock / buyerPrice,
      fraction = year === 0 ? months / 12 : 1,
      f = forecasts[year];
    const operatingAdjustment = (synergy * f.ramp - amort) * (1 - tax),
      financing = (newDebt * debtRate + cashUsed * cashRate) * (1 - tax),
      pfIncome =
        f.buyer +
        (f.target * fx + operatingAdjustment - financing) * fraction -
        (year === 0 ? fees : 0),
      pfShares = buyerShares + issued * fraction,
      eps = pfIncome / pfShares,
      standalone = f.buyer / buyerShares;
    const required =
      fraction > 0 && f.ramp > 0
        ? Math.max(
            0,
            ((standalone * pfShares - f.buyer + (year === 0 ? fees : 0)) / fraction -
              f.target * fx +
              financing) /
              (1 - tax) +
              amort,
          ) / f.ramp
        : null;
    return {
      equityPrice,
      stock,
      cashUsed,
      newDebt,
      issued,
      eps,
      standalone,
      absolute: eps - standalone,
      relative: standalone > 0 ? (eps / standalone - 1) * 100 : null,
      pfIncome,
      pfShares,
      required,
    };
  }
  const s = scenario(offer, cashShare),
    endShares = buyerShares + s.issued,
    netDebt = buyerDebt + targetDebt * fx + s.newDebt + s.cashUsed;
  r.metrics = [
    { label: 'Pro forma EPS — first year', value: s.eps, unit: 'base currency / share' },
    { label: 'EPS change', value: s.relative, unit: '%' },
    { label: 'Absolute EPS change', value: s.absolute },
    { label: 'Offer premium', value: (offer / unaffected - 1) * 100, unit: '%' },
    { label: 'New shares issued', value: s.issued, unit: 'million' },
    {
      label: 'Break-even annual pre-tax synergies',
      value: s.required,
      unit: 'base currency M at the stated first-year assumptions',
    },
    {
      label: 'Pro forma net debt / EBITDA',
      value: ebitda > 0 ? netDebt / ebitda : null,
      unit: 'x (EBITDA input includes realized synergies)',
    },
  ];
  r.tables.push(
    {
      title: 'Sources and uses — base currency M',
      columns: ['Item', 'Amount'],
      rows: [
        ['Equity consideration', s.equityPrice],
        ['Transaction fees (expensed at close)', fees],
        ['Total uses', s.equityPrice + fees],
        ['Buyer cash used', s.cashUsed],
        ['New debt', s.newDebt],
        ['Buyer shares delivered, market value', s.stock],
        ['Sources less uses', s.cashUsed + s.newDebt + s.stock - s.equityPrice - fees],
      ],
    },
    {
      title: 'Earnings and weighted shares',
      columns: [
        'Year',
        'Buyer standalone EPS',
        'Pro forma earnings M',
        'Weighted shares M',
        'Pro forma EPS',
        'EPS change %',
      ],
      rows: forecasts.map((f, i) => {
        const x = scenario(offer, cashShare, i);
        return [f.year, x.standalone, x.pfIncome, x.pfShares, x.eps, x.relative];
      }),
    },
    {
      title: 'Post-close ownership',
      columns: ['Group', 'Shares M', 'Ownership %'],
      rows: [
        ['Existing buyer holders', buyerShares, (buyerShares / endShares) * 100],
        ['Stock consideration recipients', s.issued, (s.issued / endShares) * 100],
      ],
    },
  );
  const prices = [0.8, 0.9, 1, 1.1, 1.2].map((x) => offer * x);
  r.tables.push({
    title: 'First-year EPS change %: offer price × cash consideration',
    columns: ['Cash consideration %', ...prices.map((p) => p.toFixed(2))],
    rows: [0, 0.25, 0.5, 0.75, 1].map((c) => [
      c * 100,
      ...prices.map((p) => scenario(p, c).relative),
    ]),
  });
  r.charts.push(
    {
      title: 'EPS by period',
      labels: forecasts.map((f) => f.year),
      series: [
        {
          label: 'Standalone',
          values: forecasts.map((_, i) => scenario(offer, cashShare, i).standalone),
        },
        { label: 'Pro forma', values: forecasts.map((_, i) => scenario(offer, cashShare, i).eps) },
      ],
    },
    {
      title: 'Funding — base currency M',
      labels: ['Buyer cash', 'New debt', 'Stock'],
      series: [{ label: 'Amount', values: [s.cashUsed, s.newDebt, s.stock] }],
    },
  );
  r.notes = [
    'All earnings, shares and monetary amounts use millions; share prices use currency per share. FX is buyer/base currency per unit of target currency. Buyer earnings are full-year; first-year target earnings, financing and operating adjustments are prorated.',
    'Options use a treasury-stock equivalent at the offer price. Buyer shares are already fully diluted. Fees are funded with cash/debt and expensed once without an assumed tax deduction; acquisition amortization and synergies receive the stated tax treatment.',
    'Funding, rates and share counts remain constant after close; use the debt/LBO models for changing debt balances. Enter combined EBITDA in base currency including only the synergies you intend to recognize.',
    'EPS accretion does not establish value creation. Percentage accretion is not reported for zero/negative standalone EPS; inspect the absolute change. The break-even figure is an annual pre-tax amount at the first-year assumptions, not a verified attainable saving. The break-even run rate includes the entered realization ramp; no break-even figure is reported at a zero ramp.',
  ];
  return r;
}
