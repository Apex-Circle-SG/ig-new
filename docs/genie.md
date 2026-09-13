# Ask: approved sources and deterministic calculations

The implemented `/ask/` experience retrieves approved public explanations and
supports two narrow, explicit numeric question forms. It does not call an
external language model, Datadog Bits or a general-purpose inference API. No LLM
key is required. This document describes code behavior, not a deployment receipt.

## Answer path

`getAskKnowledge()` combines reviewed finance-tool descriptions/methodology,
the validated Census income comparison, privacy text and explicitly approved
public documents. The retriever validates every record's approval flag, local
path, source references and dates before scoring terms. Imported WordPress
previews and editorial briefs do not become grounding material automatically.
The interface shows source links, freshness and assumptions with each answer.

Refusal checks run before calculation. Requests for secrets or commands,
recognized personal identifiers, securities recommendations, lending eligibility
or individualized tax/legal advice receive bounded educational refusals. A
request requiring unvalidated live prices/rates or insufficient approved content
receives a fallback, never an invented number. These controls are deliberately
limited matching rules, not a claim of complete natural-language understanding.

Only a request with an approved-content match may enter
`calculateStatedQuestion()`. Supported examples are:

- `What gain recovers a 50% loss?` uses the shared drawdown engine. One loss
  percentage is required; extra cash flows, fees, taxes, multiple losses and
  recovery-time questions are excluded. A 100% loss has no finite percentage
  recovery from the remaining zero balance.
- `What percentile is income $100,000?` uses the shared individual-income
  engine and the validated Census snapshot. One explicit dollar amount is
  required (`$100k` is also supported). The stated assumption is annual US
  individual income before tax. Household, local, age-specific, foreign-currency,
  nonannual, take-home and ambiguous multi-number questions are excluded.

Unsupported syntax falls back to source explanations and interactive tool links.
It does not infer missing personal circumstances. Income responses identify the
dataset year, comparison population and grouped-data limitations. Drawdown
responses identify the formula and assumptions. Other tools remain available
through their dedicated browser interfaces.

## Privacy and abuse controls

Submitting a question intentionally sends it to the InsightGinie server for
transient processing. The application does not persist or log raw questions,
answers or numeric inputs. The browser keeps at most six exchanges in component
memory, cleared on reload. No conversation history is sent to an inference
provider or stored as an account profile.

An essential `ig_ask_security` cookie expires after ten minutes and binds signed
requests to the browser that obtained the token. Writes check same-origin
headers and a valid token. Questions are limited to 3–1,200 characters, JSON
bodies to 8 KiB and body reads to five seconds. Bounded in-memory request limits
use a process-key HMAC of the edge-provided address; no raw address is persisted.
The Ask handler allows at most 30 active requests. `ASK_ENABLED=false` disables
the endpoint gracefully. Ad scripts and browser recording are excluded from Ask.

Feedback sends only `source-issue`, `unclear-answer` or `unsafe-answer`, without
the conversation. Essential service-health totals count answer, refusal,
fallback, error and feedback categories in daily files for up to 30 UTC calendar
days when `OPERATIONS_DIRECTORY` is configured. Optional browser analytics are
separate, require `ig_analytics=allow`, honor DNT/GPC and record enums only.
See [analytics](analytics.md) and [privacy](privacy.md).

## Private operations and future scope

The server-only Bits adapter is a separate operational tool accepting only a
synthetic health marker or validated aggregate counters. It is not imported by
Ask, has no public invocation endpoint, and defaults to disabled/zero budget.
Review flags, a spending policy, agent-tool review and suitable account identity
remain prerequisites. [Observability](observability.md) documents its bounded
execution, strict output parser and remaining account requirements.

Generative orchestration, user accounts, saved scenarios and monthly reports
remain future features. They require their own ownership, export/deletion,
privacy and provider gates. A successful private Bits health check does not
authorize routing visitor questions through that account.

Relevant tests are `tests/unit/ask.test.ts`, `ask-review.test.ts`,
`tests/e2e/ask-admin.spec.ts` and the shared calculator tests. They cover source
grounding, refusals, unsupported syntax, deterministic results and request
boundaries. Actual release verification belongs in the deployment evidence.
