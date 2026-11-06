# Deterministic calculator engines

`calculateIndividualIncomePercentile(input, context)` accepts annual money income and an injected distribution/timestamp. It returns a validated estimate, source references, accessible chart rows and explanations. A missing or invalid distribution returns `data-unavailable`; invalid user input throws a Zod validation error for the caller to render.

Closed bins use linear interpolation. Open tails return bounds with a null point percentile. No clock, network call, storage, LLM, display rounding or React logic occurs in the engine. See [framework documentation](../../docs/calculator-framework.md).

The `@insightginie/calculators/deals` entry point contains the reviewed acquisition,
debt-capacity, linked LBO/recapitalization, valuation, SaaS and price-volume models.
`calculateDeal(id, inputs)` accepts labelled string inputs and returns metrics,
complete tables, chart data and modelling limitations; it performs no I/O.
`DEAL_TOOLS` supplies the shared route/form catalogue and versioned defaults.
Planning records remain in the opaque browser frame and export only on request.

Run `npx vitest run packages/calculators/src/deals/deals.test.ts` for independent
arithmetic cases, cash/debt roll-forwards, balance identities, insolvency handling,
CSV validation and price-volume boundaries. Historical spreadsheet caches are
empty and are not used as expected results. See
`docs/deal-models-implementation.md` for source coverage and verification.
