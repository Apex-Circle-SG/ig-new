# Ask Ginie: Datadog-backed source selection

Ginie at `/ask/` combines local approved-content retrieval, deterministic
calculations and the configured Datadog Agent Builder workflow. The latest owner
instruction explicitly requested this connection. This adapter is separate from
the disabled private operational-triage adapter. It is a server-side Workflow
Automation integration, not a claimed public Bits website-chat API.

## Answer path

1. Validate the question, same-origin request, signed security token and rate limit.
2. Apply local refusal and unsupported-live-data checks.
3. Run supported explicit income/drawdown calculations locally, without Datadog.
4. Retrieve at most two approved public documents. Convert the question locally
   into one of four categories: overview, formula, assumptions or example.
5. Send only that category and bounded public excerpts to the configured workflow.
   No raw question, financial values, conversation, IP, cookie or request headers
   enter the provider packet.
6. Accept only a strict JSON selection of 1–4 distinct, supplied excerpt IDs.
   Reconstruct the displayed text and citations from the original public source.
   Ignore all model prose; reject unknown IDs, extra keys or invalid output.
7. Label the response as a live Datadog selection, cached Datadog selection,
   local deterministic calculation or local fallback. A failure never masquerades
   as a successful model answer.

The model selects source passages. It does not write unrestricted financial
advice or calculate numbers. Approved tool explanations, source dates and primary
references are visible. Unreviewed WordPress previews and editorial briefs are
excluded. Source matches do not imply that a passage resolves personal circumstances.

## Deterministic questions

`What gain recovers a 50% loss?` uses the shared drawdown engine. One explicit
loss percentage is required; ambiguous cash flows, fees, taxes, multiple losses
and recovery-time questions use source explanations instead. A 100% loss has
no finite percentage recovery from the remaining zero balance.

`What percentile is income $100,000?` uses the validated Census distribution.
One explicit dollar amount is required, with an annual US individual pre-tax
income assumption. Household, local, age-specific, foreign-currency, nonannual,
take-home and ambiguous multiple-number questions use the interactive tools.

## Provider, limits and failures

Configure `ASK_DATADOG_ENABLED=true`, `DD_REGION`, `DD_API_KEY`, `DD_APP_KEY`,
`DD_AGENT_ID`, `DD_BITS_WORKFLOW_ID` and a private absolute
`ASK_DATADOG_STATE_DIRECTORY`. There is no additional OpenAI/Anthropic key.
These names must never use a `NEXT_PUBLIC_` prefix. Deployment copies only this
explicit server allowlist into a mode-0600 runtime file; Git credentials stay out.

Each uncached call verifies the published one-agent workflow and input/output
binding, reserves a run durably, then creates exactly one instance. It polls a
bounded number of times and attempts to cancel a known unfinished instance before
the deadline. An ambiguous create is neither retried nor refunded. A timeout
cannot prove provider-side work stopped, especially if no instance ID returned.

Defaults are **20 executions per UTC day, 120 per UTC month, one execution at a
time and at least 60 seconds between cache misses**. These are run limits, not a
dollar cap or verified remaining AI Credits. Review the provider's AI Credit
Limits for the workflow creator/Autonomous Agents attribution; see the
[read-only account review](datadog-ask-recommendations.md).

A private, atomic state file retains current budget counters and up to 64 cached
public excerpt selections for 14 days. Its SHA-256 cache key includes the public
packet and configured workflow/agent. Changes to text change the key. No visitor
question or identity is a cache key. Corrupt state and an unreleased lock fail
closed. Do not delete a budget file to restore availability: that would reset
its protection. Review a stale lock only after confirming no provider call is
active. State files need durable shared storage before adding web replicas.

Missing credentials, disabled provider, insufficient budget, concurrency,
timeouts, rejected output and remote errors all return cited local sources.
`ASK_DATADOG_ENABLED=false` disables inference while leaving Ask available;
`ASK_ENABLED=false` disables Ask. The private triage adapter's `DD_BITS_ENABLED`
flag does not control this public-source selector.

## Privacy and monitoring

Questions exist transiently in application memory; the browser retains at most
six exchanges until reload. The application does not log or persist raw questions,
answers or numeric examples. Datadog can retain the **public** task and selection
under its account policy; no zero-retention claim is made. The account's internal
agent tools, model, service identity and exact retention are not independently
verified by the workflow API. The fixed task instructs no tool use; strict local
output validation prevents operational data from becoming a public answer.

Requests are 3–1,200 characters, at most 8 KiB JSON, with a five-second body read,
ten-minute signed-cookie binding and bounded HMAC address buckets. The handler
allows at most 30 active requests. Advertisements and browser recording are
excluded from Ask. Recognized credential/instruction attacks, identifiers,
trading recommendations, credit eligibility and individualized legal/tax advice
receive local refusals. Matching rules are not complete language understanding;
the absence of arbitrary visitor text in the provider packet is the primary
prompt-injection boundary.

Essential monitoring stores only fixed daily counters, including Datadog live,
cache and fallback totals, for 30 days locally. Feedback includes an issue
category only. Optional browser analytics separately requires consent and honors
DNT/GPC. No prompt or financial value is an analytics dimension.

## Verification and operations

Tests cover approved-only grounding, exact text reconstruction, provider failures,
strict output validation, limits, restart-safe budget state, cache invalidation,
timeouts/cancellation, direct calculator results, browser privacy, labels and
accessibility. Real execution and deployment evidence is stored under
`docs/verification/`; unit mocks alone do not establish endpoint success.

A provider kill switch requires editing the protected runtime flag and restarting
`insightginie-web`. Also update the source deployment configuration so a later
release does not re-enable it. Normal rollback restores the previous build and
runtime environment; retain the provider budget state across rollback/redeployment.
