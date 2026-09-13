import {
  calculateFinancialTool,
  calculateIndividualIncomePercentile,
  getFinanceDefaultInputs,
  getFinanceTool,
  formatFinanceValue,
} from '@insightginie/calculators';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { askOutputSchema, type AskAnswer } from './core';

/** Narrow explicit syntax only; never infer a person's missing financial circumstances. */
export function calculateStatedQuestion(question: string): AskAnswer | null {
  if (question.length < 3 || question.length > 1200) return null;
  // One complete number only. A range, sequential loss, extra cash flow, age or
  // second scenario belongs in the interactive tool, not a partial calculation.
  const numbers = question.match(/[+\-−]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)(?:[eE][+\-]?\d+)?/g) ?? [];
  if (numbers.length !== 1) return null;
  const numericText = numbers[0];
  if (/^[+\-−]/.test(numericText) || /[eE]/.test(numericText)) return null;
  if (
    /\b(million|millions|billion|billions|thousand|thousands|hundred|hundreds|mn|bn)\b/i.test(
      question,
    )
  )
    return null;
  const loss =
    question.match(/(\d+(?:\.\d+)?)\s*%\s*(?:loss|drawdown)/i) ??
    question.match(/(?:loss|drawdown)\s*(?:of|=|:)?\s*(\d+(?:\.\d+)?)\s*%/i);
  const unsupportedLossScope =
    /\b(contribut(?:e|ion|ions)|deposits?|withdraw(?:al|als)?|fees?|tax(?:es)?|inflation|dividends?|leverage|leveraged|short|when|years?|months?|weeks?|days?|hours?|then|followed|successive|consecutive)\b|\bhow\s+(?:long|soon)\b/i.test(
      question,
    );
  if (
    loss &&
    loss[1] === numericText &&
    /^\d+(?:\.\d+)?$/.test(numericText) &&
    Number(loss[1]) <= 100 &&
    !unsupportedLossScope &&
    /recover|recovery|gain|return|drawdown/i.test(question)
  ) {
    const tool = getFinanceTool('drawdown-recovery')!;
    const result = calculateFinancialTool(tool.id, {
      ...getFinanceDefaultInputs(tool.id),
      lossPercent: Number(loss[1]),
      startingValue: 100,
      annualReturn: 0,
    });
    const gain = result.values.requiredGain;
    return askOutputSchema.parse({
      method: 'deterministic-calculator',
      mode: 'answer',
      message:
        gain === null
          ? 'A 100% loss leaves no value from which a percentage gain can recover the starting balance. There is no finite recovery percentage.'
          : `After a ${Number(loss[1])}% loss, returning to the starting value requires a gain of ${formatFinanceValue(gain, 'percent')}. The formula is loss ÷ (1 − loss), with the loss expressed as a fraction.`,
      citations: [
        {
          title: tool.title,
          path: `/tools/${tool.id}/`,
          updatedAt: '2026-09-13',
          sources: tool.sources,
        },
      ],
      followups: [{ label: 'Explore the recovery calculator', path: `/tools/${tool.id}/` }],
      assumptions: [
        'Calculated by the deterministic drawdown engine; no model generated these values.',
        'No contributions, withdrawals, fees or taxes. This is arithmetic, not a prediction of recovery.',
      ],
    });
  }
  const income = question.match(
    /(?:income|salary)\s*(?:of|is|=|:)?\s*\$([\d,]+(?:\.\d+)?)\s*(k)?\b/i,
  );
  const ambiguousIncomeUnit = /%|\$[\d,.]+\s*(?:m|b|mm)\b/i.test(question);
  const validIncomeNumber = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(numericText);
  const distribution = getIndividualIncomeDistribution();
  const unsupportedIncomeScope =
    /\b(household|family|couple|joint|combined|monthly|weekly|hourly|daily|quarterly|semiannual|semiannually|biannual|biennial|biweekly|fortnightly|fortnights?|hr|hrs|wk|wks|mo|mos|qtr|hours?|days?|weeks?|months?|quarters?|years|lifetime|ytd|age|local|city|state|metro|zip|cad|aud|nzd|sgd|hkd|eur|gbp)\b|\bper\s+(hour|day|week|month)\b|after[- ]tax|take[- ]home|net\s+income/i.test(
      question,
    ) || /\bin\s+(?!(?:the\s+)?(?:us\b|u\.s\.|united states\b))/i.test(question);
  if (
    income &&
    income[1] === numericText &&
    validIncomeNumber &&
    !ambiguousIncomeUnit &&
    distribution &&
    !unsupportedIncomeScope &&
    /percentile|rank|compare|comparison/i.test(question)
  ) {
    const amount = Number(income[1].replaceAll(',', '')) * (income[2] ? 1000 : 1);
    if (!Number.isFinite(amount) || amount > 1_000_000_000) return null;
    const result = calculateIndividualIncomePercentile(
      { annualIncome: amount },
      { distribution, calculatedAt: new Date().toISOString() },
    );
    if (!result.result) return null;
    const value = result.result;
    const position =
      value.percentile === null
        ? `within a published group spanning approximately ${Math.floor(value.percentileRange.lower * 10) / 10}% to ${Math.ceil(value.percentileRange.upper * 10) / 10}%`
        : `higher than approximately ${Math.floor(value.percentile * 10) / 10}%`;
    return askOutputSchema.parse({
      method: 'deterministic-calculator',
      mode: 'answer',
      message: `An annual individual income of ${formatFinanceValue(amount, 'currency')} is ${position} of the comparison population: ${distribution.populationLabel}. This uses ${distribution.datasetVersion.year} income data.`,
      citations: [
        {
          title: 'Individual income percentile methodology',
          path: '/methodology/individual-income/',
          updatedAt: distribution.datasetVersion.retrievedAt,
          sources: result.sourceReferences.map(({ name, url }) => ({ name, url })),
        },
      ],
      followups: [
        { label: 'Explore the income calculator', path: '/calc/individual-income-percentile/' },
      ],
      assumptions: [
        'Individual income before taxes; US people age 15 and over, including people with no income.',
        'Grouped survey data, with interpolation in closed bands and ranges in open tails. No age, city or inflation adjustment.',
      ],
    });
  }
  return null;
}
