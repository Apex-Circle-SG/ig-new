import type { IndividualIncomeResult } from '@insightginie/schema';

/** Public band bounds only; never interpolate or include the entered amount. */
export function incomeBandInsight(output: IndividualIncomeResult) {
  if (!output.result) return '';
  const { bracket, percentileRange } = output.result;
  const lower = Math.round(percentileRange.lower * 100) / 100;
  const upper = Math.round(percentileRange.upper * 100) / 100;
  return `I checked where I stand: my individual income is in the ${bracket.label} band, with a published percentile range of about ${lower}–${upper}% among US people age 15 and over. The published table cannot pinpoint a rank inside this band. See where you stand — InsightGinie, source: US Census Bureau (2024 income). https://insightginie.com/calc/individual-income-percentile/`;
}
