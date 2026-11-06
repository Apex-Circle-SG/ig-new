export type Field = {
  key: string;
  label: string;
  group: string;
  value: string;
  help: string;
  kind: 'number' | 'select' | 'rows';
  options?: { value: string; label: string }[];
};
export type DealTool = {
  id: string;
  path: string;
  title: string;
  description: string;
  category: string;
  kind: 'calculator' | 'planner';
  guides: string[];
  fields: Field[];
  methods: string[];
};
const n = (key: string, label: string, group: string, value: number, help = ''): Field => ({
  key,
  label,
  group,
  value: String(value),
  help,
  kind: 'number',
});
const s = (
  key: string,
  label: string,
  group: string,
  value: string,
  options: string[][],
): Field => ({
  key,
  label,
  group,
  value,
  kind: 'select',
  help: '',
  options: options.map(([value, label]) => ({ value, label })),
});
const t = (key: string, label: string, group: string, value: string, help: string): Field => ({
  key,
  label,
  group,
  value,
  help,
  kind: 'rows',
});
const yesNo = [
  ['yes', 'Yes'],
  ['no', 'No'],
];
export const DEAL_TOOLS: DealTool[] = [
  {
    id: 'acquisition-impact',
    path: '/calculators/corporate-finance/acquisition-impact/',
    title: 'Acquisition impact: EPS, funding and ownership',
    description:
      'Compare cash, stock and debt financing, earnings dilution, ownership and the synergies needed to break even.',
    category: 'Corporate Finance & Deals',
    kind: 'calculator',
    guides: ['ma-deal-structures', 'ma-synergies-value', 'ma-model-source-register'],
    methods: [
      'Model one full acquisition in a common base currency; reconcile sources and uses.',
      'Compare standalone and pro forma EPS with explicit closing timing, financing, taxes and operating adjustments.',
      'Recalculate price/funding sensitivities from the same formulas. An EPS improvement is not a value-creation verdict.',
    ],
    fields: [
      n('buyerShares', 'Buyer fully diluted shares (M)', 'Companies and consideration', 100),
      n('buyerPrice', 'Buyer issue price per share', 'Companies and consideration', 20),
      n('targetShares', 'Target basic shares (M)', 'Companies and consideration', 20),
      n('targetOptions', 'Target in-scope options (M)', 'Companies and consideration', 0),
      n('exercisePrice', 'Target option exercise price', 'Companies and consideration', 0),
      n('offerPrice', 'Offer price per target share', 'Companies and consideration', 20),
      n('unaffectedPrice', 'Unaffected target share price', 'Companies and consideration', 16),
      n('fx', 'Base currency per target currency unit', 'Companies and consideration', 1),
      n(
        'cashConsideration',
        'Cash consideration (%)',
        'Funding and costs',
        50,
        'The remaining consideration is buyer stock.',
      ),
      n('cashAvailable', 'Buyer cash available for funding (base M)', 'Funding and costs', 50),
      n('fees', 'Transaction fees (base M)', 'Funding and costs', 10),
      n('debtRate', 'New debt annual interest (%)', 'Funding and costs', 7),
      n('cashRate', 'Foregone annual interest on cash (%)', 'Funding and costs', 3),
      n('tax', 'Tax on operating/financing adjustments (%)', 'Funding and costs', 25),
      n('firstYearMonths', 'First-year ownership months', 'Earnings and synergies', 12),
      n('synergies', 'Annual pre-tax synergies (base M)', 'Earnings and synergies', 10),
      n('amortization', 'Annual acquisition amortization (base M)', 'Earnings and synergies', 2),
      t(
        'earnings',
        'Annual earnings and synergy ramp',
        'Earnings and synergies',
        'Year 1,100,20,100\nYear 2,105,22,100\nYear 3,110,24,100',
        'One row per year: label, buyer net income (base M), target net income (target M), synergy ramp %. No header.',
      ),
      n('buyerNetDebt', 'Buyer net debt before deal (base M)', 'Leverage', 20),
      n('targetNetDebt', 'Target net debt (target M)', 'Leverage', 10),
      n('combinedEbitda', 'Combined EBITDA incl. realized synergies (base M)', 'Leverage', 60),
    ],
  },
  {
    id: 'debt-capacity',
    path: '/calculators/corporate-finance/debt-capacity/',
    title: 'Debt capacity and repayment scenarios',
    description:
      'Model repayment, cash reserves, coverage and leverage under constant or changing operating assumptions.',
    category: 'Corporate Finance & Deals',
    kind: 'calculator',
    guides: ['ma-financing-models', 'liquidity-leverage-ratios', 'ma-model-source-register'],
    methods: [
      'Forecast cash available for debt service after cash taxes, capex and working capital.',
      'Apply senior amortization, cash sweep and final-maturity repayment with opening-balance interest.',
      'Solve the maximum debt satisfying the chosen repayment, reserve, coverage and leverage limits.',
    ],
    fields: [
      n('revenue', 'Current revenue (M)', 'Operating assumptions', 1000),
      n('margin', 'EBITDA margin (%)', 'Operating assumptions', 20),
      n('growth', 'Annual revenue growth (%)', 'Operating assumptions', 5),
      n('years', 'Years to final repayment', 'Operating assumptions', 5),
      t(
        'forecast',
        'Optional changing annual assumptions',
        'Operating assumptions',
        '',
        'Leave blank for constant assumptions, or enter exactly one row per year: growth %, EBITDA margin %. No header.',
      ),
      n('depreciation', 'Depreciation (% of revenue)', 'Cash generation', 3),
      n('capex', 'Capex (% of revenue)', 'Cash generation', 4),
      n('workingCapital', 'NWC (% of revenue)', 'Cash generation', 10),
      n('cashReserve', 'Minimum cash (% of revenue)', 'Cash generation', 1),
      n('openingCash', 'Opening cash (M)', 'Cash generation', 10),
      n('tax', 'Cash tax rate (%)', 'Cash generation', 25),
      n('seniorShare', 'Senior share of total debt (%)', 'Debt structure', 70),
      n('seniorRate', 'Senior interest (%)', 'Debt structure', 7),
      n('juniorRate', 'Subordinated interest (%)', 'Debt structure', 10),
      n(
        'amortization',
        'Annual senior amortization (% of initial principal)',
        'Debt structure',
        20,
      ),
      n('sweep', 'Excess-cash sweep (%)', 'Debt structure', 100),
      n('coverage', 'Minimum EBITDA / interest (x)', 'Constraints and existing debt', 2),
      n(
        'leverage',
        'Maximum opening debt / current EBITDA (x)',
        'Constraints and existing debt',
        5,
      ),
      n(
        'existingDebt',
        'Existing debt assumed refinanced (M)',
        'Constraints and existing debt',
        200,
      ),
    ],
  },
  {
    id: 'lbo-recapitalization',
    path: '/calculators/corporate-finance/lbo-recapitalization/',
    title: 'LBO and recapitalization workbench',
    description:
      'Connect operating forecasts, acquisition accounting, debt schedules and sponsor/management equity returns.',
    category: 'Corporate Finance & Deals',
    kind: 'calculator',
    guides: ['ma-financing-models', 'corporate-restructuring', 'ma-model-source-register'],
    methods: [
      'Reconcile sources and uses and closing balance-sheet funding for a buyout or recapitalization.',
      'Project operating profit, working capital, capital assets, taxes, cash, debt and preferred funding together.',
      'Solve the chosen interest basis, expose cash shortfalls, and compare exit values and timed returns.',
    ],
    fields: [
      s('mode', 'Transaction mode', 'Transaction and funding', 'lbo', [
        ['lbo', 'LBO: buy existing equity'],
        ['recap', 'Recapitalization: distribute cash to existing owners'],
      ]),
      s('priceBasis', 'LBO price basis', 'Transaction and funding', 'multiple', [
        ['multiple', 'Enterprise multiple and net-debt bridge'],
        ['shares', 'Offer price × diluted shares'],
      ]),
      n('entryMultiple', 'Entry EV / EBITDA (x)', 'Transaction and funding', 8),
      n('entrySharePrice', 'Offer price per share', 'Transaction and funding', 14.5),
      n('shares', 'Fully diluted shares (M)', 'Transaction and funding', 10),
      n(
        'recapDistribution',
        'Recap distribution to existing owners (M)',
        'Transaction and funding',
        50,
      ),
      s('refinance', 'Refinance existing debt at close', 'Transaction and funding', 'yes', yesNo),
      n('transactionFees', 'Transaction fees (M)', 'Transaction and funding', 5),
      n('financeFees', 'New debt financing fees (%)', 'Transaction and funding', 2),
      n('revenue', 'Opening annual revenue (M)', 'Operations and opening assets', 100),
      n('margin', 'Opening EBITDA margin (%)', 'Operations and opening assets', 20),
      n('cogs', 'COGS (% of revenue)', 'Operations and opening assets', 45),
      n('cash', 'Target cash retained at close (M)', 'Operations and opening assets', 5),
      n('ppe', 'Opening net PP&E (M)', 'Operations and opening assets', 30),
      n('intangibles', 'Other existing intangibles (M)', 'Operations and opening assets', 0),
      n('oldGoodwill', 'Existing goodwill (M)', 'Operations and opening assets', 5),
      n('otherLiabilities', 'Other non-debt liabilities (M)', 'Operations and opening assets', 0),
      n('existingDebt', 'Existing debt (M)', 'Operations and opening assets', 20),
      n('existingRate', 'Retained existing-debt interest (%)', 'Operations and opening assets', 6),
      n('dso', 'Receivable days', 'Working capital', 45),
      n('dio', 'Inventory days', 'Working capital', 30),
      n('dpo', 'Payable days', 'Working capital', 30),
      t(
        'forecast',
        'Annual operating forecast',
        'Forecast and capital assets',
        '5,25,6\n5,25,6\n5,26,7\n5,26,7\n5,27,8',
        'Growth %, EBITDA margin %, capex M. One row per year, no header.',
      ),
      n('assetLife', 'Remaining life of opening PP&E (years)', 'Forecast and capital assets', 5),
      n('capexLife', 'New capex life (years)', 'Forecast and capital assets', 6),
      s(
        'halfYear',
        'Half-year depreciation on new capex',
        'Forecast and capital assets',
        'yes',
        yesNo,
      ),
      n('writeup', 'New acquisition intangible write-up (M)', 'Acquisition accounting and tax', 10),
      n(
        'intangibleLife',
        'New intangible useful life (years)',
        'Acquisition accounting and tax',
        10,
      ),
      n(
        'deductibleAmortization',
        'Tax-deductible share of acquisition amortization (%)',
        'Acquisition accounting and tax',
        0,
      ),
      n('feeLife', 'Financing-fee amortization (years)', 'Acquisition accounting and tax', 5),
      n('tax', 'Tax rate (%)', 'Acquisition accounting and tax', 25),
      t(
        'loans',
        'New debt tranches in repayment priority',
        'Debt and cash',
        'Senior term,80,7,10\nSubordinated,20,10,0',
        'Name, amount M, annual interest %, mandatory annual amortization % of initial principal. Up to 8 rows, no header.',
      ),
      n('revolverLimit', 'Revolver facility limit (M)', 'Debt and cash', 20),
      n('revolverRate', 'Revolver annual interest (%)', 'Debt and cash', 8),
      n('minimumCash', 'Minimum cash (M)', 'Debt and cash', 5),
      n('cashRate', 'Interest on opening excess cash (%)', 'Debt and cash', 2),
      n('sweep', 'Excess-cash sweep after mandatory payments (%)', 'Debt and cash', 100),
      s('interestBasis', 'Interest balance basis', 'Debt and cash', 'average', [
        ['beginning', 'Beginning'],
        ['average', 'Average (solved with cash flow)'],
        ['ending', 'Ending (solved with cash flow)'],
      ]),
      n('preferred', 'Preferred funding at close (M)', 'Ownership and preferred capital', 0),
      n('preferredRate', 'Preferred annual dividend (%)', 'Ownership and preferred capital', 8),
      s('preferredMode', 'Preferred dividend', 'Ownership and preferred capital', 'pik', [
        ['pik', 'PIK: added to preferred balance'],
        ['cash', 'Paid in cash'],
      ]),
      n('managementCash', 'Management cash investment (M)', 'Ownership and preferred capital', 5),
      n(
        'legacyOwnership',
        'Legacy common stake retained in recap (%)',
        'Ownership and preferred capital',
        20,
      ),
      n(
        'optionPool',
        'Management share above exit strike (%)',
        'Ownership and preferred capital',
        10,
      ),
      n('optionStrike', 'Management pool exit strike (M)', 'Ownership and preferred capital', 70),
      n('exitMultiple', 'Exit EV / EBITDA (x)', 'Exit', 8),
      n('saleFee', 'Sale costs (% of exit EV)', 'Exit', 2),
    ],
  },
  {
    id: 'valuation-workbench',
    path: '/calculators/corporate-finance/valuation-workbench/',
    title: 'Valuation and deal-pricing workbench',
    description:
      'Inspect DCF, cost of capital, comparable ratios, premiums, synergy value and an illustrative purchase-price allocation.',
    category: 'Corporate Finance & Deals',
    kind: 'calculator',
    guides: [
      'discounted-cash-flow',
      'cost-of-capital-returns',
      'market-valuation-measures',
      'purchase-price-allocation',
      'ma-synergies-value',
    ],
    methods: [
      'Keep cash-flow definition, discount rate, currency and enterprise/equity basis consistent.',
      'Select a terminal method and inspect its contribution and sensitivity.',
      'Treat multiples, realization probabilities and offer assumptions as inputs; accounting and legal conclusions need their own evidence.',
    ],
    fields: [
      s('flowMode', 'Cash-flow input mode', 'DCF forecasts', 'direct', [
        ['direct', 'Use direct FCF column'],
        ['operating', 'Build FCFF from operating columns'],
      ]),
      t(
        'cashflows',
        'Annual forecast',
        'DCF forecasts',
        '15,4,5,1,9,19,0\n17,4,6,1,10,21,0\n19,4,6,1,12,23,0\n21,4,7,1,14,25,0\n23,4,7,1,16,27,0',
        'EBIT, D&A, capex, increase NWC, direct FCF, EBITDA, other cash costs — all M. No header.',
      ),
      s('terminalMode', 'Terminal method', 'DCF terminal value', 'growth', [
        ['growth', 'Perpetual FCF growth'],
        ['multiple', 'Final EBITDA × exit multiple'],
      ]),
      n('terminalGrowth', 'Perpetual growth (%)', 'DCF terminal value', 2),
      n('terminalMultiple', 'Terminal EBITDA multiple (x)', 'DCF terminal value', 8),
      s('rateMode', 'Discount-rate source', 'Discount rate and capital', 'direct', [
        ['direct', 'Direct rate'],
        ['wacc', 'Calculated CAPM / WACC'],
      ]),
      n('discountRate', 'Direct discount rate (%)', 'Discount rate and capital', 10),
      n('riskFree', 'Risk-free rate (%)', 'Discount rate and capital', 4),
      n('beta', 'Equity beta', 'Discount rate and capital', 1.2),
      n('marketPremium', 'Equity risk premium (%)', 'Discount rate and capital', 5),
      n('costDebt', 'Pre-tax cost of debt (%)', 'Discount rate and capital', 7),
      n('debtWeight', 'Market-value debt weight (%)', 'Discount rate and capital', 30),
      n('tax', 'Tax rate (%)', 'Discount rate and capital', 25),
      n('debt', 'Debt (M)', 'Enterprise-to-equity bridge', 40),
      n('cash', 'Cash (M)', 'Enterprise-to-equity bridge', 10),
      n('minority', 'Noncontrolling interest (M)', 'Enterprise-to-equity bridge', 0),
      n(
        'nonoperating',
        'Other non-operating assets less liabilities (M)',
        'Enterprise-to-equity bridge',
        0,
      ),
      n('shares', 'Diluted shares (M)', 'Enterprise-to-equity bridge', 10),
      n(
        'initialOutlay',
        'Initial project investment for NPV/IRR (M)',
        'Enterprise-to-equity bridge',
        100,
      ),
      s(
        'multipleBasis',
        'Comparable basis',
        'Comparables and price',
        'EV/EBITDA',
        ['EV/EBITDA', 'EV/Revenue', 'P/E', 'P/Sales', 'P/Book', 'P/Cash flow'].map((x) => [x, x]),
      ),
      t(
        'comparables',
        'Comparable inputs',
        'Comparables and price',
        'Example A,150,20\nExample B,180,25',
        'Name, consistent enterprise/equity value M, matching financial metric M. No header.',
      ),
      n('targetMetric', 'Target matching financial metric (M)', 'Comparables and price', 20),
      n('selectedMultiple', 'Selected comparable multiple (x)', 'Comparables and price', 8),
      n('offerPrice', 'Offer per target share', 'Comparables and price', 15),
      n('unaffectedPrice', 'Unaffected target share price', 'Comparables and price', 12),
      n('buyerPrice', 'Buyer share issue price', 'Comparables and price', 25),
      n('cashPerShare', 'Cash per target share', 'Comparables and price', 5),
      t(
        'synergySchedule',
        'Annual synergy assumptions',
        'Synergy valuation',
        '4,5,30,3,60\n6,8,30,2,80\n8,10,30,1,90',
        'Cost savings M, revenue uplift M, contribution margin %, integration costs M, benefit realization %. No header.',
      ),
      n('standaloneEquity', 'Target standalone equity value (M)', 'Synergy valuation', 100),
      n(
        'buyerSynergyShare',
        'Share of net synergy value allocated to price (%)',
        'Synergy valuation',
        50,
      ),
      n(
        'consideration',
        'Acquisition consideration fair value (M)',
        'Illustrative purchase-price allocation',
        100,
      ),
      n('nci', 'NCI fair-value input (M)', 'Illustrative purchase-price allocation', 0),
      n(
        'priorStake',
        'Previously held interest fair value (M)',
        'Illustrative purchase-price allocation',
        0,
      ),
      n(
        'identifiableAssets',
        'Identifiable assets fair value (M)',
        'Illustrative purchase-price allocation',
        120,
      ),
      n(
        'identifiableLiabilities',
        'Liabilities fair value incl. applicable deferred tax (M)',
        'Illustrative purchase-price allocation',
        40,
      ),
    ],
  },
  {
    id: 'saas-scale',
    path: '/calculators/corporate-finance/saas-scale/',
    title: 'SaaS scale and financing planner',
    description:
      'Explore ARR, retention, customer and staffing requirements, cash scenarios and equity-round dilution.',
    category: 'Corporate Finance & Deals',
    kind: 'calculator',
    guides: ['saas-scaling-scenarios', 'arr-growth-practice', 'founder-investment-terms'],
    methods: [
      'Separate ARR from recognized revenue; state any revenue and cash-flow proxies.',
      'Use either direct growth or explicit retention/expansion/new-business assumptions.',
      'Keep productivity, profitability, valuation multiples and funding stages as scenarios rather than market promises.',
    ],
    fields: [
      n('arr', 'Opening ARR (M)', 'Starting point', 2),
      n('cash', 'Opening cash (M)', 'Starting point', 3),
      n('arpa', 'Starting annual ARPA (currency / account)', 'Starting point', 10000),
      n('arrPerEmployee', 'ARR per employee target (currency)', 'Starting point', 200000),
      s('growthMode', 'ARR forecast mode', 'Forecast definitions', 'growth', [
        ['growth', 'Year-by-year growth'],
        ['retention', 'Expansion, contraction, churn and new ARR'],
      ]),
      s('revenueBasis', 'Illustrative annual revenue proxy', 'Forecast definitions', 'average', [
        ['average', 'Average opening/closing ARR'],
        ['ending', 'Ending ARR run rate'],
      ]),
      s('profitability', 'Growth + profitability comparison', 'Forecast definitions', 'fcf', [
        ['fcf', 'FCF margin'],
        ['ebitda', 'EBITDA margin'],
      ]),
      n('ruleTarget', 'User comparison target (%)', 'Forecast definitions', 40),
      t(
        'forecast',
        'Annual scale and funding assumptions',
        'Annual assumptions',
        '200,4,15,5,10,-100,-110,10,8,0\n200,10,15,5,10,-60,-70,20,7,0\n100,15,15,5,10,-20,-30,20,6,0\n100,20,15,5,10,0,-5,10,5,0\n100,25,15,5,10,10,5,0,5,0',
        'Growth %, new ARR M, expansion %, contraction %, churn %, EBITDA margin %, FCF margin %, funding M, pre-money ARR equity multiple x, ARPA growth %. No header.',
      ),
    ],
  },
  {
    id: 'vwap-volume',
    path: '/calculators/markets/vwap-volume/',
    title: 'VWAP and price-volume analysis',
    description:
      'Calculate a stated weighted-price measure and explore volume profiles, share turnover and period comparisons.',
    category: 'Trading & Markets',
    kind: 'calculator',
    guides: ['trading-indicators-reference', 'ma-deal-structures', 'ma-model-source-register'],
    methods: [
      'Use one instrument, a stated observation/price basis, eligible dates and consistent units.',
      'Compute weighted price from all entered price-volume observations; distinguish trade VWAP from bar proxies.',
      'Inspect price-bucket coverage, period boundaries and data-quality notes.',
    ],
    fields: [
      s('priceBasis', 'Observation price basis', 'Data definition', 'daily-close', [
        ['trade', 'Eligible trade price and trade volume'],
        ['daily-close', 'Daily close × daily volume proxy'],
        ['typical', '(High + low + close) / 3 × volume proxy'],
      ]),
      s('reset', 'Running weighted-price reset', 'Data definition', 'window', [
        ['window', 'Selected window'],
        ['daily', 'UTC calendar day'],
      ]),
      n(
        'volumeMultiplier',
        'Raw volume multiplier',
        'Data definition',
        1,
        'Use 1 for shares, 1000 for a source explicitly stated in thousands.',
      ),
      {
        ...n(
          'sharesOutstanding',
          'Shares outstanding (same normalized units)',
          'Data definition',
          1000000,
        ),
        help: 'Leave blank if unknown; turnover is then not calculated.',
      },
      t(
        'start',
        'Window start (optional)',
        'Window and profile',
        '',
        'ISO date or timestamp with timezone; blank uses the first observation.',
      ),
      t(
        'end',
        'Window end (optional)',
        'Window and profile',
        '',
        'Date-only end includes that UTC day; blank uses the final observation.',
      ),
      n('buckets', 'Price buckets', 'Window and profile', 8),
      {
        ...n('rangeStart', 'Custom range start (optional)', 'Window and profile', 0),
        value: '',
        help: 'Blank uses the minimum selected price.',
      },
      {
        ...n('bucketWidth', 'Custom bucket width (optional)', 'Window and profile', 1),
        value: '',
        help: 'Blank spans the selected price range.',
      },
      s('periodMode', 'Period comparisons', 'Window and profile', 'rolling', [
        ['rolling', 'Trailing 1, 2 and 3 years'],
        ['calendar', 'Calendar-year windows through end date'],
      ]),
      t(
        'observations',
        'Price-volume observations',
        'Observations',
        '2010-11-03,10,100\n2010-11-04,12,200\n2010-11-05,11,100',
        'Date, price, volume; typical-price mode adds high, low. A header is optional. Paste CSV or load a local CSV file. No data is sent to a server.',
      ),
    ],
  },
  {
    id: 'due-diligence',
    path: '/calculators/corporate-finance/due-diligence/',
    title: 'M&A due-diligence planner',
    description:
      'Organize the complete supplied requests, evidence, issues, owners and timelines in a private working checklist.',
    category: 'M&A Planning Tools',
    kind: 'planner',
    guides: ['ma-due-diligence', 'ma-diligence-finance', 'ma-model-source-register'],
    fields: [],
    methods: [
      'Retain every distinct supplied request and its source references; distinguish requested, received and reviewed evidence.',
      'Track findings separately from task status; task completion is not a diligence pass.',
      'Export your scenario locally. No account, upload service or shared data room is created.',
    ],
  },
  {
    id: 'integration-planner',
    path: '/calculators/corporate-finance/integration-planner/',
    title: 'Integration plan and scorecard',
    description:
      'Connect strategy and workstreams with milestones and unit-aware 100-day/year-one metrics.',
    category: 'M&A Planning Tools',
    kind: 'planner',
    guides: ['post-merger-integration-planning', 'ma-synergies-value', 'organizational-culture'],
    fields: [],
    methods: [
      'Use the supplied plan outline to assign objectives, ownership, resources and review routines.',
      'Record each metric’s unit, target direction, tolerance and reporting period before interpreting performance.',
      'Keep future/unreported actuals distinct from zero; do not combine FTE, money, percentages or incompatible benefits.',
    ],
  },
  {
    id: 'culture-comparison',
    path: '/calculators/corporate-finance/culture-comparison/',
    title: 'Culture comparison: perceptions and gaps',
    description:
      'Compare the 46 supplied characteristics across 11 groups, retaining evidence context and unrated items.',
    category: 'M&A Planning Tools',
    kind: 'planner',
    guides: [
      'post-merger-integration-planning',
      'organizational-culture',
      'ma-model-source-register',
    ],
    fields: [],
    methods: [
      'Rate each organization on the same source continuum, or leave it unrated.',
      'Compare absolute perception gaps. Category means are arithmetic summaries of ordinal ratings, not quality grades.',
      'Retain respondent/date/evidence context; a gap does not predict financial synergy or integration success.',
    ],
  },
];
export const getDealTool = (id: string) => DEAL_TOOLS.find((t) => t.id === id);
export const defaults = (tool: DealTool) =>
  Object.fromEntries(tool.fields.map((f) => [f.key, f.value]));
