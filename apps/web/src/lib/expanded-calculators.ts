// InsightGinie calculator hub — compute library.
// All calculations run in the visitor's browser. No sign-up, no data sent anywhere.
// Rates (tax, mortgage, market returns) are user-entered inputs with defaults
// labelled as assumptions in each calculator's limits text — never hardcoded facts.
// Census-related tools use band ranges only (individual, before-tax, CPS ASEC PINC-11, 2024).
// Tax tools are educational only, not tax advice.
// Assembled from fragments/ (one file per category). Do not hand-edit below this header;
// regenerate by concatenating the fragment files in category order.
type Calculator = {
  id: string; name: string; category: string; blurb: string; formula: string; limits: string;
  inputs: { key: string; label: string; value: number; step?: number; min?: number; max?: number }[];
  outputs: { key: string; label: string; format?: string }[];
  compute: (values: Record<string, number>) => Record<string, number | string | null>;
};
export const CALCS: Calculator[] = [];
CALCS.push({
  id: 'salary-hourly',
  name: 'Salary to hourly',
  category: 'Income & Salary',
  blurb: 'Converts an annual salary to an hourly rate and an hourly rate to an annual salary using the hours and weeks you enter.',
  formula: 'Hourly = Annual salary / (hours per week x weeks per year). Annual salary = Hourly rate x hours per week x weeks per year.',
  limits: 'Uses the hours and weeks you enter; does not account for unpaid leave unless you adjust weeks, or for overtime, bonuses, or deductions.',
  inputs: [{key: 'salary', label: 'Annual salary ($)', value: 60000, step: 1000, min: 0}, {key: 'hourlyRate', label: 'Hourly rate ($/hour)', value: 28.85, step: 0.25, min: 0}, {key: 'hoursPerWeek', label: 'Hours per week (hours/week)', value: 40, step: 1, min: 0}, {key: 'weeksPerYear', label: 'Weeks per year (weeks/year)', value: 52, step: 1, min: 0}],
  outputs: [{key: 'hourlyFromSalary', label: 'Hourly rate from salary', format: 'money'}, {key: 'annualFromHourly', label: 'Annual salary from hourly rate', format: 'money0'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.salary) || !ok(v.hourlyRate) || !ok(v.hoursPerWeek) || !ok(v.weeksPerYear)) return {hourlyFromSalary: null, annualFromHourly: null};
    const denom = v.hoursPerWeek * v.weeksPerYear;
    return {hourlyFromSalary: denom === 0 ? null : v.salary / denom, annualFromHourly: v.hourlyRate * v.hoursPerWeek * v.weeksPerYear};
  }
});
CALCS.push({
  id: 'salary-pay-periods',
  name: 'Salary to monthly, weekly, daily pay',
  category: 'Income & Salary',
  blurb: 'Breaks an annual salary into monthly, weekly, and daily pay using the weeks and work days you enter.',
  formula: 'Monthly = Annual salary / 12. Weekly = Annual salary / weeks per year. Daily = Annual salary / (weeks per year x work days per week).',
  limits: 'Uses the weeks and work days you enter; does not account for unpaid leave unless you adjust weeks, or for taxes and deductions.',
  inputs: [{key: 'salary', label: 'Annual salary ($)', value: 60000, step: 1000, min: 0}, {key: 'weeksPerYear', label: 'Weeks per year (weeks/year)', value: 52, step: 1, min: 0}, {key: 'workDaysPerWeek', label: 'Work days per week (days/week)', value: 5, step: 1, min: 0}],
  outputs: [{key: 'monthly', label: 'Monthly pay', format: 'money'}, {key: 'weekly', label: 'Weekly pay', format: 'money'}, {key: 'daily', label: 'Daily pay', format: 'money'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.salary) || !ok(v.weeksPerYear) || !ok(v.workDaysPerWeek)) return {monthly: null, weekly: null, daily: null};
    const denom = v.weeksPerYear * v.workDaysPerWeek;
    return {monthly: v.salary / 12, weekly: v.weeksPerYear === 0 ? null : v.salary / v.weeksPerYear, daily: denom === 0 ? null : v.salary / denom};
  }
});
CALCS.push({
  id: 'gross-take-home',
  name: 'Gross vs take-home estimator',
  category: 'Income & Salary',
  blurb: 'Estimates take-home pay from gross pay minus the deduction amounts you enter.',
  formula: 'Take-home pay = Gross pay - total deductions. Take-home percent = Take-home pay / Gross pay x 100.',
  limits: 'Educational estimator only, not a payroll calculation; uses only the deduction amounts you enter and no tax rate is assumed.',
  inputs: [{key: 'grossPay', label: 'Gross pay ($ per year)', value: 60000, step: 1000, min: 0}, {key: 'taxDeduction', label: 'Tax deduction ($ per year)', value: 8000, step: 100, min: 0}, {key: 'retirementDeduction', label: 'Retirement deduction ($ per year)', value: 3000, step: 100, min: 0}, {key: 'healthDeduction', label: 'Health deduction ($ per year)', value: 2000, step: 100, min: 0}, {key: 'otherDeduction', label: 'Other deduction ($ per year)', value: 0, step: 100, min: 0}],
  outputs: [{key: 'totalDeductions', label: 'Total deductions', format: 'money'}, {key: 'takeHome', label: 'Take-home pay', format: 'money'}, {key: 'takeHomePercent', label: 'Take-home percent', format: 'percent'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.grossPay) || !ok(v.taxDeduction) || !ok(v.retirementDeduction) || !ok(v.healthDeduction) || !ok(v.otherDeduction)) return {totalDeductions: null, takeHome: null, takeHomePercent: null};
    const total = v.taxDeduction + v.retirementDeduction + v.healthDeduction + v.otherDeduction;
    const takeHome = v.grossPay - total;
    return {totalDeductions: total, takeHome: takeHome, takeHomePercent: v.grossPay === 0 ? null : takeHome / v.grossPay * 100};
  }
});
CALCS.push({
  id: 'overtime-pay',
  name: 'Overtime pay calculator',
  category: 'Income & Salary',
  blurb: 'Calculates regular pay, overtime pay, and total pay from a regular rate, hours, and an overtime multiplier you enter.',
  formula: 'Regular pay = Regular rate x regular hours. Overtime pay = Regular rate x overtime multiplier x overtime hours. Total pay = Regular pay + Overtime pay.',
  limits: 'Uses the multiplier you enter; does not apply any legal overtime rule or threshold.',
  inputs: [{key: 'regularRate', label: 'Regular rate ($/hour)', value: 25, step: 1, min: 0}, {key: 'regularHours', label: 'Regular hours (hours/week)', value: 40, step: 1, min: 0}, {key: 'overtimeHours', label: 'Overtime hours (hours/week)', value: 5, step: 1, min: 0}, {key: 'overtimeMultiplier', label: 'Overtime multiplier (x)', value: 1.5, step: 0.5, min: 0}],
  outputs: [{key: 'regularPay', label: 'Regular pay', format: 'money'}, {key: 'overtimePay', label: 'Overtime pay', format: 'money'}, {key: 'totalPay', label: 'Total pay', format: 'money'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.regularRate) || !ok(v.regularHours) || !ok(v.overtimeHours) || !ok(v.overtimeMultiplier)) return {regularPay: null, overtimePay: null, totalPay: null};
    const regularPay = v.regularRate * v.regularHours;
    const overtimePay = v.regularRate * v.overtimeMultiplier * v.overtimeHours;
    return {regularPay: regularPay, overtimePay: overtimePay, totalPay: regularPay + overtimePay};
  }
});
CALCS.push({
  id: 'pay-raise',
  name: 'Pay raise calculator',
  category: 'Income & Salary',
  blurb: 'Compares old and new pay and shows the percent change and the annual and monthly difference.',
  formula: 'Percent change = (New pay - Old pay) / Old pay x 100. Annual difference = New pay - Old pay. Monthly difference = Annual difference / 12.',
  limits: 'Compares the two pay figures you enter; does not account for hours, taxes, or benefits changes.',
  inputs: [{key: 'oldPay', label: 'Old pay ($ per year)', value: 60000, step: 1000, min: 0}, {key: 'newPay', label: 'New pay ($ per year)', value: 66000, step: 1000, min: 0}],
  outputs: [{key: 'percentChange', label: 'Percent change', format: 'percent'}, {key: 'annualDifference', label: 'Annual difference', format: 'money'}, {key: 'monthlyDifference', label: 'Monthly difference', format: 'money'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.oldPay) || !ok(v.newPay)) return {percentChange: null, annualDifference: null, monthlyDifference: null};
    const diff = v.newPay - v.oldPay;
    return {percentChange: v.oldPay === 0 ? null : diff / v.oldPay * 100, annualDifference: diff, monthlyDifference: diff / 12};
  }
});
CALCS.push({
  id: 'salary-comparison',
  name: 'Salary comparison',
  category: 'Income & Salary',
  blurb: 'Compares two job offers side by side by total pay and by effective hourly rate.',
  formula: 'Total = Base pay + Bonus. Effective hourly = Total / (hours per week x 52 weeks per year). Difference = Offer 2 total - Offer 1 total.',
  limits: 'Assumes 52 weeks per year for both offers; does not account for benefits, taxes, commute, or other job conditions.',
  inputs: [{key: 'offer1Base', label: 'Offer 1 base pay ($ per year)', value: 60000, step: 1000, min: 0}, {key: 'offer1Bonus', label: 'Offer 1 bonus ($ per year)', value: 5000, step: 500, min: 0}, {key: 'offer1Hours', label: 'Offer 1 hours per week (hours/week)', value: 40, step: 1, min: 0}, {key: 'offer2Base', label: 'Offer 2 base pay ($ per year)', value: 68000, step: 1000, min: 0}, {key: 'offer2Bonus', label: 'Offer 2 bonus ($ per year)', value: 0, step: 500, min: 0}, {key: 'offer2Hours', label: 'Offer 2 hours per week (hours/week)', value: 45, step: 1, min: 0}],
  outputs: [{key: 'offer1Total', label: 'Offer 1 total pay', format: 'money0'}, {key: 'offer2Total', label: 'Offer 2 total pay', format: 'money0'}, {key: 'offer1Hourly', label: 'Offer 1 effective hourly rate', format: 'money'}, {key: 'offer2Hourly', label: 'Offer 2 effective hourly rate', format: 'money'}, {key: 'totalDifference', label: 'Total difference (Offer 2 minus Offer 1)', format: 'money0'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.offer1Base) || !ok(v.offer1Bonus) || !ok(v.offer1Hours) || !ok(v.offer2Base) || !ok(v.offer2Bonus) || !ok(v.offer2Hours)) return {offer1Total: null, offer2Total: null, offer1Hourly: null, offer2Hourly: null, totalDifference: null};
    const total1 = v.offer1Base + v.offer1Bonus;
    const total2 = v.offer2Base + v.offer2Bonus;
    const denom1 = v.offer1Hours * 52;
    const denom2 = v.offer2Hours * 52;
    return {offer1Total: total1, offer2Total: total2, offer1Hourly: denom1 === 0 ? null : total1 / denom1, offer2Hourly: denom2 === 0 ? null : total2 / denom2, totalDifference: total2 - total1};
  }
});
CALCS.push({
  id: 'household-vs-individual',
  name: 'Household vs individual income',
  category: 'Income & Salary',
  blurb: 'Adds two individual incomes into a household total and shows each individual band, with a warning not to apply the individual table to the total.',
  formula: 'Household total = Individual income 1 + Individual income 2. Each individual band is found from that individual income alone.',
  limits: 'Individual bands only, before-tax, US Census CPS ASEC PINC-11 2024; median individual band $37,500-$39,999. The household total is a simple sum and has no band in this calculator.',
  inputs: [{key: 'income1', label: 'Individual income 1 ($ per year)', value: 40000, step: 1000, min: 0}, {key: 'income2', label: 'Individual income 2 ($ per year)', value: 35000, step: 1000, min: 0}],
  outputs: [{key: 'householdTotal', label: 'Household total', format: 'money0'}, {key: 'person1Band', label: 'Individual 1 band', format: 'text'}, {key: 'person2Band', label: 'Individual 2 band', format: 'text'}, {key: 'householdWarning', label: 'Warning about the household total', format: 'text'}],
  compute: (v) => {
    const warning = 'Warning: the household total must NOT be read off the individual-income table. These bands are for individual, before-tax income only and do not apply to the household total.';
    const band = (x: number) => {
      if (x < 25000) return 'Under $25,000: 37.1% of individuals earned under $25,000 (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 50000) return 'Between $25,000 and $50,000: above the 37.1% under-$25,000 mark and below the 59.3% under-$50,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 75000) return 'Between $50,000 and $75,000: above the 59.3% under-$50,000 mark and below the 74.7% under-$75,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 100000) return 'Between $75,000 and $100,000: above the 74.7% under-$75,000 mark and below the 83.3% under-$100,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 250000) return '$100,000 to under $250,000: above the 83.3% under-$100,000 mark; the $250,000+ group is 2.5% of individuals (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      return '$250,000 or more: in the $250,000+ group, 2.5% of individuals (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
    };
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.income1) || !ok(v.income2)) return {householdTotal: null, person1Band: null, person2Band: null, householdWarning: warning};
    return {householdTotal: v.income1 + v.income2, person1Band: band(v.income1), person2Band: band(v.income2), householdWarning: warning};
  }
});
CALCS.push({
  id: 'two-earner-household-bands',
  name: 'Two-earner household total vs individual bands',
  category: 'Income & Salary',
  blurb: 'Shows each earner individual Census band side by side with their combined household total, so the total is not mistaken for an individual band.',
  formula: 'Household total = Income 1 + Income 2. Each band is found from that earner income alone, never from the household total.',
  limits: 'Individual bands only, before-tax, US Census CPS ASEC PINC-11 2024; median individual band $37,500-$39,999. No household band is shown because the individual-income bands do not apply to a household total.',
  inputs: [{key: 'income1', label: 'Earner 1 income ($ per year)', value: 55000, step: 1000, min: 0}, {key: 'income2', label: 'Earner 2 income ($ per year)', value: 45000, step: 1000, min: 0}],
  outputs: [{key: 'householdTotal', label: 'Household total', format: 'money0'}, {key: 'person1Band', label: 'Earner 1 individual band', format: 'text'}, {key: 'person2Band', label: 'Earner 2 individual band', format: 'text'}, {key: 'householdNote', label: 'Note on the household total', format: 'text'}],
  compute: (v) => {
    const note = 'Note: each band above is for that earner alone. The household total is not banded here because individual-income bands do not apply to a household total.';
    const band = (x: number) => {
      if (x < 25000) return 'Under $25,000: 37.1% of individuals earned under $25,000 (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 50000) return 'Between $25,000 and $50,000: above the 37.1% under-$25,000 mark and below the 59.3% under-$50,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 75000) return 'Between $50,000 and $75,000: above the 59.3% under-$50,000 mark and below the 74.7% under-$75,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 100000) return 'Between $75,000 and $100,000: above the 74.7% under-$75,000 mark and below the 83.3% under-$100,000 mark (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      if (x < 250000) return '$100,000 to under $250,000: above the 83.3% under-$100,000 mark; the $250,000+ group is 2.5% of individuals (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
      return '$250,000 or more: in the $250,000+ group, 2.5% of individuals (individual, before-tax, US Census CPS ASEC PINC-11 2024).';
    };
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.income1) || !ok(v.income2)) return {householdTotal: null, person1Band: null, person2Band: null, householdNote: note};
    return {householdTotal: v.income1 + v.income2, person1Band: band(v.income1), person2Band: band(v.income2), householdNote: note};
  }
});
CALCS.push({
  id: 'part-time-vs-full-time',
  name: 'Part-time vs full-time annualised pay',
  category: 'Income & Salary',
  blurb: 'Annualises part-time and full-time pay from their hourly rates and weekly hours so the two can be compared on the same yearly basis.',
  formula: 'Annualised pay = Hourly rate x hours per week x weeks per year. Annual difference = Full-time annualised pay - Part-time annualised pay.',
  limits: 'Annualises the hours and rates you enter; does not account for benefits, overtime, unpaid leave, or different weeks worked unless you adjust weeks.',
  inputs: [{key: 'partTimeHourly', label: 'Part-time hourly rate ($/hour)', value: 20, step: 1, min: 0}, {key: 'partTimeHours', label: 'Part-time hours per week (hours/week)', value: 20, step: 1, min: 0}, {key: 'fullTimeHourly', label: 'Full-time hourly rate ($/hour)', value: 22, step: 1, min: 0}, {key: 'fullTimeHours', label: 'Full-time hours per week (hours/week)', value: 40, step: 1, min: 0}, {key: 'weeksPerYear', label: 'Weeks per year (weeks/year)', value: 52, step: 1, min: 0}],
  outputs: [{key: 'partTimeAnnual', label: 'Part-time annualised pay', format: 'money0'}, {key: 'fullTimeAnnual', label: 'Full-time annualised pay', format: 'money0'}, {key: 'annualDifference', label: 'Annual difference (full-time minus part-time)', format: 'money0'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.partTimeHourly) || !ok(v.partTimeHours) || !ok(v.fullTimeHourly) || !ok(v.fullTimeHours) || !ok(v.weeksPerYear)) return {partTimeAnnual: null, fullTimeAnnual: null, annualDifference: null};
    const part = v.partTimeHourly * v.partTimeHours * v.weeksPerYear;
    const full = v.fullTimeHourly * v.fullTimeHours * v.weeksPerYear;
    return {partTimeAnnual: part, fullTimeAnnual: full, annualDifference: full - part};
  }
});
CALCS.push({
  id: 'bonus-commission-annualiser',
  name: 'Bonus / commission annualiser',
  category: 'Income & Salary',
  blurb: 'Converts variable bonus or commission pay into an annual equivalent and adds it to base pay.',
  formula: 'Annual variable pay = Variable pay per payment x payments per year. Total annual pay = Base pay + Annual variable pay. Monthly equivalent = Total annual pay / 12.',
  limits: 'Annualises the variable amount and frequency you enter; actual bonuses and commissions vary and are not guaranteed.',
  inputs: [{key: 'basePay', label: 'Base pay ($ per year)', value: 60000, step: 1000, min: 0}, {key: 'variablePay', label: 'Variable pay per payment ($)', value: 2000, step: 100, min: 0}, {key: 'paymentsPerYear', label: 'Payments per year (payments/year)', value: 4, step: 1, min: 0}],
  outputs: [{key: 'annualVariable', label: 'Annual variable pay', format: 'money0'}, {key: 'totalAnnual', label: 'Total annual pay', format: 'money0'}, {key: 'monthlyEquivalent', label: 'Monthly equivalent', format: 'money'}],
  compute: (v) => {
    const ok = (x: number) => typeof x === 'number' && isFinite(x) && x >= 0;
    if (!ok(v.basePay) || !ok(v.variablePay) || !ok(v.paymentsPerYear)) return {annualVariable: null, totalAnnual: null, monthlyEquivalent: null};
    const annualVariable = v.variablePay * v.paymentsPerYear;
    const total = v.basePay + annualVariable;
    return {annualVariable: annualVariable, totalAnnual: total, monthlyEquivalent: total / 12};
  }
});

CALCS.push({
  id: 'federal-tax-estimator',
  name: 'Federal income tax estimator',
  category: 'Paycheck & Tax',
  blurb: 'Estimates federal income tax from your income, assumed deduction, and assumed marginal rate.',
  formula: 'Tax = max(0, income - deduction) x rate / 100.',
  limits: 'Simplified flat-rate estimate only; it does not use real IRS brackets, credits, or filing-status rules. The rate and deduction defaults are assumptions you enter, not verified current IRS figures. Educational only, not tax advice.',
  inputs: [{key: 'income', label: 'Annual income ($)', value: 60000, step: 1000, min: 0}, {key: 'deduction', label: 'Standard deduction assumed ($)', value: 12000, step: 1000, min: 0}, {key: 'rate', label: 'Marginal tax rate assumed (%)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'taxableIncome', label: 'Taxable income', format: 'money'}, {key: 'tax', label: 'Estimated tax', format: 'money'}],
  compute: (v) => { const income = (typeof v.income === 'number' && isFinite(v.income)) ? Math.max(0, v.income) : 0; const deduction = (typeof v.deduction === 'number' && isFinite(v.deduction)) ? Math.max(0, v.deduction) : 0; const rate = (typeof v.rate === 'number' && isFinite(v.rate)) ? Math.max(0, v.rate) : 0; const taxableIncome = Math.max(0, income - deduction); return {taxableIncome: taxableIncome, tax: taxableIncome * rate / 100}; }
});
CALCS.push({
  id: 'marginal-vs-effective-tax-rate',
  name: 'Marginal vs effective tax rate explainer-calculator',
  category: 'Paycheck & Tax',
  blurb: 'Compares the marginal rate on the next dollar with the effective rate on all income.',
  formula: 'Effective rate = total tax paid / income x 100; after-tax income = income - total tax paid.',
  limits: 'The marginal rate is an assumption you enter, not a verified current IRS bracket rate, and total tax paid is your own figure, not a payroll calculation. Educational only, not tax advice.',
  inputs: [{key: 'income', label: 'Annual income ($)', value: 60000, step: 1000, min: 0}, {key: 'taxPaid', label: 'Total tax paid ($)', value: 9000, step: 100, min: 0}, {key: 'marginalRate', label: 'Marginal tax rate assumed (%)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'effectiveRate', label: 'Effective tax rate', format: 'percent'}, {key: 'marginalRateOut', label: 'Marginal tax rate', format: 'percent'}, {key: 'afterTaxIncome', label: 'After-tax income', format: 'money'}],
  compute: (v) => { const income = (typeof v.income === 'number' && isFinite(v.income)) ? Math.max(0, v.income) : 0; const taxPaid = (typeof v.taxPaid === 'number' && isFinite(v.taxPaid)) ? Math.max(0, v.taxPaid) : 0; const marginalRate = (typeof v.marginalRate === 'number' && isFinite(v.marginalRate)) ? Math.max(0, v.marginalRate) : 0; return {effectiveRate: income > 0 ? taxPaid / income * 100 : null, marginalRateOut: marginalRate, afterTaxIncome: income - taxPaid}; }
});
CALCS.push({
  id: 'paycheck-deduction-splitter',
  name: 'Paycheck deduction splitter',
  category: 'Paycheck & Tax',
  blurb: 'Splits a paycheck into tax, retirement, health, and net pay using percentages you enter.',
  formula: 'Each deduction = gross pay x its percentage / 100; net pay = gross pay - tax - retirement - health.',
  limits: 'Percentages are assumptions you enter, not a payroll calculation and not your employer\'s actual deductions. Educational only, not tax advice.',
  inputs: [{key: 'grossPay', label: 'Gross pay per paycheck ($)', value: 5000, step: 100, min: 0}, {key: 'taxPercent', label: 'Tax deduction (%)', value: 20, step: 1, min: 0}, {key: 'retirementPercent', label: 'Retirement deduction (%)', value: 10, step: 1, min: 0}, {key: 'healthPercent', label: 'Health deduction (%)', value: 5, step: 1, min: 0}],
  outputs: [{key: 'taxAmount', label: 'Tax deduction', format: 'money'}, {key: 'retirementAmount', label: 'Retirement deduction', format: 'money'}, {key: 'healthAmount', label: 'Health deduction', format: 'money'}, {key: 'netPay', label: 'Net pay', format: 'money'}],
  compute: (v) => { const gross = (typeof v.grossPay === 'number' && isFinite(v.grossPay)) ? Math.max(0, v.grossPay) : 0; const taxP = (typeof v.taxPercent === 'number' && isFinite(v.taxPercent)) ? Math.max(0, v.taxPercent) : 0; const retP = (typeof v.retirementPercent === 'number' && isFinite(v.retirementPercent)) ? Math.max(0, v.retirementPercent) : 0; const healthP = (typeof v.healthPercent === 'number' && isFinite(v.healthPercent)) ? Math.max(0, v.healthPercent) : 0; const taxAmount = gross * taxP / 100; const retirementAmount = gross * retP / 100; const healthAmount = gross * healthP / 100; return {taxAmount: taxAmount, retirementAmount: retirementAmount, healthAmount: healthAmount, netPay: gross - taxAmount - retirementAmount - healthAmount}; }
});
CALCS.push({
  id: 'self-employment-tax-estimator',
  name: 'Self-employment tax estimator',
  category: 'Paycheck & Tax',
  blurb: 'Estimates self-employment tax from net earnings and a self-employment tax rate you enter.',
  formula: 'Self-employment tax = net earnings x SE tax rate / 100; net after SE tax = net earnings - self-employment tax.',
  limits: 'The default 15.3% rate is an assumption to check against current IRS rules, not a verified current fact, and this simplified calculation does not apply real IRS rules, thresholds, or deductions. Educational only, not tax advice.',
  inputs: [{key: 'netEarnings', label: 'Net earnings ($)', value: 50000, step: 1000, min: 0}, {key: 'seRate', label: 'Self-employment tax rate assumed (%)', value: 15.3, step: 0.1, min: 0}],
  outputs: [{key: 'seTax', label: 'Estimated self-employment tax', format: 'money'}, {key: 'netAfterSeTax', label: 'Net after self-employment tax', format: 'money'}],
  compute: (v) => { const earnings = (typeof v.netEarnings === 'number' && isFinite(v.netEarnings)) ? Math.max(0, v.netEarnings) : 0; const rate = (typeof v.seRate === 'number' && isFinite(v.seRate)) ? Math.max(0, v.seRate) : 0; const seTax = earnings * rate / 100; return {seTax: seTax, netAfterSeTax: earnings - seTax}; }
});
CALCS.push({
  id: 'estimated-quarterly-tax-planner',
  name: 'Estimated quarterly tax planner',
  category: 'Paycheck & Tax',
  blurb: 'Spreads an annual tax estimate over the remaining quarterly payments.',
  formula: 'Quarterly payment = (annual tax estimate - payments already made) / quarters remaining; remaining total = annual tax estimate - payments already made.',
  limits: 'Annual estimate and payments already made are your own figures, not an IRS calculation, and this does not check due dates, penalties, or safe-harbour rules. Educational only, not tax advice.',
  inputs: [{key: 'annualEstimate', label: 'Annual tax estimate ($)', value: 12000, step: 100, min: 0}, {key: 'alreadyPaid', label: 'Payments already made ($)', value: 0, step: 100, min: 0}, {key: 'quartersRemaining', label: 'Quarters remaining (count)', value: 4, step: 1, min: 0}],
  outputs: [{key: 'quarterlyPayment', label: 'Payment per quarter', format: 'money'}, {key: 'remainingTotal', label: 'Total remaining to pay', format: 'money'}],
  compute: (v) => { const annual = (typeof v.annualEstimate === 'number' && isFinite(v.annualEstimate)) ? Math.max(0, v.annualEstimate) : 0; const paid = (typeof v.alreadyPaid === 'number' && isFinite(v.alreadyPaid)) ? Math.max(0, v.alreadyPaid) : 0; const quarters = (typeof v.quartersRemaining === 'number' && isFinite(v.quartersRemaining)) ? Math.max(0, v.quartersRemaining) : 0; const remainingTotal = annual - paid; return {quarterlyPayment: quarters > 0 ? remainingTotal / quarters : null, remainingTotal: remainingTotal}; }
});
CALCS.push({
  id: 'tax-refund-owed-estimator',
  name: 'Tax refund / amount-owed estimator',
  category: 'Paycheck & Tax',
  blurb: 'Compares tax withheld with your estimated liability to show a refund or an amount owed.',
  formula: 'Refund = max(0, withholding - liability); amount owed = max(0, liability - withholding).',
  limits: 'Withholding and liability are figures you enter, not a filed return or an IRS calculation, and credits, deductions, and penalties are not included. Educational only, not tax advice.',
  inputs: [{key: 'withholding', label: 'Tax withheld ($)', value: 10000, step: 100, min: 0}, {key: 'liability', label: 'Estimated tax liability ($)', value: 9500, step: 100, min: 0}],
  outputs: [{key: 'refund', label: 'Estimated refund', format: 'money'}, {key: 'amountOwed', label: 'Estimated amount owed', format: 'money'}],
  compute: (v) => { const withholding = (typeof v.withholding === 'number' && isFinite(v.withholding)) ? Math.max(0, v.withholding) : 0; const liability = (typeof v.liability === 'number' && isFinite(v.liability)) ? Math.max(0, v.liability) : 0; return {refund: Math.max(0, withholding - liability), amountOwed: Math.max(0, liability - withholding)}; }
});
CALCS.push({
  id: 'roth-vs-traditional-comparison',
  name: 'Roth vs traditional contribution comparison',
  category: 'Paycheck & Tax',
  blurb: 'Compares tax paid now on a Roth contribution with tax paid later on a traditional contribution.',
  formula: 'Roth tax now = contribution x current rate / 100; traditional tax later = contribution x retirement rate / 100; tax difference = traditional tax later - Roth tax now.',
  limits: 'Both rates are assumptions you enter, not verified current or future tax rates, and this comparison ignores investment growth, contribution limits, and withdrawal rules. Educational only, not tax advice.',
  inputs: [{key: 'contribution', label: 'Contribution ($)', value: 7000, step: 100, min: 0}, {key: 'currentRate', label: 'Current tax rate assumed (%)', value: 22, step: 1, min: 0}, {key: 'retirementRate', label: 'Retirement tax rate assumed (%)', value: 15, step: 1, min: 0}],
  outputs: [{key: 'rothTaxNow', label: 'Roth tax paid now', format: 'money'}, {key: 'traditionalTaxLater', label: 'Traditional tax paid later', format: 'money'}, {key: 'taxDifference', label: 'Tax difference (traditional later minus Roth now)', format: 'money'}, {key: 'cheaperOption', label: 'Cheaper option on these rates', format: 'text'}],
  compute: (v) => { const contribution = (typeof v.contribution === 'number' && isFinite(v.contribution)) ? Math.max(0, v.contribution) : 0; const current = (typeof v.currentRate === 'number' && isFinite(v.currentRate)) ? Math.max(0, v.currentRate) : 0; const retirement = (typeof v.retirementRate === 'number' && isFinite(v.retirementRate)) ? Math.max(0, v.retirementRate) : 0; const rothTaxNow = contribution * current / 100; const traditionalTaxLater = contribution * retirement / 100; return {rothTaxNow: rothTaxNow, traditionalTaxLater: traditionalTaxLater, taxDifference: traditionalTaxLater - rothTaxNow, cheaperOption: rothTaxNow < traditionalTaxLater ? 'Roth cheaper on these rates' : (traditionalTaxLater < rothTaxNow ? 'Traditional cheaper on these rates' : 'Equal on these rates')}; }
});
CALCS.push({
  id: 'state-tax-comparison',
  name: 'State tax comparison',
  category: 'Paycheck & Tax',
  blurb: 'Compares estimated state tax in two states using rates you enter for each.',
  formula: 'State tax = income x state rate / 100 for each state; difference = State B tax - State A tax.',
  limits: 'No state rates are hardcoded; both rates are assumptions you enter, not verified current state rates, and this does not include local taxes, credits, or deductions. Educational only, not tax advice.',
  inputs: [{key: 'income', label: 'Annual income ($)', value: 60000, step: 1000, min: 0}, {key: 'stateARate', label: 'State A tax rate assumed (%)', value: 5, step: 0.1, min: 0}, {key: 'stateBRate', label: 'State B tax rate assumed (%)', value: 7, step: 0.1, min: 0}],
  outputs: [{key: 'stateATax', label: 'State A tax', format: 'money'}, {key: 'stateBTax', label: 'State B tax', format: 'money'}, {key: 'difference', label: 'Difference (State B minus State A)', format: 'money'}],
  compute: (v) => { const income = (typeof v.income === 'number' && isFinite(v.income)) ? Math.max(0, v.income) : 0; const rateA = (typeof v.stateARate === 'number' && isFinite(v.stateARate)) ? Math.max(0, v.stateARate) : 0; const rateB = (typeof v.stateBRate === 'number' && isFinite(v.stateBRate)) ? Math.max(0, v.stateBRate) : 0; const stateATax = income * rateA / 100; const stateBTax = income * rateB / 100; return {stateATax: stateATax, stateBTax: stateBTax, difference: stateBTax - stateATax}; }
});

CALCS.push({
  id: 'budget-splitter-503020',
  name: '50/30/20 budget splitter',
  category: 'Budgeting & Everyday Money',
  blurb: 'Splits your monthly income into needs, wants, and savings using the 50/30/20 rule of thumb.',
  formula: 'Needs = income x 0.50; Wants = income x 0.30; Savings = income x 0.20.',
  limits: 'A rule of thumb, not a personalised budget: it does not account for debt, irregular income, or local living costs.',
  inputs: [{key: 'income', label: 'Monthly income ($)', value: 4000, step: 100, min: 0}],
  outputs: [{key: 'needs', label: 'Needs (50%)', format: 'money'}, {key: 'wants', label: 'Wants (30%)', format: 'money'}, {key: 'savings', label: 'Savings (20%)', format: 'money'}],
  compute: (v) => ({needs: (v.income || 0) * 0.5, wants: (v.income || 0) * 0.3, savings: (v.income || 0) * 0.2})
});
CALCS.push({
  id: 'zero-based-budget-builder',
  name: 'Zero-based budget builder',
  category: 'Budgeting & Everyday Money',
  blurb: 'Assigns every dollar of income to a category and shows what is left over.',
  formula: 'Allocated = category 1 + category 2 + category 3 + category 4; Leftover = income - allocated.',
  limits: 'Covers up to 4 categories; a negative leftover means the categories add up to more than the income.',
  inputs: [{key: 'income', label: 'Monthly income ($)', value: 4000, step: 100, min: 0}, {key: 'category1', label: 'Category 1 ($)', value: 1500, step: 50, min: 0}, {key: 'category2', label: 'Category 2 ($)', value: 600, step: 50, min: 0}, {key: 'category3', label: 'Category 3 ($)', value: 300, step: 50, min: 0}, {key: 'category4', label: 'Category 4 ($)', value: 400, step: 50, min: 0}],
  outputs: [{key: 'allocated', label: 'Total allocated', format: 'money'}, {key: 'leftover', label: 'Leftover', format: 'money'}, {key: 'leftoverPercent', label: 'Leftover share of income', format: 'percent'}],
  compute: (v) => ({allocated: (v.category1 || 0) + (v.category2 || 0) + (v.category3 || 0) + (v.category4 || 0), leftover: (v.income || 0) - ((v.category1 || 0) + (v.category2 || 0) + (v.category3 || 0) + (v.category4 || 0)), leftoverPercent: (v.income || 0) > 0 ? ((v.income || 0) - ((v.category1 || 0) + (v.category2 || 0) + (v.category3 || 0) + (v.category4 || 0))) / (v.income || 0) * 100 : null})
});
CALCS.push({
  id: 'budget-vs-actual-tracker',
  name: 'Monthly budget vs actual tracker',
  category: 'Budgeting & Everyday Money',
  blurb: 'Compares what you planned to spend with what you actually spent across four categories.',
  formula: 'Total planned = sum of planned amounts; Total actual = sum of actual amounts; Difference = total actual - total planned.',
  limits: 'Covers four categories only (needs, housing, food, fun); a positive difference means you spent more than planned.',
  inputs: [{key: 'needsPlanned', label: 'Needs planned ($)', value: 2000, step: 50, min: 0}, {key: 'needsActual', label: 'Needs actual ($)', value: 1900, step: 50, min: 0}, {key: 'housingPlanned', label: 'Housing planned ($)', value: 1500, step: 50, min: 0}, {key: 'housingActual', label: 'Housing actual ($)', value: 1500, step: 50, min: 0}, {key: 'foodPlanned', label: 'Food planned ($)', value: 600, step: 50, min: 0}, {key: 'foodActual', label: 'Food actual ($)', value: 650, step: 50, min: 0}, {key: 'funPlanned', label: 'Fun planned ($)', value: 400, step: 50, min: 0}, {key: 'funActual', label: 'Fun actual ($)', value: 500, step: 50, min: 0}],
  outputs: [{key: 'totalPlanned', label: 'Total planned', format: 'money'}, {key: 'totalActual', label: 'Total actual', format: 'money'}, {key: 'difference', label: 'Over (+) / under (-) budget', format: 'money'}, {key: 'differencePercent', label: 'Difference vs planned', format: 'percent'}],
  compute: (v) => ({totalPlanned: (v.needsPlanned || 0) + (v.housingPlanned || 0) + (v.foodPlanned || 0) + (v.funPlanned || 0), totalActual: (v.needsActual || 0) + (v.housingActual || 0) + (v.foodActual || 0) + (v.funActual || 0), difference: ((v.needsActual || 0) + (v.housingActual || 0) + (v.foodActual || 0) + (v.funActual || 0)) - ((v.needsPlanned || 0) + (v.housingPlanned || 0) + (v.foodPlanned || 0) + (v.funPlanned || 0)), differencePercent: ((v.needsPlanned || 0) + (v.housingPlanned || 0) + (v.foodPlanned || 0) + (v.funPlanned || 0)) > 0 ? (((v.needsActual || 0) + (v.housingActual || 0) + (v.foodActual || 0) + (v.funActual || 0)) - ((v.needsPlanned || 0) + (v.housingPlanned || 0) + (v.foodPlanned || 0) + (v.funPlanned || 0))) / ((v.needsPlanned || 0) + (v.housingPlanned || 0) + (v.foodPlanned || 0) + (v.funPlanned || 0)) * 100 : null})
});
CALCS.push({
  id: 'subscription-cost-calculator',
  name: 'Subscription cost calculator',
  category: 'Budgeting & Everyday Money',
  blurb: 'Turns a monthly subscription cost into its annual cost and its cost per use.',
  formula: 'Annual cost = monthly cost x 12; Annual uses = uses per month x 12; Cost per use = annual cost / annual uses.',
  limits: 'Assumes the monthly cost and usage stay the same all year; it does not include price rises, free trials, or taxes.',
  inputs: [{key: 'monthlyCost', label: 'Monthly subscription cost ($)', value: 45, step: 5, min: 0}, {key: 'usesPerMonth', label: 'Uses per month (uses)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'annualCost', label: 'Annual cost', format: 'money'}, {key: 'annualUses', label: 'Annual uses', format: 'integer'}, {key: 'costPerUse', label: 'Cost per use', format: 'money'}],
  compute: (v) => ({annualCost: (v.monthlyCost || 0) * 12, annualUses: (v.usesPerMonth || 0) * 12, costPerUse: (v.usesPerMonth || 0) > 0 ? (v.monthlyCost || 0) / (v.usesPerMonth || 0) : null})
});
CALCS.push({
  id: 'cost-per-use-calculator',
  name: 'Cost per use calculator',
  category: 'Budgeting & Everyday Money',
  blurb: 'Divides what you pay, less any resale value, by how many times you expect to use something.',
  formula: 'Net cost = price - resale value; Cost per use = net cost / expected uses.',
  limits: 'The result is only as good as the expected-uses guess; it ignores maintenance, consumables, and the time value of money.',
  inputs: [{key: 'price', label: 'Purchase price ($)', value: 120, step: 10, min: 0}, {key: 'resaleValue', label: 'Resale value ($)', value: 0, step: 10, min: 0}, {key: 'expectedUses', label: 'Expected uses (uses)', value: 60, step: 1, min: 0}],
  outputs: [{key: 'netCost', label: 'Net cost', format: 'money'}, {key: 'costPerUse', label: 'Cost per use', format: 'money'}],
  compute: (v) => ({netCost: (v.price || 0) - (v.resaleValue || 0), costPerUse: (v.expectedUses || 0) > 0 ? ((v.price || 0) - (v.resaleValue || 0)) / (v.expectedUses || 0) : null})
});
CALCS.push({
  id: 'buy-vs-rent-calculator',
  name: 'Buy vs rent a tool/item',
  category: 'Budgeting & Everyday Money',
  blurb: 'Compares buying an item outright with renting it per use, and shows how many uses make buying cheaper.',
  formula: 'Break-even uses = purchase price / rental cost per use; Rent total = rental cost per use x planned uses.',
  limits: 'Ignores maintenance, storage, resale value, and availability; renting may still win if you need the item rarely or urgently.',
  inputs: [{key: 'purchasePrice', label: 'Purchase price ($)', value: 200, step: 10, min: 0}, {key: 'rentalPerUse', label: 'Rental cost per use ($)', value: 15, step: 1, min: 0}, {key: 'plannedUses', label: 'Planned uses (uses)', value: 12, step: 1, min: 0}],
  outputs: [{key: 'breakEvenUses', label: 'Break-even uses', format: 'number'}, {key: 'buyTotal', label: 'Total cost to buy', format: 'money'}, {key: 'rentTotal', label: 'Total cost to rent', format: 'money'}, {key: 'cheaper', label: 'Cheaper option', format: 'text'}],
  compute: (v) => ({breakEvenUses: (v.rentalPerUse || 0) > 0 ? (v.purchasePrice || 0) / (v.rentalPerUse || 0) : null, buyTotal: (v.purchasePrice || 0), rentTotal: (v.rentalPerUse || 0) * (v.plannedUses || 0), cheaper: (v.purchasePrice || 0) < (v.rentalPerUse || 0) * (v.plannedUses || 0) ? 'Buy' : (v.purchasePrice || 0) > (v.rentalPerUse || 0) * (v.plannedUses || 0) ? 'Rent' : 'Tie'})
});
CALCS.push({
  id: 'grocery-budget-planner',
  name: 'Grocery budget planner',
  category: 'Budgeting & Everyday Money',
  blurb: 'Turns a weekly grocery spend into monthly and annual totals, split per person in the household.',
  formula: 'Annual = weekly spend x 52; Monthly = annual / 12; Per-person amounts = total / household size.',
  limits: 'Assumes weekly spending stays the same all year; it does not split adults and children or seasonal food prices.',
  inputs: [{key: 'weeklySpend', label: 'Weekly grocery spend ($)', value: 150, step: 10, min: 0}, {key: 'householdSize', label: 'Household size (people)', value: 3, step: 1, min: 0}],
  outputs: [{key: 'monthlyTotal', label: 'Monthly total', format: 'money'}, {key: 'annualTotal', label: 'Annual total', format: 'money'}, {key: 'perPersonWeekly', label: 'Per person, weekly', format: 'money'}, {key: 'perPersonMonthly', label: 'Per person, monthly', format: 'money'}],
  compute: (v) => ({monthlyTotal: (v.weeklySpend || 0) * 52 / 12, annualTotal: (v.weeklySpend || 0) * 52, perPersonWeekly: (v.householdSize || 0) > 0 ? (v.weeklySpend || 0) / (v.householdSize || 0) : null, perPersonMonthly: (v.householdSize || 0) > 0 ? (v.weeklySpend || 0) * 52 / 12 / (v.householdSize || 0) : null})
});
CALCS.push({
  id: 'sinking-fund-calculator',
  name: 'Sinking fund calculator',
  category: 'Budgeting & Everyday Money',
  blurb: 'Works out how much to set aside each month to reach a savings goal by a deadline.',
  formula: 'Amount still to save = goal - already saved (floored at 0); Monthly set-aside = amount still to save / months.',
  limits: 'Assumes no interest earned and no change to the goal; set-aside is 0 once the goal is already reached.',
  inputs: [{key: 'goal', label: 'Savings goal ($)', value: 1200, step: 100, min: 0}, {key: 'alreadySaved', label: 'Already saved ($)', value: 0, step: 50, min: 0}, {key: 'months', label: 'Months to save (months)', value: 12, step: 1, min: 0}],
  outputs: [{key: 'toSave', label: 'Still to save', format: 'money'}, {key: 'monthlyNeeded', label: 'Monthly set-aside', format: 'money'}, {key: 'weeklyEquivalent', label: 'Weekly equivalent', format: 'money'}],
  compute: (v) => ({toSave: Math.max(0, (v.goal || 0) - (v.alreadySaved || 0)), monthlyNeeded: (v.months || 0) > 0 ? Math.max(0, (v.goal || 0) - (v.alreadySaved || 0)) / (v.months || 0) : null, weeklyEquivalent: (v.months || 0) > 0 ? Math.max(0, (v.goal || 0) - (v.alreadySaved || 0)) / (v.months || 0) * 12 / 52 : null})
});
CALCS.push({
  id: 'emergency-fund-calculator',
  name: 'Emergency fund calculator',
  category: 'Budgeting & Everyday Money',
  blurb: 'Sets an emergency-fund target from your monthly expenses and shows how far your current savings get you.',
  formula: 'Target = monthly expenses x months of cover; Shortfall = target - current savings; Cover = current savings / target x 100.',
  limits: 'Months of cover is your own choice, not a rule; the target uses essential or total expenses only as you enter them.',
  inputs: [{key: 'monthlyExpenses', label: 'Monthly expenses ($)', value: 3000, step: 100, min: 0}, {key: 'monthsCover', label: 'Months of cover (months)', value: 6, step: 1, min: 0}, {key: 'currentSavings', label: 'Current emergency savings ($)', value: 5000, step: 100, min: 0}],
  outputs: [{key: 'target', label: 'Emergency fund target', format: 'money'}, {key: 'shortfall', label: 'Shortfall', format: 'money'}, {key: 'coverPercent', label: 'Cover achieved', format: 'percent'}],
  compute: (v) => ({target: (v.monthlyExpenses || 0) * (v.monthsCover || 0), shortfall: Math.max(0, (v.monthlyExpenses || 0) * (v.monthsCover || 0) - (v.currentSavings || 0)), coverPercent: (v.monthlyExpenses || 0) * (v.monthsCover || 0) > 0 ? (v.currentSavings || 0) / ((v.monthlyExpenses || 0) * (v.monthsCover || 0)) * 100 : null})
});
CALCS.push({
  id: 'spending-leak-finder',
  name: 'Spending leak finder',
  category: 'Budgeting & Everyday Money',
  blurb: 'Adds up small recurring spends to reveal what they cost each month and each year.',
  formula: 'Monthly total = leak 1 + leak 2 + leak 3 + leak 4; Annual total = monthly total x 12.',
  limits: 'Covers up to 4 recurring spends entered as monthly amounts; it does not judge whether a spend is worth it.',
  inputs: [{key: 'leak1', label: 'Recurring spend 1, monthly ($)', value: 30, step: 5, min: 0}, {key: 'leak2', label: 'Recurring spend 2, monthly ($)', value: 20, step: 5, min: 0}, {key: 'leak3', label: 'Recurring spend 3, monthly ($)', value: 15, step: 5, min: 0}, {key: 'leak4', label: 'Recurring spend 4, monthly ($)', value: 10, step: 5, min: 0}],
  outputs: [{key: 'monthlyTotal', label: 'Monthly total', format: 'money'}, {key: 'annualTotal', label: 'Annual total', format: 'money'}, {key: 'dailyEquivalent', label: 'Daily equivalent', format: 'money'}],
  compute: (v) => ({monthlyTotal: (v.leak1 || 0) + (v.leak2 || 0) + (v.leak3 || 0) + (v.leak4 || 0), annualTotal: ((v.leak1 || 0) + (v.leak2 || 0) + (v.leak3 || 0) + (v.leak4 || 0)) * 12, dailyEquivalent: ((v.leak1 || 0) + (v.leak2 || 0) + (v.leak3 || 0) + (v.leak4 || 0)) * 12 / 365})
});
CALCS.push({
  id: 'bill-increase-impact',
  name: 'Bill increase impact',
  category: 'Budgeting & Everyday Money',
  blurb: 'Shows what a rise in a single bill costs each month and each year, in dollars and percent.',
  formula: 'Monthly increase = new bill - old bill; Annual increase = monthly increase x 12; Percent increase = monthly increase / old bill x 100.',
  limits: 'Covers one bill only; it assumes the new bill stays at the new amount for a full year.',
  inputs: [{key: 'oldBill', label: 'Old monthly bill ($)', value: 120, step: 5, min: 0}, {key: 'newBill', label: 'New monthly bill ($)', value: 135, step: 5, min: 0}],
  outputs: [{key: 'monthlyIncrease', label: 'Monthly increase', format: 'money'}, {key: 'annualIncrease', label: 'Annual increase', format: 'money'}, {key: 'percentIncrease', label: 'Percent increase', format: 'percent'}],
  compute: (v) => ({monthlyIncrease: (v.newBill || 0) - (v.oldBill || 0), annualIncrease: ((v.newBill || 0) - (v.oldBill || 0)) * 12, percentIncrease: (v.oldBill || 0) > 0 ? ((v.newBill || 0) - (v.oldBill || 0)) / (v.oldBill || 0) * 100 : null})
});
CALCS.push({
  id: 'no-spend-challenge-tracker',
  name: 'No-spend challenge tracker',
  category: 'Budgeting & Everyday Money',
  blurb: 'Tracks how much a no-spend challenge has saved so far and what it would save if completed.',
  formula: 'Saved so far = daily spend avoided x days completed; Projected total = daily spend avoided x challenge days; Progress = days completed / challenge days x 100.',
  limits: 'Assumes the same amount is avoided every day; it does not count spending shifted to before or after the challenge.',
  inputs: [{key: 'dailySpendAvoided', label: 'Daily spend avoided ($)', value: 25, step: 5, min: 0}, {key: 'daysCompleted', label: 'Days completed (days)', value: 14, step: 1, min: 0}, {key: 'challengeDays', label: 'Challenge length (days)', value: 30, step: 1, min: 0}],
  outputs: [{key: 'savedSoFar', label: 'Saved so far', format: 'money'}, {key: 'projectedTotal', label: 'Projected total if completed', format: 'money'}, {key: 'progressPercent', label: 'Challenge progress', format: 'percent'}, {key: 'daysRemaining', label: 'Days remaining', format: 'integer'}],
  compute: (v) => ({savedSoFar: (v.dailySpendAvoided || 0) * (v.daysCompleted || 0), projectedTotal: (v.dailySpendAvoided || 0) * (v.challengeDays || 0), progressPercent: (v.challengeDays || 0) > 0 ? (v.daysCompleted || 0) / (v.challengeDays || 0) * 100 : null, daysRemaining: Math.max(0, (v.challengeDays || 0) - (v.daysCompleted || 0))})
});

CALCS.push({id: 'loan-payment', name: 'Loan payment calculator', category: 'Debt, Loans & Credit', blurb: 'Works out the monthly payment, total paid, and total interest for a loan.', formula: 'Monthly payment = principal x monthly rate / (1 - (1 + monthly rate) ^ -number of payments), where monthly rate = annual rate / 12 / 100; if the rate is 0, payment = principal / number of payments.', limits: 'Assumes a fixed rate, equal monthly payments, and no fees, extra payments, or missed payments.', inputs: [{key: 'principal', label: 'Loan amount ($)', value: 20000, step: 1000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 6, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 5, step: 1, min: 0}], outputs: [{key: 'payment', label: 'Monthly payment', format: 'money'}, {key: 'totalPaid', label: 'Total paid', format: 'money'}, {key: 'totalInterest', label: 'Total interest', format: 'money'}], compute: (v) => { const n = v.termYears * 12; const r = v.annualRate / 12 / 100; if (v.principal <= 0 || n <= 0) return {payment: 0, totalPaid: 0, totalInterest: 0}; const payment = r === 0 ? v.principal / n : v.principal * r / (1 - Math.pow(1 + r, -n)); const totalPaid = payment * n; return {payment: payment, totalPaid: totalPaid, totalInterest: totalPaid - v.principal}; }});
CALCS.push({id: 'loan-payoff-extra-payment', name: 'Loan payoff: extra payment impact', category: 'Debt, Loans & Credit', blurb: 'Shows how many months and how much interest an extra monthly payment saves on a loan.', formula: 'Base payment from the standard loan payment formula, then month-by-month simulation: interest is added first, then the payment is subtracted, for the base payment and for the base payment plus the extra payment.', limits: 'Assumes a fixed rate, no fees, and that the extra payment is made every month until payoff; simulation stops at 1200 months.', inputs: [{key: 'principal', label: 'Loan amount ($)', value: 20000, step: 1000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 6, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 5, step: 1, min: 0}, {key: 'extraPayment', label: 'Extra monthly payment ($)', value: 100, step: 10, min: 0}], outputs: [{key: 'baseMonths', label: 'Months without extra payment', format: 'months'}, {key: 'extraMonths', label: 'Months with extra payment', format: 'months'}, {key: 'monthsSaved', label: 'Months saved', format: 'integer'}, {key: 'baseInterest', label: 'Interest without extra payment', format: 'money'}, {key: 'extraInterest', label: 'Interest with extra payment', format: 'money'}, {key: 'interestSaved', label: 'Interest saved', format: 'money'}], compute: (v) => { if (v.principal <= 0) return {baseMonths: 0, extraMonths: 0, monthsSaved: 0, baseInterest: 0, extraInterest: 0, interestSaved: 0}; const n = v.termYears * 12; const r = v.annualRate / 12 / 100; if (n <= 0) return {baseMonths: null, extraMonths: null, monthsSaved: null, baseInterest: 0, extraInterest: 0, interestSaved: 0}; const basePayment = r === 0 ? v.principal / n : v.principal * r / (1 - Math.pow(1 + r, -n)); const simulate = (pay: number) => { let balance = v.principal; let months = 0; let interest = 0; while (balance > 0.005 && months < 1200) { const mInterest = balance * r; if (pay <= mInterest) return {months: null, interest: interest}; interest += mInterest; balance += mInterest - pay; months += 1; if (balance < 0) balance = 0; } if (balance > 0.005) return {months: null, interest: interest}; return {months: months, interest: interest}; }; const base = simulate(basePayment); const extra = simulate(basePayment + v.extraPayment); return {baseMonths: base.months, extraMonths: extra.months, monthsSaved: base.months === null || extra.months === null ? null : base.months - extra.months, baseInterest: base.interest, extraInterest: extra.interest, interestSaved: base.interest - extra.interest}; }});
CALCS.push({id: 'debt-avalanche-vs-snowball', name: 'Debt avalanche vs snowball comparison', category: 'Debt, Loans & Credit', blurb: 'Compares paying three debts off by highest APR first (avalanche) versus smallest balance first (snowball).', formula: 'Each month, interest accrues on each balance, minimum payments are paid, and the remaining payment goes to the priority debt: highest APR for avalanche, smallest balance for snowball.', limits: 'Uses the three debts and one total monthly payment entered; assumes fixed APRs, no new borrowing, no fees, and that minimums stay the same until a debt is cleared; simulation stops at 1200 months.', inputs: [{key: 'debt1Balance', label: 'Debt 1 balance ($)', value: 5000, step: 100, min: 0}, {key: 'debt1Apr', label: 'Debt 1 APR (%)', value: 20, step: 0.1, min: 0}, {key: 'debt1Minimum', label: 'Debt 1 minimum payment ($)', value: 100, step: 10, min: 0}, {key: 'debt2Balance', label: 'Debt 2 balance ($)', value: 3000, step: 100, min: 0}, {key: 'debt2Apr', label: 'Debt 2 APR (%)', value: 15, step: 0.1, min: 0}, {key: 'debt2Minimum', label: 'Debt 2 minimum payment ($)', value: 75, step: 10, min: 0}, {key: 'debt3Balance', label: 'Debt 3 balance ($)', value: 1000, step: 100, min: 0}, {key: 'debt3Apr', label: 'Debt 3 APR (%)', value: 10, step: 0.1, min: 0}, {key: 'debt3Minimum', label: 'Debt 3 minimum payment ($)', value: 50, step: 10, min: 0}, {key: 'totalPayment', label: 'Total monthly payment ($)', value: 500, step: 10, min: 0}], outputs: [{key: 'avalancheMonths', label: 'Avalanche months to debt-free', format: 'months'}, {key: 'avalancheInterest', label: 'Avalanche total interest', format: 'money'}, {key: 'snowballMonths', label: 'Snowball months to debt-free', format: 'months'}, {key: 'snowballInterest', label: 'Snowball total interest', format: 'money'}], compute: (v) => { const simulate = (order: string) => { const debts = [{balance: v.debt1Balance, apr: v.debt1Apr, minimum: v.debt1Minimum}, {balance: v.debt2Balance, apr: v.debt2Apr, minimum: v.debt2Minimum}, {balance: v.debt3Balance, apr: v.debt3Apr, minimum: v.debt3Minimum}]; let months = 0; let totalInterest = 0; while (debts.some((d) => d.balance > 0.005) && months < 1200) { let monthInterest = 0; debts.forEach((d) => { if (d.balance > 0.005) { const interest = d.balance * d.apr / 12 / 100; d.balance += interest; monthInterest += interest; totalInterest += interest; } }); if (v.totalPayment <= monthInterest) return {months: null, interest: totalInterest}; let remaining = v.totalPayment; debts.forEach((d) => { if (remaining > 0 && d.balance > 0.005) { const pay = Math.min(d.minimum, d.balance, remaining); d.balance -= pay; remaining -= pay; } }); while (remaining > 0.005 && debts.some((d) => d.balance > 0.005)) { let target: (typeof debts)[number] | null = null; for (const d of debts) { if (d.balance > 0.005) { if (!target) target = d; else if (order === 'avalanche' && d.apr > target.apr) target = d; else if (order === 'snowball' && d.balance < target.balance) target = d; } } if (!target) break; const pay = Math.min(remaining, target.balance); target.balance -= pay; remaining -= pay; } months += 1; } if (debts.some((d) => d.balance > 0.005)) return {months: null, interest: totalInterest}; return {months: months, interest: totalInterest}; }; const avalanche = simulate('avalanche'); const snowball = simulate('snowball'); return {avalancheMonths: avalanche.months, avalancheInterest: avalanche.interest, snowballMonths: snowball.months, snowballInterest: snowball.interest}; }});
CALCS.push({id: 'credit-card-payoff', name: 'Credit card payoff calculator', category: 'Debt, Loans & Credit', blurb: 'Works out how long a credit card balance takes to clear at a fixed monthly payment, and how much interest that costs.', formula: 'Each month: interest = balance x APR / 12 / 100, then the payment is subtracted from the balance plus interest, repeated until the balance reaches zero.', limits: 'Assumes a fixed APR, a fixed monthly payment, no new purchases, no fees, and no change to the payment as the balance falls; simulation stops at 1200 months.', inputs: [{key: 'balance', label: 'Card balance ($)', value: 5000, step: 100, min: 0}, {key: 'apr', label: 'APR (%)', value: 22, step: 0.1, min: 0}, {key: 'monthlyPayment', label: 'Monthly payment ($)', value: 200, step: 10, min: 0}], outputs: [{key: 'months', label: 'Months to pay off', format: 'months'}, {key: 'totalInterest', label: 'Total interest', format: 'money'}, {key: 'totalPaid', label: 'Total paid', format: 'money'}], compute: (v) => { let balance = v.balance; let months = 0; let totalInterest = 0; let totalPaid = 0; while (balance > 0.005 && months < 1200) { const interest = balance * v.apr / 12 / 100; if (v.monthlyPayment <= interest) return {months: null, totalInterest: totalInterest, totalPaid: totalPaid}; totalInterest += interest; const pay = Math.min(v.monthlyPayment, balance + interest); balance += interest - pay; totalPaid += pay; months += 1; if (balance < 0) balance = 0; } if (balance > 0.005) return {months: null, totalInterest: totalInterest, totalPaid: totalPaid}; return {months: months, totalInterest: totalInterest, totalPaid: totalPaid}; }});
CALCS.push({id: 'credit-card-minimum-payment-trap', name: 'Credit card minimum-payment trap', category: 'Debt, Loans & Credit', blurb: 'Compares clearing a card balance with a small minimum payment versus a higher fixed payment.', formula: 'Each month: interest = balance x APR / 12 / 100, then the payment is subtracted, repeated for the minimum payment and for the fixed payment separately.', limits: 'Assumes a fixed APR, no new purchases, and no fees; the minimum payment here is a fixed dollar amount entered by the user, not a percentage-based minimum that falls as the balance falls.', inputs: [{key: 'balance', label: 'Card balance ($)', value: 5000, step: 100, min: 0}, {key: 'apr', label: 'APR (%)', value: 22, step: 0.1, min: 0}, {key: 'minimumPayment', label: 'Minimum payment ($)', value: 100, step: 10, min: 0}, {key: 'fixedPayment', label: 'Fixed higher payment ($)', value: 250, step: 10, min: 0}], outputs: [{key: 'minMonths', label: 'Months with minimum payment', format: 'months'}, {key: 'minInterest', label: 'Interest with minimum payment', format: 'money'}, {key: 'fixedMonths', label: 'Months with fixed payment', format: 'months'}, {key: 'fixedInterest', label: 'Interest with fixed payment', format: 'money'}, {key: 'monthsSaved', label: 'Months saved', format: 'integer'}, {key: 'interestSaved', label: 'Interest saved', format: 'money'}], compute: (v) => { const simulate = (pay: number) => { let balance = v.balance; let months = 0; let interest = 0; while (balance > 0.005 && months < 1200) { const mInterest = balance * v.apr / 12 / 100; if (pay <= mInterest) return {months: null, interest: interest}; interest += mInterest; const paid = Math.min(pay, balance + mInterest); balance += mInterest - paid; months += 1; if (balance < 0) balance = 0; } if (balance > 0.005) return {months: null, interest: interest}; return {months: months, interest: interest}; }; const min = simulate(v.minimumPayment); const fixed = simulate(v.fixedPayment); return {minMonths: min.months, minInterest: min.interest, fixedMonths: fixed.months, fixedInterest: fixed.interest, monthsSaved: min.months === null || fixed.months === null ? null : min.months - fixed.months, interestSaved: min.interest - fixed.interest}; }});
CALCS.push({id: 'student-loan-payoff', name: 'Student loan payoff planner', category: 'Debt, Loans & Credit', blurb: 'Shows how an extra monthly payment shortens a student loan and reduces its total interest.', formula: 'Base payment from the standard loan payment formula, then month-by-month simulation: interest is added first, then the payment is subtracted, for the base payment and for the base payment plus the extra payment.', limits: 'Assumes a fixed rate, no fees, and that the extra payment is made every month until payoff; it does not model income-driven plans, forgiveness, or rate changes; simulation stops at 1200 months.', inputs: [{key: 'loanBalance', label: 'Student loan balance ($)', value: 30000, step: 1000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 5.5, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 10, step: 1, min: 0}, {key: 'extraPayment', label: 'Extra monthly payment ($)', value: 50, step: 10, min: 0}], outputs: [{key: 'baseMonths', label: 'Months without extra payment', format: 'months'}, {key: 'extraMonths', label: 'Months with extra payment', format: 'months'}, {key: 'monthsSaved', label: 'Months saved', format: 'integer'}, {key: 'baseInterest', label: 'Interest without extra payment', format: 'money'}, {key: 'extraInterest', label: 'Interest with extra payment', format: 'money'}, {key: 'interestSaved', label: 'Interest saved', format: 'money'}], compute: (v) => { if (v.loanBalance <= 0) return {baseMonths: 0, extraMonths: 0, monthsSaved: 0, baseInterest: 0, extraInterest: 0, interestSaved: 0}; const n = v.termYears * 12; const r = v.annualRate / 12 / 100; if (n <= 0) return {baseMonths: null, extraMonths: null, monthsSaved: null, baseInterest: 0, extraInterest: 0, interestSaved: 0}; const basePayment = r === 0 ? v.loanBalance / n : v.loanBalance * r / (1 - Math.pow(1 + r, -n)); const simulate = (pay: number) => { let balance = v.loanBalance; let months = 0; let interest = 0; while (balance > 0.005 && months < 1200) { const mInterest = balance * r; if (pay <= mInterest) return {months: null, interest: interest}; interest += mInterest; balance += mInterest - pay; months += 1; if (balance < 0) balance = 0; } if (balance > 0.005) return {months: null, interest: interest}; return {months: months, interest: interest}; }; const base = simulate(basePayment); const extra = simulate(basePayment + v.extraPayment); return {baseMonths: base.months, extraMonths: extra.months, monthsSaved: base.months === null || extra.months === null ? null : base.months - extra.months, baseInterest: base.interest, extraInterest: extra.interest, interestSaved: base.interest - extra.interest}; }});
CALCS.push({id: 'car-loan-affordability', name: 'Car loan affordability', category: 'Debt, Loans & Credit', blurb: 'Works out the monthly payment and total cost of a car loan after a deposit.', formula: 'Loan amount = car price - deposit; monthly payment from the standard loan payment formula, where monthly rate = annual rate / 12 / 100; if the rate is 0, payment = loan amount / number of payments.', limits: 'Assumes a fixed rate and equal monthly payments; it does not include insurance, tax, registration, or running costs.', inputs: [{key: 'carPrice', label: 'Car price ($)', value: 25000, step: 1000, min: 0}, {key: 'deposit', label: 'Deposit ($)', value: 5000, step: 500, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 7, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 5, step: 1, min: 0}], outputs: [{key: 'loanAmount', label: 'Loan amount', format: 'money'}, {key: 'payment', label: 'Monthly payment', format: 'money'}, {key: 'totalPaid', label: 'Total loan payments', format: 'money'}, {key: 'totalInterest', label: 'Total interest', format: 'money'}, {key: 'totalCost', label: 'Total cost including deposit', format: 'money'}], compute: (v) => { const loanAmount = Math.max(0, v.carPrice - v.deposit); const n = v.termYears * 12; const r = v.annualRate / 12 / 100; if (loanAmount <= 0 || n <= 0) return {loanAmount: loanAmount, payment: 0, totalPaid: 0, totalInterest: 0, totalCost: v.deposit}; const payment = r === 0 ? loanAmount / n : loanAmount * r / (1 - Math.pow(1 + r, -n)); const totalPaid = payment * n; return {loanAmount: loanAmount, payment: payment, totalPaid: totalPaid, totalInterest: totalPaid - loanAmount, totalCost: v.deposit + totalPaid}; }});
CALCS.push({id: 'mortgage-payment', name: 'Mortgage payment calculator', category: 'Debt, Loans & Credit', blurb: 'Works out the monthly mortgage payment, including user-entered tax and insurance.', formula: 'Loan amount = home price - deposit; principal-and-interest payment from the standard loan payment formula, where monthly rate = annual rate / 12 / 100; total monthly payment = principal-and-interest payment + monthly tax + monthly insurance.', limits: 'Assumes a fixed rate and equal monthly payments; tax and insurance are user-entered amounts, not estimates, and fees, rate changes, and private mortgage insurance are not included.', inputs: [{key: 'homePrice', label: 'Home price ($)', value: 400000, step: 10000, min: 0}, {key: 'deposit', label: 'Deposit ($)', value: 80000, step: 5000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 6, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 30, step: 1, min: 0}, {key: 'monthlyTax', label: 'Monthly property tax ($)', value: 300, step: 10, min: 0}, {key: 'monthlyInsurance', label: 'Monthly insurance ($)', value: 150, step: 10, min: 0}], outputs: [{key: 'loanAmount', label: 'Loan amount', format: 'money'}, {key: 'principalInterestPayment', label: 'Principal and interest payment', format: 'money'}, {key: 'totalMonthlyPayment', label: 'Total monthly payment', format: 'money'}, {key: 'totalInterest', label: 'Total interest over the term', format: 'money'}], compute: (v) => { const loanAmount = Math.max(0, v.homePrice - v.deposit); const n = v.termYears * 12; const r = v.annualRate / 12 / 100; if (loanAmount <= 0 || n <= 0) return {loanAmount: loanAmount, principalInterestPayment: 0, totalMonthlyPayment: v.monthlyTax + v.monthlyInsurance, totalInterest: 0}; const payment = r === 0 ? loanAmount / n : loanAmount * r / (1 - Math.pow(1 + r, -n)); return {loanAmount: loanAmount, principalInterestPayment: payment, totalMonthlyPayment: payment + v.monthlyTax + v.monthlyInsurance, totalInterest: payment * n - loanAmount}; }});
CALCS.push({id: 'rent-vs-buy', name: 'Rent vs buy comparison', category: 'Debt, Loans & Credit', blurb: 'Compares monthly renting costs with monthly buying costs for a home.', formula: 'Buying monthly cost = mortgage payment from the standard loan payment formula + monthly ownership costs; monthly difference = buying monthly cost - monthly rent; annual difference = monthly difference x 12.', limits: 'A monthly cash-flow comparison only: it does not include house-price changes, equity built, selling costs, rent rises, or tax effects, and all rates and ownership costs are user-entered.', inputs: [{key: 'monthlyRent', label: 'Monthly rent ($)', value: 2000, step: 50, min: 0}, {key: 'homePrice', label: 'Home price ($)', value: 400000, step: 10000, min: 0}, {key: 'deposit', label: 'Deposit ($)', value: 80000, step: 5000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 6, step: 0.1, min: 0}, {key: 'termYears', label: 'Term (years)', value: 30, step: 1, min: 0}, {key: 'monthlyOwnershipCosts', label: 'Monthly ownership costs ($)', value: 450, step: 10, min: 0}], outputs: [{key: 'rentMonthly', label: 'Monthly rent', format: 'money'}, {key: 'buyMonthly', label: 'Monthly buying cost', format: 'money'}, {key: 'monthlyDifference', label: 'Monthly difference (buying minus renting)', format: 'money'}, {key: 'annualDifference', label: 'Annual difference (buying minus renting)', format: 'money'}], compute: (v) => { const loanAmount = Math.max(0, v.homePrice - v.deposit); const n = v.termYears * 12; const r = v.annualRate / 12 / 100; let mortgage = 0; if (loanAmount > 0 && n > 0) mortgage = r === 0 ? loanAmount / n : loanAmount * r / (1 - Math.pow(1 + r, -n)); const buyMonthly = mortgage + v.monthlyOwnershipCosts; const monthlyDifference = buyMonthly - v.monthlyRent; return {rentMonthly: v.monthlyRent, buyMonthly: buyMonthly, monthlyDifference: monthlyDifference, annualDifference: monthlyDifference * 12}; }});
CALCS.push({id: 'debt-to-income-ratio', name: 'Debt-to-income ratio calculator', category: 'Debt, Loans & Credit', blurb: 'Works out total monthly debt payments as a percentage of gross monthly income.', formula: 'Debt-to-income ratio = monthly debt payments / gross monthly income x 100.', limits: 'Uses only the monthly debts and gross income entered; it does not judge affordability or approval, and it excludes debts or income not entered.', inputs: [{key: 'monthlyDebts', label: 'Total monthly debt payments ($)', value: 1500, step: 50, min: 0}, {key: 'grossMonthlyIncome', label: 'Gross monthly income ($)', value: 6000, step: 100, min: 0}], outputs: [{key: 'ratio', label: 'Debt-to-income ratio', format: 'percent'}], compute: (v) => ({ratio: v.grossMonthlyIncome <= 0 ? 0 : v.monthlyDebts / v.grossMonthlyIncome * 100})});
CALCS.push({id: 'balance-transfer-break-even', name: 'Balance transfer break-even', category: 'Debt, Loans & Credit', blurb: 'Works out how many months of interest savings it takes to cover a balance transfer fee.', formula: 'Break-even months = transfer fee / monthly interest saved.', limits: 'Assumes the monthly interest saving stays the same each month; it does not include the new card rate after any introductory period, other fees, or changes to the balance.', inputs: [{key: 'transferFee', label: 'Balance transfer fee ($)', value: 150, step: 10, min: 0}, {key: 'monthlySaving', label: 'Monthly interest saved ($)', value: 25, step: 5, min: 0}], outputs: [{key: 'breakEvenMonths', label: 'Months to break even', format: 'months'}, {key: 'annualSaving', label: 'Annual interest saved', format: 'money'}], compute: (v) => ({breakEvenMonths: v.monthlySaving <= 0 ? null : v.transferFee / v.monthlySaving, annualSaving: v.monthlySaving * 12})});

CALCS.push({
  id: 'compound-growth',
  name: 'Compound growth calculator',
  category: 'Saving, Investing & Growth',
  blurb: 'Projects the future value of a starting amount plus regular monthly contributions at an assumed annual return.',
  formula: 'FV = start * (1 + r)^n + monthly * (((1 + r)^n - 1) / r), where r = annual rate / 12 / 100 and n = years * 12; if the rate is 0, FV = start + monthly * n.',
  limits: 'The rate is a user-entered assumption, not a forecast or a guaranteed market return; results ignore taxes, fees and inflation unless you adjust the rate yourself.',
  inputs: [{key: 'start', label: 'Starting amount ($)', value: 5000, step: 500, min: 0}, {key: 'monthly', label: 'Monthly contribution ($)', value: 200, step: 50, min: 0}, {key: 'rate', label: 'Annual return rate (% per year)', value: 5, step: 0.5, min: 0}, {key: 'years', label: 'Time horizon (years)', value: 10, step: 1, min: 0}],
  outputs: [{key: 'futureValue', label: 'Future value', format: 'money'}, {key: 'totalContributions', label: 'Total contributions', format: 'money'}, {key: 'growth', label: 'Growth', format: 'money'}],
  compute: (v) => { const start = v.start || 0; const monthly = v.monthly || 0; const rate = v.rate || 0; const years = v.years || 0; const r = rate / 12 / 100; const n = years * 12; let fv = 0; if (Math.abs(r) < 1e-12) { fv = start + monthly * n; } else { const g = Math.pow(1 + r, n); fv = start * g + monthly * ((g - 1) / r); } if (!isFinite(fv)) { fv = 0; } const total = start + monthly * n; const growth = fv - total; return {futureValue: fv, totalContributions: total, growth: growth}; }
});
CALCS.push({
  id: 'savings-goal-monthly',
  name: 'Savings goal calculator',
  category: 'Saving, Investing & Growth',
  blurb: 'Works out the monthly amount needed to reach a savings target by a given date at an assumed annual return.',
  formula: 'Monthly = (target - start * (1 + r)^n) * r / ((1 + r)^n - 1), where r = annual rate / 12 / 100 and n = years * 12; if the rate is 0, monthly = (target - start) / n; the result is floored at 0.',
  limits: 'The rate is a user-entered assumption, not a guaranteed return; if you already have enough saved, the monthly amount needed is 0.',
  inputs: [{key: 'target', label: 'Target amount ($)', value: 20000, step: 1000, min: 0}, {key: 'start', label: 'Starting amount ($)', value: 5000, step: 500, min: 0}, {key: 'rate', label: 'Annual return rate (% per year)', value: 5, step: 0.5, min: 0}, {key: 'years', label: 'Time to target (years)', value: 5, step: 1, min: 0}],
  outputs: [{key: 'monthlyNeeded', label: 'Monthly amount needed', format: 'money'}],
  compute: (v) => { const target = v.target || 0; const start = v.start || 0; const rate = v.rate || 0; const years = v.years || 0; const r = rate / 12 / 100; const n = years * 12; let monthly = 0; if (n <= 0) { monthly = Math.max(0, target - start); } else if (Math.abs(r) < 1e-12) { monthly = (target - start) / n; } else { const g = Math.pow(1 + r, n); monthly = (target - start * g) * r / (g - 1); } if (!isFinite(monthly)) { monthly = 0; } monthly = Math.max(0, monthly); return {monthlyNeeded: monthly}; }
});
CALCS.push({
  id: 'time-to-savings-goal',
  name: 'Time to reach a savings goal',
  category: 'Saving, Investing & Growth',
  blurb: 'Simulates month by month how long it takes regular savings at an assumed return to reach a target.',
  formula: 'Each month, balance = balance * (1 + annual rate / 12 / 100) + monthly contribution, repeated until the balance reaches the target, up to a cap of 1200 months.',
  limits: 'The rate is a user-entered assumption, not a guaranteed return; the simulation stops at 1200 months (100 years) and reports that the goal was not reached within that time if applicable.',
  inputs: [{key: 'target', label: 'Target amount ($)', value: 20000, step: 1000, min: 0}, {key: 'start', label: 'Starting amount ($)', value: 1000, step: 500, min: 0}, {key: 'monthly', label: 'Monthly contribution ($)', value: 300, step: 50, min: 0}, {key: 'rate', label: 'Annual return rate (% per year)', value: 5, step: 0.5, min: 0}],
  outputs: [{key: 'months', label: 'Months to reach goal', format: 'integer'}, {key: 'years', label: 'Years to reach goal', format: 'years'}, {key: 'reached', label: 'Goal reached within 1200 months', format: 'text'}],
  compute: (v) => { const target = v.target || 0; let balance = v.start || 0; const monthly = v.monthly || 0; const rate = v.rate || 0; const r = rate / 12 / 100; let months = 0; while (balance < target && months < 1200) { balance = balance * (1 + r) + monthly; months = months + 1; if (!isFinite(balance)) { break; } } const reached = (balance >= target) ? 'Yes' : 'No - not reached within 1200 months'; return {months: months, years: months / 12, reached: reached}; }
});
CALCS.push({
  id: 'lump-sum-vs-monthly',
  name: 'Lump sum vs monthly investing comparison',
  category: 'Saving, Investing & Growth',
  blurb: 'Compares investing the same total amount all at once with spreading it as equal monthly contributions over the same period at the same assumed return.',
  formula: 'Lump sum FV = total * (1 + r)^n; monthly FV = (total / n) * (((1 + r)^n - 1) / r) (or total if the rate is 0), where r = annual rate / 12 / 100 and n = years * 12.',
  limits: 'Both paths use the same user-entered assumed return and the same total invested; the comparison ignores taxes, fees and timing risk, and the rate is not a guaranteed return.',
  inputs: [{key: 'total', label: 'Total amount invested ($)', value: 12000, step: 1000, min: 0}, {key: 'rate', label: 'Annual return rate (% per year)', value: 5, step: 0.5, min: 0}, {key: 'years', label: 'Time horizon (years)', value: 10, step: 1, min: 0}],
  outputs: [{key: 'lumpSumValue', label: 'Lump sum future value', format: 'money'}, {key: 'monthlyValue', label: 'Monthly contributions future value', format: 'money'}, {key: 'difference', label: 'Difference (lump sum minus monthly)', format: 'money'}],
  compute: (v) => { const total = v.total || 0; const rate = v.rate || 0; const years = v.years || 0; const r = rate / 12 / 100; const n = years * 12; let lump = total; let monthlyValue = total; if (n > 0) { const g = Math.pow(1 + r, n); lump = total * g; if (Math.abs(r) < 1e-12) { monthlyValue = total; } else { monthlyValue = (total / n) * ((g - 1) / r); } } if (!isFinite(lump)) { lump = 0; } if (!isFinite(monthlyValue)) { monthlyValue = 0; } return {lumpSumValue: lump, monthlyValue: monthlyValue, difference: lump - monthlyValue}; }
});
CALCS.push({
  id: 'rule-of-72',
  name: 'Rule of 72 / doubling time',
  category: 'Saving, Investing & Growth',
  blurb: 'Estimates how many years it takes money to double at a given annual return rate.',
  formula: 'Rule of 72: years = 72 / rate; exact doubling time: years = ln(2) / ln(1 + rate / 100).',
  limits: 'The rate is a user-entered assumption, not a guaranteed return; the Rule of 72 is an approximation and is closest for rates roughly between 6% and 10% per year.',
  inputs: [{key: 'rate', label: 'Annual return rate (% per year)', value: 6, step: 0.5, min: 0}],
  outputs: [{key: 'ruleOf72Years', label: 'Years to double (Rule of 72)', format: 'years'}, {key: 'exactYears', label: 'Years to double (exact)', format: 'years'}],
  compute: (v) => { const rate = v.rate || 0; let rule = 0; let exact = 0; if (rate > 0) { rule = 72 / rate; const denom = Math.log(1 + rate / 100); if (denom !== 0 && isFinite(denom)) { exact = Math.log(2) / denom; } } if (!isFinite(rule)) { rule = 0; } if (!isFinite(exact)) { exact = 0; } return {ruleOf72Years: rule, exactYears: exact}; }
});
CALCS.push({
  id: 'inflation-adjusted-value',
  name: 'Inflation-adjusted value',
  category: 'Saving, Investing & Growth',
  blurb: 'Shows what an amount will be worth in today\'s purchasing power after inflation, and what it would have been worth in the past.',
  formula: 'Future purchasing power (in today\'s money) = amount / (1 + inflation / 100)^years; past value equivalent = amount * (1 + inflation / 100)^years.',
  limits: 'The inflation rate is a user-entered assumption, not a forecast; the two outputs answer different questions, so check the labels before comparing them.',
  inputs: [{key: 'amount', label: 'Amount ($)', value: 10000, step: 1000, min: 0}, {key: 'years', label: 'Time period (years)', value: 10, step: 1, min: 0}, {key: 'inflation', label: 'Annual inflation rate (% per year)', value: 3, step: 0.5, min: 0}],
  outputs: [{key: 'futurePurchasingPower', label: 'Future purchasing power in today\'s money', format: 'money'}, {key: 'pastValueEquivalent', label: 'Past value equivalent', format: 'money'}],
  compute: (v) => { const amount = v.amount || 0; const years = v.years || 0; const inflation = v.inflation || 0; const factor = Math.pow(1 + inflation / 100, years); let future = amount; let past = amount; if (factor !== 0 && isFinite(factor)) { future = amount / factor; past = amount * factor; } if (!isFinite(future)) { future = 0; } if (!isFinite(past)) { past = 0; } return {futurePurchasingPower: future, pastValueEquivalent: past}; }
});
CALCS.push({
  id: 'real-return',
  name: 'Real return calculator',
  category: 'Saving, Investing & Growth',
  blurb: 'Converts a nominal return into a real return by removing the effect of inflation.',
  formula: 'Real return (%) = ((1 + nominal / 100) / (1 + inflation / 100) - 1) * 100.',
  limits: 'Both rates are user-entered assumptions; the result is not a forecast, and it ignores taxes and fees.',
  inputs: [{key: 'nominal', label: 'Nominal return (% per year)', value: 7, step: 0.5}, {key: 'inflation', label: 'Annual inflation rate (% per year)', value: 3, step: 0.5, min: 0}],
  outputs: [{key: 'realReturn', label: 'Real return', format: 'percent'}],
  compute: (v) => { const nominal = v.nominal || 0; const inflation = v.inflation || 0; const denom = 1 + inflation / 100; let real = 0; if (denom !== 0 && isFinite(denom)) { real = ((1 + nominal / 100) / denom - 1) * 100; } if (!isFinite(real)) { real = 0; } return {realReturn: real}; }
});
CALCS.push({
  id: 'dividend-income',
  name: 'Dividend income estimator',
  category: 'Saving, Investing & Growth',
  blurb: 'Estimates the annual and monthly dividend income from a holding at a given dividend yield.',
  formula: 'Annual dividend = holdings * yield / 100; monthly dividend = annual dividend / 12.',
  limits: 'The yield is a user-entered assumption, not a guaranteed payout; dividends can be cut or stopped, and share prices can fall, so this is an estimate only.',
  inputs: [{key: 'holdings', label: 'Value of holdings ($)', value: 10000, step: 1000, min: 0}, {key: 'yield', label: 'Dividend yield (% per year)', value: 4, step: 0.5, min: 0}],
  outputs: [{key: 'annualDividend', label: 'Annual dividend income', format: 'money'}, {key: 'monthlyDividend', label: 'Monthly dividend income', format: 'money'}],
  compute: (v) => { const holdings = v.holdings || 0; const yieldRate = v.yield || 0; let annual = holdings * yieldRate / 100; if (!isFinite(annual)) { annual = 0; } return {annualDividend: annual, monthlyDividend: annual / 12}; }
});
CALCS.push({
  id: 'investment-fee-drag',
  name: 'Investment fee drag',
  category: 'Saving, Investing & Growth',
  blurb: 'Shows how much an annual fee reduces the future value of a starting balance over time.',
  formula: 'FV without fee = start * (1 + return / 100)^years; FV with fee = start * (1 + (return - fee) / 100)^years; this version uses annual compounding and no monthly contributions.',
  limits: 'Both the return and the fee are user-entered assumptions, not guaranteed figures; this version has no monthly contributions, so it understates fee drag for accounts with ongoing contributions.',
  inputs: [{key: 'start', label: 'Starting balance ($)', value: 10000, step: 1000, min: 0}, {key: 'returnRate', label: 'Annual return before fees (% per year)', value: 7, step: 0.5}, {key: 'fee', label: 'Annual fee (% per year)', value: 1, step: 0.25, min: 0}, {key: 'years', label: 'Time horizon (years)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'valueWithoutFee', label: 'Future value without fee', format: 'money'}, {key: 'valueWithFee', label: 'Future value with fee', format: 'money'}, {key: 'feeCost', label: 'Cost of fees (difference)', format: 'money'}],
  compute: (v) => { const start = v.start || 0; const ret = v.returnRate || 0; const fee = v.fee || 0; const years = v.years || 0; const baseNoFee = 1 + ret / 100; const baseWithFee = 1 + (ret - fee) / 100; let withoutFee = start; let withFee = start; if (baseNoFee > 0) { withoutFee = start * Math.pow(baseNoFee, years); } if (baseWithFee > 0) { withFee = start * Math.pow(baseWithFee, years); } if (!isFinite(withoutFee)) { withoutFee = 0; } if (!isFinite(withFee)) { withFee = 0; } return {valueWithoutFee: withoutFee, valueWithFee: withFee, feeCost: withoutFee - withFee}; }
});
CALCS.push({
  id: 'dollar-cost-averaging',
  name: 'Dollar-cost averaging illustration',
  category: 'Saving, Investing & Growth',
  blurb: 'Illustrates buying a fixed dollar amount each month while the price moves from a starting price to an ending price.',
  formula: 'Total invested = monthly amount * months; average price = (start price + end price) / 2; shares bought = total invested / average price; final value = shares * end price.',
  limits: 'ASSUMPTION: the price rises linearly from the start price to the end price, so the average price is simply (start + end) / 2; real prices do not move in a straight line, and the end price is a user-entered assumption, not a forecast.',
  inputs: [{key: 'monthly', label: 'Monthly amount invested ($)', value: 200, step: 50, min: 0}, {key: 'months', label: 'Number of months (months)', value: 12, step: 1, min: 0}, {key: 'startPrice', label: 'Starting price ($ per share)', value: 50, step: 5, min: 0}, {key: 'endPrice', label: 'Ending price ($ per share)', value: 60, step: 5, min: 0}],
  outputs: [{key: 'totalInvested', label: 'Total invested', format: 'money'}, {key: 'averagePrice', label: 'Average price paid', format: 'money'}, {key: 'shares', label: 'Shares bought', format: 'number'}, {key: 'finalValue', label: 'Final value', format: 'money'}],
  compute: (v) => { const monthly = v.monthly || 0; const months = v.months || 0; const startPrice = v.startPrice || 0; const endPrice = v.endPrice || 0; const total = monthly * months; const avg = (startPrice + endPrice) / 2; let shares = 0; if (avg > 0 && isFinite(avg)) { shares = total / avg; } if (!isFinite(shares)) { shares = 0; } let finalValue = shares * endPrice; if (!isFinite(finalValue)) { finalValue = 0; } return {totalInvested: total, averagePrice: avg, shares: shares, finalValue: finalValue}; }
});
CALCS.push({
  id: 'years-to-one-million',
  name: 'Years to $1M',
  category: 'Saving, Investing & Growth',
  blurb: 'Simulates month by month how long regular savings at an assumed return take to reach a target amount, defaulting to $1,000,000.',
  formula: 'Each month, balance = balance * (1 + annual rate / 12 / 100) + monthly contribution, repeated until the balance reaches the target, up to a cap of 1200 months.',
  limits: 'Illustration only, not a promise: returns are not guaranteed, the assumed rate may not be achieved, and the result ignores taxes, fees and inflation.',
  inputs: [{key: 'target', label: 'Target amount ($)', value: 1000000, step: 50000, min: 0}, {key: 'start', label: 'Starting amount ($)', value: 10000, step: 1000, min: 0}, {key: 'monthly', label: 'Monthly contribution ($)', value: 500, step: 50, min: 0}, {key: 'rate', label: 'Annual return rate (% per year)', value: 7, step: 0.5, min: 0}],
  outputs: [{key: 'months', label: 'Months to reach target', format: 'integer'}, {key: 'years', label: 'Years to reach target', format: 'years'}, {key: 'reached', label: 'Target reached within 1200 months', format: 'text'}],
  compute: (v) => { const target = v.target || 0; let balance = v.start || 0; const monthly = v.monthly || 0; const rate = v.rate || 0; const r = rate / 12 / 100; let months = 0; while (balance < target && months < 1200) { balance = balance * (1 + r) + monthly; months = months + 1; if (!isFinite(balance)) { break; } } const reached = (balance >= target) ? 'Yes' : 'No - not reached within 1200 months'; return {months: months, years: months / 12, reached: reached}; }
});

CALCS.push({
  id: 'retirement-target',
  name: 'Retirement savings target',
  category: 'Retirement & Long-term',
  blurb: 'Estimates a retirement savings target from desired annual spending and years in retirement, with an optional inflation adjustment.',
  formula: 'Base target = annual spending x years in retirement. Adjusted target = base target x (1 + inflation)^years to retirement; if inflation is 0 there is no adjustment.',
  limits: 'A simple illustration only. It does not allow for investment returns, taxes, fees, changing spending, or living longer than the years entered, and the inflation rate entered is an assumption, not a forecast.',
  inputs: [{key: 'annualSpend', label: 'Desired annual spending in retirement ($)', value: 40000, step: 1000, min: 0}, {key: 'yearsInRetirement', label: 'Years in retirement (years)', value: 25, step: 1, min: 0}, {key: 'yearsToRetirement', label: 'Years until retirement (years)', value: 20, step: 1, min: 0}, {key: 'inflation', label: 'Annual inflation assumption (%)', value: 2, step: 0.5, min: 0}],
  outputs: [{key: 'baseTarget', label: 'Target before inflation adjustment', format: 'money0'}, {key: 'adjustedTarget', label: 'Target after inflation adjustment', format: 'money0'}],
  compute: (v) => { const base = v.annualSpend * v.yearsInRetirement; let adjusted = base * Math.pow(1 + v.inflation / 100, v.yearsToRetirement); if (!isFinite(adjusted)) { adjusted = base; } return {baseTarget: base, adjustedTarget: adjusted}; }
});
CALCS.push({
  id: 'retirement-income-gap',
  name: 'Retirement income gap',
  category: 'Retirement & Long-term',
  blurb: 'Compares target retirement income with expected income from pension, Social Security, and other sources to show the remaining gap.',
  formula: 'Expected annual income = pension + Social Security estimate + other income. Annual gap = target annual income - expected annual income. Monthly gap = annual gap / 12.',
  limits: 'The Social Security figure is entered by you and is not an official estimate. A negative gap means expected income covers the target on these inputs; it does not allow for taxes, inflation, or changes in any income source.',
  inputs: [{key: 'targetIncome', label: 'Target annual income in retirement ($)', value: 60000, step: 1000, min: 0}, {key: 'pension', label: 'Expected annual pension income ($)', value: 15000, step: 1000, min: 0}, {key: 'socialSecurity', label: 'Estimated annual Social Security income ($)', value: 20000, step: 1000, min: 0}, {key: 'otherIncome', label: 'Other expected annual income ($)', value: 5000, step: 1000, min: 0}],
  outputs: [{key: 'gapAnnual', label: 'Annual income gap', format: 'money0'}, {key: 'gapMonthly', label: 'Monthly income gap', format: 'money0'}],
  compute: (v) => { const expected = v.pension + v.socialSecurity + v.otherIncome; const gap = v.targetIncome - expected; return {gapAnnual: gap, gapMonthly: gap / 12}; }
});
CALCS.push({
  id: 'retirement-contribution-impact',
  name: '401(k)/retirement contribution impact',
  category: 'Retirement & Long-term',
  blurb: 'Shows how much you and your employer would contribute each year at a chosen contribution rate and employer match.',
  formula: 'Employee contribution = annual pay x contribution %. Employer contribution = annual pay x min(contribution %, match cap %) x match %. Total annual contribution = employee contribution + employer contribution.',
  limits: 'A simple annual illustration only. It does not allow for contribution limits, vesting, taxes, fees, or investment returns, and the match terms entered are assumptions for illustration, not your plan rules.',
  inputs: [{key: 'annualPay', label: 'Annual pay ($)', value: 80000, step: 1000, min: 0}, {key: 'contribution', label: 'Your contribution (%)', value: 10, step: 1, min: 0}, {key: 'match', label: 'Employer match (%)', value: 50, step: 5, min: 0}, {key: 'matchCap', label: 'Match cap (%)', value: 6, step: 1, min: 0}],
  outputs: [{key: 'employee', label: 'Your annual contribution', format: 'money0'}, {key: 'employer', label: 'Employer annual contribution', format: 'money0'}, {key: 'total', label: 'Total annual contribution', format: 'money0'}],
  compute: (v) => { const employee = v.annualPay * v.contribution / 100; const employer = v.annualPay * Math.min(v.contribution, v.matchCap) / 100 * v.match / 100; return {employee: employee, employer: employer, total: employee + employer}; }
});
CALCS.push({
  id: 'employer-match-maximiser',
  name: 'Employer match maximiser',
  category: 'Retirement & Long-term',
  blurb: 'Finds the contribution rate that captures the full employer match and shows what match is lost by contributing less.',
  formula: 'Contribution that captures the full match = match cap %. Employee amount at that rate = annual pay x match cap %. Employer amount at that rate = annual pay x match cap % x match %. Lost employer match = employer amount at the full-match rate - employer amount at your current rate, floored at zero.',
  limits: 'A simple annual illustration only. It does not allow for contribution limits, vesting, taxes, or your actual plan rules; check your plan for the real match formula and cap.',
  inputs: [{key: 'annualPay', label: 'Annual pay ($)', value: 80000, step: 1000, min: 0}, {key: 'match', label: 'Employer match (%)', value: 50, step: 5, min: 0}, {key: 'matchCap', label: 'Match cap (%)', value: 6, step: 1, min: 0}, {key: 'currentContribution', label: 'Your current contribution (%)', value: 3, step: 1, min: 0}],
  outputs: [{key: 'fullMatchRate', label: 'Contribution for the full match', format: 'percent'}, {key: 'employeeAtFullMatch', label: 'Your annual contribution at the full-match rate', format: 'money0'}, {key: 'employerAtFullMatch', label: 'Employer annual contribution at the full-match rate', format: 'money0'}, {key: 'lostMatch', label: 'Employer match lost at your current rate', format: 'money0'}],
  compute: (v) => { const employeeFull = v.annualPay * v.matchCap / 100; const employerFull = employeeFull * v.match / 100; const employerCurrent = v.annualPay * Math.min(v.currentContribution, v.matchCap) / 100 * v.match / 100; return {fullMatchRate: v.matchCap, employeeAtFullMatch: employeeFull, employerAtFullMatch: employerFull, lostMatch: Math.max(0, employerFull - employerCurrent)}; }
});
CALCS.push({
  id: 'early-retirement-savings-rate',
  name: 'Early retirement: savings rate vs years',
  category: 'Retirement & Long-term',
  blurb: 'Simulates how many years it could take to save enough to retire early at a given savings rate and investment return.',
  formula: 'Each year: annual spending = annual income x (1 - savings rate); annual saving = annual income x savings rate; target portfolio = 25 x annual spending; portfolio = portfolio x (1 + return) + annual saving, repeated once a year for up to 100 years until the portfolio reaches the target.',
  limits: 'Illustration only, not a prediction or promise. It assumes income, spending, and return stay constant every year, ignores taxes, fees, inflation, and market ups and downs, and the result is capped at 100 years, which can also mean the target is never reached on these inputs.',
  inputs: [{key: 'annualIncome', label: 'Annual income ($)', value: 80000, step: 1000, min: 0}, {key: 'savingsRate', label: 'Savings rate (%)', value: 50, step: 1, min: 0}, {key: 'annualReturn', label: 'Annual investment return assumption (%)', value: 5, step: 0.5}],
  outputs: [{key: 'annualSpending', label: 'Annual spending', format: 'money0'}, {key: 'targetPortfolio', label: 'Target portfolio (25 x annual spending)', format: 'money0'}, {key: 'yearsToRetire', label: 'Years to reach the target', format: 'years'}],
  compute: (v) => { const rate = Math.min(100, Math.max(0, v.savingsRate)); const spending = v.annualIncome * (1 - rate / 100); const saving = v.annualIncome * rate / 100; const target = 25 * spending; let portfolio = 0; let years = 100; if (target <= 0) { years = 0; } else if (saving > 0) { for (let y = 1; y <= 100; y++) { portfolio = portfolio * (1 + v.annualReturn / 100) + saving; if (portfolio >= target) { years = y; break; } } } return {annualSpending: spending, targetPortfolio: target, yearsToRetire: years}; }
});
CALCS.push({
  id: 'pension-lump-sum-vs-monthly',
  name: 'Pension lump sum vs monthly payments',
  category: 'Retirement & Long-term',
  blurb: 'Compares the total from monthly pension payments over an expected number of years with a lump-sum offer.',
  formula: 'Total from monthly payments = monthly payment x 12 x expected years receiving. Difference = total from monthly payments - lump sum.',
  limits: 'A simple totals comparison only. It does not allow for investment returns on the lump sum, taxes, inflation, fees, or living for a different number of years than entered, and the years figure is an assumption, not a prediction.',
  inputs: [{key: 'monthlyPayment', label: 'Monthly pension payment ($)', value: 2000, step: 100, min: 0}, {key: 'yearsReceiving', label: 'Expected years receiving payments (years)', value: 20, step: 1, min: 0}, {key: 'lumpSum', label: 'Lump sum offered ($)', value: 400000, step: 1000, min: 0}],
  outputs: [{key: 'monthlyTotal', label: 'Total from monthly payments', format: 'money0'}, {key: 'lumpSumAmount', label: 'Lump sum', format: 'money0'}, {key: 'difference', label: 'Monthly-payments total minus lump sum', format: 'money0'}],
  compute: (v) => { const total = v.monthlyPayment * 12 * v.yearsReceiving; return {monthlyTotal: total, lumpSumAmount: v.lumpSum, difference: total - v.lumpSum}; }
});
CALCS.push({
  id: 'social-security-timing',
  name: 'Social Security timing illustration',
  category: 'Retirement & Long-term',
  blurb: 'Compares the total Social Security received to a chosen age under early, full, and late claiming, using monthly amounts you enter.',
  formula: 'Early total = early monthly benefit x 12 x max(0, age you expect to live to - 62). Full total = full monthly benefit x 12 x max(0, age you expect to live to - 67). Late total = late monthly benefit x 12 x max(0, age you expect to live to - 70).',
  limits: 'Not an official estimate: use official calculators for real figures. It assumes benefits stay at the monthly amounts entered, ignores taxes, cost-of-living adjustments, and any change in rules, and the age you expect to live to is an assumption, not a prediction.',
  inputs: [{key: 'earlyMonthly', label: 'Monthly benefit if claiming early ($)', value: 1500, step: 100, min: 0}, {key: 'fullMonthly', label: 'Monthly benefit if claiming at full age ($)', value: 2000, step: 100, min: 0}, {key: 'lateMonthly', label: 'Monthly benefit if claiming late ($)', value: 2600, step: 100, min: 0}, {key: 'liveToAge', label: 'Age you expect to live to (years)', value: 85, step: 1, min: 0}],
  outputs: [{key: 'earlyTotal', label: 'Total if claiming early', format: 'money0'}, {key: 'fullTotal', label: 'Total if claiming at full age', format: 'money0'}, {key: 'lateTotal', label: 'Total if claiming late', format: 'money0'}],
  compute: (v) => { return {earlyTotal: v.earlyMonthly * 12 * Math.max(0, v.liveToAge - 62), fullTotal: v.fullMonthly * 12 * Math.max(0, v.liveToAge - 67), lateTotal: v.lateMonthly * 12 * Math.max(0, v.liveToAge - 70)}; }
});
CALCS.push({
  id: 'withdrawal-rate',
  name: 'Withdrawal rate calculator',
  category: 'Retirement & Long-term',
  blurb: 'Turns a portfolio size and a withdrawal rate into annual and monthly retirement income.',
  formula: 'Annual income = portfolio x withdrawal %. Monthly income = annual income / 12.',
  limits: 'A simple arithmetic illustration only. The withdrawal rate entered is an assumption, not a safe or recommended rate, and it does not allow for investment returns, taxes, fees, inflation, or how long the portfolio would last.',
  inputs: [{key: 'portfolio', label: 'Portfolio value ($)', value: 1000000, step: 10000, min: 0}, {key: 'withdrawalRate', label: 'Annual withdrawal rate (%)', value: 4, step: 0.5, min: 0}],
  outputs: [{key: 'annualIncome', label: 'Annual income', format: 'money'}, {key: 'monthlyIncome', label: 'Monthly income', format: 'money'}],
  compute: (v) => { const annual = v.portfolio * v.withdrawalRate / 100; return {annualIncome: annual, monthlyIncome: annual / 12}; }
});
CALCS.push({
  id: 'retirement-drawdown-planner',
  name: 'Retirement drawdown planner',
  category: 'Retirement & Long-term',
  blurb: 'Simulates how many years a retirement portfolio lasts given annual spending and an investment return.',
  formula: 'Each year: portfolio = portfolio x (1 + return) - annual spend, repeated once a year for up to 100 years until the portfolio reaches zero or below; the years counted are the years simulated before it runs out.',
  limits: 'Illustration only, not a prediction. It assumes spending and return stay constant every year, ignores taxes, fees, inflation, and market ups and downs, and the result is capped at 100 years, so 100 can also mean the money never runs out on these inputs.',
  inputs: [{key: 'portfolio', label: 'Starting portfolio ($)', value: 500000, step: 10000, min: 0}, {key: 'annualSpend', label: 'Annual spending ($)', value: 40000, step: 1000, min: 0}, {key: 'annualReturn', label: 'Annual investment return assumption (%)', value: 3, step: 0.5}],
  outputs: [{key: 'yearsLasts', label: 'Years the money lasts', format: 'years'}],
  compute: (v) => { let portfolio = v.portfolio; let years = 0; if (v.annualSpend <= 0) { years = 100; } else { for (let y = 1; y <= 100; y++) { portfolio = portfolio * (1 + v.annualReturn / 100) - v.annualSpend; years = y; if (portfolio <= 0) { break; } } } return {yearsLasts: years}; }
});

CALCS.push({
  id: 'rent-affordability',
  name: 'Rent affordability',
  category: 'Housing & Renting',
  blurb: 'Estimates monthly rent at 25%, 30% and 35% of gross monthly income.',
  formula: 'Monthly income = annual income / 12; rent at X% = monthly income x X%.',
  limits: 'These are rules of thumb, not approvals. A landlord or lender may use different criteria, and other debts and costs are not included.',
  inputs: [{key: 'income', label: 'Annual income ($)', value: 60000, step: 1000, min: 0}],
  outputs: [{key: 'rent25', label: 'Rent at 25%', format: 'money'}, {key: 'rent30', label: 'Rent at 30%', format: 'money'}, {key: 'rent35', label: 'Rent at 35%', format: 'money'}],
  compute: (v) => ({rent25: (v.income / 12) * 0.25, rent30: (v.income / 12) * 0.30, rent35: (v.income / 12) * 0.35})
});
CALCS.push({
  id: 'moving-cost',
  name: 'Moving cost calculator',
  category: 'Housing & Renting',
  blurb: 'Adds up deposit, fees, moving and setup costs into a total first-month cost.',
  formula: 'Total first-month cost = deposit + fees + moving cost + setup cost.',
  limits: 'Only the costs entered are included. Later rent, bills and ongoing costs are not included.',
  inputs: [{key: 'deposit', label: 'Deposit ($)', value: 1500, step: 100, min: 0}, {key: 'fees', label: 'Fees ($)', value: 300, step: 50, min: 0}, {key: 'movingCost', label: 'Moving cost ($)', value: 800, step: 50, min: 0}, {key: 'setupCost', label: 'Setup cost ($)', value: 500, step: 50, min: 0}],
  outputs: [{key: 'totalFirstMonthCost', label: 'Total first-month cost', format: 'money'}],
  compute: (v) => ({totalFirstMonthCost: v.deposit + v.fees + v.movingCost + v.setupCost})
});
CALCS.push({
  id: 'home-buying-upfront-costs',
  name: 'Home buying upfront costs',
  category: 'Housing & Renting',
  blurb: 'Works out the deposit amount, fees and total cash needed to buy a home.',
  formula: 'Deposit amount = price x deposit % / 100; total cash needed = deposit amount + fees.',
  limits: 'Only the price, deposit percentage and fees entered are included. Mortgage payments, taxes, insurance and later costs are not included.',
  inputs: [{key: 'price', label: 'Home price ($)', value: 300000, step: 1000, min: 0}, {key: 'depositPercent', label: 'Deposit (%)', value: 20, step: 1, min: 0}, {key: 'fees', label: 'Fees ($)', value: 5000, step: 100, min: 0}],
  outputs: [{key: 'depositAmount', label: 'Deposit amount', format: 'money'}, {key: 'feesAmount', label: 'Fees amount', format: 'money'}, {key: 'totalCashNeeded', label: 'Total cash needed', format: 'money'}],
  compute: (v) => ({depositAmount: v.price * v.depositPercent / 100, feesAmount: v.fees, totalCashNeeded: v.price * v.depositPercent / 100 + v.fees})
});
CALCS.push({
  id: 'refinance-break-even',
  name: 'Refinance break-even',
  category: 'Housing & Renting',
  blurb: 'Works out how many months of monthly saving it takes to recover closing costs.',
  formula: 'Break-even months = closing costs / monthly saving.',
  limits: 'Only valid when there is a positive monthly saving. If monthly saving is zero or less, there is no break-even point, so the result is null.',
  inputs: [{key: 'closingCosts', label: 'Closing costs ($)', value: 4000, step: 100, min: 0}, {key: 'monthlySaving', label: 'Monthly saving ($)', value: 150, step: 10, min: 0}],
  outputs: [{key: 'months', label: 'Months to break even', format: 'months'}],
  compute: (v) => (v.monthlySaving <= 0 ? {months: null} : {months: v.closingCosts / v.monthlySaving})
});
CALCS.push({
  id: 'extra-mortgage-payment-impact',
  name: 'Extra mortgage payment impact',
  category: 'Housing & Renting',
  blurb: 'Simulates a mortgage month by month with and without an extra monthly payment.',
  formula: 'Base payment = principal x monthly rate / (1 - (1 + monthly rate) ^ -number of payments); each month interest is added and the payment plus any extra is subtracted, capped at 1200 months.',
  limits: 'A simplified simulation using the rate and term entered. It does not include taxes, insurance, fees, rate changes or early-repayment charges.',
  inputs: [{key: 'loanAmount', label: 'Loan amount ($)', value: 250000, step: 1000, min: 0}, {key: 'annualRate', label: 'Annual interest rate (%)', value: 6, step: 0.1, min: 0}, {key: 'loanTermYears', label: 'Loan term (years)', value: 30, step: 1, min: 0}, {key: 'extraPayment', label: 'Extra monthly payment ($)', value: 200, step: 10, min: 0}],
  outputs: [{key: 'monthsNoExtra', label: 'Months without extra payment', format: 'integer'}, {key: 'monthsWithExtra', label: 'Months with extra payment', format: 'integer'}, {key: 'monthsSaved', label: 'Months saved', format: 'integer'}, {key: 'interestSaved', label: 'Interest saved', format: 'money'}],
  compute: (v) => {
    const principal = Math.max(0, v.loanAmount);
    const months = Math.max(1, Math.round(v.loanTermYears * 12));
    const r = v.annualRate / 100 / 12;
    const basePayment = r === 0 ? principal / months : principal * r / (1 - Math.pow(1 + r, -months));
    const simulate = function (payment: number) {
      let balance = principal;
      let interest = 0;
      let count = 0;
      while (balance > 0 && count < 1200) {
        const monthInterest = balance * r;
        interest += monthInterest;
        let pay = payment;
        if (pay > balance + monthInterest) { pay = balance + monthInterest; }
        balance = balance + monthInterest - pay;
        count += 1;
        if (pay <= 0) { break; }
      }
      return {months: count, interest: interest};
    };
    const noExtra = simulate(basePayment);
    const withExtra = simulate(basePayment + v.extraPayment);
    return {monthsNoExtra: noExtra.months, monthsWithExtra: withExtra.months, monthsSaved: noExtra.months - withExtra.months, interestSaved: noExtra.interest - withExtra.interest};
  }
});
CALCS.push({
  id: 'rent-increase-impact',
  name: 'Rent increase impact',
  category: 'Housing & Renting',
  blurb: 'Works out a new monthly rent and the annual increase from a rent rise.',
  formula: 'New monthly rent = old rent x (1 + increase % / 100); annual increase = (new rent - old rent) x 12.',
  limits: 'Only the rent and percentage entered are used. It does not check whether the increase is allowed under a lease or local rules.',
  inputs: [{key: 'oldRent', label: 'Old monthly rent ($)', value: 1500, step: 50, min: 0}, {key: 'increasePercent', label: 'Increase (%)', value: 5, step: 0.5, min: 0}],
  outputs: [{key: 'newMonthlyRent', label: 'New monthly rent', format: 'money'}, {key: 'monthlyIncrease', label: 'Monthly increase', format: 'money'}, {key: 'newAnnualRent', label: 'New annual rent', format: 'money'}, {key: 'annualIncrease', label: 'Annual increase', format: 'money'}],
  compute: (v) => ({newMonthlyRent: v.oldRent * (1 + v.increasePercent / 100), monthlyIncrease: v.oldRent * v.increasePercent / 100, newAnnualRent: v.oldRent * (1 + v.increasePercent / 100) * 12, annualIncrease: v.oldRent * v.increasePercent / 100 * 12})
});
CALCS.push({
  id: 'house-hacking-offset',
  name: 'House-hacking / room rental offset',
  category: 'Housing & Renting',
  blurb: 'Subtracts rent received from mortgage and other housing costs to give a net housing cost.',
  formula: 'Net housing cost = monthly mortgage payment + other housing costs - rent received; rent offset % = rent received / (mortgage payment + other housing costs) x 100.',
  limits: 'Uses the mortgage payment entered, not a payment calculated from a loan. Vacancies, taxes, maintenance and other rental costs are not included.',
  inputs: [{key: 'mortgagePayment', label: 'Monthly mortgage payment ($)', value: 1800, step: 50, min: 0}, {key: 'otherHousingCosts', label: 'Other housing costs ($)', value: 400, step: 50, min: 0}, {key: 'rentReceived', label: 'Rent received ($)', value: 1200, step: 50, min: 0}],
  outputs: [{key: 'netHousingCost', label: 'Net housing cost', format: 'money'}, {key: 'rentOffsetPercent', label: 'Rent offset', format: 'percent'}],
  compute: (v) => ({netHousingCost: v.mortgagePayment + v.otherHousingCosts - v.rentReceived, rentOffsetPercent: (v.mortgagePayment + v.otherHousingCosts) > 0 ? v.rentReceived / (v.mortgagePayment + v.otherHousingCosts) * 100 : 0})
});
CALCS.push({
  id: 'remote-work-cost-comparison',
  name: 'Home office / remote-work cost comparison',
  category: 'Housing & Renting',
  blurb: 'Compares commute cost saved by working from home with extra home costs.',
  formula: 'Commute saved = monthly commute cost x days working from home / working days per month; net monthly saving = commute saved - extra home costs.',
  limits: 'A simple comparison of the costs entered only. It does not value time saved, productivity changes or other remote-work effects.',
  inputs: [{key: 'monthlyCommuteCost', label: 'Monthly commute cost ($)', value: 400, step: 10, min: 0}, {key: 'daysWorkingFromHome', label: 'Days working from home per month', value: 15, step: 1, min: 0}, {key: 'workingDaysPerMonth', label: 'Working days per month', value: 22, step: 1, min: 0}, {key: 'extraHomeCosts', label: 'Extra home costs ($)', value: 100, step: 10, min: 0}],
  outputs: [{key: 'commuteSaved', label: 'Commute cost saved', format: 'money'}, {key: 'netMonthlySaving', label: 'Net monthly saving', format: 'money'}],
  compute: (v) => ({commuteSaved: v.workingDaysPerMonth > 0 ? v.monthlyCommuteCost * v.daysWorkingFromHome / v.workingDaysPerMonth : 0, netMonthlySaving: (v.workingDaysPerMonth > 0 ? v.monthlyCommuteCost * v.daysWorkingFromHome / v.workingDaysPerMonth : 0) - v.extraHomeCosts})
});

CALCS.push({
  id: 'freelancer-day-rate',
  name: 'Freelancer day rate calculator',
  category: 'Freelance, Business & Side Income',
  blurb: 'Works out the day rate you need to hit your target annual income after covering your annual costs.',
  formula: 'Day rate = (target annual income + annual costs) / billable days.',
  limits: 'This is a simple average over billable days only; it does not allow for unpaid holidays, sick days, late payment, or taxes, and it gives no result if billable days is zero.',
  inputs: [{key: 'targetIncome', label: 'Target annual income ($)', value: 60000, step: 1000, min: 0}, {key: 'annualCosts', label: 'Annual costs ($)', value: 10000, step: 500, min: 0}, {key: 'billableDays', label: 'Billable days (days)', value: 200, step: 1, min: 0}],
  outputs: [{key: 'dayRate', label: 'Day rate', format: 'money'}],
  compute: (v) => ({dayRate: v.billableDays > 0 ? (v.targetIncome + v.annualCosts) / v.billableDays : null})
});
CALCS.push({
  id: 'freelancer-hourly-rate-from-salary',
  name: 'Freelancer hourly rate from salary',
  category: 'Freelance, Business & Side Income',
  blurb: 'Converts a salary equivalent into a freelance hourly rate by adding your own tax and benefits loading.',
  formula: 'Hourly rate = salary x (1 + loading / 100) / billable hours per year.',
  limits: 'The loading percentage is your own estimate, not a tax calculation, and the result is only as realistic as the billable hours you enter; it gives no result if billable hours is zero.',
  inputs: [{key: 'salary', label: 'Salary equivalent ($)', value: 80000, step: 1000, min: 0}, {key: 'billableHours', label: 'Billable hours (hours/year)', value: 1500, step: 10, min: 0}, {key: 'loading', label: 'Tax/benefits loading (%)', value: 30, step: 1, min: 0}],
  outputs: [{key: 'hourlyRate', label: 'Hourly rate', format: 'money'}],
  compute: (v) => ({hourlyRate: v.billableHours > 0 ? v.salary * (1 + v.loading / 100) / v.billableHours : null})
});
CALCS.push({
  id: 'quote-calculator',
  name: 'Quote calculator',
  category: 'Freelance, Business & Side Income',
  blurb: 'Builds a client quote from your hours, rate, and expenses, plus your chosen margin.',
  formula: 'Quote price = (hours x rate + expenses) x (1 + margin / 100).',
  limits: 'Margin here is added on top of costs, not taken as a share of the final price, and the result does not allow for taxes, discounts, or unpaid time.',
  inputs: [{key: 'hours', label: 'Hours (hours)', value: 20, step: 1, min: 0}, {key: 'rate', label: 'Hourly rate ($)', value: 75, step: 5, min: 0}, {key: 'expenses', label: 'Expenses ($)', value: 200, step: 10, min: 0}, {key: 'margin', label: 'Margin (%)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'quotePrice', label: 'Quote price', format: 'money'}, {key: 'marginAmount', label: 'Margin amount', format: 'money'}],
  compute: (v) => ({quotePrice: (v.hours * v.rate + v.expenses) * (1 + v.margin / 100), marginAmount: (v.hours * v.rate + v.expenses) * (v.margin / 100)})
});
CALCS.push({
  id: 'project-profitability',
  name: 'Project profitability',
  category: 'Freelance, Business & Side Income',
  blurb: 'Shows whether a project made money, what you effectively earned per hour, and its profit margin.',
  formula: 'Profit = revenue - costs; effective hourly = profit / hours; profit margin = profit / revenue x 100.',
  limits: 'This uses only the revenue, costs, and hours you enter, so it misses unpaid admin time and overheads not included in costs, and it gives no effective hourly or margin if hours or revenue is zero.',
  inputs: [{key: 'revenue', label: 'Revenue ($)', value: 10000, step: 100, min: 0}, {key: 'costs', label: 'Costs ($)', value: 6000, step: 100, min: 0}, {key: 'hours', label: 'Hours worked (hours)', value: 80, step: 1, min: 0}],
  outputs: [{key: 'profit', label: 'Profit', format: 'money'}, {key: 'effectiveHourly', label: 'Effective hourly rate', format: 'money'}, {key: 'profitMargin', label: 'Profit margin', format: 'percent'}],
  compute: (v) => ({profit: v.revenue - v.costs, effectiveHourly: v.hours > 0 ? (v.revenue - v.costs) / v.hours : null, profitMargin: v.revenue > 0 ? (v.revenue - v.costs) / v.revenue * 100 : null})
});
CALCS.push({
  id: 'side-income-tax-set-aside',
  name: 'Side income tax set-aside',
  category: 'Freelance, Business & Side Income',
  blurb: 'Works out how much of your side income to set aside and how much is left after setting it aside.',
  formula: 'Set-aside amount = side income x set-aside % / 100; amount left = side income - set-aside amount.',
  limits: 'The set-aside percentage is your own choice, not a tax rate or tax advice, and the result does not allow for expenses, deductions, or other income.',
  inputs: [{key: 'sideIncome', label: 'Side income ($)', value: 12000, step: 100, min: 0}, {key: 'setAsidePercent', label: 'Set-aside (%)', value: 25, step: 1, min: 0}],
  outputs: [{key: 'setAsideAmount', label: 'Amount to set aside', format: 'money'}, {key: 'amountLeft', label: 'Amount left after set-aside', format: 'money'}],
  compute: (v) => ({setAsideAmount: v.sideIncome * v.setAsidePercent / 100, amountLeft: v.sideIncome - v.sideIncome * v.setAsidePercent / 100})
});
CALCS.push({
  id: 'business-runway-with-revenue',
  name: 'Business runway with revenue',
  category: 'Freelance, Business & Side Income',
  blurb: 'Estimates how many months your starting cash lasts once monthly revenue is counted against monthly burn.',
  formula: 'Net burn = max(0, monthly burn - monthly revenue); months = starting cash / net burn.',
  limits: 'This assumes burn and revenue stay flat every month and ignores new funding, growth, or one-off costs; if revenue covers costs, net burn is zero and months is null, meaning no runway limit from burn alone.',
  inputs: [{key: 'startingCash', label: 'Starting cash ($)', value: 50000, step: 1000, min: 0}, {key: 'monthlyBurn', label: 'Monthly burn ($)', value: 10000, step: 100, min: 0}, {key: 'monthlyRevenue', label: 'Monthly revenue ($)', value: 4000, step: 100, min: 0}],
  outputs: [{key: 'netBurn', label: 'Net monthly burn', format: 'money'}, {key: 'months', label: 'Runway', format: 'months'}],
  compute: (v) => ({netBurn: Math.max(0, v.monthlyBurn - v.monthlyRevenue), months: Math.max(0, v.monthlyBurn - v.monthlyRevenue) > 0 ? v.startingCash / Math.max(0, v.monthlyBurn - v.monthlyRevenue) : null})
});
CALCS.push({
  id: 'pricing-calculator',
  name: 'Pricing calculator',
  category: 'Freelance, Business & Side Income',
  blurb: 'Compares the selling price from a markup on cost with the selling price from a margin on the final price.',
  formula: 'Markup price = cost x (1 + markup / 100); margin price = cost / (1 - margin / 100).',
  limits: 'Markup and margin are not the same thing, so the two prices will differ for the same percentage, and the margin price gives no result if margin is 100% or more.',
  inputs: [{key: 'cost', label: 'Cost per unit ($)', value: 50, step: 1, min: 0}, {key: 'markup', label: 'Markup (%)', value: 50, step: 1, min: 0}, {key: 'margin', label: 'Margin (%)', value: 30, step: 1, min: 0}],
  outputs: [{key: 'markupPrice', label: 'Price with markup', format: 'money'}, {key: 'marginPrice', label: 'Price with margin', format: 'money'}],
  compute: (v) => ({markupPrice: v.cost * (1 + v.markup / 100), marginPrice: v.margin < 100 ? v.cost / (1 - v.margin / 100) : null})
});
CALCS.push({
  id: 'discount-impact',
  name: 'Discount impact',
  category: 'Freelance, Business & Side Income',
  blurb: 'Works out how much more volume you need to sell to hold the same profit after a price cut.',
  formula: 'Required volume increase % = price cut % / (original margin % - price cut %) x 100.',
  limits: 'This assumes costs stay the same and every extra sale earns the same reduced margin, and it gives no result if the price cut is as large as or larger than the original margin, since profit could not be held then.',
  inputs: [{key: 'priceCut', label: 'Price cut (%)', value: 10, step: 1, min: 0}, {key: 'profitMargin', label: 'Original profit margin (%)', value: 40, step: 1, min: 0}],
  outputs: [{key: 'requiredIncrease', label: 'Required volume increase', format: 'percent'}],
  compute: (v) => ({requiredIncrease: v.profitMargin > v.priceCut ? v.priceCut / (v.profitMargin - v.priceCut) * 100 : null})
});
CALCS.push({
  id: 'hiring-vs-automation-cost',
  name: 'Hiring vs automation cost',
  category: 'Freelance, Business & Side Income',
  blurb: 'Compares the monthly saving from automating hours of work against the tool cost, and how long the upfront cost takes to pay back.',
  formula: 'Monthly saving = hours saved per month x hourly cost - tool cost per month; payback months = upfront tool cost / monthly saving.',
  limits: 'This counts only the hours and costs you enter, not setup time, training, errors, or quality differences, and payback gives no result if the monthly saving is zero or negative.',
  inputs: [{key: 'hoursSaved', label: 'Hours saved (hours/month)', value: 40, step: 1, min: 0}, {key: 'hourlyCost', label: 'Hourly cost ($)', value: 50, step: 5, min: 0}, {key: 'toolCostMonthly', label: 'Tool cost ($/month)', value: 500, step: 10, min: 0}, {key: 'upfrontToolCost', label: 'Upfront tool cost ($)', value: 2000, step: 100, min: 0}],
  outputs: [{key: 'monthlySaving', label: 'Monthly saving', format: 'money'}, {key: 'paybackMonths', label: 'Payback period', format: 'months'}],
  compute: (v) => ({monthlySaving: v.hoursSaved * v.hourlyCost - v.toolCostMonthly, paybackMonths: (v.hoursSaved * v.hourlyCost - v.toolCostMonthly) > 0 ? v.upfrontToolCost / (v.hoursSaved * v.hourlyCost - v.toolCostMonthly) : null})
});
CALCS.push({
  id: 'client-churn-retention-value',
  name: 'Client churn / retention value',
  category: 'Freelance, Business & Side Income',
  blurb: 'Estimates how many clients you lose each year to churn and the annual value those clients represent.',
  formula: 'Clients lost = clients x churn % / 100; annual value lost = clients lost x value per client per year.',
  limits: 'This assumes a flat yearly churn rate and the same value for every client, and it does not count new clients won or clients who return.',
  inputs: [{key: 'clients', label: 'Clients (clients)', value: 100, step: 1, min: 0}, {key: 'churnPercent', label: 'Churn (%/year)', value: 20, step: 1, min: 0}, {key: 'valuePerClient', label: 'Value per client ($/year)', value: 1000, step: 50, min: 0}],
  outputs: [{key: 'clientsLost', label: 'Clients lost per year', format: 'integer'}, {key: 'annualValueLost', label: 'Annual value lost', format: 'money'}],
  compute: (v) => ({clientsLost: Math.round(v.clients * v.churnPercent / 100), annualValueLost: v.clients * v.churnPercent / 100 * v.valuePerClient})
});
CALCS.push({
  id: 'break-even-units',
  name: 'Break-even units',
  category: 'Freelance, Business & Side Income',
  blurb: 'Works out how many units you must sell to cover your fixed costs at a given price and variable cost.',
  formula: 'Contribution per unit = price - variable cost per unit; break-even units = fixed costs / contribution per unit.',
  limits: 'This assumes price, variable cost, and fixed costs stay constant at any volume, and it gives no result if price is not above variable cost, since each sale would not contribute to fixed costs.',
  inputs: [{key: 'fixedCosts', label: 'Fixed costs ($)', value: 10000, step: 100, min: 0}, {key: 'price', label: 'Price per unit ($)', value: 50, step: 1, min: 0}, {key: 'variableCost', label: 'Variable cost per unit ($)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'contributionMargin', label: 'Contribution per unit', format: 'money'}, {key: 'breakEvenUnits', label: 'Break-even units', format: 'number'}],
  compute: (v) => ({contributionMargin: v.price - v.variableCost, breakEvenUnits: v.price > v.variableCost ? v.fixedCosts / (v.price - v.variableCost) : null})
});

CALCS.push({
  id: 'portfolio-allocation',
  name: 'Portfolio allocation checker',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter three holdings to see the total portfolio value and each holding as a percentage of that total.',
  formula: 'Total = holding 1 + holding 2 + holding 3; each weight = holding / total * 100.',
  limits: 'Covers only the three holdings entered, so holdings left out are not counted in the total or weights.',
  inputs: [{key: 'holding1', label: 'Holding 1 value ($)', value: 5000, step: 500, min: 0}, {key: 'holding2', label: 'Holding 2 value ($)', value: 3000, step: 500, min: 0}, {key: 'holding3', label: 'Holding 3 value ($)', value: 2000, step: 500, min: 0}],
  outputs: [{key: 'total', label: 'Total portfolio', format: 'money'}, {key: 'weight1', label: 'Holding 1 weight', format: 'percent'}, {key: 'weight2', label: 'Holding 2 weight', format: 'percent'}, {key: 'weight3', label: 'Holding 3 weight', format: 'percent'}],
  compute: (v) => { const total = (v.holding1 || 0) + (v.holding2 || 0) + (v.holding3 || 0); if (total <= 0) { return {total: 0, weight1: 0, weight2: 0, weight3: 0}; } return {total: total, weight1: (v.holding1 || 0) / total * 100, weight2: (v.holding2 || 0) / total * 100, weight3: (v.holding3 || 0) / total * 100}; }
});
CALCS.push({
  id: 'portfolio-concentration',
  name: 'Portfolio concentration by holding',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter three holdings to see how much of the portfolio sits in the largest holding and in the largest two holdings combined.',
  formula: 'Total = holding 1 + holding 2 + holding 3; largest % = largest holding / total * 100; largest-two % = (largest + second-largest) / total * 100.',
  limits: 'Only three holdings are entered, so this reports the largest holding and the largest two holdings only; a largest-three figure would always be 100% with three rows and is not reported.',
  inputs: [{key: 'holding1', label: 'Holding 1 value ($)', value: 5000, step: 500, min: 0}, {key: 'holding2', label: 'Holding 2 value ($)', value: 3000, step: 500, min: 0}, {key: 'holding3', label: 'Holding 3 value ($)', value: 2000, step: 500, min: 0}],
  outputs: [{key: 'total', label: 'Total portfolio', format: 'money'}, {key: 'largestValue', label: 'Largest holding value', format: 'money'}, {key: 'largestPct', label: 'Largest holding', format: 'percent'}, {key: 'topTwoPct', label: 'Largest two holdings', format: 'percent'}],
  compute: (v) => { const vals = [(v.holding1 || 0), (v.holding2 || 0), (v.holding3 || 0)]; const total = vals[0] + vals[1] + vals[2]; if (total <= 0) { return {total: 0, largestValue: 0, largestPct: 0, topTwoPct: 0}; } const sorted = vals.slice().sort(function (a, b) { return b - a; }); return {total: total, largestValue: sorted[0], largestPct: sorted[0] / total * 100, topTwoPct: (sorted[0] + sorted[1]) / total * 100}; }
});
CALCS.push({
  id: 'single-stock-exposure',
  name: 'Single-stock exposure',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter one holding and the total portfolio value to see what percentage of the portfolio that holding represents.',
  formula: 'Exposure = holding value / total portfolio value * 100.',
  limits: 'This is a single-holding share of the total only; it does not measure risk, volatility, or diversification.',
  inputs: [{key: 'holdingValue', label: 'Holding value ($)', value: 5000, step: 500, min: 0}, {key: 'totalValue', label: 'Total portfolio value ($)', value: 20000, step: 500, min: 0}],
  outputs: [{key: 'exposure', label: 'Single-stock exposure', format: 'percent'}],
  compute: (v) => { if (!v.totalValue || v.totalValue <= 0) { return {exposure: 0}; } return {exposure: (v.holdingValue || 0) / v.totalValue * 100}; }
});
CALCS.push({
  id: 'loss-recovery',
  name: 'Loss recovery calculator',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter a percentage loss to see the percentage gain needed to get back to the starting value.',
  formula: 'Gain needed % = loss % / (1 - loss % / 100).',
  limits: 'A loss of 100% or more cannot be recovered by a percentage gain, so no gain figure is returned in that case; this does not account for fees, taxes, or time.',
  inputs: [{key: 'lossPct', label: 'Loss (%)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'gainNeeded', label: 'Gain needed to recover', format: 'percent'}],
  compute: (v) => { const loss = v.lossPct || 0; if (loss < 0 || loss >= 100) { return {gainNeeded: null}; } return {gainNeeded: loss / (1 - loss / 100)}; }
});
CALCS.push({
  id: 'portfolio-drawdown-from-peak',
  name: 'Portfolio drawdown from peak',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter a peak portfolio value and the current value to see how far the portfolio has fallen from its peak.',
  formula: 'Drawdown % = (peak value - current value) / peak value * 100.',
  limits: 'This compares only the two values entered; a current value above the peak gives a negative drawdown, meaning a gain above the peak, and a peak of zero gives no drawdown figure.',
  inputs: [{key: 'peakValue', label: 'Peak portfolio value ($)', value: 10000, step: 500, min: 0}, {key: 'currentValue', label: 'Current portfolio value ($)', value: 8500, step: 500, min: 0}],
  outputs: [{key: 'drawdown', label: 'Drawdown from peak', format: 'percent'}],
  compute: (v) => { if (!v.peakValue || v.peakValue <= 0) { return {drawdown: 0}; } return {drawdown: (v.peakValue - (v.currentValue || 0)) / v.peakValue * 100}; }
});
CALCS.push({
  id: 'expected-loss-on-position',
  name: 'Risk: expected loss on a position',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter a position size and a loss percentage to see the dollar loss and the value that would remain.',
  formula: 'Dollar loss = position size * loss % / 100; remaining value = position size - dollar loss.',
  limits: 'This is a simple arithmetic scenario for one stated loss percentage; it is not a probability, forecast, or estimate of how likely that loss is.',
  inputs: [{key: 'positionSize', label: 'Position size ($)', value: 10000, step: 500, min: 0}, {key: 'lossPct', label: 'Loss (%)', value: 10, step: 1, min: 0}],
  outputs: [{key: 'expectedLoss', label: 'Dollar loss', format: 'money'}, {key: 'remainingValue', label: 'Remaining value', format: 'money'}],
  compute: (v) => { const size = v.positionSize || 0; const loss = size * (v.lossPct || 0) / 100; return {expectedLoss: loss, remainingValue: size - loss}; }
});
CALCS.push({
  id: 'emergency-fund-vs-portfolio-risk',
  name: 'Emergency fund vs portfolio risk',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter liquid savings and monthly expenses to see how many months of expenses those savings would cover.',
  formula: 'Months covered = liquid savings / monthly expenses.',
  limits: 'This counts only the liquid savings entered and only the monthly expenses entered; it does not account for income, debts, or expenses that change month to month.',
  inputs: [{key: 'liquidSavings', label: 'Liquid savings ($)', value: 12000, step: 500, min: 0}, {key: 'monthlyExpenses', label: 'Monthly expenses ($)', value: 3000, step: 100, min: 0}],
  outputs: [{key: 'monthsCovered', label: 'Months of expenses covered', format: 'months'}],
  compute: (v) => { if (!v.monthlyExpenses || v.monthlyExpenses <= 0) { return {monthsCovered: 0}; } return {monthsCovered: (v.liquidSavings || 0) / v.monthlyExpenses}; }
});
CALCS.push({
  id: 'rebalancing-calculator',
  name: 'Rebalancing calculator',
  category: 'Risk, Portfolio & Recovery',
  blurb: 'Enter three current holdings and three target weights to see each holding target value and how much to buy or sell per holding.',
  formula: 'Total = holding 1 + holding 2 + holding 3; target value = total * normalised target weight / 100; buy/sell amount = target value - current value, where positive means buy and negative means sell.',
  limits: 'Illustration only, not investment advice. If the three target weights do not sum to 100, they are normalised to sum to 100 before target values are calculated; this does not account for fees, taxes, or minimum trade sizes.',
  inputs: [{key: 'holding1', label: 'Holding 1 current value ($)', value: 5000, step: 500, min: 0}, {key: 'holding2', label: 'Holding 2 current value ($)', value: 3000, step: 500, min: 0}, {key: 'holding3', label: 'Holding 3 current value ($)', value: 2000, step: 500, min: 0}, {key: 'target1', label: 'Holding 1 target weight (%)', value: 50, step: 1, min: 0}, {key: 'target2', label: 'Holding 2 target weight (%)', value: 30, step: 1, min: 0}, {key: 'target3', label: 'Holding 3 target weight (%)', value: 20, step: 1, min: 0}],
  outputs: [{key: 'total', label: 'Total portfolio', format: 'money'}, {key: 'targetValue1', label: 'Holding 1 target value', format: 'money'}, {key: 'targetValue2', label: 'Holding 2 target value', format: 'money'}, {key: 'targetValue3', label: 'Holding 3 target value', format: 'money'}, {key: 'buySell1', label: 'Holding 1 buy (+) / sell (-)', format: 'money'}, {key: 'buySell2', label: 'Holding 2 buy (+) / sell (-)', format: 'money'}, {key: 'buySell3', label: 'Holding 3 buy (+) / sell (-)', format: 'money'}, {key: 'normalisedNote', label: 'Target weights note', format: 'text'}],
  compute: (v) => { const h1 = v.holding1 || 0; const h2 = v.holding2 || 0; const h3 = v.holding3 || 0; const total = h1 + h2 + h3; const t1 = v.target1 || 0; const t2 = v.target2 || 0; const t3 = v.target3 || 0; const sum = t1 + t2 + t3; let n1; let n2; let n3; let note; if (sum <= 0) { n1 = 100 / 3; n2 = 100 / 3; n3 = 100 / 3; note = 'Target weights sum to zero, so equal weights were used.'; } else if (sum === 100) { n1 = t1; n2 = t2; n3 = t3; note = 'Target weights sum to 100%, used as entered.'; } else { n1 = t1 / sum * 100; n2 = t2 / sum * 100; n3 = t3 / sum * 100; note = 'Target weights normalised to sum to 100%.'; } const tv1 = total * n1 / 100; const tv2 = total * n2 / 100; const tv3 = total * n3 / 100; return {total: total, targetValue1: tv1, targetValue2: tv2, targetValue3: tv3, buySell1: tv1 - h1, buySell2: tv2 - h2, buySell3: tv3 - h3, normalisedNote: note}; }
});

