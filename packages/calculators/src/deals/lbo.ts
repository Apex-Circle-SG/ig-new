import { cell, choice, irr, number, pct, result, rows, type Inputs, type Value } from './common';
type Loan = { name: string; initial: number; balance: number; rate: number; amort: number };
export function lbo(v: Inputs) {
  const r = result(),
    mode = choice(v, 'mode', ['lbo', 'recap']),
    interestBasis = choice(v, 'interestBasis', ['beginning', 'average', 'ending']);
  const revenue0 = number(v, 'revenue', 0.000001),
    margin0 = pct(v, 'margin'),
    cogsPct = pct(v, 'cogs'),
    cash0 = number(v, 'cash', 0),
    ppe0 = number(v, 'ppe', 0),
    oldIntangible = number(v, 'intangibles', 0),
    oldGoodwill = number(v, 'oldGoodwill', 0),
    otherLiability = number(v, 'otherLiabilities', 0),
    existingDebt = number(v, 'existingDebt', 0),
    existingRate = pct(v, 'existingRate'),
    refinance = choice(v, 'refinance', ['yes', 'no']) === 'yes',
    entryMultiple = number(v, 'entryMultiple', 0.01, 100),
    entryPrice = number(v, 'entrySharePrice', 0.000001),
    shares = number(v, 'shares', 0.000001),
    priceBasis = choice(v, 'priceBasis', ['multiple', 'shares']),
    recapDistribution = number(v, 'recapDistribution', 0),
    managementCash = number(v, 'managementCash', 0),
    legacy = mode === 'recap' ? pct(v, 'legacyOwnership') : 0,
    optionPool = pct(v, 'optionPool', 0, 50),
    optionStrike = number(v, 'optionStrike', 0),
    pref0 = number(v, 'preferred', 0),
    prefRate = pct(v, 'preferredRate'),
    prefPik = choice(v, 'preferredMode', ['cash', 'pik']) === 'pik',
    fees = number(v, 'transactionFees', 0),
    financeFeePct = pct(v, 'financeFees'),
    tax = pct(v, 'tax', 0, 99),
    writeup = mode === 'lbo' ? number(v, 'writeup', 0) : 0,
    deduction = pct(v, 'deductibleAmortization'),
    intLife = number(v, 'intangibleLife', 1, 50),
    assetLife = number(v, 'assetLife', 1, 50),
    capexLife = number(v, 'capexLife', 1, 50),
    feeLife = number(v, 'feeLife', 1, 50),
    halfYear = choice(v, 'halfYear', ['yes', 'no']) === 'yes',
    reserve = number(v, 'minimumCash', 0),
    cashRate = pct(v, 'cashRate'),
    dso = number(v, 'dso', 0, 730),
    dio = number(v, 'dio', 0, 730),
    dpo = number(v, 'dpo', 0, 730),
    revolverLimit = number(v, 'revolverLimit', 0),
    revolverRate = pct(v, 'revolverRate'),
    sweep = pct(v, 'sweep'),
    exitMultiple = number(v, 'exitMultiple', 0.01, 100),
    saleFee = pct(v, 'saleFee');
  const forecast = rows(v, 'forecast', 3, 1, 15).map((a, i) => ({
    year: i + 1,
    growth: cell(a[0], 'Revenue growth', -95, 300) / 100,
    margin: cell(a[1], 'EBITDA margin', -100, 100) / 100,
    capex: cell(a[2], 'Annual capex', 0),
  }));
  if (forecast.some((f) => f.margin + cogsPct > 1))
    throw Error('COGS % plus EBITDA margin cannot exceed 100%.');
  const loans: Loan[] = rows(v, 'loans', 4, 1, 8).map((a) => ({
    name: a[0],
    initial: cell(a[1], 'Tranche amount', 0),
    balance: cell(a[1], 'Tranche amount', 0),
    rate: cell(a[2], 'Tranche rate', 0, 100) / 100,
    amort: cell(a[3], 'Tranche annual amortization', 0, 100) / 100,
  }));
  if (loans.some((l) => !l.name)) throw Error('Name each debt tranche.');
  const newDebt = loans.reduce((s, l) => s + l.initial, 0),
    financingFees = newDebt * financeFeePct,
    entryEV = entryMultiple * revenue0 * margin0,
    purchaseEquity =
      priceBasis === 'multiple' ? entryEV - existingDebt + cash0 : entryPrice * shares;
  if (mode === 'lbo' && purchaseEquity <= 0)
    throw Error('Entry enterprise-to-equity bridge must produce a positive purchase equity value.');
  const purchase = mode === 'lbo' ? purchaseEquity : recapDistribution,
    repayOld = refinance ? existingDebt : 0,
    uses = purchase + repayOld + fees + financingFees,
    totalCashEquity = uses - newDebt - pref0,
    sponsorCash = totalCashEquity - managementCash;
  if (totalCashEquity <= 0 || sponsorCash <= 0)
    throw Error(
      'Funding exceeds uses, or sponsor cash equity is not positive. Adjust financing, distribution or management investment.',
    );
  if (!refinance && existingDebt > 0)
    loans.push({
      name: 'Existing debt retained',
      initial: existingDebt,
      balance: existingDebt,
      rate: existingRate,
      amort: 0,
    });
  const ar0 = (revenue0 * dso) / 365,
    inventory0 = (revenue0 * cogsPct * dio) / 365,
    ap0 = (revenue0 * cogsPct * dpo) / 365,
    initialBookEquity =
      cash0 +
      ar0 +
      inventory0 +
      ppe0 +
      oldIntangible +
      oldGoodwill -
      ap0 -
      otherLiability -
      existingDebt;
  const dtl0 = writeup * (1 - deduction) * tax,
    identifiableBookEquity = initialBookEquity - oldGoodwill,
    goodwill =
      mode === 'lbo' ? purchaseEquity - identifiableBookEquity - writeup + dtl0 : oldGoodwill;
  if (goodwill < 0)
    throw Error(
      'The source purchase-price allocation would imply a bargain purchase. Reassess identifiable values; this model does not book an automatic bargain gain.',
    );
  let existingPpe = ppe0;
  let cash = cash0,
    ppe = ppe0,
    pref = pref0,
    feeAsset = financingFees,
    newIntangible = writeup,
    dtl = dtl0,
    commonEquity =
      mode === 'lbo'
        ? totalCashEquity - fees
        : initialBookEquity + totalCashEquity - recapDistribution - fees,
    revenue = revenue0,
    nwc = ar0 + inventory0 - ap0,
    revolver = 0;
  const vintages: { amount: number; age: number }[] = [];
  const income: Value[][] = [],
    cashflow: Value[][] = [],
    balances: Value[][] = [],
    debtRows: Value[][] = [],
    exits: Value[][] = [];
  const periods: {
    year: number;
    ebitda: number;
    debt: number;
    preferred: number;
    cash: number;
    gap: number;
    common: number;
    balanceDifference: number;
  }[] = [];
  const initialAssets =
    cash + ar0 + inventory0 + ppe + oldIntangible + newIntangible + goodwill + feeAsset;
  const initialDebt = loans.reduce((s, l) => s + l.balance, 0),
    initialLiabilities = initialDebt + ap0 + otherLiability + dtl;
  balances.push([
    'Close',
    cash,
    ar0,
    inventory0,
    ppe,
    oldIntangible + newIntangible,
    goodwill,
    feeAsset,
    initialAssets,
    ap0,
    initialDebt,
    dtl,
    otherLiability,
    pref,
    commonEquity,
    initialAssets - initialLiabilities - pref - commonEquity,
  ]);
  let cumulativeGap = 0;
  for (const f of forecast) {
    const beginningCash = cash,
      openingLoans = loans.map((l) => l.balance),
      openingRevolver = revolver,
      openingPref = pref;
    revenue *= 1 + f.growth;
    const cogs = revenue * cogsPct,
      ebitda = revenue * f.margin,
      ar = (revenue * dso) / 365,
      inventory = (cogs * dio) / 365,
      ap = (cogs * dpo) / 365,
      endNwc = ar + inventory - ap,
      deltaNwc = endNwc - nwc;
    nwc = endNwc;
    const existingDep = Math.min(existingPpe, ppe0 / assetLife);
    existingPpe -= existingDep;
    const vintageDep = vintages.reduce((sum, a) => {
      const remainingLife = capexLife - a.age + (halfYear ? 0.5 : 0);
      return (
        sum +
        (remainingLife > 0
          ? (a.amount / capexLife) * (halfYear && a.age === 0 ? 0.5 : Math.min(1, remainingLife))
          : 0)
      );
    }, 0);
    const currentDep = (f.capex / capexLife) * (halfYear ? 0.5 : 1),
      depreciation = Math.min(ppe + f.capex, existingDep + vintageDep + currentDep);
    const amort = Math.min(newIntangible, writeup / intLife),
      financingAmort = Math.min(feeAsset, financingFees / feeLife),
      release = Math.min(dtl, amort * (1 - deduction) * tax),
      ebit = ebitda - depreciation - amort - financingAmort,
      interestIncome = Math.max(0, beginningCash - reserve) * cashRate,
      prefDividend = openingPref * prefRate;
    function financials(interest: number) {
      const cashTax = Math.max(0, ebit + amort * (1 - deduction) - interest + interestIncome) * tax,
        taxExpense = cashTax - release,
        ni = ebit - interest + interestIncome - taxExpense,
        cfo = ni + depreciation + amort + financingAmort - release - deltaNwc,
        preferredCash = prefPik ? 0 : prefDividend;
      let funds = beginningCash + cfo - f.capex - preferredCash - reserve;
      const mandatory = loans.map((l, i) => Math.min(openingLoans[i], l.initial * l.amort));
      funds -= mandatory.reduce((s, p) => s + p, 0);
      let draw = 0,
        gap = 0;
      if (funds < 0) {
        draw = Math.min(-funds, Math.max(0, revolverLimit - openingRevolver));
        gap = Math.max(0, -funds - draw);
        funds += draw;
      }
      const revPay = Math.min(openingRevolver, Math.max(0, funds));
      funds -= revPay;
      let sweepFunds = Math.max(0, funds) * sweep;
      const paid = [...mandatory];
      for (let i = 0; i < loans.length; i++) {
        const extra = Math.min(Math.max(0, openingLoans[i] - paid[i]), sweepFunds);
        paid[i] += extra;
        sweepFunds -= extra;
        funds -= extra;
      }
      const closingLoans = loans.map((_, i) => openingLoans[i] - paid[i]),
        closingRevolver = openingRevolver + draw - revPay,
        weight = interestBasis === 'beginning' ? 0 : interestBasis === 'ending' ? 1 : 0.5;
      const interestCheck =
        loans.reduce(
          (sum, l, i) => sum + (openingLoans[i] * (1 - weight) + closingLoans[i] * weight) * l.rate,
          0,
        ) +
        (openingRevolver * (1 - weight) + closingRevolver * weight) * revolverRate;
      return {
        cashTax,
        taxExpense,
        ni,
        cfo,
        preferredCash,
        draw,
        revPay,
        gap,
        paid,
        closingLoans,
        closingRevolver,
        endingCash: reserve + funds,
        interestCheck,
      };
    }
    let interest: number;
    if (interestBasis === 'beginning')
      interest =
        loans.reduce((s, l, i) => s + openingLoans[i] * l.rate, 0) + openingRevolver * revolverRate;
    else {
      let lo = 0,
        hi =
          loans.reduce((s, l, i) => s + openingLoans[i] * l.rate, 0) +
          revolverLimit * revolverRate +
          1;
      if (hi - financials(hi).interestCheck < 0)
        throw Error(
          'Interest/cash-flow equations do not have a stable solution within the facility. Check rates and funding.',
        );
      for (let i = 0; i < 90; i++) {
        const mid = (lo + hi) / 2;
        if (mid - financials(mid).interestCheck > 0) hi = mid;
        else lo = mid;
      }
      interest = (lo + hi) / 2;
    }
    const x = financials(interest);
    if (Math.abs(interest - x.interestCheck) > 0.000001)
      throw Error('Interest calculation did not converge.');
    cumulativeGap += x.gap;
    cash = x.endingCash;
    revolver = x.closingRevolver;
    loans.forEach((l, i) => {
      debtRows.push([f.year, l.name, openingLoans[i], x.paid[i], x.closingLoans[i], l.rate * 100]);
      l.balance = x.closingLoans[i];
    });
    debtRows.push([f.year, 'Revolver', openingRevolver, x.revPay, revolver, revolverRate * 100]);
    ppe += f.capex - depreciation;
    newIntangible -= amort;
    feeAsset -= financingAmort;
    dtl -= release;
    pref += prefPik ? prefDividend : 0;
    commonEquity += x.ni - prefDividend;
    vintages.forEach((a) => {
      a.age += 1;
    });
    vintages.push({ amount: f.capex, age: 1 });
    const debt = loans.reduce((s, l) => s + l.balance, 0) + revolver,
      assets = cash + ar + inventory + ppe + oldIntangible + newIntangible + goodwill + feeAsset,
      liabilities = ap + otherLiability + dtl + debt,
      difference = assets - liabilities - pref - commonEquity;
    income.push([
      f.year,
      revenue,
      cogs,
      revenue - cogs - ebitda,
      ebitda,
      depreciation,
      amort,
      financingAmort,
      ebit,
      interest,
      interestIncome,
      x.cashTax,
      x.taxExpense,
      x.ni,
      prefDividend,
      x.ni - prefDividend,
    ]);
    cashflow.push([
      f.year,
      beginningCash,
      x.ni,
      depreciation + amort + financingAmort,
      -release,
      -deltaNwc,
      x.cfo,
      -f.capex,
      -x.preferredCash,
      x.draw,
      -x.revPay - x.paid.reduce((s, p) => s + p, 0),
      cash,
      x.gap,
    ]);
    balances.push([
      f.year,
      cash,
      ar,
      inventory,
      ppe,
      oldIntangible + newIntangible,
      goodwill,
      feeAsset,
      assets,
      ap,
      debt,
      dtl,
      otherLiability,
      pref,
      commonEquity,
      difference,
    ]);
    periods.push({
      year: f.year,
      ebitda,
      debt,
      preferred: pref,
      cash,
      gap: cumulativeGap,
      common: commonEquity,
      balanceDifference: difference,
    });
  }
  function exit(p: (typeof periods)[number], multiple: number) {
    const ev = p.ebitda * multiple,
      costs = Math.max(0, ev) * saleFee,
      equity = Math.max(0, ev - p.debt - p.preferred + Math.max(0, p.cash - reserve) - costs),
      optionPayment = Math.min(equity, optionPool * Math.max(0, equity - optionStrike)),
      cashPool = equity - optionPayment,
      sponsor = cashPool * (sponsorCash / totalCashEquity) * (1 - legacy),
      manager = cashPool * (managementCash / totalCashEquity) * (1 - legacy) + optionPayment;
    return {
      ev,
      costs,
      equity,
      optionPayment,
      sponsor,
      manager,
      legacy: cashPool * legacy,
      sponsorIrr: p.gap > 1e-7 ? null : irr([-sponsorCash, ...Array(p.year - 1).fill(0), sponsor]),
      managerIrr:
        p.gap > 1e-7 || managementCash === 0
          ? null
          : irr([-managementCash, ...Array(p.year - 1).fill(0), manager]),
    };
  }
  const last = periods[periods.length - 1],
    end = exit(last, exitMultiple);
  for (const p of periods) {
    const e = exit(p, exitMultiple);
    exits.push([
      p.year,
      e.ev,
      p.debt,
      p.preferred,
      Math.max(0, p.cash - reserve),
      e.costs,
      e.equity,
      e.sponsor,
      e.manager,
      e.legacy,
      p.gap > 1e-7 ? null : e.sponsor / sponsorCash,
      e.sponsorIrr === null ? null : e.sponsorIrr * 100,
    ]);
  }
  r.metrics = [
    { label: 'Sponsor equity invested', value: sponsorCash, unit: 'M' },
    { label: 'Sponsor exit proceeds', value: end.sponsor, unit: 'M, before personal/fund taxes' },
    {
      label: 'Sponsor MOIC',
      value: cumulativeGap > 1e-7 ? null : end.sponsor / sponsorCash,
      unit: 'x',
    },
    {
      label: 'Sponsor IRR',
      value: end.sponsorIrr === null ? null : end.sponsorIrr * 100,
      unit: '%',
    },
    { label: 'Management exit proceeds', value: end.manager, unit: 'M' },
    {
      label: 'Management cash IRR',
      value: end.managerIrr === null ? null : end.managerIrr * 100,
      unit: '%',
    },
    { label: 'Unfunded cash shortfalls', value: cumulativeGap, unit: 'M across periods' },
    {
      label: 'Largest absolute balance-sheet check',
      value: Math.max(...balances.map((a) => Math.abs(Number(a[15])))),
      unit: 'M; should be near zero',
    },
  ];
  r.tables = [
    {
      title: 'Close: sources and uses — M',
      columns: ['Item', 'Amount'],
      rows: [
        [mode === 'lbo' ? 'Equity purchase' : 'Distribution to existing owners', purchase],
        ['Existing debt refinanced', repayOld],
        ['Transaction fees, expensed', fees],
        ['Financing fees, modeled as amortizing asset', financingFees],
        ['Uses', uses],
        ['New debt', newDebt],
        ['Preferred funding', pref0],
        ['Management cash', managementCash],
        ['Sponsor cash', sponsorCash],
        ['Sources less uses', newDebt + pref0 + managementCash + sponsorCash - uses],
      ],
    },
    {
      title: 'Income statement — M',
      columns: [
        'Year',
        'Revenue',
        'COGS',
        'Other cash costs',
        'EBITDA',
        'Depreciation',
        'Acquisition amortization',
        'Financing amortization',
        'EBIT',
        'Interest',
        'Interest income',
        'Cash tax',
        'Book tax expense',
        'Net income',
        'Preferred dividend',
        'Income to common',
      ],
      rows: income,
    },
    {
      title: 'Cash-flow statement — M',
      columns: [
        'Year',
        'Opening cash',
        'Net income',
        'D&A',
        'Deferred tax change',
        'NWC cash flow',
        'Operating cash flow',
        'Capex',
        'Preferred cash dividend',
        'Revolver draw',
        'Principal payments',
        'Ending cash',
        'Unfunded shortfall',
      ],
      rows: cashflow,
    },
    {
      title: 'Balance sheet — M',
      columns: [
        'Year',
        'Cash',
        'Receivables',
        'Inventory',
        'PP&E',
        'Intangibles',
        'Goodwill',
        'Fee asset',
        'Assets',
        'Payables',
        'Debt',
        'Deferred tax liability',
        'Other liabilities',
        'Preferred',
        'Common equity',
        'Assets less funding',
      ],
      rows: balances,
    },
    {
      title: 'Debt repayment priority — M',
      columns: [
        'Year',
        'Tranche',
        'Opening balance',
        'Principal paid',
        'Closing balance',
        'Rate %',
      ],
      rows: debtRows,
    },
    {
      title: 'Exit values and return timing — M unless % / x',
      columns: [
        'Exit year',
        'Enterprise value',
        'Debt',
        'Preferred',
        'Excess cash',
        'Sale costs',
        'Common proceeds',
        'Sponsor',
        'Management',
        'Legacy owners',
        'Sponsor MOIC x',
        'Sponsor IRR %',
      ],
      rows: exits,
    },
    {
      title: 'Sponsor IRR sensitivity — %',
      columns: [
        'Exit year',
        ...[-2, -1, 0, 1, 2].map((d) => `${Math.max(0.01, exitMultiple + d).toFixed(2)}x`),
      ],
      rows: periods.map((p) => [
        p.year,
        ...[-2, -1, 0, 1, 2].map((d) => {
          const e = exit(p, Math.max(0.01, exitMultiple + d));
          return e.sponsorIrr === null ? null : e.sponsorIrr * 100;
        }),
      ]),
    },
  ];
  r.charts = [
    {
      title: 'Debt and preferred funding — M',
      labels: periods.map((p) => `Year ${p.year}`),
      series: [
        { label: 'Debt', values: periods.map((p) => p.debt) },
        { label: 'Preferred', values: periods.map((p) => p.preferred) },
      ],
    },
    {
      title: 'Operating performance — M',
      labels: periods.map((p) => `Year ${p.year}`),
      series: [
        { label: 'Revenue', values: income.map((a) => Number(a[1])) },
        { label: 'EBITDA', values: periods.map((p) => p.ebitda) },
        { label: 'Cash', values: periods.map((p) => p.cash) },
      ],
    },
  ];
  r.notes = [
    'All monetary amounts and shares use millions; per-share prices use currency units. Tranche order is cash-sweep priority after mandatory amortization and revolver repayment. Existing debt is retained as a bullet when not refinanced; maturity refinancing risk is not projected.',
    'Beginning/average/ending interest is computed separately for every period. Average/ending interest is solved together with tax, borrowing and repayment; there is no hidden Excel circularity or fixed first-year interest copied into later years.',
    'Working capital uses receivables/revenue and inventory/payables/COGS day ratios. Existing PP&E and new capex use straight-line depreciation; the optional half-year convention applies to new capex. Existing intangibles remain at carrying value; new acquisition intangibles and financing fees amortize over the stated lives.',
    'This is an explicit teaching model, not a jurisdiction-specific accounting report. Non-deductible acquisition amortization creates/reverses the modeled deferred tax liability. Goodwill is not mechanically amortized. Financing fees are presented as a modeled asset rather than a claim about required reporting classification. No tax loss carryforwards are assumed.',
    'LBO purchase consideration resets common equity; recapitalization retains the existing book balance and pays the stated distribution. Cash ownership is diluted by the stated legacy stake in recap mode. The management pool receives its stated share above the exit strike, then remaining proceeds follow cash ownership. It is not a market valuation of options.',
    'Exit value uses the selected EBITDA multiple, subtracts debt/preferred and sale costs, and adds only cash above the minimum reserve. No interim common distributions are modeled. Return figures are withheld when a projected cash shortfall exceeds the revolver; do not interpret unfunded proceeds as achievable returns.',
  ];
  if (cumulativeGap > 1e-7)
    r.notes.unshift(
      'The scenario has unfunded cash shortfalls. Negative cash and required funding remain visible; sponsor/management IRRs and MOIC are not reported.',
    );
  return r;
}
