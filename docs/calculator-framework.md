# Calculator framework

`@insightginie/schema` owns Zod contracts. `@insightginie/datasets` supplies validated public observations. `@insightginie/calculators` contains pure mathematical engines. UI components accept results and never implement income mathematics themselves.

```ts
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { calculateIndividualIncomePercentile } from '@insightginie/calculators';

const output = calculateIndividualIncomePercentile(
  { annualIncome: 75_000 },
  {
    distribution: getIndividualIncomeDistribution(),
    calculatedAt: '2026-09-12T00:00:00.000Z', // supplied by caller
  },
);
```

The definition registry exposes ID, name, description, input and output schemas, `calculate`, methodology references and related calculators. The generic type permits synchronous engines and future asynchronous adapters. The first engine is synchronous and deterministic. Reusing identical inputs and context produces identical output. It reads no clock and writes no storage.

## Inputs and failures

`annualIncome` is a finite US-dollar number between −$1 billion and +$1 billion. Negative values permit documented income losses; zero remains meaningful. Empty strings and numeric strings are not coerced. Invalid inputs raise Zod errors that the UI turns into accessible form messages. The caller supplies an ISO UTC `calculatedAt`; invalid timestamps fail validation.

Missing, corrupt, pending, or wrong-measure distributions return `status: 'data-unavailable'` with `result: null`, an explanation, and no made-up values. A valid individual distribution returns `status: 'available'`. Optional integrations do not affect anonymous calculations.

## Mathematical contract

Brackets are contiguous, nonoverlapping, sorted and lower-inclusive/upper-exclusive. Only the first lower bound and last upper bound can be null. Let `B` be the sum of counts in all preceding brackets, `n` the current count, `N` the sum of all bracket counts, and `L`/`U` the current bounds.

For a closed bracket:

`percentile = 100 × (B + n × (income − L) / (U − L)) / N`

For either open tail, `percentile = null`. The available bin bounds are `[100 × B/N, 100 × (B+n)/N]`. Never invent an upper income limit or extrapolate a Pareto tail. An exact bracket boundary belongs to the bracket beginning at that value. Repeated incomes produce identical interpolated results; grouped source data cannot determine the exact treatment of people tied at that income.

Closed-bin outputs also expose the bin's percentile range. It describes where that entire income group lies. It is not a statistical confidence interval. Sampling uncertainty is not estimated from these published counts. The engine retains floating-point precision; presentation should use approximate whole-percent language and expose the method. Percentiles and all chart shares use a consistent 0–100 scale.

## Output shape

- `result`: income, optional point percentile, bounds, `precision` (`interpolated` or `range`), current bracket and normalized population count.
- `comparisons`: supported population label and optional point value. No unsupported local or age comparisons.
- `chartData`: every bracket's label, bounds, count, population percentage and cumulative percentage. The UI supplies a text/table equivalent.
- `explanation`: universe, uniform-bin assumption or open-tail warning, money year, uncertainty and source-specific limitations.
- `sourceReferences`: publisher page and exact original workbooks.
- `datasetVersion`: income year, survey year, retrieval time, source URLs, transformation version, SHA-256 checksums and validation status.
- `calculatedAt`: caller-supplied timestamp, suitable for immutable scenario snapshots later.

No private financial values belong in URLs, analytics or advertising payloads. The first UI computes entirely in browser memory; accounts and scenario persistence require their own security and privacy gates.

## Verification

Vitest verifies closed-bin known examples, boundaries, zero and negative income, extreme accepted values, empty bins, ties, rejected types, timestamps, missing/corrupt data and immutability. Fast-check verifies monotonic estimates and containment within bin bounds across arbitrary accepted closed-bin incomes. Source tests reproduce the actual snapshot from original downloaded bytes and check known original table cells. Ingest tests cover malformed responses, sex/year/units/threshold changes, impossible population scaling, unchanged versions, and last-good preservation on failures. These tests run without network credentials.

The household, relocation and tax engines remain separate subsequent milestones. A new engine must supply its own universe, matched units and datasets, validation, mathematical examples and failure behavior before being added to the public registry.
