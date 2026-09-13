# Ask Ginie: sourced explanations and general questions

Ginie at `/ask/` combines local approved-content retrieval, deterministic
calculations and the configured Datadog Agent Builder workflow. The latest owner
instruction explicitly requested this connection. This adapter is separate from
the disabled private operational-triage adapter. It is a server-side Workflow
Automation integration, not a claimed public Bits website-chat API.

## Answer path

1. Validate the question, same-origin request, signed security token and rate limit.
2. Check actual identifiers/private-disclosure requests and unsupported live financial data.
   Questions are not rejected just for mentioning APIs, taxes, investing or other topics.
3. Run supported explicit income/drawdown calculations locally, without Datadog.
4. Retrieve at most two approved public documents. Convert the question locally
   into one of four categories: overview, formula, assumptions or example.
5. Send only that category and bounded public excerpts to the configured workflow.
   No raw question, financial values, conversation, IP, cookie or request headers
   enter the provider packet.
6. Accept only a strict JSON selection of 1–4 distinct, supplied excerpt IDs.
   Reconstruct the displayed text and citations from the original public source.
   Ignore all model prose; reject unknown IDs, extra keys or invalid output.
7. When no source matches, optionally send a minimized question to the owner-authorized
   general-answer provider described below.
8. Label each response as source selection, deterministic calculation, general
   AI answer or local fallback. A failure never masquerades as a model answer.

The sourced path selects original passages; it does not replace calculated
values with model output. Approved tool explanations, source dates and primary
references are visible. Unreviewed WordPress previews and editorial briefs are
excluded. Source matches do not imply that a passage resolves personal circumstances.

## General answers and activation

`generateGeneralAnswer` accepts one current question and returns a strict JSON
`{message}` with at most 6,000 characters. It shares the existing lock, durable
run ledger, cooldown, timeout, cancellation and credential boundaries. It does
not create a second allowance. General questions, hashes and generated answers
never enter the persistent source cache or application logs. Each request is
independent; conversation history is not sent. Responses render as escaped text,
with no model-generated citation or claim of source verification.

The request still allows any topic; questions need not be financial. Actual
credentials and recognizable identifiers are rejected before provider routing.
Explicit currency amounts are omitted, and detected personal-finance questions
have numeric values omitted. These heuristics are data minimization, not
anonymization. The interface explains the omission and warns visitors not to
submit confidential details. No live data feed or web browsing is available.

General mode defaults off and requires explicit authorization for the exact
configured agent. The owner has now authorized public questions using the existing
agent despite unverified remote tool settings. This supersedes the earlier
requirement to wait for a tool-free confirmation. Protected server values are:

```dotenv
ASK_DATADOG_ENABLED=true
ASK_DATADOG_GENERAL_ENABLED=true
ASK_DATADOG_PUBLIC_AGENT_ID=<the owner-authorized DD_AGENT_ID>
```

This records authorization, not a claim that tools are disabled. The alternative
`ASK_DATADOG_TOOL_FREE_AGENT_ID` remains available for an actual operator review
that disables Datadog MCP, other MCPs and Action Catalog actions. Both values must
match the current agent; changing agents requires updating the authorization.
Do not set a tool-free attestation based on the owner's acceptance of exposure.

The workflow API does not verify the agent's tool settings. The fixed prompt asks
for no tool use; this is not technical tool isolation. Known credential filtering
and strict output validation reduce exposure but cannot guarantee the absence of
private data from an agent with account access. A dedicated agent with all tools
disabled remains the recommended deployment configuration. Keep Conversation ID
unset. See [Agent Builder](https://docs.datadoghq.com/actions/agents/).

The independent `ASK_DATADOG_GENERAL_ENABLED=false` kill switch leaves sourced
explanations and local calculators available. Disabled configuration now receives
an explicit disabled message instead of a misleading temporary-outage response.

The public form discloses Datadog processing before general submissions.
Datadog may retain these prompts and answers. Only source-backed responses show
source citations; general AI answers explicitly state that facts are not verified.

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
timeouts, rejected output and remote errors use local sources when available,
or an explicit unavailable response when there is no matching source.
`ASK_DATADOG_ENABLED=false` disables inference while leaving Ask available;
`ASK_ENABLED=false` disables Ask. The private triage adapter's `DD_BITS_ENABLED`
flag does not control this public-source selector.

## Privacy and monitoring

Questions exist transiently in application memory; the browser retains at most
six exchanges until reload. The application does not log or persist raw questions,
answers or numeric examples. Datadog can retain both public selection tasks and,
when enabled, general prompts and answers under its account policy. No provider
zero-retention claim is made. The account's internal
agent tools, model, service identity and exact retention are not independently
verified by the workflow API. The fixed task instructs no tool use. Strict local validation restricts source
selection to public IDs; general-answer validation does not prove the absence of
private operational data from an agent that has connected tools.

Requests are 3–1,200 characters, at most 8 KiB JSON, with a five-second body read,
ten-minute signed-cookie binding and bounded HMAC address buckets. The handler
allows at most 30 active requests. Advertisements and browser recording are
excluded from Ask. Direct private-disclosure requests and recognized identifiers
receive local privacy responses. Broad topic-based refusals were removed.
Matching rules cannot identify every private value. The owner has authorized the
configured agent without tool-isolation verification; a prompt instruction alone
is not that isolation. Basic safety and credential protections remain active.

Essential monitoring stores only fixed daily counters, including Datadog live,
cache and fallback totals, for 30 days locally. Feedback includes an issue
category only. Optional browser analytics separately requires consent and honors
DNT/GPC. Generated answers use `ask_answer_generated`; `ask_answer_cited` requires
actual citations. No prompt or financial value is an analytics dimension.

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
