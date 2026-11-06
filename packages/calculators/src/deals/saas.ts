import { cell, choice, number, result, rows, type Inputs, type Value } from './common';
export function saas(v: Inputs) {
  const r = result(),
    mode = choice(v, 'growthMode', ['growth', 'retention']),
    profitability = choice(v, 'profitability', ['ebitda', 'fcf']),
    arpa = number(v, 'arpa', 0.000001),
    productivity = number(v, 'arrPerEmployee', 0.000001),
    initialCash = number(v, 'cash', 0),
    revenueBasis = choice(v, 'revenueBasis', ['average', 'ending']),
    ruleTarget = number(v, 'ruleTarget', -100, 300);
  let annualArpa = arpa;
  let arr = number(v, 'arr', 0),
    cash = initialCash,
    retainedOwnership = 1;
  const schedule: Value[][] = [],
    records: { year: number; arr: number; cash: number; ebitda: number; valuation: number }[] = [];
  const forecast = rows(v, 'forecast', 10, 1, 20);
  for (const [i, a] of forecast.entries()) {
    const growth = cell(a[0], 'Growth', -100, 1000) / 100,
      newArr = cell(a[1], 'New ARR', 0),
      expansion = cell(a[2], 'Expansion', 0, 1000) / 100,
      contraction = cell(a[3], 'Contraction', 0, 100) / 100,
      churn = cell(a[4], 'Churn', 0, 100) / 100,
      ebitdaMargin = cell(a[5], 'EBITDA margin', -500, 100) / 100,
      fcfMargin = cell(a[6], 'FCF margin', -500, 100) / 100,
      funding = cell(a[7], 'Funding', 0),
      multiple = cell(a[8], 'ARR equity multiple', 0, 1000),
      arpaGrowth = cell(a[9], 'ARPA growth', -99, 1000) / 100;
    if (contraction + churn > 1)
      throw Error('Contraction plus churn cannot exceed 100% of opening ARR.');
    annualArpa *= 1 + arpaGrowth;
    const opening = arr;
    arr =
      mode === 'growth' ? arr * (1 + growth) : arr * (1 + expansion - contraction - churn) + newArr;
    const actualGrowth = opening > 0 ? (arr / opening - 1) * 100 : null,
      revenue = revenueBasis === 'average' ? (opening + arr) / 2 : arr,
      ebitda = revenue * ebitdaMargin,
      fcf = revenue * fcfMargin,
      customers = (arr * 1e6) / annualArpa,
      employees = Math.ceil((arr * 1e6) / productivity),
      preMoney = arr * multiple,
      postMoney = preMoney + funding;
    if (funding > 0 && preMoney <= 0)
      throw Error(
        'A positive funding round requires a positive pre-money valuation assumption; a zero-value financing cannot be inferred.',
      );
    const newOwnership = postMoney > 0 ? funding / postMoney : 0;
    retainedOwnership *= 1 - newOwnership;
    cash += funding + fcf;
    const selectedMargin = (profitability === 'ebitda' ? ebitdaMargin : fcfMargin) * 100,
      score = actualGrowth === null ? null : actualGrowth + selectedMargin;
    schedule.push([
      i + 1,
      opening,
      arr,
      actualGrowth,
      mode === 'retention' ? (1 + expansion - contraction - churn) * 100 : null,
      revenue,
      ebitda,
      fcf,
      annualArpa,
      customers,
      employees,
      funding,
      preMoney,
      postMoney,
      newOwnership * 100,
      retainedOwnership * 100,
      cash,
      score,
      score === null ? null : ruleTarget - actualGrowth!,
    ]);
    records.push({ year: i + 1, arr, cash, ebitda, valuation: preMoney });
  }
  r.metrics = [
    { label: 'Ending ARR', value: arr, unit: 'M annual run rate' },
    { label: 'Ending cash scenario', value: cash, unit: 'M' },
    {
      label: 'Original-holder ownership after modeled rounds',
      value: retainedOwnership * 100,
      unit: '%',
    },
    {
      label: 'Final pre-money equity scenario',
      value: records.at(-1)!.valuation,
      unit: 'M, using the user multiple',
    },
  ];
  r.tables = [
    {
      title: 'Annual scale and financing scenario',
      columns: [
        'Year',
        'Opening ARR M',
        'Ending ARR M',
        'ARR growth %',
        'NRR % (retention mode)',
        'Revenue proxy M',
        'EBITDA proxy M',
        'FCF proxy M',
        'Annual ARPA',
        'Equivalent customers',
        'Headcount target, rounded up',
        'Funding M',
        'Pre-money equity M',
        'Post-money equity M',
        'Round dilution %',
        'Original-holder ownership %',
        'Cash M',
        'Growth + selected margin %',
        'Margin needed for target %',
      ],
      rows: schedule,
    },
  ];
  r.charts = [
    {
      title: 'Scale — M',
      labels: records.map((a) => `Year ${a.year}`),
      series: [
        { label: 'ARR', values: records.map((a) => a.arr) },
        { label: 'EBITDA proxy', values: records.map((a) => a.ebitda) },
        { label: 'Cash', values: records.map((a) => a.cash) },
      ],
    },
  ];
  r.notes = [
    'ARR is an annual run-rate metric, not recognized revenue. The chosen average/end-ARR revenue proxy, EBITDA/FCF margins, ARPA growth, productivity and multiples are scenario assumptions, not validated market benchmarks.',
    'Growth mode applies each row’s growth rate. Retention mode calculates opening ARR × (1 + expansion − contraction − churn) + new ARR; growth is undefined from an opening zero. ARPA growth is applied cumulatively year by year.',
    'Equivalent customers can be fractional; a required whole-customer target can be rounded up. Headcount is a productivity scenario, not a staffing recommendation. Cash adds funding and the FCF proxy; negative cash remains visible.',
    'Financing assumes newly issued common equity at the stated pre-money equity scenario. Option pools, SAFEs, preferences, convertibles and transaction costs are excluded; their legal economics cannot be inferred from funding-stage names.',
    'Growth plus the selected EBITDA/FCF margin is an explicitly defined comparison. A target score does not forecast profit, define an IPO requirement or prove business quality. The supplied historical example is retained in the linked guide with its margin misalignment disclosed.',
  ];
  return r;
}
