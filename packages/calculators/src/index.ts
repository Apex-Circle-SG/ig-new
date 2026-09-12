import {
  incomeDistributionSchema,
  individualIncomeInputSchema,
  individualIncomeResultSchema,
  type CalculatorDefinition,
  type DatasetContext,
  type IndividualIncomeInput,
  type IndividualIncomeResult,
} from '@insightginie/schema';
import * as z from 'zod';

const pct = (count: number, total: number) => Math.max(0, Math.min(100, (count / total) * 100));

/** Pure engine: no network, persistence, clock access, or display rounding. */
export function calculateIndividualIncomePercentile(
  input: IndividualIncomeInput,
  context: DatasetContext,
): IndividualIncomeResult {
  const { annualIncome } = individualIncomeInputSchema.parse(input);
  const calculatedAt = z.iso.datetime().parse(context.calculatedAt);
  const validated = incomeDistributionSchema.safeParse(context.distribution);
  if (
    !validated.success ||
    validated.data.datasetVersion.validationStatus !== 'validated' ||
    validated.data.measure !== 'individual-total-money-income'
  ) {
    return {
      status: 'data-unavailable',
      result: null,
      comparisons: [],
      chartData: [],
      explanation: ['Data unavailable. A validated individual income distribution is required.'],
      sourceReferences: [],
      datasetVersion: null,
      calculatedAt,
    };
  }

  const distribution = validated.data;
  const { total, brackets, datasetVersion } = distribution;
  let cumulative = 0;
  const chartData = brackets.map((bin) => {
    cumulative += bin.count;
    return { ...bin, share: pct(bin.count, total), cumulativeShare: pct(cumulative, total) };
  });
  const bracketIndex = brackets.findIndex(
    (bin) =>
      (bin.lower === null || annualIncome >= bin.lower) &&
      (bin.upper === null || annualIncome < bin.upper),
  );
  const bracket = brackets[bracketIndex];
  const below = brackets.slice(0, bracketIndex).reduce((sum, bin) => sum + bin.count, 0);
  const percentileRange = { lower: pct(below, total), upper: pct(below + bracket.count, total) };
  const isOpenTail = bracket.lower === null || bracket.upper === null;
  const percentile = isOpenTail
    ? null
    : pct(
        below +
          bracket.count * ((annualIncome - bracket.lower!) / (bracket.upper! - bracket.lower!)),
        total,
      );

  return individualIncomeResultSchema.parse({
    status: 'available',
    result: {
      annualIncome,
      percentile,
      percentileRange,
      precision: isOpenTail ? 'range' : 'interpolated',
      bracket,
      population: total,
    },
    comparisons: [{ label: distribution.populationLabel, value: percentile }],
    chartData,
    explanation: [
      `Compared with ${distribution.universe}.`,
      isOpenTail
        ? `This income falls in the open-ended ${bracket.label} group. The published data support a percentile range, not an exact rank.`
        : `The estimate assumes incomes are evenly distributed within the ${bracket.label} group. Actual incomes may cluster at round numbers.`,
      `Income is measured in ${datasetVersion.year} dollars before taxes; this calculation does not adjust current income for inflation.`,
      'The displayed range describes the income group, not a statistical confidence interval. Sampling error and publication rounding add uncertainty.',
      ...distribution.assumptions,
    ],
    sourceReferences: [
      { name: datasetVersion.sourceName, url: datasetVersion.sourceUrl, year: datasetVersion.year },
      ...datasetVersion.artifacts.map((artifact) => ({
        name: artifact.name,
        url: artifact.sourceUrl,
        year: datasetVersion.year,
      })),
    ],
    datasetVersion,
    calculatedAt,
  });
}

export const individualIncomeCalculator: CalculatorDefinition<
  IndividualIncomeInput,
  IndividualIncomeResult
> = {
  id: 'individual-income-percentile',
  name: 'Individual Income Percentile',
  description: 'Compare your annual money income with US people age 15 and over.',
  inputSchema: individualIncomeInputSchema,
  outputSchema: individualIncomeResultSchema,
  calculate: calculateIndividualIncomePercentile,
  methodology: [
    {
      name: 'Census CPS money income definitions',
      url: 'https://www.census.gov/programs-surveys/cps/technical-documentation/subject-definitions.html',
      year: 2024,
    },
  ],
  relatedCalculators: [],
};

export type {
  IndividualIncomeInput,
  IndividualIncomeResult,
  DatasetContext,
} from '@insightginie/schema';
