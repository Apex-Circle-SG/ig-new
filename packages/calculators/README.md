# Deterministic calculator engines

`calculateIndividualIncomePercentile(input, context)` accepts annual money income and an injected distribution/timestamp. It returns a validated estimate, source references, accessible chart rows and explanations. A missing or invalid distribution returns `data-unavailable`; invalid user input throws a Zod validation error for the caller to render.

Closed bins use linear interpolation. Open tails return bounds with a null point percentile. No clock, network call, storage, LLM, display rounding or React logic occurs in the engine. See [framework documentation](../../docs/calculator-framework.md).
