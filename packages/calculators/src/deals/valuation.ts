import { cell, choice, irr, npv, number, pct, result, rows, type Inputs } from './common';
export function valuation(v: Inputs) {
  const r = result(),
    tax = pct(v, 'tax', 0, 99),
    rf = pct(v, 'riskFree', -20, 50),
    beta = number(v, 'beta', -5, 10),
    premium = pct(v, 'marketPremium', 0, 50),
    costDebt = pct(v, 'costDebt'),
    debtWeight = pct(v, 'debtWeight'),
    ke = rf + beta * premium,
    wacc = ke * (1 - debtWeight) + costDebt * (1 - tax) * debtWeight,
    rate =
      choice(v, 'rateMode', ['direct', 'wacc']) === 'wacc'
        ? wacc
        : pct(v, 'discountRate', -90, 100),
    g = pct(v, 'terminalGrowth', -90, 50),
    terminalMultiple = number(v, 'terminalMultiple', 0, 100),
    terminalMode = choice(v, 'terminalMode', ['growth', 'multiple']);
  if (rate <= -0.9 || (terminalMode === 'growth' && rate <= g))
    throw Error(
      'The perpetuity terminal method requires discount rate greater than growth; discount rate must exceed −90%.',
    );
  const flowMode = choice(v, 'flowMode', ['direct', 'operating']);
  const forecast = rows(v, 'cashflows', 7, 1, 30).map((a, i) => {
    const ebit = cell(a[0], 'EBIT'),
      dep = cell(a[1], 'D&A', 0),
      capex = cell(a[2], 'Capex', 0),
      wc = cell(a[3], 'Change NWC'),
      direct = cell(a[4], 'Direct FCF'),
      ebitda = cell(a[5], 'EBITDA'),
      integration = cell(a[6], 'Other cash costs', 0);
    return {
      year: i + 1,
      fcf:
        flowMode === 'direct'
          ? direct
          : ebit - Math.max(0, ebit) * tax + dep - capex - wc - integration,
      ebitda,
    };
  });
  const last = forecast[forecast.length - 1],
    terminal =
      terminalMode === 'growth'
        ? (last.fcf * (1 + g)) / (rate - g)
        : last.ebitda * terminalMultiple,
    operatingPV = npv(
      rate,
      forecast.map((a) => a.fcf),
    ),
    terminalPV = terminal / (1 + rate) ** forecast.length,
    ev = operatingPV + terminalPV,
    debt = number(v, 'debt', 0),
    cash = number(v, 'cash', 0),
    minority = number(v, 'minority', 0),
    nonoperating = number(v, 'nonoperating'),
    shares = number(v, 'shares', 0.000001),
    equity = ev - debt + cash - minority + nonoperating;
  const standalone = number(v, 'standaloneEquity', 0),
    buyerShare = pct(v, 'buyerSynergyShare'),
    synergies = rows(v, 'synergySchedule', 5, 1, 30).map((a, i) => {
      const saved = cell(a[0], 'Cost savings', 0),
        uplift = cell(a[1], 'Revenue uplift', 0),
        contribution = cell(a[2], 'Contribution margin', 0, 100) / 100,
        cost = cell(a[3], 'Integration costs', 0),
        probability = cell(a[4], 'Benefit realization assumption', 0, 100) / 100,
        net = ((saved + uplift * contribution) * probability - cost) * (1 - tax);
      return { year: i + 1, net, pv: net / (1 + rate) ** (i + 1) };
    }),
    synergyPV = synergies.reduce((s, a) => s + a.pv, 0);
  const offer = number(v, 'offerPrice', 0),
    unaffected = number(v, 'unaffectedPrice', 0.000001),
    buyerPrice = number(v, 'buyerPrice', 0.000001),
    cashPerShare = number(v, 'cashPerShare', 0);
  if (cashPerShare > offer) throw Error('Cash per target share cannot exceed the offer price.');
  const basis = choice(v, 'multipleBasis', [
      'EV/EBITDA',
      'EV/Revenue',
      'P/E',
      'P/Sales',
      'P/Book',
      'P/Cash flow',
    ]),
    targetMetric = number(v, 'targetMetric'),
    multiple = number(v, 'selectedMultiple', 0, 1000),
    comparableRows = rows(v, 'comparables', 3, 1, 50).map((a) => {
      const value = cell(a[1], 'Comparable value', 0),
        metric = cell(a[2], 'Comparable metric');
      return [a[0], value, metric, metric > 0 ? value / metric : null];
    });
  const transaction = number(v, 'consideration', 0),
    nci = number(v, 'nci', 0),
    priorStake = number(v, 'priorStake', 0),
    assets = number(v, 'identifiableAssets', 0),
    liabilities = number(v, 'identifiableLiabilities', 0),
    goodwill = transaction + nci + priorStake - (assets - liabilities),
    outlay = number(v, 'initialOutlay', 0),
    investmentFlows = [
      -outlay,
      ...forecast.map((a, i) => a.fcf + (i === forecast.length - 1 ? terminal : 0)),
    ],
    projectIrr = irr(investmentFlows);
  r.metrics = [
    { label: 'Enterprise value', value: ev, unit: 'M' },
    { label: 'Equity value', value: equity, unit: 'M' },
    { label: 'Equity value per diluted share', value: equity / shares },
    { label: 'Discount rate used', value: rate * 100, unit: '%' },
    {
      label: 'Terminal value share of EV',
      value: ev !== 0 ? (terminalPV / ev) * 100 : null,
      unit: '%',
    },
    { label: 'Synergy net present value', value: synergyPV, unit: 'M' },
    {
      label: 'Project NPV incl. terminal less initial outlay',
      value: ev - outlay,
      unit: 'M; operating forecasts are treated as project flows here',
    },
    {
      label: 'Conventional-flow project IRR',
      value: projectIrr === null ? null : projectIrr * 100,
      unit: '%',
    },
    {
      label: 'Goodwill / bargain indicator',
      value: goodwill,
      unit: 'M (illustrative PPA; negative requires reassessment)',
    },
  ];
  r.tables = [
    {
      title: 'DCF — M',
      columns: ['Year', 'FCF', 'Discount factor', 'Present value'],
      rows: forecast.map((a) => [
        a.year,
        a.fcf,
        1 / (1 + rate) ** a.year,
        a.fcf / (1 + rate) ** a.year,
      ]),
    },
    {
      title: 'Enterprise-to-equity bridge — M',
      columns: ['Item', 'Amount'],
      rows: [
        ['Operating cash-flow PV', operatingPV],
        ['Terminal PV', terminalPV],
        ['Enterprise value', ev],
        ['Debt', -debt],
        ['Cash', cash],
        ['Noncontrolling interest', -minority],
        ['Other non-operating assets / liabilities, net', nonoperating],
        ['Equity value', equity],
      ],
    },
    {
      title: 'Cost-of-capital assumptions',
      columns: ['Measure', '%'],
      rows: [
        ['CAPM cost of equity', ke * 100],
        ['After-tax cost of debt', costDebt * (1 - tax) * 100],
        ['Debt capital weight', debtWeight * 100],
        ['Calculated WACC', wacc * 100],
        ['Selected rate', rate * 100],
      ],
    },
    {
      title: 'Comparable ratios — use a consistent value/metric basis',
      columns: ['Company', 'Value M', 'Metric M', basis + ' x'],
      rows: comparableRows,
    },
    {
      title: 'Multiple-based scenario — M',
      columns: ['Measure', 'Value'],
      rows: [
        ['Selected multiple x', multiple],
        ['Target metric', targetMetric],
        [
          basis.startsWith('EV/') ? 'Implied enterprise value' : 'Implied equity value',
          targetMetric > 0 ? targetMetric * multiple : null,
        ],
      ],
    },
    {
      title: 'Deal-price arithmetic',
      columns: ['Measure', 'Value'],
      rows: [
        ['Offer premium %', (offer / unaffected - 1) * 100],
        ['Offer equity value M', offer * shares],
        ['Stock per target share', offer - cashPerShare],
        ['Exchange ratio, buyer shares per target share', (offer - cashPerShare) / buyerPrice],
        [
          'Standalone equity + buyer-allocated net synergy value M',
          standalone + synergyPV * buyerShare,
        ],
      ],
    },
    {
      title: 'Synergy schedule — M',
      columns: ['Year', 'Expected after-tax net benefit', 'Present value'],
      rows: synergies.map((a) => [a.year, a.net, a.pv]),
    },
    {
      title: 'Illustrative acquisition-accounting bridge — M',
      columns: ['Measure', 'Amount'],
      rows: [
        ['Consideration', transaction],
        ['NCI fair value input', nci],
        ['Previously held interest fair value', priorStake],
        ['Identifiable assets fair value', -assets],
        ['Liabilities fair value (include applicable deferred tax)', liabilities],
        ['Goodwill / bargain indicator', goodwill],
      ],
    },
    {
      title: 'DCF sensitivity — enterprise value M',
      columns: [
        'Rate %',
        ...[-1, 0, 1].map((d) =>
          terminalMode === 'multiple'
            ? `${Math.max(0, terminalMultiple + d)}x`
            : `${(g * 100 + d).toFixed(2)}% growth`,
        ),
      ],
      rows: [-0.02, -0.01, 0, 0.01, 0.02].map((d) => {
        const dr = rate + d;
        return [
          dr * 100,
          ...[-1, 0, 1].map((t) => {
            const tr = g + t / 100;
            if (dr <= -1 || (terminalMode === 'growth' && dr <= tr)) return null;
            const tv =
              terminalMode === 'growth'
                ? (last.fcf * (1 + tr)) / (dr - tr)
                : last.ebitda * Math.max(0, terminalMultiple + t);
            return (
              npv(
                dr,
                forecast.map((a) => a.fcf),
              ) +
              tv / (1 + dr) ** forecast.length
            );
          }),
        ];
      }),
    },
  ];
  r.charts = [
    {
      title: 'Cash flow and discounted value — M',
      labels: forecast.map((a) => `Year ${a.year}`),
      series: [
        { label: 'Cash flow', values: forecast.map((a) => a.fcf) },
        { label: 'Present value', values: forecast.map((a) => a.fcf / (1 + rate) ** a.year) },
      ],
    },
    {
      title: 'Synergy realization — M',
      labels: synergies.map((a) => `Year ${a.year}`),
      series: [{ label: 'Net expected benefit', values: synergies.map((a) => a.net) }],
    },
  ];
  r.notes = [
    'All monetary figures and diluted shares are in millions, share prices in currency units. End-of-year cash flows are used. FCFF belongs with an enterprise discount rate; the enterprise/equity bridge must use a consistent valuation date and currency.',
    'Operating FCF uses EBIT less positive-EBIT cash taxes plus D&A less capex, increase in NWC and other cash costs. No tax loss carryforward or separate tax asset is assumed. Direct-FCF mode uses the entered cash flows.',
    'CAPM/WACC are assumption-based estimates. Debt weight is a market-value capital weight. Terminal growth must be below the selected rate; negative terminal cash flow or EBITDA can produce negative modeled values and needs interpretation.',
    'Synergy benefits receive the user-entered realization probability; integration costs are incurred regardless of realization. Benefits and costs are assumed tax affected at the stated rate. No perpetual synergy terminal value is added.',
    'Comparables are not automatically selected or normalized. Null ratios indicate a zero/negative metric. The offer premium is arithmetic, not an estimate of control value. The PPA bridge is illustrative; a negative goodwill indicator requires reassessment, not an automatic accounting gain.',
    'Project IRR is reported only for conventional investment cash flows with one initial outlay followed by nonnegative receipts. It includes the selected terminal value. For other sign patterns use NPV and inspect the cash-flow timing rather than select a potentially misleading root.',
  ];
  return r;
}
