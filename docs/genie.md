# Genie — deferred until deterministic foundation is verified

No LLM service, chat UI or prompt-to-number path is enabled in this slice. The first tool will wrap `individualIncomeCalculator`; its Zod input/output schemas, source references, dataset version, calculation timestamp and assumptions define the integration contract.

Future orchestration: deterministic intent routing first, provider-neutral LLM interface for complex questions, validated tool calls only, bounded execution, server rate limiting, citations and no raw profile values in logs. A response involving numbers must render actual tool outputs. Unknown scope or missing data yields unavailable, not an estimate invented by a model.

Account read/write tools require authenticated ownership. Save operations preserve result snapshots with versions, never silently recalculate history. General educational context can explain tax/financial/legal concepts, but no individualized security trading recommendation. Implement after the first five calculators are stable.
