import * as z from 'zod';

// Never probe dynamic code generation: the browser CSP intentionally forbids eval.
z.config({ jitless: true });

const publicSourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash;
}, 'Source URLs must be public HTTPS URLs without credentials or query strings');

export const sourceReferenceSchema = z.object({
  name: z.string().min(1),
  url: publicSourceUrl,
  year: z.number().int().min(1900).max(2100),
});

export const datasetVersionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  sourceName: z.string().min(1),
  sourceUrl: publicSourceUrl,
  year: z.number().int().min(1900).max(2100),
  surveyYear: z.number().int().min(1900).max(2100),
  retrievedAt: z.iso.datetime(),
  transformationVersion: z.string().min(1),
  refreshCadence: z.enum(['annual', 'quarterly', 'monthly', 'daily']),
  validationStatus: z.enum(['validated', 'failed', 'pending']),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
  universe: z.string().min(1),
  populationLabel: z.string().min(1),
  artifacts: z
    .array(
      z.object({
        name: z.string().min(1),
        sourceUrl: publicSourceUrl,
        checksum: z.string().regex(/^[a-f0-9]{64}$/),
        bytes: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const incomeBracketSchema = z
  .object({
    lower: z.number().finite().nullable(),
    upper: z.number().finite().nullable(),
    count: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    label: z.string().min(1),
  })
  .refine((bin) => bin.lower === null || bin.upper === null || bin.lower < bin.upper, {
    message: 'Income brackets must have positive width',
  });

export const incomeDistributionSchema = z
  .object({
    id: z.string().min(1),
    geography: z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(['nation', 'state', 'metro', 'county', 'city', 'zip']),
    }),
    universe: z.string().min(1),
    populationLabel: z.string().min(1),
    measure: z.enum(['individual-total-money-income', 'household-total-money-income']),
    currency: z.literal('USD'),
    total: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    sourceReportedTotal: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
    brackets: z.array(incomeBracketSchema).min(2),
    datasetVersion: datasetVersionSchema,
    assumptions: z.array(z.string().min(1)).min(1),
  })
  .superRefine((distribution, context) => {
    const bins = distribution.brackets;
    if (
      distribution.universe !== distribution.datasetVersion.universe ||
      distribution.populationLabel !== distribution.datasetVersion.populationLabel ||
      distribution.id !== distribution.datasetVersion.id
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Dataset identity and population metadata must agree with its version',
        path: ['datasetVersion'],
      });
    }
    if (bins[0].lower !== null || bins[bins.length - 1].upper !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Income distribution must cover both open tails',
        path: ['brackets'],
      });
    }
    bins.forEach((bin, index) => {
      if ((index > 0 && bin.lower === null) || (index < bins.length - 1 && bin.upper === null)) {
        context.addIssue({
          code: 'custom',
          message: 'Only first and last brackets may have open tails',
          path: ['brackets', index],
        });
      }
      if (index > 0 && bins[index - 1].upper !== bin.lower) {
        context.addIssue({
          code: 'custom',
          message: 'Income brackets must be ordered and contiguous',
          path: ['brackets', index],
        });
      }
    });
    if (bins.reduce((sum, bin) => sum + bin.count, 0) !== distribution.total) {
      context.addIssue({
        code: 'custom',
        message: 'Bracket counts must sum to normalized total',
        path: ['total'],
      });
    }
    if (
      Math.abs(distribution.total - distribution.sourceReportedTotal) /
        distribution.sourceReportedTotal >
      0.005
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Rounded counts differ from source total by more than 0.5%',
        path: ['sourceReportedTotal'],
      });
    }
  });

export const individualIncomeInputSchema = z
  .object({
    annualIncome: z.number().finite().min(-1_000_000_000).max(1_000_000_000),
  })
  .strict();

const percentage = z.number().finite().min(0).max(100);
const percentileRangeSchema = z
  .object({ lower: percentage, upper: percentage })
  .refine((range) => range.lower <= range.upper, 'Invalid percentile bounds');
const incomeResultValueSchema = z.object({
  annualIncome: z.number().finite(),
  percentile: percentage.nullable(),
  percentileRange: percentileRangeSchema,
  precision: z.enum(['interpolated', 'range']),
  bracket: incomeBracketSchema,
  population: z.number().int().positive(),
});
const commonOutput = {
  comparisons: z.array(z.object({ label: z.string(), value: percentage.nullable() })),
  chartData: z.array(
    z.object({
      label: z.string(),
      lower: z.number().nullable(),
      upper: z.number().nullable(),
      count: z.number().int().nonnegative(),
      share: percentage,
      cumulativeShare: percentage,
    }),
  ),
  explanation: z.array(z.string()),
  sourceReferences: z.array(sourceReferenceSchema),
  calculatedAt: z.iso.datetime(),
};
export const individualIncomeResultSchema = z.discriminatedUnion('status', [
  z.object({
    ...commonOutput,
    status: z.literal('available'),
    result: incomeResultValueSchema,
    datasetVersion: datasetVersionSchema,
  }),
  z.object({
    ...commonOutput,
    status: z.literal('data-unavailable'),
    result: z.null(),
    datasetVersion: z.null(),
  }),
]);

export type DatasetVersion = z.infer<typeof datasetVersionSchema>;
export type SourceReference = z.infer<typeof sourceReferenceSchema>;
export type IncomeBracket = z.infer<typeof incomeBracketSchema>;
export type IncomeDistribution = z.infer<typeof incomeDistributionSchema>;
export type IndividualIncomeInput = z.infer<typeof individualIncomeInputSchema>;
export type IndividualIncomeResult = z.infer<typeof individualIncomeResultSchema>;

export type DatasetContext = {
  distribution: IncomeDistribution | null | undefined;
  calculatedAt: string;
};

export type CalculatorDefinition<Input, Output> = {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  calculate: (input: Input, context: DatasetContext) => Output | Promise<Output>;
  methodology: SourceReference[];
  relatedCalculators: string[];
};
