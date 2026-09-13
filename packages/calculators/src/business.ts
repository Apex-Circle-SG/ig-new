import * as z from 'zod';

export const FINANCE_FORMULA_VERSION = '2026-09-13.1';
export const FINANCE_TOOL_IDS = [
  'ai-workflow-roi',
  'cash-runway',
  'break-even',
  'business-loan',
  'drawdown-recovery',
  'portfolio-concentration',
] as const;
export type FinanceToolId = (typeof FINANCE_TOOL_IDS)[number];
export type FinanceFormat = 'currency' | 'percent' | 'number' | 'months' | 'years' | 'hours';
export type FinanceSource = { name: string; url: string; version?: string };
export type FinanceField = {
  key: string;
  label: string;
  type: 'number' | 'holdings';
  defaultValue: number | number[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  help: string;
};
export type FinanceToolDefinition = {
  id: FinanceToolId;
  title: string;
  description: string;
  category: string;
  fields: FinanceField[];
  defaultInputs: Record<string, number | number[]>;
  sources: FinanceSource[];
  methodology: string[];
};
export type FinanceResultRow = {
  label: string;
  value: number | null;
  format: FinanceFormat;
  detail?: string;
};
export type FinanceSchedule = {
  caption: string;
  columns: { key: string; label: string; format: FinanceFormat }[];
  rows: Record<string, number | null>[];
};
export type FinancialToolResult = {
  toolId: FinanceToolId;
  formulaVersion: string;
  values: Record<string, number | null>;
  rows: FinanceResultRow[];
  summary: string;
  assumptions: string[];
  sources: FinanceSource[];
  schedule?: FinanceSchedule;
};
const currency = z.number().finite().min(0).max(1e9);
const positiveCurrency = currency.positive();
const percent = z.number().finite().min(0).max(100);
export const FINANCE_INPUT_SCHEMAS = {
  'ai-workflow-roi': z.strictObject({
    tasksPerMonth: z.number().int().min(0).max(1e7),
    minutesBefore: z.number().min(0).max(1e5),
    minutesAfter: z.number().min(0).max(1e5),
    reviewMinutes: z.number().min(0).max(1e5),
    hourlyCost: currency,
    monthlySoftwareCost: currency,
    setupCost: currency,
  }),
  'cash-runway': z.strictObject({
    cashBalance: currency,
    monthlyRevenue: currency,
    monthlyExpenses: currency,
    minimumReserve: currency,
    oneTimeCosts: currency,
  }),
  'break-even': z.strictObject({
    fixedCosts: currency,
    unitPrice: positiveCurrency,
    variableCost: currency,
    targetProfit: currency,
  }),
  'business-loan': z.strictObject({
    principal: positiveCurrency,
    annualRate: z.number().finite().min(0).max(1000),
    termMonths: z.number().int().min(1).max(600),
    upfrontFee: currency,
    extraMonthlyPayment: currency,
  }),
  'drawdown-recovery': z.strictObject({
    startingValue: positiveCurrency,
    lossPercent: percent,
    annualReturn: z.number().finite().min(-99.99).max(1000),
  }),
  'portfolio-concentration': z.strictObject({
    holdings: z
      .array(currency)
      .min(1)
      .max(100)
      .refine(
        (values) => values.some((value) => value > 0),
        'Enter at least one positive position value.',
      ),
    largestPositionShock: percent,
  }),
};
const numberField = (
  key: string,
  label: string,
  defaultValue: number,
  help: string,
  unit = '$',
  min = 0,
  max = 1e9,
  step = 0.01,
): FinanceField => ({ key, label, type: 'number', defaultValue, help, unit, min, max, step });
const sba: FinanceSource = {
  name: 'SBA — business finances and cash flow',
  url: 'https://www.sba.gov/counseling/manage-your-business/',
};
const definitions: Omit<FinanceToolDefinition, 'defaultInputs'>[] = [
  {
    id: 'ai-workflow-roi',
    title: 'AI workflow ROI calculator',
    category: 'Business decisions',
    description: 'Compare the value of time saved with software, setup and human review costs.',
    fields: [
      numberField(
        'tasksPerMonth',
        'Tasks per month',
        100,
        'Use the number of tasks this workflow will actually handle.',
        'tasks',
        0,
        1e7,
        1,
      ),
      numberField(
        'minutesBefore',
        'Minutes per task before AI',
        30,
        'Include the complete existing workflow.',
        'min',
        0,
        1e5,
      ),
      numberField(
        'minutesAfter',
        'Minutes per task with AI',
        10,
        'Include prompting, handling and corrections; add separate review below.',
        'min',
        0,
        1e5,
      ),
      numberField(
        'reviewMinutes',
        'Additional human review per task',
        5,
        'Account for checking outputs before use.',
        'min',
        0,
        1e5,
      ),
      numberField(
        'hourlyCost',
        'Value of an hour of work',
        40,
        'Use your own fully loaded labor cost or capacity valuation.',
      ),
      numberField(
        'monthlySoftwareCost',
        'Monthly software and usage cost',
        150,
        'Include subscriptions, API usage and recurring maintenance.',
      ),
      numberField(
        'setupCost',
        'One-time setup and training cost',
        500,
        'Include implementation and initial training.',
      ),
    ],
    sources: [
      sba,
      {
        name: 'NIST — human roles and oversight in AI systems',
        url: 'https://airc.nist.gov/airmf-resources/airmf/appendices/app-c-ai-risk-management-and-human-ai-interaction/',
        version: 'AI RMF 1.0, Appendix C',
      },
    ],
    methodology: [
      'Monthly hours saved = tasks × (minutes before − minutes with AI − review minutes) ÷ 60. Negative hours mean the new workflow takes longer.',
      'Monthly net capacity value = hours saved × hourly value − recurring cost. First-year net value also subtracts setup cost.',
      'First-year ROI = first-year net value ÷ (12 × recurring cost + setup cost). Payback = setup cost ÷ positive monthly net value.',
      'This is an InsightGinie cost model, not an NIST ROI formula. Capacity value becomes cash savings only if you actually reduce spending or realize additional value.',
    ],
  },
  {
    id: 'cash-runway',
    title: 'Cash runway calculator',
    category: 'Business decisions',
    description:
      'Estimate how long your cash stays above a chosen reserve under a steady monthly burn.',
    fields: [
      numberField(
        'cashBalance',
        'Cash available today',
        100000,
        'Use cash you can actually spend, not receivables or projected funding.',
      ),
      numberField(
        'monthlyRevenue',
        'Monthly cash received',
        20000,
        'Use cash collections, not invoiced revenue.',
      ),
      numberField(
        'monthlyExpenses',
        'Monthly cash paid out',
        30000,
        'Include payroll, debt service, taxes and other recurring cash outflows.',
      ),
      numberField(
        'minimumReserve',
        'Minimum cash reserve',
        10000,
        'The balance you want to retain.',
      ),
      numberField(
        'oneTimeCosts',
        'Immediate one-time costs',
        5000,
        'These are paid before the runway begins.',
      ),
    ],
    sources: [sba],
    methodology: [
      'Spendable cash = max(0, cash balance − immediate costs − minimum reserve). Monthly burn = cash paid out − cash received.',
      'When burn is positive, runway = spendable cash ÷ monthly burn. A zero runway means your reserve is already reached or exceeded.',
      'When burn is zero or negative and cash is above the reserve, this constant-input model has no finite exhaustion date. That does not guarantee business survival.',
      'The 12-month table applies the same monthly net cash flow from month zero. Seasonality, collection timing, financing and unexpected costs are not predicted.',
    ],
  },
  {
    id: 'break-even',
    title: 'Break-even calculator',
    category: 'Business decisions',
    description: 'Find the sales volume needed to cover fixed costs and a chosen profit target.',
    fields: [
      numberField(
        'fixedCosts',
        'Fixed costs per month',
        10000,
        'Costs that do not change with the sales volume modeled.',
      ),
      numberField(
        'unitPrice',
        'Selling price per unit',
        100,
        'Use the amount collected for one unit, before sales taxes.',
        '$',
        0.01,
      ),
      numberField(
        'variableCost',
        'Variable cost per unit',
        40,
        'Include costs directly caused by each additional sale.',
      ),
      numberField(
        'targetProfit',
        'Monthly operating profit target',
        0,
        'Optional profit above the fixed and variable costs modeled.',
      ),
    ],
    sources: [
      {
        name: 'SBA — break-even point formula',
        url: 'https://legacy.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs/break-even-point',
      },
    ],
    methodology: [
      'Contribution per unit = selling price − variable cost. Break-even units = fixed costs ÷ positive contribution per unit.',
      'Units for a profit target = (fixed costs + target profit) ÷ contribution per unit. Whole-unit targets round upward.',
      'If contribution is zero or negative, no positive sales volume can cover additional fixed costs. With zero fixed costs, zero sales has zero operating profit.',
      'This is a single-product model with constant price, unit cost and fixed costs. It does not model demand, capacity, mixed products, financing or income tax.',
    ],
  },
  {
    id: 'business-loan',
    title: 'Business loan payment calculator',
    category: 'Business decisions',
    description: 'Compare fixed-rate loans, extra payments, amortization and total borrowing cost.',
    fields: [
      numberField(
        'principal',
        'Loan principal',
        100000,
        'The amount on which interest is charged.',
        '$',
        0.01,
      ),
      numberField(
        'annualRate',
        'Annual interest rate',
        8,
        'Enter a nominal fixed interest rate, not APR. The example is not a market quote.',
        '%',
        0,
        1000,
      ),
      numberField(
        'termMonths',
        'Loan term',
        60,
        'The number of monthly payments in the agreement.',
        'months',
        1,
        600,
        1,
      ),
      numberField(
        'upfrontFee',
        'Fee paid upfront',
        0,
        'Paid separately; not financed and not included in the monthly payment.',
      ),
      numberField(
        'extraMonthlyPayment',
        'Extra monthly principal payment',
        0,
        'Assumes immediate principal credit without a prepayment penalty.',
      ),
    ],
    sources: [
      {
        name: 'CFPB — how fixed-rate amortization works',
        url: 'https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/',
      },
    ],
    methodology: [
      'Let P be principal, r the annual interest rate divided by 1,200, and n the number of months. Scheduled payment = P × r ÷ (1 − (1 + r)^(−n)). At zero interest, payment = P ÷ n.',
      'Each month, interest = opening balance × r. Payment covers interest and then principal; extra payments reduce principal. The final payment settles the remaining balance.',
      'Total borrowing cost = interest paid + upfront fee. The fee is paid separately, and the tool does not calculate APR.',
      'Compare two scenarios using the same model. Every change is current minus kept; a smaller payment can coincide with higher total cost. Check the principal, term, rate, fee and extra payment in both input columns.',
      'Assumes payments at month-end, a fixed rate and monthly compounding. Lender cent-rounding, daily accrual, variable rates, balloon payments, taxes and prepayment penalties can change actual payments.',
    ],
  },
  {
    id: 'drawdown-recovery',
    title: 'Drawdown recovery calculator',
    category: 'Investment education',
    description:
      'See the percentage gain needed to recover a loss and explore a constant-return illustration.',
    fields: [
      numberField(
        'startingValue',
        'Value before the loss',
        10000,
        'Use a positive starting amount.',
        '$',
        0.01,
      ),
      numberField(
        'lossPercent',
        'Loss from the starting value',
        30,
        'A 100% loss leaves no capital from which to compound.',
        '%',
        0,
        100,
      ),
      numberField(
        'annualReturn',
        'Assumed annual return after the loss',
        7,
        'An illustration you choose, not a forecast or promised investment return.',
        '%',
        -99.99,
        1000,
      ),
    ],
    sources: [
      {
        name: 'SEC Investor.gov — compound interest and return assumptions',
        url: 'https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator',
      },
    ],
    methodology: [
      'After a loss L expressed as a fraction, remaining value = starting value × (1 − L). Required gain = L ÷ (1 − L). A total loss has no finite percentage recovery.',
      'Illustrated recovery time = ln(1 ÷ (1 − L)) ÷ ln(1 + annual return). This is fractional time under smooth constant compounding; actual annual crediting or market paths differ.',
      'With a loss and zero or negative assumed growth, recovery is not reached. With no loss, no recovery is needed.',
      'No contributions, withdrawals, fees, inflation or taxes are modeled. The result does not recommend an asset, strategy or level of risk.',
    ],
  },
  {
    id: 'portfolio-concentration',
    title: 'Portfolio concentration calculator',
    category: 'Investment education',
    description:
      'Understand position weights, allocation concentration and an isolated position-loss scenario.',
    fields: [
      {
        key: 'holdings',
        label: 'Position values',
        type: 'holdings',
        defaultValue: [5000, 3000, 2000],
        help: 'Enter 1–100 nonnegative values separated by commas or new lines. Use one currency. Do not enter names, tickers, percentages or thousands separators.',
      },
      numberField(
        'largestPositionShock',
        'Illustrated loss in the largest position',
        20,
        'All other positions remain unchanged in this isolated scenario.',
        '%',
        0,
        100,
      ),
    ],
    sources: [
      {
        name: 'FINRA — concentration risk',
        url: 'https://www.finra.org/investors/insights/concentration-risk',
      },
      {
        name: 'SEC Investor.gov — asset allocation and diversification',
        url: 'https://www.investor.gov/introduction-investing/getting-started/asset-allocation',
      },
    ],
    methodology: [
      'Each weight is position value divided by total value. The largest-position and top-three shares describe how allocation is distributed.',
      'Allocation concentration = sum of squared weights × 10,000. Effective equal-sized positions = 1 ÷ sum of squared weights. These arithmetic measures do not estimate investment risk.',
      'The illustrated portfolio loss equals the largest weight multiplied by the chosen loss percentage, holding every other position unchanged.',
      'Separate entries can still share the same assets or risk exposures. Fund overlap, correlation, leverage, shorts, liquidity and asset quality are not measured. No buy, sell or rebalance recommendation is generated.',
    ],
  },
];
export const FINANCE_TOOLS: readonly FinanceToolDefinition[] = definitions.map((tool) => ({
  ...tool,
  defaultInputs: Object.fromEntries(
    tool.fields.map((field) => [
      field.key,
      Array.isArray(field.defaultValue) ? [...field.defaultValue] : field.defaultValue,
    ]),
  ),
}));
export function getFinanceTool(id: string): FinanceToolDefinition | undefined {
  return FINANCE_TOOLS.find((tool) => tool.id === id);
}
export function getFinanceDefaultInputs(id: FinanceToolId): Record<string, number | number[]> {
  return structuredClone(getFinanceTool(id)!.defaultInputs);
}
const wholeUnitsUp = (value: number) =>
  value === 0
    ? 0
    : Math.max(1, Math.ceil(value - Math.max(1, Math.abs(value)) * Number.EPSILON * 4));
const row = (
  label: string,
  value: number | null,
  format: FinanceFormat = 'currency',
  detail?: string,
): FinanceResultRow => ({ label, value, format, ...(detail ? { detail } : {}) });
function output(
  id: FinanceToolId,
  values: FinancialToolResult['values'],
  rows: FinanceResultRow[],
  summary: string,
  assumptions: string[],
  schedule?: FinanceSchedule,
): FinancialToolResult {
  if (Object.values(values).some((value) => value !== null && !Number.isFinite(value)))
    throw new Error('The inputs exceed the supported calculation range.');
  return {
    toolId: id,
    formulaVersion: FINANCE_FORMULA_VERSION,
    values,
    rows,
    summary,
    assumptions,
    sources: getFinanceTool(id)!.sources.map((source) => ({ ...source })),
    ...(schedule ? { schedule } : {}),
  };
}
/** Pure and deterministic: no clock, network, storage, rounding of intermediate values, or inferred market rates. */
export function calculateFinancialTool(
  id: FinanceToolId | string,
  inputs: Record<string, unknown>,
): FinancialToolResult {
  if (!getFinanceTool(id)) throw new Error('Unknown financial tool.');
  if (id === 'ai-workflow-roi') {
    const i = FINANCE_INPUT_SCHEMAS[id].parse(inputs);
    const hoursSaved =
      (i.tasksPerMonth * (i.minutesBefore - i.minutesAfter - i.reviewMinutes)) / 60;
    const monthlyCapacityValue = hoursSaved * i.hourlyCost;
    const monthlyNetValue = monthlyCapacityValue - i.monthlySoftwareCost;
    const firstYearCost = i.monthlySoftwareCost * 12 + i.setupCost;
    const firstYearNetValue = monthlyNetValue * 12 - i.setupCost;
    const firstYearRoi = firstYearCost > 0 ? (firstYearNetValue / firstYearCost) * 100 : null;
    const paybackMonths = monthlyNetValue > 0 ? i.setupCost / monthlyNetValue : null;
    return output(
      id,
      {
        hoursSaved,
        monthlyCapacityValue,
        monthlyNetValue,
        firstYearCost,
        firstYearNetValue,
        firstYearRoi,
        paybackMonths,
      },
      [
        row('Monthly net capacity value', monthlyNetValue),
        row('Work hours saved per month', hoursSaved, 'hours'),
        row('First-year net capacity value', firstYearNetValue),
        row(
          'First-year modeled ROI',
          firstYearRoi,
          'percent',
          firstYearRoi === null ? 'Undefined because modeled costs are zero.' : undefined,
        ),
        row(
          'Setup payback',
          paybackMonths,
          'months',
          paybackMonths === null ? 'Not reached with nonpositive monthly net value.' : undefined,
        ),
      ],
      monthlyNetValue > 0
        ? 'The modeled capacity value exceeds recurring costs. Realized cash savings may differ.'
        : 'The modeled recurring costs meet or exceed the value of time saved.',
      [
        'Time saved is valued capacity, not automatically cash saved.',
        'Task volume, time, labor value and costs remain constant for 12 months.',
        'Quality changes, implementation risk, taxes and discounting are excluded.',
      ],
    );
  }
  if (id === 'cash-runway') {
    const i = FINANCE_INPUT_SCHEMAS[id].parse(inputs);
    const startingCash = i.cashBalance - i.oneTimeCosts;
    const spendableCash = Math.max(0, startingCash - i.minimumReserve);
    const monthlyBurn = i.monthlyExpenses - i.monthlyRevenue;
    const runwayMonths =
      spendableCash === 0 ? 0 : monthlyBurn > 0 ? spendableCash / monthlyBurn : null;
    return output(
      id,
      { startingCash, spendableCash, monthlyBurn, runwayMonths },
      [
        row(
          'Runway above your reserve',
          runwayMonths,
          'months',
          runwayMonths === null
            ? 'No finite exhaustion date at this constant cash flow.'
            : undefined,
        ),
        row('Spendable cash above reserve', spendableCash),
        row(
          'Net monthly cash burn',
          monthlyBurn,
          'currency',
          'A negative burn means cash grows under these assumptions.',
        ),
        row('Cash after immediate costs', startingCash),
      ],
      spendableCash === 0
        ? 'Your modeled starting cash is already at or below the reserve.'
        : monthlyBurn > 0
          ? 'Cash declines at a constant monthly rate in this scenario.'
          : 'Cash does not decline in this constant-input scenario.',
      [
        'All immediate costs are paid before month zero.',
        'Cash collections and outflows remain constant; fractional months assume a uniform net burn.',
        'Runway measures the chosen reserve, not solvency or the ability to meet every payment date.',
      ],
      {
        caption: 'Illustrated cash balance over 12 months',
        columns: [
          { key: 'month', label: 'Month', format: 'number' },
          { key: 'balance', label: 'Cash balance', format: 'currency' },
          { key: 'aboveReserve', label: 'Above reserve', format: 'currency' },
        ],
        rows: Array.from({ length: 13 }, (_, month) => ({
          month,
          balance: startingCash - monthlyBurn * month,
          aboveReserve: startingCash - monthlyBurn * month - i.minimumReserve,
        })),
      },
    );
  }
  if (id === 'break-even') {
    const i = FINANCE_INPUT_SCHEMAS[id].parse(inputs);
    const contribution = i.unitPrice - i.variableCost;
    const breakEvenUnits =
      i.fixedCosts === 0 ? 0 : contribution > 0 ? i.fixedCosts / contribution : null;
    const wholeUnits = breakEvenUnits === null ? null : wholeUnitsUp(breakEvenUnits);
    const targetUnits =
      i.fixedCosts + i.targetProfit === 0
        ? 0
        : contribution > 0
          ? wholeUnitsUp((i.fixedCosts + i.targetProfit) / contribution)
          : null;
    const breakEvenRevenue = breakEvenUnits === null ? null : breakEvenUnits * i.unitPrice;
    const targetRevenue = targetUnits === null ? null : targetUnits * i.unitPrice;
    return output(
      id,
      {
        contribution,
        contributionMargin: (contribution / i.unitPrice) * 100,
        breakEvenUnits,
        wholeUnits,
        breakEvenRevenue,
        targetUnits,
        targetRevenue,
      },
      [
        row(
          'Whole units to break even',
          wholeUnits,
          'number',
          wholeUnits === null ? 'Not reached: contribution per unit is not positive.' : undefined,
        ),
        row('Contribution per unit', contribution),
        row('Contribution margin', (contribution / i.unitPrice) * 100, 'percent'),
        row('Theoretical break-even revenue', breakEvenRevenue),
        row('Whole units for your profit target', targetUnits, 'number'),
        row('Revenue at whole-unit profit target', targetRevenue),
      ],
      contribution > 0
        ? 'Each additional sale contributes toward the fixed costs and profit target.'
        : 'Additional sales do not contribute positively toward fixed costs.',
      [
        'Single product, one month, constant price and cost.',
        'Whole-unit targets round upward; theoretical break-even may be fractional.',
        'Profit here excludes unentered financing costs and taxes.',
      ],
    );
  }
  if (id === 'business-loan') {
    const i = FINANCE_INPUT_SCHEMAS[id].parse(inputs);
    const rate = i.annualRate / 1200;
    const monthlyPayment =
      rate === 0
        ? i.principal / i.termMonths
        : (i.principal * rate) / -Math.expm1(-i.termMonths * Math.log1p(rate));
    let balance = i.principal;
    let totalInterest = 0;
    const rows: Record<string, number>[] = [];
    for (let month = 1; month <= i.termMonths && balance > 0; month++) {
      const interest = balance * rate;
      // Closed-form remaining balance avoids losing tiny early principal payments
      // to subtraction at high rates or long terms. Extra-payment accumulation
      // uses expm1 so near-zero rates remain stable.
      const remainingWithoutExtra =
        rate === 0
          ? i.principal * (1 - month / i.termMonths)
          : (i.principal * -Math.expm1((month - i.termMonths) * Math.log1p(rate))) /
            -Math.expm1(-i.termMonths * Math.log1p(rate));
      const extraReduction =
        rate === 0
          ? i.extraMonthlyPayment * month
          : (i.extraMonthlyPayment * Math.expm1(month * Math.log1p(rate))) / rate;
      const nextBalance = Math.max(0, Math.min(balance, remainingWithoutExtra - extraReduction));
      const principalPaid = balance - nextBalance;
      const payment = interest + principalPaid;
      balance = nextBalance;
      totalInterest += interest;
      rows.push({ month, payment, interest, principal: principalPaid, balance });
    }
    const totalBorrowingCost = totalInterest + i.upfrontFee;
    const totalPaid = i.principal + totalBorrowingCost;
    return output(
      id,
      {
        monthlyPayment,
        firstPayment: rows[0].payment,
        totalInterest,
        totalBorrowingCost,
        totalPaid,
        payoffMonths: rows.length,
      },
      [
        row('Scheduled monthly principal + interest', monthlyPayment),
        row('First payment including extra', rows[0].payment),
        row('Payoff time with extra payments', rows.length, 'months'),
        row('Total interest', totalInterest),
        row('Total borrowing cost including fee', totalBorrowingCost),
        row('Total paid including principal and fee', totalPaid),
      ],
      'This models a fixed-rate, fully amortizing loan. It is not a lender quote or APR calculation.',
      [
        'The nominal rate is divided by 12; payments occur at month-end.',
        'The upfront fee is paid separately and does not accrue interest.',
        'Extra payments go to principal without a prepayment penalty.',
        'Calculations keep full precision; displayed cents and lender rounding can differ.',
      ],
      {
        caption: 'Monthly amortization schedule',
        columns: [
          { key: 'month', label: 'Month', format: 'number' },
          { key: 'payment', label: 'Payment', format: 'currency' },
          { key: 'interest', label: 'Interest', format: 'currency' },
          { key: 'principal', label: 'Principal', format: 'currency' },
          { key: 'balance', label: 'Balance', format: 'currency' },
        ],
        rows,
      },
    );
  }
  if (id === 'drawdown-recovery') {
    const i = FINANCE_INPUT_SCHEMAS[id].parse(inputs);
    const fraction = i.lossPercent / 100;
    const remainingValue = i.startingValue * (1 - fraction);
    const lostValue = i.startingValue - remainingValue;
    const requiredGain = fraction === 1 ? null : (fraction / (1 - fraction)) * 100;
    const recoveryYears =
      fraction === 0
        ? 0
        : fraction === 1 || i.annualReturn <= 0
          ? null
          : -Math.log1p(-fraction) / Math.log1p(i.annualReturn / 100);
    return output(
      id,
      { remainingValue, lostValue, requiredGain, recoveryYears },
      [
        row(
          'Gain required to return to the start',
          requiredGain,
          'percent',
          requiredGain === null ? 'A total loss has no finite percentage recovery.' : undefined,
        ),
        row('Value remaining after the loss', remainingValue),
        row('Value lost', lostValue),
        row(
          'Illustrated recovery time',
          recoveryYears,
          'years',
          recoveryYears === null
            ? 'Recovery is not reached under the entered growth assumptions.'
            : undefined,
        ),
      ],
      'A loss and its required recovery gain use different starting balances. The growth assumption is not a forecast.',
      [
        'No new contributions or withdrawals.',
        'Constant compounded growth is an illustration, not a market prediction.',
        'Fees, taxes and inflation are excluded.',
      ],
      {
        caption: 'Losses and gains needed to recover',
        columns: [
          { key: 'loss', label: 'Loss', format: 'percent' },
          { key: 'gain', label: 'Required gain', format: 'percent' },
        ],
        rows: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((loss) => ({
          loss,
          gain: loss === 100 ? null : (loss / (100 - loss)) * 100,
        })),
      },
    );
  }
  const i = FINANCE_INPUT_SCHEMAS['portfolio-concentration'].parse(inputs);
  const totalValue = i.holdings.reduce((total, value) => total + value, 0);
  const weights = i.holdings.map((value) => value / totalValue);
  const ordered = [...weights].sort((a, b) => b - a);
  const squareSum = weights.reduce((total, weight) => total + weight * weight, 0);
  const largestWeight = ordered[0] * 100;
  const topThreeWeight = ordered.slice(0, 3).reduce((total, value) => total + value, 0) * 100;
  const effectivePositions = 1 / squareSum;
  const concentrationIndex = squareSum * 10000;
  const illustratedLossPercent = ordered[0] * i.largestPositionShock;
  const illustratedLossValue = (totalValue * illustratedLossPercent) / 100;
  return output(
    'portfolio-concentration',
    {
      totalValue,
      positionCount: i.holdings.filter((value) => value > 0).length,
      largestWeight,
      topThreeWeight,
      effectivePositions,
      concentrationIndex,
      illustratedLossPercent,
      illustratedLossValue,
    },
    [
      row('Largest position share', largestWeight, 'percent'),
      row('Top three position share', topThreeWeight, 'percent'),
      row('Total entered value', totalValue),
      row(
        'Effective equal-sized positions',
        effectivePositions,
        'number',
        'An allocation measure, not a risk or diversification score.',
      ),
      row('Allocation concentration index', concentrationIndex, 'number'),
      row('Illustrated portfolio loss', illustratedLossPercent, 'percent'),
      row('Illustrated value lost', illustratedLossValue),
    ],
    'These results describe position sizes. Similar holdings can remain exposed to the same risks.',
    [
      'Long-only nonnegative positions entered in one currency; zero positions do not count as funded positions.',
      'No look-through into funds, correlations, leverage, liquidity or asset quality.',
      'The shock affects only the largest position; every other position remains unchanged.',
    ],
    {
      caption: 'Entered positions and allocation weights',
      columns: [
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'value', label: 'Value', format: 'currency' },
        { key: 'weight', label: 'Weight', format: 'percent' },
      ],
      rows: i.holdings.map((value, index) => ({
        position: index + 1,
        value,
        weight: weights[index] * 100,
      })),
    },
  );
}

export function formatFinanceValue(value: number | null, format: FinanceFormat): string {
  if (value === null) return 'Not reached / undefined';
  const normalized = Math.abs(value) < 1e-10 ? 0 : value;
  const number = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    ...(format === 'currency' ? { style: 'currency', currency: 'USD' } : {}),
  }).format(normalized);
  return format === 'percent'
    ? `${number}%`
    : ['months', 'years', 'hours'].includes(format)
      ? `${number} ${format}`
      : number;
}

export type BusinessLoanInputs = z.infer<(typeof FINANCE_INPUT_SCHEMAS)['business-loan']>;
export type BusinessLoanComparison = {
  formulaVersion: string;
  baselineInputs: BusinessLoanInputs;
  currentInputs: BusinessLoanInputs;
  baseline: FinancialToolResult;
  current: FinancialToolResult;
  rows: {
    key: string;
    label: string;
    format: FinanceFormat;
    baseline: number;
    current: number;
    delta: number;
  }[];
  schedule: FinanceSchedule;
};

/** Both scenarios use the same model. A delta always means current minus kept. */
export function compareBusinessLoanScenarios(
  baselineInputs: unknown,
  currentInputs: unknown,
): BusinessLoanComparison {
  const kept = FINANCE_INPUT_SCHEMAS['business-loan'].parse(baselineInputs);
  const current = FINANCE_INPUT_SCHEMAS['business-loan'].parse(currentInputs);
  const baselineResult = calculateFinancialTool('business-loan', kept);
  const currentResult = calculateFinancialTool('business-loan', current);
  const metrics: { key: string; label: string; format: FinanceFormat }[] = [
    { key: 'monthlyPayment', label: 'Scheduled monthly principal + interest', format: 'currency' },
    { key: 'firstPayment', label: 'First payment including extra', format: 'currency' },
    { key: 'totalInterest', label: 'Total interest', format: 'currency' },
    { key: 'totalBorrowingCost', label: 'Total borrowing cost including fee', format: 'currency' },
    { key: 'totalPaid', label: 'Total paid including principal and fee', format: 'currency' },
    { key: 'payoffMonths', label: 'Payoff time with extra payments', format: 'months' },
  ];
  const baselineSchedule = baselineResult.schedule!.rows;
  const currentSchedule = currentResult.schedule!.rows;
  return {
    formulaVersion: FINANCE_FORMULA_VERSION,
    baselineInputs: kept,
    currentInputs: current,
    baseline: baselineResult,
    current: currentResult,
    rows: metrics.map((metric) => {
      const baseline = baselineResult.values[metric.key]!;
      const value = currentResult.values[metric.key]!;
      return { ...metric, baseline, current: value, delta: value - baseline };
    }),
    schedule: {
      caption: 'Payment and remaining balance by month',
      columns: [
        { key: 'month', label: 'Month', format: 'number' },
        { key: 'baselinePayment', label: 'Kept payment', format: 'currency' },
        { key: 'currentPayment', label: 'Current payment', format: 'currency' },
        { key: 'baselineBalance', label: 'Kept balance', format: 'currency' },
        { key: 'currentBalance', label: 'Current balance', format: 'currency' },
      ],
      rows: Array.from(
        { length: Math.max(baselineSchedule.length, currentSchedule.length) },
        (_, index) => ({
          month: index + 1,
          baselinePayment: baselineSchedule[index]?.payment ?? 0,
          currentPayment: currentSchedule[index]?.payment ?? 0,
          baselineBalance: baselineSchedule[index]?.balance ?? 0,
          currentBalance: currentSchedule[index]?.balance ?? 0,
        }),
      ),
    },
  };
}
